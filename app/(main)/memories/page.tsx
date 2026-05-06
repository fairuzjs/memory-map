"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus, Loader2, BookHeart, Image as ImageIcon,
    BookOpen, Filter, SlidersHorizontal, MapPin, Users, ChevronDown
} from "lucide-react"
import { MemoryCard } from "@/components/memories/MemoryCard"

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MemoryPhoto {
    id: string
    url: string
}

interface StickerPlacement {
    id: string
    posX: number
    posY: number
    rotation: number
    scale: number
    customText?: string | null
    item: { id: string; name: string; value: string; previewColor: string | null }
}

export interface Memory {
    id: string
    title: string
    date: string
    emotion: string
    isPublic: boolean
    latitude: number
    longitude: number
    isCollaboration: boolean
    photos: MemoryPhoto[]
    stickerPlacements: StickerPlacement[]
    user?: {
        id: string
        name: string | null
        image: string | null
    }
}

interface PaginatedResponse {
    data: Memory[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_LIMIT = 24

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
        indigo: { bg: "bg-[#00FFFF]", border: "border-black", text: "text-black" },
        emerald: { bg: "bg-[#00FF00]", border: "border-black", text: "text-black" },
        violet: { bg: "bg-[#FF00FF]", border: "border-black", text: "text-white" },
    }
    const c = colors[accent]
    return (
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${c.bg} border-[3px] ${c.border} flex items-center justify-center shadow-[2px_2px_0_#000]`}>
                <span className={c.text}>{icon}</span>
            </div>
            <h2 className="text-[16px] font-black uppercase text-black">
                {label}
            </h2>
            <span className="text-[12px] font-black uppercase text-black bg-[#E5E5E5] border-[2px] border-black px-2 py-0.5 shadow-[2px_2px_0_#000]">
                {count}
            </span>
        </div>
    )
}

// ─── URL Builder ───────────────────────────────────────────────────────────────
function buildMineUrl(page: number, emotion: string): string {
    const params = new URLSearchParams({
        mine: "true",
        page: String(page),
        limit: String(PAGE_LIMIT),
    })
    if (emotion !== "ALL") params.set("emotion", emotion)
    return `/api/memories?${params.toString()}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MemoriesPage() {
    const { data: session, status } = useSession()
    const [memories, setMemories]       = useState<Memory[]>([])
    const [loading, setLoading]         = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage]               = useState(1)
    const [hasMore, setHasMore]         = useState(false)
    const [total, setTotal]             = useState(0)
    const [selectedEmotion, setSelectedEmotion] = useState("ALL")

    // Initial fetch
    const resetAndFetch = useCallback((emotion: string) => {
        setLoading(true)
        setPage(1)
        setMemories([])

        fetch(buildMineUrl(1, emotion))
            .then(res => res.json())
            .then((res: PaginatedResponse) => {
                setMemories(res.data ?? [])
                setHasMore(res.pagination?.hasMore ?? false)
                setTotal(res.pagination?.total ?? 0)
            })
            .catch(() => { /* silently fail */ })
            .finally(() => setLoading(false))
    }, [])

    // Load more (append)
    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return
        const nextPage = page + 1
        setLoadingMore(true)

        fetch(buildMineUrl(nextPage, selectedEmotion))
            .then(res => res.json())
            .then((res: PaginatedResponse) => {
                setMemories(prev => [...prev, ...(res.data ?? [])])
                setHasMore(res.pagination?.hasMore ?? false)
                setPage(nextPage)
            })
            .catch(() => { /* silently fail */ })
            .finally(() => setLoadingMore(false))
    }, [loadingMore, hasMore, page, selectedEmotion])

    useEffect(() => {
        if (status === "unauthenticated") return
        resetAndFetch(selectedEmotion)
    }, [status, selectedEmotion, resetAndFetch])

    // Client-side splits (no extra filter needed — API handles emotion filtering)
    const withPhotos    = memories.filter(m => m.photos?.length > 0)
    const withoutPhotos = memories.filter(m => !m.photos?.length)

    // Stats
    const totalPhotos = memories.reduce((a, m) => a + (m.photos?.length || 0), 0)
    const totalCollab = memories.filter(m => m.isCollaboration).length

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-4">
                <Loader2 className="w-10 h-10 text-black animate-spin" />
                <p className="text-sm font-black uppercase tracking-widest text-black">Loading your memories…</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

            {/* ── Hero Header ─────────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.div
                    variants={fadeUp}
                    className="relative bg-[#E5E5E5] border-[4px] border-black px-7 py-6 shadow-[8px_8px_0_#000]"
                >
                    {/* Dot grid */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: "radial-gradient(#00000020 2px, transparent 2px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    <div className="relative flex flex-wrap items-center gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-[#FF00FF] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0_#000]">
                            <BookHeart className="w-6 h-6 text-white" />
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight" style={{ textShadow: "2px 2px 0 #00FFFF" }}>
                                My Memories
                            </h1>
                            <p className="text-black font-bold text-sm mt-1">
                                Setiap kenangan dalam hidupmu, terabadikan dengan indah.
                            </p>
                        </div>

                        {/* Stats pills */}
                        <div className="ml-auto shrink-0 hidden sm:flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black bg-white shadow-[2px_2px_0_#000] text-[11px] font-black uppercase text-black">
                                <BookHeart className="w-3.5 h-3.5 text-black" />
                                {total} {total === 1 ? "memory" : "memories"}
                            </div>
                            {totalPhotos > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black bg-white shadow-[2px_2px_0_#000] text-[11px] font-black uppercase text-black">
                                    <ImageIcon className="w-3.5 h-3.5 text-black" />
                                    {totalPhotos} photos
                                </div>
                            )}
                            {totalCollab > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black bg-[#FF00FF] shadow-[2px_2px_0_#000] text-[11px] font-black uppercase text-white">
                                    <Users className="w-3.5 h-3.5" />
                                    {totalCollab} collab
                                </div>
                            )}
                        </div>

                        {/* New Memory CTA */}
                        <Link
                            href="/memories/create"
                            className="flex items-center gap-2 bg-[#FFFF00] hover:bg-[#00FFFF] text-black border-[3px] border-black px-5 py-2.5 text-sm font-black uppercase transition-all shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none sm:ml-auto"
                        >
                            <Plus className="w-5 h-5" />
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
                <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x">
                    <SlidersHorizontal className="w-5 h-5 text-black shrink-0 ml-1 mr-1" />
                    {EMOTIONS.map(emotion => {
                        const isSelected = selectedEmotion === emotion.value
                        return (
                            <button
                                key={emotion.value}
                                onClick={() => setSelectedEmotion(emotion.value)}
                                className={`
                                    snap-start shrink-0 flex items-center gap-2 px-4 py-2
                                    text-[13px] font-black uppercase tracking-wider transition-all border-[3px] border-black
                                    ${isSelected
                                        ? "bg-[#FF00FF] text-white shadow-[4px_4px_0_#000]"
                                        : "bg-white text-black shadow-[2px_2px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] hover:bg-[#FFFF00]"
                                    }
                                `}
                            >
                                <span className="text-base leading-none">{emotion.emoji}</span>
                                <span>{emotion.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Separator */}
                <div className="mt-2 border-t-[4px] border-black border-dashed" />
            </motion.div>

            {/* ── Feed Content ─────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {memories.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 px-4 text-center border-[4px] border-black bg-white shadow-[8px_8px_0_#000]"
                    >
                        <div className="w-16 h-16 bg-[#00FFFF] border-[3px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000]">
                            {selectedEmotion === "ALL"
                                ? <BookHeart className="w-8 h-8 text-black" />
                                : <Filter className="w-8 h-8 text-black" />
                            }
                        </div>
                        <h3 className="text-2xl font-black text-black uppercase mb-3" style={{ textShadow: "2px 2px 0 #FF00FF" }}>
                            {selectedEmotion === "ALL" ? "No memories yet" : "No memories found"}
                        </h3>
                        <p className="text-black font-bold text-sm max-w-xs mb-8 leading-relaxed">
                            {selectedEmotion === "ALL"
                                ? "Every great journey starts with a single step. Begin documenting your life today."
                                : `You have no memories tagged with "${EMOTIONS.find(e => e.value === selectedEmotion)?.label?.toLowerCase()}" yet.`
                            }
                        </p>
                        {selectedEmotion === "ALL" ? (
                            <Link
                                href="/memories/create"
                                className="text-[13px] font-black uppercase text-black bg-[#FFFF00] border-[3px] border-black px-6 py-3 shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                            >
                                Create your first memory →
                            </Link>
                        ) : (
                            <button
                                onClick={() => setSelectedEmotion("ALL")}
                                className="text-[13px] font-black uppercase text-white bg-[#FF00FF] border-[3px] border-black px-6 py-3 shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
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
                                    {withPhotos.map((memory) => (
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

                        {withPhotos.length > 0 && withoutPhotos.length > 0 && (
                            <div className="border-t-[4px] border-black border-dashed" />
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
                                    {withoutPhotos.map((memory) => (
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

                        {/* ── Load More ──────────────────────────────────────────── */}
                        {hasMore && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-3 pt-6"
                            >
                                <p className="text-[12px] font-black uppercase text-black">
                                    Menampilkan {memories.length} dari {total} kenangan
                                </p>
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-3 text-sm font-black uppercase text-black bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#FFFF00] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Memuat…</>
                                    ) : (
                                        <><ChevronDown className="w-5 h-5" /> Muat Lebih Banyak</>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {!hasMore && memories.length > 0 && total > PAGE_LIMIT && (
                            <div className="flex justify-center pt-8">
                                <p className="text-center text-[12px] font-black uppercase text-black bg-[#E5E5E5] border-[2px] border-black px-4 py-2 shadow-[2px_2px_0_#000]">
                                    Semua {total} kenangan telah ditampilkan ✓
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
