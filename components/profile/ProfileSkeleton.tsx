"use client"

import { Skeleton } from "@/components/ui/Skeleton"
import { motion } from "framer-motion"

export function ProfileSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-outfit">
            
            {/* ─────────────── PROFILE CARD SKELETON ─────────────── */}
            <div className="rounded-[2rem] overflow-hidden mb-8 relative w-full bg-[#0a0a10] border border-white/5 shadow-2xl">
                {/* Banner Skeleton */}
                <div className="relative h-32 sm:h-40 bg-neutral-900/50">
                    <Skeleton className="absolute inset-0 w-full h-full opacity-50" />
                </div>

                {/* Header Skeleton */}
                <div className="px-6 sm:px-12 pb-8 pt-0 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-10 sm:-mt-12 relative z-10">
                        {/* Avatar Skeleton */}
                        <div className="relative">
                           <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#0a0a10]" />
                        </div>
                        
                        {/* Summary Skeleton */}
                        <div className="flex-1 pb-2">
                            <Skeleton className="h-8 w-48 mb-3" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>

                        {/* Actions Skeleton */}
                        <div className="flex gap-2 sm:mb-2">
                            <Skeleton className="h-10 w-28 rounded-xl" />
                            <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────── PASSPORT & MAP SKELETON ─────────────── */}
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <Skeleton className="h-[240px] w-full rounded-[2rem]" />
                    </div>
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[240px] w-full rounded-[2rem]" />
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="aspect-[4/5] w-full rounded-[2rem]" />
                    ))}
                </div>
            </div>
        </div>
    )
}
