import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string; photoId: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    const { favorite } = await request.json()

    console.log('Attempting to update image:', {
      photoId: params.photoId,
      propertyId: params.id,
      favorite
    })

    // If we're setting a new favorite
    if (favorite) {
      // First, remove favorite status from all other photos
      const { error: unfavoriteError } = await supabase
        .from('property_images')
        .update({ favorite: false })
        .eq('property_id', params.id)
        .eq('favorite', true)

      if (unfavoriteError) {
        console.error('Error unfavoriting other images:', unfavoriteError)
        return NextResponse.json(
          { error: 'Failed to update favorite status' },
          { status: 500 }
        )
      }
    }

    // Update the target photo's favorite status
    const { data, error: updateError } = await supabase
      .from('property_images')
      .update({ favorite })
      .eq('id', params.photoId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating image:', {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json(
        { error: updateError.message || 'Failed to update favorite status' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to update image' },
        { status: 500 }
      )
    }

    // Fetch all photos to return the updated list in the correct order
    const { data: allPhotos, error: fetchError } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', params.id)
      .order('favorite', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching updated photos:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated photos' },
        { status: 500 }
      )
    }

    // Transform the photos to match the frontend format
    const transformedPhotos = await Promise.all(allPhotos.map(async (photo) => {
      const { data: urlData } = await supabase.storage
        .from('property_images')
        .createSignedUrl(photo.file_path, 157680000)

      return {
        id: photo.id,
        fileUrl: urlData?.signedUrl || photo.image_url,
        fileName: photo.file_name,
        createdAt: photo.created_at,
        favorite: photo.favorite || false,
        isFavorite: photo.favorite || false,
      }
    }))

    console.log('Successfully updated photos order')
    return NextResponse.json(transformedPhotos)
  } catch (error) {
    console.error('Error in favorite route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 