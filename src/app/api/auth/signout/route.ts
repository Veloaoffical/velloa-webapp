import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      return new NextResponse('Error signing out', { status: 500 })
    }

    // Clear any auth cookies and return success
    const response = NextResponse.json({ message: 'Signed out successfully' })
    
    return response
  } catch (error) {
    console.error('Sign out error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 