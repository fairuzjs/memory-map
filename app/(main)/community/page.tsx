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

            {/* ── Unified filter toolbar ─────────────────────────────────── */}
            <div className="flex items-stretch gap-0 border-[4px] border-black bg-white shadow-[6px_6px_0_#000] overflow-hidden flex-col md:flex-row">
                {/* Left: Sort toggle */}
                <div className="flex items-center shrink-0 p-2 gap-2 bg-[#E5E5E5] md:border-r-[4px] border-b-[4px] md:border-b-0 border-black overflow-x-auto">
                    {SORT_OPTIONS.map(opt => {
                        const active = sort === opt.value
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSortChange(opt.value)}
                                className={`flex items-center gap-2 px-3 py-2 border-[2px] border-black text-[12px] font-black uppercase transition-all whitespace-nowrap ${
                                    active ? "bg-[#00FF00] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)] text-black" : "bg-white hover:bg-neutral-100 shadow-[2px_2px_0_#000]"
                                }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        )
                    })}
                </div>

                {/* Right: Emotion chips */}
                <div className="relative flex-1 min-w-0 flex items-center">
                    <div className="flex items-center gap-2 overflow-x-auto p-2 scrollbar-hide w-full">
                        {EMOTIONS.map(em => {
                            const active = selectedEmotion === em.value
                            return (
                                <button
                                    key={em.value}
                                    onClick={() => handleEmotionChange(em.value)}
                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 border-[2px] border-black text-[12px] font-black uppercase transition-all whitespace-nowrap ${
                                        active ? "bg-[#FFFF00] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)] text-black" : "bg-white hover:bg-neutral-100 shadow-[2px_2px_0_#000]"
                                    }`}
                                >
                                    <span className="text-[14px] leading-none">{em.emoji}</span>
                                    <span>{em.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right edge: count badge */}
                {!loading && total > 0 && (
                    <div className="flex items-center shrink-0 px-4 py-2 bg-[#FF00FF] border-l-[4px] border-t-[4px] md:border-t-0 border-black text-[12px] font-black text-white uppercase tabular-nums">
                        {memories.length}/{total} Total
                    </div>
                )}
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
                        {/* Visual Memories */}
                        {withPhotos.length > 0 && (
                            <section className="space-y-4">
                                <SectionHeader
                                    icon={<ImageIcon className="w-5 h-5 text-black" />}
                                    iconBg="bg-[#00FFFF]"
                                    title="Visual Memories" count={withPhotos.length}
                                />
                                <div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                >
                                    {withPhotos.map((m, i) => (
                                        <motion.div 
                                            key={m.id} 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (i % PAGE_LIMIT) * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                                        >
                                            <MemoryCard
                                                memory={m}
                                                placements={m.stickerPlacements ?? []}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {withPhotos.length > 0 && textOnly.length > 0 && (
                            <div className="h-0 border-t-[4px] border-black border-dashed opacity-50" />
                        )}

                        {/* Journal Entries */}
                        {textOnly.length > 0 && (
                            <section className="space-y-4">
                                <SectionHeader
                                    icon={<BookOpen className="w-5 h-5 text-black" />}
                                    iconBg="bg-[#00FF00]"
                                    title="Journal Entries" count={textOnly.length}
                                />
                                <div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                >
                                    {textOnly.map((m, i) => (
                                        <motion.div 
                                            key={m.id} 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (i % PAGE_LIMIT) * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                                        >
                                            <MemoryCard
                                                memory={m}
                                                placements={m.stickerPlacements ?? []}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

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
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#00FFFF] border-[4px] border-black flex items-center justify-center shadow-[4px_4px_0_#000]">
                                <Globe className="w-6 h-6 text-black" />
                            </div>
                            <h1 className="text-[32px] sm:text-[40px] font-black text-black uppercase tracking-tight bg-white px-3 py-1 border-[4px] border-black shadow-[6px_6px_0_#000] inline-block">
                                Community
                            </h1>
                        </div>
                        <div className="sm:ml-auto inline-flex items-center gap-2 px-4 py-2 bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000] transform rotate-1">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white border border-black" />
                            </span>
                            <span className="text-[12px] font-black text-black uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>
                    <p className="text-[14px] font-bold text-black/80 uppercase bg-[#FFFF00] p-3 border-[3px] border-black shadow-[4px_4px_0_#000] inline-block max-w-xl">
                        Jelajahi kenangan publik dan temukan explorer dari seluruh dunia.
                    </p>
                </motion.div>

                {/* ── Tab Switcher ──────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="inline-flex flex-wrap items-center gap-3 p-2 bg-white border-[4px] border-black shadow-[6px_6px_0_#000]">
                        {([
                            { id: "memories"  as Tab, label: "Memories",  icon: <Globe className="w-4 h-4" /> },
                            { id: "explorers" as Tab, label: "Explorers", icon: <Users className="w-4 h-4" /> },
                        ] as const).map(tab => {
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-6 py-3 border-[3px] border-black text-[14px] font-black uppercase transition-all shadow-[4px_4px_0_#000] ${
                                        active ? "bg-[#FF00FF] text-white translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_#000]" : "bg-[#E5E5E5] text-black hover:bg-[#FFFF00]"
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