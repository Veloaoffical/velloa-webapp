import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    // Get the vendor's service_address to check property assignments
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('service_address')
      .eq('id', params.id)
      .single();

    if (personError) {
      console.error('Error fetching person:', personError);
      return NextResponse.json(
        { error: 'Failed to fetch person details', details: personError.message },
        { status: 500 }
      );
    }

    // Parse service_address
    const serviceAddress = person.service_address ? 
      (typeof person.service_address === 'string' ? JSON.parse(person.service_address) : person.service_address) 
      : {};

    // If access type is 'all', return empty array (frontend will handle this case)
    if (serviceAddress.type === 'all') {
      return NextResponse.json([]);
    }

    // If no property_ids or not specific access, return empty array
    if (serviceAddress.type !== 'specific' || !serviceAddress.property_ids?.length) {
      return NextResponse.json([]);
    }

    // Return the array of property IDs
    return NextResponse.json(serviceAddress.property_ids.map((id: string) => ({ property_id: id })));
  } catch (error) {
    console.error('Error in properties route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 