"use client"

import { Skeleton } from "@/components/ui/Skeleton"
import { motion } from "framer-motion"

export function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
            
            {/* ── Hero Skeleton ─────────────────────────────────────────────────────── */}
            <div 
                className="relative rounded-2xl overflow-hidden border border-indigo-500/[0.1] px-7 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-[#0a0a10]"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-64 sm:w-80 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-32 rounded-xl" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </div>

            {/* ── Stats Skeleton ─────────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                
                <div className="rounded-2xl border border-white/5 bg-neutral-900/20 grid grid-cols-2 sm:flex p-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 p-4 border-r border-white/5 last:border-r-0">
                            <Skeleton className="h-3 w-16 mb-3" />
                            <Skeleton className="h-8 w-12 mb-3" />
                            <Skeleton className="h-1 w-6 rounded-full mb-2" />
                            <Skeleton className="h-2 w-20" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Activity Skeleton ──────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="hidden lg:flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Heatmap Skeleton */}
                    <div className="flex-1 h-[240px] rounded-2xl border border-white/5 bg-neutral-900/20 p-5 space-y-6">
                        <div className="flex items-baseline gap-4">
                            <Skeleton className="h-8 w-10" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="grid grid-cols-[repeat(52,1fr)] gap-1 h-24">
                            {Array.from({ length: 52 }).map((_, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <Skeleton key={j} className="aspect-square w-full rounded-sm" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Calendar Skeleton */}
                    <div className="w-full lg:w-[325px] h-[240px] rounded-2xl border border-white/5 bg-neutral-900/20 p-5 space-y-5">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
