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
      company_id: companyMember.company_id
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
            file_path: fileName
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