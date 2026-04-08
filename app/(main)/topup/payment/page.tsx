"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle2, Clock, XCircle, Copy, ArrowLeft,
    Loader2, Star, Smartphone, RefreshCw, ShieldAlert,
    Trash2, AlertTriangle, Upload, ImageIcon, X, Eye
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

type Order = {
    id: string
    amount: number
    price: number
    status: "PENDING" | "COMPLETED" | "CANCELLED"
    note: string | null
    proofImage: string | null
    createdAt: string
}

function formatRupiah(n: number) {
    return "Rp " + n.toLocaleString("id-ID")
}

const STATUS_CONFIG = {
    PENDING: {
        icon: Clock,
        label: "Menunggu Verifikasi",
        description: "Pembayaran sedang menunggu konfirmasi admin",
        color: "text-amber-400",
        bg: "rgba(251,191,36,0.08)",
        border: "rgba(251,191,36,0.2)",
    },
    COMPLETED: {
        icon: CheckCircle2,
        label: "Poin Sudah Ditambahkan!",
        description: "Topup berhasil. Poin telah ditambahkan ke akun kamu.",
        color: "text-emerald-400",
        bg: "rgba(52,211,153,0.08)",
        border: "rgba(52,211,153,0.2)",
    },
    CANCELLED: {
        icon: XCircle,
        label: "Dibatalkan",
        description: "Order ini telah dibatalkan.",
        color: "text-rose-400",
        bg: "rgba(251,113,133,0.08)",
        border: "rgba(251,113,133,0.2)",
    },
}

export default function TopupPaymentPage() {
    const { status: authStatus } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get("orderId")

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)

    // Proof upload states
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [showProofModal, setShowProofModal] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchOrder = async (showLoader = false) => {
        if (showLoader) setRefreshing(true)
        try {
            const res = await fetch(`/api/topup/${orderId}`)
            if (!res.ok) { router.push("/topup"); return }
            const data = await res.json()
            setOrder(data)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        if (authStatus === "unauthenticated") { router.push("/login"); return }
        if (!orderId) { router.push("/topup"); return }
        if (authStatus === "authenticated") fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authStatus, orderId])

    const copyOrderId = () => {
        navigator.clipboard.writeText(orderId ?? "")
        toast.success("ID Order disalin!")
    }

    const handleCancel = async () => {
        if (!order) return
        setCancelling(true)
        try {
            const res = await fetch(`/api/topup/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "CANCELLED" }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error || "Gagal membatalkan pesanan"); return }
            setOrder(data)
            setShowCancelModal(false)
            toast.success("Pesanan berhasil dibatalkan")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setCancelling(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) {
            toast.error("Format tidak didukung. Gunakan JPG, PNG, atau WebP.")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB")
            return
        }

        setProofFile(file)
        const url = URL.createObjectURL(file)
        setProofPreview(url)
    }

    const handleUploadProof = async () => {
        if (!proofFile || !order) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("proof", proofFile)

            const res = await fetch(`/api/topup/${order.id}/proof`, {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal mengunggah bukti")
                return
            }

            setOrder(prev => prev ? { ...prev, proofImage: data.proofImage } : null)
            setProofFile(null)
            setProofPreview(null)
            toast.success("Bukti transfer berhasil dikirim!")
        } catch {
            toast.error("Terjadi kesalahan saat upload")
        } finally {
            setUploading(false)
        }
    }

    const removeSelectedFile = () => {
        setProofFile(null)
        setProofPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
        )
    }

    if (!order) return null

    const statusCfg = STATUS_CONFIG[order.status]
    const StatusIcon = statusCfg.icon
    const hasProof = !!order.proofImage

    return (
        <div className="min-h-screen w-full" style={{ fontFamily: "Outfit, sans-serif" }}>
            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Back */}
                <Link
                    href="/topup"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Topup lagi / Riwayat
                </Link>

                {/* Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                >
                    <StatusIcon className={`w-5 h-5 shrink-0 ${statusCfg.color}`} />
                    <div className="flex-1">
                        <p className={`text-sm font-bold ${statusCfg.color}`}>{statusCfg.label}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{statusCfg.description}</p>
                        {order.note && (
                            <p className="text-xs text-neutral-500 mt-1 italic">Catatan: {order.note}</p>
                        )}
                    </div>
                    {order.status === "PENDING" && (
                        <button
                            onClick={() => fetchOrder(true)}
                            className="shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors"
                            title="Refresh status"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </motion.div>

                {/* Order Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl overflow-hidden mb-6"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                    <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <p className="text-xs font-bold tracking-widest text-neutral-600 uppercase mb-3">Rincian Order</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-400">Nominal Poin</span>
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-bold text-white">{order.amount.toLocaleString("id-ID")} poin</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-400">Total Bayar</span>
                                <span className="text-base font-black text-amber-400">{formatRupiah(order.price)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-400">Waktu Order</span>
                                <span className="text-sm text-neutral-300">
                                    {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Order ID */}
                    <div className="px-5 py-3 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] text-neutral-600 uppercase tracking-widest">ID Order</p>
                            <p className="text-xs font-mono text-neutral-400 mt-0.5 break-all">{order.id}</p>
                        </div>
                        <button
                            onClick={copyOrderId}
                            className="shrink-0 p-2 rounded-xl hover:bg-white/[0.06] text-neutral-500 hover:text-neutral-200 transition-all"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* QRIS Section + Proof Upload — hanya tampil jika masih PENDING */}
                {order.status === "PENDING" && (
                    <>
                        {/* QRIS */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl overflow-hidden mb-6"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Smartphone className="w-4 h-4 text-neutral-400" />
                                    <p className="text-sm font-bold text-white">Bayar via QRIS</p>
                                </div>

                                {/* QRIS Image */}
                                <div className="flex justify-center mb-4">
                                    <div className="rounded-2xl p-3 inline-block w-full max-w-xs" style={{ background: "white" }}>
                                        <img
                                            src="/qris.jpeg"
                                            alt="QRIS Payment Code"
                                            className="w-full h-auto object-contain rounded-xl"
                                            onError={(e) => {
                                                const target = e.currentTarget
                                                target.style.display = "none"
                                                target.parentElement!.innerHTML = `
                                                    <div style="width:100%;padding:40px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#9ca3af;background:#1a1a2e;border-radius:12px">
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                                                        <p style="font-size:12px">QRIS akan ditampilkan disini</p>
                                                    </div>
                                                `
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Transfer amount */}
                                <div
                                    className="rounded-xl p-3 text-center mb-4"
                                    style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}
                                >
                                    <p className="text-xs text-neutral-500 mb-1">Transfer tepat sebesar</p>
                                    <p className="text-2xl font-black text-amber-400">{formatRupiah(order.price)}</p>
                                    <p className="text-[10px] text-neutral-600 mt-1">
                                        Scan QRIS di atas menggunakan aplikasi mobile banking / e-wallet kamu
                                    </p>
                                </div>

                                {/* Steps */}
                                <div className="space-y-2">
                                    {[
                                        "Scan QRIS di atas menggunakan aplikasi banking kamu",
                                        `Transfer tepat sebesar ${formatRupiah(order.price)}`,
                                        "Upload bukti transfer di bawah ini",
                                        "Admin akan memverifikasi pembayaran kamu",
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span
                                                className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
                                            >
                                                {i + 1}
                                            </span>
                                            <p className="text-xs text-neutral-500 leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Bukti Transfer Box ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-2xl overflow-hidden mb-6"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{
                                                background: hasProof ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                                            }}
                                        >
                                            {hasProof
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                : <Upload className="w-4 h-4 text-amber-400" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Bukti Transfer</p>
                                            <p className="text-[11px] text-neutral-500 mt-0.5">
                                                {hasProof ? "Bukti sudah dikirim" : "Upload setelah melakukan transfer"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lihat bukti yang sudah diupload */}
                                    {hasProof && (
                                        <button
                                            onClick={() => setShowProofModal(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Lihat
                                        </button>
                                    )}
                                </div>

                                {/* Upload Area */}
                                {!hasProof ? (
                                    <div>
                                        {/* Drop / Select area */}
                                        {!proofPreview ? (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 py-8 transition-all group"
                                                style={{
                                                    background: "rgba(251,191,36,0.02)",
                                                    border: "2px dashed rgba(251,191,36,0.2)",
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.4)"
                                                    ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.04)"
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.2)"
                                                    ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(251,191,36,0.02)"
                                                }}
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                    style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}
                                                >
                                                    <ImageIcon className="w-6 h-6 text-amber-400/60" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-semibold text-neutral-400">
                                                        Klik untuk pilih gambar
                                                    </p>
                                                    <p className="text-xs text-neutral-600 mt-1">
                                                        JPG, PNG, WebP · Maks 5MB
                                                    </p>
                                                </div>
                                            </button>
                                        ) : (
                                            /* Preview sebelum submit */
                                            <div className="space-y-3">
                                                <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(251,191,36,0.2)" }}>
                                                    <img
                                                        src={proofPreview}
                                                        alt="Preview bukti transfer"
                                                        className="w-full max-h-64 object-contain"
                                                        style={{ background: "#0d0d14" }}
                                                    />
                                                    <button
                                                        onClick={removeSelectedFile}
                                                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                                        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                                                    >
                                                        <X className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                                                    >
                                                        Ganti Gambar
                                                    </button>
                                                    <button
                                                        onClick={handleUploadProof}
                                                        disabled={uploading}
                                                        className="flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                                                        style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#1a1000" }}
                                                    >
                                                        {uploading
                                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...</>
                                                            : <><Upload className="w-3.5 h-3.5" /> Kirim Bukti</>
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                ) : (
                                    /* Sudah ada proof — tampilkan thumbnail kecil */
                                    <div
                                        className="flex items-center gap-3 p-3 rounded-xl"
                                        style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}
                                    >
                                        <img
                                            src={order.proofImage!}
                                            alt="Bukti transfer"
                                            className="w-14 h-14 object-cover rounded-xl shrink-0"
                                            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-emerald-400">Bukti sudah diterima</p>
                                            <p className="text-xs text-neutral-500 mt-0.5">Admin akan segera memverifikasi pembayaran kamu</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Warning note + Cancel */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="flex items-start gap-2 text-xs text-neutral-600">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <p>Simpan ID Order kamu sebagai bukti pembayaran. Poin akan ditambahkan dalam 1×24 jam setelah pembayaran terverifikasi.</p>
                            </div>

                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all group"
                                style={{ background: "rgba(251,113,133,0.05)", border: "1px solid rgba(251,113,133,0.15)", color: "#fb7185" }}
                            >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Batalkan Pesanan
                            </button>
                        </motion.div>
                    </>
                )}

                {/* CTA jika sudah selesai */}
                {order.status === "COMPLETED" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Link
                            href="/shop"
                            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
                        >
                            <Star className="w-4 h-4" />
                            Belanja di Memory Shop
                        </Link>
                    </motion.div>
                )}

                {/* Back to topup jika cancelled */}
                {order.status === "CANCELLED" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Link
                            href="/topup"
                            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Buat Pesanan Baru
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* ── Cancel Modal ── */}
            <AnimatePresence>
                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
                        onClick={() => !cancelling && setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl overflow-hidden"
                            style={{ background: "#0d0d14", border: "1px solid rgba(251,113,133,0.2)" }}
                        >
                            <div className="p-6 text-center">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)" }}
                                >
                                    <AlertTriangle className="w-7 h-7 text-rose-400" />
                                </div>
                                <h3 className="text-lg font-black text-white mb-2">Batalkan Pesanan?</h3>
                                <p className="text-sm text-neutral-400 leading-relaxed mb-1">
                                    Pesanan untuk <span className="text-white font-bold">{order?.amount.toLocaleString("id-ID")} poin</span> akan dibatalkan.
                                </p>
                                <p className="text-xs text-neutral-600 mb-6">
                                    Jika kamu sudah melakukan transfer, hubungi admin untuk pengembalian dana.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        disabled={cancelling}
                                        className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="flex-1 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                                        style={{ background: "rgba(251,113,133,0.15)", border: "1px solid rgba(251,113,133,0.3)", color: "#fb7185" }}
                                    >
                                        {cancelling
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <><Trash2 className="w-4 h-4" /> Ya, Batalkan</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Proof Image Fullscreen Modal ── */}
            <AnimatePresence>
                {showProofModal && order.proofImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setShowProofModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-lg w-full"
                        >
                            <button
                                onClick={() => setShowProofModal(false)}
                                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                            <p className="text-xs text-neutral-500 text-center mb-3">Bukti Transfer</p>
                            <img
                                src={order.proofImage}
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
