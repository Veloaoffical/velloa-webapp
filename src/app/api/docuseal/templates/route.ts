import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const DOCUSEAL_API_URL = 'https://api.docuseal.com';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const externalId = searchParams.get('external_id');
    const folder = searchParams.get('folder');
    const showArchived = searchParams.get('show_archived') === 'true';
    const limit = searchParams.get('limit');
    const after = searchParams.get('after');
    const before = searchParams.get('before');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('q', query);
    if (externalId) queryParams.append('external_id', externalId);
    if (folder) queryParams.append('folder', folder);
    
    // Explicitly handle archived templates
    if (showArchived) {
      queryParams.append('archived', 'true');
    } else {
      queryParams.append('archived', 'false'); // Explicitly request non-archived templates
    }
    
    if (limit) queryParams.append('limit', limit);
    if (after) queryParams.append('after', after);
    if (before) queryParams.append('before', before);

    // Get templates from DocuSeal
    const response = await fetch(`${DOCUSEAL_API_URL}/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`DocuSeal API error: ${response.status} - ${responseText}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      templates: data.data || [],
      pagination: data.pagination || {}
    });
  } catch (error) {
    console.error('Error in GET /api/docuseal/templates:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    // Get template ID from query parameters
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Call DocuSeal API to archive the template
    const response = await fetch(`${DOCUSEAL_API_URL}/templates/${templateId}/archive`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`DocuSeal API error: ${response.status} - ${responseText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/docuseal/templates:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 