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
import { ImageIcon, UploadCloud, X, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface PhotosProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export default function Photos({ open, onOpenChange }: PhotosProps) {
  const params = useParams()
  const [photos, setPhotos] = React.useState<Photo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([])
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [selectedPhoto, setSelectedPhoto] = React.useState<Photo | null>(null)
  const [deleteConfirmPhoto, setDeleteConfirmPhoto] = React.useState<Photo | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const propertyId = params.id as string
    
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
          const response = await fetch(`/api/property/${propertyId}/photos`, {
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
  }, [params.id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxFiles: 10
  })

  const fetchPhotos = async () => {
    try {
      setIsLoading(true)
      const propertyId = params.id as string

      // Fetch photos from our API endpoint instead of direct Supabase call
      const response = await fetch(`/api/property/${propertyId}/photos`, {
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
  }

  React.useEffect(() => {
    let mounted = true

    if (open && mounted) {
      fetchPhotos()
    }

    return () => {
      mounted = false
    }
  }, [params.id, open])

  const toggleFavorite = async (photoId: string, currentFavorite: boolean) => {
    const propertyId = params.id as string
    try {
      const response = await fetch(`/api/property/${propertyId}/photos/${photoId}/favorite`, {
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
    const propertyId = params.id as string
    try {
      const response = await fetch(`/api/property/${propertyId}/photos/${photoId}`, {
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
          aria-describedby="dialog-description"
        >
          <DialogHeader className="sticky top-0 z-50 bg-white pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">Property Photos</DialogTitle>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Photo
              </Button>
            </div>
          </DialogHeader>
          
          <div id="dialog-description" className="sr-only">
            Upload and manage property photos
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 h-[40vh]">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[18vh] bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No photos uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 h-[40vh]">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group h-[18vh] relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={photo.fileUrl}
                        alt={photo.fileName}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        quality={100}
                        priority={true}
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
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                onOpenChange(false)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmPhoto} onOpenChange={(open) => !open && setDeleteConfirmPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p>Are you sure you want to delete this photo? This action cannot be undone.</p>
          </div>
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
                  deletePhoto(deleteConfirmPhoto.id);
                  setDeleteConfirmPhoto(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedPhoto?.fileName || 'Property Image'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[90vh]">
            {selectedPhoto && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                  <VisuallyHidden>Close image viewer</VisuallyHidden>
                </Button>
                <Image
                  src={selectedPhoto.fileUrl}
                  alt={selectedPhoto.fileName}
                  fill
                  className="object-contain"
                  quality={100}
                  priority={true}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}