import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface UnitImage {
  id: string;
  unit_id: string;
  file_path: string;
  file_name: string;
  image_url: string;
  created_at: string;
  favorite: boolean;
}

export async function GET() {
  try {
    console.log('Initializing route handler...');
    const supabase = await createClient();

    // First, get just the unit listings
    const { data: listings, error: listingsError } = await supabase
      .from('unit_listing')
      .select('*')
      .eq('status', 'published');

    if (listingsError) {
      console.error('Basic listings error:', listingsError);
      return NextResponse.json({ error: 'Failed to fetch basic listings' }, { status: 500 });
    }

    if (!listings || listings.length === 0) {
      console.log('No listings found');
      return NextResponse.json([]);
    }

    // Now get the unit details for these listings
    const unitIds = listings.map(l => l.unitid).filter(Boolean);
    
    if (unitIds.length === 0) {
      console.log('No unit IDs found in listings');
      return NextResponse.json([]);
    }

    // Log the unit IDs we're querying for
    console.log('Querying for unit IDs:', unitIds);

    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select(`
        unit_id,
        unit_name,
        property_id,
        properties!inner (
          name,
          address_line_1,
          address_line_2,
          city,
          state,
          zip
        )
      `)
      .in('unit_id', unitIds);

    if (unitsError) {
      console.error('Units fetch error:', unitsError);
      return NextResponse.json({ error: 'Failed to fetch unit details' }, { status: 500 });
    }

    // Create a map of unit details for easy lookup
    const unitMap = new Map(units?.map(unit => [unit.unit_id, unit]) || []);

    // Transform the data to match the frontend expectations
    const transformedListings = await Promise.all(listings.map(async listing => {
      const unitDetails = unitMap.get(listing.unitid);
      if (!unitDetails) return null;

      // Fetch photos for this unit using the same approach as unit photos API
      const { data: photos, error: photosError } = await supabase
        .from('unit_images')
        .select('*')
        .eq('unit_id', listing.unitid)
        .order('favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (photosError) {
        console.error('Error fetching photos for unit:', listing.unitid, photosError);
        return null;
      }

      // Get signed URLs for each photo using the same approach as unit photos API
      const unitImages = await Promise.all((photos || []).map(async (photo: UnitImage) => {
        const { data } = await supabase.storage
          .from('property_images')
          .createSignedUrl(photo.file_path, 3600); // 1 hour signed URL

        return {
          id: photo.id,
          fileUrl: data?.signedUrl || photo.image_url,
          fileName: photo.file_name,
          createdAt: photo.created_at,
          favorite: photo.favorite || false,
          isFavorite: photo.favorite || false
        };
      }));

      return {
        listingid: listing.listingid,
        title: listing.property_title || '',
        description: listing.listing_description || '',
        available_from: listing.available_date,
        status: listing.status || 'draft',
        unitid: listing.unitid,
        units: {
          unit_id: unitDetails.unit_id,
          unit_name: unitDetails.unit_name,
          unit_images: unitImages,
          properties: unitDetails.properties
        }
      };
    }));

    // Filter out any null values and return
    const finalListings = transformedListings.filter(Boolean);
    
    console.log('Final transformed listings:', finalListings);

    return NextResponse.json(finalListings);
  } catch (error) {
    console.error('Unexpected error in route handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 