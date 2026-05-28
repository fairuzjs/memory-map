"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Globe, Loader2, MapPin, Image as ImageIcon,
    Search, X, Users, UserRound, ChevronRight,
    Clock, TrendingUp
} from "lucide-react"
import Link from "next/link"
import { getMemoryCover } from "@/lib/utils"

// ─── Types & Constants ────────────────────────────────────────────────────────

type Tab  = "memories" | "explorers"
type Sort = "latest"   | "popular"

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

const EMOTION_COLORS: Record<string, string> = {
    ALL: "bg-[#bae6fd]",          // Soft Sky Blue
    HAPPY: "bg-[#fef08a]",        // Soft Yellow
    SAD: "bg-[#bfdbfe]",          // Soft Blue
    NOSTALGIC: "bg-[#fed7aa]",    // Soft Orange/Peach
    EXCITED: "bg-[#fca5a5]",      // Soft Red
    PEACEFUL: "bg-[#86efac]",     // Soft Green
    GRATEFUL: "bg-[#f5d0fe]",     // Soft Fuchsia/Purple
    ROMANTIC: "bg-[#fbcfe8]",     // Soft Pink
    ADVENTUROUS: "bg-[#99f6e4]",   // Soft Teal
}

const SORT_OPTIONS: { value: Sort; label: string; icon: React.ReactNode }[] = [
    { value: "latest",  label: "Terbaru",    icon: <Clock       className="w-4 h-4" /> },
    { value: "popular", label: "Terpopuler", icon: <TrendingUp  className="w-4 h-4" /> },
]

const PAGE_LIMIT = 12

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({ user, index }: { user: any; index: number }) {
    const avatar = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
        >
            <Link
                href={`/profile/${user.id}`}
                className="group flex items-center gap-4 rounded-2xl border-[3px] border-black bg-white p-4 shadow-[4px_4px_0_#000] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] hover:bg-[#fef08a] active:translate-y-0 active:shadow-none"
            >
                <div className="relative shrink-0">
                    <img src={avatar} alt={user.name}
                        className="h-12 w-12 rounded-xl border-[3px] border-black object-cover bg-neutral-200"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="truncate text-[15px] font-black text-black">
                        {user.name}
                    </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border-[3px] border-black bg-white transition-colors group-hover:bg-black group-hover:text-[#67e8f9]">
                    <ChevronRight className="w-5 h-5 font-black" />
                </div>
            </Link>
        </motion.div>
    )
}

// ─── Explorers Tab ────────────────────────────────────────────────────────────

function ExplorersTab() {
    const [query, setQuery]       = useState("")
    const [results, setResults]   = useState<any[]>([])
    const [loading, setLoading]   = useState(false)
    const [searched, setSearched] = useState(false)
    const inputRef                = useRef<HTMLInputElement>(null)
    const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

    const doSearch = useCallback((q: string) => {
        if (q.trim().length < 2) { setResults([]); setSearched(false); return }
        setLoading(true)
        setSearched(true)
        fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`)
            .then(r => r.json())
            .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(val), 380)
    }

    const clearSearch = () => {
        setQuery("")
        setResults([])
        setSearched(false)
        inputRef.current?.focus()
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Search field */}
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                    <Search className="w-5 h-5 text-black" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Cari nama explorer…"
                    autoFocus
                    className="w-full rounded-2xl border-[3px] border-black bg-white py-4 pl-12 pr-12 text-[15px] font-black text-black placeholder:text-black/40 focus:outline-none focus:ring-0 shadow-[4px_4px_0_#000] transition-shadow focus:shadow-[6px_6px_0_#000]"
                />
                <AnimatePresence>
                    {query && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border-[3px] border-black bg-[#f5d0fe] transition-all hover:bg-black hover:text-[#f5d0fe] hover:-translate-y-[60%] shadow-[2px_2px_0_#000] active:translate-y-[-50%] active:shadow-none"
                        >
                            <X className="w-5 h-5 font-black text-black group-hover:text-white" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-3 rounded-2xl border-[3px] border-black bg-white py-16 shadow-[4px_4px_0_#000]"
                    >
                        <Loader2 className="w-6 h-6 text-black animate-spin" />
                        <span className="text-[15px] font-black uppercase text-black">Mencari…</span>
                    </motion.div>
                )}
                {!loading && !searched && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center rounded-2xl border-[3px] border-black bg-white py-20 text-center shadow-[4px_4px_0_#000]"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-[#67e8f9] shadow-[4px_4px_0_#000]">
                            <Users className="w-7 h-7 text-black" />
                        </div>
                        <p className="mb-1 text-[18px] font-black uppercase text-black">Temukan sesama explorer</p>
                        <p className="text-[14px] font-bold text-black/60">Ketik minimal 2 karakter untuk mencari</p>
                    </motion.div>
                )}
                {!loading && searched && results.length === 0 && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center rounded-2xl border-[3px] border-black bg-white py-20 text-center shadow-[4px_4px_0_#000]"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-[#fca5a5] shadow-[4px_4px_0_#000]">
                            <UserRound className="w-7 h-7 text-black" />
                        </div>
                        <p className="mb-1 text-[18px] font-black uppercase text-black">Tidak ada hasil</p>
                        <p className="text-[14px] font-bold text-black/60">
                            Kata kunci <span className="rounded-md border-[2px] border-black bg-[#fef08a] px-1.5 py-0.5 text-black shadow-[2px_2px_0_#000] mx-1">{query}</span> tidak ditemukan
                        </p>
                    </motion.div>
                )}
                {!loading && searched && results.length > 0 && (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <p className="mb-4 inline-block rounded-xl border-[3px] border-black bg-[#86efac] px-4 py-1.5 text-[13px] font-black uppercase text-black shadow-[2px_2px_0_#000]">
                            {results.length} ditemukan
                        </p>
                        <div className="space-y-3">
                            {results.map((user, i) => <UserCard key={user.id} user={user} index={i} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, iconBg, title, count }: {
    icon: React.ReactNode; iconBg: string; title: string; count: number
}) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-black shadow-[2px_2px_0_#000] ${iconBg}`}>
                {icon}
            </div>
            <span className="text-[20px] font-black uppercase tracking-tight text-black">
                {title}
            </span>
            <span className="rounded-xl border-[3px] border-black bg-white px-2.5 py-1 text-[13px] font-black text-black shadow-[2px_2px_0_#000]">
                {count}
            </span>
        </div>
    )
}

// ─── Insta Memory Card ────────────────────────────────────────────────────────

type CardTheme = {
    border: string
    background: string
    shadow: string
    imageFilter: string
    radius: string
    contentPadding: string
    titleColor: string
    storyColor: string
    footerBorder: string
    footerTextColor: string
}

function parseTheme(rawValue: string | null | undefined): CardTheme | null {
    if (!rawValue) return null
    try { return JSON.parse(rawValue) } catch { return null }
}

function isDarkTheme(theme: CardTheme | null) {
    if (!theme) return false
    const bg = theme.background.toLowerCase()
    return (
        bg.includes("#0a") ||
        bg.includes("#1a") ||
        bg.includes("#03") ||
        bg.includes("#05") ||
        bg.includes("#12") ||
        bg.includes("#15") ||
        bg.includes("rgba(10,10,20") ||
        bg.includes("rgba(5,5,15") ||
        theme.titleColor.toLowerCase().startsWith("#d") ||
        theme.titleColor.toLowerCase().startsWith("#e") ||
        theme.titleColor.toLowerCase().startsWith("#f") ||
        theme.titleColor.toLowerCase().startsWith("#9")
    )
}

function InstaMemoryCard({ memory }: { memory: any }) {
    // Parse equipped card theme from user inventories
    const rawThemeValue = memory.user?.inventories?.[0]?.item?.value ?? null
    const theme = parseTheme(rawThemeValue)

    const coverUrl = getMemoryCover(memory)

    return (
        <Link 
            href={`/memories/${memory.id}`} 
            className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
                background: theme?.background ?? "white",
                border: theme?.border ?? "3px solid #000",
                borderRadius: theme?.radius ?? "1rem",
                boxShadow: theme?.shadow ?? "4px 4px 0 #000",
            }}
        >
            {/* Photo / Content Area (Aspect Square) */}
            <div 
                className="relative aspect-square overflow-hidden flex items-center justify-center"
                style={{
                    borderBottom: theme?.border ?? "3px solid #000",
                    background: theme ? "transparent" : "#FFFDF0",
                    borderRadius: theme ? `${theme.radius} ${theme.radius} 0 0` : "13px 13px 0 0",
                }}
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={memory.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="p-4 w-full h-full flex flex-col justify-center text-center">
                         <p 
                            className="line-clamp-4 text-[12px] font-extrabold sm:text-[14px]"
                            style={{ color: theme?.storyColor ?? "#000" }}
                         >
                             {memory.story || memory.title}
                         </p>
                    </div>
                )}
                
                {/* Visual Indicators */}
                {(memory.audioUrl || memory.spotifyTrackId) && (
                    <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-black bg-[#67e8f9] shadow-[2px_2px_0_#000] sm:h-8 sm:w-8">
                        <span className="text-[12px] sm:text-[14px]">🎵</span>
                    </div>
                )}
                {memory.isCollaboration && (
                    <div className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-black bg-[#f5d0fe] shadow-[2px_2px_0_#000] sm:h-8 sm:w-8">
                        <span className="text-[12px] sm:text-[14px]">👥</span>
                    </div>
                )}
            </div>

            {/* Username Footer */}
            <div 
                className={`flex items-center gap-2 p-2 transition-colors sm:p-3 ${!theme ? "bg-white group-hover:bg-[#fef08a]" : ""}`}
            >
                <img
                    src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                    alt={memory.user.name}
                    className="h-6 w-6 shrink-0 rounded-lg border-[2px] border-black object-cover bg-white sm:h-7 sm:w-7"
                />
                <span 
                    className={`truncate text-[10px] font-extrabold sm:text-[13px] ${theme ? (isDarkTheme(theme) ? "text-white" : "text-black") : "text-black"}`}
                >
                    {memory.user.name}
                </span>
            </div>
        </Link>
    )
}

// ─── Memories Feed Tab ────────────────────────────────────────────────────────

function MemoriesFeedTab() {
    const [memories, setMemories]       = useState<any[]>([])
    const [loading, setLoading]         = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [selectedEmotion, setEmotion] = useState("ALL")
    const [sort, setSort]               = useState<Sort>("latest")
    const [page, setPage]               = useState(1)
    const [hasMore, setHasMore]         = useState(false)
    const [total, setTotal]             = useState(0)

    // Reset ke halaman 1 saat filter/sort berubah
    const resetAndFetch = useCallback((emotion: string, sortVal: Sort) => {
        setLoading(true)
        setPage(1)
        setMemories([])

        const url = buildUrl(emotion, sortVal, 1)
        fetch(url)
            .then(r => r.json())
            .then(res => {
                setMemories(res.data ?? [])
                setHasMore(res.pagination?.hasMore ?? false)
                setTotal(res.pagination?.total ?? 0)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    // Load more (append)
    const loadMore = () => {
        if (loadingMore || !hasMore) return
        const nextPage = page + 1
        setLoadingMore(true)
        const url = buildUrl(selectedEmotion, sort, nextPage)
        fetch(url)
            .then(r => r.json())
            .then(res => {
                setMemories(prev => [...prev, ...(res.data ?? [])])
                setHasMore(res.pagination?.hasMore ?? false)
                setPage(nextPage)
                setLoadingMore(false)
            })
            .catch(() => setLoadingMore(false))
    }

    useEffect(() => { resetAndFetch(selectedEmotion, sort) }, [selectedEmotion, sort, resetAndFetch])

    const handleEmotionChange = (val: string) => {
        setEmotion(val)
    }
    const handleSortChange = (val: Sort) => {
        setSort(val)
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* ── Compact Filter Bar ────────────────────────────────── */}
            <div className="sticky top-[88px] z-20 mb-4 space-y-3 rounded-2xl border-[3px] border-black bg-[#FFFDF0] p-4 shadow-[4px_4px_0_#000] sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:border-none sm:space-y-4">
                {/* Row 1: Sort + Count badge */}
                <div className="flex items-center gap-2">
                    {SORT_OPTIONS.map(opt => {
                        const active = sort === opt.value
                        // Custom active colors for sort options to increase variety:
                        // Terbaru: soft green (#86efac)
                        // Terpopuler: soft yellow (#fef08a)
                        const activeBg = opt.value === "latest" ? "bg-[#86efac]" : "bg-[#fef08a]"
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSortChange(opt.value)}
                                className={`flex min-h-10 items-center gap-2 rounded-xl border-[3px] border-black px-4 py-2 text-[13px] font-black uppercase transition-all whitespace-nowrap shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-0 active:shadow-none ${
                                    active
                                        ? `${activeBg} text-black`
                                        : "bg-white text-black hover:bg-neutral-50"
                                }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        )
                    })}
                    {!loading && total > 0 && (
                        <div className="ml-auto rounded-xl border-[3px] border-black bg-[#f5d0fe] px-3 py-2 text-[12px] font-black text-black tabular-nums whitespace-nowrap shadow-[2px_2px_0_#000]">
                            {memories.length}/{total}
                        </div>
                    )}
                </div>
                {/* Row 2: Emotion chips — single scrollable row, emoji-only on mobile */}
                <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-2">
                    {EMOTIONS.map(em => {
                        const active = selectedEmotion === em.value
                        const activeBg = EMOTION_COLORS[em.value] || "bg-[#fef08a]"
                        return (
                            <button
                                key={em.value}
                                onClick={() => handleEmotionChange(em.value)}
                                className={`flex min-h-10 items-center gap-2 rounded-xl border-[3px] border-black px-4 py-2 text-[13px] font-black uppercase transition-all whitespace-nowrap shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-0 active:shadow-none ${
                                    active
                                        ? `${activeBg} text-black`
                                        : "bg-white text-black hover:bg-neutral-50"
                                }`}
                            >
                                <span className="text-[16px]">{em.emoji}</span>
                                <span className="hidden sm:inline">{em.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-4 rounded-2xl border-[3px] border-black bg-white py-20 shadow-[4px_4px_0_#000]"
                    >
                        <Loader2 className="w-10 h-10 text-black animate-spin" />
                        <p className="text-[15px] font-black uppercase text-black">Memuat Kenangan…</p>
                    </motion.div>
                ) : memories.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center rounded-2xl border-[3px] border-black bg-white py-20 text-center shadow-[4px_4px_0_#000]"
                    >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-[#fef08a] shadow-[4px_4px_0_#000]">
                            <MapPin className="w-8 h-8 text-black" />
                        </div>
                        <p className="mb-2 text-[18px] font-black uppercase text-black">Belum ada kenangan</p>
                        <p className="mb-6 max-w-sm text-[14px] font-bold leading-relaxed text-black/60">
                            {selectedEmotion === "ALL"
                                ? "Jadilah yang pertama berbagi kenangan ke komunitas!"
                                : `Belum ada kenangan dengan emosi "${selectedEmotion.toLowerCase()}".`}
                        </p>
                        {selectedEmotion !== "ALL" && (
                            <button onClick={() => handleEmotionChange("ALL")}
                                className="rounded-xl border-[3px] border-black bg-[#86efac] px-6 py-3 text-[14px] font-black uppercase text-black shadow-[4px_4px_0_#000] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-none">
                                Lihat Semua
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        <SectionHeader
                            icon={<ImageIcon className="w-5 h-5 text-black" />}
                            iconBg="bg-[#86efac]"
                            title="Semua Kenangan"
                            count={total}
                        />

                        <section className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                                {memories.map((m, i) => (
                                    <motion.div 
                                        key={m.id} 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (i % PAGE_LIMIT) * 0.03, type: "spring", stiffness: 300, damping: 26 }}
                                    >
                                        <InstaMemoryCard memory={m} />
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {hasMore && (
                            <div className="flex justify-center pt-6">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex min-h-12 items-center gap-3 rounded-xl border-[3px] border-black bg-[#fef08a] px-8 py-3 text-[15px] font-black uppercase text-black shadow-[4px_4px_0_#000] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loadingMore
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Memuat…</>
                                        : <>Muat Lebih Banyak <span className="rounded-md border-[2px] border-black bg-black px-2 py-0.5 text-white">({total - memories.length} tersisa)</span></>
                                    }
                                </button>
                            </div>
                        )}

                        {!hasMore && memories.length > 0 && (
                            <div className="flex justify-center pt-6">
                                <p className="inline-block rounded-xl border-[3px] border-black bg-[#86efac] px-5 py-3 text-[13px] font-black uppercase text-black shadow-[4px_4px_0_#000]">
                                    Semua {total} kenangan telah ditampilkan
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function buildUrl(emotion: string, sort: Sort, page: number) {
    const params = new URLSearchParams({
        public: "true",
        sort,
        page:   String(page),
        limit:  String(PAGE_LIMIT),
    })
    if (emotion !== "ALL") params.set("emotion", emotion)
    return `/api/memories?${params.toString()}`
}

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<Tab>("memories")

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-[3px] border-black p-4 sm:p-5 shadow-[6px_6px_0_#000] rounded-2xl">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#67e8f9] border-[2.5px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0_#000] rounded-xl">
                                <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-black" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl sm:text-3xl font-[Outfit] font-black text-black uppercase tracking-widest leading-none">COMMUNITY</h1>
                                </div>
                                <p className="text-[13px] sm:text-[14px] font-bold text-black/60 leading-relaxed mt-1">
                                    Jelajahi kenangan publik dan temukan explorer dari seluruh dunia.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="flex w-full items-center gap-2 rounded-2xl border-[3px] border-black bg-white p-2 shadow-[4px_4px_0_#000] sm:inline-flex sm:w-auto">
                        {([
                            { id: "memories"  as Tab, label: "Memories",  icon: <Globe className="w-5 h-5" />, activeBg: "bg-[#fef08a]" },
                            { id: "explorers" as Tab, label: "Explorers", icon: <Users className="w-5 h-5" />, activeBg: "bg-[#f5d0fe]" },
                        ] as const).map((tab) => {
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-black uppercase transition-all sm:flex-none sm:justify-start sm:px-6 sm:text-[15px] border-[2px] border-transparent ${
                                        active
                                            ? `${tab.activeBg} text-black border-black shadow-[2.5px_2.5px_0_#000]`
                                            : "bg-transparent text-black hover:bg-[#F5F2EB] hover:border-black/20"
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </motion.div>

                {/* ── Tab Content ───────────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        {activeTab === "memories" ? <MemoriesFeedTab /> : <ExplorersTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
