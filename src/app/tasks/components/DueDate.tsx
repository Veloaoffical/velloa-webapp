'use client';

import { format } from 'date-fns';

interface DueDateProps {
  date: string;
}

export function DueDate({ date }: DueDateProps) {
  const isPastDue = new Date(date) < new Date();
  return (
    <span className={isPastDue ? 'text-red-500' : ''}>
      {format(new Date(date), 'PPP')}
    </span>
  );
} 