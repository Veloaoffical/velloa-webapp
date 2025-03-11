import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface UnitFile {
  id: string
  unit_id: string
  file_path: string
  file_name: string
  file_url: string
  created_at: string
}

interface TransformedUnitFile {
  id: string
  fileUrl: string
  fileName: string
  createdAt: string
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    console.log('Fetching files for unit:', params.id)

    const { data: files, error: filesError } = await supabase
      .from('unit_files')
      .select('*')
      .eq('unit_id', params.id)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return new NextResponse('Error fetching files', { status: 500 })
    }

    if (!files) {
      console.log('No files found')
      return NextResponse.json([])
    }

    console.log('Raw files from database:', files)

    // Get signed URLs for each file
    const transformedFiles: Promise<TransformedUnitFile>[] = files.map(async (file: UnitFile) => {
      const { data } = await supabase.storage
        .from('property_files')
        .createSignedUrl(file.file_path, 3600) // 1 hour signed URL

      return {
        id: file.id,
        fileUrl: data?.signedUrl || file.file_url,   
        fileName: file.file_name,
        createdAt: file.created_at,
      }
    })

    const results = await Promise.all(transformedFiles)
    console.log('Transformed files:', results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Unexpected error in files route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    console.log('Starting POST request for unit:', params.id)
    
    const supabase = await createClient()
    console.log('Supabase client created')

    // Get the authenticated user
    console.log('Attempting to get authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Auth response:', { user: user?.id, error: userError?.message })
    
    if (userError || !user) {
      console.error('Authentication error:', { error: userError, userId: user?.id })
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 })
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
      .from('property_files')
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
      .from('property_files')
      .createSignedUrl(uniqueFileName, 3600) // 1 hour signed URL

    // Save to database with signed URL
    const { data: fileRecord, error: dbError } = await supabase
      .from('unit_files')
      .insert({
        unit_id: params.id,
        file_path: uniqueFileName,
        file_name: fileName,
        file_url: data?.signedUrl || ''
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up storage if database insert fails
      await supabase.storage
        .from('property_files')
        .remove([uniqueFileName])
      
      return NextResponse.json({ 
        message: 'Error saving file record',
        error: dbError.message 
      }, { status: 500 })
    }

    // Return the transformed file object to match the frontend format
    const transformedFile = {
      id: fileRecord.id,
      fileUrl: data?.signedUrl || '',
      fileName: fileName,
      createdAt: fileRecord.created_at,
    }

    return NextResponse.json(transformedFile)
  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 