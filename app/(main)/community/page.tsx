"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Globe, Loader2, MapPin, Image as ImageIcon,
    BookOpen, Search, X, Users, UserRound, ChevronRight,
    Clock, TrendingUp
} from "lucide-react"
import Link from "next/link"

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

const SORT_OPTIONS: { value: Sort; label: string; icon: React.ReactNode }[] = [
    { value: "latest",  label: "Terbaru",    icon: <Clock       className="w-4 h-4" /> },
    { value: "popular", label: "Terpopuler", icon: <TrendingUp  className="w-4 h-4" /> },
]

const PAGE_LIMIT = 12

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
}
const stagger = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.055 } },
}

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
                className="group flex items-center gap-4 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#00FFFF] transition-all duration-150"
            >
                <div className="relative shrink-0">
                    <img src={avatar} alt={user.name}
                        className="w-12 h-12 border-[2px] border-black object-cover bg-neutral-200 shadow-[2px_2px_0_#000]"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black text-black uppercase tracking-wide truncate">
                        {user.name}
                    </p>
                </div>
                <div className="w-8 h-8 border-[2px] border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#000] group-hover:bg-[#FFFF00] transition-colors">
                    <ChevronRight className="w-5 h-5 text-black font-black" />
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
                    className="w-full py-4 pl-12 pr-12 text-[14px] font-black text-black uppercase placeholder:text-black/50 focus:outline-none bg-white border-[4px] border-black shadow-[6px_6px_0_#000] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0_#000] transition-all"
                />
                <AnimatePresence>
                    {query && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FF3300] border-[2px] border-black flex items-center justify-center hover:bg-rose-600 shadow-[2px_2px_0_#000]"
                        >
                            <X className="w-4 h-4 text-white" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-3 py-16 bg-white border-[4px] border-black shadow-[6px_6px_0_#000]"
                    >
                        <Loader2 className="w-6 h-6 text-black animate-spin" />
                        <span className="text-[14px] font-black uppercase text-black">Mencari…</span>
                    </motion.div>
                )}
                {!loading && !searched && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-white border-[4px] border-black shadow-[6px_6px_0_#000]"
                    >
                        <div className="w-16 h-16 bg-[#00FFFF] border-[3px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_#000]">
                            <Users className="w-8 h-8 text-black" />
                        </div>
                        <p className="text-[16px] font-black uppercase text-black mb-1">Temukan sesama explorer</p>
                        <p className="text-[12px] font-bold text-black/60 uppercase">Ketik minimal 2 karakter untuk mencari</p>
                    </motion.div>
                )}
                {!loading && searched && results.length === 0 && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-white border-[4px] border-black shadow-[6px_6px_0_#000]"
                    >
                        <div className="w-16 h-16 bg-[#FF3300] border-[3px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_#000]">
                            <UserRound className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-[16px] font-black uppercase text-black mb-1">Tidak ada hasil</p>
                        <p className="text-[12px] font-bold text-black/60 uppercase">
                            Kata kunci <span className="text-black bg-[#FFFF00] px-1 border border-black">{query}</span> tidak ditemukan
                        </p>
                    </motion.div>
                )}
                {!loading && searched && results.length > 0 && (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <p className="text-[12px] font-black text-black mb-4 uppercase tracking-widest bg-[#00FF00] inline-block px-3 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
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
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] ${iconBg}`}>
                {icon}
            </div>
            <span className="text-[16px] font-black text-black uppercase tracking-wider bg-white border-[2px] border-black px-3 py-1 shadow-[2px_2px_0_#000]">
                {title}
            </span>
            <span className="text-[12px] font-black bg-[#FFFF00] border-[2px] border-black px-2 py-0.5 shadow-[2px_2px_0_#000]">
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

function InstaMemoryCard({ memory }: { memory: any }) {
    // Parse equipped card theme from user inventories
    const rawThemeValue = memory.user?.inventories?.[0]?.item?.value ?? null
    const theme = parseTheme(rawThemeValue)

    const photos = (memory.photos ?? []).map((p: any) => {
        try {
            const parsed = JSON.parse(p.url)
            return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
        } catch {
            return p
        }
    })

    const hasPhoto = photos.length > 0

    return (
        <Link 
            href={`/memories/${memory.id}`} 
            className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px]"
            style={{
                background: theme?.background ?? "white",
                border: theme?.border ?? "4px solid #000",
                borderRadius: theme?.radius ?? "0px",
                boxShadow: theme?.shadow ?? "4px 4px 0 #000",
            }}
        >
            {/* Photo / Content Area (Aspect Square) */}
            <div 
                className="relative aspect-square overflow-hidden flex items-center justify-center"
                style={{
                    borderBottom: theme?.border ?? "4px solid #000",
                    background: theme ? "transparent" : "#E5E5E5",
                    borderRadius: theme ? `${theme.radius} ${theme.radius} 0 0` : "0px",
                }}
            >
                {hasPhoto ? (
                    <img
                        src={photos[0].url}
                        alt={memory.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="p-4 w-full h-full flex flex-col justify-center text-center">
                         <p 
                            className="text-[12px] sm:text-[14px] font-black uppercase line-clamp-4"
                            style={{ color: theme?.storyColor ?? "#000" }}
                         >
                             {memory.story || memory.title}
                         </p>
                    </div>
                )}
                
                {/* Visual Indicators */}
                {(memory.audioUrl || memory.spotifyTrackId) && (
                    <div className="absolute top-2 left-2 z-10 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[#00FFFF] border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_#000]">
                        <span className="text-[10px] sm:text-[12px]">🎵</span>
                    </div>
                )}
                {memory.isCollaboration && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[#FF00FF] border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_#000]">
                        <span className="text-[10px] sm:text-[12px]">👥</span>
                    </div>
                )}
            </div>

            {/* Username Footer */}
            <div 
                className={`p-2 sm:p-3 flex items-center gap-2 transition-colors ${!theme ? "bg-[#FFFF00] group-hover:bg-[#00FF00]" : ""}`}
            >
                <img
                    src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                    alt={memory.user.name}
                    className="w-5 h-5 sm:w-6 sm:h-6 border-[2px] border-black object-cover shrink-0 bg-white"
                />
                <span 
                    className="text-[10px] sm:text-[13px] font-black uppercase truncate"
                    style={{ color: theme?.footerTextColor ?? "#000" }}
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

    const withPhotos = memories.filter(m => m.photos?.length > 0)
    const textOnly   = memories.filter(m => !m.photos?.length)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* ── Compact Filter Bar ────────────────────────────────── */}
            <div className="space-y-2 mb-4">
                {/* Row 1: Sort + Count badge */}
                <div className="flex items-center gap-2">
                    {SORT_OPTIONS.map(opt => {
                        const active = sort === opt.value
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSortChange(opt.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[11px] font-black uppercase transition-all whitespace-nowrap ${
                                    active
                                        ? "bg-[#00FF00] shadow-[2px_2px_0_#000]"
                                        : "bg-white shadow-[2px_2px_0_#000] hover:bg-neutral-100"
                                }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        )
                    })}
                    {!loading && total > 0 && (
                        <div className="ml-auto px-3 py-1.5 bg-[#FF00FF] border-[2px] border-black text-[11px] font-black text-white uppercase shadow-[2px_2px_0_#000] tabular-nums whitespace-nowrap">
                            {memories.length}/{total}
                        </div>
                    )}
                </div>
                {/* Row 2: Emotion chips — single scrollable row, emoji-only on mobile */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    {EMOTIONS.map(em => {
                        const active = selectedEmotion === em.value
                        return (
                            <button
                                key={em.value}
                                onClick={() => handleEmotionChange(em.value)}
                                className={`shrink-0 flex items-center gap-1 px-2 py-1.5 border-[2px] border-black text-[11px] font-black uppercase transition-all whitespace-nowrap ${
                                    active
                                        ? "bg-[#FFFF00] shadow-[2px_2px_0_#000]"
                                        : "bg-white shadow-[2px_2px_0_#000] hover:bg-neutral-100"
                                }`}
                            >
                                <span className="text-[13px] leading-none">{em.emoji}</span>
                                <span className="hidden sm:inline text-[11px]">{em.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Feed */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 gap-4 bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                    >
                        <Loader2 className="w-10 h-10 text-black animate-spin" />
                        <p className="text-[14px] font-black uppercase text-black">Memuat Kenangan…</p>
                    </motion.div>

                ) : memories.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                    >
                        <div className="w-16 h-16 bg-[#FFFF00] border-[3px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_#000]">
                            <MapPin className="w-8 h-8 text-black" />
                        </div>
                        <p className="text-[16px] font-black uppercase text-black mb-2">Belum ada kenangan</p>
                        <p className="text-[12px] font-bold text-black/60 uppercase max-w-sm leading-relaxed mb-6">
                            {selectedEmotion === "ALL"
                                ? "Jadilah yang pertama berbagi kenangan ke komunitas!"
                                : `Belum ada kenangan dengan emosi "${selectedEmotion.toLowerCase()}".`}
                        </p>
                        {selectedEmotion !== "ALL" && (
                            <button onClick={() => handleEmotionChange("ALL")}
                                className="px-6 py-2 bg-[#00FF00] border-[3px] border-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                                Lihat Semua
                            </button>
                        )}
                    </motion.div>

                ) : (
                    <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-12"
                    >
                        {/* Unified Feed (Images & Text merged like Instagram profile) */}
                        <section className="space-y-4">
                            <SectionHeader
                                icon={<ImageIcon className="w-5 h-5 text-black" />}
                                iconBg="bg-[#00FFFF]"
                                title="Semua Kenangan" count={total}
                            />
                            <div
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
                            >
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

                        {/* Load More button */}
                        {hasMore && (
                            <div className="flex justify-center pt-6">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-3 px-8 py-4 bg-white border-[4px] border-black text-[14px] font-black uppercase shadow-[6px_6px_0_#000] hover:bg-[#FFFF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Memuat…</>
                                        : <>Muat Lebih Banyak <span className="text-black bg-white px-2 border-[2px] border-black shadow-[2px_2px_0_#000]">({total - memories.length} tersisa)</span></>
                                    }
                                </button>
                            </div>
                        )}

                        {/* End of feed indicator */}
                        {!hasMore && memories.length > 0 && memories.length >= PAGE_LIMIT && (
                            <div className="flex justify-center pt-6">
                                <p className="text-[12px] font-black text-black uppercase bg-[#00FF00] inline-block px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000]">
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

// ─── URL Builder Helper ───────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState<Tab>("memories")

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="relative z-10">
                {/* ── Page Header ───────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="mb-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00FFFF] border-[3px] sm:border-[4px] border-black flex items-center justify-center shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] shrink-0">
                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                        </div>
                        <h1 className="text-[22px] sm:text-[40px] font-black text-black uppercase tracking-tight bg-white px-2 sm:px-3 py-1 border-[3px] sm:border-[4px] border-black shadow-[3px_3px_0_#000] sm:shadow-[6px_6px_0_#000] inline-block">
                            Community
                        </h1>
                        <div className="ml-auto inline-flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 bg-[#00FF00] border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_#000] sm:shadow-[4px_4px_0_#000] shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white border border-black" />
                            </span>
                            <span className="text-[10px] sm:text-[12px] font-black text-black uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                    {/* Description — hidden on mobile */}
                    <p className="hidden sm:inline-block text-[14px] font-bold text-black/80 uppercase bg-[#FFFF00] p-3 border-[3px] border-black shadow-[4px_4px_0_#000] max-w-xl mt-4">
                        Jelajahi kenangan publik dan temukan explorer dari seluruh dunia.
                    </p>
                </motion.div>

                {/* ── Tab Switcher (compact, full-width on mobile) ──────── */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mb-4"
                >
                    <div className="flex items-center gap-0 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_#000] bg-white overflow-hidden w-full sm:w-auto sm:inline-flex">
                        {([
                            { id: "memories"  as Tab, label: "Memories",  icon: <Globe className="w-4 h-4" /> },
                            { id: "explorers" as Tab, label: "Explorers", icon: <Users className="w-4 h-4" /> },
                        ] as const).map((tab, idx) => {
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-black uppercase transition-all ${
                                        idx > 0 ? "border-l-[3px] sm:border-l-[4px] border-black" : ""
                                    } ${
                                        active ? "bg-[#FF00FF] text-white" : "bg-[#E5E5E5] text-black hover:bg-[#FFFF00]"
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