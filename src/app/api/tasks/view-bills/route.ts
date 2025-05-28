import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
// uuidv4 might be needed if we were generating new transaction IDs, but we update existing.
// import { v4 as uuidv4 } from "uuid";

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// Interface for lines within charge_amount coming from the database
interface ChargeLineItemFromDB {
  line_id: string;
  amount: number;
  category: string; // This holds the category_id from the DB
  reference: number;
  description?: string;
  property_id: string | null;
  unit_id: string | null;
}

// Interface for lines within transaction.data
interface TransactionEntryLine {
  category: string; // account_id or category_id
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  reference: string;
}

// Interface for the transaction.data object
interface TransactionData {
  lines: TransactionEntryLine[];
  total_amount: number;
  vendor_id?: string;
  unit_id?: string | null;
  status?: string;
  due_date?: string; // As identified, due_date can be here
}

// Define the schema for bill line items for update
const BillLineUpdateSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive(),
  category_id: z.string().uuid(),
  property_id: z.string().uuid().nullable(),
  unit_id: z.string().uuid().nullable(),
  // line_id is internally generated if needed, not expected from client for existing lines
});

// Define the schema for the bill update request
const BillUpdateSchema = z.object({
  id: z.string().uuid(), // ID of the charge/bill to update
  people_id: z.string().uuid(),
  bill_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  due_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).nullable().optional(),
  lines: z.array(BillLineUpdateSchema).min(1),
  memo: z.any().nullable().optional(),
  reference: z.string().optional(),
  status: z.string(),
  start_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).nullable().optional(),
  frequency: z.string().optional().nullable(),
  repeat_infinite: z.boolean().optional(),
  end_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).nullable().optional(),
  charge_type: z.string().default('bill'), // Assuming charge_type is 'bill' and not changed.
  maintenance_request_id: z.string().uuid().optional().nullable(),
  files: z.array(z.object({
    file_url: z.string(), // Base64 data URL
    file_name: z.string(),
    file_type: z.string(),
    file_size: z.number().optional()
  })).optional()
});

async function updateUserAccountBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  amount: number,
  operation: 'add' | 'subtract'
) {
  const { data: subAccount, error: subAccountError } = await supabase
    .from('chart_of_sub_accounts')
    .select('id, account_balance, account_type, parent_account')
    .eq('id', accountId)
    .single();

  let updateError = null;

  if (!subAccountError && subAccount) {
    const currentBalance = parseFloat(subAccount.account_balance) || 0;
    const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
    
    const { error } = await supabase
      .from('chart_of_sub_accounts')
      .update({ account_balance: newBalance.toString() })
      .eq('id', accountId);
    updateError = error;

    if (!updateError && subAccount.parent_account) {
      const { data: parentAccount, error: parentError } = await supabase
        .from('chart_of_accounts')
        .select('account_balance, account_type')
        .eq('id', subAccount.parent_account)
        .single();
      if (!parentError && parentAccount) {
        const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0;
        const parentNewBalance = operation === 'add' ? parentCurrentBalance + amount : parentCurrentBalance - amount;
        const { error: parentUpdateErr } = await supabase
          .from('chart_of_accounts')
          .update({ account_balance: parentNewBalance.toString() })
          .eq('id', subAccount.parent_account);
        if (parentUpdateErr) console.error('Error updating parent account balance:', parentUpdateErr);
      }
    }
  } else {
    const { data: mainAccount, error: mainAccountError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_balance, account_type')
      .eq('id', accountId)
      .single();
    if (!mainAccountError && mainAccount) {
      const currentBalance = parseFloat(mainAccount.account_balance) || 0;
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({ account_balance: newBalance.toString() })
        .eq('id', accountId);
      updateError = error;
    } else {
      console.error('Account not found for balance update:', accountId, subAccountError?.message, mainAccountError?.message);
      return { error: 'Account not found' };
    }
  }
  if (updateError) {
    console.error(`Error updating account balance (${operation}):`, updateError);
  }
  return { error: updateError };
}


export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }
    const company_id = companyMember.company_id;

    const body = await request.json();
    const validationResult = BillUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    const billData = validationResult.data;
    const billIdToUpdate = billData.id;

    // Fetch existing charge (bill)
    const { data: existingCharge, error: fetchChargeError } = await supabase
      .from('charges')
      .select('*') // Select all fields to get transaction_id and old data
      .eq('id', billIdToUpdate)
      .eq('company_id', company_id)
      .single();

    if (fetchChargeError || !existingCharge) {
      console.error("Error fetching existing charge:", fetchChargeError);
      return NextResponse.json({ error: 'Bill not found or access denied' }, { status: 404 });
    }

    const existingTransactionId = existingCharge.transaction_id;
    if (!existingTransactionId) {
      console.error("Existing charge has no transaction_id:", existingCharge);
      return NextResponse.json({ error: 'Associated transaction not found for this bill' }, { status: 500 });
    }

    // Fetch existing transaction
    const { data: existingTransaction, error: fetchTransactionError } = await supabase
      .from('transaction')
      .select('id, data, company, payee, reference, status')
      .eq('id', existingTransactionId)
      .eq('company', company_id)
      .single();

    if (fetchTransactionError || !existingTransaction) {
      console.error("Error fetching existing transaction:", fetchTransactionError);
      return NextResponse.json({ error: 'Transaction data corrupted or not found for update' }, { status: 500 });
    }
    
    // Check if financial details are being changed for an already 'paid' bill
    const oldLinesFromCharge = (existingCharge.charge_amount?.lines as ChargeLineItemFromDB[] | undefined)?.map((l: ChargeLineItemFromDB) => ({
        description: l.description,
        amount: Number(l.amount),
        category_id: l.category, // In charge, it's 'category', map to 'category_id' for comparison
        property_id: l.property_id,
        unit_id: l.unit_id,
    })) || [];
    const newLinesFromRequest = billData.lines.map(l => ({
        description: l.description,
        amount: Number(l.amount),
        category_id: l.category_id,
        property_id: l.property_id,
        unit_id: l.unit_id,
    }));

    // A more robust check for line changes
    const linesHaveChanged = 
        oldLinesFromCharge.length !== newLinesFromRequest.length ||
        !oldLinesFromCharge.every((oldLine: { description?: string; amount: number; category_id: string; property_id: string | null; unit_id: string | null; }) => 
            newLinesFromRequest.some(newLine => 
                oldLine.amount === newLine.amount &&
                oldLine.category_id === newLine.category_id &&
                oldLine.description === newLine.description &&
                oldLine.property_id === newLine.property_id &&
                oldLine.unit_id === newLine.unit_id
            )
        ) ||
        !newLinesFromRequest.every(newLine => 
            oldLinesFromCharge.some((oldLine: { description?: string; amount: number; category_id: string; property_id: string | null; unit_id: string | null; }) =>
                oldLine.amount === newLine.amount &&
                oldLine.category_id === newLine.category_id &&
                oldLine.description === newLine.description &&
                oldLine.property_id === newLine.property_id &&
                oldLine.unit_id === newLine.unit_id
            )
        );


    if (existingCharge.status === 'paid' && billData.status === 'paid' && linesHaveChanged) {
        return NextResponse.json({ error: 'Cannot update financial details of a paid bill. Reopen the bill first if changes are necessary.' }, { status: 403 });
    }


    // Verify vendor
    const { data: vendorData, error: vendorError } = await supabase
      .from('people')
      .select('id')
      .eq('id', billData.people_id)
      .eq('company_id', company_id)
      .single();
    if (vendorError || !vendorData) {
      return NextResponse.json({ error: 'Vendor not found or does not belong to your company' }, { status: 404 });
    }

    // Get company settings for accounts payable ID
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('default_account')
      .eq('companyid', company_id)
      .single();
    if (settingsError || !settings?.default_account?.accountspayable) {
      return NextResponse.json({ error: 'Accounts payable account not configured in company settings' }, { status: 400 });
    }
    const accountsPayableId = settings.default_account.accountspayable;

    // Validate unit if specified
    let validatedUnitId = null;
    // Use first line's unit_id as representative, or null if no lines have unit_id
    const unitIdFromLines = billData.lines.find(line => line.unit_id)?.unit_id || null;
    
    if (unitIdFromLines) {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('unit_id, property_id, properties!inner(company_id)')
        .eq('unit_id', unitIdFromLines)
        .eq('properties.company_id', company_id)
        .single();
      if (unitError || !unitData) {
        return NextResponse.json({ error: 'Unit not found or does not belong to your company' }, { status: 404 });
      }
      validatedUnitId = unitData.unit_id;
    }

    // Prepare new transformed lines for charge and transaction
    const newTransformedLinesForCharge = billData.lines.map((line) => ({
      line_id: nanoid(), 
      amount: Number(line.amount) || 0,
      category: line.category_id, // Use category_id from request for charge's category field
      reference: 0, 
      description: line.description,
      property_id: line.property_id,
      unit_id: line.unit_id // This will be null if not provided on the line
    }));
    const newTotalAmount = newTransformedLinesForCharge.reduce((sum, line) => sum + line.amount, 0);

    // Process memo
    let processedMemo;
    if (billData.memo === null) {
      processedMemo = { // Full default empty editor state
        "root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [], "direction": null, "textStyle": "", "textFormat": 0}], "direction": null}
      };
    } else if (typeof billData.memo === 'string') {
      try {
        processedMemo = JSON.parse(billData.memo);
      } catch (e) {
        console.error('Error parsing memo string:', e);
        processedMemo = { // Fallback to default
          "root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"type": "paragraph", "format": "", "indent": 0, "version": 1, "children": [], "direction": null, "textStyle": "", "textFormat": 0}], "direction": null}
        };
      }
    } else {
      processedMemo = billData.memo; // Already an object
    }

    // --- BEGIN FINANCIAL UPDATES ---
    // Step 1: Reverse old account balances based on existing transaction data
    const oldTransactionData = existingTransaction.data as TransactionData | undefined; 
    const oldTransactionLines = oldTransactionData?.lines || [];
    for (const oldLine of oldTransactionLines) {
      const amountToReverse = Math.abs(oldLine.debit_amount || 0) + Math.abs(oldLine.credit_amount || 0);
      if (amountToReverse > 0 && oldLine.category) { // Ensure category exists
        await updateUserAccountBalance(supabase, oldLine.category, amountToReverse, 'subtract');
      }
    }

    // Step 2: Prepare new transaction lines
    const newTransactionLines = [];
    newTransactionLines.push({ 
      category: accountsPayableId,
      description: "Vendor bill - Accounts Payable",
      debit_amount: 0,
      credit_amount: newTotalAmount,
      reference: nanoid()
    });
    newTransformedLinesForCharge.forEach(line => { 
      newTransactionLines.push({
        category: line.category, // This is category_id from the input
        description: line.description || "Vendor bill",
        debit_amount: line.amount,
        credit_amount: 0,
        reference: nanoid()
      });
    });

    // Step 3: Update the transaction record
    const firstNewLineForProperty = newTransformedLinesForCharge.length > 0 ? newTransformedLinesForCharge[0] : null;
    const { error: updateTransactionError } = await supabase
      .from('transaction')
      .update({
        property: firstNewLineForProperty?.property_id || null, 
        due_date: billData.due_date !== undefined ? billData.due_date : existingTransaction.data?.due_date,
        data: {
          lines: newTransactionLines,
          total_amount: newTotalAmount,
          vendor_id: billData.people_id, // people_id is vendor_id in transaction context
          unit_id: validatedUnitId,      // Use validated unit_id from line items
          status: billData.status        // Update status in transaction data as well
        },
        memo: processedMemo,
        reference: billData.reference || existingTransaction.reference || nanoid(),
        status: billData.status, 
        payee: billData.people_id 
      })
      .eq('id', existingTransactionId);

    if (updateTransactionError) {
      console.error('Error updating transaction:', updateTransactionError);
      // Consider complexities of rolling back balance changes here. For now, log and fail.
      return NextResponse.json({ error: 'Failed to update transaction: ' + updateTransactionError.message }, { status: 500 });
    }

    // Step 4: Apply new account balances
    for (const newLine of newTransactionLines) {
      const amountToAdd = Math.abs(newLine.debit_amount || 0) + Math.abs(newLine.credit_amount || 0);
      if (amountToAdd > 0 && newLine.category) { // Ensure category exists
        await updateUserAccountBalance(supabase, newLine.category, amountToAdd, 'add');
      }
    }
    // --- END FINANCIAL UPDATES ---

    // Update the charge record in 'charges' table
    const lastGeneratedDate = billData.start_date && billData.frequency ? billData.start_date : existingCharge.last_generated_date;
    const propertyIdForCharge = firstNewLineForProperty?.property_id || null;
    // unit_id for charge should be the globally validated one for the bill, not per-line in the charge root.
    // The lines within charge_amount will have their individual unit_ids.

    const { data: updatedCharge, error: updateChargeError } = await supabase
      .from('charges')
      .update({
        people_id: billData.people_id,
        bill_date: billData.bill_date,
        due_date: billData.due_date, // This comes from billData and could be null
        payee: billData.people_id,
        property_id: propertyIdForCharge, 
        unit_id: validatedUnitId, // Global unit_id for the charge
        charge_amount: {
          lines: newTransformedLinesForCharge, // lines have individual property/unit if needed
          total_amount: newTotalAmount,
          accounts_payable_id: accountsPayableId
        },
        amount_remaining: { // This needs careful logic if partial payments exist
          lines: newTransformedLinesForCharge, // For simplicity, reset to new lines.
          total_amount: newTotalAmount,        // This assumes bill is not partially paid or status handles it.
          accounts_payable_id: accountsPayableId
        },
        memo: processedMemo,
        reference: billData.reference,
        status: billData.status,
        start_date: billData.start_date,
        frequency: billData.frequency,
        repeat_infinite: billData.repeat_infinite,
        end_date: billData.repeat_infinite ? null : billData.end_date,
        last_generated_date: lastGeneratedDate,
      })
      .eq('id', billIdToUpdate)
      .select()
      .single();

    if (updateChargeError) {
      console.error("Error updating charge:", updateChargeError);
      return NextResponse.json({ error: updateChargeError.message || "Failed to update bill" }, { status: 500 });
    }

    // Update maintenance_request if linked
    if (updatedCharge?.id && billData.maintenance_request_id) {
        const { data: maintenanceRequest, error: fetchMrError } = await supabase
          .from('maintenance_requests')
          .select('charges_id, transaction_id') 
          .eq('id', billData.maintenance_request_id)
          .single();

        if (!fetchMrError && maintenanceRequest) {
          const currentCharges = maintenanceRequest.charges_id;
          const currentTransactions = maintenanceRequest.transaction_id;

          const chargesIdArray = Array.isArray(currentCharges) ? [...currentCharges] : [];
          const transactionIdArray = Array.isArray(currentTransactions) ? [...currentTransactions] : [];
          
          if (!chargesIdArray.find(c => c.id === updatedCharge.id)) {
            chargesIdArray.push({ id: updatedCharge.id });
          }
          // The transaction ID (existingTransactionId) is constant for this bill.
          // Ensure it's in the maintenance_request's transaction_id array.
          if (!transactionIdArray.find(t => t.id === existingTransactionId)) {
            transactionIdArray.push({ id: existingTransactionId });
          }

          const { error: updateMrError } = await supabase
            .from('maintenance_requests')
            .update({ charges_id: chargesIdArray, transaction_id: transactionIdArray })
            .eq('id', billData.maintenance_request_id);
          if (updateMrError) console.error('Error updating maintenance_requests table with charge/transaction IDs:', updateMrError);
        } else if (fetchMrError) {
            console.error('Error fetching maintenance request for update:', fetchMrError);
        }
    }
    
    // Handle new file uploads (add to existing files, don't replace)
    const newFiles = billData.files || [];
    if (newFiles.length > 0 && updatedCharge?.id) {
      for (const file of newFiles) {
        // Check if file.file_url is a base64 data URL
        if (!file.file_url || !file.file_url.startsWith('data:')) {
            console.warn('Skipping file upload due to invalid file_url format:', file.file_name);
            continue;
        }
        try {
          const base64Parts = file.file_url.split(',');
          if (base64Parts.length < 2) {
            console.warn('Skipping file upload due to missing base64 data:', file.file_name);
            continue;
          }
          const base64Data = base64Parts[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const uniqueFileName = `${updatedCharge.id}/${Date.now()}-${file.file_name}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('transaction-charges-file')
            .upload(uniqueFileName, buffer, { contentType: file.file_type, upsert: false });

          if (uploadError) {
            console.error('Error uploading new file to storage:', uploadError);
            continue; 
          }

          const { data: urlData } = supabase.storage.from('transaction-charges-file').getPublicUrl(uploadData.path);
          
          const { error: fileInsertError } = await supabase.from('transaction_charges_file').insert({
            file_url: urlData.publicUrl,
            file_name: file.file_name,
            file_type: file.file_type,
            file_size: file.file_size || buffer.length,
            file_path: uploadData.path,
            uploaded_by: user.id,
            charge_id: updatedCharge.id,
            transaction_id: existingTransactionId, 
            company_id: company_id,
          });
          if (fileInsertError){
            console.error('Error saving new transaction charges file record:', fileInsertError);
          }
        } catch (err) {
          console.error('Error processing new file upload:', err);
        }
      }
    }

    return NextResponse.json({ id: updatedCharge.id, success: true });

  } catch (error) {
    console.error("Unexpected error in bill update:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
