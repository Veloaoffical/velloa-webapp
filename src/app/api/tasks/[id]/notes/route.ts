import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Profile {
  first_name: string | null
  middle_name: string | null
  last_name: string | null
}

interface NoteWithProfile {
  id: string
  data: string | Record<string, unknown>
  note_title: string
  created_at: string
  created_by: string
  maintenance_id: string
  profiles: Profile[]
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

    // Get the user's company_id
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (companyError || !companyMember) {
      console.error('User is not a company member:', companyError)
      return NextResponse.json({ error: 'User is not a company member' }, { status: 403 })
    }
    const company_id = companyMember.company_id;

    const { data: notes, error } = await supabase
      .from('maintenance_notes')
      .select(`
        id,
        data,
        note_title,
        created_at,
        created_by,
        maintenance_id,
        company_id,
        profiles:profiles!maintenance_notes_created_by_fkey (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('maintenance_id', params.id)
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Raw notes data:', JSON.stringify(notes, null, 2))

    // Format the creator's name and dates
    const processedNotes = (notes as unknown as NoteWithProfile[])?.map(note => {
      console.log('Processing note:', note)
      console.log('Profiles data:', note.profiles)
      
      const processed = {
        id: note.id,
        note: note.data,
        note_title: note.note_title,
        created_at: note.created_at,
        created_by: {
          first_name: note.profiles[0]?.first_name || '',
          middle_name: note.profiles[0]?.middle_name || '',
          last_name: note.profiles[0]?.last_name || ''
        }
      }
      console.log('Processed note:', processed)
      return processed
    }) || []

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

    // Get the user's company_id
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (companyError || !companyMember) {
      console.error('User is not a company member:', companyError)
      return NextResponse.json({ error: 'User is not a company member' }, { status: 403 })
    }
    const company_id = companyMember.company_id;

    const json = await request.json()

    // Validate required fields
    if (!json.data || !json.note_title) {
      return NextResponse.json({ error: 'Note content and title are required' }, { status: 400 })
    }

    // First insert the note
    const { data: newNote, error: insertError } = await supabase
      .from('maintenance_notes')
      .insert([
        {
          maintenance_id: params.id,
          data: json.data,
          note_title: json.note_title,
          created_by: user.id,
          company_id: company_id
        }
      ])
      .select(`
        id,
        data,
        note_title,
        created_at,
        created_by,
        maintenance_id,
        company_id,
        profiles:profiles!maintenance_notes_created_by_fkey (
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
        first_name: (newNote as unknown as NoteWithProfile).profiles[0]?.first_name || '',
        middle_name: (newNote as unknown as NoteWithProfile).profiles[0]?.middle_name || '',
        last_name: (newNote as unknown as NoteWithProfile).profiles[0]?.last_name || ''
      }
    }

    return NextResponse.json(processedNote)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 