"use client";

import { Button } from "@/components/ui/button";
import { RiMailLine } from "@remixicon/react";
import { MoreHorizontal, Share2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  url: string;
}

export function ShareButton({ url }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 flex gap-2 p-2 bg-background border rounded-md shadow-md">
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8"
              aria-label="Share via email"
              onClick={() => {
                window.location.href = `mailto:?subject=Check this out&body=${encodeURIComponent(url)}`;
                setIsOpen(false);
              }}
            >
              <RiMailLine size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8"
              aria-label="System share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    url: url
                  });
                }
                setIsOpen(false);
              }}
            >
              <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 