'use server';

import { redirect } from 'next/navigation';
import { PeopleTable } from './people-table';
import { createClient } from '@/utils/supabase/server';

interface Unit {
  unit_name: string;
  properties: {
    name: string;
  } | null;
}

interface PersonFromDB {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  status: string | null;
  units: Unit | null;
  move_in_date: string | null;
  insurance: {
    coverage: string;
    provider: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
  } | null;
}

async function getPeople() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      redirect('/login');
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return {
        tenants: [],
        owners: [],
        vendors: [],
        prospects: []
      };
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return {
        tenants: [],
        owners: [],
        vendors: [],
        prospects: []
      };
    }

    // Fetch all people with their roles and unit details
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        company_id,
        move_in_date,
        property_id,
        assignee_id,
        insurance,
        unit_id,
        role,
        status,
        units (
          unit_name,
          properties (
            name
          )
        )
      `)
      .eq('company_id', companyMember.company_id)
      .returns<PersonFromDB[]>();

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      return {
        tenants: [],
        owners: [],
        vendors: [],
        prospects: []
      };
    }

    // Transform the data to include unit details
    const transformedPeople = people.map(person => ({
      ...person,
      unit: person.units ? {
        unit_number: person.units.unit_name,
        property_name: person.units.properties?.name
      } : null
    }));

    // Categorize people by their roles
    const categorizedPeople = {
      tenants: transformedPeople.filter(person => person.role === 'tenant'),
      owners: transformedPeople.filter(person => person.role === 'owner'),
      vendors: transformedPeople.filter(person => person.role === 'vendor'),
      prospects: transformedPeople.filter(person => person.role === 'prospect')
    };

    return categorizedPeople;

  } catch (error) {
    console.error('Error in getPeople:', error);
    return {
      tenants: [],
      owners: [],
      vendors: [],
      prospects: []
    };
  }
}

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold mb-6">People</h1>
      <PeopleTable initialPeople={people} />
    </div>
  );
}
