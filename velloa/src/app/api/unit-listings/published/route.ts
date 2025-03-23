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
    console.log('Initializing route handler for published listings...');
    const supabase = await createClient();
    
    // Get the current user information to determine their company
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the company ID for the current user from company_members
    const { data: companyMember, error: companyMemberError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();
      
    if (companyMemberError) {
      console.error('Error fetching company member data:', companyMemberError);
      return NextResponse.json({ error: 'Failed to fetch company information' }, { status: 500 });
    }
    
    if (!companyMember || !companyMember.company_id) {
      console.log('User is not associated with any company');
      return NextResponse.json([]);
    }
    
    const companyId = companyMember.company_id;
    console.log(`Found company ID: ${companyId} for user: ${user.id}`);
    
    // Get all listings that belong to this company directly using a join
    // This approach will fetch unit_listing entries where the propertyId belongs to properties owned by the company
    const { data: listings, error: listingsError } = await supabase
      .from('unit_listing')
      .select(`
        *,
        property:properties!inner(company_id)
      `)
      .eq('property.company_id', companyId);
      
    if (listingsError) {
      console.error('Listings error:', listingsError);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    if (!listings || listings.length === 0) {
      console.log('No listings found for this company');
      return NextResponse.json([]);
    }

    console.log(`Found ${listings.length} total listings for company ${companyId}`);

    // Process the listings to ensure they have all the expected fields
    const processedListings = await Promise.all(listings.map(async (listing) => {
      // Prepare result object with all fields from the listing table
      const result = { ...listing };
      
      // Remove the property join data as it's not needed in the response
      delete result.property;

      // If images is stored as a JSON string, parse it
      if (typeof listing.images === 'string') {
        try {
          result.images = JSON.parse(listing.images);
        } catch (e) {
          console.error('Error parsing images JSON:', e);
          result.images = [];
        }
      }

      // If property_address is stored as a JSON string, parse it
      if (typeof listing.property_address === 'string') {
        try {
          result.property_address = JSON.parse(listing.property_address);
        } catch (e) {
          console.error('Error parsing property_address JSON:', e);
          result.property_address = {};
        }
      }

      // If amenities is stored as a JSON string, parse it
      if (typeof listing.amenities === 'string') {
        try {
          result.amenities = JSON.parse(listing.amenities);
        } catch (e) {
          console.error('Error parsing amenities JSON:', e);
          result.amenities = {};
        }
      }

      // If this listing has a unit ID, fetch additional unit details
      if (listing.unitid) {
        // Get unit details including property information
        const { data: unitData, error: unitError } = await supabase
          .from('units')
          .select(`
            unit_id,
            unit_name,
            beds,
            baths,
            size,
            property_id,
            market_rent,
            status,
            properties (
              id,
              name,
              address_line_1,
              address_line_2,
              city,
              state,
              zip
            )
          `)
          .eq('unit_id', listing.unitid)
          .single();

        if (unitError) {
          console.error('Error fetching unit details:', unitError);
        } else if (unitData) {
          // Add unit details to the result
          result.units = unitData;

          // If images weren't provided in the listing, try to fetch them from unit_images
          if (!result.images || result.images.length === 0) {
            // Fetch photos for this unit
            const { data: photos, error: photosError } = await supabase
              .from('unit_images')
              .select('*')
              .eq('unit_id', listing.unitid)
              .order('favorite', { ascending: false })
              .order('created_at', { ascending: false });

            if (photosError) {
              console.error('Error fetching photos for unit:', listing.unitid, photosError);
            } else if (photos && photos.length > 0) {
              // Get signed URLs for each photo
              const unitImages = await Promise.all((photos || []).map(async (photo: UnitImage) => {
                // Use public URL instead of signed URL to prevent expiration
                const { data } = supabase.storage
                  .from('property_images')
                  .getPublicUrl(photo.file_path);

                return {
                  id: photo.id,
                  url: data?.publicUrl || photo.image_url,
                  fileUrl: data?.publicUrl || photo.image_url,
                  file_name: photo.file_name,
                  fileName: photo.file_name,
                  createdAt: photo.created_at,
                  favorite: photo.favorite || false,
                  isFavorite: photo.favorite || false
                };
              }));

              // Add these images to both the listing.images array and to the unit_images field
              result.images = unitImages;
              
              // Also add to units.unit_images for backward compatibility
              if (result.units) {
                result.units.unit_images = unitImages;
              }
            }
          }
        }
      }

      // Return the processed listing
      return result;
    }));

    console.log('Returning processed listings:', processedListings.length);
    
    // Add detailed logging for the first listing
    if (processedListings.length > 0) {
      console.log('Sample listing (first):', JSON.stringify(processedListings[0], null, 2));
    }

    return NextResponse.json(processedListings);
  } catch (error) {
    console.error('Unexpected error in route handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 