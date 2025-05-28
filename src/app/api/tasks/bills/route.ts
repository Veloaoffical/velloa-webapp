import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// Define interface for charge data
interface ChargeData {
  company_id: string;
  people_id: string;
  bill_date: string;
  due_date: string;
  payee: string | null;
  property_id: string | null;
  charge_amount: {
    lines: {
      line_id: string;
      amount: number;
      category: string;
      reference: number;
      description?: string;
      property_id: string | null;
      unit_id: string | null;
    }[];
    total_amount: number;
    accounts_payable_id?: string;
  };
  amount_remaining: {
    lines: {
      line_id: string;
      amount: number;
      category: string;
      reference: number;
      description?: string;
      property_id: string | null;
      unit_id: string | null;
    }[];
    total_amount: number;
    accounts_payable_id?: string;
  };
  memo?: unknown;
  reference?: string;
  status: string;
  created_by: string;
  start_date?: string;
  frequency?: string;
  repeat_infinite?: boolean;
  unit_id: string | null;
  charge_type: string;
}

// Define the schema for bill line items
const BillLineSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive(),
  category_id: z.string().uuid(),
  property_id: z.string().uuid().nullable(),
  unit_id: z.string().uuid().nullable(),
  line_id: z.string().optional()
});

// Define the schema for the bill creation request
const BillCreateSchema = z.object({
  people_id: z.string().uuid(),
  bill_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  due_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  lines: z.array(BillLineSchema).min(1),
  memo: z.any().nullable().optional(),
  reference: z.string().optional(),
  status: z.string(),
  start_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).optional(),
  frequency: z.string().optional(),
  repeat_infinite: z.boolean().optional(),
  end_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).optional(),
  charge_type: z.string().default('bill'),
  maintenance_request_id: z.string().uuid().optional(),
  files: z.array(z.object({
    file_url: z.string(),
    file_name: z.string(),
    file_type: z.string(),
    file_size: z.number().optional()
  })).optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;
    
    // Get the user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    const company_id = companyMember.company_id;

    // Parse the request body
    const body = await request.json();
    
    // Validate the request body against the schema
    const validationResult = BillCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const billData = validationResult.data;

    // Verify that the vendor exists and belongs to the company
    const { data: vendorData, error: vendorError } = await supabase
      .from('people')
      .select('id')
      .eq('id', billData.people_id)
      .eq('company_id', company_id)
      .single();

    if (vendorError || !vendorData) {
      console.error('Error verifying vendor:', vendorError);
      return NextResponse.json(
        { error: 'Vendor not found or does not belong to your company' },
        { status: 404 }
      );
    }

    // Get company default accounts settings to find the accounts payable account
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

    // Get the accounts payable account ID from company settings
    const accountsPayableId = settings?.default_account?.accountspayable;
    
    if (!accountsPayableId) {
      console.error('Accounts payable account not configured in company settings');
      return NextResponse.json(
        { error: 'Accounts payable account not configured in company settings' },
        { status: 400 }
      );
    }

    // Validate unit if specified in any line item
    let validatedUnitId = null;
    const firstLine = billData.lines[0];
    
    if (firstLine.unit_id) {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select(`
          unit_id,
          property_id,
          properties!inner (
            company_id
          )
        `)
        .eq('unit_id', firstLine.unit_id)
        .eq('properties.company_id', company_id)
        .single();

      if (unitError || !unitData) {
        console.error('Error verifying unit:', unitError);
        return NextResponse.json(
          { error: 'Unit not found or does not belong to your company' },
          { status: 404 }
        );
      }
      
      validatedUnitId = unitData.unit_id;
    }

    // Transform line items and calculate total amount
    const transformedLines = billData.lines.map((line) => ({
      line_id: nanoid(), // Always generate a new nanoid for each line
      amount: Number(line.amount) || 0, // Ensure amount is a number
      category: line.category_id,
      reference: 0,
      description: line.description,
      property_id: line.property_id,
      unit_id: line.unit_id
    }));

    const totalAmount = transformedLines.reduce((sum, line) => sum + (typeof line.amount === 'number' ? line.amount : 0), 0);

    // Process memo - if it's a string, parse it to JSON object
    let processedMemo;
    if (billData.memo === null) {
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
    } else if (typeof billData.memo === 'string') {
      // Parse the string into a JSON object
      try {
        processedMemo = JSON.parse(billData.memo);
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
      processedMemo = billData.memo;
    }

    // Create a new transaction with debit and credit entries
    const transactionId = uuidv4();
    
    // Prepare transaction lines with debit and credit entries
    const transactionLines = [];
    
    // Add credit entry for accounts payable (total amount)
    transactionLines.push({
      category: accountsPayableId,
      description: "Vendor bill - Accounts Payable",
      debit_amount: 0,
      credit_amount: totalAmount,
      reference: nanoid()
    });
    
    // Add debit entries for each bill line
    transformedLines.forEach(line => {
      transactionLines.push({
        category: line.category,
        description: line.description || "Vendor bill",
        debit_amount: line.amount,
        credit_amount: 0,
        reference: nanoid()
      });
    });
    
    // Create the transaction record
    const { error: transactionError } = await supabase
      .from('transaction')
      .insert({
        id: transactionId,
        created_at: new Date().toISOString(),
        transaction_type: 'bill',
        property: firstLine.property_id,
        due_date: billData.due_date,
        data: {
          lines: transactionLines,
          total_amount: totalAmount,
          vendor_id: billData.people_id,
          unit_id: validatedUnitId,
          status: billData.status
        },
        company: company_id,
        memo: processedMemo,
        reference: billData.reference || nanoid(),
        share_files: false,
        status: billData.status,
        created_by: user.id,
        payee: billData.people_id
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
      
      // First try to find and update sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance, account_type, parent_account')
        .eq('id', category)
        .single();

      if (!subAccountError && subAccount) {
        // Always increase the account balance regardless of account type
        const amount = Math.abs(credit_amount) + Math.abs(debit_amount);
        
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0;
        const newBalance = currentBalance + amount;

        // Only update the account balance without property balance
        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ 
            account_balance: newBalance.toString()
          })
          .eq('id', category);

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError);
          // Continue with other lines even if one update fails
        }

        // Update parent account if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, account_type')
            .eq('id', subAccount.parent_account)
            .single();

          if (!parentError && parentAccount) {
            // Always increase the parent account balance
            const parentAmount = Math.abs(credit_amount) + Math.abs(debit_amount);
            
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0;
            const parentNewBalance = parentCurrentBalance + parentAmount;

            const { error: parentUpdateError } = await supabase
              .from('chart_of_accounts')
              .update({ 
                account_balance: parentNewBalance.toString()
              })
              .eq('id', subAccount.parent_account);

            if (parentUpdateError) {
              console.error('Error updating parent account balance:', parentUpdateError);
              // Continue with other lines even if one update fails
            }
          }
        }

        continue; // Skip main account update if sub-account was found and updated
      }

      // If not found in sub-accounts, update main account
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, account_type')
        .eq('id', category)
        .single();

      if (mainAccountError) {
        console.error('Error finding account:', mainAccountError);
        // Continue with other lines even if one account is not found
        continue;
      }

      if (mainAccount) {
        // Always increase the account balance
        const amount = Math.abs(credit_amount) + Math.abs(debit_amount);
        
        // Update main account balance
        const currentBalance = parseFloat(mainAccount.account_balance) || 0;
        const newBalance = currentBalance + amount;

        // Only update the account balance without property balance
        const { error: updateError } = await supabase
          .from('chart_of_accounts')
          .update({ 
            account_balance: newBalance.toString()
          })
          .eq('id', category);

        if (updateError) {
          console.error('Error updating account balance:', updateError);
          // Continue with other lines even if one update fails
        }
      }
    }

    // Prepare charge data
    const chargeData: ChargeData = {
      company_id,
      people_id: billData.people_id,
      bill_date: billData.bill_date,
      due_date: billData.due_date,
      payee: billData.people_id,
      property_id: firstLine.property_id,
      unit_id: null, // Default to null
      charge_amount: {
        lines: transformedLines,
        total_amount: totalAmount,
        accounts_payable_id: accountsPayableId
      },
      amount_remaining: {
        lines: transformedLines,
        total_amount: totalAmount,
        accounts_payable_id: accountsPayableId
      },
      memo: processedMemo,
      reference: billData.reference,
      status: billData.status,
      created_by: user.id,
      start_date: billData.start_date,
      frequency: billData.frequency,
      repeat_infinite: billData.repeat_infinite,
      charge_type: billData.charge_type || 'bill'
    };

    // Only set unit_id if it exists and is not null
    if (firstLine.unit_id) {
      chargeData.unit_id = validatedUnitId;
    }

    console.log("Creating charge with data:", chargeData);

    // For recurring bills, set the last_generated_date to the start_date
    const lastGeneratedDate = billData.start_date && billData.frequency ? billData.start_date : undefined;

    // Create the charge record
    const { data: charge, error: chargeError } = await supabase
      .from("charges")
      .insert({
        company_id,
        people_id: billData.people_id,
        bill_date: billData.bill_date,
        due_date: billData.due_date,
        payee: billData.people_id,
        property_id: firstLine.property_id,
        unit_id: validatedUnitId,
        charge_amount: {
          lines: transformedLines,
          total_amount: totalAmount,
          accounts_payable_id: accountsPayableId
        },
        amount_remaining: {
          lines: transformedLines,
          total_amount: totalAmount,
          accounts_payable_id: accountsPayableId
        },
        memo: processedMemo,
        reference: billData.reference,
        status: billData.status,
        created_by: user.id,
        start_date: billData.start_date,
        frequency: billData.frequency,
        repeat_infinite: billData.repeat_infinite,
        charge_type: billData.charge_type || 'bill',
        transaction_id: transactionId,
        last_generated_date: lastGeneratedDate,
        end_date: billData.repeat_infinite ? null : billData.end_date
      })
      .select()
      .single();

    if (chargeError) {
      console.error("Error creating charge:", chargeError);
      return NextResponse.json(
        { error: chargeError.message || "Failed to create bill" },
        { status: 500 }
      );
    }

    // --- NEW: Update maintenance_request with charge_id and transaction_id ---
    if (charge?.id && transactionId && billData.maintenance_request_id) {
      // Update using the maintenance_request_id if provided
      try {
        // 1. Fetch the existing maintenance request record
        const { data: maintenanceRequest, error: fetchError } = await supabase
          .from('maintenance_requests')
          .select('charges_id, transaction_id')
          .eq('id', billData.maintenance_request_id)
          .single();

        if (fetchError) {
          console.error('Error fetching maintenance request for update:', fetchError);
          throw fetchError; // Rethrow to be caught below
        }

        // 2. Prepare the updated arrays
        const currentCharges = maintenanceRequest?.charges_id;
        const currentTransactions = maintenanceRequest?.transaction_id;

        const chargesIdArray = Array.isArray(currentCharges) ? currentCharges : [];
        const transactionIdArray = Array.isArray(currentTransactions) ? currentTransactions : [];

        chargesIdArray.push({ id: charge.id });
        transactionIdArray.push({ id: transactionId });

        // 3. Update the maintenance request with the new arrays
        const { error: updateMrError } = await supabase
          .from('maintenance_requests')
          .update({
            charges_id: chargesIdArray,
            transaction_id: transactionIdArray
          })
          .eq('id', billData.maintenance_request_id);

        if (updateMrError) {
          console.error('Error updating maintenance_requests table:', updateMrError);
          // Log the error but don't fail the whole request,
          // as the bill itself was created successfully.
        }
      } catch (error) {
         // Log the error but don't fail the whole request,
         // as the bill itself was created successfully.
         console.error('Failed to update maintenance request with new IDs:', error);
      }
    }
    // --- END NEW ---

    // Save files to transaction_charges_file table and storage if any
    const files = billData.files || [];
    if (files.length > 0 && charge?.id) {
      for (const file of files) {
        try {
          // file.file_url is expected to be a base64 data URL
          const base64Data = file.file_url.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const uniqueFileName = `${charge.id}/${Date.now()}-${file.file_name}`;

          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('transaction-charges-file')
            .upload(uniqueFileName, buffer, {
              contentType: file.file_type,
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading file to storage:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('transaction-charges-file')
            .getPublicUrl(uploadData.path);

          // Insert file record in DB
          const { error: fileInsertError } = await supabase
            .from('transaction_charges_file')
            .insert({
              file_url: urlData.publicUrl,
              file_name: file.file_name,
              file_type: file.file_type,
              file_size: file.file_size || buffer.length,
              file_path: uploadData.path,
              uploaded_by: user.id,
              charge_id: charge.id,
              transaction_id: transactionId,
              company_id: company_id,
            });
          if (fileInsertError) {
            console.error('Error saving transaction charges file record:', fileInsertError);
          }
        } catch (err) {
          console.error('Error processing file upload:', err);
        }
      }
    }

    return NextResponse.json({ id: charge.id, success: true });
  } catch (error) {
    console.error("Unexpected error in bill creation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;
    
    // Get the user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    const company_id = companyMember.company_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const vendor_id = searchParams.get("vendor_id");
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    
    // Build the query against the 'charges' table for bills
    let query = supabase
      .from("charges")
      .select(`
        id,
        bill_date,
        due_date,
        reference,
        status,
        memo,
        people_id, // Use people_id to link to vendor
        vendors:people!inner ( // Join with people table, alias as vendors
          id,
          name,
          email
        ),
        charge_amount, // Contains lines and total_amount
        amount_remaining,
        property_id,
        unit_id,
        created_at,
        charge_type
      `)
      .eq("company_id", company_id)
      .eq("charge_type", "bill") // Filter specifically for bills
      .order("bill_date", { ascending: false });

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }
    
    if (vendor_id) {
      // Filter using people_id for vendor
      query = query.eq("people_id", vendor_id);
    }
    
    if (from_date) {
      query = query.gte("bill_date", from_date);
    }
    
    if (to_date) {
      query = query.lte("bill_date", to_date);
    }

    // Execute the query
    const { data: bills, error } = await query;

    if (error) {
      console.error("Error fetching bills from charges:", error);
      return NextResponse.json(
        { error: "Failed to fetch bills", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Unexpected error in fetching bills:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 