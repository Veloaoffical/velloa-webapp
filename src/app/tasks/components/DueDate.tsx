'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface DueDateProps {
  date: string;
}

export function DueDate({ date }: DueDateProps) {
  const [isPastDue, setIsPastDue] = useState(false);
  
  useEffect(() => {
    setIsPastDue(new Date(date) < new Date());
  }, [date]);

  return (
    <span className={isPastDue ? 'text-red-500' : ''}>
      {format(new Date(date), 'PPP')}
    </span>
  );
} 