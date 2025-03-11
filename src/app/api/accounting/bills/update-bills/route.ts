import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// Define the schema for bill line items
const BillLineSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive(),
  category_id: z.string().uuid(),
  property_id: z.string().uuid().nullable(),
  unit_id: z.string().uuid().nullable(),
  line_id: z.string().optional()
});

// Define the schema for the bill update request
const BillUpdateSchema = z.object({
  id: z.string().uuid(),
  people_id: z.string().uuid(),
  bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(BillLineSchema).min(1),
  memo: z.any().nullable().optional(),
  reference: z.string().optional(),
  status: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  frequency: z.string().optional(),
  repeat_infinite: z.boolean().optional(),
  charge_type: z.string().default('bill')
});

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    const validationResult = BillUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const billData = validationResult.data;
    
    // Get the bill ID from the request body
    const billId = billData.id;
    if (!billId) {
      return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
    }

    // Get the existing bill data
    const { data: existingBill, error: existingBillError } = await supabase
      .from('charges')
      .select('*')
      .eq('id', billId)
      .eq('company_id', company_id)
      .single();

    if (existingBillError || !existingBill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Verify that the vendor exists and belongs to the company
    const { data: vendorData, error: vendorError } = await supabase
      .from('people')
      .select('id')
      .eq('id', billData.people_id)
      .eq('company_id', company_id)
      .single();

    if (vendorError || !vendorData) {
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
      return NextResponse.json(
        { error: 'Failed to fetch company settings' },
        { status: 500 }
      );
    }

    const accountsPayableId = settings?.default_account?.accountspayable;
    if (!accountsPayableId) {
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
        return NextResponse.json(
          { error: 'Unit not found or does not belong to your company' },
          { status: 404 }
        );
      }
      
      validatedUnitId = unitData.unit_id;
    }

    // Transform line items and calculate total amount
    const transformedLines = billData.lines.map(line => ({
      line_id: line.line_id || nanoid(),
      amount: line.amount,
      category: line.category_id,
      reference: 0,
      description: line.description,
      property_id: line.property_id,
      unit_id: line.unit_id
    }));

    const totalAmount = transformedLines.reduce((sum: number, line: { amount: number }) => sum + line.amount, 0);

    // Process memo
    let processedMemo;
    if (billData.memo === null) {
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
      try {
        processedMemo = JSON.parse(billData.memo);
      } catch {
        // If parsing fails, use default empty state
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
      processedMemo = billData.memo;
    }

    // Begin transaction
    const { error: beginError } = await supabase.rpc('begin_transaction');
    if (beginError) {
      return NextResponse.json(
        { error: 'Failed to begin transaction' },
        { status: 500 }
      );
    }

    try {
      // Calculate the difference between old and new amounts
      const oldAmount = existingBill.charge_amount.lines.reduce((sum: number, line: { amount: number }) => sum + line.amount, 0);
      const newAmount = totalAmount;
      const difference = newAmount - oldAmount;

      // Update transaction
      const transactionLines = [];
      
      // Add credit entry for accounts payable
      transactionLines.push({
        category: accountsPayableId,
        description: "Vendor bill - Accounts Payable",
        debit_amount: 0,
        credit_amount: totalAmount,
        reference: existingBill.charge_amount.lines[0].reference || nanoid()
      });
      
      // Add debit entries for each bill line
      transformedLines.forEach((line, index) => {
        transactionLines.push({
          category: line.category,
          description: line.description || "Vendor bill",
          debit_amount: line.amount,
          credit_amount: 0,
          reference: existingBill.charge_amount.lines[index + 1]?.reference || nanoid()
        });
      });

      // Update the transaction record
      const { error: transactionError } = await supabase
        .from('transaction')
        .update({
          property: firstLine.property_id,
          due_date: billData.due_date,
          data: {
            lines: transactionLines,
            total_amount: totalAmount,
            vendor_id: billData.people_id,
            unit_id: validatedUnitId,
            status: billData.status
          },
          memo: processedMemo,
          reference: billData.reference,
          status: billData.status,
          payee: billData.people_id
        })
        .eq('id', existingBill.transaction_id);

      if (transactionError) {
        throw new Error('Failed to update transaction');
      }

      // Update account balances with just the difference
      for (const line of transactionLines) {
        const { category, debit_amount, credit_amount } = line;
        const lineAmount = Math.abs(credit_amount) + Math.abs(debit_amount);
        const lineDifference = (lineAmount / totalAmount) * difference; // Proportional difference for this line
        
        // Try to update sub-account first
        const { data: subAccount } = await supabase
          .from('chart_of_sub_accounts')
          .select('id, account_balance, account_type, parent_account')
          .eq('id', category)
          .single();

        if (subAccount) {
          const currentBalance = parseFloat(subAccount.account_balance) || 0;
          const newBalance = currentBalance + lineDifference;

          await supabase
            .from('chart_of_sub_accounts')
            .update({ account_balance: newBalance.toString() })
            .eq('id', category);

          if (subAccount.parent_account) {
            const { data: parentAccount } = await supabase
              .from('chart_of_accounts')
              .select('account_balance')
              .eq('id', subAccount.parent_account)
              .single();

            if (parentAccount) {
              const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0;
              const parentNewBalance = parentCurrentBalance + lineDifference;

              await supabase
                .from('chart_of_accounts')
                .update({ account_balance: parentNewBalance.toString() })
                .eq('id', subAccount.parent_account);
            }
          }
        } else {
          // Update main account
          const { data: mainAccount } = await supabase
            .from('chart_of_accounts')
            .select('account_balance')
            .eq('id', category)
            .single();

          if (mainAccount) {
            const currentBalance = parseFloat(mainAccount.account_balance) || 0;
            const newBalance = currentBalance + lineDifference;

            await supabase
              .from('chart_of_accounts')
              .update({ account_balance: newBalance.toString() })
              .eq('id', category);
          }
        }
      }

      // Update the charge record
      const { data: updatedCharge, error: chargeError } = await supabase
        .from("charges")
        .update({
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
          start_date: billData.start_date,
          frequency: billData.frequency,
          repeat_infinite: billData.repeat_infinite,
          charge_type: billData.charge_type || 'bill'
        })
        .eq('id', billId)
        .select()
        .single();

      if (chargeError) {
        throw new Error('Failed to update charge');
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        throw new Error('Failed to commit transaction');
      }

      return NextResponse.json({ id: updatedCharge.id, success: true });
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 