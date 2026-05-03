"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Zap, Star, ChevronRight,
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
        bg: "bg-[#FFFF00]",
        icon: Clock,
    },
    COMPLETED: {
        label: "SELESAI",
        color: "text-black",
        bg: "bg-[#00FF00]",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "BATAL",
        color: "text-white",
        bg: "bg-[#FF00FF]",
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
                    style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
                })
                return
            }
            router.push(`/topup/payment?orderId=${data.id}`)
        } catch {
            toast.error("Terjadi kesalahan, coba lagi", {
                style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen w-full relative">
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black text-sm font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#FFFF00] transition-all mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    KEMBALI KE SHOP
                </Link>

                {/* 2-column layout on lg+ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* ── LEFT: Topup Form ── */}
                    <div className="lg:col-span-3">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-4 bg-white border-[4px] border-black p-4 shadow-[8px_8px_0_#000]">
                                <div className="w-14 h-14 bg-[#FF3300] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0_#000]">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-widest leading-none">Topup Point</h1>
                                    <p className="text-[13px] font-bold text-black/60 uppercase mt-1">
                                        Tambah poin secara instan untuk belanja
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Info Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="mb-8 p-5 bg-[#00FFFF] border-[4px] border-black shadow-[6px_6px_0_#000]"
                        >
                            <p className="text-[16px] font-black text-black uppercase underline decoration-4 underline-offset-4 mb-3">Cara Kerja Topup</p>
                            <ol className="text-[14px] font-bold text-black/80 space-y-2 list-decimal list-inside marker:font-black">
                                <li>Pilih nominal poin yang ingin kamu beli</li>
                                <li>Lakukan transfer via QRIS sesuai nominal yang tertera</li>
                                <li>Admin akan memverifikasi pembayaran secara manual</li>
                                <li>Poin akan ditambahkan dalam <span className="bg-[#FFFF00] border-[2px] border-black px-1">1×24 jam</span> setelah konfirmasi</li>
                            </ol>
                        </motion.div>

                        {/* Nominal Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-8"
                        >
                            <p className="text-[16px] font-black tracking-widest text-black uppercase mb-4 px-2 bg-[#FFFF00] border-[3px] border-black inline-block shadow-[2px_2px_0_#000]">Pilih Nominal</p>
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
                                            className={`relative flex flex-col text-left p-4 border-[3px] border-black transition-all duration-200 shadow-[4px_4px_0_#000] ${
                                                isSelected 
                                                ? "bg-[#FFFF00] translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0_#000]" 
                                                : "bg-white hover:bg-neutral-100"
                                            }`}
                                        >
                                            {opt.popular && (
                                                <span
                                                    className="absolute -top-3 left-3 text-[10px] font-black px-2 py-1 uppercase bg-[#FF00FF] text-white border-[2px] border-black shadow-[2px_2px_0_#000]"
                                                >
                                                    Terlaris
                                                </span>
                                            )}
                                            <span className="text-[12px] font-black tracking-widest text-black/60 uppercase mb-2">{opt.label}</span>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Star className="w-5 h-5 text-black fill-black shrink-0" />
                                                <span className="text-xl font-black text-black">{formatPoints(opt.amount)}</span>
                                                <span className="text-[10px] font-black uppercase text-black/50 self-end pb-0.5">pts</span>
                                            </div>
                                            <p className="text-[14px] font-black text-[#FF3300] bg-white border-[2px] border-black px-2 py-0.5 w-max mt-2">
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
                            transition={{ duration: 0.5, delay: 0.35 }}
                        >
                            <AnimatePresence>
                                {selected && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="mb-6 bg-white border-[4px] border-black p-5 shadow-[6px_6px_0_#000] overflow-hidden"
                                    >
                                        {(() => {
                                            const opt = TOPUP_OPTIONS.find(o => o.amount === selected)!
                                            return (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-[#00FFFF] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                                                            <Coins className="w-5 h-5 text-black" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[16px] font-black text-black">{opt.amount.toLocaleString("id-ID")} POIN</p>
                                                            <p className="text-[11px] font-bold text-black/60 uppercase">Ditambahkan</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[18px] font-black text-black">{formatRupiah(opt.price)}</p>
                                                        <p className="text-[11px] font-bold text-black/60 uppercase">Ditransfer</p>
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
                                className={`w-full py-4 border-[4px] border-black font-black text-[16px] uppercase flex items-center justify-center gap-2 transition-all duration-200 shadow-[4px_4px_0_#000] ${
                                    selected && !submitting
                                    ? "bg-[#00FF00] text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#FFFF00]"
                                    : "bg-neutral-300 text-neutral-500 shadow-none cursor-not-allowed"
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

                    {/* ── RIGHT: History Panel ── */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col h-fit"
                        >
                            {/* Header Panel */}
                            <div className="p-5 border-b-[4px] border-black flex items-center justify-between bg-[#FFFF00]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                                        <History className="w-5 h-5 text-black" />
                                    </div>
                                    <p className="text-[16px] font-black text-black uppercase tracking-wider">Riwayat</p>
                                    {historyTotal > 0 && (
                                        <span className="text-[12px] font-black px-2 py-0.5 bg-[#FF00FF] text-white border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            {historyTotal}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => fetchHistory(1, false)}
                                    className="w-10 h-10 bg-white border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center hover:bg-[#00FFFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-4 h-4 text-black ${historyLoading ? "animate-spin" : ""}`} />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="p-4 border-b-[4px] border-black bg-white">
                                <form onSubmit={handleSearch} className="relative flex">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-black/40" />
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
                                        className="w-full bg-white border-[3px] border-black py-3 pl-10 pr-10 text-[14px] font-bold text-black placeholder:text-black/40 focus:outline-none focus:bg-[#00FFFF]/10 transition-colors shadow-[2px_2px_0_#000]"
                                    />
                                    {searchInput && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchInput("")
                                                setSearchQuery("")
                                            }}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-black hover:text-[#FF3300]"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </form>
                            </div>

                            {/* History List */}
                            <div className="overflow-hidden bg-white">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 text-black animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                        <div className="w-16 h-16 bg-[#E5E5E5] border-[4px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_#000]">
                                            <Coins className="w-8 h-8 text-black" />
                                        </div>
                                        <p className="text-[16px] font-black text-black uppercase mb-1">Belum Ada Riwayat</p>
                                        <p className="text-[12px] font-bold text-black/60 uppercase">Pesanan topup kamu akan muncul di sini</p>
                                    </div>
                                ) : (
                                    <div className="divide-y-[3px] divide-black max-h-[450px] overflow-y-auto custom-scrollbar">
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
                                                        className="p-4 bg-white hover:bg-neutral-50 transition-colors flex flex-col gap-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="bg-[#FFFF00] border-[2px] border-black px-2 py-0.5 shadow-[2px_2px_0_#000] flex items-center gap-1">
                                                                        <Star className="w-3 h-3 text-black fill-black" />
                                                                        <span className="text-[12px] font-black text-black leading-none">
                                                                            {order.amount.toLocaleString("id-ID")}
                                                                        </span>
                                                                    </div>
                                                                    <span
                                                                        className={`text-[9px] font-black px-2 py-1 uppercase border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center gap-1 ${s.bg} ${s.color}`}
                                                                    >
                                                                        <SIcon className="w-3 h-3" />
                                                                        {s.label}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-[14px] font-black text-black">
                                                                        {formatRupiah(order.price)}
                                                                    </span>
                                                                    <span className="w-1 h-1 bg-black rounded-full"></span>
                                                                    <span className="text-[11px] font-bold text-black/60 uppercase">
                                                                        {timeAgo(order.createdAt)}
                                                                    </span>
                                                                </div>

                                                                {order.note && (
                                                                    <p className="text-[12px] font-bold text-black bg-[#E5E5E5] border-[3px] border-black p-2 mt-2 break-words shadow-[2px_2px_0_#000] italic">
                                                                        "{order.note}"
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <Link
                                                                href={`/topup/payment?orderId=${order.id}`}
                                                                className="shrink-0 w-10 h-10 bg-[#FFFF00] border-[3px] border-black flex items-center justify-center hover:bg-[#00FFFF] shadow-[2px_2px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                                                                title="Lihat detail"
                                                            >
                                                                <ExternalLink className="w-5 h-5 text-black" />
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
                                    <div className="p-4 border-t-[4px] border-black bg-neutral-100">
                                        <button
                                            onClick={() => fetchHistory(historyPage + 1, true)}
                                            disabled={loadingMore}
                                            className="w-full py-3 bg-white border-[3px] border-black text-[12px] font-black uppercase shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 transition-all hover:bg-[#FFFF00] disabled:opacity-50 disabled:hover:bg-white"
                                        >
                                            {loadingMore
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</>
                                                : <>Muat Lebih Banyak ({historyTotal - history.length})</>
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Summary Stats */}
                        {historyTotal > 0 && !historyLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 grid grid-cols-3 gap-3"
                            >
                                {[
                                    { label: "Total Order", value: historyTotal, bg: "bg-white", border: "border-black" },
                                    { label: "Selesai", value: history.filter(o => o.status === "COMPLETED").length, bg: "bg-[#00FF00]", border: "border-black" },
                                    { label: "Pending", value: history.filter(o => o.status === "PENDING").length, bg: "bg-[#FFFF00]", border: "border-black" },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className={`p-3 text-center border-[3px] shadow-[4px_4px_0_#000] flex flex-col justify-center ${stat.bg} ${stat.border}`}
                                    >
                                        <p className="text-[20px] font-black text-black leading-none">{stat.value}</p>
                                        <p className="text-[9px] font-black text-black uppercase mt-1 tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
