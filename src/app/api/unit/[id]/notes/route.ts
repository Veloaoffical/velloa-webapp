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
  tags: string[] | null
  created_at: string
  created_by: string
  unit_id: string
  profiles: Profile
}

export async function GET(
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

    const { data: notes, error } = await supabase
      .from('unit_notes')
      .select(`
        id,
        note,
        note_title,
        tags,
        created_at,
        created_by,
        unit_id,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .eq('unit_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ensure tags are always an array and format the creator's name
    const processedNotes = (notes as unknown as NoteWithProfile[])?.map(note => ({
      ...note,
      tags: Array.isArray(note.tags) ? note.tags : [],
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

    const json = await request.json()

    // Validate required fields
    if (!json.note || !json.note_title) {
      return NextResponse.json({ error: 'Note content and title are required' }, { status: 400 })
    }

    // Ensure tags is an array
    const tags = Array.isArray(json.tags) ? json.tags : []

    const { data, error } = await supabase
      .from('unit_notes')
      .insert([
        {
          unit_id: params.id,
          note: json.note,
          note_title: json.note_title,
          tags: tags,
          created_by: user.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ensure tags are an array in the response
    const processedData = data ? {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : []
    } : null

    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 