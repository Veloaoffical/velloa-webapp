import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string; photoId: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { favorite } = await request.json()

    // Update the favorite status
    const { error: updateError } = await supabase
      .from('unit_images')
      .update({ favorite })
      .eq('id', params.photoId)
      .eq('unit_id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating favorite status:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json(
        { error: updateError.message || 'Failed to update favorite status' },
        { status: 500 }
      )
    }

    // Fetch all photos to return the updated list in the correct order
    const { data: allPhotos, error: fetchError } = await supabase
      .from('unit_images')
      .select('*')
      .eq('unit_id', params.id)
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
      const { data } = await supabase.storage
        .from('property_images')
        .createSignedUrl(photo.file_path, 157680000) // 5 year signed URL

      return {
        id: photo.id,
        fileUrl: data?.signedUrl || photo.image_url,
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