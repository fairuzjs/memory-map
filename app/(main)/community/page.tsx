"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Globe, Loader2, MapPin, Image as ImageIcon,
    BookOpen, Search, X, Users, UserRound, ChevronRight,
    Clock, TrendingUp
} from "lucide-react"
import { MemoryCard } from "@/components/memories/MemoryCard"
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
    { value: "latest",  label: "Terbaru",    icon: <Clock       className="w-3.5 h-3.5" /> },
    { value: "popular", label: "Terpopuler", icon: <TrendingUp  className="w-3.5 h-3.5" /> },
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
                className="group flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(99,102,241,0.07)"
                    el.style.border = "1px solid rgba(99,102,241,0.2)"
                }}
                onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(255,255,255,0.02)"
                    el.style.border = "1px solid rgba(255,255,255,0.06)"
                }}
            >
                <div className="relative shrink-0">
                    <img src={avatar} alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                        style={{ border: "1.5px solid rgba(255,255,255,0.1)" }}
                    />
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ring-2 ring-indigo-500/40" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/90 group-hover:text-indigo-300 transition-colors truncate leading-tight">
                        {user.name}
                    </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Search field */}
            <div className="relative">
                <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                    style={{ color: query ? "#818cf8" : "#525252" }}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Cari nama explorer…"
                    autoFocus
                    className="w-full py-3 pl-10 pr-10 text-sm text-white placeholder:text-neutral-600 focus:outline-none rounded-xl transition-all duration-200"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        border: query ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: query ? "0 0 0 3px rgba(99,102,241,0.07)" : "none",
                    }}
                />
                <AnimatePresence>
                    {query && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-3 h-3" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2.5 py-14"
                    >
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-sm text-neutral-500">Mencari…</span>
                    </motion.div>
                )}
                {!loading && !searched && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.1)" }}>
                            <Users className="w-6 h-6 text-indigo-400/60" />
                        </div>
                        <p className="text-[13px] font-medium text-neutral-500">Temukan sesama explorer</p>
                        <p className="text-[12px] text-neutral-700 mt-1">Ketik minimal 2 karakter untuk mulai mencari</p>
                    </motion.div>
                )}
                {!loading && searched && results.length === 0 && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <UserRound className="w-6 h-6 text-neutral-600" />
                        </div>
                        <p className="text-[13px] font-medium text-neutral-400">Tidak ada hasil</p>
                        <p className="text-[12px] text-neutral-600 mt-1">
                            Tidak ada explorer dengan kata kunci <span className="text-neutral-400">&ldquo;{query}&rdquo;</span>
                        </p>
                    </motion.div>
                )}
                {!loading && searched && results.length > 0 && (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <p className="text-[11px] text-neutral-600 mb-3 uppercase tracking-widest font-semibold">
                            {results.length} ditemukan
                        </p>
                        <div className="space-y-1.5">
                            {results.map((user, i) => <UserCard key={user.id} user={user} index={i} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, iconBg, iconBorder, title, count }: {
    icon: React.ReactNode; iconBg: string; iconBorder: string; title: string; count: number
}) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
                {icon}
            </div>
            <span className="text-[13px] font-semibold text-white/80">{title}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: "#525252" }}>
                {count}
            </span>
        </div>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* ── Unified filter toolbar ─────────────────────────────────── */}
            <div
                className="flex items-center gap-0 rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
                {/* Left: Sort toggle — fixed width, no shrink */}
                <div className="flex items-center shrink-0 px-1 py-1 gap-0.5">
                    {SORT_OPTIONS.map(opt => {
                        const active = sort === opt.value
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSortChange(opt.value)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap"
                                style={{
                                    background: active ? "rgba(99,102,241,0.18)" : "transparent",
                                    border:     active ? "1px solid rgba(99,102,241,0.22)" : "1px solid transparent",
                                    color:      active ? "#c7d2fe" : "#525252",
                                }}
                            >
                                <span style={{ color: active ? "#818cf8" : "#404040" }}>{opt.icon}</span>
                                {opt.label}
                            </button>
                        )
                    })}
                </div>

                {/* Vertical divider */}
                <div className="w-px self-stretch shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />

                {/* Right: Emotion chips — scrollable */}
                <div className="relative flex-1 min-w-0">
                    {/* Fade masks */}
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0d0d14] to-transparent z-10 pointer-events-none" />

                    <div className="flex items-center gap-1 overflow-x-auto px-2 py-1 scrollbar-hide">
                        {EMOTIONS.map(em => {
                            const active = selectedEmotion === em.value
                            return (
                                <button
                                    key={em.value}
                                    onClick={() => handleEmotionChange(em.value)}
                                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap"
                                    style={{
                                        background: active ? "rgba(99,102,241,0.18)" : "transparent",
                                        border:     active ? "1px solid rgba(99,102,241,0.22)" : "1px solid transparent",
                                        color:      active ? "#c7d2fe" : "#525252",
                                    }}
                                >
                                    <span className="text-[12px] leading-none">{em.emoji}</span>
                                    <span style={{ color: active ? "#c7d2fe" : "#4a4a5a" }}>{em.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right edge: count badge */}
                {!loading && total > 0 && (
                    <>
                        <div className="w-px self-stretch shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
                        <span className="shrink-0 px-3 text-[11px] text-neutral-700 tabular-nums whitespace-nowrap">
                            {memories.length}<span className="text-neutral-800">/{total}</span>
                        </span>
                    </>
                )}
            </div>

            {/* Divider */}
            <div className="h-px mt-1" style={{ background: "rgba(255,255,255,0.04)" }} />

            {/* Feed */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 gap-3"
                    >
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        <p className="text-sm text-neutral-600">Memuat kenangan…</p>
                    </motion.div>

                ) : memories.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <MapPin className="w-5 h-5 text-neutral-700" />
                        </div>
                        <p className="text-[13px] font-medium text-neutral-400 mb-1">Belum ada kenangan</p>
                        <p className="text-[12px] text-neutral-600 max-w-xs leading-relaxed">
                            {selectedEmotion === "ALL"
                                ? "Jadilah yang pertama berbagi kenangan ke komunitas!"
                                : `Belum ada kenangan dengan emosi "${selectedEmotion.toLowerCase()}".`}
                        </p>
                        {selectedEmotion !== "ALL" && (
                            <button onClick={() => handleEmotionChange("ALL")}
                                className="mt-4 text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-4 py-1.5 rounded-full"
                                style={{ border: "1px solid rgba(99,102,241,0.2)" }}>
                                Lihat semua
                            </button>
                        )}
                    </motion.div>

                ) : (
                    <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-10"
                    >
                        {/* Visual Memories */}
                        {withPhotos.length > 0 && (
                            <section className="space-y-4">
                                <SectionHeader
                                    icon={<ImageIcon className="w-3.5 h-3.5 text-indigo-400" />}
                                    iconBg="rgba(99,102,241,0.1)" iconBorder="rgba(99,102,241,0.18)"
                                    title="Visual Memories" count={withPhotos.length}
                                />
                                <motion.div initial="hidden" animate="show" variants={stagger}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                >
                                    {withPhotos.map(m => (
                                        <motion.div key={m.id} variants={fadeUp}>
                                            <MemoryCard memory={m} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </section>
                        )}

                        {withPhotos.length > 0 && textOnly.length > 0 && (
                            <div className="h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                        )}

                        {/* Journal Entries */}
                        {textOnly.length > 0 && (
                            <section className="space-y-4">
                                <SectionHeader
                                    icon={<BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
                                    iconBg="rgba(52,211,153,0.08)" iconBorder="rgba(52,211,153,0.15)"
                                    title="Journal Entries" count={textOnly.length}
                                />
                                <motion.div initial="hidden" animate="show" variants={stagger}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                >
                                    {textOnly.map(m => (
                                        <motion.div key={m.id} variants={fadeUp}>
                                            <MemoryCard memory={m} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </section>
                        )}

                        {/* Load More button */}
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-60"
                                    style={{
                                        background: "rgba(99,102,241,0.1)",
                                        border: "1px solid rgba(99,102,241,0.2)",
                                        color: "#a5b4fc",
                                    }}
                                    onMouseEnter={e => {
                                        if (!loadingMore) {
                                            (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.18)"
                                            ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)"
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.1)"
                                        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.2)"
                                    }}
                                >
                                    {loadingMore
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat…</>
                                        : <>Muat lebih banyak <span className="text-neutral-600">({total - memories.length} tersisa)</span></>
                                    }
                                </button>
                            </div>
                        )}

                        {/* End of feed indicator */}
                        {!hasMore && memories.length > 0 && memories.length >= PAGE_LIMIT && (
                            <p className="text-center text-[11px] text-neutral-700 py-2">
                                Semua {total} kenangan telah ditampilkan
                            </p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

            {/* ── Page Header ───────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mb-7"
            >
                <div className="flex items-center gap-3 mb-1">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.18)" }}
                    >
                        <Globe className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Community</h1>
                    <div
                        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400/80 tracking-wide">LIVE</span>
                    </div>
                </div>
                <p className="text-[13px] text-neutral-600 leading-relaxed pl-11">
                    Jelajahi kenangan publik dan temukan explorer dari seluruh dunia.
                </p>
            </motion.div>

            {/* ── Tab Switcher ──────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-6"
            >
                <div
                    className="inline-flex items-center p-1 rounded-xl gap-1"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                    {([
                        { id: "memories"  as Tab, label: "Memories",  icon: <Globe className="w-3.5 h-3.5" /> },
                        { id: "explorers" as Tab, label: "Explorers", icon: <Users className="w-3.5 h-3.5" /> },
                    ] as const).map(tab => {
                        const active = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200"
                                style={{
                                    color:      active ? "#e0e7ff" : "#737373",
                                    background: active ? "rgba(99,102,241,0.18)" : "transparent",
                                    border:     active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                                }}
                            >
                                <span style={{ color: active ? "#818cf8" : "#525252" }}>{tab.icon}</span>
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
    )
}