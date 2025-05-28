import { createClient } from '@/utils/supabase/server';
import { Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PeopleClient } from './people-client';

function ErrorAlert({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  )
}

interface SearchParams {
  search?: string;
  role?: string;
  status?: string;
  property?: string;
  assignee?: string;
  page?: string;
  limit?: string;
}

async function fetchPeople(searchParams: SearchParams = {}) {
  const supabase = await createClient();

  try {
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      throw new Error('Failed to get company');
    }

    // Start building the query
    let query = supabase
      .from('people')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        company_id,
        property_id,
        unit_id,
        role,
        status,
        expected_move_in_date,
        assignee_id
      `)
      .eq('company_id', companyMember.company_id);

    // Apply search filter (name or email)
    if (searchParams.search) {
      const searchTerm = searchParams.search.trim();
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );
    }

    // Apply role filter
    if (searchParams.role && searchParams.role !== 'all') {
      query = query.eq('role', searchParams.role);
    }

    // Apply status filter
    if (searchParams.status) {
      query = query.eq('status', searchParams.status);
    }

    // Apply property filter
    if (searchParams.property) {
      query = query.eq('property_id', searchParams.property);
    }

    // Apply assignee filter
    if (searchParams.assignee) {
      query = query.eq('assignee_id', searchParams.assignee);
    }

    // Execute the query
    const { data: people, error: peopleError } = await query;

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      throw new Error(`Failed to fetch people: ${peopleError.message}`);
    }

    // Fetch units for people with unit_id
    const unitIds = people
      ?.filter(person => person.unit_id)
      .map(person => person.unit_id);

    interface Unit {
      unit_id: string;
      unit_name: string;
      property_id: string;
    }
    
    let units: Unit[] = [];
    let unitsError = null;
    
    if (unitIds && unitIds.length > 0) {
      const unitsResponse = await supabase
        .from('units')
        .select('unit_id, unit_name, property_id')
        .in('unit_id', unitIds as string[]);
      
      units = unitsResponse.data || [];
      unitsError = unitsResponse.error;
    }

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
    }

    // Fetch properties for units
    const propertyIds = units
      ?.map(unit => unit.property_id)
      .filter(Boolean);

    interface Property {
      id: string;
      name: string;
    }
    
    let properties: Property[] = [];
    let propertiesError = null;
    
    if (propertyIds && propertyIds.length > 0) {
      const propertiesResponse = await supabase
        .from('properties')
        .select('id, name')
        .in('id', propertyIds as string[]);
      
      properties = propertiesResponse.data || [];
      propertiesError = propertiesResponse.error;
    }

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
    }

    // Fetch all properties for filter options
    const { data: allProperties } = await supabase
      .from('properties')
      .select('id, name')
      .eq('company_id', companyMember.company_id)
      .order('name');

    // Fetch all assignees for filter options
    const { data: allAssignees } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .order('first_name');

    // Create lookup maps
    const unitsMap = new Map(units?.map(unit => [unit.unit_id, unit]));
    const propertiesMap = new Map(properties?.map(property => [property.id, property]));

    // Combine the data
    const enhancedPeople = people?.map(person => {
      const unit = person.unit_id ? unitsMap.get(person.unit_id) : null;
      const property = unit?.property_id ? propertiesMap.get(unit.property_id) : null;

      return {
        ...person,
        move_in_date: person.expected_move_in_date,
        unit: unit ? {
          unit_number: unit.unit_name,
          property_name: property?.name
        } : null,
        insurance: null,
        open_balance: 0,
        assignee_name: person.assignee_id || null
      };
    }) || [];

    // Categorize people by role
    const tenants = enhancedPeople.filter(person => person.role === 'tenant');
    const owners = enhancedPeople.filter(person => person.role === 'owner');
    const vendors = enhancedPeople.filter(person => person.role === 'vendor');
    const prospects = enhancedPeople.filter(person => person.role === 'prospect');

    return {
      tenants,
      owners,
      vendors,
      prospects,
      filterOptions: {
        properties: allProperties || [],
        assignees: allAssignees || [],
        statuses: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'sent', label: 'Sent' },
          { value: 'review', label: 'Review' },
          { value: 'accepted', label: 'Accepted' }
        ]
      }
    };
  } catch (error) {
    console.error('Unexpected error in fetchPeople:', error);
    throw error;
  }
}

export default async function PeoplePage({ 
  searchParams 
}: { 
  searchParams: SearchParams 
}) {
  try {
    // Await the searchParams since it might be a Promise in newer Next.js versions
    const awaitedSearchParams = await searchParams;
    const people = await fetchPeople(awaitedSearchParams);
    
    return (
      <Suspense fallback={<div className="p-6">Loading people...</div>}>
        <PeopleClient 
          initialPeople={people} 
          searchParams={awaitedSearchParams}
        />
      </Suspense>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error instanceof Error ? error : new Error('An unknown error occurred')} />
      </div>
    );
  }
}
