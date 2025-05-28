import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Import Supabase server client

// Assume you have a database client instance initialized (e.g., Prisma, Supabase)
// import { db } from '@/lib/db';

// Helper type for the ID arrays in maintenance_requests
type IdObject = { id: string };

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient(); // Get Supabase client - Added await

  // --- Authentication Check --- 
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Authentication error:', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // --- End Authentication Check ---

  // --- Company Membership Check --- 
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyError || !companyMember) {
    console.error(`User ${user.id} is not a company member or query failed:`, companyError);
    // Distinguish between query error and not found
    const errorMessage = companyError ? 'Forbidden: Error checking company membership' : 'Forbidden: User not associated with a company';
    const errorStatus = companyError ? 500 : 403; // Internal error vs Forbidden
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
  const userCompanyId = companyMember.company_id;
  // --- End Company Membership Check ---

  const taskId = params.id;

  if (!taskId) {
    return NextResponse.json(
      { error: 'Task ID is required' },
      { status: 400 }
    );
  }

  console.log(`Attempting to delete task ID: ${taskId} and related data by user: ${user.id} in company: ${userCompanyId}`);

  try {
    // --- Authorization and Fetching Related IDs ---

    // 1. Fetch the task to verify ownership AND get related IDs
    const { data: taskToDelete, error: fetchError } = await supabase
      .from('maintenance_requests')
      // Select columns needed for authorization and related deletions
      .select('id, company_id, charges_id, transaction_id') 
      .eq('id', taskId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error fetching task ${taskId} for deletion check:`, fetchError);
      return NextResponse.json({ error: 'Failed to verify task existence', details: fetchError.message }, { status: 500 });
    }

    if (!taskToDelete) {
       console.log(`Task ${taskId} not found.`);
       // If the task is gone, its related data should ideally also be gone or orphaned.
       // We can return success here as the desired end state (no task) is met.
       // Or return 404 if strict "task must exist to delete its stuff" is needed.
       // Let's return 404 for clarity.
       return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // *** Authorization Check ***
    if (taskToDelete.company_id !== userCompanyId) {
      console.warn(`Authorization failed: User ${user.id} (Company ${userCompanyId}) attempted action on task ${taskId} (Company ${taskToDelete.company_id})`);
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this task' }, { status: 403 });
    }

    // --- Deletion Logic ---

    // 2. Delete associated data (Notes, Files, Charges, Transactions)

    // Delete Notes
    console.log(`Deleting notes associated with task ${taskId}`);
    const { error: deleteNotesError } = await supabase
        .from('maintenance_notes')
        .delete()
        .eq('maintenance_id', taskId);
    if (deleteNotesError) console.error(`Error deleting notes for task ${taskId}:`, deleteNotesError);
    else console.log(`Successfully deleted notes for task ${taskId}`);

    // Delete Files (Storage & DB)
    console.log(`Handling files associated with task ${taskId}`);
    const { data: filesToDelete, error: fetchFilesError } = await supabase
        .from('maintenance_file')
        .select('id, file_path')
        .eq('maintenance_id', taskId);
    if (fetchFilesError) console.error(`Error fetching files for task ${taskId}:`, fetchFilesError);
    else if (filesToDelete && filesToDelete.length > 0) {
        const filePaths = filesToDelete.map(file => file.file_path).filter(path => !!path);
        if (filePaths.length > 0) {
            console.log(`Attempting to delete ${filePaths.length} files from storage.`);
            const { error: storageDeleteError } = await supabase.storage.from('maintenance_files').remove(filePaths);
            if (storageDeleteError) console.error(`Error deleting files from storage for task ${taskId}:`, storageDeleteError);
            else console.log(`Successfully deleted files from storage for task ${taskId}.`);
        }
        console.log(`Deleting ${filesToDelete.length} file records from database.`);
        const { error: deleteDbFilesError } = await supabase.from('maintenance_file').delete().eq('maintenance_id', taskId);
        if (deleteDbFilesError) console.error(`Error deleting file records from database for task ${taskId}:`, deleteDbFilesError);
        else console.log(`Successfully deleted file records from database for task ${taskId}.`);
    } else console.log(`No files found associated with task ${taskId}.`);

    // Delete Related Charges
    const chargeIdsToDelete: string[] = [];
    if (Array.isArray(taskToDelete.charges_id)) {
      taskToDelete.charges_id.forEach((item: unknown) => {
        // Basic type check for the object structure
        if (typeof item === 'object' && item !== null && 'id' in item && typeof (item as IdObject).id === 'string') {
          chargeIdsToDelete.push((item as IdObject).id);
        }
      });
    }

    if (chargeIdsToDelete.length > 0) {
        console.log(`Deleting ${chargeIdsToDelete.length} charges associated with task ${taskId}. IDs:`, chargeIdsToDelete);
        const { error: deleteChargesError } = await supabase
            .from('charges')
            .delete()
            .in('id', chargeIdsToDelete); // Use .in() for multiple IDs

        if (deleteChargesError) {
            console.error(`Error deleting charges for task ${taskId}:`, deleteChargesError);
            // Optional: Throw error
        } else {
            console.log(`Successfully deleted charges for task ${taskId}.`);
        }
    } else {
        console.log(`No associated charge IDs found for task ${taskId}.`);
    }

    // Delete Related Transactions
    const transactionIdsToDelete: string[] = [];
     if (Array.isArray(taskToDelete.transaction_id)) {
      taskToDelete.transaction_id.forEach((item: unknown) => {
        if (typeof item === 'object' && item !== null && 'id' in item && typeof (item as IdObject).id === 'string') {
          transactionIdsToDelete.push((item as IdObject).id);
        }
      });
    }

    if (transactionIdsToDelete.length > 0) {
        console.log(`Deleting ${transactionIdsToDelete.length} transactions associated with task ${taskId}. IDs:`, transactionIdsToDelete);
        const { error: deleteTransactionsError } = await supabase
            .from('transaction')
            .delete()
            .in('id', transactionIdsToDelete); // Use .in() for multiple IDs

        if (deleteTransactionsError) {
            console.error(`Error deleting transactions for task ${taskId}:`, deleteTransactionsError);
            // Optional: Throw error
        } else {
            console.log(`Successfully deleted transactions for task ${taskId}.`);
        }
    } else {
        console.log(`No associated transaction IDs found for task ${taskId}.`);
    }

    // 3. Delete the task itself
    console.log(`Deleting task ${taskId}`);
    const { data: deletedTaskData, error: deleteTaskError } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', taskId)
      .eq('company_id', userCompanyId)
      .select('id')
      .single();

    if (deleteTaskError) {
      console.error(`Error deleting task ${taskId} itself:`, deleteTaskError);
       if (deleteTaskError.code === 'PGRST116') { // Task already deleted (race condition?)
         console.log(`Task ${taskId} was likely already deleted before final delete step.`);
         // Still consider it a success as the end state is achieved.
       } else {
         // Throw an error if deletion failed for other reasons
         throw new Error(`Failed to delete task: ${deleteTaskError.message}`);
       }
    } else if (!deletedTaskData) {
        // This case shouldn't happen often with .single() if PGRST116 is handled, but log just in case.
        console.warn(`Task ${taskId} delete operation returned no data, might have been deleted already.`);
    } else {
        console.log(`Successfully deleted task ${taskId}`);
    }

    // --- End Deletion Logic ---

    // Update the success message
    return NextResponse.json({ message: 'Task and all associated data deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Failed to complete deletion process for task ${taskId}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
