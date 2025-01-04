"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MoreHorizontal, Search, StickyNote, Plus, X, FileText, Upload } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { useDropzone } from "react-dropzone"

interface Note {
  id: string
  note: string
  note_title: string
  tags: string[]
  created_at: string
  created_by: string
}

interface PersonNotesProps {
  personId: string
}

export function PersonNotes({ personId }: PersonNotesProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [tags, setTags] = useState<string[]>([])

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

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/people/${personId}/notes`, {
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
  }, [personId])

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/people/${personId}/notes`, {
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
      setShowDialog(false)
      
      // Refresh notes
      fetchNotes()
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    note.note_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.note.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <FileText className="h-12 w-12 text-muted-foreground/60 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No notes match your search" : "No notes uploaded"}
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
                    <TableHead>Tags</TableHead>
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
                        <div className="flex gap-1">
                          {(note.tags || []).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{note.created_at}</TableCell>
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>
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