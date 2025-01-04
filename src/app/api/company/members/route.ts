import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface Profile {
  first_name: string;
  last_name: string;
}

interface CompanyMember {
  id: string;
  profiles: Profile;
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 });
    }

    // Fetch all company members
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select(`
        id,
        profiles (
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyMember.company_id)
      .returns<CompanyMember[]>();

    if (membersError) {
      console.error('Error fetching company members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch company members' }, { status: 500 });
    }

    // Transform the data to match the frontend expectations
    const transformedMembers = members.map(member => ({
      id: member.id,
      first_name: member.profiles.first_name,
      last_name: member.profiles.last_name
    }));

    return NextResponse.json(transformedMembers);
  } catch (error) {
    console.error('Error in company members route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 