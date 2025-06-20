import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // First get the lease to find the tenant (people_id)
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('people_id')
      .eq('id', params.id)
      .single()

    if (leaseError || !lease?.people_id) {
      console.error('Error fetching lease or no tenant found:', leaseError)
      return new NextResponse(
        JSON.stringify({ error: 'Lease not found or no tenant associated' }),
        { status: 404 }
      )
    }

    // Get files for the tenant (people_id from lease)
    const { data: files, error } = await supabase
      .from('people_files')
      .select('id, file_name, file_url, file_type, file_path, file_size, created_at')
      .eq('people_id', lease.people_id)
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
      fileType: file.file_type || '',
      fileSize: file.file_size || 0,
      createdAt: file.created_at
    }))

    return new NextResponse(JSON.stringify(mappedFiles))
  } catch (error) {
    console.error('Error in GET /api/leases/[id]/files:', error)
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

    // First get the lease to find the tenant (people_id)
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('people_id')
      .eq('id', params.id)
      .single()

    if (leaseError || !lease?.people_id) {
      console.error('Error fetching lease or no tenant found:', leaseError)
      return new NextResponse(
        JSON.stringify({ error: 'Lease not found or no tenant associated' }),
        { status: 404 }
      )
    }

    // Handle multiple files upload
    if (body.files && Array.isArray(body.files)) {
      const uploadResults = []

      for (const fileData of body.files) {
        try {
          // Upload file to storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('people_files')
            .upload(
              `${lease.people_id}/${Date.now()}-${fileData.file_name}`,
              Buffer.from(fileData.file_url.split(',')[1], 'base64'),
              {
                contentType: fileData.file_type,
                upsert: false
              }
            )

          if (uploadError) {
            console.error('Error uploading file:', uploadError)
            throw new Error(`Failed to upload ${fileData.file_name}`)
          }

          // Get public URL for the uploaded file
          const { data: { publicUrl } } = supabase
            .storage
            .from('people_files')
            .getPublicUrl(uploadData.path)

          // Create record in people_files table
          const { data: record, error: dbError } = await supabase
            .from('people_files')
            .insert([
              {
                people_id: lease.people_id,
                file_name: fileData.file_name,
                file_type: fileData.file_type,
                file_url: publicUrl,
                file_path: uploadData.path,
                file_size: fileData.file_size
              }
            ])
            .select()
            .single()

          if (dbError) {
            console.error('Error creating file record:', dbError)
            throw new Error(`Failed to create record for ${fileData.file_name}`)
          }

          uploadResults.push({
            id: record.id,
            fileName: record.file_name,
            fileUrl: record.file_url,
            fileType: record.file_type || '',
            fileSize: record.file_size || 0,
            createdAt: record.created_at
          })
        } catch (fileError) {
          console.error(`Error processing file ${fileData.file_name}:`, fileError)
          // Continue with other files even if one fails
        }
      }

      return new NextResponse(JSON.stringify(uploadResults))
    }

    return new NextResponse(
      JSON.stringify({ error: 'No files provided' }),
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in POST /api/leases/[id]/files:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // First get the lease to find the tenant (people_id)
    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select('people_id')
      .eq('id', params.id)
      .single()

    if (leaseError || !lease?.people_id) {
      console.error('Error fetching lease or no tenant found:', leaseError)
      return new NextResponse(
        JSON.stringify({ error: 'Lease not found or no tenant associated' }),
        { status: 404 }
      )
    }

    // Get the file record to get the file path
    const { data: fileRecord, error: fetchError } = await supabase
      .from('people_files')
      .select('file_path')
      .eq('id', body.fileId)
      .eq('people_id', lease.people_id)
      .single()

    if (fetchError) {
      console.error('Error fetching file record:', fetchError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch file record' }),
        { status: 500 }
      )
    }

    if (!fileRecord) {
      return new NextResponse(
        JSON.stringify({ error: 'File not found' }),
        { status: 404 }
      )
    }

    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from('people_files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete file from storage' }),
        { status: 500 }
      )
    }

    // Delete the record from the database
    const { error: dbError } = await supabase
      .from('people_files')
      .delete()
      .eq('id', body.fileId)
      .eq('people_id', lease.people_id)

    if (dbError) {
      console.error('Error deleting file record:', dbError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete file record' }),
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/leases/[id]/files:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
} 