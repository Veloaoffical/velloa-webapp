import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get files for the person
    const { data: files, error } = await supabase
      .from('people_files')
      .select('id, file_name, file_url, file_type, file_path, created_at')
      .eq('people_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch files' }),
        { status: 500 }
      )
    }

    // Map the database fields to match what the frontend expects
    const mappedFiles = files.map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileUrl: file.file_url,
      createdAt: file.created_at
    }))

    return new NextResponse(JSON.stringify(mappedFiles))
  } catch (error) {
    console.error('Error in GET /api/people/[id]/files:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Upload file to storage
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from('people_files')
      .upload(
        `${params.id}/${Date.now()}-${body.fileName}`,
        Buffer.from(body.file.split(',')[1], 'base64'),
        {
          contentType: body.fileType,
          upsert: false
        }
      )

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('people_files')
      .getPublicUrl(fileData.path)

    // Create record in people_files table
    const { data: record, error: dbError } = await supabase
      .from('people_files')
      .insert([
        {
          people_id: params.id,
          file_name: body.fileName,
          file_type: body.fileType,
          file_url: publicUrl,
          file_path: fileData.path
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Error creating file record:', dbError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create file record' }),
        { status: 500 }
      )
    }

    return new NextResponse(JSON.stringify(record))
  } catch (error) {
    console.error('Error in POST /api/people/[id]/files:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
} 