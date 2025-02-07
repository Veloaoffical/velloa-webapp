'use client';

import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface Window {
    DocuSeal: {
      initBuilder: (config: { 
        containerId: string;
        token: string;
        withSendButton?: boolean;
        withUploadButton?: boolean;
      }) => void;
    };
  }
}

export default function DocumentTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<boolean>(false);

  useEffect(() => {
    // Load DocuSeal script
    const script = document.createElement('script');
    script.src = 'https://cdn.docuseal.com/js/builder.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize the builder when template is selected
      window.DocuSeal?.initBuilder({
        containerId: 'docuseal-builder',
        token: process.env.NEXT_PUBLIC_DOCUSEAL_TOKEN || '',
        withSendButton: false,
        withUploadButton: false
      });
    }
  }, [selectedTemplate]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Document Templates</h2>
      </div>

      <Card className="flex-1">
        <div className="h-full flex flex-col p-6 space-y-6">
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

          <Dialog 
            open={selectedTemplate} 
            onOpenChange={(open) => {
              setSelectedTemplate(open);
            }}
          >
            <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Create Document Template</DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto">
                <div id="docuseal-builder" className="w-full h-full" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
} 