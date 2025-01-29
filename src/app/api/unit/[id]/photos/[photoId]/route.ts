import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
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

    // First get the photo record to get the file path
    const { data: photo, error: photoError } = await supabase
      .from('unit_images')
      .select('file_path')
      .eq('id', params.photoId)
      .eq('unit_id', params.id)
      .single()

    if (photoError) {
      console.error('Error fetching photo:', photoError)
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from('property_images')
      .remove([photo.file_path])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 })
    }

    // Delete the record from the database
    const { error: dbError } = await supabase
      .from('unit_images')
      .delete()
      .eq('id', params.photoId)
      .eq('unit_id', params.id)

    if (dbError) {
      console.error('Error deleting from database:', dbError)
      return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 })
    }

    // Get all remaining photos to return updated list
    const { data: photos, error: fetchError } = await supabase
      .from('unit_images')
      .select('*')
      .eq('unit_id', params.id)
      .order('favorite', { ascending: false })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching updated photos:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated photos' }, { status: 500 })
    }

    // Transform photos to match frontend format
    const transformedPhotos = await Promise.all(photos.map(async (photo) => {
      const { data } = await supabase.storage
        .from('property_images')
        .createSignedUrl(photo.file_path, 3600) // 1 hour signed URL

      return {
        id: photo.id,
        fileUrl: data?.signedUrl || photo.image_url,
        fileName: photo.file_name,
        createdAt: photo.created_at,
        favorite: photo.favorite || false,
        isFavorite: photo.favorite || false,
      }
    }))

    return NextResponse.json(transformedPhotos)
  } catch (error) {
    console.error('Error in photo deletion:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 