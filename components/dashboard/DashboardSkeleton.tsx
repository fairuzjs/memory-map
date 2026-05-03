"use client"

import { Skeleton } from "@/components/ui/Skeleton"
import { motion } from "framer-motion"

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 pb-32">
            
            {/* ── Hero Skeleton ─────────────────────────────────────────────────────── */}
            <div className="relative px-7 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white border-[4px] border-black shadow-[8px_8px_0_#000]">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 rounded-none border-[2px] border-black" />
                    </div>
                    <Skeleton className="h-10 w-64 sm:w-80 rounded-none border-[2px] border-black" />
                    <Skeleton className="h-4 w-48 rounded-none border-[2px] border-black" />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Skeleton className="h-12 w-40 rounded-none border-[3px] border-black shadow-[4px_4px_0_#000]" />
                    <Skeleton className="h-12 w-40 rounded-none border-[3px] border-black shadow-[4px_4px_0_#000]" />
                </div>
            </div>

            {/* ── Stats Skeleton ─────────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-none border-[3px] border-black shadow-[3px_3px_0_#000]" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 rounded-none border-[2px] border-black" />
                        <Skeleton className="h-3 w-24 rounded-none border-[2px] border-black" />
                    </div>
                </div>
                
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] grid grid-cols-2 sm:flex">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 p-6 border-r-[3px] border-black last:border-r-0 border-b-[3px] sm:border-b-0">
                            <Skeleton className="h-3 w-16 mb-4 rounded-none" />
                            <Skeleton className="h-8 w-12 mb-4 rounded-none" />
                            <Skeleton className="h-1 w-10 mb-3 rounded-none" />
                            <Skeleton className="h-2 w-20 rounded-none" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Activity Skeleton ──────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="hidden lg:flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-none border-[3px] border-black shadow-[3px_3px_0_#000]" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 rounded-none border-[2px] border-black" />
                        <Skeleton className="h-3 w-24 rounded-none border-[2px] border-black" />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Heatmap Skeleton */}
                    <div className="flex-1 h-[260px] bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-6 space-y-6">
                        <div className="flex items-baseline gap-4">
                            <Skeleton className="h-8 w-10 rounded-none border-[2px] border-black" />
                            <Skeleton className="h-4 w-24 rounded-none border-[2px] border-black" />
                        </div>
                        <div className="grid grid-cols-[repeat(52,1fr)] gap-1 h-24">
                            {Array.from({ length: 52 }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <Skeleton key={j} className="aspect-square w-full rounded-none border-[1px] border-black" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Calendar Skeleton */}
                    <div className="w-full lg:w-[360px] h-[260px] bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-6 space-y-5">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24 rounded-none border-[2px] border-black" />
                            <Skeleton className="h-4 w-20 rounded-none border-[2px] border-black" />
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square w-full rounded-none border-[2px] border-black" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
