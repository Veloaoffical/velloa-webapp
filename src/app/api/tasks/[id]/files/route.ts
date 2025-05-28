import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Add config for body size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

interface FileResponse {
  id: string
  fileName: string
  fileUrl: string
  createdAt: string
  fileSize: number
  createdBy: {
    first_name: string
    middle_name: string | null
    last_name: string
  }
}

interface DatabaseFile {
  id: string
  file_name: string
  file_url: string
  file_type: string
  created_at: string
  file_size: number
  profiles: {
    first_name: string
    middle_name: string | null
    last_name: string
  }
}

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get files for the task
    const { data: files, error } = await supabase
      .from('maintenance_file')
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        file_path,
        created_at,
        uploaded_by,
        profiles!inner (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('maintenance_id', (await context.params).id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    // Map the database fields to match what the frontend expects
    const mappedFiles: FileResponse[] = (files as unknown as DatabaseFile[]).map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileUrl: file.file_url,
      createdAt: file.created_at,
      fileSize: file.file_size,
      createdBy: {
        first_name: file.profiles.first_name,
        middle_name: file.profiles.middle_name,
        last_name: file.profiles.last_name
      }
    }))

    return NextResponse.json(mappedFiles)
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const taskId = (await context.params).id

    // 1. Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's company ID
    const { data: memberData, error: memberError } = await supabase
      .from('company_members') // <-- Correct table
      .select('company_id')
      .eq('id', user.id) // <-- Use user.id from auth
      .single()

    if (memberError || !memberData?.company_id) {
      console.error('Error fetching user company membership or company ID:', memberError)
      return NextResponse.json({ error: 'Forbidden: User company not found or user is not a member' }, { status: 403 })
    }
    const userCompanyId = memberData.company_id

    // 3. Get task's company ID (Assuming 'maintenance_task' table and 'company_id' column)
    const { data: taskData, error: taskError } = await supabase
      .from('maintenance_requests') // <--- Make sure this table name is correct
      .select('company_id')
      .eq('id', taskId)
      .single()

    if (taskError || !taskData) {
      console.error('Error fetching task or task company ID:', taskError)
      // Task not found or doesn't have a company ID
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    const taskCompanyId = taskData.company_id

    // 4. Authorize: Check if user's company matches the task's company
    if (userCompanyId !== taskCompanyId) {
      console.warn(`Authorization failed: User ${user.id} (Company ${userCompanyId}) tried to upload to Task ${taskId} (Company ${taskCompanyId})`)
      return NextResponse.json({ error: 'Forbidden: You do not have permission to upload files to this task.' }, { status: 403 })
    }

    // 5. Proceed with file upload if authorized
    const body = await request.json()
    const files = body.files || []; // Expect an array of files

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided or invalid format' }, { status: 400 });
    }

    const createdFileResponses: FileResponse[] = [];

    for (const file of files) {
      try {
        // Ensure file has necessary properties
        if (!file.file_url || !file.file_name || !file.file_type || typeof file.file_size !== 'number') {
          console.warn('Skipping file due to missing properties or invalid size:', file);
          continue; // Skip this file and proceed with the next
        }

        console.log(`Processing file: Name=${file.file_name}, Type=${file.file_type}, Size=${file.file_size}`);

        // Extract base64 data
        const dataUrlParts = file.file_url.split(',');
        if (dataUrlParts.length !== 2 || !dataUrlParts[0].includes('base64')) {
          console.warn('Skipping file due to invalid data URL format:', file.file_name);
          continue;
        }
        const base64Data = dataUrlParts[1];
        // console.log(`Extracted Base64 data (first 50 chars): ${base64Data.substring(0, 50)}`); // <-- Optional: Log base64 prefix

        let buffer: Buffer;
        try {
            buffer = Buffer.from(base64Data, 'base64');
        } catch (bufferError) {
            console.error(`Error creating buffer from Base64 for file: ${file.file_name}`, bufferError);
            continue; // Skip this file
        }

        const uniqueFileName = `${taskId}/${Date.now()}-${file.file_name}`;

        console.log(`Uploading to Supabase Storage: Path=${uniqueFileName}, ContentType=${file.file_type}`);

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('maintenance_files')
          .upload(uniqueFileName, buffer, {
            contentType: file.file_type,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file to storage:', file.file_name, uploadError);
          // Optionally decide whether to stop all uploads or just skip this one
          continue; // Skip this file
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase
          .storage
          .from('maintenance_files')
          .getPublicUrl(uploadData.path);

        // Create record in maintenance_file table
        const { data: record, error: dbError } = await supabase
          .from('maintenance_file')
          .insert([
            {
              maintenance_id: taskId,
              file_name: file.file_name,
              file_type: file.file_type,
              file_url: urlData.publicUrl,
              file_path: uploadData.path,
              uploaded_by: user.id,
              company_id: userCompanyId, // Add the company_id
              file_size: file.file_size // Add file_size
            }
          ])
          .select(`
            id,
            file_name,
            file_url,
            file_type,
            created_at,
            file_size,
            profiles!inner (
              first_name,
              middle_name,
              last_name
            )
          `)
          .single();

        if (dbError) {
          console.error('Error creating file record for:', file.file_name, dbError);
          // Optionally decide whether to stop all uploads or just skip this one
          continue; // Skip this file
        }

        // Map and add to response array
        const databaseRecord = record as unknown as DatabaseFile;
        createdFileResponses.push({
          id: databaseRecord.id,
          fileName: databaseRecord.file_name,
          fileUrl: databaseRecord.file_url,
          createdAt: databaseRecord.created_at,
          fileSize: databaseRecord.file_size, // Add fileSize
          createdBy: {
            first_name: databaseRecord.profiles.first_name,
            middle_name: databaseRecord.profiles.middle_name,
            last_name: databaseRecord.profiles.last_name
          }
        });

      } catch (err) {
        console.error('Error processing individual file:', file.file_name, err);
        // Continue with the next file
      }
    } // End of for loop

    // Return the array of successfully created file records
    return NextResponse.json(createdFileResponses, { status: createdFileResponses.length > 0 ? 201 : 200 }); // 201 if created, 200 if none were processed ok

  } catch (error) {
    console.error('Error in POST /api/tasks/[id]/files:', error)
    // Catch errors from request.json() or unexpected issues
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) 
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId } = body

    // First get the file record to get the file path
    const { data: fileRecord, error: fetchError } = await supabase
      .from('maintenance_file')
      .select('file_path')
      .eq('id', fileId)
      .eq('maintenance_id', (await context.params).id)
      .single()

    if (fetchError) {
      console.error('Error fetching file record:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch file record' }, { status: 500 })
    }

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from('maintenance_files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 })
    }

    // Delete the record from the database
    const { error: dbError } = await supabase
      .from('maintenance_file')
      .delete()
      .eq('id', fileId)
      .eq('maintenance_id', (await context.params).id)

    if (dbError) {
      console.error('Error deleting file record:', dbError)
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]/files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 