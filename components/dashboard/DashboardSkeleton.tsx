"use client"

import { Skeleton } from "@/components/ui/Skeleton"

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 pb-32">
            
            {/* ── Hero Skeleton ─────────────────────────────────────────────────────── */}
            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-[#FFFDF0] border-[3px] border-black shadow-[5px_5px_0_#000] rounded-3xl">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 bg-black/5 rounded-lg border-none" />
                    </div>
                    <Skeleton className="h-10 w-64 sm:w-80 bg-black/5 rounded-xl border-none" />
                    <Skeleton className="h-4 w-48 bg-black/5 rounded-lg border-none" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Skeleton className="h-12 w-36 bg-black/5 rounded-xl border-none" />
                    <Skeleton className="h-12 w-36 bg-black/5 rounded-xl border-none" />
                </div>
            </div>

            {/* ── Stats Skeleton ─────────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 bg-black/5 rounded-xl border-none" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-black/5 rounded-lg border-none" />
                        <Skeleton className="h-3 w-24 bg-black/5 rounded-lg border-none" />
                    </div>
                </div>
                
                <div className="bg-white border-[3px] border-black shadow-[5px_5px_0_#000] rounded-3xl grid grid-cols-2 sm:flex divide-y-[3px] sm:divide-y-0 sm:divide-x-[3px] divide-black overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 p-6 flex flex-col">
                            <Skeleton className="h-3 w-16 mb-4 bg-black/5 rounded-lg border-none" />
                            <Skeleton className="h-8 w-12 mb-4 bg-black/5 rounded-xl border-none" />
                            <Skeleton className="h-1.5 w-10 mb-3 bg-black/5 rounded-full border-none" />
                            <Skeleton className="h-3.5 w-20 bg-black/5 rounded-lg border-none" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Activity Skeleton ──────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="hidden lg:flex items-center gap-3">
                    <Skeleton className="w-10 h-10 bg-black/5 rounded-xl border-none" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-black/5 rounded-lg border-none" />
                        <Skeleton className="h-3 w-24 bg-black/5 rounded-lg border-none" />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Heatmap Skeleton */}
                    <div className="flex-1 bg-white border-[3px] border-black shadow-[5px_5px_0_#000] rounded-3xl p-6 space-y-6">
                        <div className="flex items-baseline gap-4">
                            <Skeleton className="h-8 w-10 bg-black/5 rounded-lg border-none" />
                            <Skeleton className="h-4 w-24 bg-black/5 rounded-lg border-none" />
                        </div>
                        <div className="grid grid-cols-[repeat(52,1fr)] gap-1.5 h-24">
                            {Array.from({ length: 52 }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1.5">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <Skeleton key={j} className="aspect-square w-full bg-black/5 rounded-md border-none" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Calendar Skeleton */}
                    <div className="w-full lg:w-[360px] bg-white border-[3px] border-black shadow-[5px_5px_0_#000] rounded-3xl p-6 space-y-5">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24 bg-black/5 rounded-lg border-none" />
                            <Skeleton className="h-4 w-20 bg-black/5 rounded-lg border-none" />
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square w-full bg-black/5 rounded-lg border-none" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
