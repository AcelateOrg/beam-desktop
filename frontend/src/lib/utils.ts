import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getPlatform } from "@/lib/platform"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function appDisplayName(item: string): string {
  const trimmed = item.replace(/[\\/]+$/, "")
  const base = trimmed.split(/[\\/]/).pop() ?? trimmed
  return base.replace(/\.app$/i, "") || item
}

export function normalizeExecutableName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.split(/[\\/]/).pop()?.trim() ?? trimmed
}

export function normalizeAppIdentifier(value: string): string {
  return getPlatform() === "darwin" ? value.trim() : normalizeExecutableName(value)
}
