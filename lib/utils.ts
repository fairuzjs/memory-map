import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: Date | string | number): string {
  const time = new Date(date).getTime()
  const now = Date.now()
  const diffInSeconds = Math.floor((now - time) / 1000)

  const intervals: { [key: string]: number } = {
    tahun: 31536000,
    bulan: 2592000,
    minggu: 604800,
    hari: 86400,
    jam: 3600,
    menit: 60,
    detik: 1,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    if (diffInSeconds >= secondsInUnit || unit === "detik") {
      const value = Math.max(1, Math.floor(diffInSeconds / secondsInUnit))
      return `${value} ${unit} yang lalu`
    }
  }
  return "baru saja"
}
