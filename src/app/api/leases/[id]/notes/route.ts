import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Profile {
  first_name: string | null
  last_name: string | null
  middle_name?: string | null
}

interface NoteWithProfile {
  id: string
  data: string | Record<string, unknown>
  note_title: string
  created_at: string
  created_by: string
  lease_id: string | null
  people_id: string | null
  profiles: Profile
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the lease to find the tenant_id
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('tenant_id')
      .eq('id', params.id)
      .single()

    if (leaseError || !lease) {
      console.error('Lease not found:', leaseError)
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Get the tenant ID (assuming it's an array, take the first one)
    const tenantId = Array.isArray(lease.tenant_id) ? lease.tenant_id[0] : lease.tenant_id
    
    if (!tenantId) {
      // If no tenant assigned to lease, return empty notes
      return NextResponse.json([])
    }

    const { data: notes, error } = await supabase
      .from('people_notes')
      .select(`
        id,
        data,
        note_title,
        created_at,
        created_by,
        people_id,
        profiles!created_by (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('people_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Raw notes data:', JSON.stringify(notes, null, 2))

    // Format the response to match the expected structure
    const processedNotes = (notes as unknown as NoteWithProfile[])?.map(note => ({
      id: note.id,
      note: note.data,
      note_title: note.note_title,
      created_at: note.created_at,
      created_by: {
        first_name: note.profiles?.first_name || '',
        middle_name: note.profiles?.middle_name || '',
        last_name: note.profiles?.last_name || ''
      }
    })) || []

    console.log('Processed notes:', JSON.stringify(processedNotes, null, 2))

    return NextResponse.json(processedNotes)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // First, get the lease to find the tenant_id
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('tenant_id')
      .eq('id', params.id)
      .single()

    if (leaseError || !lease) {
      console.error('Lease not found:', leaseError)
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Get the tenant ID (assuming it's an array, take the first one)
    const tenantId = Array.isArray(lease.tenant_id) ? lease.tenant_id[0] : lease.tenant_id
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant assigned to this lease' }, { status: 400 })
    }

    const json = await request.json()

    // Validate required fields
    if (!json.data || !json.note_title) {
      return NextResponse.json({ error: 'Note content and title are required' }, { status: 400 })
    }

    // Insert the note linked to the tenant
    const { data: newNote, error: insertError } = await supabase
      .from('people_notes')
      .insert([
        {
          people_id: tenantId,
          data: json.data,
          note_title: json.note_title,
          created_by: user.id
        }
      ])
      .select(`
        id,
        data,
        note_title,
        created_at,
        created_by,
        people_id,
        profiles!created_by (
          first_name,
          middle_name,
          last_name
        )
      `)
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Format the response to match the expected structure
    const processedNote = {
      id: newNote.id,
      note: newNote.data,
      note_title: newNote.note_title,
      created_at: newNote.created_at,
      created_by: {
        first_name: (newNote as unknown as NoteWithProfile).profiles?.first_name || '',
        middle_name: (newNote as unknown as NoteWithProfile).profiles?.middle_name || '',
        last_name: (newNote as unknown as NoteWithProfile).profiles?.last_name || ''
      }
    }

    return NextResponse.json(processedNote)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 