import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Verify the payment exists and belongs to the company
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id')
      .eq('id', paymentId)
      .eq('company_id', company_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' }, 
        { status: 404 }
      );
    }

    // Process the form data with files
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' }, 
        { status: 400 }
      );
    }

    // Upload each file to Supabase Storage
    const uploadResults = [];
    const attachmentRecords = [];

    for (const file of files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const filePath = `payments/${paymentId}/${fileName}`;
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: uploadError.message
        });
        continue;
      }

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      uploadResults.push({
        fileName: file.name,
        success: true,
        path: filePath,
        url: publicUrl
      });

      // Create attachment record
      attachmentRecords.push({
        id: uuidv4(),
        payment_id: paymentId,
        company_id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: filePath,
        public_url: publicUrl,
        created_by: user.id
      });
    }

    // Save attachment records to database
    if (attachmentRecords.length > 0) {
      const { error: attachmentError } = await supabase
        .from('payment_attachments')
        .insert(attachmentRecords);

      if (attachmentError) {
        console.error('Error saving attachment records:', attachmentError);
        return NextResponse.json(
          { 
            error: 'Files uploaded but failed to save attachment records',
            results: uploadResults
          }, 
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      results: uploadResults
    });
  } catch (error) {
    console.error('Error in payment attachments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Verify the payment exists and belongs to the company
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id')
      .eq('id', paymentId)
      .eq('company_id', company_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' }, 
        { status: 404 }
      );
    }

    // Get all attachments for this payment
    const { data: attachments, error: attachmentsError } = await supabase
      .from('payment_attachments')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('company_id', company_id);

    if (attachmentsError) {
      console.error('Error fetching payment attachments:', attachmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch attachments' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error in payment attachments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 