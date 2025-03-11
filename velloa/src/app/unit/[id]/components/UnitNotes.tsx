"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MoreHorizontal, Search, StickyNote, Plus, Upload, X } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"

interface Note {
  id: string
  note: string
  note_title: string
  tags: string[]
  created_at: string
  created_by: string
}

interface UnitNotesProps {
  unitId: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function UnitNotes({ unitId }: UnitNotesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/unit/${unitId}/notes`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [unitId])

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/unit/${unitId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          note: noteContent,
          note_title: noteTitle,
          tags: tags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save note')
      }

      // Reset form
      setNoteTitle("")
      setNoteContent("")
      setTags([])
      setFiles([])
      setIsDialogOpen(false)
      
      // Refresh notes
      fetchNotes()
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
    }
  })

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes..." className="pl-8" />
          </div>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
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
                    <div className="flex gap-1">
                      {(note.tags || []).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{note.created_at}</TableCell>
                  <TableCell>{note.created_by}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Create New Note</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Learn about creating and editing notes
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
            <div className="space-y-2">
              <Input 
                placeholder="Add tags (comma separated)"
                value={tags.join(", ")}
                onChange={(e) => setTags(e.target.value.split(",").map(tag => tag.trim()).filter(Boolean))}
              />
            </div>
            <div 
              {...getRootProps()} 
              className={`border rounded-lg p-8 border-dashed text-center transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : ""
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? (
                    "Drop the files here..."
                  ) : (
                    <>
                      Drag files here or <span className="text-primary cursor-pointer">click to upload</span>
                    </>
                  )}
                </p>
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFiles(files.filter((_, i) => i !== index))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 