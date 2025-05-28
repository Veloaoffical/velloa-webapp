import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateCustomId } from '@/lib/utils/generate-id';
import { customAlphabet } from 'nanoid';

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface PartsLaborItem {
  bill_date: string;
  category: string;
  quantity: string;
  unit_price: string;
  description: string;
  vendor: string;
  frequency: string | null;
  due_date: string;
  memo: string;
  nano_id: string;
  property: string;
  units: string;
  start_date: string | null;
  property_id: string;
  unit_id: string;
  repeat_infinite: boolean | null;
}

interface MappedPartsLaborItem {
  bill_date: string;
  category: string;
  quantity: string;
  unit_price: string;
  description: string;
  total: number;
  property?: string;
  units?: string;
  nano_id?: string;
}

interface WorkOrderWithProfile {
  id: string
  subject: string
  description: string
  priority: string
  status: string
  task_type: string
  request_type: string
  request_specific: string
  start_date: string | null
  due_date: string | null
  assignees: string | null
  vendor_id: string | null
  notify_assignee: boolean
  property_id: string | null
  unit_id: string | null
  notify_vendor: boolean
  permit_enter: boolean
  role: string
  created_by: string
  created_at: string
  profiles: Profile
}

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .eq('role', 'work_order')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const processedRequests = (requests as unknown as WorkOrderWithProfile[])?.map(request => ({
      ...request,
      created_by: request.profiles ? 
        `${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(request.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })) || [];

    return NextResponse.json(processedRequests);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the company_id for the authenticated user from company_members
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('User is not a company member:', companyError);
      return NextResponse.json({ error: 'User is not a company member' }, { status: 403 });
    }

    const data = await request.json();
    console.log('Received work order data:', JSON.stringify(data, null, 2));

    const nano_id = generateCustomId();
    let mappedData: MappedPartsLaborItem[] = [];
    let billExpensePayload: Record<string, unknown> | null = null;

    // First create bill expenses if they exist
    if (data.billExpenses && data.billExpenses.length > 0) {
      console.log('Bill Expenses before mapping:', JSON.stringify(data.billExpenses, null, 2));
      console.log('Vendor ID:', data.vendors);
      console.log('Property ID:', data.propertyId);
      console.log('Unit ID:', data.unitId);
      
      mappedData = data.billExpenses.map((item: PartsLaborItem) => {
        console.log('Raw item:', JSON.stringify(item, null, 2));
        
        // Convert quantity and unit_price to numbers, defaulting to 0 if invalid
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        
        console.log('Conversion details:', {
          quantity: {
            original: item.quantity,
            type: typeof item.quantity,
            converted: quantity
          },
          unitPrice: {
            original: item.unit_price,
            type: typeof item.unit_price,
            converted: unitPrice
          }
        });

        const total = quantity * unitPrice;
        console.log('Calculation:', {
          quantity,
          unitPrice,
          total,
          calculation: `${quantity} * ${unitPrice} = ${total}`
        });
        
        const result = {
          bill_date: item.bill_date,
          category: item.category,
          quantity: quantity.toString(),
          unit_price: unitPrice.toString(),
          description: item.description,
          total: total
        };

        console.log('Final mapped item:', JSON.stringify(result, null, 2));
        return result;
      });

      console.log('Final mapped data array:', JSON.stringify(mappedData, null, 2));

      billExpensePayload = {
        id: crypto.randomUUID(),
        vendor: data.vendors,
        frequency: data.frequency || null,
        due_date: data.due_date || null,
        memo: data.description || '',
        nano_id: generateCustomId().slice(0, 9).toUpperCase(),
        property: data.billExpenses[0].property || null,
        units: data.billExpenses[0].units || null,
        start_date: data.start_date || null,
        repeat_infinite: data.repeat_infinite || false,
        data: mappedData
      };

      console.log('Bill expense payload:', JSON.stringify(billExpensePayload, null, 2));

      // Create a single bill expense for all items
      const { error: billExpensesError } = await supabase
        .from('bill_expenses')
        .insert(billExpensePayload)
        .select()
        .single();

      if (billExpensesError) {
        console.error('Error creating bill expenses:', billExpensesError);
        console.error('Failed payload:', JSON.stringify(billExpensePayload, null, 2));
        return NextResponse.json({ 
          error: 'Failed to create bill expenses',
          details: billExpensesError.message,
          code: billExpensesError.code,
          hint: billExpensesError.hint,
          payload: billExpensePayload
        }, { status: 500 });
      }
    }

    // Then create the work order with the company_id
    const { data: workOrderData, error: workOrderError } = await supabase
      .from('maintenance_requests')
      .insert([{
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        task_status: data.task_status,
        task_type: data.task_type,
        request_specific: data.request_specific,
        start_date: data.start_date,
        due_date: data.due_date,
        assignees: data.assignees,
        notify_assignee: data.notify_assignee,
        notify_vendor: data.vendorNotification,
        permit_enter: data.permit_enter,
        request_type: data.request_type,
        vendor_id: data.vendors,
        role: 'work_order',
        created_by: user.id,
        nano_id: nano_id,
        property_id: data.property_id,
        unit_id: data.unit_id,
        company_id: companyMember.company_id
      }])
      .select()
      .single();

    if (workOrderError) {
      console.error('Error creating work order:', {
        error: workOrderError,
        message: workOrderError.message,
        details: workOrderError.details,
        hint: workOrderError.hint,
        code: workOrderError.code,
        data: data
      });
      return NextResponse.json({ 
        error: 'Failed to create work order',
        details: workOrderError.message,
        code: workOrderError.code,
        hint: workOrderError.hint,
        data: data
      }, { status: 500 });
    }

    // --- NEW: Save all parts/labor lines as a single charge record (like bills) ---
    const hasChargeLines = (data.chargeLines && data.chargeLines.length > 0) || (mappedData && mappedData.length > 0);
    if (workOrderData && hasChargeLines) {
      // Define ChargeLine type for type safety
      type ChargeLine = {
        line_id: string;
        amount: number;
        category: string | null;
        reference: number;
        description: string;
        property_id: string | null;
        unit_id: string | null;
      };
      let chargeLines: ChargeLine[] = [];
      let totalAmount: number = 0;
      if (data.chargeLines && data.chargeLines.length > 0) {
        chargeLines = data.chargeLines.map((item: unknown): ChargeLine => {
          const i = item as { nano_id?: string; amount: number; category?: string; description: string; property?: string; unit?: string };
          return {
            line_id: i.nano_id ? i.nano_id : nanoid(),
            amount: typeof i.amount === 'number' ? i.amount : Number(i.amount) || 0,
            category: i.category ?? null,
            reference: 0,
            description: i.description,
            property_id: i.property || data.property_id || workOrderData.property_id || null,
            unit_id: i.unit || data.unit_id || workOrderData.unit_id || null
          };
        });
        totalAmount = chargeLines.reduce((sum: number, line: ChargeLine) => sum + (typeof line.amount === 'number' ? line.amount : 0), 0);
      } else if (mappedData.length > 0) {
        chargeLines = mappedData.map((item: unknown): ChargeLine => {
          const i = item as { nano_id?: string; total: number; category?: string; description: string; property?: string; units?: string };
          return {
            line_id: i.nano_id ? i.nano_id : nanoid(),
            amount: typeof i.total === 'number' ? i.total : 0,
            category: i.category ?? null,
            reference: 0,
            description: i.description,
            property_id: i.property || data.property_id || workOrderData.property_id || null,
            unit_id: i.units || data.unit_id || workOrderData.unit_id || null
          };
        });
        totalAmount = chargeLines.reduce((sum: number, line: ChargeLine) => sum + (typeof line.amount === 'number' ? line.amount : 0), 0);
      }

      // --- Fetch accounts payable account from company_settings ---
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('default_account')
        .eq('companyid', companyMember.company_id)
        .single();
      if (settingsError) {
        console.error('Error fetching company settings:', settingsError);
        return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
      }
      const accountsPayableId = settings?.default_account?.accountspayable;
      if (!accountsPayableId) {
        console.error('Accounts payable account not configured in company settings');
        return NextResponse.json({ error: 'Accounts payable account not configured in company settings' }, { status: 400 });
      }

      // --- Prepare transaction lines ---
      const transactionLines = [];
      // Credit AP
      transactionLines.push({
        category: accountsPayableId,
        description: 'Vendor bill - Accounts Payable',
        debit_amount: 0,
        credit_amount: totalAmount,
        reference: generateCustomId().slice(0, 8).toUpperCase()
      });
      // Debit each expense line
      chargeLines.forEach(line => {
        transactionLines.push({
          category: line.category,
          description: line.description || 'Vendor bill',
          debit_amount: line.amount,
          credit_amount: 0,
          reference: generateCustomId().slice(0, 8).toUpperCase()
        });
      });

      // --- Insert transaction ---
      const transactionId = crypto.randomUUID();
      // --- Memo for transaction: use data.memo, fallback to default if empty ---
      let transactionMemo;
      if (!data.memo || data.memo === null) {
        transactionMemo = {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [],
                direction: null,
                textStyle: '',
                textFormat: 0
              }
            ],
            direction: null
          }
        };
      } else if (typeof data.memo === 'string') {
        try {
          transactionMemo = JSON.parse(data.memo);
        } catch {
          transactionMemo = {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [],
                  direction: null,
                  textStyle: '',
                  textFormat: 0
                }
              ],
              direction: null
            }
          };
        }
      } else {
        transactionMemo = data.memo;
      }
      const { error: transactionError } = await supabase
        .from('transaction')
        .insert({
          id: transactionId,
          created_at: new Date().toISOString(),
          transaction_type: 'bill',
          property: chargeLines[0]?.property_id || data.property_id || null,
          due_date: data.due_date || null,
          data: {
            lines: transactionLines,
            total_amount: totalAmount,
            vendor_id: data.vendors,
            unit_id: chargeLines[0]?.unit_id || data.unit_id || null,
            status: 'unpaid'
          },
          company: companyMember.company_id,
          memo: transactionMemo,
          reference: workOrderData.nano_id,
          share_files: false,
          status: 'unpaid',
          created_by: user.id,
          payee: data.vendors
        });
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return NextResponse.json({ error: 'Failed to create transaction', details: transactionError.message }, { status: 500 });
      }

      // --- Prepare the charge record ---
      // Handle memo: use data.memo, not data.description
      let processedMemo;
      if (!data.memo || data.memo === null) {
        processedMemo = {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [],
                direction: null,
                textStyle: '',
                textFormat: 0
              }
            ],
            direction: null
          }
        };
      } else if (typeof data.memo === 'string') {
        try {
          processedMemo = JSON.parse(data.memo);
        } catch {
          processedMemo = {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [],
                  direction: null,
                  textStyle: '',
                  textFormat: 0
                }
              ],
              direction: null
            }
          };
        }
      } else {
        processedMemo = data.memo;
      }

      const chargeRecord = {
        company_id: companyMember.company_id, // Ensure RLS passes
        created_by: user.id, // Ensure RLS passes
        people_id: data.vendors,
        bill_date: data.bill_date || null,
        due_date: data.due_date || null,
        payee: data.vendors,
        property_id: chargeLines[0].property_id || data.property_id || null,
        unit_id: chargeLines[0].unit_id || data.unit_id || null,
        charge_amount: {
          lines: chargeLines,
          total_amount: totalAmount,
          accounts_payable_id: accountsPayableId
        },
        amount_remaining: {
          lines: chargeLines,
          total_amount: totalAmount,
          accounts_payable_id: accountsPayableId
        },
        memo: processedMemo,
        reference: workOrderData.nano_id,
        status: 'unpaid',
        start_date: data.start_date || null,
        frequency: data.frequency || null,
        repeat_infinite: data.repeat_infinite || false,
        charge_type: 'bill',
        transaction_id: transactionId, // Link to transaction
        last_generated_date: data.start_date && data.frequency ? data.start_date : undefined,
        end_date: data.repeat_infinite ? null : data.end_date
      };
      // Insert the charge record
      const { data: chargeData, error: chargeError } = await supabase
        .from('charges')
        .insert(chargeRecord)
        .select()
        .single();
      if (chargeError) {
        console.error('Error creating charge:', chargeError);
        return NextResponse.json({ error: 'Failed to create charge', details: chargeError.message }, { status: 500 });
      }

      // --- Update the maintenance_request with the charge id and transaction id as JSONB arrays ---
      if (chargeData?.id && transactionId && workOrderData?.id) {
        try {
          // 1. Fetch the existing maintenance request record
          const { data: maintenanceRequest, error: fetchError } = await supabase
            .from('maintenance_requests')
            .select('charges_id, transaction_id')
            .eq('id', workOrderData.id)
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

          chargesIdArray.push({ id: chargeData.id });
          transactionIdArray.push({ id: transactionId });

          // 3. Update the maintenance request with the new arrays
          const { error: updateMrError } = await supabase
            .from('maintenance_requests')
            .update({
              charges_id: chargesIdArray,
              transaction_id: transactionIdArray
            })
            .eq('id', workOrderData.id);

          if (updateMrError) {
            console.error('Error updating maintenance_requests table:', updateMrError);
            // Log error but continue
          }
        } catch (error) {
          console.error('Failed to update maintenance request with new charge/transaction IDs:', error);
          // Log error but continue
        }
      }
      // --- END Update ---
    }
    // --- END NEW ---

    // --- Notify Vendor (SMS) ---
    console.log('Received vendorNotification value (for SMS):', data.vendorNotification);
    if (
      data.vendors && // Only if vendor exists
      data.vendorNotification &&
      (data.vendorNotification === 'sms' || data.vendorNotification === 'both')
    ) {
      // Fetch vendor phone number
      const { data: vendor } = await supabase
        .from('people')
        .select('phone')
        .eq('id', data.vendors)
        .single();
      // Fetch company name
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('companyid', companyMember.company_id)
        .single();
      const phone = vendor?.phone;
      const company = companySettings?.company_name;
      if (phone && workOrderData?.id && company) {
        // Get the user's access token
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          console.error('No access token found for user.');
          return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }
        console.log('Invoking notify-vendor-sms function', { phone, workOrderId: workOrderData.id, company });
        const { error: funcErr } = await supabase.functions.invoke('notify-vendor-sms', {
          body: { phone, workOrderId: workOrderData.id, company },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        console.log('Function invocation complete', { funcErr });
        if (funcErr) {
          console.error('Error invoking notify-vendor-sms:', funcErr);
          console.error('Full function error:', JSON.stringify(funcErr, null, 2));
        }
      } else {
        if (!phone) console.error('Vendor phone not found for notification.');
        if (!company) console.error('Company name not found for notification.');
      }
    }
    // --- END Notify Vendor (SMS) ---

    // --- Notify Vendor (Email) ---
    console.log('Received vendorNotification value (for Email):', data.vendorNotification);
    if (
      data.vendors && // Only if vendor exists
      data.vendorNotification &&
      (data.vendorNotification === 'email' || data.vendorNotification === 'both')
    ) {
      console.log(`[Vendor Email Notify] Condition met. Fetching vendor ID: ${data.vendors}`);
      const { data: vendor, error: vendorFetchError } = await supabase
        .from('people')
        .select('email, first_name, last_name')
        .eq('id', data.vendors)
        .single();

      if (vendorFetchError) {
        console.error('Error fetching vendor profile for email:', vendorFetchError);
        console.log('[Vendor Email Notify] Exiting due to vendor fetch error.');
      } else if (vendor?.email && workOrderData?.id) {
        console.log('[Vendor Email Notify] Vendor details fetched successfully. Email found.');
        console.log('[Vendor Email Notify] Fetching company name...');
        const { data: companySettings } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('companyid', companyMember.company_id)
          .single();
        const company = companySettings?.company_name;
        console.log(`[Vendor Email Notify] Company name fetched: ${company}`);

        // Fetch property address ( Reuse logic from assignee notification )
        console.log('[Vendor Email Notify] Fetching property address...');
        let formattedAddress = 'Address not specified';
        if (workOrderData.property_id) {
          try {
            const { data: propertyRecord, error: propertyFetchError } = await supabase
              .from('properties')
              .select('property_settings')
              .eq('id', workOrderData.property_id)
              .single();

            if (!propertyFetchError && propertyRecord?.property_settings) {
              const { data: settingsData, error: settingsFetchError } = await supabase
                .from('property_settings')
                .select('property_address')
                .eq('id', propertyRecord.property_settings)
                .single();

              if (!settingsFetchError && settingsData?.property_address) {
                const pa = settingsData.property_address as { street_number?: string, street?: string, city?: string, province?: string, postal_code?: string, country?: string };
                const streetPart = pa.street_number ? `${pa.street_number} ${pa.street}` : pa.street;
                const cityPart = pa.city;
                const provincePart = pa.province;
                const postalPart = pa.postal_code;
                const countryPart = pa.country;

                const addressArray = [];
                if (streetPart) addressArray.push(streetPart.trim());
                if (cityPart) addressArray.push(cityPart.trim());
                const provPostal = [];
                if (provincePart) provPostal.push(provincePart.trim());
                if (postalPart) provPostal.push(postalPart.trim());
                if (provPostal.length > 0) addressArray.push(provPostal.join(' '));
                if (countryPart) addressArray.push(countryPart.trim());

                if (addressArray.length > 0) {
                  formattedAddress = addressArray.join(', ');
                }
              }
            }
          } catch (fetchAddressError) {
            console.error('Error fetching/processing property address for vendor email:', fetchAddressError);
          }
        }
        console.log(`[Vendor Email Notify] Property address processed: ${formattedAddress}`);

        const emailBody = {
          email: vendor.email,
          name: `${vendor.first_name} ${vendor.last_name}`.trim(),
          workOrderId: workOrderData.nano_id || workOrderData.id,
          company: company || 'Velloa',
          propertyAddress: formattedAddress,
          serviceType: "Work Order Assignment",
          dueDate: workOrderData.due_date ? new Date(workOrderData.due_date).toLocaleDateString('en-US') : 'Date not specified'
        };

        console.log('[Vendor Email Notify] Preparing to invoke function...');
        console.log('Invoking notify-vendor-email function', emailBody);
        const { error: funcErr } = await supabase.functions.invoke('notify-vendor-email', {
          body: emailBody,
        });

        if (funcErr) {
          console.error('Error invoking notify-vendor-email:', funcErr);
        } else {
          console.log('Vendor email notification function invoked successfully.');
        }
      } else {
        console.log('[Vendor Email Notify] Exiting because vendor email or workOrder ID is missing.');
        if (!vendor?.email) console.error('Vendor email not found for notification.');
        if (!workOrderData?.id) console.error('Work order ID not available for notification.');
      }
    } else {
      console.log('[Vendor Email Notify] Initial condition not met (check vendorId, notification selection).');
    }
    // --- END Notify Vendor (Email) ---

    // --- Notify Assignee via Edge Function if needed ---
    console.log('Received assigneeNotification value:', data.assigneeNotification);
    if (
      data.assignees && // Only if assignee exists
      data.assigneeNotification &&
      (data.assigneeNotification === 'email' || data.assigneeNotification === 'both')
    ) {
      // Fetch assignee email
      const { data: assignee, error: assigneeFetchError } = await supabase
        .from('profiles') // Assuming assignees are in 'profiles' table
        .select('email, first_name, last_name')
        .eq('id', data.assignees)
        .single();

      if (assigneeFetchError) {
        console.error('Error fetching assignee profile:', assigneeFetchError);
        // Optionally log this, but don't block the request
      } else if (assignee?.email && workOrderData?.id) {
        // Fetch company name
        const { data: companySettings } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('companyid', companyMember.company_id)
          .single();
        const company = companySettings?.company_name;

        // Fetch property address (similar logic as vendor notification)
        let formattedAddress = 'Address not specified';
        if (workOrderData.property_id) {
          try {
            const { data: propertyRecord, error: propertyFetchError } = await supabase
              .from('properties')
              .select('property_settings')
              .eq('id', workOrderData.property_id)
              .single();

            if (!propertyFetchError && propertyRecord?.property_settings) {
              const { data: settingsData, error: settingsFetchError } = await supabase
                .from('property_settings')
                .select('property_address')
                .eq('id', propertyRecord.property_settings)
                .single();

              if (!settingsFetchError && settingsData?.property_address) {
                const pa = settingsData.property_address as { street_number?: string, street?: string, city?: string, province?: string, postal_code?: string, country?: string };
                const streetPart = pa.street_number ? `${pa.street_number} ${pa.street}` : pa.street;
                const cityPart = pa.city;
                const provincePart = pa.province;
                const postalPart = pa.postal_code;
                const countryPart = pa.country;

                const addressArray = [];
                if (streetPart) addressArray.push(streetPart.trim());
                if (cityPart) addressArray.push(cityPart.trim());
                const provPostal = [];
                if (provincePart) provPostal.push(provincePart.trim());
                if (postalPart) provPostal.push(postalPart.trim());
                if (provPostal.length > 0) addressArray.push(provPostal.join(' '));
                if (countryPart) addressArray.push(countryPart.trim());

                if (addressArray.length > 0) {
                  formattedAddress = addressArray.join(', ');
                }
              }
            }
          } catch (fetchAddressError) {
            console.error('Error fetching/processing property address for assignee email:', fetchAddressError);
          }
        }

        const emailBody = {
          email: assignee.email,
          name: `${assignee.first_name} ${assignee.last_name}`.trim(),
          workOrderId: workOrderData.nano_id || workOrderData.id,
          company: company || 'Velloa', // Default company name
          propertyAddress: formattedAddress,
          serviceType: "Work Order Assignment", // Indicate it's an assignment notification
          dueDate: workOrderData.due_date ? new Date(workOrderData.due_date).toLocaleDateString('en-US') : 'Date not specified'
        };

        console.log('Invoking notify-assignee-email function', emailBody);
        const { error: funcErr } = await supabase.functions.invoke('notify-assignee-email', {
          body: emailBody,
        });

        if (funcErr) {
          console.error('Error invoking notify-assignee-email:', funcErr);
          // Log error but don't necessarily fail the request
        } else {
          console.log('Assignee email notification function invoked successfully.');
        }
      } else {
        if (!assignee?.email) console.error('Assignee email not found for notification.');
      }
    }
    // --- END Notify Assignee ---

    // --- NEW: Save files like tenant requests ---
    const files = data.files || [];
    if (files.length > 0 && workOrderData?.id) {
      for (const file of files) {
        try {
          // file.file_url is expected to be a base64 data URL
          const base64Data = file.file_url.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const uniqueFileName = `${workOrderData.id}/${Date.now()}-${file.file_name}`;

          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('maintenance_files')
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
            .from('maintenance_files')
            .getPublicUrl(uploadData.path);

          // Insert file record in DB
          const { error: fileInsertError } = await supabase
            .from('maintenance_file')
            .insert({
              file_url: urlData.publicUrl,
              file_name: file.file_name,
              file_type: file.file_type,
              file_path: uploadData.path,
              uploaded_by: user.id,
              maintenance_id: workOrderData.id,
              company_id: data.company_id || null,
            });
          if (fileInsertError) {
            console.error('Error saving maintenance file record:', fileInsertError);
          }
        } catch (err) {
          console.error('Error processing file upload:', err);
        }
      }
    }
    // --- END NEW ---

    const processedRequest = workOrderData ? {
      ...workOrderData,
      created_by: workOrderData.profiles ? 
        `${workOrderData.profiles.first_name || ''} ${workOrderData.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(workOrderData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } : null;

    // Create notification subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('notification_subjects')
      .insert([{
        id: crypto.randomUUID(),
        table_name: 'maintenance_requests',
        row_id: workOrderData.id
      }])
      .select()
      .single();

    if (subjectError) {
      console.error('Error creating notification subject:', subjectError);
    } else {
      const notifications = [];

      if (data.assignees && data.notify_assignee) {
        notifications.push({
          id: crypto.randomUUID(),
          recipient_id: data.assignees,
          subject_id: subjectData.id,
          type: 'work_order',
          message: 'A new work order has been assigned to you',
          read: false
        });
      }

      if (data.vendors && data.notify_vendor) {
        notifications.push({
          id: crypto.randomUUID(),
          people_id: data.vendors,
          subject_id: subjectData.id,
          type: 'work_order',
          message: 'A new work order has been assigned to you',
          read: false
        });
      }

      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notification')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      }
    }

    return NextResponse.json(processedRequest, { status: 201 });
  } catch (error) {
    console.error('Error in work order creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 