"use client";

import React from "react";
import { useId } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Task } from "../../TaskDetailsClient";

interface BasicInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
  onSave?: (data: { title: string; description: string }) => void;
}

export function BasicInfoModal({ open, onOpenChange, taskDetails, onSave }: BasicInfoModalProps) {
  const id = useId();
  const maxLength = 50;
  const {
    value,
    characterCount,
    handleChange,
    maxLength: limit,
  } = useCharacterLimit({ maxLength, initialValue: taskDetails.subject });

  const descId = useId();
  const descMaxLength = 500;
  const {
    value: descValue,
    characterCount: descCount,
    handleChange: descHandleChange,
    maxLength: descLimit,
  } = useCharacterLimit({ maxLength: descMaxLength, initialValue: taskDetails.description });

  function handleSave() {
    if (onSave) {
      onSave({ title: value, description: descValue });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Basic Information</DialogTitle>
          <DialogDescription>Update the task title and description.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor={id}>Title</Label>
            <div className="relative">
              <Input
                id={id}
                className="peer pe-14"
                type="text"
                value={value}
                maxLength={maxLength}
                onChange={handleChange}
                aria-describedby={`${id}-description`}
              />
              <div
                id={`${id}-description`}
                className="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-xs tabular-nums peer-disabled:opacity-50"
                aria-live="polite"
                role="status"
              >
                {characterCount}/{limit}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor={descId}>Description</Label>
            <Textarea
              id={descId}
              value={descValue}
              maxLength={descMaxLength}
              onChange={descHandleChange}
              aria-describedby={`${descId}-description`}
            />
            <p
              id={`${descId}-description`}
              className="text-muted-foreground mt-2 text-right text-xs"
              role="status"
              aria-live="polite"
            >
              <span className="tabular-nums">{descLimit - descCount}</span>{" "}
              characters left
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="default"
            type="button"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
