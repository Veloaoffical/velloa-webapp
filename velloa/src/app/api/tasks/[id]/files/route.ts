import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface FileResponse {
  id: string
  fileName: string
  fileUrl: string
  createdAt: string
  createdBy: {
    first_name: string
    middle_name: string | null
    last_name: string
  }
}

interface DatabaseFile {
  id: string
  file_name: string
  file_url: string
  file_type: string
  created_at: string
  profiles: {
    first_name: string
    middle_name: string | null
    last_name: string
  }
}

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get files for the task
    const { data: files, error } = await supabase
      .from('maintenance_file')
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        file_path,
        created_at,
        uploaded_by,
        profiles!inner (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('maintenance_id', (await context.params).id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    // Map the database fields to match what the frontend expects
    const mappedFiles: FileResponse[] = (files as unknown as DatabaseFile[]).map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileUrl: file.file_url,
      createdAt: file.created_at,
      createdBy: {
        first_name: file.profiles.first_name,
        middle_name: file.profiles.middle_name,
        last_name: file.profiles.last_name
      }
    }))

    return NextResponse.json(mappedFiles)
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Upload file to storage
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from('maintenance_files')
      .upload(
        `${(await context.params).id}/${Date.now()}-${body.fileName}`,
        Buffer.from(body.file.split(',')[1], 'base64'),
        {
          contentType: body.fileType,
          upsert: false
        }
      )

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('maintenance_files')
      .getPublicUrl(fileData.path)

    // Create record in maintenance_file table
    const { data: record, error: dbError } = await supabase
      .from('maintenance_file')
      .insert([
        {
          maintenance_id: (await context.params).id,
          file_name: body.fileName,
          file_type: body.fileType,
          file_url: publicUrl,
          file_path: fileData.path,
          uploaded_by: user.id
        }
      ])
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        created_at,
        profiles!inner (
          first_name,
          middle_name,
          last_name
        )
      `)
      .single()

    if (dbError) {
      console.error('Error creating file record:', dbError)
      return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 })
    }

    const databaseRecord = record as unknown as DatabaseFile
    const response: FileResponse = {
      id: databaseRecord.id,
      fileName: databaseRecord.file_name,
      fileUrl: databaseRecord.file_url,
      createdAt: databaseRecord.created_at,
      createdBy: {
        first_name: databaseRecord.profiles.first_name,
        middle_name: databaseRecord.profiles.middle_name,
        last_name: databaseRecord.profiles.last_name
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in POST /api/tasks/[id]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId } = body

    // First get the file record to get the file path
    const { data: fileRecord, error: fetchError } = await supabase
      .from('maintenance_file')
      .select('file_path')
      .eq('id', fileId)
      .eq('maintenance_id', (await context.params).id)
      .single()

    if (fetchError) {
      console.error('Error fetching file record:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch file record' }, { status: 500 })
    }

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from('maintenance_files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 })
    }

    // Delete the record from the database
    const { error: dbError } = await supabase
      .from('maintenance_file')
      .delete()
      .eq('id', fileId)
      .eq('maintenance_id', (await context.params).id)

    if (dbError) {
      console.error('Error deleting file record:', dbError)
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 