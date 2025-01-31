import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { customAlphabet } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a custom nanoid with only numbers and capital letters (8 characters)
export function generateCustomId(length: number = 8, seed?: string): string {
  // If a seed is provided, use it to create a more deterministic ID
  if (seed) {
    const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphabet[(seedNum + i) % alphabet.length];
    }
    return result;
  }
  
  // Otherwise fall back to random generation
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const nanoid = customAlphabet(alphabet, length)
  return nanoid()
}
