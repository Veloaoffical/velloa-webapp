import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    console.log('Fetching photos for property:', params.id)

    const { data: photos, error: photosError } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', params.id)
      .order('favorite', { ascending: false })
      .order('created_at', { ascending: false })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return new NextResponse('Error fetching photos', { status: 500 })
    }

    if (!photos) {
      console.log('No photos found')
      return NextResponse.json([])
    }

    console.log('Raw photos from database:', photos)

    // Get signed URLs for each photo
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

    console.log('Transformed photos:', transformedPhotos)

    return NextResponse.json(transformedPhotos)
  } catch (error) {
    console.error('Unexpected error in photos route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the file data from the request
    const { file, fileName, fileType } = await request.json()
    
    if (!file || !fileName) {
      return NextResponse.json({ error: 'File data is required' }, { status: 400 })
    }

    // Convert base64 to buffer
    const base64Data = file.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const fileExt = fileName.split('.').pop()
    const uniqueId = Math.random().toString(36).substring(2)
    const uniqueFileName = `${params.id}_${uniqueId}.${fileExt}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('property_images')
      .upload(uniqueFileName, buffer, {
        contentType: fileType,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property_images')
      .getPublicUrl(uniqueFileName)

    // Save to database with public URL
    const { data: imageRecord, error: dbError } = await supabase
      .from('property_images')
      .insert({
        property_id: params.id,
        file_path: uniqueFileName,
        file_name: fileName,
        image_url: publicUrl
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up storage if database insert fails
      await supabase.storage
        .from('property_images')
        .remove([uniqueFileName])
      
      return NextResponse.json({ 
        message: 'Error saving image record',
        error: dbError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      id: imageRecord.id,
      publicUrl,
      filePath: uniqueFileName,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Error in photo upload:', error)
    return NextResponse.json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName, filePath, imageUrl } = await request.json()

    // Insert into DB
    const { error: dbError } = await supabase
      .from('property_images')
      .insert({
        property_id: params.id,
        file_path: filePath,
        file_name: fileName,
        image_url: imageUrl
      })

    if (dbError) {
      return NextResponse.json({ 
        message: 'Error saving image record',
        error: dbError 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Image record saved successfully'
    })
  } catch (error) {
    console.error('Error saving image record:', error)
    return NextResponse.json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
