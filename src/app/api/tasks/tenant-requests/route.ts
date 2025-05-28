import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateCustomId } from '@/lib/utils/generate-id';
import { Buffer } from 'buffer';

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface TenantRequestWithProfile {
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
  tenant_id: string | null
  notify_assignee: boolean
  permit_enter: boolean
  role: string
  created_by: string
  created_at: string
  profiles: Profile
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
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
      .eq('role', 'tenant_request')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the creator's name and dates
    const processedRequests = (requests as unknown as TenantRequestWithProfile[])?.map(request => ({
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
    console.log('Received tenant request data:', JSON.stringify(data, null, 2));

    // Fetch property_id and unit_id for the tenant
    let property_id = null;
    let unit_id = null;
    if (data.tenant_id) {
      const { data: tenant, error: tenantError } = await supabase
        .from('people')
        .select('property_id, unit_id')
        .eq('id', data.tenant_id)
        .single();
      if (tenantError) {
        console.error('Error fetching tenant property/unit:', tenantError);
        return NextResponse.json({ error: 'Could not fetch tenant property/unit info' }, { status: 400 });
      }
      property_id = tenant?.property_id || null;
      unit_id = tenant?.unit_id || null;
    }

    // Generate a custom ID for the request
    const nano_id = generateCustomId();

    // Create the tenant request
    const { data: requestData, error: requestError } = await supabase
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
        permit_enter: data.permit_enter,
        request_type: data.request_type,
        tenant_id: data.tenant_id,
        property_id: property_id,
        unit_id: unit_id,
        role: 'tenant_request',
        created_by: user.id,
        nano_id: nano_id,
        company_id: companyMember.company_id
      }])
      .select(`
        *,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .single();

    if (requestError) {
      console.error('Error creating tenant request:', {
        error: requestError,
        message: requestError.message,
        details: requestError.details,
        hint: requestError.hint,
        code: requestError.code,
        data: data
      });
      return NextResponse.json({ 
        error: 'Failed to create tenant request',
        details: requestError.message,
        code: requestError.code,
        hint: requestError.hint,
        data: data
      }, { status: 500 });
    }

    // Save files to maintenance_file table and storage if any
    const files = data.files || [];
    if (files.length > 0 && requestData?.id) {
      for (const file of files) {
        try {
          // file.file_url is expected to be a base64 data URL
          const base64Data = file.file_url.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const uniqueFileName = `${requestData.id}/${Date.now()}-${file.file_name}`;

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
              maintenance_id: requestData.id,
              company_id: companyMember.company_id,
            });
          if (fileInsertError) {
            console.error('Error saving maintenance file record:', fileInsertError);
          }
        } catch (err) {
          console.error('Error processing file upload:', err);
        }
      }
    }

    // Format the creator's name and dates for the response
    const processedRequest = requestData ? {
      ...requestData,
      created_by: requestData.profiles ? 
        `${requestData.profiles.first_name || ''} ${requestData.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(requestData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } : null;

    // Create a notification subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('notification_subjects')
      .insert([{
        id: crypto.randomUUID(),
        table_name: 'maintenance_requests',
        row_id: requestData.id
      }])
      .select()
      .single();

    if (subjectError) {
      console.error('Error creating notification subject:', subjectError);
      // Continue anyway as the request was created successfully
    } else {
      // Create notifications array to handle multiple notifications
      const notifications = [];

      // Add assignee notification if there's an assignee and notification is requested
      if (data.assignees && data.notify_assignee && data.notify_assignee !== 'none') {
        notifications.push({
          id: crypto.randomUUID(),
          recipient_id: data.assignees,
          subject_id: subjectData.id,
          type: 'tenant_request',
          message: 'A new tenant request has been assigned to you',
          read: false,
          // Optionally add delivery_method here if needed later
          // delivery_method: data.assigneeNotification 
        });
      }

      // Add tenant notification if there's a tenant and notify_tenant is true
      if (data.tenant_id && data.notify_tenant) {
        notifications.push({
          id: crypto.randomUUID(),
          people_id: data.tenant_id,
          subject_id: subjectData.id,
          type: 'tenant_request',
          message: 'Your maintenance request has been created',
          read: false
        });
      }

      // Insert all notifications if there are any
      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notification')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
          // Continue anyway as the request was created successfully
        }
      }
    }

    // --- Notify Assignee via Edge Function if needed ---
    console.log('[Assignee Email Notify] Checking conditions...');
    if (
      data.assignees && // Only if assignee exists
      requestData?.id && // Ensure request was created
      data.notify_assignee && // Use notify_assignee
      (data.notify_assignee === 'email' || data.notify_assignee === 'both') // Check against notify_assignee
    ) {
      console.log(`[Assignee Email Notify] Condition met. Fetching assignee ID: ${data.assignees}`);
      try {
        // Fetch assignee email and name
        const { data: assignee, error: assigneeFetchError } = await supabase
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', data.assignees)
          .single();

        if (assigneeFetchError) {
          console.error('[Assignee Email Notify] Error fetching assignee profile:', assigneeFetchError);
        } else if (assignee?.email) {
          console.log('[Assignee Email Notify] Assignee details fetched successfully. Email found.');

          // Fetch company name
          const { data: companySettings } = await supabase
            .from('company_settings')
            .select('company_name')
            .eq('companyid', companyMember.company_id)
            .single();
          const company = companySettings?.company_name;
          console.log(`[Assignee Email Notify] Company name fetched: ${company}`);

          // Fetch property address
          let formattedAddress = 'Address not specified';
          if (requestData.property_id) {
            console.log(`[Assignee Email Notify] Fetching property address for property_id: ${requestData.property_id}`);
            try {
              const { data: propertyRecord, error: propertyFetchError } = await supabase
                .from('properties')
                .select('property_settings')
                .eq('id', requestData.property_id)
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
              console.error('[Assignee Email Notify] Error fetching/processing property address:', fetchAddressError);
            }
          }
          console.log(`[Assignee Email Notify] Property address processed: ${formattedAddress}`);

          // Construct email body
          const emailBody = {
            email: assignee.email,
            name: `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim(),
            workOrderId: requestData.nano_id || requestData.id, // Use nano_id if available
            company: company || 'Velloa', // Default company name
            propertyAddress: formattedAddress,
            serviceType: "Tenant Request Assignment", // Specific type for tenant request
            dueDate: requestData.due_date ? new Date(requestData.due_date).toLocaleDateString('en-US') : 'Date not specified'
          };

          console.log('[Assignee Email Notify] Preparing to invoke function...');
          console.log('Invoking notify-assignee-email function with body:', emailBody);
          const { error: funcErr } = await supabase.functions.invoke('notify-assignee-email', {
            body: emailBody,
          });

          if (funcErr) {
            console.error('[Assignee Email Notify] Error invoking function:', funcErr);
          } else {
            console.log('[Assignee Email Notify] Function invoked successfully.');
          }
        } else {
          console.log('[Assignee Email Notify] Exiting because assignee email is missing.');
        }
      } catch (error) {
        console.error('[Assignee Email Notify] Unexpected error during notification process:', error);
      }
    } else {
      console.log('[Assignee Email Notify] Initial condition not met (check assigneeId, requestId, notification selection).');
    }
    // --- END Notify Assignee ---

    return NextResponse.json(processedRequest, { status: 201 });
  } catch (error) {
    console.error('Error in tenant request creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 