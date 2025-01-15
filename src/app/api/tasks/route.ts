import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateCustomId } from '@/lib/utils/generate-id';

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface TaskWithProfile {
  id: string
  subject: string
  description: string
  priority: string
  status: string
  task_type: string
  Recurring_frequency: string | null
  start_date: string | null
  due_date: string | null
  assignees: string | null
  property_id: string | null
  unit_id: string | null
  notify_assignee: boolean
  role: string
  created_by: string
  created_at: string
  profiles: Profile
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tasks, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the creator's name and dates
    const processedTasks = (tasks as unknown as TaskWithProfile[])?.map(task => ({
      ...task,
      created_by: task.profiles ? 
        `${task.profiles.first_name || ''} ${task.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(task.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })) || [];

    return NextResponse.json(processedTasks);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Generate a custom ID for the task
    const nano_id = generateCustomId();

    // First, create the task
    const { data: taskData, error: taskError } = await supabase
      .from('maintenance_requests')
      .insert([{
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        task_type: data.task_type,
        Recurring_frequency: data.Recurring_frequency,
        start_date: data.start_date,
        due_date: data.due_date,
        assignees: data.assignees,
        property_id: data.property_id,
        unit_id: data.unit_id,
        notify_assignee: data.notify_assignee,
        role: data.role,
        created_by: user.id,
        nano_id: nano_id
      }])
      .select(`
        *,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Format the creator's name and dates for the response
    const processedTask = taskData ? {
      ...taskData,
      created_by: taskData.profiles ? 
        `${taskData.profiles.first_name || ''} ${taskData.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(taskData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } : null;

    // If there's an assignee and notify_assignee is true, create a notification
    if (data.assignees && data.notify_assignee) {
      // First create the notification subject
      const { data: subjectData, error: subjectError } = await supabase
        .from('notification_subjects')
        .insert([{
          id: crypto.randomUUID(),
          table_name: 'maintenance_requests',
          row_id: taskData.id
        }])
        .select()
        .single();

      if (subjectError) {
        console.error('Error creating notification subject:', subjectError);
        // Continue anyway as the task was created successfully
      } else {
        // Then create the notification
        const { error: notificationError } = await supabase
          .from('notification')
          .insert([{
            id: crypto.randomUUID(),
            recipient_id: data.assignees,
            subject_id: subjectData.id,
            type: 'task',
            message: 'A new task has been added for you',
            read: false
          }]);

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Continue anyway as the task was created successfully
        }
      }
    }

    return NextResponse.json(processedTask, { status: 201 });
  } catch (error) {
    console.error('Error in task creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 