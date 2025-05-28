import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    const apiKey = process.env.DOCUSEAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Docuseal API key' }, { status: 500 });
    }

    // Call Docuseal API to archive the submission
    const docusealRes = await fetch(`https://api.docuseal.com/submissions/${submissionId}/archive`, {
      method: 'POST', // or 'DELETE' if that's the correct method
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await docusealRes.json();
    if (!docusealRes.ok) {
      return NextResponse.json({ error: data.error || 'Failed to archive submission' }, { status: docusealRes.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 