'use client';

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  return (
    <div className="w-full h-full">
      <iframe
        src={url}
        className="w-full h-full border-none"
        title="PDF Preview"
      />
    </div>
  );
} 