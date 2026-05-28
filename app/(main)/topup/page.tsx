"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Zap, Star, ChevronRight, HelpCircle,
    Clock, Loader2, Coins, ArrowLeft, CheckCircle2,
    XCircle, History, ExternalLink, RefreshCw, Search, X
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const TOPUP_OPTIONS = [
    { amount: 500, price: 5000, popular: false, label: "Starter" },
    { amount: 1000, price: 10000, popular: false, label: "Basic" },
    { amount: 2500, price: 25000, popular: true, label: "Popular" },
    { amount: 5000, price: 50000, popular: false, label: "Pro" },
    { amount: 10000, price: 100000, popular: false, label: "Elite" },
    { amount: 25000, price: 250000, popular: false, label: "Legendary" },
]

type HistoryOrder = {
    id: string
    amount: number
    price: number
    status: "PENDING" | "COMPLETED" | "CANCELLED"
    note: string | null
    createdAt: string
}

const STATUS_STYLE = {
    PENDING: {
        label: "MENUNGGU",
        color: "text-black",
        bg: "bg-yellow-300",
        icon: Clock,
    },
    COMPLETED: {
        label: "SELESAI",
        color: "text-black",
        bg: "bg-green-300",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "BATAL",
        color: "text-black",
        bg: "bg-rose-400",
        icon: XCircle,
    },
}

function formatRupiah(n: number) {
    return "Rp " + n.toLocaleString("id-ID")
}

function formatPoints(n: number) {
    if (n >= 1000) return (n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "k"
    return n.toLocaleString("id-ID")
}

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return "Baru saja"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} menit lalu`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} jam lalu`
    const days = Math.floor(hours / 24)
    return `${days} hari lalu`
}

// ─── Modal: Cara Kerja ─────────────────────────────────────────────────────────

function InstructionsModal({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ ease: "backOut", duration: 0.3 }}
                className="w-full max-w-md bg-[#FFFDF0] border-[3px] border-black shadow-[8px_8px_0_#000] rounded-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b-[3px] border-black bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[2.5px] border-black bg-cyan-300 flex items-center justify-center shadow-[2px_2px_0_#000] rounded-xl">
                            <HelpCircle className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="text-[16px] font-black text-black uppercase tracking-wider font-[Outfit]">Cara Kerja Topup</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-white border-[2.5px] border-black flex items-center justify-center hover:bg-rose-400 hover:text-black transition-colors shadow-[2px_2px_0_#000] rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-white font-[Outfit]">
                    <ol className="text-[13px] sm:text-[14px] font-bold text-black/80 space-y-3 list-decimal list-inside marker:font-black">
                        <li className="leading-relaxed">Pilih nominal poin yang ingin kamu beli</li>
                        <li className="leading-relaxed">Lakukan transfer via QRIS sesuai nominal yang tertera</li>
                        <li className="leading-relaxed">Admin akan memverifikasi pembayaran secara manual</li>
                        <li className="leading-relaxed">Poin akan ditambahkan dalam <span className="bg-yellow-300 border-[2px] border-black px-1.5 py-0.5 rounded-lg text-[11px] sm:text-[12px] font-black text-black tracking-wide">1×24 jam</span> setelah konfirmasi</li>
                    </ol>
                </div>

                {/* Footer */}
                <div className="p-5 bg-white border-t-[3px] border-black flex justify-end font-[Outfit]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-green-300 border-[2.5px] border-black text-[12px] font-black uppercase shadow-[2.5px_2.5px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0_#000] hover:bg-yellow-300 active:translate-y-px transition-all"
                    >
                        Saya Mengerti
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Modal: Riwayat ───────────────────────────────────────────────────────────

function HistoryModal({
    onClose,
    history,
    historyLoading,
    historyTotal,
    hasMore,
    loadingMore,
    historyPage,
    fetchHistory,
    searchInput,
    setSearchInput,
    setSearchQuery,
    handleSearch,
}: {
    onClose: () => void
    history: HistoryOrder[]
    historyLoading: boolean
    historyTotal: number
    hasMore: boolean
    loadingMore: boolean
    historyPage: number
    fetchHistory: (page: number, append: boolean) => void
    searchInput: string
    setSearchInput: (val: string) => void
    setSearchQuery: (val: string) => void
    handleSearch: (e: React.FormEvent) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ ease: "backOut", duration: 0.3 }}
                className="w-full max-w-lg bg-[#FFFDF0] border-[3px] border-black shadow-[8px_8px_0_#000] rounded-2xl flex flex-col overflow-hidden animate-none"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b-[3px] border-black flex items-center justify-between bg-yellow-300 font-[Outfit]">
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        <div className="w-10 h-10 bg-white border-[2.5px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] rounded-xl">
                            <History className="w-5 h-5 text-black" />
                        </div>
                        <p className="text-[15px] sm:text-[16px] font-black text-black uppercase tracking-wider">Riwayat Topup</p>
                        {historyTotal > 0 && (
                            <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 bg-fuchsia-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000] rounded-lg">
                                {historyTotal}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-white border-[2.5px] border-black flex items-center justify-center hover:bg-rose-400 hover:text-black transition-colors shadow-[2px_2px_0_#000] rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b-[3px] border-black bg-white font-[Outfit]">
                    <form onSubmit={handleSearch} className="relative flex">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-black/40" />
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value)
                                if (e.target.value === "") {
                                    setSearchQuery("")
                                }
                            }}
                            placeholder="Cari ID Order..."
                            className="w-full bg-white border-[2px] border-black py-2.5 pl-9 pr-9 text-[12px] sm:text-[13px] font-black text-black placeholder:text-black/30 focus:outline-none focus:bg-cyan-50 transition-colors shadow-[2px_2px_0_#000] rounded-xl"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("")
                                    setSearchQuery("")
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-black hover:text-rose-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>
                </div>

                {/* History List */}
                <div className="overflow-hidden bg-white font-[Outfit] flex-1">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 text-black animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-14 h-14 bg-neutral-100 border-[2.5px] border-black flex items-center justify-center mb-4 shadow-[3px_3px_0_#000] rounded-xl animate-bounce">
                                <Coins className="w-7 h-7 text-black" />
                            </div>
                            <p className="text-[16px] font-black text-black uppercase mb-1">Belum Ada Riwayat</p>
                            <p className="text-[12px] font-bold text-black/60 uppercase">Pesanan topup kamu akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="divide-y-[2px] divide-black max-h-[300px] overflow-y-auto custom-scrollbar">
                            <AnimatePresence>
                                {history.map((order, i) => {
                                    const s = STATUS_STYLE[order.status]
                                    const SIcon = s.icon
                                    return (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="p-4 bg-white hover:bg-neutral-50 transition-colors flex flex-col gap-2 border-b border-neutral-100"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <div className="bg-yellow-300 border-[2px] border-black px-2 py-0.5 shadow-[2px_2px_0_#000] flex items-center gap-1 rounded-lg">
                                                            <Star className="w-3 h-3 text-black fill-black" />
                                                            <span className="text-[11px] font-black text-black leading-none">
                                                                {order.amount.toLocaleString("id-ID")}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 uppercase border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center gap-1 rounded-lg ${s.bg} ${s.color}`}
                                                        >
                                                            <SIcon className="w-2.5 h-2.5" />
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[14px] font-black text-black">
                                                            {formatRupiah(order.price)}
                                                        </span>
                                                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                                        <span className="text-[11px] font-bold text-black/60 uppercase">
                                                            {timeAgo(order.createdAt)}
                                                        </span>
                                                    </div>

                                                    {order.note && (
                                                        <p className="text-[11px] font-bold text-black/85 bg-neutral-100 border-[2px] border-black p-2.5 mt-2.5 break-words shadow-[2px_2px_0_#000] italic rounded-xl">
                                                            "{order.note}"
                                                        </p>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/topup/payment?orderId=${order.id}`}
                                                    className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-300 border-[2px] sm:border-[2.5px] border-black flex items-center justify-center hover:bg-cyan-300 shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] transition-all rounded-xl active:translate-y-px"
                                                    title="Lihat detail"
                                                >
                                                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && (
                        <div className="p-4 border-t-[3px] border-black bg-neutral-50">
                            <button
                                onClick={() => fetchHistory(historyPage + 1, true)}
                                disabled={loadingMore}
                                className="w-full py-2 bg-white border-[2.5px] border-black text-[11px] font-black uppercase shadow-[3px_3px_0_#000] flex items-center justify-center gap-2 transition-all hover:bg-yellow-300 disabled:opacity-50 disabled:hover:bg-white rounded-xl active:translate-y-px"
                            >
                                {loadingMore
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</>
                                    : <>Muat Lebih Banyak ({historyTotal - history.length})</>
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Stats Summary */}
                {historyTotal > 0 && !historyLoading && (
                    <div className="p-4 border-t-[3px] border-black bg-neutral-100 grid grid-cols-3 gap-3 font-[Outfit]">
                        {[
                            { label: "Total Order", value: historyTotal, bg: "bg-white" },
                            { label: "Selesai", value: history.filter(o => o.status === "COMPLETED").length, bg: "bg-green-300" },
                            { label: "Pending", value: history.filter(o => o.status === "PENDING").length, bg: "bg-yellow-300" },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className={`p-2 text-center border-[2.5px] border-black shadow-[2px_2px_0_#000] flex flex-col justify-center rounded-xl ${stat.bg}`}
                            >
                                <p className="text-[16px] sm:text-[18px] font-black text-black leading-none">{stat.value}</p>
                                <p className="text-[7px] sm:text-[8px] font-black text-black/60 uppercase mt-1 tracking-wider leading-none">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function TopupPage() {
    const { status } = useSession()
    const router = useRouter()
    const [selected, setSelected] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [history, setHistory] = useState<HistoryOrder[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [historyPage, setHistoryPage] = useState(1)
    const [historyTotal, setHistoryTotal] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const HISTORY_LIMIT = 5

    const [searchInput, setSearchInput] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    // Modal display states
    const [showInstructions, setShowInstructions] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearchQuery(searchInput)
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    if (status === "unauthenticated") {
        return null
    }

    const fetchHistory = useCallback(async (page = 1, append = false) => {
        if (append) setLoadingMore(true)
        else setHistoryLoading(true)
        try {
            const params = new URLSearchParams()
            params.set("page", page.toString())
            params.set("limit", HISTORY_LIMIT.toString())
            if (searchQuery) params.set("search", searchQuery)

            const res = await fetch(`/api/topup?${params.toString()}`)
            if (!res.ok) return
            const data = await res.json()
            const newOrders: HistoryOrder[] = data.orders ?? []
            setHistory(prev => append ? [...prev, ...newOrders] : newOrders)
            setHistoryTotal(data.total ?? 0)
            setHistoryPage(page)
            setHasMore(newOrders.length === HISTORY_LIMIT && (page * HISTORY_LIMIT) < (data.total ?? 0))
        } finally {
            setHistoryLoading(false)
            setLoadingMore(false)
        }
    }, [searchQuery])

    useEffect(() => {
        if (status === "authenticated") fetchHistory()
    }, [status, fetchHistory])

    const handleTopup = async () => {
        if (!selected) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/topup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: selected }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal membuat pesanan", {
                    style: { border: "3px solid black", borderRadius: "12px", background: "#f5d0fe", color: "#000", fontWeight: 900 }
                })
                return
            }
            router.push(`/topup/payment?orderId=${data.id}`)
        } catch {
            toast.error("Terjadi kesalahan, coba lagi", {
                style: { border: "3px solid black", borderRadius: "12px", background: "#f5d0fe", color: "#000", fontWeight: 900 }
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full relative pb-16">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
                {/* Back */}
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[2.5px] border-black text-xs font-[Outfit] font-black uppercase shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] hover:bg-yellow-300 transition-all mb-6 active:translate-y-px"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali Ke Shop
                </Link>

                {/* Main Form container */}
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-4 bg-white border-[3px] border-black p-4 sm:p-5 shadow-[6px_6px_0_#000] rounded-2xl">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-400 border-[2.5px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0_#000] rounded-xl">
                                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-black fill-black" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-[Outfit] font-black text-black uppercase tracking-widest leading-none truncate">Topup Point</h1>
                                <p className="text-[11px] font-black text-black/60 uppercase mt-1.5 tracking-wide">
                                    Tambah poin secara instan untuk belanja
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Popups Utility Buttons Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="flex gap-3 flex-wrap"
                    >
                        <button
                            onClick={() => setShowInstructions(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-300 border-[2.5px] border-black text-xs font-[Outfit] font-black uppercase shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 active:translate-y-px hover:bg-cyan-400 transition-all shrink-0"
                        >
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            Cara Kerja
                        </button>
                        <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-300 border-[2.5px] border-black text-xs font-[Outfit] font-black uppercase shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 active:translate-y-px hover:bg-yellow-400 transition-all shrink-0"
                        >
                            <History className="w-4 h-4 shrink-0" />
                            Riwayat Topup
                            {historyTotal > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-fuchsia-400 text-black text-[9px] font-black rounded-md border border-black shadow-[1px_1px_0_#000] leading-none shrink-0">
                                    {historyTotal}
                                </span>
                            )}
                        </button>
                    </motion.div>

                    {/* Nominal Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="font-[Outfit]"
                    >
                        <p className="text-[12px] font-black tracking-widest text-black uppercase mb-4 px-3 py-1.5 bg-yellow-300 border-[2.5px] border-black inline-block shadow-[2px_2px_0_#000] rounded-xl">Pilih Nominal</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {TOPUP_OPTIONS.map((opt, i) => {
                                const isSelected = selected === opt.amount
                                return (
                                    <motion.button
                                        key={opt.amount}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.04, duration: 0.4 }}
                                        onClick={() => setSelected(opt.amount)}
                                        className={`relative flex flex-col text-left p-4 border-[2.5px] border-black transition-all duration-200 shadow-[3px_3px_0_#000] rounded-2xl ${
                                            isSelected 
                                            ? "bg-yellow-300 translate-x-[-1px] translate-y-[-1px] shadow-[5px_5px_0_#000]" 
                                            : "bg-white hover:bg-neutral-50 active:translate-y-px"
                                        }`}
                                    >
                                        {opt.popular && (
                                            <span
                                                className="absolute -top-3 left-3 text-[8px] sm:text-[9px] font-black px-2 py-0.5 uppercase bg-fuchsia-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000] rounded-lg"
                                            >
                                                Terlaris
                                            </span>
                                        )}
                                        <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-black/50 uppercase mb-1.5">{opt.label}</span>
                                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap min-w-0">
                                            <Star className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black fill-black shrink-0" />
                                            <span className="text-lg sm:text-xl font-black text-black leading-none">{formatPoints(opt.amount)}</span>
                                            <span className="text-[9px] font-black uppercase text-black/40 leading-none">pts</span>
                                        </div>
                                        <p className="text-[12px] sm:text-[13px] font-black text-rose-500 bg-white border-[2px] border-black px-2 py-0.5 w-max mt-auto rounded-lg">
                                            {formatRupiah(opt.price)}
                                        </p>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Summary & CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <AnimatePresence>
                            {selected && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="mb-6 bg-white border-[3px] border-black p-4 sm:p-5 shadow-[5px_5px_0_#000] overflow-hidden rounded-2xl font-[Outfit]"
                                >
                                    {(() => {
                                        const opt = TOPUP_OPTIONS.find(o => o.amount === selected)!
                                        return (
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-cyan-300 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] rounded-xl">
                                                        <Coins className="w-5 h-5 text-black" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[15px] sm:text-[16px] font-black text-black leading-none">{opt.amount.toLocaleString("id-ID")} POIN</p>
                                                        <p className="text-[9px] sm:text-[10px] font-black text-black/40 uppercase mt-1">Ditambahkan</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[16px] sm:text-[18px] font-black text-black leading-none">{formatRupiah(opt.price)}</p>
                                                    <p className="text-[9px] sm:text-[10px] font-black text-black/40 uppercase mt-1">Ditransfer</p>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleTopup}
                            disabled={!selected || submitting}
                            className={`w-full py-3.5 border-[3px] border-black font-black text-[14px] uppercase flex items-center justify-center gap-2 transition-all duration-200 shadow-[3px_3px_0_#000] rounded-xl font-[Outfit] active:translate-y-px ${
                                selected && !submitting
                                ? "bg-green-300 text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#000] hover:bg-[#FFFF00]"
                                : "bg-neutral-200 text-neutral-400 shadow-none cursor-not-allowed"
                            }`}
                        >
                            {submitting
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                                : <>{selected ? "Lanjut ke Pembayaran" : "Pilih Nominal"}</>
                            }
                            {!submitting && selected && (
                                <ChevronRight className="w-6 h-6" />
                            )}
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* ── Instructions Popup Modal ── */}
            <AnimatePresence>
                {showInstructions && (
                    <InstructionsModal onClose={() => setShowInstructions(false)} />
                )}
            </AnimatePresence>

            {/* ── History Popup Modal ── */}
            <AnimatePresence>
                {showHistory && (
                    <HistoryModal
                        onClose={() => setShowHistory(false)}
                        history={history}
                        historyLoading={historyLoading}
                        historyTotal={historyTotal}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        historyPage={historyPage}
                        fetchHistory={fetchHistory}
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        setSearchQuery={setSearchQuery}
                        handleSearch={handleSearch}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
