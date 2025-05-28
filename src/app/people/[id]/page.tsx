import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { PersonDetailsClient } from './components/PersonDetailsClient';

// --- Define and Export necessary types ---

export interface PropertyImage {
  id: string;
  fileUrl: string; // Assuming fileUrl field based on usage
  fileName: string;
  createdAt: string;
  favorite: boolean;
  isFavorite: boolean; // Note: Seems redundant with favorite
  listing_favorite_image?: boolean; // Optional based on schema
}

export interface PropertyDetails {
  id: string;
  name: string;
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  property_images?: PropertyImage[];
}

export interface UnitImage {
    id: string;
    fileUrl: string; // Assuming fileUrl field
    fileName: string;
    createdAt: string;
    favorite: boolean;
    isFavorite: boolean; // Note: Seems redundant with favorite
}

export interface UnitDetails {
  id: string;
  unit_name: string;
  beds: number;
  baths: number;
  market_rent: number;
  size: number;
  status: string;
  property_id: string;
  created_at: string;
  property?: {
    name: string;
    address_line_1: string;
    city: string;
    state: string;
    zip: string;
  };
  unit_images?: UnitImage[];
}

export interface AssigneeDetails {
  id: string;
  first_name: string;
  last_name: string;
}

export interface VendorServiceAddress {
  type: 'all' | 'specific';
  property_ids?: string[];
}

export interface LeaseContract {
  id: string;
  tenant_portal: boolean;
  start_date?: string;
  end_date?: string;
  insurance?: {
    coverage: string;
    provider: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
  };
  // Add other lease contract fields as needed
}

// --- Define Residence Info Type ---
export interface ResidenceInfo {
  address?: {
    city?: string;
    street?: string;
    province?: string;
    postal_code?: string;
  };
  monthly_rent?: number | null;
  landlord_name?: string;
  landlord_email?: string;
  landlord_phone?: string;
  no_past_residence?: boolean;
  reason_for_leaving?: string;
  residential_status?: string; // Added from user JSON example
  // Fields for current residence
  move_in_date?: string | null;
  // Fields for previous residence
  length_of_stay_years?: number | null;
  length_of_stay_months?: number | null;
}

// Update PersonDetails interface to include ALL fields (general + rental application)
export interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  company?: string; // Optional company name field
  property_id: string; 
  unit_id: string | null;
  role: string;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
  agreement_start: string | null;
  agreement_end: string | null;
  portal_status: boolean;
  service_address?: string | VendorServiceAddress; 
  // --- Rental Application Fields --- (Add fields previously in RentalApplicationData)
  middle_name?: string | null; // Optional if not always present
  ssn?: string; // Optional/sensitive
  drivers_license_state?: string;
  drivers_license_number?: string;
  date_of_birth?: string | null;
  gender?: string;
  marital_status?: string;
  about_you?: string;
  credit_score?: number;
  criminal_check?: 'pending' | 'completed' | 'failed';
  employment_check?: 'pending' | 'completed' | 'failed';
  eviction_check?: 'pending' | 'completed' | 'failed';
  rental_history_check?: 'pending' | 'completed' | 'failed';
  property_name?: string; // Potentially redundant if unitDetails is fetched
  property_address?: string | null; // Allow null
  unit_number?: string | null; // Allow null
  unit_type?: string; // Potentially redundant if unitDetails is fetched
  monthly_rent?: number | null; // Allow null
  property_image?: string; // Potentially redundant if unitDetails is fetched
  property_availability_date?: string; // Potentially redundant if unitDetails is fetched
  // Nested Objects and prospect_property
  prospect_property?: Array<{ listing_id: string }> | string | null;
  // -- Nested Objects -- 
  insurance?: { 
    coverage: string;
    provider: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
  };
  services?: { 
    categories: string[];
    classifications: string[];
  };
  unit?: { // General unit info
    unit_number: string; 
    property_name?: string;
  } | null;
  address_info?: { // General address info
    primary?: { street?: string; city?: string; province?: string; postalCode?: string; country?: string; };
    secondary?: { street?: string; city?: string; province?: string; postalCode?: string; country?: string; } | null;
  };
  payments_settings?: { 
    enabled: boolean; method?: 'email' | 'mail_check'; billing_email?: string;
  };
  // Rental Application Specific Nested Objects (Ensure these are fetched by Supabase query)
  residence?: ResidenceInfo[]; // UPDATED: Now an array of ResidenceInfo
  pets?: Array<{
    age: string;
    type: string;
    breed: string;
    gender: string;
    weight: string;
    photo_url?: string;
  }>;
  vehicles?: Array<{
    make: string;
    year: string;
    color: string;
    model: string;
    state: string;
    licensePlate: string;
  }>;
  dependents?: Array<{
    age: string;
    lastName: string;
    firstName: string;
    middleName: string;
    relationship: string;
    // Add optional fields used in PersonRentalApplication component
    type?: 'adult' | 'child' | 'spouse' | 'sibling' | 'parent' | 'partner' | 'roommate' | 'friend' | 'relative' | 'other' | string;
    email?: string;
    phone?: string;
    shareOfRent?: string;
  }>;
  // Add optional cosigner field
  cosigner?: Array<{
    firstName?: string;
    lastName?: string;
    middleName?: string;
    relationship?: string;
    email?: string;
    phone?: string;
  }>;
  employment?: Array<{
    address?: { 
      city?: string;
      street?: string;
      province?: string;
      postal_code?: string;
    };
    job_title?: string;
    employer_name?: string;
    monthly_income?: number;
    employment_type?: string;
    supervisor_name?: string;
    supervisor_phone?: string;
    employment_start_date?: string;
    proof_of_income_file_url?: string | null;
    verification_document_url?: string | null;
  }>;
  income?: {
    alimony?: number;
    other_income?: number;
    child_support?: number;
    employment_income?: number;
    investment_income?: number;
    retirement_income?: number;
    other_income_source?: string;
    government_assistance?: number;
    household_income?: number | null;
  };
  // Add custom_question_answers field
  custom_question_answers?: Array<{
    id: number;
    question: string;
    answer: string | boolean | number | null; // Allow various answer types
    answerType: 'Yes/No' | 'Text' | 'Number' | 'Date' | string; // Allow known types + string
  }>;
  // Add consent_check field
  consent_check?: {
    velloa_terms?: { agreed?: boolean; timestamp?: string };
    property_terms?: { agreed?: boolean; timestamp?: string };
    information_accuracy?: { agreed?: boolean; timestamp?: string };
  };
  // Add lease contract for tenants
  lease_contract?: LeaseContract;
}

// Update GetPersonDataResult to use the comprehensive PersonDetails
type GetPersonDataResult = {
  personDetails: PersonDetails; // Now comprehensive
  userRole: string;
  assigneeDetails: AssigneeDetails | null;
  properties: PropertyDetails[] | null;
  unitDetails: UnitDetails | null;
  serviceAddress: VendorServiceAddress | null; 
  initialNotes: ProcessedPersonNote[];
  initialFiles: PersonFile[]; // Add files to the result
  workOrders: WorkOrder[]; // Add work orders to the result
  billingItems: BillingItem[]; // Add billing items to the result
  outstandingBalance: number; // Add outstanding balance to the result
};

export interface ProcessedPersonNote {
  id: string;
  note_title: string;
  note: string | Record<string, unknown>;
  created_at: string;
  created_by: {
    first_name: string;
    middle_name: string;
    last_name: string;
  };
}

export interface PersonFile {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  fileSize: number;
}

export interface WorkOrder {
  id: string;
  subject: string;
  description: string;
  task_status?: Record<string, { date: string | null; value: boolean | null }>;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: string;
  vendor_id: string | null;
  vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  } | null;
  active_status: string;
}

// Add BillingItem interface to match the component expectations
export interface BillingItem {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  open_balance: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  bill_date: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  type: 'rent' | 'utilities' | 'maintenance' | 'late_fee' | 'deposit' | 'other';
  account_name: string;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
}

// Function to calculate outstanding balance
async function calculateOutstandingBalance(personId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('charges')
      .select('amount_remaining, status, charge_type')
      .eq('people_id', personId)
      .in('status', ['unpaid', 'partially_paid']);

    if (error) {
      console.error('Error fetching charges:', error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Sum up all the total_amount values from amount_remaining
    const totalOutstanding = data.reduce((sum, charge) => {
      if (charge.amount_remaining && typeof charge.amount_remaining === 'object') {
        const remaining = charge.amount_remaining as { total_amount?: number };
        const amount = remaining.total_amount || 0;
        // Only count positive amounts (outstanding balances)
        return sum + Math.max(0, amount);
      }
      return sum;
    }, 0);

    return totalOutstanding;
  } catch (error) {
    console.error('Error calculating outstanding balance:', error);
    return 0;
  }
}

// Function to fetch billing items for a person
async function getPersonBilling(personId: string): Promise<BillingItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return [];
    }

    const { data: charges, error } = await supabase
      .from('charges')
      .select(`
        id,
        charge_amount,
        amount_remaining,
        status,
        bill_date,
        due_date,
        created_at,
        memo,
        reference,
        charge_type,
        property:properties!property_id (
          name
        ),
        unit:units!unit_id (
          unit_name
        ),
        people:people!people_id (
          first_name,
          last_name
        )
      `)
      .eq('people_id', personId)
      .order('bill_date', { ascending: false });

    if (error) {
      console.error('Error fetching billing items:', error);
      return [];
    }

    // Extract all category IDs from charges to fetch account names in batch
    const categoryIds = new Set<string>();
    (charges || []).forEach(charge => {
      if (charge.charge_amount && typeof charge.charge_amount === 'object') {
        const chargeAmountData = charge.charge_amount as { lines?: Array<{ category?: string }> };
        if (chargeAmountData.lines && Array.isArray(chargeAmountData.lines)) {
          chargeAmountData.lines.forEach(line => {
            if (line.category) {
              categoryIds.add(line.category);
            }
          });
        }
      }
    });

    // Fetch account names for all categories in batch
    const categoryMap = new Map<string, string>();
    if (categoryIds.size > 0) {
      // Try chart_of_accounts first
      const { data: accounts, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name')
        .in('id', Array.from(categoryIds));

      if (!accountsError && accounts) {
        accounts.forEach(account => {
          categoryMap.set(account.id, account.account_name);
        });
      }

      // For any remaining categories, try chart_of_sub_accounts
      const remainingIds = Array.from(categoryIds).filter(id => !categoryMap.has(id));
      if (remainingIds.length > 0) {
        const { data: subAccounts, error: subAccountsError } = await supabase
          .from('chart_of_sub_accounts')
          .select('id, account_name')
          .in('id', remainingIds);

        if (!subAccountsError && subAccounts) {
          subAccounts.forEach(account => {
            categoryMap.set(account.id, account.account_name);
          });
        }
      }
    }

    return (charges || []).map(charge => {
      // Extract amount from total_amount in charge_amount
      const chargeAmountData = charge.charge_amount as { total_amount?: number; lines?: Array<{ category?: string; description?: string }> };
      const chargeAmount = chargeAmountData?.total_amount || 0;
      
      // Extract open balance from total_amount in amount_remaining
      const amountRemainingData = charge.amount_remaining as { total_amount?: number };
      const amountRemaining = amountRemainingData?.total_amount || 0;
      
      // Get account name from category
      let accountName = 'Unknown';
      if (chargeAmountData?.lines && Array.isArray(chargeAmountData.lines) && chargeAmountData.lines.length > 0) {
        const categoryId = chargeAmountData.lines[0].category;
        if (categoryId && categoryMap.has(categoryId)) {
          accountName = categoryMap.get(categoryId) || 'Unknown';
        }
      }

      // Get property and unit data
      const propertyData = Array.isArray(charge.property) ? charge.property[0] : charge.property;
      const unitData = Array.isArray(charge.unit) ? charge.unit[0] : charge.unit;
      
      // Determine charge type
      const chargeType = charge.charge_type || 'other';
      let billingType: 'rent' | 'utilities' | 'maintenance' | 'late_fee' | 'deposit' | 'other' = 'other';
      
      if (chargeType.toLowerCase().includes('rent')) billingType = 'rent';
      else if (chargeType.toLowerCase().includes('utilities') || chargeType.toLowerCase().includes('utility')) billingType = 'utilities';
      else if (chargeType.toLowerCase().includes('maintenance') || chargeType.toLowerCase().includes('repair')) billingType = 'maintenance';
      else if (chargeType.toLowerCase().includes('late') || chargeType.toLowerCase().includes('fee')) billingType = 'late_fee';
      else if (chargeType.toLowerCase().includes('deposit')) billingType = 'deposit';

      // Extract description from charge_amount lines or fallback to memo
      let description = chargeType || 'Charge';
      if (chargeAmountData?.lines && Array.isArray(chargeAmountData.lines) && chargeAmountData.lines.length > 0) {
        description = chargeAmountData.lines[0].description || description;
      } else if (charge.memo && typeof charge.memo === 'object' && (charge.memo as { description?: string }).description) {
        description = (charge.memo as { description?: string }).description;
      } else if (charge.memo && typeof charge.memo === 'string') {
        description = charge.memo;
      }

      return {
        id: charge.id,
        invoice_number: charge.reference || `INV-${charge.id.slice(-8).toUpperCase()}`,
        description,
        amount: chargeAmount,
        open_balance: amountRemaining,
        status: charge.status === 'paid' ? 'paid' as const : 
                charge.status === 'draft' ? 'draft' as const :
                amountRemaining === 0 ? 'paid' as const :
                new Date(charge.due_date || charge.bill_date) < new Date() ? 'overdue' as const : 'pending' as const,
        bill_date: charge.bill_date || charge.created_at,
        due_date: charge.due_date,
        paid_date: charge.status === 'paid' ? charge.created_at : null,
        created_at: charge.created_at,
        type: billingType,
        account_name: accountName,
        property: propertyData ? { name: propertyData.name } : null,
        unit: unitData ? { unit_name: unitData.unit_name } : null
      };
    });
  } catch (error) {
    console.error('Error fetching billing items:', error);
    return [];
  }
}

// Function to fetch work orders for a person
async function getPersonWorkOrders(personId: string): Promise<WorkOrder[]> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return [];
    }

    // Query for all maintenance requests where the person is involved as tenant, vendor, or assignee
    const { data: workOrders, error } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        subject,
        description,
        task_status,
        priority,
        due_date,
        created_at,
        assignees,
        created_by,
        nano_id,
        property_id,
        unit_id,
        request_type,
        task_type,
        tenant_id,
        role,
        vendor_id,
        active_status,
        property:properties!property_id (
          name
        ),
        unit:units!unit_id (
          unit_name
        ),
        assignee:company_members!maintenance_requests_assignees_fkey (
          id,
          profile:profiles (
            first_name,
            last_name
          )
        ),
        vendor:people!maintenance_requests_vendor_id_fkey (
          id,
          first_name,
          last_name,
          company
        ),
        tenant:people!maintenance_requests_tenant_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .or(`tenant_id.eq.${personId},assignees.eq.${personId},vendor_id.eq.${personId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      return [];
    }

    return (workOrders || []).map(workOrder => {
      // Process property data
      const propertyData = Array.isArray(workOrder.property) ? 
        (workOrder.property.length > 0 ? workOrder.property[0] : null) : 
        workOrder.property;

      // Process unit data  
      const unitData = Array.isArray(workOrder.unit) ? 
        (workOrder.unit.length > 0 ? workOrder.unit[0] : null) : 
        workOrder.unit;

      // Process assignee data
      let assigneeData = null;
      if (workOrder.assignee && Array.isArray(workOrder.assignee) && workOrder.assignee.length > 0) {
        const assignee = workOrder.assignee[0];
        if (assignee && assignee.profile) {
          const profile = Array.isArray(assignee.profile) ? 
            (assignee.profile.length > 0 ? assignee.profile[0] : { first_name: '', last_name: '' }) : 
            assignee.profile;
          assigneeData = {
            id: assignee.id,
            profile: profile,
          };
        }
      }

      // Process vendor data
      const vendorData = Array.isArray(workOrder.vendor) && workOrder.vendor.length > 0 ? 
        workOrder.vendor[0] : 
        (workOrder.vendor && !Array.isArray(workOrder.vendor) ? workOrder.vendor : null);

      return {
      id: workOrder.id,
      subject: workOrder.subject || '',
      description: workOrder.description || '',
      task_status: workOrder.task_status,
      priority: workOrder.priority || 'medium',
      due_date: workOrder.due_date,
      created_at: workOrder.created_at,
      assignees: workOrder.assignees,
      created_by: workOrder.created_by,
      nano_id: workOrder.nano_id,
      property_id: workOrder.property_id,
      unit_id: workOrder.unit_id,
      request_type: workOrder.request_type,
      task_type: workOrder.task_type,
      tenant: workOrder.tenant_id,
        property: propertyData,
        unit: unitData,
        assignee: assigneeData,
      role: workOrder.role || 'work_order',
      vendor_id: workOrder.vendor_id,
        vendor: vendorData,
        active_status: workOrder.active_status || 'active',
      };
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return [];
  }
}

// Function to fetch person files
async function getPersonFiles(personId: string): Promise<PersonFile[]> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return [];
    }
    const { data: files, error } = await supabase
      .from('people_files')
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
      .eq('people_id', personId)
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
          .from('people_files')
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
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Function to fetch person notes
async function getPersonNotes(personId: string): Promise<ProcessedPersonNote[]> {
  try {
    const supabase = await createClient();
    
    const { data: notes, error } = await supabase
      .from('people_notes')
      .select(`
        id,
        note_title,
        data,
        created_at,
        people_id,
        created_by:profiles!people_notes_created_by_fkey (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('people_id', personId)
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
      people_id: string;
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

// Function to fetch all person data
async function getPersonData(personId: string): Promise<GetPersonDataResult> {
  const supabase = await createClient();
  
  // Fetch person details
  const { data: personData, error: personError } = await supabase
    .from('people')
    .select('*')
    .eq('id', personId)
    .single();
  
  if (personError || !personData) {
    console.error('Error fetching person details:', personError);
    notFound();
  }
  
  // Get user role from authenticated user data
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error fetching authenticated user:', userError);
  }
  const userRole = userData?.user?.user_metadata?.role || 'user';
  
  // Fetch assignee details if available
  let assigneeDetails: AssigneeDetails | null = null;
  if (personData.assignee_id) {
    const { data: assigneeData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', personData.assignee_id)
      .single();
    
    assigneeDetails = assigneeData as AssigneeDetails;
  }
  
  // Fetch related properties based on role
  let properties: PropertyDetails[] | null = null;
  let unitDetails: UnitDetails | null = null;
  let serviceAddress: VendorServiceAddress | null = null;
  
  // Fetch lease contract for tenants
  if (personData.role === 'tenant') {
    const { data: leaseContracts } = await supabase
      .from('lease_contracts')
      .select('id, tenant_portal, insurance, start_date, end_date')
      .filter('tenant_id', 'cs', JSON.stringify([{ id: personId }]));
    
    if (leaseContracts && leaseContracts.length > 0) {
      personData.lease_contract = leaseContracts[0] as LeaseContract;
    }
  }
  
  if (personData.role === 'owner') {
    // Fetch properties for owner
    const { data: ownerProperties } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', personId);
    
    properties = ownerProperties as PropertyDetails[];
  } else if (personData.role === 'vendor') {
    // Fetch service address for vendor
    serviceAddress = typeof personData.service_address === 'object' 
      ? personData.service_address as VendorServiceAddress
      : { type: 'all' };
      
    // If vendor has specific properties
    if (serviceAddress.type === 'specific' && serviceAddress.property_ids?.length) {
      const { data: vendorProperties } = await supabase
        .from('properties')
        .select('*')
        .in('id', serviceAddress.property_ids);
      
      properties = vendorProperties as PropertyDetails[];
    }
  } else if (personData.role === 'prospect' && personData.unit_id) {
    // Fetch unit details for prospect
    const { data: prospectUnit } = await supabase
      .from('units')
      .select('*, property:properties(name, address_line_1, city, state, zip)')
      .eq('id', personData.unit_id)
      .single();
    
    unitDetails = prospectUnit as UnitDetails;
  }
  
  // Fetch person notes
  const initialNotes = await getPersonNotes(personId);
  
  // Fetch person files
  const initialFiles = await getPersonFiles(personId);
  
  // Fetch work orders
  const workOrders = await getPersonWorkOrders(personId);
  
  // Fetch billing items
  const billingItems = await getPersonBilling(personId);
  
  // Fetch outstanding balance
  const outstandingBalance = await calculateOutstandingBalance(personId);
  
  return {
    personDetails: personData as PersonDetails,
    userRole,
    assigneeDetails,
    properties,
    unitDetails,
    serviceAddress,
    initialNotes,
    initialFiles,
    workOrders,
    billingItems,
    outstandingBalance
  };
}

// Main Page Component
export default async function PersonDetailsPage({ params }: { params: { id: string } }) {
  // Await params before accessing its properties
  const awaitedParams = await params;
  const personId = awaitedParams.id;

  // Fetch comprehensive person data using the awaited id
  const { personDetails, userRole, assigneeDetails, properties, unitDetails, serviceAddress, initialNotes, initialFiles, workOrders, billingItems, outstandingBalance } = await getPersonData(personId);

  return (
    <PersonDetailsClient
      personDetails={personDetails} // Pass the comprehensive object
      userRole={userRole}
      personId={personId} // Pass the awaited id
      assigneeDetails={assigneeDetails}
      properties={properties}
      unitDetails={unitDetails}
      serviceAddress={serviceAddress}
      initialNotes={initialNotes}
      initialFiles={initialFiles}
      workOrders={workOrders}
      billingItems={billingItems}
      outstandingBalance={outstandingBalance}
    />
  );
} 