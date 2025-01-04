"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { FileIcon, UploadCloud, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PersonFile {
  id: string
  fileUrl: string
  fileName: string
  createdAt: string
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
}

export function PersonFiles() {
  const params = useParams()
  const [files, setFiles] = React.useState<PersonFile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([])
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [deleteConfirmFile, setDeleteConfirmFile] = React.useState<PersonFile | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [fileType, setFileType] = React.useState("all")

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const personId = params.id as string

      // Fetch files from our API endpoint
      const response = await fetch(`/api/people/${personId}/files`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const fetchedFiles = await response.json()
      // Sort by creation date (newest first)
      const sortedFiles = [...fetchedFiles].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setFiles(sortedFiles)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
      console.error('Error fetching files:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const personId = params.id as string
    
    // Initialize uploading files state
    setUploadingFiles(acceptedFiles.map(file => ({
      file,
      progress: 0
    })))
    
    try {
      // Upload files in parallel
      await Promise.all(acceptedFiles.map(async (file, index) => {
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
          })

          // Update progress to 50% after base64 conversion
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 50 } : f
          ))

          // Send to API
          const response = await fetch(`/api/people/${personId}/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              fileType: file.type
            }),
            credentials: 'include'
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || error.message || 'Failed to upload file');
          }

          await response.json();

          // Update progress to 100% after successful upload
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 100 } : f
          ))
        } catch (err) {
          // Update file state with error
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, error: err instanceof Error ? err.message : 'Upload failed' } : f
          ))
        }
      }))

      // Refresh the files list
      await fetchFiles()
      
      // Clear uploading files after a delay to show completion
      setTimeout(() => {
        setUploadingFiles([])
        setShowUploadDialog(false)
        toast.success('Files uploaded successfully')
      }, 1000)
    } catch (err) {
      console.error('Error uploading files:', err)
      toast.error('Some files failed to upload')
    }
  }, [params.id, fetchFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    multiple: true,
    maxFiles: 10
  })

  const deleteFile = async (fileId: string) => {
    const personId = params.id as string
    try {
      const response = await fetch(`/api/people/${personId}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      // Remove the file from the local state
      setFiles(files.filter(file => file.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  // Filter files based on search and file type
  const filteredFiles = React.useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = fileType === "all" || 
        (fileType === "documents" && /\.(doc|docx|pdf|txt)$/i.test(file.fileName)) ||
        (fileType === "spreadsheets" && /\.(xls|xlsx)$/i.test(file.fileName))
      return matchesSearch && matchesType
    })
  }, [files, searchQuery, fileType])

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={fileType}
                onValueChange={setFileType}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">
                {files.length === 0 ? "No files uploaded" : "No results found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative rounded-lg overflow-hidden border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-6 w-6 text-gray-400" />
                      <span className="text-sm font-medium">{file.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeleteConfirmFile(file)}
                        className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400" />
                        <VisuallyHidden>Delete file</VisuallyHidden>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive ? 'Drop the files here...' : 'Drag and drop up to 10 files here, or click to select files'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT
                </p>
              </div>

              {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{file.file.name}</span>
                        <span>{file.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            file.error ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      {file.error && (
                        <p className="text-xs text-red-500">{file.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowUploadDialog(false)
                setUploadingFiles([])
              }}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmFile} onOpenChange={() => setDeleteConfirmFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this file? This action cannot be undone.</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmFile(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmFile) {
                    deleteFile(deleteConfirmFile.id)
                    setDeleteConfirmFile(null)
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 