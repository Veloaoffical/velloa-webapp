"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, X, NotebookPen } from "lucide-react";
import { useState, useEffect } from "react";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ToolbarPlugin } from '@/components/editor/ToolbarPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import NoteGridView from '@/components/note-grid-view';
import { useSearchParams } from 'next/navigation';

export interface ProcessedNote {
  id: string;
  note_title: string;
  note: string | Record<string, unknown>;
  created_at: string;
  created_by: {
    first_name: string;
    middle_name: string;
    last_name: string;
  };
}

interface LeaseNotesProps {
  leaseId: string;
  notes: ProcessedNote[];
  addNoteToState: (newNote: ProcessedNote) => void;
  initialDialogOpen?: boolean;
  dialogOpenTrigger?: number;
}

// Helper to always provide a valid Lexical editor state string
const EMPTY_LEXICAL_STATE = JSON.stringify({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        children: [],
        direction: null,
        textStyle: "",
        textFormat: 0
      }
    ],
    direction: null
  }
});

function getEditorStateString(value: string | Record<string, unknown>) {
  if (typeof value === 'string') {
    try {
      if (!value.trim()) return EMPTY_LEXICAL_STATE;
      JSON.parse(value);
      return value;
    } catch {
      return EMPTY_LEXICAL_STATE;
    }
  } else if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return EMPTY_LEXICAL_STATE;
    }
  }
  return EMPTY_LEXICAL_STATE;
}

function MemoEditor({ initialValue, onChange }: { initialValue: string | Record<string, unknown>, onChange: (value: string) => void }) {
  const editorStateString = getEditorStateString(initialValue);
  const initialConfig = {
    namespace: 'LeaseNoteEditor',
    theme: {
      ltr: 'ltr',
      rtl: 'rtl',
      paragraph: 'mb-2 last:mb-0',
      list: {
        listitem: 'ml-4',
        nested: {
          listitem: 'ml-4',
        },
      },
    },
    nodes: [ListNode, ListItemNode],
    onError: (error: Error) => { throw error; },
    editorState: editorStateString,
  };
  return (
    <div className="relative min-h-[240px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <ToolbarPlugin />
          <div className="relative">
            <RichTextPlugin
              contentEditable={<ContentEditable className="min-h-[200px] outline-none pt-2" />}
              placeholder={
                <span className="absolute left-0 top-2 text-muted-foreground pointer-events-none select-none" style={{ fontSize: 14 }}>
                  Write your note...
                </span>
              }
              ErrorBoundary={({ children }) => <div>{children}</div>}
            />
            <OnChangePlugin
              onChange={editorState => onChange(JSON.stringify(editorState))}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

export function MemoViewer({ value }: { value: string | Record<string, unknown> }) {
  const editorStateString = getEditorStateString(value);
  const initialConfig = {
    namespace: 'LeaseNoteViewer',
    theme: {
      ltr: 'ltr',
      rtl: 'rtl',
      paragraph: 'mb-2 last:mb-0',
      list: {
        listitem: 'ml-4',
        nested: {
          listitem: 'ml-4',
        },
      },
    },
    nodes: [ListNode, ListItemNode],
    onError: (error: Error) => { throw error; },
    editorState: editorStateString,
    editable: false,
  };
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="min-h-[20px] outline-none" />}
        placeholder={null}
        ErrorBoundary={({ children }) => <div>{children}</div>}
      />
    </LexicalComposer>
  );
}

// Helper to check if note content is empty (for both string and Lexical JSON)
function isNoteContentEmpty(content: string | Record<string, unknown>): boolean {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      // Check for empty Lexical state
      return !parsed.root || !parsed.root.children || parsed.root.children.length === 0;
    } catch {
      return !content.trim();
    }
  } else if (typeof content === 'object' && content !== null) {
    // Check for empty Lexical state
    if (!('root' in content) || !content.root || typeof content.root !== 'object' || content.root === null) {
      return true;
    }
    const root = content.root as Record<string, unknown>;
    if (!('children' in root) || !Array.isArray(root.children)) {
      return true;
    }
    return root.children.length === 0;
  }
  return true;
}

export function LeaseNotes({ leaseId, notes, addNoteToState, initialDialogOpen = false, dialogOpenTrigger = 0 }: LeaseNotesProps) {
  const [showDialog, setShowDialog] = useState(initialDialogOpen);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Open dialog if action=add is in the URL
    if (searchParams.get('action') === 'add') {
      setShowDialog(true);
    }
  }, [searchParams]);

  // Effect to watch dialogOpenTrigger changes
  useEffect(() => {
    if (dialogOpenTrigger > 0) {
      setShowDialog(true);
    }
  }, [dialogOpenTrigger]);

  const handleAddNote = async () => {
    if (!noteTitle.trim() || isNoteContentEmpty(noteContent)) {
      setErrorMessage('Note content and title are required.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leases/${leaseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_title: noteTitle.trim(),
          data: noteContent,
        }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to add note');
        throw new Error(data.error || 'Failed to add note');
      }
      const newNote: ProcessedNote = {
        id: data.id || Math.random().toString(),
        note_title: noteTitle.trim(),
        note: noteContent,
        created_at: new Date().toISOString(),
        created_by: data.created_by || { first_name: '', middle_name: '', last_name: '' },
      };
      addNoteToState(newNote);
      setNoteTitle('');
      setNoteContent('');
      setShowDialog(false);
    } catch (error) {
      setErrorMessage('Failed to add note. Please try again.');
      console.error('Error saving note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    const noteText = typeof note.note === 'string' ? note.note : '';
    return note.note_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      noteText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col">
      {filteredNotes.length === 0 ? (
        <Card className="flex-1 flex flex-col h-full shadow-sm">
          <CardContent className="flex-1 flex flex-col h-full p-6">
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
            <div className="flex flex-col items-center justify-center text-center py-12 flex-1">
              <NotebookPen className="w-20 h-20 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">
                {searchQuery ? "No notes match your search" : "No notes yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col h-full shadow-sm">
          <CardContent className="flex-1 flex flex-col h-full p-6">
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
            <div className="space-y-6 mt-6 flex-1 overflow-auto">
              <NoteGridView notes={filteredNotes} />
            </div>
          </CardContent>
        </Card>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Create New Note</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Add details about this lease
            </p>
            {errorMessage && (
              <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="note-title" className="block text-sm font-medium text-gray-700">Note Title</label>
              <Input 
                id="note-title"
                placeholder="What's your note's title?" 
                value={noteTitle}
                className="w-1/2"
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <MemoEditor
                initialValue={noteContent}
                onChange={setNoteContent}
              />
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
    </div>
  );
}

export default LeaseNotes; 