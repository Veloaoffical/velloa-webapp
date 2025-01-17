import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, priority } = await request.json();

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({
        status,
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 