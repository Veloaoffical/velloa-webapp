import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface Person {
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  company: string | null
}

interface PropertyOwner {
  people_id: string
  ownership_percentage: number
  people: Person
}

interface Owner {
  peopleId: string
  ownershipPercentage: number
  firstName: string | null
  middleName: string | null
  lastName: string | null
  company: string | null
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single()

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get the property to verify company access
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', params.id)
      .eq('company_id', companyMember.company_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch property owners
    const { data: owners, error: ownersError } = await supabase
      .from('property_owners')
      .select(`
        people_id,
        ownership_percentage,
        people (
          first_name,
          middle_name,
          last_name,
          company
        )
      `)
      .eq('property_id', params.id)
      .returns<PropertyOwner[]>()

    if (ownersError) {
      console.error('Error fetching owners:', ownersError)
      return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedOwners: Owner[] = owners.map(owner => ({
      peopleId: owner.people_id,
      ownershipPercentage: owner.ownership_percentage,
      firstName: owner.people.first_name,
      middleName: owner.people.middle_name,
      lastName: owner.people.last_name,
      company: owner.people.company
    }))

    return NextResponse.json(transformedOwners)
  } catch (error) {
    console.error('Error in owners route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 