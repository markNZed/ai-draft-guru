// src/lib/utils.js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class names into a single string, handling conditional classes and duplicates.
 *
 * @param  {...any} inputs - The class names or conditions to merge.
 * @returns {string} The merged class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
