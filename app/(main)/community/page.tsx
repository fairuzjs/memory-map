"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Filter, Loader2, MapPin, Image as ImageIcon, BookOpen } from "lucide-react"
import { MemoryCard } from "@/components/memories/MemoryCard"

const EMOTIONS = [
    { value: "ALL",         emoji: "🌎", label: "All" },
    { value: "HAPPY",       emoji: "🌟", label: "Happy" },
    { value: "SAD",         emoji: "💧", label: "Sad" },
    { value: "NOSTALGIC",   emoji: "🕰️", label: "Nostalgic" },
    { value: "EXCITED",     emoji: "🔥", label: "Excited" },
    { value: "PEACEFUL",    emoji: "🍃", label: "Peaceful" },
    { value: "GRATEFUL",    emoji: "🙏", label: "Grateful" },
    { value: "ROMANTIC",    emoji: "❤️", label: "Romantic" },
    { value: "ADVENTUROUS", emoji: "🏕️", label: "Adventurous" },
]

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1, y: 0,
        transition: { type: "spring" as const, stiffness: 280, damping: 24 },
    },
}
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

export default function CommunityPage() {
    const [memories, setMemories]               = useState<any[]>([])
    const [loading, setLoading]                 = useState(true)
    const [selectedEmotion, setSelectedEmotion] = useState("ALL")

    useEffect(() => {
        setLoading(true)
        const url =
            selectedEmotion === "ALL"
                ? "/api/memories?public=true"
                : `/api/memories?public=true&emotion=${selectedEmotion}`

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setMemories(
                    data.sort((a: any, b: any) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                )
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [selectedEmotion])

    const memoriesWithPhotos = memories.filter(m => m.photos && m.photos.length > 0)
    const textOnlyMemories   = memories.filter(m => !m.photos || m.photos.length === 0)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

            {/* ── Hero Header ──────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.div
                    variants={fadeUp}
                    className="relative rounded-2xl overflow-hidden border border-indigo-500/[0.12] px-7 py-6"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.06) 50%, rgba(8,8,16,0) 100%)",
                    }}
                >
                    {/* Dot-grid (masked to right) */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage:
                                "radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                            maskImage:
                                "radial-gradient(ellipse 60% 100% at 90% 50%, black 10%, transparent 70%)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse 60% 100% at 90% 50%, black 10%, transparent 70%)",
                        }}
                    />
                    {/* Top edge glow line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(139,92,246,0.55) 40%, rgba(99,102,241,0.55) 60%, transparent)",
                        }}
                    />
                    {/* Right ambient orb */}
                    <div
                        className="absolute right-0 top-0 h-full w-72 pointer-events-none opacity-[0.07]"
                        style={{
                            background:
                                "radial-gradient(ellipse at right center, #6366f1, transparent 70%)",
                        }}
                    />

                    <div className="relative flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <Globe className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1
                                className="text-2xl sm:text-3xl font-extrabold text-white leading-none"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                Community
                            </h1>
                            <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                                Discover public memories from explorers worldwide.
                            </p>
                        </div>

                        {/* Live pill */}
                        <div className="ml-auto shrink-0 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03]">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                            </span>
                            <span className="text-[11px] font-medium text-neutral-400">Live feed</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Emotion Filter Bar ────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
            >
                {/* Fade edges on mobile */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#080810] to-transparent z-10 pointer-events-none md:hidden" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#080810] to-transparent z-10 pointer-events-none md:hidden" />

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                    <Filter className="w-3.5 h-3.5 text-neutral-600 shrink-0 ml-1 mr-1" />
                    {EMOTIONS.map(emotion => {
                        const isSelected = selectedEmotion === emotion.value
                        return (
                            <button
                                key={emotion.value}
                                onClick={() => setSelectedEmotion(emotion.value)}
                                className={`
                                    snap-start shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                                    text-[13px] font-medium transition-all duration-200 border
                                    ${isSelected
                                        ? "bg-indigo-500 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/20"
                                        : "bg-white/[0.03] text-neutral-500 border-white/[0.07] hover:bg-white/[0.07] hover:text-white hover:border-white/[0.12]"
                                    }
                                `}
                            >
                                <span className="text-sm leading-none">{emotion.emoji}</span>
                                <span>{emotion.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Separator */}
                <div className="mt-4 h-px bg-white/[0.05]" />
            </motion.div>

            {/* ── Feed Content ──────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 gap-3"
                    >
                        <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                        <p className="text-sm text-neutral-500">Loading map journeys…</p>
                    </motion.div>

                ) : memories.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 px-4 text-center border border-white/[0.05] rounded-2xl bg-white/[0.01]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                            <MapPin className="w-5 h-5 text-neutral-600" />
                        </div>
                        <h3
                            className="text-lg font-bold text-white mb-2"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            No memories found
                        </h3>
                        <p className="text-neutral-500 text-sm max-w-xs mb-5 leading-relaxed">
                            {selectedEmotion === "ALL"
                                ? "Looks like the world map is quiet. Be the first to share an adventure!"
                                : `No memories tagged with "${selectedEmotion.toLowerCase()}" yet.`}
                        </p>
                        {selectedEmotion !== "ALL" && (
                            <button
                                onClick={() => setSelectedEmotion("ALL")}
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-4 py-1.5 rounded-full border border-indigo-500/20 hover:border-indigo-500/40"
                            >
                                Reset filters
                            </button>
                        )}
                    </motion.div>

                ) : (
                    <motion.div
                        key="feed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-10"
                    >
                        {/* Visual Memories */}
                        {memoriesWithPhotos.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <h2
                                        className="text-base font-bold text-white"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        Visual Memories
                                    </h2>
                                    <span className="text-[11px] font-semibold text-neutral-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                                        {memoriesWithPhotos.length}
                                    </span>
                                </div>

                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={stagger}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                >
                                    {memoriesWithPhotos.map(memory => (
                                        <motion.div key={memory.id} variants={fadeUp}>
                                            <MemoryCard memory={memory} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        {/* Divider between sections */}
                        {memoriesWithPhotos.length > 0 && textOnlyMemories.length > 0 && (
                            <div className="h-px bg-white/[0.04]" />
                        )}

                        {/* Journal Entries */}
                        {textOnlyMemories.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <h2
                                        className="text-base font-bold text-white"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        Journal Entries
                                    </h2>
                                    <span className="text-[11px] font-semibold text-neutral-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                                        {textOnlyMemories.length}
                                    </span>
                                </div>

                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={stagger}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                >
                                    {textOnlyMemories.map(memory => (
                                        <motion.div key={memory.id} variants={fadeUp}>
                                            <MemoryCard memory={memory} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}