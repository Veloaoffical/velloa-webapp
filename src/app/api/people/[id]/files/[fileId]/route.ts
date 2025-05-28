import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; fileId: string }> }
) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // First get the file record to get the file path
    const { data: fileRecord, error: fetchError } = await supabase
      .from('people_files')
      .select('file_path')
      .eq('id', params.fileId)
      .eq('people_id', params.id)
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
      .eq('id', params.fileId)
      .eq('people_id', params.id)

    if (dbError) {
      console.error('Error deleting file record:', dbError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete file record' }),
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/people/[id]/files/[fileId]:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
} 