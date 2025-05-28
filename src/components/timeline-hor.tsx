"use client"

import { X } from 'lucide-react';

interface TimelineItem {
  id: number;
  date: string;
  title: string;
  description: string;
  isDeclined?: boolean;
}

interface TimelineProps {
  activeStep?: number;
  items: TimelineItem[];
  progressStep?: number;
  stepPercentages?: number[];
}

export default function Timeline({
  activeStep = 0,
  items,
  progressStep = 0,
  stepPercentages,
}: TimelineProps) {
  // Calculate the step index determining the line end.
  const stepIndexForWidth = progressStep > 0 ? progressStep : activeStep;
  // The relevant percentage index is for the segment *before* the current step.
  const percentageIndex = stepIndexForWidth - 2; // Index for the completed segment

  // Calculate width percentage based on completed segments.
  let widthPercentage: number;
  if (
    stepPercentages &&
    stepPercentages.length === items.length - 1 && // Ensure array has correct length
    percentageIndex >= 0 && // Ensure index is valid
    percentageIndex < stepPercentages.length
  ) {
    // Use the manually provided percentage
    widthPercentage = stepPercentages[percentageIndex];
  } else {
    // Fallback to automatic calculation if manual percentages aren't valid/provided
    const numCompletedSegments = Math.max(0, percentageIndex + 1); // Recalculate completed segments (index + 1)
    widthPercentage = items.length > 1 ? (numCompletedSegments / (items.length - 1)) * 100 : 0;
  }

  return (
    <div className="w-full p-4">
      <style>{`
        @keyframes custom-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .custom-pulse {
          animation: custom-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className="flex flex-row justify-between w-full relative">
        {/* Background line (unfilled) */}
        <div className="absolute top-[29px] left-0 right-0 h-0.5 bg-primary/10 z-0"></div>

        {/* Filled line showing progress */}
        {items.length > 1 && (
          <div
            className="absolute top-[29px] h-0.5 bg-primary z-0"
            style={{
              left: `0%`, // Line starts from the very beginning
              width: `${widthPercentage}%`, // Use the calculated width percentage
            }}
          ></div>
        )}

        {/* Timeline items */}
        {items.map((item) => {
          const isCompleted = item.id < activeStep;
          const isActive = item.id === activeStep;
          const isDeclined = item.isDeclined;

          return (
            <div key={item.id} className="flex flex-col items-center z-10 text-center">
              <div className="text-xs text-muted-foreground mb-2 whitespace-nowrap">{item.date}</div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${ 
                  isDeclined 
                    ? "border-destructive bg-destructive/10" 
                    : isActive 
                      ? "border-primary bg-primary custom-pulse" 
                      : isCompleted 
                        ? "border-primary bg-primary" 
                        : "border-primary/30 bg-background"
                }`}
              >
                {isDeclined && (
                  <X className="w-2.5 h-2.5 text-destructive" strokeWidth={3} />
                )}
              </div>
              <div className="mt-2 text-sm font-medium">{item.title}</div>
              <div className="text-sm text-muted-foreground max-w-[200px]">{item.description}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

