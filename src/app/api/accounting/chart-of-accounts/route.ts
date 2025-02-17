import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'

interface CheckData {
  transit_number?: string;
  institution_number?: string;
  account_number?: string;
  next_check_number?: string;
  account_owner_name?: string;
  bank_contact_info?: string;
}

export async function GET() {
  try {
    console.log('🚀 ============= CHART OF ACCOUNTS FETCH START =============');
    const supabase = await createClient();

    // Get the authenticated user
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

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
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

    // Get all accounts with their sub-accounts
    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select(`
        id,
        account_type,
        account_subtype,
        account_name,
        account_description,
        active_account,
        sub_account,
        accounting_start_date,
        account_balance,
        property_balance,
        is_for_lease_charges,
        is_for_deposits,
        default_memo,
        check_printing,
        check_data,
        created_by,
        company_id,
        created_at
      `)
      .eq('company_id', companyMember.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching accounts:', {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { error: 'Failed to fetch accounts', details: error.message },
        { status: 400 }
      );
    }

    // Get all sub-accounts
    const { data: subAccounts, error: subError } = await supabase
      .from('chart_of_sub_accounts')
      .select('*')
      .eq('company_id', companyMember.company_id);

    if (subError) {
      console.error('❌ Error fetching sub-accounts:', subError);
      return NextResponse.json(
        { error: 'Failed to fetch sub-accounts', details: subError.message },
        { status: 400 }
      );
    }

    // Combine the data
    const combinedAccounts = [...accounts, ...subAccounts.map(sub => ({
      ...sub,
      is_sub_account: true
    }))];

    console.log('✅ Accounts fetched successfully:', combinedAccounts.length);
    return NextResponse.json(combinedAccounts);

  } catch (error) {
    console.error('❌ Unexpected error in accounts fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    console.log('🏁 ============= CHART OF ACCOUNTS FETCH END =============');
  }
}

export async function POST(req: Request) {
  try {
    console.log('🚀 ============= CHART OF ACCOUNTS CREATION START =============');
    const supabase = await createClient();
    const data = await req.json();

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

    console.log('📥 Received account data:', JSON.stringify(data, null, 2));

    // Format check_data if check printing is enabled
    const check_data: CheckData | null = data.check_printing_enabled ? {
      transit_number: data.transit_number,
      institution_number: data.institution_number,
      account_number: data.account_number,
      next_check_number: data.next_check_number,
      account_owner_name: data.account_owner_name,
      bank_contact_info: data.bank_contact_info
    } : null;

    // Format property balances
    console.log('📥 Raw property data:', data.propertyBalances);
    
    const property_balance = Array.isArray(data.propertyBalances) && data.propertyBalances.length > 0
      ? data.propertyBalances.map((pb: { property_id: string; property_name: string; balance: string | number }) => ({
          property_id: pb.property_id,
          property_name: pb.property_name,
          balance: typeof pb.balance === 'string' ? parseFloat(pb.balance) : pb.balance
        }))
      : [];

    // Add more detailed logging
    console.log('📊 Property Balances:', {
      raw: data.propertyBalances,
      formatted: property_balance,
      isArray: Array.isArray(data.propertyBalances),
      length: data.propertyBalances?.length,
      firstItem: data.propertyBalances?.[0]
    });

    // Debug: Log RLS policy data directly
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('debug_rls_check', {
        user_id: user.id,
        company_id: companyMember.company_id
      });

    console.log('🔒 RLS Policy Check:', {
      check: rlsCheck,
      error: rlsError
    });

    // If it's a sub-account, create it in the sub-accounts table only
    if (data.is_sub_account) {
      console.log('📝 Creating sub-account...');
      // Create sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .insert({
          account_type: data.type,
          account_subtype: data.subtype,
          account_name: data.name,
          account_description: data.description,
          active_account: data.is_active,
          sub_account: data.is_sub_account,
          parent_account: data.parent_account_id,
          accounting_start_date: data.opening_balance_date,
          account_balance: data.opening_balance?.toString(),
          property_balance: property_balance,
          is_for_lease_charges: data.lease_integration,
          is_for_deposits: data.auto_post_rent,
          default_memo: data.auto_post_fees,
          check_printing: data.check_printing_enabled,
          check_data: check_data,
          created_by: user.id,
          company_id: companyMember.company_id
        })
        .select()
        .single();

      if (subAccountError || !subAccount?.id) {
        console.error('❌ Error creating sub-account:', {
          error: subAccountError,
          message: subAccountError?.message,
          details: subAccountError?.details,
          hint: subAccountError?.hint,
          code: subAccountError?.code,
          subAccount: subAccount
        });
        return NextResponse.json(
          { error: 'Failed to create sub-account', details: subAccountError?.message || 'No sub-account ID returned' },
          { status: 400 }
        );
      }

      console.log('✅ Sub-account created successfully:', {
        id: subAccount.id,
        name: subAccount.account_name
      });

      return NextResponse.json({ message: 'Sub-account created successfully', id: subAccount.id });
    }

    console.log('📝 Creating main account...');
    // If it's not a sub-account, create in the main accounts table
    const { error: mainAccountError } = await supabase
      .from('chart_of_accounts')
      .insert({
        account_type: data.type,
        account_subtype: data.subtype,
        account_name: data.name,
        account_description: data.description,
        active_account: data.is_active,
        sub_account: data.is_sub_account,
        accounting_start_date: data.opening_balance_date,
        account_balance: data.opening_balance?.toString(),
        property_balance: property_balance,
        is_for_lease_charges: data.lease_integration,
        is_for_deposits: data.auto_post_rent,
        default_memo: data.auto_post_fees,
        check_printing: data.check_printing_enabled,
        check_data: check_data,
        created_by: user.id,
        company_id: companyMember.company_id,
        sub_account_id: null  // Explicitly set to null for regular accounts
      });

    if (mainAccountError) {
      console.error('❌ Error creating account:', {
        error: mainAccountError,
        message: mainAccountError.message,
        details: mainAccountError.details,
        hint: mainAccountError.hint,
        code: mainAccountError.code
      });
      return NextResponse.json(
        { error: 'Failed to create account', details: mainAccountError.message },
        { status: 400 }
      );
    }

    console.log('✅ Account created successfully');
    return NextResponse.json({ message: 'Account created successfully' });

  } catch (error) {
    console.error('❌ Unexpected error in account creation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    console.log('🏁 ============= CHART OF ACCOUNTS CREATION END =============');
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🚀 ============= CHART OF ACCOUNTS UPDATE START =============');
    const supabase = await createClient();
    const { id, ...data } = await request.json();

    // Get the authenticated user
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

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('❌ Error fetching company member:', companyError);
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 });
    }

    // Check if it's a sub-account
    const { data: existingAccount } = await supabase
      .from('chart_of_accounts')
      .select('sub_account_id')
      .eq('id', id)
      .eq('company_id', companyMember.company_id)
      .single();

    if (existingAccount?.sub_account_id) {
      console.log('📝 Updating sub-account...');
      // Update sub-account
      const { error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .update({
          account_type: data.type,
          account_subtype: data.subtype,
          account_name: data.name,
          account_description: data.description,
          active_account: data.is_active,
          accounting_start_date: data.opening_balance_date,
          account_balance: data.opening_balance?.toString(),
          property_balance: data.property_balance,
          is_for_lease_charges: data.lease_integration,
          is_for_deposits: data.auto_post_rent,
          default_memo: data.auto_post_fees,
          check_printing: data.check_printing_enabled,
          check_data: data.check_data
        })
        .eq('id', existingAccount.sub_account_id)
        .eq('company_id', companyMember.company_id);

      if (subAccountError) {
        console.error('❌ Error updating sub-account:', {
          error: subAccountError,
          message: subAccountError.message,
          details: subAccountError.details,
          hint: subAccountError.hint,
          code: subAccountError.code
        });
        return NextResponse.json(
          { error: 'Failed to update sub-account', details: subAccountError.message },
          { status: 400 }
        );
      }
    }

    console.log('📝 Updating main account...');
    // Update main account
    const { error: mainAccountError } = await supabase
      .from('chart_of_accounts')
      .update({
        account_type: data.type,
        account_subtype: data.subtype,
        account_name: data.name,
        account_description: data.description,
        active_account: data.is_active,
        accounting_start_date: data.opening_balance_date,
        account_balance: data.opening_balance?.toString(),
        property_balance: data.property_balance,
        is_for_lease_charges: data.lease_integration,
        is_for_deposits: data.auto_post_rent,
        default_memo: data.auto_post_fees,
        check_printing: data.check_printing_enabled,
        check_data: data.check_data
      })
      .eq('id', id)
      .eq('company_id', companyMember.company_id);

    if (mainAccountError) {
      console.error('❌ Error updating account:', {
        error: mainAccountError,
        message: mainAccountError.message,
        details: mainAccountError.details,
        hint: mainAccountError.hint,
        code: mainAccountError.code
      });
      return NextResponse.json(
        { error: 'Failed to update account', details: mainAccountError.message },
        { status: 400 }
      );
    }

    console.log('✅ Account updated successfully');
    return NextResponse.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('❌ Unexpected error in account update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    console.log('🏁 ============= CHART OF ACCOUNTS UPDATE END =============');
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('🚀 ============= CHART OF ACCOUNTS DELETE START =============');
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Get the authenticated user
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

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('❌ Error fetching company member:', companyError);
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Check if it's a sub-account
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('sub_account_id')
      .eq('id', id)
      .eq('company_id', companyMember.company_id)
      .single();

    if (account?.sub_account_id) {
      console.log('📝 Deleting sub-account...');
      // Delete sub-account first
      const { error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .delete()
        .eq('id', account.sub_account_id)
        .eq('company_id', companyMember.company_id);

      if (subAccountError) {
        console.error('❌ Error deleting sub-account:', {
          error: subAccountError,
          message: subAccountError.message,
          details: subAccountError.details,
          hint: subAccountError.hint,
          code: subAccountError.code
        });
        return NextResponse.json(
          { error: 'Failed to delete sub-account', details: subAccountError.message },
          { status: 400 }
        );
      }
    }

    console.log('📝 Deleting main account...');
    // Delete main account
    const { error: mainAccountError } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', id)
      .eq('company_id', companyMember.company_id);

    if (mainAccountError) {
      console.error('❌ Error deleting account:', {
        error: mainAccountError,
        message: mainAccountError.message,
        details: mainAccountError.details,
        hint: mainAccountError.hint,
        code: mainAccountError.code
      });
      return NextResponse.json(
        { error: 'Failed to delete account', details: mainAccountError.message },
        { status: 400 }
      );
    }

    console.log('✅ Account deleted successfully');
    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ Unexpected error in account deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    console.log('🏁 ============= CHART OF ACCOUNTS DELETE END =============');
  }
}

export const dynamic = 'force-dynamic'; 