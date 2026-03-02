"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Globe, Filter, Sparkles, Loader2, MapPin, Image as ImageIcon, BookOpen } from "lucide-react"
import { MemoryCard } from "@/components/memories/MemoryCard"
import type { MemoryInput } from "@/lib/validations"
import Link from "next/link"

const EMOTIONS = [
    { value: "ALL", emoji: "🌎", label: "All" },
    { value: "HAPPY", emoji: "🌟", label: "Happy" },
    { value: "SAD", emoji: "💧", label: "Sad" },
    { value: "NOSTALGIC", emoji: "🕰️", label: "Nostalgic" },
    { value: "EXCITED", emoji: "🔥", label: "Excited" },
    { value: "PEACEFUL", emoji: "🍃", label: "Peaceful" },
    { value: "GRATEFUL", emoji: "🙏", label: "Grateful" },
    { value: "ROMANTIC", emoji: "❤️", label: "Romantic" },
    { value: "ADVENTUROUS", emoji: "🏕️", label: "Adventurous" },
]

// ─── Animation variants ────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } }
}
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function CommunityPage() {
    const [memories, setMemories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEmotion, setSelectedEmotion] = useState("ALL")

    useEffect(() => {
        setLoading(true)
        const url = selectedEmotion === "ALL"
            ? "/api/memories?public=true"
            : `/api/memories?public=true&emotion=${selectedEmotion}`

        fetch(url)
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                setMemories(sorted)
                setLoading(false)
            })
            .catch(error => {
                console.error("Failed to fetch community memories:", error)
                setLoading(false)
            })
    }, [selectedEmotion])

    const memoriesWithPhotos = memories.filter(m => m.photos && m.photos.length > 0)
    const textOnlyMemories = memories.filter(m => !m.photos || m.photos.length === 0)

    // ... existing loading / empty states handled before return map ...
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
            {/* Header */}
            <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div variants={fadeUp} className="max-w-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold font-[Outfit] text-white leading-none">
                                Community
                            </h1>
                            <p className="text-neutral-500 text-sm mt-1">
                                Discover public memories from explorers worldwide.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
            >
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#080810] to-transparent z-10 pointer-events-none md:hidden" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#080810] to-transparent z-10 pointer-events-none md:hidden" />

                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    <div className="flex items-center gap-2 px-2 shrink-0">
                        <Filter className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
                        {EMOTIONS.map(emotion => {
                            const isSelected = selectedEmotion === emotion.value
                            return (
                                <button
                                    key={emotion.value}
                                    onClick={() => setSelectedEmotion(emotion.value)}
                                    className={`
                                        snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                                        ${isSelected
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/50"
                                            : "bg-white/[0.03] text-neutral-400 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                                        }
                                    `}
                                >
                                    <span>{emotion.emoji}</span>
                                    <span>{emotion.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Feed Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-sm text-neutral-500">Loading map journeys...</p>
                </div>
            ) : memories.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 px-4 text-center border border-white/[0.05] rounded-3xl bg-white/[0.01]"
                >
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-4">
                        <MapPin className="w-6 h-6 text-neutral-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No memories found</h3>
                    <p className="text-neutral-500 max-w-sm mb-6">
                        {selectedEmotion === "ALL"
                            ? "Looks like the world map is quiet. Be the first to share an adventure globally!"
                            : `There are no memories tagged with the ${selectedEmotion.toLowerCase()} feeling yet.`}
                    </p>
                    {selectedEmotion !== "ALL" && (
                        <button
                            onClick={() => setSelectedEmotion("ALL")}
                            className="text-sm text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                        >
                            Reset filters
                        </button>
                    )}
                </motion.div>
            ) : (
                <div className="space-y-12">
                    {memoriesWithPhotos.length > 0 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold font-[Outfit] text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-400" />
                                Visual Memories
                            </h2>
                            <motion.div
                                initial="hidden"
                                animate="show"
                                variants={stagger}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {memoriesWithPhotos.map((memory) => (
                                    <motion.div key={memory.id} variants={fadeUp}>
                                        <MemoryCard memory={memory} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}

                    {textOnlyMemories.length > 0 && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-bold font-[Outfit] text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-emerald-400" />
                                Journal Entries
                            </h2>
                            <motion.div
                                initial="hidden"
                                animate="show"
                                variants={stagger}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {textOnlyMemories.map((memory) => (
                                    <motion.div key={memory.id} variants={fadeUp}>
                                        <MemoryCard memory={memory} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
