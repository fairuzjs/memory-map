"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Coins, Clock, CheckCircle2, XCircle,
    User, RefreshCw, Filter,
    Eye, Check, X, ImageIcon
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

type OrderUser = {
    id: string
    name: string
    email: string
    image: string | null
    points: number
}

type Order = {
    id: string
    amount: number
    price: number
    status: "PENDING" | "COMPLETED" | "CANCELLED"
    note: string | null
    proofImage: string | null
    createdAt: string
    user: OrderUser
}

function formatRupiah(n: number) {
    return "Rp " + n.toLocaleString("id-ID")
}

const STATUS_FILTER_OPTS = [
    { value: "", label: "Semua" },
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "CANCELLED", label: "Dibatalkan" },
]

const STATUS_STYLE = {
    PENDING: { label: "Menunggu", color: "text-amber-400", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", icon: Clock },
    COMPLETED: { label: "Selesai", color: "text-emerald-400", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)", icon: CheckCircle2 },
    CANCELLED: { label: "Dibatalkan", color: "text-rose-400", bg: "rgba(251,113,133,0.08)", border: "rgba(251,113,133,0.2)", icon: XCircle },
}

export default function AdminTopupPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [orders, setOrders] = useState<Order[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("")
    const [page, setPage] = useState(1)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [noteInput, setNoteInput] = useState("")
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        }
    }, [status, session, router])

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), limit: "15" })
            if (filter) params.set("status", filter)
            const res = await fetch(`/api/topup?${params}`)
            const data = await res.json()
            setOrders(data.orders ?? [])
            setTotal(data.total ?? 0)
        } finally {
            setLoading(false)
        }
    }, [page, filter])

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            fetchOrders()
        }
    }, [fetchOrders, status, session])

    const handleAction = async (orderId: string, action: "COMPLETED" | "CANCELLED") => {
        setProcessing(orderId)
        try {
            const res = await fetch(`/api/topup/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action, note: noteInput.trim() || null }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal memproses")
                return
            }
            toast.success(action === "COMPLETED"
                ? `✅ Pesanan ${data.user?.name} ditandai selesai. Tambahkan poin via halaman Proses Topup.`
                : "Order dibatalkan"
            )
            setSelectedOrder(null)
            setNoteInput("")
            fetchOrders()
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setProcessing(null)
        }
    }

    const totalPages = Math.ceil(total / 15)

    if (status === "loading" || (status === "authenticated" && loading)) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6" style={{ fontFamily: "Outfit, sans-serif" }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                            <Coins className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold tracking-widest text-neutral-600 uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Pesanan Topup</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        {total} pesanan ditemukan
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/topup/process"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#1a1000" }}
                    >
                        <Coins className="w-4 h-4" />
                        Proses Topup
                    </Link>
                    <button
                        onClick={fetchOrders}
                        className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-neutral-600 shrink-0" />
                {STATUS_FILTER_OPTS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => { setFilter(opt.value); setPage(1) }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all"
                        style={{
                            background: filter === opt.value ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
                            border: filter === opt.value ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.07)",
                            color: filter === opt.value ? "#fbbf24" : "#6b7280",
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Coins className="w-10 h-10 text-neutral-700 mb-3" />
                            <p className="text-neutral-500 text-sm">Belum ada pesanan</p>
                        </div>
                    ) : (
                        orders.map((order, i) => {
                            const s = STATUS_STYLE[order.status]
                            const SIcon = s.icon
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="rounded-2xl p-4 flex items-center gap-4"
                                    style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-white/[0.08] shrink-0 flex items-center justify-center">
                                        {order.user.image ? (
                                            <img src={order.user.image} alt={order.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-neutral-500" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-white truncate">{order.user.name}</p>
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                                            >
                                                <SIcon className="w-2.5 h-2.5" />
                                                {s.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 truncate">{order.user.email}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-amber-400 font-bold">
                                                +{order.amount.toLocaleString("id-ID")} poin
                                            </span>
                                            <span className="text-xs text-neutral-600">·</span>
                                            <span className="text-xs text-neutral-500">{formatRupiah(order.price)}</span>
                                            <span className="text-xs text-neutral-600">·</span>
                                            <span className="text-xs text-neutral-600">
                                                {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            {/* Proof badge */}
                                            {order.proofImage && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                                    style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                                                >
                                                    <ImageIcon className="w-2.5 h-2.5" />
                                                    Bukti
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {order.status === "PENDING" && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => { setSelectedOrder(order); setNoteInput("") }}
                                                className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                                                title="Lihat detail & proses"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAction(order.id, "COMPLETED")}
                                                disabled={processing === order.id}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                                style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}
                                            >
                                                {processing === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 inline mr-1" />Approve</>}
                                            </button>
                                            <button
                                                onClick={() => handleAction(order.id, "CANCELLED")}
                                                disabled={processing === order.id}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                                style={{ background: "rgba(251,113,133,0.08)", color: "#fb7185", border: "1px solid rgba(251,113,133,0.2)" }}
                                            >
                                                <X className="w-3.5 h-3.5 inline mr-1" />Tolak
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-30 transition-all hover:bg-white/[0.06] text-neutral-400"
                    >
                        ← Sebelumnya
                    </button>
                    <span className="text-xs text-neutral-500">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-30 transition-all hover:bg-white/[0.06] text-neutral-400"
                    >
                        Berikutnya →
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", bounce: 0.3 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm rounded-2xl overflow-hidden"
                            style={{
                                background: "#0d0d12",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                                <h2 className="font-bold text-white">Detail Pesanan</h2>
                                <p className="text-xs text-neutral-500 mt-0.5 font-mono">{selectedOrder.id}</p>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-white/[0.08] flex items-center justify-center">
                                        {selectedOrder.user.image
                                            ? <img src={selectedOrder.user.image} alt="" className="w-full h-full object-cover" />
                                            : <User className="w-5 h-5 text-neutral-500" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedOrder.user.name}</p>
                                        <p className="text-xs text-neutral-500">{selectedOrder.user.email}</p>
                                        <p className="text-xs text-amber-400 mt-0.5">Saat ini: {selectedOrder.user.points.toLocaleString("id-ID")} poin</p>
                                    </div>
                                </div>

                                <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)" }}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-neutral-500">Nominal</span>
                                        <span className="text-xs font-bold text-amber-400">+{selectedOrder.amount.toLocaleString("id-ID")} poin</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">Harga</span>
                                        <span className="text-xs font-bold text-white">{formatRupiah(selectedOrder.price)}</span>
                                    </div>
                                </div>

                                {/* Bukti Transfer */}
                                {selectedOrder.proofImage ? (
                                    <div>
                                        <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1.5">
                                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                                            Bukti Transfer
                                        </p>
                                        <button
                                            onClick={() => setProofModalUrl(selectedOrder.proofImage)}
                                            className="w-full rounded-xl overflow-hidden relative group"
                                            style={{ border: "1px solid rgba(99,102,241,0.2)" }}
                                        >
                                            <img
                                                src={selectedOrder.proofImage}
                                                alt="Bukti transfer"
                                                className="w-full max-h-40 object-contain"
                                                style={{ background: "#0d0d14" }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">Perbesar</span>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="rounded-xl p-3 flex items-center gap-2"
                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
                                    >
                                        <ImageIcon className="w-4 h-4 text-neutral-600 shrink-0" />
                                        <p className="text-xs text-neutral-600">Bukti transfer belum diunggah oleh user</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-neutral-500 block mb-1.5">Catatan (opsional)</label>
                                    <input
                                        value={noteInput}
                                        onChange={e => setNoteInput(e.target.value)}
                                        placeholder="Misal: Sudah transfer pukul 10.30"
                                        className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-neutral-600 outline-none transition-all"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    />
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleAction(selectedOrder.id, "CANCELLED")}
                                        disabled={!!processing}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                        style={{ background: "rgba(251,113,133,0.08)", color: "#fb7185", border: "1px solid rgba(251,113,133,0.2)" }}
                                    >
                                        <X className="w-3.5 h-3.5 inline mr-1" />Tolak
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedOrder.id, "COMPLETED")}
                                        disabled={!!processing}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                        style={{ background: "linear-gradient(135deg,#34d399,#10b981)", color: "#064e3b" }}
                                    >
                                        {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : <><Check className="w-3.5 h-3.5 inline mr-1" />Approve & Tambah Poin</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Proof Fullscreen Modal */}
            <AnimatePresence>
                {proofModalUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setProofModalUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-lg w-full"
                        >
                            <button
                                onClick={() => setProofModalUrl(null)}
                                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                            <p className="text-xs text-neutral-500 text-center mb-3">Bukti Transfer</p>
                            <img
                                src={proofModalUrl}
                                alt="Bukti transfer"
                                className="w-full h-auto rounded-2xl"
                                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
