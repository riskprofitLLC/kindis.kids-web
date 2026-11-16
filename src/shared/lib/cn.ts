import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Слияние Tailwind-классов: последний конфликтующий побеждает
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
