import { useCallback, useRef, useState } from "react";

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export type FilePreview = {
  id: string;
  file: File | null;
  preview: string;
};

export function useFileUpload({
  accept = '',
  maxSize = 5 * 1024 * 1024,
  multiple = false,
  maxFiles = 6,
  initialFiles = [],
}: {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
  initialFiles?: (FilePreview | { url?: string; file?: File })[];
}) {
  const [files, setFiles] = useState<FilePreview[]>(
    initialFiles.map((f, idx) => {
      let preview = '';
      if ('preview' in f && f.preview) preview = f.preview;
      else if ('url' in f && f.url) preview = f.url;
      const id = 'id' in f && f.id ? f.id : `${preview}-${Date.now()}-${idx}`;
      return {
        ...f,
        id,
        file: f.file ?? null,
        preview,
      };
    })
  );
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (accept && !accept.split(',').some((type) => file.type === type || file.name.endsWith(type.replace('image/', '.')))) {
      return `File type not allowed: ${file.name}`;
    }
    if (file.size > maxSize) {
      return `File too large: ${file.name}`;
    }
    return null;
  };

  const handleFiles = (fileList: FileList | File[]) => {
    const newFiles: FilePreview[] = [];
    const newErrors: string[] = [];
    const currentCount = files.length;
    Array.from(fileList).forEach((file, idx) => {
      if (currentCount + newFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed.`);
        return;
      }
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
        return;
      }
      const preview = URL.createObjectURL(file);
      newFiles.push({ id: `${file.name}-${file.size}-${Date.now()}-${idx}`, file, preview });
    });
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      setErrors([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const getInputProps = () => ({
    type: 'file',
    accept,
    multiple,
    ref: inputRef,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
  });

  return [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] as const;
} 