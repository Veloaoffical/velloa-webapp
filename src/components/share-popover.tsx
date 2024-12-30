"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RiCodeFill, RiFacebookFill, RiMailLine, RiTwitterXFill } from "@remixicon/react";
import { Check, Copy, Share2, MoreHorizontal } from "lucide-react";
import { useRef, useState } from "react";

interface SharePopoverProps {
  url: string;
}

export function SharePopover({ url }: SharePopoverProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-3 text-center">
          <div className="text-sm font-medium">Share code</div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="icon" variant="outline" aria-label="Embed">
              <RiCodeFill size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Share on Twitter">
              <RiTwitterXFill size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Share on Facebook">
              <RiFacebookFill size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Share via email">
              <RiMailLine size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              aria-label="System share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: '1233 Yonge Street',
                    text: 'Check out this property listing',
                    url: url
                  })
                }
              }}
            >
              <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Input
                ref={inputRef}
                className="pe-9"
                type="text"
                defaultValue={url}
                aria-label="Share link"
                readOnly
              />
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopy}
                      className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed"
                      aria-label={copied ? "Copied" : "Copy to clipboard"}
                      disabled={copied}
                    >
                      <div
                        className={cn(
                          "transition-all",
                          copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                        )}
                      >
                        <Check
                          className="stroke-emerald-500"
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </div>
                      <div
                        className={cn(
                          "absolute transition-all",
                          copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                        )}
                      >
                        <Copy size={16} strokeWidth={2} aria-hidden="true" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="px-2 py-1 text-xs">Copy to clipboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 