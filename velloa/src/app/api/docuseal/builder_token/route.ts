import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_ADMIN_EMAIL = process.env.DOCUSEAL_ADMIN_EMAIL;

interface DocuSealTokenPayload {
  user_email: string;
  integration_email: string;
  external_id?: string;
  template_id?: string | number;
  [key: string]: string | number | undefined;
}

export async function GET(request: Request) {
  try {
    if (!DOCUSEAL_API_KEY || !DOCUSEAL_ADMIN_EMAIL) {
      throw new Error('DocuSeal configuration is missing');
    }

    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get template ID from request if provided
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    // Create the payload with Docuseal's expected fields - matching example format exactly
    const payload = {
      user_email: DOCUSEAL_ADMIN_EMAIL,
      integration_email: user.email,
      external_id: templateId || `template_${Date.now()}`,
      ...(templateId ? { template_id: templateId } : {}),
    } as DocuSealTokenPayload;

    // Sign the token
    const token = jwt.sign(payload, DOCUSEAL_API_KEY);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating builder token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 