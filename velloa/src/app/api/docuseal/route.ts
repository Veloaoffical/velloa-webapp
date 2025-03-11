import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const DOCUSEAL_API_URL = 'https://api.docuseal.com';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_ADMIN_EMAIL = process.env.DOCUSEAL_ADMIN_EMAIL;

interface DocuSealField {
  uuid: string;
  submitter_uuid: string;
  name: string;
  type: string;
  required?: boolean;
  areas?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    attachment_uuid: string;
    page: number;
  }>;
}

interface DocuSealTokenPayload {
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  prm?: string;
  email?: string;
  user_email?: string;
  integration_email?: string;
  external_id?: string;
  name?: string;
  document_urls?: string[];
  template_id?: string | number;
  fields?: DocuSealField[];
  submitters?: Array<{
    name: string;
    uuid: string;
  }>;
  [key: string]: string | string[] | number | undefined | DocuSealField[] | Array<{name: string; uuid: string}>;
}

// Helper function to generate DocuSeal JWT token
function generateDocuSealToken(payload: Partial<DocuSealTokenPayload>) {
  if (!DOCUSEAL_API_KEY || !DOCUSEAL_ADMIN_EMAIL) {
    throw new Error('DocuSeal configuration is missing');
  }

  // Create the token payload exactly as DocuSeal expects it
  const tokenPayload: DocuSealTokenPayload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iss: 'docuseal_client',
    aud: 'docuseal',
    prm: 'all',
    email: DOCUSEAL_ADMIN_EMAIL,
    fields: [
      {
        uuid: crypto.randomUUID(),
        submitter_uuid: crypto.randomUUID(),
        name: 'First Name',
        type: 'text',
        required: true,
      },
      {
        uuid: crypto.randomUUID(),
        submitter_uuid: crypto.randomUUID(),
        name: 'Last Name',
        type: 'text',
        required: true,
      },
      {
        uuid: crypto.randomUUID(),
        submitter_uuid: crypto.randomUUID(),
        name: 'Signature',
        type: 'signature',
        required: true,
      },
      {
        uuid: crypto.randomUUID(),
        submitter_uuid: crypto.randomUUID(),
        name: 'Date',
        type: 'date',
        required: true,
      },
      {
        uuid: crypto.randomUUID(),
        submitter_uuid: crypto.randomUUID(),
        name: 'Initials',
        type: 'initials',
        required: true,
      },
      {
        uuid: crypto.randomUUID(),
        submitter_uuid: crypto.randomUUID(),
        name: 'Phone',
        type: 'phone',
        required: true,
      },
      // Add more custom fields as needed
    ],
    submitters: [
      {
        name: 'First Party',
        uuid: crypto.randomUUID(),
      }
    ],
    ...payload,
  };

  // Remove undefined fields
  Object.keys(tokenPayload).forEach(key => {
    const k = key as keyof DocuSealTokenPayload;
    if (tokenPayload[k] === undefined) {
      delete tokenPayload[k];
    }
  });

  // Sign with specific algorithm
  return jwt.sign(tokenPayload, DOCUSEAL_API_KEY, {
    algorithm: 'HS256',
    noTimestamp: true, // Don't add iat automatically since we set it manually
  });
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!DOCUSEAL_API_KEY || !DOCUSEAL_ADMIN_EMAIL) {
      console.log('DocuSeal Config:', {
        apiKeyExists: !!DOCUSEAL_API_KEY,
        adminEmailExists: !!DOCUSEAL_ADMIN_EMAIL
      });
      throw new Error('DocuSeal configuration is missing');
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
    const archived = searchParams.get('archived');
    const limit = searchParams.get('limit');
    const after = searchParams.get('after');
    const before = searchParams.get('before');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('q', query);
    if (externalId) queryParams.append('external_id', externalId);
    if (folder) queryParams.append('folder', folder);
    if (archived) queryParams.append('archived', archived);
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

    console.log('DocuSeal API Response Status:', response.status);
    const responseText = await response.text();
    console.log('DocuSeal API Response:', responseText);

    if (!response.ok) {
      throw new Error(`Docuseal API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse DocuSeal response:', e);
      throw new Error('Invalid response from DocuSeal API');
    }
    
    return NextResponse.json({ 
      templates: data.data || [],
      pagination: data.pagination || {},
      debug: {
        url: `${DOCUSEAL_API_URL}/templates`,
        params: Object.fromEntries(queryParams.entries()),
      }
    });
  } catch (error) {
    console.error('Error in GET /api/docuseal:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a create template request
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'createTemplate') {
      const body = await request.json();
      const { name, file } = body;

      if (!name || !file) {
        return NextResponse.json({ error: 'Name and file are required' }, { status: 400 });
      }

      // Convert base64 to buffer
      const base64Data = file.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to storage to get a URL
      const fileName = `docuseal/${Date.now()}-${name}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('property_files')
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property_files')
        .getPublicUrl(fileName);

      // Generate token for template creation
      const token = generateDocuSealToken({
        integration_email: user.email,
        external_id: `template_${Date.now()}`,
        name: name,
        document_urls: [publicUrl],
      });

      // Return the token for the frontend to use with DocusealBuilder
      return NextResponse.json({ token });
    }

    // Handle document preview from template
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Generate token for submission creation
    const token = generateDocuSealToken({
      integration_email: user.email,
      external_id: `submission_${Date.now()}`,
      template_id: templateId,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Generate token for template deletion
    const token = generateDocuSealToken({
      integration_email: user.email,
      template_id: templateId,
    });

    // Delete template
    const response = await fetch(`${DOCUSEAL_API_URL}/templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Docuseal API error: ${errorData.message || response.statusText}`);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
