import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const DOCUSEAL_API_URL = 'https://api.docuseal.com';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!DOCUSEAL_API_KEY) {
      throw new Error('DocuSeal API key is missing');
    }

    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { name, file } = body;

    if (!name || !file) {
      return NextResponse.json({ error: 'Name and file are required' }, { status: 400 });
    }

    // Extract the base64 data
    const base64Data = file.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create form data for the file upload
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, `${name}.pdf`);
    formData.append('name', name);

    // Upload to DocuSeal to create a template
    const response = await fetch(`${DOCUSEAL_API_URL}/templates/pdf`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`DocuSeal API error: ${response.status} - ${responseText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Error in POST /api/docuseal/templates/create:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 