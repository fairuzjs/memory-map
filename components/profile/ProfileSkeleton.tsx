"use client"

import { Skeleton } from "@/components/ui/Skeleton"
import { motion } from "framer-motion"

export function ProfileSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-outfit">
            
            {/* ─────────────── PROFILE CARD SKELETON ─────────────── */}
            <div className="overflow-hidden mb-8 relative w-full bg-white border-[4px] border-black shadow-[8px_8px_0_#000]">
                {/* Banner Skeleton */}
                <div className="relative h-32 sm:h-40 bg-[#E5E5E5]">
                    <Skeleton className="absolute inset-0 w-full h-full opacity-50" />
                </div>

                {/* Header Skeleton */}
                <div className="px-6 sm:px-12 pb-8 pt-0 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-10 sm:-mt-12 relative z-10">
                        {/* Avatar Skeleton */}
                        <div className="relative">
                           <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[4px] border-black" />
                        </div>
                        
                        {/* Summary Skeleton */}
                        <div className="flex-1 pb-2">
                            <Skeleton className="h-8 w-48 mb-3 border-[2px] border-black" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-24 border-[2px] border-black" />
                                <Skeleton className="h-4 w-24 border-[2px] border-black" />
                            </div>
                        </div>

                        {/* Actions Skeleton */}
                        <div className="flex gap-2 sm:mb-2">
                            <Skeleton className="h-10 w-28 border-[3px] border-black" />
                            <Skeleton className="h-10 w-10 border-[3px] border-black" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────── PASSPORT & MAP SKELETON ─────────────── */}
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <Skeleton className="h-[240px] w-full border-[4px] border-black shadow-[8px_8px_0_#000]" />
                    </div>
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[240px] w-full border-[4px] border-black shadow-[8px_8px_0_#000]" />
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="aspect-square w-full border-[3px] border-black shadow-[4px_4px_0_#000]" />
                    ))}
                </div>
            </div>
        </div>
    )
}
