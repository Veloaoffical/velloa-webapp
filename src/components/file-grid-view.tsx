"use client"

import {
  FileArchiveIcon,
  FileIcon,
  ImageIcon,
  ExternalLinkIcon,
  EyeIcon,
  DownloadIcon,
  TrashIcon,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { format } from "date-fns"

type FileType = {
  name: string
  size: number
  type: string
  url: string
  id: string
  createdAt?: string
}

type FileViewerProps = {
  files: FileType[]
  onDeleteRequest?: (file: FileType) => void
}

const getFileIcon = (file: { type: string; name: string }) => {
  const { type, name } = file

  if (type.startsWith("image/")) {
    return <ImageIcon className="size-5 opacity-60" />
  }

  if (type.includes("zip") || type.includes("archive") || name.endsWith(".zip") || name.endsWith(".rar")) {
    return <FileArchiveIcon className="size-5 opacity-60" />
  }

  return <FileIcon className="size-5 opacity-60" />
}

const getFilePreview = (file: { type: string; name: string; url?: string }) => {
  const { type, name, url } = file

  const renderImage = (src: string) => (
    <div className="relative w-full h-full min-h-[120px] min-w-[120px]">
      <Image
        src={src || "/placeholder.svg"}
        alt={name}
        fill
        className="rounded-t-[inherit] object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )

  return (
    <div className="bg-accent flex aspect-square items-center justify-center overflow-hidden rounded-t-[inherit]">
      {type.startsWith("image/") && url ? renderImage(url) : getFileIcon(file)}
    </div>
  )
}

export default function FileViewer({ files: propFiles, onDeleteRequest }: FileViewerProps) {
  // Always use the files passed via props
  const files = propFiles;
  const [previewFile, setPreviewFile] = useState<FileType | null>(null)

  const handleViewFile = (file: FileType) => {
    if (file.type.startsWith("image/")) {
      setPreviewFile(file)
    } else {
      window.open(file.url, "_blank")
    }
  }

  const handleDownload = (file: FileType) => {
    window.open(file.url, '_blank')
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* File grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-background group relative flex flex-col rounded-md border transition-all hover:shadow-md overflow-hidden"
          >
            <div className="relative">
              {getFilePreview(file)}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  onClick={() => handleViewFile(file)}
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  aria-label={`View ${file.name}`}
                >
                  {file.type.startsWith("image/") ? (
                    <EyeIcon className="size-3.5" />
                  ) : (
                    <ExternalLinkIcon className="size-3.5" />
                  )}
                </Button>
                <Button
                  onClick={() => handleDownload(file)}
                  size="icon"
                  variant="secondary"
                  className="size-8"
                  aria-label={`Download ${file.name}`}
                >
                  <DownloadIcon className="size-3.5" />
                </Button>
                <Button
                  onClick={() => onDeleteRequest?.(file)}
                  size="icon"
                  variant="destructive"
                  className="size-8"
                  aria-label={`Delete ${file.name}`}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 border-t p-3">
              <p className="truncate text-[13px] font-medium">{file.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {file.createdAt ? format(new Date(file.createdAt), "MMM d, yyyy") : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* No files message */}
      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-muted rounded-full p-3 mb-4">
            <FileIcon className="size-6 opacity-60" />
          </div>
          <h3 className="text-lg font-medium mb-1">No files</h3>
          <p className="text-muted-foreground text-sm">All files have been deleted</p>
        </div>
      )}

      {/* Image preview modal */}
      {previewFile && previewFile.type.startsWith("image/") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative w-[80vw] h-[80vh] max-w-[90vw] max-h-[90vh]">
            <Image
              src={previewFile.url || "/placeholder.svg"}
              alt={previewFile.name}
              fill
              className="object-contain"
              style={{ objectFit: "contain" }}
            />
            <Button
              className="absolute top-2 right-2"
              size="sm"
              variant="secondary"
              onClick={() => setPreviewFile(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export type File = FileType
