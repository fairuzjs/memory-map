"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Zap, Star, ChevronRight, Sparkles, ShieldCheck,
    Clock, Loader2, Coins, ArrowLeft, CheckCircle2,
    XCircle, History, ExternalLink, RefreshCw
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
        label: "Menunggu",
        color: "text-amber-400",
        bg: "rgba(251,191,36,0.08)",
        border: "rgba(251,191,36,0.2)",
        icon: Clock,
    },
    COMPLETED: {
        label: "Selesai",
        color: "text-emerald-400",
        bg: "rgba(52,211,153,0.06)",
        border: "rgba(52,211,153,0.2)",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "Dibatalkan",
        color: "text-rose-400",
        bg: "rgba(251,113,133,0.06)",
        border: "rgba(251,113,133,0.15)",
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
            const res = await fetch(`/api/topup?page=${page}&limit=${HISTORY_LIMIT}`)
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
    }, [])

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
                toast.error(data.error || "Gagal membuat pesanan")
                return
            }
            router.push(`/topup/payment?orderId=${data.id}`)
        } catch {
            toast.error("Terjadi kesalahan, coba lagi")
        } finally {
            setSubmitting(false)
        }
    }

    const totalPages = Math.ceil(historyTotal / HISTORY_LIMIT)

    return (
        <div className="min-h-screen w-full" style={{ fontFamily: "Outfit, sans-serif" }}>
            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-indigo-700/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Back */}
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Kembali ke Shop
                </Link>

                {/* 2-column layout on lg+ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* ── LEFT: Topup Form ── */}
                    <div className="lg:col-span-3">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
                                >
                                    <Zap className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Topup Point</h1>
                                    <p className="text-sm text-neutral-500 mt-0.5">Tambah poin secara instan untuk belanja di Memory Shop</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Info Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="mb-8 rounded-2xl p-4 flex items-start gap-3"
                            style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}
                        >
                            <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-300">Cara Kerja Topup</p>
                                <ol className="text-xs text-neutral-400 mt-1.5 space-y-1 list-decimal list-inside">
                                    <li>Pilih nominal poin yang ingin kamu beli</li>
                                    <li>Lakukan transfer via QRIS sesuai nominal yang tertera</li>
                                    <li>Admin akan memverifikasi pembayaran secara manual</li>
                                    <li>Poin akan ditambahkan dalam 1×24 jam setelah konfirmasi</li>
                                </ol>
                            </div>
                        </motion.div>

                        {/* Nominal Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-8"
                        >
                            <p className="text-xs font-bold tracking-widest text-neutral-600 uppercase mb-4">Pilih Nominal</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TOPUP_OPTIONS.map((opt, i) => {
                                    const isSelected = selected === opt.amount
                                    return (
                                        <motion.button
                                            key={opt.amount}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + i * 0.04, duration: 0.4 }}
                                            onClick={() => setSelected(opt.amount)}
                                            className="relative flex flex-col text-left p-4 rounded-2xl transition-all duration-200"
                                            style={{
                                                background: isSelected
                                                    ? "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))"
                                                    : "rgba(255,255,255,0.03)",
                                                border: isSelected
                                                    ? "1px solid rgba(251,191,36,0.45)"
                                                    : "1px solid rgba(255,255,255,0.07)",
                                                boxShadow: isSelected ? "0 0 20px rgba(251,191,36,0.08)" : "none",
                                            }}
                                        >
                                            {opt.popular && (
                                                <span
                                                    className="absolute -top-2.5 left-3 text-[10px] font-black px-2 py-0.5 rounded-full"
                                                    style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#1a1000" }}
                                                >
                                                    TERLARIS
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase mb-2">{opt.label}</span>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                                                <span className="text-xl font-black text-white">{formatPoints(opt.amount)}</span>
                                                <span className="text-xs text-neutral-500 self-end pb-0.5">poin</span>
                                            </div>
                                            <p className="text-sm font-bold text-amber-400">{formatRupiah(opt.price)}</p>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                                    style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.5)" }}
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                </motion.div>
                                            )}
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
                                        className="mb-4 rounded-2xl p-4"
                                        style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)" }}
                                    >
                                        {(() => {
                                            const opt = TOPUP_OPTIONS.find(o => o.amount === selected)!
                                            return (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Coins className="w-5 h-5 text-amber-400" />
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{opt.amount.toLocaleString("id-ID")} Poin</p>
                                                            <p className="text-xs text-neutral-500">yang akan ditambahkan</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-base font-black text-amber-400">{formatRupiah(opt.price)}</p>
                                                        <p className="text-[10px] text-neutral-600">yang harus ditransfer</p>
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
                                className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: selected ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : "rgba(255,255,255,0.05)",
                                    color: selected ? "#1a1000" : "#6b7280",
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    style={{ background: selected ? "linear-gradient(135deg, #fbbf24, #fcd34d)" : "transparent" }}
                                />
                                <span className="relative flex items-center gap-2">
                                    {submitting
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                                        : <><Sparkles className="w-4 h-4" /> {selected ? "Lanjut ke Pembayaran" : "Pilih nominal terlebih dahulu"}</>
                                    }
                                    {!submitting && selected && (
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    )}
                                </span>
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Diproses manual oleh admin dalam 1×24 jam</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── RIGHT: History Panel ── */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-neutral-500" />
                                    <p className="text-sm font-bold text-neutral-300">Riwayat Topup</p>
                                    {historyTotal > 0 && (
                                        <span
                                            className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                                            style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}
                                        >
                                            {historyTotal}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => fetchHistory(1, false)}
                                    className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.05] transition-all"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
                                </button>
                            </div>

                            {/* History List */}
                            <div
                                className="rounded-2xl overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-6 h-6 text-amber-400/50 animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                            style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}
                                        >
                                            <Coins className="w-6 h-6 text-amber-400/40" />
                                        </div>
                                        <p className="text-sm font-semibold text-neutral-500">Belum ada riwayat topup</p>
                                        <p className="text-xs text-neutral-700 mt-1">Pesanan topup kamu akan muncul di sini</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto pr-1">
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
                                                        className="p-4 hover:bg-white/[0.02] transition-colors"
                                                        style={{ borderColor: "rgba(255,255,255,0.05)" }}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                {/* Amount + Status row */}
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <div className="flex items-center gap-1">
                                                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                                        <span className="text-sm font-black text-white">
                                                                            {order.amount.toLocaleString("id-ID")} poin
                                                                        </span>
                                                                    </div>
                                                                    <span
                                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                                                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                                                                    >
                                                                        <SIcon className="w-2.5 h-2.5" />
                                                                        {s.label}
                                                                    </span>
                                                                </div>
                                                                {/* Price + Time */}
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-amber-400/70 font-semibold">
                                                                        {formatRupiah(order.price)}
                                                                    </span>
                                                                    <span className="text-neutral-700 text-[10px]">·</span>
                                                                    <span className="text-xs text-neutral-600">
                                                                        {timeAgo(order.createdAt)}
                                                                    </span>
                                                                </div>
                                                                {/* Note if any */}
                                                                {order.note && (
                                                                    <p className="text-[11px] text-neutral-600 mt-1 italic truncate">
                                                                        {order.note}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Detail Link */}
                                                            <Link
                                                                href={`/topup/payment?orderId=${order.id}`}
                                                                className="shrink-0 p-2 rounded-xl text-neutral-600 hover:text-neutral-200 hover:bg-white/[0.06] transition-all"
                                                                title="Lihat detail"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
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
                                    <div
                                        className="px-4 py-3 border-t"
                                        style={{ borderColor: "rgba(255,255,255,0.06)" }}
                                    >
                                        <button
                                            onClick={() => fetchHistory(historyPage + 1, true)}
                                            disabled={loadingMore}
                                            className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.07)",
                                                color: "#6b7280",
                                            }}
                                        >
                                            {loadingMore
                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat...</>
                                                : <>Muat lebih banyak <span className="text-neutral-700">({historyTotal - history.length} lagi)</span></>
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Summary Stats */}
                            {historyTotal > 0 && !historyLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-4 grid grid-cols-3 gap-2"
                                >
                                    {[
                                        {
                                            label: "Total Order",
                                            value: historyTotal,
                                            color: "text-white",
                                        },
                                        {
                                            label: "Selesai",
                                            value: historyTotal > 0 ? history.filter(o => o.status === "COMPLETED").length : 0,
                                            color: "text-emerald-400",
                                        },
                                        {
                                            label: "Pending",
                                            value: history.filter(o => o.status === "PENDING").length,
                                            color: "text-amber-400",
                                        },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-xl p-3 text-center"
                                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                        >
                                            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                                            <p className="text-[10px] text-neutral-600 mt-0.5">{stat.label}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    )
}
