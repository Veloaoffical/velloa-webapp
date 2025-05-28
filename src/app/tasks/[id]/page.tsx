import { createClient } from '@/utils/supabase/server';
import React from 'react';
import { TaskDetailsClient } from './TaskDetailsClient';
import { Task, PartsLabourItem, ProcessedNote } from './TaskDetailsClient';

async function getTaskDetails(id: string): Promise<Task> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('Unauthorized');
  }

  const [{ data: task, error: taskError }] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select(`
        *,
        task_status,
        company_members!maintenance_requests_assignees_fkey (
          id,
          profile:profiles (
            first_name,
            last_name
          )
        ),
        property:properties!maintenance_requests_property_id_fkey (
          name
        ),
        unit:units!maintenance_requests_unit_id_fkey (
          unit_name
        )
      `)
      .eq('id', id)
      .single(),
  ]);

  if (taskError) {
    console.error('Error fetching task:', taskError);
    throw new Error('Failed to fetch task');
  }

  if (!task) {
    throw new Error('Task not found');
  }

  const chargeItems: PartsLabourItem[] = [];
  if (Array.isArray(task.charges_id) && task.charges_id.length > 0) {
    for (const chargeObj of task.charges_id) {
      if (!chargeObj?.id) continue;
      const { data: charge, error: chargeError } = await supabase
        .from('charges')
        .select('id, bill_date, charge_amount, amount_remaining, payee, reference')
        .eq('id', chargeObj.id)
        .single();
      if (!chargeError && charge && charge.charge_amount && Array.isArray(charge.charge_amount.lines)) {
        let payeeInfo = null;
        if (charge.payee) {
          const { data: payeePerson, error: payeeError } = await supabase
            .from('people')
            .select('first_name, last_name, middle_name, company')
            .eq('id', charge.payee)
            .single();
          if (!payeeError && payeePerson) {
            payeeInfo = {
              first_name: payeePerson.first_name,
              last_name: payeePerson.last_name,
              middle_name: payeePerson.middle_name,
              company: payeePerson.company,
            };
          }
        }
        for (const line of charge.charge_amount.lines) {
          let accountName = undefined;
          if (line.category) {
            const { data: account, error: accountError } = await supabase
              .from('chart_of_accounts')
              .select('account_name')
              .eq('id', line.category)
              .single();
            if (!accountError && account) {
              accountName = account.account_name;
            }
          }
          let openBalance = undefined;
          if (
            charge.amount_remaining &&
            typeof charge.amount_remaining === 'object' &&
            Array.isArray(charge.amount_remaining.lines)
          ) {
            const found = charge.amount_remaining.lines.find(
              (l: { line_id: string }) => l.line_id === line.line_id
            );
            if (found && typeof found.amount === 'number') {
              openBalance = found.amount;
            }
          }
          chargeItems.push({
            id: line.line_id || line.id || `${charge.id}-${line.category}`,
            description: line.description || '',
            category: line.category,
            billDate: charge.bill_date ? new Date(charge.bill_date) : undefined,
            quantity: line.quantity || '',
            unitPrice: line.unit_price || '',
            total: typeof line.amount === 'number' ? line.amount : 0,
            payee: payeeInfo || undefined,
            account_name: accountName,
            open_balance: openBalance,
            actual_bill_id: charge.id,
            reference: charge.reference,
          });
        }
      }
    }
  } else if (task.charges_id) {
    const { data: charge, error: chargeError } = await supabase
      .from('charges')
      .select('id, bill_date, charge_amount, amount_remaining, payee, reference')
      .eq('id', task.charges_id)
      .single();
    if (!chargeError && charge && charge.charge_amount && Array.isArray(charge.charge_amount.lines)) {
      let payeeInfo = null;
      if (charge.payee) {
        const { data: payeePerson, error: payeeError } = await supabase
          .from('people')
          .select('first_name, last_name, middle_name, company')
          .eq('id', charge.payee)
          .single();
        if (!payeeError && payeePerson) {
          payeeInfo = {
            first_name: payeePerson.first_name,
            last_name: payeePerson.last_name,
            middle_name: payeePerson.middle_name,
            company: payeePerson.company,
          };
        }
      }
      for (const line of charge.charge_amount.lines) {
        let accountName = undefined;
        if (line.category) {
          const { data: account, error: accountError } = await supabase
            .from('chart_of_accounts')
            .select('account_name')
            .eq('id', line.category)
            .single();
          if (!accountError && account) {
            accountName = account.account_name;
          }
        }
        let openBalance = undefined;
        if (
          charge.amount_remaining &&
          typeof charge.amount_remaining === 'object' &&
          Array.isArray(charge.amount_remaining.lines)
        ) {
          const found = charge.amount_remaining.lines.find(
            (l: { line_id: string }) => l.line_id === line.line_id
          );
          if (found && typeof found.amount === 'number') {
            openBalance = found.amount;
          }
        }
        chargeItems.push({
          id: line.line_id || line.id || `${charge.id}-${line.category}`,
          description: line.description || '',
          category: line.category,
          billDate: charge.bill_date ? new Date(charge.bill_date) : undefined,
          quantity: line.quantity || '',
          unitPrice: line.unit_price || '',
          total: typeof line.amount === 'number' ? line.amount : 0,
          payee: payeeInfo || undefined,
          account_name: accountName,
          open_balance: openBalance,
          actual_bill_id: charge.id,
          reference: charge.reference,
        });
      }
    }
  }

  const transformedTask: Task = {
    id: task.id,
    subject: task.subject,
    description: task.description,
    task_status: task.task_status,
    priority: task.priority,
    due_date: task.due_date,
    created_at: task.created_at,
    assignees: task.assignees,
    created_by: task.created_by,
    nano_id: task.nano_id,
    property_id: task.property_id,
    unit_id: task.unit_id,
    tenant_id: task.tenant_id,
    vendor_id: task.vendor_id,
    request_type: task.request_type,
    task_type: task.task_type,
    tenant: task.tenant,
    role: task.role,
    owner_id: task.owner_id,
    property: task.property,
    unit: task.unit,
    assignee: task.company_members ? {
      id: task.company_members.id,
      profile: {
        first_name: task.company_members.profile.first_name,
        last_name: task.company_members.profile.last_name
      }
    } : null,
    Recurring_frequency: task.Recurring_frequency,
    start_date: task.start_date,
    end_date: task.end_date,
    parts_labour: task.parts_labour,
    chargeItems: chargeItems,
  };

  return transformedTask;
}

async function getNotes(taskId: string): Promise<ProcessedNote[]> {
  try {
    const supabase = await createClient();
    
    const { data: notes, error } = await supabase
      .from('maintenance_notes')
      .select(`
        id,
        note_title,
        data,
        created_at,
        maintenance_id,
        created_by:profiles!maintenance_notes_created_by_fkey (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('maintenance_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    if (!notes) return [];

    const typedNotes = notes as unknown as Array<{
      id: string;
      note_title: string | null;
      data: Record<string, unknown> | null;
      created_at: string;
      maintenance_id: string;
      created_by: {
        first_name: string | null;
        middle_name: string | null;
        last_name: string | null;
      };
    }>;

    return typedNotes.map(note => ({
      id: note.id,
      note_title: note.note_title || '',
      note: note.data || '',
      created_at: note.created_at,
      created_by: {
        first_name: note.created_by?.first_name || '',
        middle_name: note.created_by?.middle_name || '',
        last_name: note.created_by?.last_name || ''
      }
    }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

async function getFiles(taskId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return [];
  }
  const { data: files, error } = await supabase
    .from('maintenance_file')
    .select(`
      id,
      file_name,
      file_url,
      file_type,
      file_path,
      file_size,
      created_at,
      profiles!uploaded_by (
        first_name,
        middle_name,
        last_name
      )
    `)
    .eq('maintenance_id', taskId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching files:', error);
    return [];
  }
  return await Promise.all((files || []).map(async file => {
    let profile: unknown = file.profiles;
    if (Array.isArray(profile)) {
      profile = (profile[0] && typeof profile[0] === 'object') ? profile[0] : undefined;
    }
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      profile = { first_name: '', middle_name: '', last_name: '' };
    }
    const { first_name, middle_name, last_name } = profile as { first_name: string; middle_name: string; last_name: string };
    let signedUrl = file.file_url;
    if (file.file_path) {
      const { data } = await supabase.storage
        .from('maintenance_files')
        .createSignedUrl(file.file_path, 60 * 60 * 24 * 7);
      if (data?.signedUrl) {
        signedUrl = data.signedUrl;
      }
    }
    return {
      id: file.id,
      fileName: file.file_name,
      fileUrl: signedUrl,
      fileType: file.file_type || "",
      fileSize: file.file_size || 0,
      createdAt: file.created_at,
      createdBy: {
        first_name,
        middle_name,
        last_name,
      },
    };
  }));
}

async function getPersonName(task: Task): Promise<string> {
  const supabase = await createClient();
  if (task.role === 'tenant_request') {
    if (!task.tenant_id) return 'No Tenant Set';
    const { data: tenants, error } = await supabase
      .from('people')
      .select('id, first_name, last_name')
      .eq('id', task.tenant_id)
      .eq('role', 'tenant');
    if (error) return 'Error loading tenant';
    if (!tenants || tenants.length === 0) return 'Tenant not found';
    const t = tenants[0];
    return [t.first_name, t.last_name].filter(Boolean).join(' ') || t.id;
  } else if (task.role === 'work_order') {
    if (!task.vendor_id) return 'No Vendor Set';
    const { data: vendors, error } = await supabase
      .from('people')
      .select('id, first_name, last_name, company')
      .eq('id', task.vendor_id)
      .eq('role', 'vendor');
    if (error) return 'Error loading vendor';
    if (!vendors || vendors.length === 0) return 'Vendor not found';
    const v = vendors[0];
    const personFullName = [v.first_name, v.last_name].filter(Boolean).join(' ');
    return v.company ? `${v.company}${personFullName ? ` (${personFullName})` : ''}` : personFullName || v.id;
  } else {
    if (!task.owner_id) return 'Not Set';
    const { data: owners, error } = await supabase
      .from('people')
      .select('id, first_name, last_name, company')
      .eq('id', task.owner_id)
      .eq('role', 'owner');
    if (error) return 'Error loading owner';
    if (!owners || owners.length === 0) return 'Owner not found';
    const o = owners[0];
    return [o.first_name, o.last_name].filter(Boolean).join(' ') || o.company || o.id;
  }
}

async function getPersonDetailsById(id: string | null) {
  if (!id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('people')
    .select('id, first_name, last_name, email, phone, company, role')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function getUserCompanyInfo() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return { companyName: null };
  }
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();
  if (companyError || !companyMember?.company_id) {
    return { companyName: null };
  }
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('company_name')
    .eq('companyid', companyMember.company_id)
    .single();
  return {
    companyName: companySettings?.company_name || null,
  };
}

export default async function TaskDetails({ params }: { params: { id: string } }) {
  const { id } = await params;
  const taskDetails = await getTaskDetails(id);
  const notes = await getNotes(id);
  const files = await getFiles(id);
  const personName = await getPersonName(taskDetails);

  const vendorDetails = taskDetails.vendor_id ? await getPersonDetailsById(taskDetails.vendor_id) : null;
  const tenantDetails = taskDetails.tenant_id ? await getPersonDetailsById(taskDetails.tenant_id) : null;

  const { companyName } = await getUserCompanyInfo();

  return (
    <TaskDetailsClient
      initialTaskDetails={taskDetails}
      initialNotes={notes}
      initialFiles={files}
      initialPersonName={personName}
      initialVendorDetails={vendorDetails}
      tenantDetails={tenantDetails}
      userCompanyName={companyName}
    />
  );
} 