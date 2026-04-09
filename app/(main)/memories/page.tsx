"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus, Loader2, BookHeart, Image as ImageIcon,
    BookOpen, Filter, SlidersHorizontal, MapPin, Users
} from "lucide-react"
import { MemoryCard } from "@/components/memories/MemoryCard"

// ─── Emotion Filter Options ────────────────────────────────────────────────────
const EMOTIONS = [
    { value: "ALL", emoji: "✨", label: "All" },
    { value: "HAPPY", emoji: "🌟", label: "Happy" },
    { value: "SAD", emoji: "💧", label: "Sad" },
    { value: "NOSTALGIC", emoji: "🕰️", label: "Nostalgic" },
    { value: "EXCITED", emoji: "🔥", label: "Excited" },
    { value: "PEACEFUL", emoji: "🍃", label: "Peaceful" },
    { value: "GRATEFUL", emoji: "🙏", label: "Grateful" },
    { value: "ROMANTIC", emoji: "❤️", label: "Romantic" },
    { value: "ADVENTUROUS", emoji: "🏕️", label: "Adventurous" },
]

// ─── Animation Variants ────────────────────────────────────────────────────────
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

// ─── Section Header Component ─────────────────────────────────────────────────
function SectionHeader({
    icon, label, count, accent = "indigo"
}: {
    icon: React.ReactNode
    label: string
    count: number
    accent?: "indigo" | "emerald" | "violet"
}) {
    const colors = {
        indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
        violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400" },
    }
    const c = colors[accent]
    return (
        <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
                <span className={c.text}>{icon}</span>
            </div>
            <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                {label}
            </h2>
            <span className="text-[11px] font-semibold text-neutral-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">
                {count}
            </span>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MemoriesPage() {
    const { data: session, status } = useSession()
    const [allMemories, setAllMemories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEmotion, setSelectedEmotion] = useState("ALL")

    // Fetch gabungan: memory sendiri + memory kolaborasi ACCEPTED
    useEffect(() => {
        if (status === "unauthenticated") return
        fetch("/api/memories?mine=true")
            .then(res => res.json())
            .then(data => {
                setAllMemories(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [status])

    // Client-side emotion filter
    const filtered =
        selectedEmotion === "ALL"
            ? allMemories
            : allMemories.filter((m: any) => m.emotion === selectedEmotion)

    const withPhotos = filtered.filter((m: any) => m.photos && m.photos.length > 0)
    const withoutPhotos = filtered.filter((m: any) => !m.photos || m.photos.length === 0)

    // Stats
    const totalPhotos = allMemories.reduce((a: number, m: any) => a + (m.photos?.length || 0), 0)
    const totalCollab = allMemories.filter((m: any) => m.isCollaboration).length

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-3">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-sm text-neutral-500 animate-pulse">Loading your memories…</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

            {/* ── Hero Header ─────────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.div
                    variants={fadeUp}
                    className="relative rounded-2xl overflow-hidden border border-violet-500/[0.12] px-7 py-6"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(139,92,246,0.09) 0%, rgba(99,102,241,0.06) 50%, rgba(8,8,16,0) 100%)",
                    }}
                >
                    {/* Dot grid */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: "radial-gradient(rgba(139,92,246,0.18) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                            maskImage: "radial-gradient(ellipse 60% 100% at 90% 50%, black 10%, transparent 70%)",
                            WebkitMaskImage: "radial-gradient(ellipse 60% 100% at 90% 50%, black 10%, transparent 70%)",
                        }}
                    />
                    {/* Top glow line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{
                            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.55) 40%, rgba(99,102,241,0.55) 60%, transparent)",
                        }}
                    />
                    {/* Right ambient orb */}
                    <div
                        className="absolute right-0 top-0 h-full w-72 pointer-events-none opacity-[0.07]"
                        style={{
                            background: "radial-gradient(ellipse at right center, #8b5cf6, transparent 70%)",
                        }}
                    />

                    <div className="relative flex flex-wrap items-center gap-4">
                        {/* Icon */}
                        <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <BookHeart className="w-5 h-5 text-violet-400" />
                        </div>

                        {/* Title */}
                        <div>
                            <h1
                                className="text-2xl sm:text-3xl font-extrabold text-white leading-none"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                My Memories
                            </h1>
                            <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                                Every chapter of your life, beautifully preserved.
                            </p>
                        </div>

                        {/* Stats pills */}
                        <div className="ml-auto shrink-0 hidden sm:flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-[11px] font-medium text-neutral-400">
                                <BookHeart className="w-3 h-3 text-violet-400" />
                                {allMemories.length} {allMemories.length === 1 ? "memory" : "memories"}
                            </div>
                            {totalPhotos > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-[11px] font-medium text-neutral-400">
                                    <ImageIcon className="w-3 h-3 text-indigo-400" />
                                    {totalPhotos} photos
                                </div>
                            )}
                            {totalCollab > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-[11px] font-medium text-violet-400">
                                    <Users className="w-3 h-3" />
                                    {totalCollab} collab
                                </div>
                            )}
                        </div>

                        {/* New Memory CTA */}
                        <Link
                            href="/memories/create"
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-violet-600/25 active:scale-95 sm:ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Memory</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Emotion Filter Bar ───────────────────────────────────────────── */}
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
                    <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600 shrink-0 ml-1 mr-1" />
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
                                        ? "bg-violet-500 text-white border-violet-400/50 shadow-lg shadow-violet-500/20"
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

            {/* ── Feed Content ─────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 px-4 text-center border border-white/[0.05] rounded-2xl bg-white/[0.01]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                            {selectedEmotion === "ALL"
                                ? <BookHeart className="w-5 h-5 text-neutral-600" />
                                : <Filter className="w-5 h-5 text-neutral-600" />
                            }
                        </div>
                        <h3
                            className="text-lg font-bold text-white mb-2"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            {selectedEmotion === "ALL" ? "No memories yet" : "No memories found"}
                        </h3>
                        <p className="text-neutral-500 text-sm max-w-xs mb-5 leading-relaxed">
                            {selectedEmotion === "ALL"
                                ? "Every great journey starts with a single step. Begin documenting your life today."
                                : `You have no memories tagged with "${EMOTIONS.find(e => e.value === selectedEmotion)?.label?.toLowerCase()}" yet.`
                            }
                        </p>
                        {selectedEmotion === "ALL" ? (
                            <Link
                                href="/memories/create"
                                className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors px-4 py-1.5 rounded-full border border-violet-500/20 hover:border-violet-500/40"
                            >
                                Create your first memory →
                            </Link>
                        ) : (
                            <button
                                onClick={() => setSelectedEmotion("ALL")}
                                className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors px-4 py-1.5 rounded-full border border-violet-500/20 hover:border-violet-500/40"
                            >
                                Reset filter
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
                        {/* ── Visual Memories ──────────────────────────────────── */}
                        {withPhotos.length > 0 && (
                            <div className="space-y-4">
                                <SectionHeader
                                    icon={<ImageIcon className="w-3.5 h-3.5" />}
                                    label="Visual Memories"
                                    count={withPhotos.length}
                                    accent="indigo"
                                />
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={stagger}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                >
                                    {withPhotos.map((memory: any) => (
                                        <motion.div key={memory.id} variants={fadeUp}>
                                            <MemoryCard
                                                memory={memory}
                                                isCollaboration={memory.isCollaboration}
                                                placements={memory.stickerPlacements ?? []}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        {/* Divider between sections */}
                        {withPhotos.length > 0 && withoutPhotos.length > 0 && (
                            <div className="h-px bg-white/[0.04]" />
                        )}

                        {/* ── Journal Entries ───────────────────────────────────── */}
                        {withoutPhotos.length > 0 && (
                            <div className="space-y-4">
                                <SectionHeader
                                    icon={<BookOpen className="w-3.5 h-3.5" />}
                                    label="Journal Entries"
                                    count={withoutPhotos.length}
                                    accent="emerald"
                                />
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={stagger}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                >
                                    {withoutPhotos.map((memory: any) => (
                                        <motion.div key={memory.id} variants={fadeUp}>
                                            <MemoryCard
                                                memory={memory}
                                                isCollaboration={memory.isCollaboration}
                                                placements={memory.stickerPlacements ?? []}
                                            />
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
