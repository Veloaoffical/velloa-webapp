'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreHorizontal, Search, StickyNote, Plus, X, Upload } from "lucide-react";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";

interface Note {
  id: string;
  note: string;
  note_title: string;
  created_at: string;
  created_by: {
    first_name: string;
    middle_name: string;
    last_name: string;
  };
}

interface TaskNotesProps {
  taskId: string;
  initialNotes: Note[];
}

export function TaskNotes({ taskId, initialNotes }: TaskNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [showDialog, setShowDialog] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
    }
  });

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/notes`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      console.log('Fetched notes data:', data);
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Add new note
  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_title: noteTitle.trim(),
          note: noteContent.trim(),
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.error || 'Failed to add note');
      }

      // Refresh notes
      await fetchNotes();
      
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setFiles([]);
      setShowDialog(false);
    } catch (error) {
      console.error('Error details:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    console.log('Note being filtered:', note);
    return note.note_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           note.note.toLowerCase().includes(searchQuery.toLowerCase())
  });

  return (
    <>
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Button className="gap-2" onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-12">
              <StickyNote className="h-12 w-12 text-muted-foreground/60 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No notes match your search" : "No notes yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Button className="gap-2" onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>

            <div className="space-y-6 mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Note</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <StickyNote className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{note.note_title}</div>
                            <div className="text-sm text-muted-foreground">{note.note}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <>{console.log('Rendering note created_by:', note.created_by)}</>
                        {note.created_by.first_name} {note.created_by.middle_name} {note.created_by.last_name}
                      </TableCell>
                      <TableCell>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Create New Note</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Add details about this maintenance request
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input 
                placeholder="What's your note's title?" 
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                placeholder="Write your note..." 
                className="min-h-[100px]"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            </div>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                isDragActive ? 'border-primary' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? "Drop the files here..."
                  : "Drag 'n' drop files here, or click to select files"}
              </p>
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAddNote}
              disabled={isLoading || !noteTitle.trim() || !noteContent.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 