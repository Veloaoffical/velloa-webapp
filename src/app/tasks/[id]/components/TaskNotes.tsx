'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";
import { format } from "date-fns";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: {
    first_name: string;
    last_name: string;
  };
}

interface TaskNotesProps {
  taskId: string;
  initialNotes: Note[];
}

export function TaskNotes({ taskId, initialNotes }: TaskNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Add new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError;

      const { error: insertError } = await supabase
        .from('task_notes')
        .insert({
          task_id: taskId,
          content: newNote.trim(),
          created_by: user.id
        });

      if (insertError) throw insertError;

      // Refetch notes to get the updated list
      const { data: updatedNotes, error: fetchError } = await supabase
        .from('task_notes')
        .select(`
          id,
          content,
          created_at,
          created_by:profiles!task_notes_created_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the response to match the Note interface
      const transformedNotes: Note[] = (updatedNotes || []).map(note => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        created_by: {
          first_name: note.created_by[0].first_name,
          last_name: note.created_by[0].last_name
        }
      }));

      setNotes(transformedNotes);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Add Note</h2>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your note here..."
              className="min-h-[100px]"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button 
              className="w-full sm:w-auto"
              onClick={handleAddNote}
              disabled={isLoading || !newNote.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length > 0 ? (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {note.created_by.first_name} {note.created_by.last_name}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No notes yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 