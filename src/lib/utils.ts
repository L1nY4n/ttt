import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function localStorageSet<T>(key: string, value: T) {
  const browser =
    typeof window !== "undefined" && typeof document !== "undefined";
  if (browser) localStorage?.setItem(key, JSON.stringify(value));
}

export function localStorageGet(key: string) {
  const json = localStorage?.getItem(key);
  if (json) return JSON.parse(json);
}
