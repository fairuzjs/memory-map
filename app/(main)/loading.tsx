"use client"

import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-2xl border border-neutral-800 animate-pulse">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
            <p className="mt-4 text-sm font-medium text-neutral-400 font-[Outfit] tracking-widest uppercase">
                Loading...
            </p>
        </div>
    )
}
