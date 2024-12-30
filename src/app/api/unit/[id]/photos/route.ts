import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface UnitImage {
  id: string
  unit_id: string
  file_path: string
  file_name: string
  image_url: string
  created_at: string
  favorite: boolean
}

interface TransformedUnitImage {
  id: string
  fileUrl: string
  fileName: string
  createdAt: string
  favorite: boolean
  isFavorite: boolean
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    console.log('Fetching photos for unit:', params.id)

    const { data: photos, error: photosError } = await supabase
      .from('unit_images')
      .select('*')
      .eq('unit_id', params.id)
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
    const transformedPhotos: Promise<TransformedUnitImage>[] = photos.map(async (photo: UnitImage) => {
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
    })

    const results = await Promise.all(transformedPhotos)
    console.log('Transformed photos:', results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Unexpected error in photos route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get signed URL
    const { data } = await supabase.storage
      .from('property_images')
      .createSignedUrl(uniqueFileName, 3600) // 1 hour signed URL

    // Save to database with signed URL
    const { data: imageRecord, error: dbError } = await supabase
      .from('unit_images')
      .insert({
        unit_id: params.id,
        file_path: uniqueFileName,
        file_name: fileName,
        image_url: data?.signedUrl || ''
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

    // Return the transformed photo object to match the frontend format
    const transformedPhoto = {
      id: imageRecord.id,
      fileUrl: data?.signedUrl || '',
      fileName: fileName,
      createdAt: imageRecord.created_at,
      favorite: false,
      isFavorite: false
    }

    return NextResponse.json(transformedPhoto)
  } catch (error) {
    console.error('Error in photo upload:', error)
    return NextResponse.json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .from('unit_images')
      .insert({
        unit_id: params.id,
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