import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🚀 ============= LEASE CREATION START =============');
    const supabase = await createClient();

    // Get the authenticated user using getUser() for security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Auth User:', {
      id: user?.id,
      email: user?.email,
      role: user?.role
    });

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug: Check user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('📋 User Profile:', {
      exists: !!profile,
      profile: profile,
      error: profileError
    });

    // Get the company membership directly with user's auth ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('🏢 Company Membership:', {
      exists: !!companyMember,
      data: companyMember,
      error: companyError
    });

    if (companyError || !companyMember) {
      console.error('❌ Error fetching company member:', companyError);
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 });
    }

    const data = await request.json();
    console.log('📥 Received lease data:', JSON.stringify(data, null, 2));

    // Debug: Log the final data being sent to create lease
    const leaseData = {
      property_id: data.property_id,
      unit_id: data.unit_id,
      lease_term: data.lease_type,
      start_date: data.start_date,
      end_date: data.end_date,
      rollover: data.rollover_to_month_to_month,
      tenant_id: data.tenants,
      tenant_portal: data.tenant_portal,
      renter_insurance: data.renters_insurance,
      rent_due: data.first_rent_due_date,
      frequency: data.payment_frequency,
      rent_amount: data.rent_amount,
      rent_advanced: data.additional_charges && data.additional_charges.length > 0,
      rent_advanced_amount: data.additional_charges && data.additional_charges.length > 0 ? data.additional_charges : null,
      schedule_rent_increase: data.rentIncrease ? true : false,
      schedule_rent_increase_amount: data.rentIncrease ? {
        type: data.rentIncrease.type,
        amount: data.rentIncrease.amount,
        date: data.rentIncrease.date
      } : null,
      deposit: data.showSecurityDeposit,
      deposit_amount: data.security_deposit.toString(),
      deposit_advance: data.deposit_charges && data.deposit_charges.length > 0,
      deposit_advance_amount: data.deposit_charges && data.deposit_charges.length > 0 ? data.deposit_charges : null,
      late_fees: data.late_fees.enabled,
      late_fees_type: data.late_fees.policy_type,
      late_fees_custom: data.late_fees.policy_type === 'custom' ? {
        amount: data.late_fees.amount,
        type: data.late_fees.type,
        grace_period_days: data.late_fees.grace_period_days
      } : null,
      created_by: user.id,
      company_id: companyMember.company_id,
      documents: {
        status: data.document_status,
        action: data.document_action,
        signed: data.document_status === 'signed'
      }
    };

    console.log('📝 Attempting to create lease with data:', {
      userId: user.id,
      companyId: companyMember.company_id,
      propertyId: data.property_id
    });

    // Debug: Check RLS policy data directly
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('debug_rls_check', {
        user_id: user.id,
        company_id: companyMember.company_id
      });

    console.log('🔒 RLS Policy Check:', {
      check: rlsCheck,
      error: rlsError
    });

    // Create the lease contract
    const { data: leaseContract, error: leaseError } = await supabase
      .from('lease_contracts')
      .insert([leaseData])
      .select()
      .single();

    if (leaseError) {
      console.error('❌ Error creating lease:', {
        error: leaseError,
        message: leaseError.message,
        details: leaseError.details,
        hint: leaseError.hint,
        code: leaseError.code
      });
      return NextResponse.json({ 
        error: 'Failed to create lease',
        details: leaseError.message
      }, { status: 500 });
    }

    console.log('✅ Lease created successfully:', leaseContract);

    // If there are documents, upload them
    if (data.additional_documents && data.additional_documents.length > 0) {
      console.log('Processing additional documents...');
      for (const document of data.additional_documents) {
        // Upload file to Supabase Storage
        const fileName = `${leaseContract.id}/${document.name}`;
        const { error: uploadError } = await supabase.storage
          .from('lease-documents')
          .upload(fileName, document);

        if (uploadError) {
          console.error('Error uploading document:', {
            error: uploadError,
            fileName: fileName
          });
          continue;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('lease-documents')
          .getPublicUrl(fileName);

        // Create document record
        const { error: docError } = await supabase
          .from('lease_documents')
          .insert([{
            leases_id: leaseContract.id,
            file_url: publicUrl,
            file_name: document.name,
            file_type: document.type,
            uploaded_by: user.id,
            file_path: fileName,
            status: data.document_status,
            is_signed: data.document_status === 'signed'
          }]);

        if (docError) {
          console.error('Error creating document record:', docError);
        }
      }
    }

    return NextResponse.json({
      message: 'Lease created successfully',
      lease: leaseContract
    });

  } catch (error) {
    console.error('❌ Unexpected error in lease creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    console.log('🏁 ============= LEASE CREATION END =============');
  }
}

export const dynamic = 'force-dynamic';

interface Property {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
}

interface Unit {
  unit_id: string;
  unit_name: string;
}

interface LeaseContract {
  id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  rent_amount: string | null;
  lease_term: string | null;
  deposit_amount: string | null;
  property: Property | null;
  unit: Unit | null;
  tenant_id: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Fetch leases with related data
    const { data: leases, error: leasesError } = await supabase
      .from('lease_contracts')
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        rent_amount,
        lease_term,
        deposit_amount,
        property:properties!lease_contracts_property_id_fkey (
          id,
          name,
          address_line_1,
          address_line_2,
          city,
          state,
          zip
        ),
        unit:units!lease_contracts_unit_id_fkey (
          unit_id,
          unit_name
        ),
        tenant_id
      `)
      .eq('company_id', companyMember.company_id)
      .order('created_at', { ascending: false })
      .returns<LeaseContract[]>();

    if (leasesError) {
      console.error('Error fetching leases:', leasesError);
      return NextResponse.json({ error: 'Failed to fetch leases' }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedLeases = leases.map(lease => ({
      id: lease.id,
      created_at: lease.created_at,
      property: {
        name: lease.property?.name || 'Unknown Property',
        address: [
          lease.property?.address_line_1,
          lease.property?.address_line_2,
          [lease.property?.city, lease.property?.state, lease.property?.zip].filter(Boolean).join(', ')
        ].filter(Boolean).join(', ')
      },
      unit: {
        unit_number: lease.unit?.unit_name || 'Unknown Unit'
      },
      tenant: lease.tenant_id ? JSON.parse(lease.tenant_id)[0] : null,
      start_date: lease.start_date,
      end_date: lease.end_date,
      rent_amount: lease.rent_amount || '0',
      lease_term: lease.lease_term,
      deposit_amount: lease.deposit_amount || '0'
    }));

    return NextResponse.json(transformedLeases);
  } catch (error) {
    console.error('Error in leases route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 