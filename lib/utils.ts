import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge tailwind classes conditionally
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
