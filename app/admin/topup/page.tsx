"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Coins, Clock, CheckCircle2, XCircle,
    User, RefreshCw, Filter, Search,
    Eye, Check, X, ImageIcon, AlertCircle
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"
import { captureError, captureAPIError, captureInteraction, capturePerformance } from "@/lib/monitoring"

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
    PENDING: { label: "Menunggu", color: "text-black", bg: "bg-yellow-300", border: "border-black", icon: Clock },
    COMPLETED: { label: "Selesai", color: "text-white", bg: "bg-black", border: "border-black", icon: CheckCircle2 },
    CANCELLED: { label: "Dibatalkan", color: "text-black", bg: "bg-rose-400", border: "border-black", icon: XCircle },
}

export default function AdminTopupPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [orders, setOrders] = useState<Order[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("")
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [noteInput, setNoteInput] = useState("")
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null)
    const [fetchError, setFetchError] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        }
    }, [status, session, router])

    const fetchOrders = useCallback(async (q = "", p = 1, f = "", signal?: AbortSignal) => {
        setLoading(true)
        setFetchError(false)
        const startTime = performance.now()
        try {
            const params = new URLSearchParams({ page: String(p), limit: "15" })
            if (f) params.set("status", f)
            if (q) params.set("search", q)
            
            const res = await fetch(`/api/topup?${params}`, { signal })
            if (!res.ok) {
                captureAPIError("/api/topup", res.status, res.statusText, { q, p, f })
                setFetchError(true)
                toast.error("Gagal memuat pesanan topup")
                return
            }
            const data = await res.json()
            setOrders(data.orders ?? [])
            setTotal(data.total ?? 0)
            
            const latency = performance.now() - startTime
            if (latency > 1000) {
                capturePerformance("admin_topups_fetch_slow", latency, { q, p, f })
            }
        } catch (err: any) {
            if (err.name === "AbortError") return
            captureError(err, { context: "fetchOrders", q, p, f })
            setFetchError(true)
            toast.error("Gagal memuat pesanan topup")
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [])

    // Combined AbortController search effect
    useEffect(() => {
        if (status !== "authenticated" || session?.user?.role !== "ADMIN") return

        const controller = new AbortController()

        const runFetch = () => {
            fetchOrders(search, page, filter, controller.signal)
        }

        let debounceTimer: NodeJS.Timeout
        if (search) {
            debounceTimer = setTimeout(runFetch, 400)
        } else {
            runFetch()
        }

        return () => {
            controller.abort()
            if (debounceTimer) clearTimeout(debounceTimer)
        }
    }, [status, session, search, page, filter, fetchOrders])

    const handleSearchChange = (val: string) => {
        setSearch(val)
        setPage(1)
    }

    const handleAction = async (orderId: string, action: "COMPLETED" | "CANCELLED") => {
        captureInteraction("admin_topup_order_process_start", { orderId, action })
        setProcessing(orderId)

        const originalOrders = [...orders]
        
        // Optimistic UI updates
        if (filter === "PENDING") {
            setOrders(prev => prev.filter(o => o.id !== orderId))
        } else {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: action } : o))
        }

        toast.success(action === "COMPLETED" ? "Menyetujui pesanan..." : "Menolak pesanan...", { id: `topup-${orderId}` })

        try {
            const res = await fetch(`/api/topup/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action, note: noteInput.trim() || null }),
            })
            const data = await res.json()
            if (!res.ok) {
                captureAPIError(`/api/topup/${orderId}`, res.status, res.statusText, { action })
                throw new Error(data.error || "Gagal memproses")
            }
            toast.success(action === "COMPLETED"
                ? `✅ Pesanan ${data.user?.name || "User"} ditandai selesai.`
                : "❌ Order dibatalkan",
                { id: `topup-${orderId}` }
            )
            setSelectedOrder(null)
            setNoteInput("")
            fetchOrders(search, page, filter)
            captureInteraction("admin_topup_order_process_success", { orderId, action })
        } catch (err: any) {
            setOrders(originalOrders)
            captureError(err, { context: "handleAction_rollback", orderId, action })
            captureInteraction("admin_rollback_event", { action: "admin_topup_order_process", targetId: orderId, error: err.message })
            toast.error(err.message || "Gagal memproses transaksi. Dikembalikan ke awal.", { id: `topup-${orderId}` })
        } finally {
            setProcessing(null)
        }
    }

    const totalPages = Math.ceil(total / 15)

    // Neubrutalist Skeletons
    const TopupCardSkeleton = () => (
        <div className="rounded-2xl p-4 flex items-center gap-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
                <div className="flex gap-2 items-center">
                    <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-1/3" />
                    <div className="h-3.5 bg-neutral-200 rounded border border-neutral-300 w-16" />
                </div>
                <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-1/2" />
                <div className="flex gap-2 mt-1.5 flex-wrap">
                    <div className="h-5 bg-neutral-200 rounded border border-neutral-300 w-20" />
                    <div className="h-5 bg-neutral-200 rounded border border-neutral-300 w-24" />
                </div>
            </div>
            <div className="flex gap-2 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-neutral-200 border-[2px] border-black" />
                <div className="w-20 h-9 rounded-xl bg-neutral-200 border-[2px] border-black" />
                <div className="w-16 h-9 rounded-xl bg-neutral-200 border-[2px] border-black" />
            </div>
        </div>
    )

    return (
        <div className="space-y-6 pb-10 font-[Outfit]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <Coins className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-black uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight uppercase">Pesanan Topup</h1>
                    <p className="text-black font-bold text-sm mt-1">
                        {total} pesanan ditemukan
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/topup/process"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase text-black bg-cyan-300 border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000] transition-all tracking-wide"
                    >
                        <Coins className="w-4 h-4" />
                        Proses Topup
                    </Link>
                    <button
                        onClick={() => fetchOrders(search, page, filter)}
                        className="p-2.5 rounded-xl text-black bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:bg-yellow-300 hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000] transition-all"
                    >
                        <RefreshCw className="w-4 h-4 font-black" />
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black font-black" />
                <input
                    type="text"
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="CARI NAMA USER, EMAIL ATAU ORDER ID..."
                    className="w-full bg-white border-[3px] border-black rounded-2xl pl-12 pr-4 py-3.5 text-sm font-black text-black placeholder-neutral-500 focus:outline-none transition-all shadow-[4px_4px_0_#000] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0_#000]"
                />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-5 h-5 text-black shrink-0 mr-1" />
                {STATUS_FILTER_OPTS.map(opt => {
                    const isActive = filter === opt.value
                    return (
                        <button
                            key={opt.value}
                            onClick={() => { setFilter(opt.value); setPage(1) }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide shrink-0 transition-all border-[2px] border-black ${
                                isActive
                                    ? "bg-yellow-300 text-black shadow-[3px_3px_0_#000] translate-x-[1px] translate-y-[1px]"
                                    : "bg-white text-black hover:bg-neutral-100 hover:shadow-[3px_3px_0_#000] active:translate-y-[1px]"
                            }`}
                        >
                            {opt.label}
                        </button>
                    )
                })}
            </div>

            {/* Error Retry State */}
            {fetchError && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0_#000] space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-black flex items-center justify-center text-rose-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-base font-black text-black uppercase">Koneksi Bermasalah</p>
                        <p className="text-xs font-bold text-neutral-600 mt-1">Gagal mengambil data transaksi topup</p>
                    </div>
                    <button
                        onClick={() => fetchOrders(search, page, filter)}
                        className="px-4 py-2 bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading && (
                        <>
                            <TopupCardSkeleton />
                            <TopupCardSkeleton />
                            <TopupCardSkeleton />
                        </>
                    )}
                    
                    {orders.length === 0 && !loading && !fetchError && (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border-[3px] border-black rounded-2xl shadow-[8px_8px_0_#000]">
                            <div className="w-16 h-16 bg-yellow-300 border-[3px] border-black rounded-2xl shadow-[4px_4px_0_#000] flex items-center justify-center mb-4 rotate-3">
                                <Coins className="w-8 h-8 text-black" />
                            </div>
                            <p className="text-xl font-black text-black uppercase tracking-wide">Belum ada pesanan</p>
                        </div>
                    )}

                    {!loading && orders.map((order, i) => {
                        const s = STATUS_STYLE[order.status]
                        const SIcon = s.icon
                        const isOrderProcessing = processing === order.id
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.03 }}
                                className={`rounded-2xl p-4 flex items-center gap-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-[1px] transition-all ${isOrderProcessing ? "opacity-60" : ""}`}
                            >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-xl bg-cyan-100 overflow-hidden border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 flex items-center justify-center relative">
                                    {order.user.image ? (
                                        <Image src={order.user.image} alt={order.user.name} width={48} height={48} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-black" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <p className="text-base font-black text-black uppercase truncate">{order.user.name}</p>
                                        <span
                                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 border-[2px] ${s.bg} ${s.color} ${s.border}`}
                                        >
                                            <SIcon className="w-3 h-3" />
                                            {s.label}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-neutral-600 truncate">{order.user.email}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="text-[11px] bg-yellow-300 text-black px-2 py-0.5 rounded-lg border-[2px] border-black font-black uppercase shadow-[2px_2px_0_#000]">
                                            +{order.amount.toLocaleString("id-ID")} poin
                                        </span>
                                        <span className="text-xs font-bold text-neutral-600">·</span>
                                        <span className="text-[11px] font-black text-black bg-cyan-100 px-2 py-0.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000] uppercase">{formatRupiah(order.price)}</span>
                                        <span className="text-xs font-bold text-neutral-600">·</span>
                                        <span className="text-xs font-bold text-neutral-600">
                                            {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        {/* Proof badge */}
                                        {order.proofImage && (
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 bg-fuchsia-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000]">
                                                <ImageIcon className="w-3 h-3" />
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
                                            className="p-2.5 rounded-xl bg-cyan-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all"
                                            title="Lihat detail & proses"
                                        >
                                            <Eye className="w-4 h-4 font-black" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(order.id, "COMPLETED")}
                                            disabled={isOrderProcessing}
                                            className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide bg-green-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all disabled:opacity-50"
                                        >
                                            {isOrderProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 inline mr-1 font-black" />Approve</>}
                                        </button>
                                        <button
                                            onClick={() => handleAction(order.id, "CANCELLED")}
                                            disabled={isOrderProcessing}
                                            className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide bg-rose-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4 inline mr-1 font-black" />Tolak
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-[1px_1px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        ← Sebelumnya
                    </button>
                    <span className="text-sm font-black text-black bg-yellow-300 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0_#000]">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-[1px_1px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-all"
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm rounded-2xl overflow-hidden bg-[#FFFDF0] border-[3px] border-black shadow-[8px_8px_0_#000] font-[Outfit]"
                        >
                            <div className="px-5 py-4 border-b-[3px] border-black bg-cyan-300 flex justify-between items-center">
                                <div>
                                    <h2 className="font-black text-black text-lg uppercase">Detail Pesanan</h2>
                                    <p className="text-xs font-bold text-neutral-800 mt-0.5 uppercase">{selectedOrder.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-1 rounded-lg border-[2px] border-transparent hover:border-black hover:bg-rose-400 transition-colors text-black"
                                >
                                    <X className="w-5 h-5 font-black" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center relative">
                                        {selectedOrder.user.image ? (
                                            <Image src={selectedOrder.user.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-black" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-black uppercase">{selectedOrder.user.name}</p>
                                        <p className="text-xs font-bold text-neutral-600">{selectedOrder.user.email}</p>
                                        <p className="text-xs font-black bg-yellow-300 border-[2px] border-black px-2 py-0.5 rounded-lg inline-block mt-1 shadow-[2px_2px_0_#000]">Poin Saat Ini: {selectedOrder.user.points.toLocaleString("id-ID")}</p>
                                    </div>
                                </div>

                                <div className="rounded-xl p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000]">
                                    <div className="flex justify-between mb-2 pb-2 border-b-[2px] border-dashed border-neutral-300">
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Nominal Topup</span>
                                        <span className="text-sm font-black text-black bg-yellow-300 px-2 py-0.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000]">+{selectedOrder.amount.toLocaleString("id-ID")} poin</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Total Bayar</span>
                                        <span className="text-lg font-black text-black">{formatRupiah(selectedOrder.price)}</span>
                                    </div>
                                </div>

                                {/* Bukti Transfer */}
                                {selectedOrder.proofImage ? (
                                    <div>
                                        <p className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4" /> Bukti Transfer
                                        </p>
                                        <button
                                            onClick={() => setProofModalUrl(selectedOrder.proofImage)}
                                            className="w-full rounded-xl overflow-hidden relative group border-[3px] border-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-all h-40 bg-white"
                                        >
                                            <Image
                                                src={selectedOrder.proofImage}
                                                alt="Bukti transfer"
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
                                                <span className="text-xs font-black text-black bg-yellow-300 px-3 py-1.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000] uppercase tracking-wider">Perbesar</span>
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] text-center"
                                    >
                                        <ImageIcon className="w-8 h-8 text-neutral-400 shrink-0" />
                                        <p className="text-sm font-bold text-neutral-500">Bukti transfer belum diunggah</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-black text-black uppercase tracking-wider block mb-1.5">Catatan (opsional)</label>
                                    <input
                                        value={noteInput}
                                        onChange={e => setNoteInput(e.target.value)}
                                        placeholder="Misal: Sudah transfer pukul 10.30"
                                        className="w-full px-4 py-3 rounded-xl text-sm font-bold text-black placeholder-neutral-500 focus:outline-none transition-all bg-white border-[3px] border-black shadow-[4px_4px_0_#000] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#000]"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => handleAction(selectedOrder.id, "CANCELLED")}
                                        disabled={!!processing}
                                        className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all bg-rose-400 text-black border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000] active:translate-y-[2px] disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4 inline mr-1 font-black" />Tolak
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedOrder.id, "COMPLETED")}
                                        disabled={!!processing}
                                        className="flex-[1.5] py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all bg-green-300 text-black border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000] active:translate-y-[2px] disabled:opacity-50"
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <><Check className="w-4 h-4 inline mr-1 font-black" />Approve & Topup</>}
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
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setProofModalUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-2xl w-full"
                        >
                            <button
                                onClick={() => setProofModalUrl(null)}
                                className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-rose-400 border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000] transition-all"
                            >
                                <X className="w-5 h-5 text-black font-black" />
                            </button>
                            <div className="bg-white p-2 rounded-2xl border-[4px] border-black shadow-[12px_12px_0_#000] rotate-1 relative w-full h-[500px]">
                                <Image
                                    src={proofModalUrl}
                                    alt="Bukti transfer"
                                    fill
                                    className="rounded-xl border-[2px] border-black object-contain"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
