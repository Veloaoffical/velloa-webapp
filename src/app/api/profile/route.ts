import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch additional profile data from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    // Return combined user data
    return NextResponse.json({
      fullName: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email,
      phone: profile?.phone || null,
      created_at: profile?.created_at || null
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 