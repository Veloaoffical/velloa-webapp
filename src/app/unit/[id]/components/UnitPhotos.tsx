"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { ImageIcon, UploadCloud, Star, Trash2, Search } from "lucide-react"
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

interface Photo {
  id: string
  fileUrl: string
  fileName: string
  createdAt: string
  favorite: boolean
  isFavorite: boolean
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
}

export function UnitPhotos() {
  const params = useParams()
  const [photos, setPhotos] = React.useState<Photo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([])
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [selectedPhoto, setSelectedPhoto] = React.useState<Photo | null>(null)
  const [deleteConfirmPhoto, setDeleteConfirmPhoto] = React.useState<Photo | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [mediaType, setMediaType] = React.useState("all")

  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true)
      const unitId = params.id as string

      // Fetch photos from our API endpoint
      const response = await fetch(`/api/unit/${unitId}/photos`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch photos')
      }

      const fetchedPhotos = await response.json()
      // Sort photos to ensure favorites are at the top
      const sortedPhotos = [...fetchedPhotos].sort((a, b) => {
        if (a.favorite && !b.favorite) return -1
        if (!a.favorite && b.favorite) return 1
        // If both have same favorite status, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setPhotos(sortedPhotos)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
      console.error('Error fetching photos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const unitId = params.id as string
    
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
          const response = await fetch(`/api/unit/${unitId}/photos`, {
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

      // Refresh the photos list
      await fetchPhotos()
      
      // Clear uploading files after a delay to show completion
      setTimeout(() => {
        setUploadingFiles([])
        setShowUploadDialog(false)
        toast.success('Photos uploaded successfully')
      }, 1000)
    } catch (err) {
      console.error('Error uploading photos:', err)
      toast.error('Some photos failed to upload')
    }
  }, [params.id, fetchPhotos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxFiles: 10
  })

  const toggleFavorite = async (photoId: string, currentFavorite: boolean) => {
    const unitId = params.id as string
    try {
      const response = await fetch(`/api/unit/${unitId}/photos/${photoId}/favorite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favorite: !currentFavorite
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update favorite status');
      }

      const updatedPhotos = await response.json();
      // Sort photos to ensure favorites are at the top
      const sortedPhotos = [...updatedPhotos].sort((a, b) => {
        if (a.favorite && !b.favorite) return -1
        if (!a.favorite && b.favorite) return 1
        // If both have same favorite status, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      });
      setPhotos(sortedPhotos);

      toast.success(currentFavorite ? 'Removed from favorites' : 'Set as favorite photo');
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update favorite status');
    }
  };

  const deletePhoto = async (photoId: string) => {
    const unitId = params.id as string
    try {
      const response = await fetch(`/api/unit/${unitId}/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      // Remove the photo from the local state
      setPhotos(photos.filter(photo => photo.id !== photoId));
      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete photo');
    }
  };

  // Filter photos based on search and media type
  const filteredPhotos = React.useMemo(() => {
    return photos.filter(photo => {
      const matchesSearch = photo.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = mediaType === "all" || 
        (mediaType === "images" && !photo.fileName.toLowerCase().includes(".mp4")) ||
        (mediaType === "videos" && photo.fileName.toLowerCase().includes(".mp4"))
      return matchesSearch && matchesType
    })
  }, [photos, searchQuery, mediaType])

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={mediaType}
                onValueChange={setMediaType}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Media</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[18vh] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">
                {photos.length === 0 ? "No media uploaded" : "No results found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group h-[18vh] relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Image
                    src={photo.fileUrl}
                    alt={photo.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center">
                      <p className="text-white text-sm truncate">{photo.fileName}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmPhoto(photo);
                        }}
                        className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                        <VisuallyHidden>Delete photo</VisuallyHidden>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(photo.id, photo.favorite);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        photo.favorite
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white'
                      }`}
                    />
                    <VisuallyHidden>
                      {photo.favorite ? 'Remove as favorite' : 'Set as favorite'}
                    </VisuallyHidden>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Photos</DialogTitle>
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
                  {isDragActive ? 'Drop the files here...' : 'Drag and drop up to 10 photos here, or click to select files'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: JPEG, PNG, WebP
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

        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            {selectedPhoto && (
              <div className="relative aspect-video">
                <Image
                  src={selectedPhoto.fileUrl}
                  alt={selectedPhoto.fileName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                  quality={100}
                  priority={true}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmPhoto} onOpenChange={() => setDeleteConfirmPhoto(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Photo</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this photo? This action cannot be undone.</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmPhoto(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmPhoto) {
                    deletePhoto(deleteConfirmPhoto.id)
                    setDeleteConfirmPhoto(null)
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