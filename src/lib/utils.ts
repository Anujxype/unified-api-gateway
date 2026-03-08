import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, parseISO, isBefore } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isExpired(expiresAt: string): boolean {
  return isBefore(parseISO(expiresAt), new Date());
}

export function isExpiringSoon(expiresAt: string, withinDays = 7): boolean {
  const days = differenceInDays(parseISO(expiresAt), new Date());
  return days >= 0 && days <= withinDays;
}

export function daysUntilExpiry(expiresAt: string): number {
  return Math.max(0, differenceInDays(parseISO(expiresAt), new Date()));
}
