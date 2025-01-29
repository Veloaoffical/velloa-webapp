import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface NoteWithProfile {
  id: string
  note: string
  note_title: string
  created_at: string
  created_by: string
  people_id: string
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

    const { data: notes, error } = await supabase
      .from('people_notes')
      .select(`
        id,
        note,
        note_title,
        created_at,
        created_by,
        people_id,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .eq('people_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the creator's name and dates
    const processedNotes = (notes as unknown as NoteWithProfile[])?.map(note => ({
      ...note,
      created_by: note.profiles ? 
        `${note.profiles.first_name || ''} ${note.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(note.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })) || []

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

    const json = await request.json()

    // Validate required fields
    if (!json.note || !json.note_title) {
      return NextResponse.json({ error: 'Note content and title are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('people_notes')
      .insert([
        {
          people_id: params.id,
          note: json.note,
          note_title: json.note_title,
          created_by: user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 