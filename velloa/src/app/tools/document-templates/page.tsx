'use client';

import { Button } from '@/components/ui/button';
import { Plus, Search, MoreHorizontal, Pencil, Eye, Trash, ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from "sonner";
import { DocusealBuilder } from '@docuseal/react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
  interface Window {
    DocuSeal: {
      initBuilder: (config: { 
        containerId: string;
        token: string;
        withSendButton?: boolean;
        withUploadButton?: boolean;
        onUpload?: (uploadData: unknown) => void;
        onSave?: (saveData: unknown) => void;
      }) => void;
      initViewer: (config: {
        containerId: string;
        token: string;
      }) => void;
    };
  }
}

interface Template {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  documents: Array<{
    preview_image_url: string;
  }>;
}

export default function DocumentTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [renamingTemplate, setRenamingTemplate] = useState<Template | null>(null);
  const [builderToken, setBuilderToken] = useState<string | null>(null);

  const loadDocuSealScript = async () => {
    if (window.DocuSeal) {
      return true;
    }

    return new Promise<boolean>((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="docuseal"]');
      if (existingScript) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.docuseal.com/js/builder.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        resolve(true);
      };
      script.onerror = (error) => {
        console.error('Failed to load DocuSeal script:', error);
        reject(new Error('Failed to load DocuSeal script'));
      };

      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    loadDocuSealScript().catch(error => {
      console.error('Error loading DocuSeal script:', error);
      toast.error("Error", {
        description: "Failed to load document builder. Please try again.",
      });
    });
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/docuseal');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch templates');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        console.log('Templates response:', data);
        
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [selectedTemplate]);

  useEffect(() => {
    const initializeDocuSeal = async () => {
      if (selectedTemplate) {
        try {
          // First ensure the script is loaded
          const isLoaded = await loadDocuSealScript();
          if (!isLoaded) {
            throw new Error('Failed to load DocuSeal script');
          }

          // Get builder token from API
          const response = await fetch('/api/docuseal/builder_token');
          if (!response.ok) {
            throw new Error('Failed to get builder token');
          }
          const data = await response.json();
          if (!data.token) {
            throw new Error('Builder token is missing');
          }

          setBuilderToken(data.token);
          
          // Helper function to wait for DocuSeal to be available
          const waitForDocuSeal = async (timeout = 5000): Promise<boolean> => {
            return new Promise((resolve) => {
              const start = Date.now();
              const check = () => {
                if (window.DocuSeal) {
                  resolve(true);
                } else if (Date.now() - start > timeout) {
                  resolve(false);
                } else {
                  setTimeout(check, 500);
                }
              };
              check();
            });
          };

          const docuSealReady = await waitForDocuSeal();

          if (!docuSealReady) {
            throw new Error('DocuSeal not initialized');
          }
        } catch (error) {
          console.error('Error initializing DocuSeal:', error);
          toast.error("Error", {
            description: error instanceof Error ? error.message : "Failed to initialize document builder",
          });
          setSelectedTemplate(false);
        }
      }
    };

    initializeDocuSeal();
  }, [selectedTemplate]);

  useEffect(() => {
    const initializeViewer = async () => {
      if (previewTemplate) {
        try {
          const response = await fetch(`/api/docuseal?templateId=${previewTemplate.id}`);
          const data = await response.json();
          
          if (data.error) {
            console.error('DocuSeal error:', data.error);
            throw new Error(data.error);
          }
          
          // Initialize DocuSeal viewer after getting the token
          if (window.DocuSeal && data.token) {
            window.DocuSeal.initViewer({
              containerId: 'docuseal-viewer',
              token: data.token,
            });
          }
        } catch (error) {
          console.error('Error initializing DocuSeal viewer:', error);
        }
      }
    };

    initializeViewer();
  }, [previewTemplate]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateAction = async (e: React.MouseEvent, template: Template, action: 'view' | 'edit' | 'rename' | 'delete') => {
    e.stopPropagation(); // Prevent the card click event from firing
    
    try {
      switch (action) {
        case 'view':
          const viewResponse = await fetch(`/api/docuseal/builder_token?templateId=${template.id}`);
          if (!viewResponse.ok) {
            throw new Error('Failed to get viewer token');
          }
          const viewData = await viewResponse.json();
          setBuilderToken(viewData.token);
          setPreviewTemplate(template);
          break;
        case 'edit':
          const editResponse = await fetch(`/api/docuseal/builder_token?templateId=${template.id}`);
          if (!editResponse.ok) {
            throw new Error('Failed to get editor token');
          }
          const editData = await editResponse.json();
          setBuilderToken(editData.token);
          setEditingTemplate(template);
          break;
        case 'rename':
          setRenamingTemplate(template);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this template?')) {
            const response = await fetch(`/api/docuseal?templateId=${template.id}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              throw new Error('Failed to delete template');
            }
            setTemplates(templates.filter(t => t.id !== template.id));
            toast.success('Template deleted successfully');
          }
          break;
      }
    } catch (error) {
      console.error('Error handling template action:', error);
      toast.error('Failed to perform action');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-transparent"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Document Templates</h2>
        </div>
      </div>

      <Card className="flex-1">
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between">
            <div className="relative w-[300px]">
              <Input
                placeholder="Search templates..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button 
              className="bg-[#26A769] hover:bg-[#1f8f57]"
              onClick={() => setSelectedTemplate(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          <Separator className="my-6" />

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Loading templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="group relative bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={(e) => handleTemplateAction(e, template, 'view')}
                >
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-white/90 hover:bg-white shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => handleTemplateAction(e, template, 'view')}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleTemplateAction(e, template, 'edit')}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleTemplateAction(e, template, 'rename')}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleTemplateAction(e, template, 'delete')}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {template.documents?.[0]?.preview_image_url ? (
                    <div className="relative aspect-[4/5] bg-gray-50">
                      <Image
                        src={template.documents[0].preview_image_url}
                        alt={template.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-[4/5] bg-gray-50 flex items-center justify-center">
                      <div className="text-gray-400 text-xs">No preview</div>
                    </div>
                  )}
                  <div className="p-2 space-y-0.5">
                    <h3 className="font-medium text-xs truncate">{template.name}</h3>
                    <p className="text-[10px] text-muted-foreground">
                      Updated {new Date(template.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32">
              <p className="text-muted-foreground">No templates found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Dialog 
        open={selectedTemplate} 
        onOpenChange={(open) => {
          setSelectedTemplate(open);
          if (!open) {
            setBuilderToken(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create Document Template</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-[500px]">
            {builderToken ? (
              <DocusealBuilder token={builderToken} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading document builder...</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!previewTemplate} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewTemplate(null);
            setBuilderToken(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {builderToken ? (
              <DocusealBuilder token={builderToken} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading document viewer...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!editingTemplate} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingTemplate(null);
            setBuilderToken(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {builderToken ? (
              <DocusealBuilder token={builderToken} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading document editor...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!renamingTemplate} 
        onOpenChange={(open) => {
          if (!open) setRenamingTemplate(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Input
                id="name"
                placeholder="Template name"
                defaultValue={renamingTemplate?.name}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenamingTemplate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // TODO: Add rename API call
                setRenamingTemplate(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 