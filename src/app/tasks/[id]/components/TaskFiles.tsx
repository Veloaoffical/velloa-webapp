import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  created_by: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export function TaskFiles() {
  const files: File[] = []; // This will be populated from the database

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload File Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Upload Files</h2>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your files here, or click to select files
            </p>
            <Button>
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <div className="space-y-4">
        {files.length > 0 ? (
          files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>
                          Uploaded by {file.created_by.profile.first_name} {file.created_by.profile.last_name}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No files uploaded yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 