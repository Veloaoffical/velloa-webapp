import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// Define interfaces for our data structures
interface Category {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
}

interface ChargeLine {
  line_id: string;
  category_id: string;
  description: string;
  amount: number;
  category?: Category;
}

// Add this interface near the top with other interfaces
interface PropertyBalance {
  property_id: string;
  property_name: string;
  balance: number;
}

interface AccountUpdateData {
  account_balance: string;
  property_balance?: PropertyBalance[];
}

// Define a type for database charge records
interface DbCharge {
  id: string;
  company_id: string;
  lease_id: string;
  property_id: string;
  unit_id: string;
  people_id: string;
  charge_amount: {
    lines: ChargeLine[];
    total_amount: number;
    accounts_receivable_id?: string;
  };
  amount_remaining: {
    lines: ChargeLine[];
    total_amount: number;
    accounts_receivable_id?: string;
  };
  due_date: string;
  memo: string | null;
  reference: string;
  status: string;
  created_at: string;
  created_by: string;
  share_with_tenants: boolean;
  charge_type: string;
  lease_contracts?: {
    tenant_name: string;
    unit_name: string;
    property_name: string;
  }[];
}

// Define the schema for charge line items
const ChargeLineSchema = z.object({
  category_id: z.string().uuid(),
  description: z.string().optional(),
  amount: z.number().positive(),
  line_id: z.string().optional()
});

// Define the schema for the charge creation request
const ChargeCreateSchema = z.object({
  lease_id: z.string().uuid(),
  tenant_id: z.string(),
  bank_account_id: z.string().uuid(),
  payment_method: z.string(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(ChargeLineSchema).min(1),
  memo: z.any().nullable().optional(),
  reference: z.string().optional(),
  share_with_tenants: z.boolean().optional(),
  total_amount: z.number().positive(),
  charge_type: z.string().default('refund')
});

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;

    // Parse the request body
    const body = await request.json();
    
    // Validate the request body against the schema
    const validationResult = ChargeCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() }, 
        { status: 400 }
      );
    }

    const chargeData = validationResult.data;

    // Add line_id to each charge line if not already present
    chargeData.lines = chargeData.lines.map(line => ({
      ...line,
      line_id: line.line_id || nanoid()
    }));

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Verify that the lease exists and belongs to the company
    const { data: leaseData, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('id, property_id, unit_id')
      .eq('id', chargeData.lease_id)
      .eq('company_id', company_id)
      .single();

    if (leaseError || !leaseData) {
      console.error('Error verifying lease:', leaseError);
      return NextResponse.json(
        { error: 'Lease not found or does not belong to your company' }, 
        { status: 404 }
      );
    }

    // Get company default accounts settings to find the accounts receivable account
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('default_account')
      .eq('companyid', company_id)
      .single();

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch company settings' }, 
        { status: 500 }
      );
    }

    // Get the accounts receivable account ID from company settings
    const accountsReceivableId = settings?.default_account?.accountreceivable;
    
    if (!accountsReceivableId) {
      console.error('Accounts receivable account not configured in company settings');
      return NextResponse.json(
        { error: 'Accounts receivable account not configured in company settings' }, 
        { status: 400 }
      );
    }

    // Process memo - if it's a string, parse it to JSON object
    let processedMemo;
    if (chargeData.memo === null) {
      // Use default empty editor state
      processedMemo = {
        "root": {
          "type": "root",
          "format": "",
          "indent": 0,
          "version": 1,
          "children": [
            {
              "type": "paragraph",
              "format": "",
              "indent": 0,
              "version": 1,
              "children": [],
              "direction": null,
              "textStyle": "",
              "textFormat": 0
            }
          ],
          "direction": null
        }
      };
    } else if (typeof chargeData.memo === 'string') {
      // Parse the string into a JSON object
      try {
        processedMemo = JSON.parse(chargeData.memo);
      } catch (e) {
        console.error('Error parsing memo string:', e);
        // Fallback to default if parsing fails
        processedMemo = {
          "root": {
            "type": "root",
            "format": "",
            "indent": 0,
            "version": 1,
            "children": [
              {
                "type": "paragraph",
                "format": "",
                "indent": 0,
                "version": 1,
                "children": [],
                "direction": null,
                "textStyle": "",
                "textFormat": 0
              }
            ],
            "direction": null
          }
        };
      }
    } else {
      // It's already an object
      processedMemo = chargeData.memo;
    }
    
    // Create a new charge
    const chargeId = uuidv4();
    
    // Create a new transaction with credit entries
    const transactionId = uuidv4();
    
    // Prepare transaction lines with credit entries
    const transactionLines = [];
    
    // Add debit entry for the bank account (money going out)
    transactionLines.push({
      category: chargeData.bank_account_id, // Use the selected bank account
      description: "Refund Payment",
      debit_amount: chargeData.total_amount, // DEBIT the bank account
      credit_amount: 0,
      reference: nanoid()
    });
    
    // Add credit entries for each charge line
    chargeData.lines.forEach(line => {
      transactionLines.push({
        category: line.category_id,
        description: line.description || "Credit issued",
        debit_amount: 0,
        credit_amount: line.amount, // CREDIT the income/expense accounts
        reference: nanoid()
      });
    });
    
    // Create the transaction record
    const { error: transactionError } = await supabase
      .from('transaction')
      .insert({
        id: transactionId,
        created_at: new Date().toISOString(),
        transaction_type: 'refund',
        property: leaseData.property_id,
        due_date: chargeData.due_date,
        data: {
          lines: transactionLines,
          total_amount: chargeData.total_amount,
          lease_id: chargeData.lease_id,
          unit_id: leaseData.unit_id,
          status: 'paid'
        },
        company: company_id,
        memo: processedMemo,
        reference: chargeData.reference || nanoid(),
        share_files: chargeData.share_with_tenants || false,
        status: 'unpaid',
        created_by: user.id,
        payee: chargeData.tenant_id,
        payment_method: chargeData.payment_method
      });
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction: ' + transactionError.message }, 
        { status: 500 }
      );
    }
    
    // Update account balances for each transaction line
    for (const line of transactionLines) {
      const { category, debit_amount, credit_amount } = line;
      
      // For bank accounts (debit entries), we subtract from the balance
      // For categories (credit entries), we also subtract from the balance since it's a refund
      const amount = -(debit_amount + credit_amount); // Negative for both debits and credits in a refund
      
      // First try to find and update sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance, property_balance, account_type, parent_account')
        .eq('id', category)
        .single();

      if (!subAccountError && subAccount) {
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0;
        const newBalance = currentBalance + amount;

        // Only update property balance for bank account (which has debit_amount)
        const updateData: AccountUpdateData = { account_balance: newBalance.toString() };
        
        if (debit_amount > 0) {
          // Update property balance array only for bank account
          const propertyBalance = Array.isArray(subAccount.property_balance) 
            ? subAccount.property_balance 
            : [];
          
          const propertyIndex = propertyBalance.findIndex(pb => pb.property_id === leaseData.property_id);
          
          if (propertyIndex >= 0) {
            propertyBalance[propertyIndex] = {
              ...propertyBalance[propertyIndex],
              balance: (parseFloat(propertyBalance[propertyIndex].balance) || 0) + amount
            };
          } else {
            const { data: property } = await supabase
              .from('properties')
              .select('name')
              .eq('id', leaseData.property_id)
              .single();

            propertyBalance.push({
              property_id: leaseData.property_id,
              property_name: property?.name || '',
              balance: amount
            });
          }
          
          updateData.property_balance = propertyBalance;
        }

        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update(updateData)
          .eq('id', category);

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError);
        }

        // Update parent account if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, property_balance')
            .eq('id', subAccount.parent_account)
            .single();

          if (!parentError && parentAccount) {
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0;
            const parentNewBalance = parentCurrentBalance + amount;

            // Only update property balance for bank account
            const parentUpdateData: AccountUpdateData = { account_balance: parentNewBalance.toString() };
            
            if (debit_amount > 0) {
              const parentPropertyBalance = Array.isArray(parentAccount.property_balance) 
                ? parentAccount.property_balance 
                : [];
              
              const parentPropertyIndex = parentPropertyBalance.findIndex(pb => pb.property_id === leaseData.property_id);
              
              if (parentPropertyIndex >= 0) {
                parentPropertyBalance[parentPropertyIndex] = {
                  ...parentPropertyBalance[parentPropertyIndex],
                  balance: (parseFloat(parentPropertyBalance[parentPropertyIndex].balance) || 0) + amount
                };
              } else {
                const { data: property } = await supabase
                  .from('properties')
                  .select('name')
                  .eq('id', leaseData.property_id)
                  .single();

                parentPropertyBalance.push({
                  property_id: leaseData.property_id,
                  property_name: property?.name || '',
                  balance: amount
                });
              }
              
              parentUpdateData.property_balance = parentPropertyBalance;
            }

            const { error: parentUpdateError } = await supabase
              .from('chart_of_accounts')
              .update(parentUpdateData)
              .eq('id', subAccount.parent_account);

            if (parentUpdateError) {
              console.error('Error updating parent account balance:', parentUpdateError);
            }
          }
        }

        continue;
      }

      // If not found in sub-accounts, update main account
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, property_balance')
        .eq('id', category)
        .single();

      if (!mainAccountError && mainAccount) {
        const currentBalance = parseFloat(mainAccount.account_balance) || 0;
        const newBalance = currentBalance + amount;

        // Only update property balance for bank account
        const updateData: AccountUpdateData = { account_balance: newBalance.toString() };
        
        if (debit_amount > 0) {
          const propertyBalance = Array.isArray(mainAccount.property_balance) 
            ? mainAccount.property_balance 
            : [];
          
          const propertyIndex = propertyBalance.findIndex(pb => pb.property_id === leaseData.property_id);
          
          if (propertyIndex >= 0) {
            propertyBalance[propertyIndex] = {
              ...propertyBalance[propertyIndex],
              balance: (parseFloat(propertyBalance[propertyIndex].balance) || 0) + amount
            };
          } else {
            const { data: property } = await supabase
              .from('properties')
              .select('name')
              .eq('id', leaseData.property_id)
              .single();

            propertyBalance.push({
              property_id: leaseData.property_id,
              property_name: property?.name || '',
              balance: amount
            });
          }
          
          updateData.property_balance = propertyBalance;
        }

        const { error: updateError } = await supabase
          .from('chart_of_accounts')
          .update(updateData)
          .eq('id', category);

        if (updateError) {
          console.error('Error updating account balance:', updateError);
        }
      }
    }
    
    // Create the charge record linked to the transaction
    const { data: charge, error: chargeError } = await supabase
      .from('charges')
      .insert({
        id: chargeId,
        company_id,
        lease_id: chargeData.lease_id,
        property_id: leaseData.property_id,
        payee: null,
        unit_id: leaseData.unit_id,
        people_id: chargeData.tenant_id,
        transaction_id: transactionId,
        charge_amount: {
          lines: chargeData.lines,
          total_amount: chargeData.total_amount,
          bank_account_id: chargeData.bank_account_id,
          payment_method: chargeData.payment_method
        },
        amount_remaining: {
          lines: chargeData.lines,
          total_amount: chargeData.total_amount,
          bank_account_id: chargeData.bank_account_id,
          payment_method: chargeData.payment_method
        },
        due_date: chargeData.due_date,
        memo: processedMemo,
        reference: chargeData.reference || nanoid().substring(0, 8).toUpperCase(),
        status: 'unpaid',
        created_by: user.id,
        share_with_tenants: chargeData.share_with_tenants || false,
        charge_type: 'credit'
      })
      .select()
      .single();

    if (chargeError) {
      console.error('Error creating charge:', chargeError);
      return NextResponse.json(
        { error: 'Failed to create charge: ' + chargeError.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ id: charge.id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in charges API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Failed to get company data:', companyError);
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lease_id = searchParams.get('lease_id');
    const property_id = searchParams.get('property_id');
    const unit_id = searchParams.get('unit_id');
    const tenant_id = searchParams.get('tenant_id');
    const status = searchParams.get('status');
    const category_id = searchParams.get('category_id');

    console.log('Fetching charges with params:', { 
      lease_id, property_id, unit_id, tenant_id, status, category_id, company_id 
    });

    try {
      // Build the query without the problematic lease_contracts join
      let query = supabase
        .from('charges')
        .select(`
          id,
          company_id,
          lease_id,
          property_id,
          unit_id,
          people_id,
          charge_amount,
          amount_remaining,
          due_date,
          memo,
          reference,
          status,
          created_at,
          created_by,
          share_with_tenants,
          charge_type
        `)
        .eq('company_id', company_id);

      // Apply filters if provided
      if (lease_id) query = query.eq('lease_id', lease_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (unit_id) query = query.eq('unit_id', unit_id);
      if (tenant_id) query = query.eq('people_id', tenant_id);
      if (status) query = query.eq('status', status);
      
      // Order by due date if available
      query = query.order('due_date', { ascending: false });

      // Execute the query
      const { data: charges, error: chargesError } = await query;

      if (chargesError) {
        console.error('Error fetching charges:', chargesError);
        return NextResponse.json(
          { error: 'Failed to fetch charges: ' + chargesError.message }, 
          { status: 500 }
        );
      }

      console.log('Charges fetched successfully:', charges ? charges.length : 0);
      
      // If we need to fetch category information separately
      if (charges && charges.length > 0) {
        // Get unique category IDs from all charge lines
        const categoryIds = [...new Set(
          charges.flatMap(charge => 
            charge.charge_amount && charge.charge_amount.lines 
              ? charge.charge_amount.lines.map((line: { category_id: string }) => line.category_id) 
              : []
          )
        )];
        
        if (categoryIds.length > 0) {
          const { data: categories, error: categoriesError } = await supabase
            .from('chart_of_accounts')
            .select('id, account_name, account_type, account_subtype')
            .in('id', categoryIds);
          
          if (!categoriesError && categories) {
            // Create a map for quick lookup with proper typing
            const categoryMap: Record<string, Category> = categories.reduce((acc: Record<string, Category>, cat: Category) => {
              acc[cat.id] = cat;
              return acc;
            }, {});
            
            // Attach category information to each charge line
            charges.forEach((charge: DbCharge) => {
              if (charge.charge_amount && charge.charge_amount.lines) {
                charge.charge_amount.lines.forEach((line: ChargeLine) => {
                  if (line.category_id && categoryMap[line.category_id]) {
                    line.category = categoryMap[line.category_id];
                  }
                });
              }
            });
          }
        }
      }

      // Filter by category_id if provided (post-query filter)
      let filteredCharges = charges;
      if (category_id && charges) {
        filteredCharges = charges.filter((charge: DbCharge) => 
          charge.charge_amount && 
          charge.charge_amount.lines && 
          charge.charge_amount.lines.some((line: ChargeLine) => line.category_id === category_id)
        );
      }

      // Return the charges even if empty
      return NextResponse.json(filteredCharges || []);
    } catch (queryError) {
      console.error('Error in database query:', queryError);
      return NextResponse.json(
        { error: 'Database query error: ' + (queryError instanceof Error ? queryError.message : String(queryError)) }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in charges API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 