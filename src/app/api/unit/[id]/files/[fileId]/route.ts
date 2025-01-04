import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the file path from the database
    const { data: file, error: fileError } = await supabase
      .from('unit_files')
      .select('file_path')
      .eq('id', params.fileId)
      .single()

    if (fileError) {
      console.error('Error fetching file:', fileError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('property_files')
      .remove([file.file_path])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 })
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('unit_files')
      .delete()
      .eq('id', params.fileId)

    if (dbError) {
      console.error('Error deleting from database:', dbError)
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error in file deletion:', error)
    return NextResponse.json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 