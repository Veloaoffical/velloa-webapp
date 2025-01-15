import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { customAlphabet } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a custom nanoid with only numbers and capital letters (8 characters)
export function generateCustomId(length: number = 8): string {
  // Define the alphabet to include only numbers and capital letters
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const nanoid = customAlphabet(alphabet, length)
  return nanoid()
}
