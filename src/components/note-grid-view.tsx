"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { StickyNote } from "lucide-react"
import { format } from "date-fns"
import { MemoViewer } from "@/app/tasks/[id]/components/TaskNotes"

export type Note = {
  id: string
  note: string | Record<string, unknown>
  note_title: string
  created_at: string
  created_by: {
    first_name: string
    middle_name: string
    last_name: string
  }
}

type NoteGridViewProps = {
  notes: Note[]
}

function extractTextFromLexical(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractTextFromLexical).join(" ");
  if (typeof node === "object" && node !== null) {
    // Type assertion for object with possible text/children
    const obj = node as { text?: string; children?: unknown[] };
    if (obj.text) return obj.text;
    if (obj.children) return obj.children.map(extractTextFromLexical).join(" ");
  }
  return "";
}

function getNotePreview(note: string | Record<string, unknown>): string {
  if (typeof note === "string") {
    // Try to parse as JSON, fallback to plain text
    try {
      const parsed = JSON.parse(note);
      if (parsed && parsed.root) {
        const text = extractTextFromLexical(parsed.root);
        return text.length > 100 ? text.slice(0, 100) + "..." : text;
      }
    } catch {
      // Not JSON, just return the string
      return note.length > 100 ? note.slice(0, 100) + "..." : note;
    }
  }
  // If it's an object (Lexical), extract text
  if (typeof note === "object" && note.root) {
    const text = extractTextFromLexical(note.root);
    return text.length > 100 ? text.slice(0, 100) + "..." : text;
  }
  return "";
}

export default function NoteGridView({ notes }: NoteGridViewProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Notes grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-background group relative flex flex-col rounded-md border transition-all hover:shadow-md overflow-hidden cursor-pointer"
            onClick={() => setSelectedNote(note)}
          >
            <div className="flex items-center justify-center bg-accent p-8 border-b min-h-[80px]">
              <StickyNote className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1 p-3">
              <div className="truncate text-[13px] text-muted-foreground">
                {getNotePreview(note.note)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {note.created_by.first_name} {note.created_by.last_name}
              </div>
              <div className="text-xs text-muted-foreground mt-auto pt-2 border-t border-muted-foreground/10">
                {format(new Date(note.created_at), "MMM d, yyyy")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No notes message */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-muted rounded-full p-3 mb-4">
            <StickyNote className="size-6 opacity-60" />
          </div>
          <h3 className="text-lg font-medium mb-1">No notes</h3>
          <p className="text-muted-foreground text-sm">All notes have been deleted or none exist yet</p>
        </div>
      )}

      {/* Note preview modal */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2 w-full">
              <StickyNote className="size-5 text-green-600" />
              <DialogTitle className="text-center w-full">{selectedNote?.note_title}</DialogTitle>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center w-full">
              {selectedNote && `${selectedNote.created_by.first_name} ${selectedNote.created_by.last_name} • ${format(new Date(selectedNote.created_at), "MMM d, yyyy h:mm a")}`}
            </div>
          </DialogHeader>
          <div className="py-2">
            {selectedNote && <MemoViewer value={selectedNote.note} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNote(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}