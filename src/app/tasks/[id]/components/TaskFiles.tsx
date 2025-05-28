"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FileIcon, UploadCloud, Search } from "lucide-react"
import { toast } from "sonner"
import { useCallback } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import FileViewer, { File as FileViewerFile } from "@/components/file-grid-view"

interface TaskFile {
  id: string
  fileUrl: string
  fileName: string
  fileType: string
  createdAt: string
  fileSize: number
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  fileSize: number
}

interface TaskFilesProps {
  initialFiles: TaskFile[]
  taskId: string
}

export function TaskFiles({ initialFiles, taskId }: TaskFilesProps) {
  const [files, setFiles] = React.useState<TaskFile[]>(initialFiles)
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([])
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [deleteConfirmFile, setDeleteConfirmFile] = React.useState<TaskFile | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [fileType, setFileType] = React.useState("all")

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Initialize uploading files state
    const initialUploadingState = acceptedFiles.map(file => ({ file, progress: 0, fileSize: file.size }));
    setUploadingFiles(initialUploadingState);
    setShowUploadDialog(true); // Keep dialog open during upload

    try {
      // 1. Prepare file payloads (convert to base64)
      const filePayloads = await Promise.all(
        acceptedFiles.map(async (file, index) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });

          // Update progress for individual file after conversion (optional)
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 50 } : f
          ));

          console.log('Frontend: Prepared file for API:', {
            fileName: file.name,
            fileType: file.type,
            base64Length: base64.length,
            base64Prefix: base64.substring(0, 50)
          });

          return {
            file_url: base64,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          };
        })
      );

      // 2. Send ALL files in a single API request
      console.log(`Frontend: Sending ${filePayloads.length} files to API...`);
      const response = await fetch(`/api/tasks/${taskId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: filePayloads }), // Send array under 'files' key
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = 'Failed to upload files';
        try {
          const errorData = await response.json();
          errorMsg = errorData.details || errorData.error || errorData.message || errorMsg;
          // If backend returns per-file errors, handle them here
        } catch (e) { 
          console.error("Could not parse error response", e);
        }
        console.error('API Error Response:', response.status, errorMsg);
        toast.error(`Upload failed: ${errorMsg}`);
        // Mark all as errored
        setUploadingFiles(prev => prev.map(f => ({ ...f, progress: 100, error: errorMsg })))
        return; // Stop processing on API error
      }

      // 3. Process successful response (array of uploaded files)
      const newlyUploadedFiles: TaskFile[] = await response.json();
      console.log('Frontend: Received uploaded files from API:', newlyUploadedFiles);

      // Update main files list
      setFiles(prev => [
        ...prev,
        ...newlyUploadedFiles.map(uploaded => ({
          id: uploaded.id,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName, // Use name from response
          fileType: uploaded.fileType || 'unknown', // Use type from response or default
          createdAt: uploaded.createdAt,
          fileSize: uploaded.fileSize // Add fileSize from response
        }))
      ]);
      console.log('State updated after upload:', files);

      // Mark all as complete
      setUploadingFiles(prev => prev.map(f => ({ ...f, progress: 100 })));

      toast.success(`${newlyUploadedFiles.length} file(s) uploaded successfully`);

      // Clear uploading files and close dialog after a delay
      setTimeout(() => {
        setUploadingFiles([]);
        setShowUploadDialog(false);
      }, 1000);

    } catch (err) {
      console.error('Error during file processing or upload:', err);
      toast.error('An error occurred during upload');
      // Mark all as errored if error happened before/during fetch
      setUploadingFiles(prev => prev.map(f => ({ 
        ...f, 
        error: err instanceof Error ? err.message : 'Upload preparation failed' 
      })))
    }
  }, [taskId, files]); // Add 'files' to dependency array

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      // Add image types
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    multiple: true,
    maxFiles: 10
  })

  const deleteFile = async (fileId: string) => {
    console.log("Attempting to delete file:", fileId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
        credentials: 'include'
      });
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API delete error:", errorData);
        throw new Error(errorData.error || 'Failed to delete file');
      }

      // Remove the file from the local state
      console.log("!!! Reached point before setFiles !!!");
      const newFiles = files.filter(file => file.id !== fileId);
      setFiles(newFiles);
      console.log('State updated after delete:', newFiles);
      toast.success('File deleted successfully');

    } catch (error) {
      console.error('Error in deleteFile function:', error);
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

  // Map TaskFile to FileViewerFile
  const mappedFiles: FileViewerFile[] = React.useMemo(() =>
    filteredFiles.map(file => ({
      id: file.id,
      name: file.fileName,
      url: file.fileUrl,
      size: file.fileSize,
      type: file.fileType || "",
      createdAt: file.createdAt,
    })),
    [filteredFiles]
  )

  console.log('Rendering FileViewer with files:', mappedFiles);

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col">
      <Card className="flex-1 flex flex-col h-full shadow-sm">
        <CardContent className="flex-1 flex flex-col h-full p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full"
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

          <div className="mt-6 flex-1 flex flex-col overflow-auto space-y-6">
            {files.length === 0 && uploadingFiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 flex-1 flex flex-col justify-center">
                <FileIcon className="w-20 h-20 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">
                  {files.length === 0 ? "No files uploaded" : "No results found"}
                </p>
              </div>
            ) : (
              <FileViewer
                key={JSON.stringify(mappedFiles.map(f => f.id))}
                files={mappedFiles}
                onDeleteRequest={(fileToDelete) => {
                  // Find original TaskFile if needed, or use mappedFile if sufficient
                  const originalFile = files.find(f => f.id === fileToDelete.id);
                  if (originalFile) {
                    setDeleteConfirmFile(originalFile); // Trigger the existing dialog
                  }
                }}
              />
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
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF, WEBP
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
    </div>
  )
} 