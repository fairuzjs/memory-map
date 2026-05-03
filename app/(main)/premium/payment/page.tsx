"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle2, Clock, XCircle, Copy, ArrowLeft,
    Loader2, Smartphone, RefreshCw, ShieldAlert,
    Trash2, AlertTriangle, Upload, ImageIcon, X, Eye, Crown, Gift, User, Sparkles
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

type PremiumOrder = {
    id: string
    durationDays: number
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
        bg: "#FFFF00",
        text: "#000",
    },
    COMPLETED: {
        icon: CheckCircle2,
        label: "Premium Aktif!",
        description: "Pembayaran berhasil. Akun kamu sudah menjadi Premium.",
        bg: "#00FF00",
        text: "#000",
    },
    CANCELLED: {
        icon: XCircle,
        label: "Dibatalkan",
        description: "Order ini telah dibatalkan.",
        bg: "#FF6B6B",
        text: "#000",
    },
}

export default function PremiumPaymentPage() {
    const { status: authStatus } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get("orderId")

    const [order, setOrder] = useState<PremiumOrder | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)

    // Proof upload states
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [showProofModal, setShowProofModal] = useState(false)
    const [showClaimPopup, setShowClaimPopup] = useState(false)
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const previousStatusRef = useRef<string | null>(null)

    const handleClaimItems = async () => {
        setClaiming(true)
        try {
            const res = await fetch("/api/premium/claim", { method: "POST" })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal mengklaim item")
                return
            }
            setClaimed(true)
            toast.success("🎁 Item premium berhasil diklaim!")
        } catch {
            toast.error("Terjadi kesalahan saat mengklaim")
        } finally {
            setClaiming(false)
        }
    }

    const fetchOrder = async (showLoader = false) => {
        if (showLoader) setRefreshing(true)
        try {
            const res = await fetch(`/api/premium/${orderId}`)
            if (!res.ok) { router.push("/premium"); return }
            const data = await res.json()
            // Detect transition to COMPLETED to show claim popup
            if (data.status === "COMPLETED" && previousStatusRef.current !== null && previousStatusRef.current !== "COMPLETED") {
                // Check if items can still be claimed
                const claimRes = await fetch("/api/premium/claim")
                const claimData = await claimRes.json()
                if (claimData.canClaim) {
                    setClaimed(false)
                    setShowClaimPopup(true)
                }
            }
            // Also show on first load if COMPLETED and items not yet claimed
            if (data.status === "COMPLETED" && previousStatusRef.current === null) {
                const claimRes = await fetch("/api/premium/claim")
                const claimData = await claimRes.json()
                if (claimData.canClaim) {
                    setClaimed(false)
                    setShowClaimPopup(true)
                }
            }
            previousStatusRef.current = data.status
            setOrder(data)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        if (authStatus === "unauthenticated") { router.push("/login"); return }
        if (!orderId) { router.push("/premium"); return }
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
            const res = await fetch(`/api/premium/${order.id}`, {
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

            const res = await fetch(`/api/premium/${order.id}/proof`, {
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
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-black" />
                    <span className="text-black font-black uppercase tracking-widest text-sm bg-[#FFD700] border-[3px] border-black px-4 py-1.5 shadow-[3px_3px_0_#000]">Memuat Pesanan...</span>
                </div>
            </div>
        )
    }

    if (!order) return null

    const statusCfg = STATUS_CONFIG[order.status]
    const StatusIcon = statusCfg.icon
    const hasProof = !!order.proofImage

    return (
        <div className="min-h-screen w-full" style={{ fontFamily: "Outfit, sans-serif" }}>
            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Back */}
                <Link
                    href="/premium"
                    className="inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-wider mb-6 px-4 py-2 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Link>

                {/* Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 flex items-center gap-3 border-[3px] border-black shadow-[4px_4px_0_#000]"
                    style={{ background: statusCfg.bg }}
                >
                    <div className="w-10 h-10 bg-white border-[2px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                        <StatusIcon className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-black text-black uppercase tracking-wider">{statusCfg.label}</p>
                        <p className="text-[11px] font-bold text-black/60 mt-0.5">{statusCfg.description}</p>
                        {order.note && (
                            <p className="text-[10px] font-bold text-black/50 mt-1">Catatan: {order.note}</p>
                        )}
                    </div>
                    {order.status === "PENDING" && (
                        <button
                            onClick={() => fetchOrder(true)}
                            className="shrink-0 w-9 h-9 bg-white border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] hover:bg-[#00FFFF] transition-colors"
                            title="Refresh status"
                        >
                            <RefreshCw className={`w-4 h-4 text-black ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </motion.div>

                {/* Order Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] overflow-hidden"
                >
                    <div className="px-5 py-3 bg-black">
                        <p className="text-[11px] font-black tracking-widest text-white uppercase">Rincian Order</p>
                    </div>
                    <div className="p-5 space-y-3 border-b-[3px] border-black">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-black/60">Paket</span>
                            <div className="flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5 text-[#b8860b]" />
                                <span className="text-sm font-black text-black">Premium {order.durationDays} Hari</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-black/60">Total Bayar</span>
                            <span className="text-base font-black px-2 py-0.5 bg-[#FFD700] border-[2px] border-black shadow-[2px_2px_0_#000]">{formatRupiah(order.price)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-black/60">Waktu Order</span>
                            <span className="text-sm font-bold text-black">
                                {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                        </div>
                    </div>
                    {/* Order ID */}
                    <div className="px-5 py-3 flex items-center justify-between gap-2 bg-neutral-50">
                        <div>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">ID Order</p>
                            <p className="text-xs font-mono font-bold text-black/70 mt-0.5 break-all">{order.id}</p>
                        </div>
                        <button
                            onClick={copyOrderId}
                            className="shrink-0 w-9 h-9 bg-white border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] hover:bg-[#00FFFF] transition-colors"
                        >
                            <Copy className="w-4 h-4 text-black" />
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
                            className="mb-6 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] overflow-hidden"
                        >
                            <div className="px-5 py-3 bg-black flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-white" />
                                <p className="text-[11px] font-black tracking-widest text-white uppercase">Bayar via QRIS</p>
                            </div>

                            <div className="p-5">
                                {/* QRIS Image */}
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 inline-block w-full max-w-xs bg-white border-[3px] border-black shadow-[3px_3px_0_#000]">
                                        <img
                                            src="/qris.jpeg"
                                            alt="QRIS Payment Code"
                                            className="w-full h-auto object-contain"
                                            onError={(e) => {
                                                const target = e.currentTarget
                                                target.style.display = "none"
                                                target.parentElement!.innerHTML = `
                                                    <div style="width:100%;padding:40px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#000;background:#f5f5f5;border:2px solid #000">
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                                                        <p style="font-size:12px;font-weight:900">QRIS akan ditampilkan disini</p>
                                                    </div>
                                                `
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Transfer amount */}
                                <div className="p-3 text-center mb-4 bg-[#FFD700] border-[3px] border-black shadow-[3px_3px_0_#000]">
                                    <p className="text-[11px] font-bold text-black/60 mb-1">Transfer tepat sebesar</p>
                                    <p className="text-2xl font-black text-black">{formatRupiah(order.price)}</p>
                                    <p className="text-[10px] font-bold text-black/50 mt-1">
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
                                            <span className="w-6 h-6 text-[10px] font-black flex items-center justify-center shrink-0 bg-black text-white border-[2px] border-black">
                                                {i + 1}
                                            </span>
                                            <p className="text-xs font-bold text-black/60 leading-relaxed pt-1">{step}</p>
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
                            className="mb-6 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] overflow-hidden"
                        >
                            <div className="px-5 py-3 bg-black flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {hasProof
                                        ? <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
                                        : <Upload className="w-4 h-4 text-[#FFD700]" />
                                    }
                                    <p className="text-[11px] font-black tracking-widest text-white uppercase">Bukti Transfer</p>
                                </div>

                                {hasProof && (
                                    <button
                                        onClick={() => setShowProofModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase bg-[#00FF00] border-[2px] border-white/20 text-black"
                                    >
                                        <Eye className="w-3 h-3" />
                                        Lihat
                                    </button>
                                )}
                            </div>

                            <div className="p-5">
                                {!hasProof ? (
                                    <div>
                                        {!proofPreview ? (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full flex flex-col items-center justify-center gap-3 py-8 transition-all group bg-neutral-50 border-[3px] border-dashed border-black/30 hover:border-black hover:bg-[#FFD700]/10"
                                            >
                                                <div className="w-12 h-12 flex items-center justify-center bg-[#FFD700] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                                    <ImageIcon className="w-6 h-6 text-black" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-black text-black">
                                                        Klik untuk pilih gambar
                                                    </p>
                                                    <p className="text-xs font-bold text-black/50 mt-1">
                                                        JPG, PNG, WebP · Maks 5MB
                                                    </p>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="relative overflow-hidden border-[3px] border-black shadow-[3px_3px_0_#000]">
                                                    <img
                                                        src={proofPreview}
                                                        alt="Preview bukti transfer"
                                                        className="w-full max-h-64 object-contain"
                                                        style={{ background: "#f5f5f5" }}
                                                    />
                                                    <button
                                                        onClick={removeSelectedFile}
                                                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white border-[2px] border-black shadow-[2px_2px_0_#000]"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-black" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 py-2.5 text-xs font-black uppercase bg-white border-[3px] border-black shadow-[2px_2px_0_#000] hover:bg-neutral-100 transition-all"
                                                    >
                                                        Ganti Gambar
                                                    </button>
                                                    <button
                                                        onClick={handleUploadProof}
                                                        disabled={uploading}
                                                        className="flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 bg-[#FFD700] border-[3px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all disabled:opacity-40"
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
                                    <div className="flex items-center gap-3 p-3 bg-[#00FF00]/10 border-[2px] border-black">
                                        <img
                                            src={order.proofImage!}
                                            alt="Bukti transfer"
                                            className="w-14 h-14 object-cover shrink-0 border-[2px] border-black"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-black">Bukti sudah diterima</p>
                                            <p className="text-[11px] font-bold text-black/50 mt-0.5">Admin akan segera memverifikasi pembayaran kamu</p>
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
                            <div className="flex items-start gap-2 p-3 bg-[#FFFF00]/20 border-[2px] border-black">
                                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                                <p className="text-[11px] font-bold text-black/70">Simpan ID Order kamu sebagai bukti pembayaran. Premium akan aktif dalam 1×24 jam setelah pembayaran terverifikasi.</p>
                            </div>

                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full py-3 text-sm font-black uppercase flex items-center justify-center gap-2 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:bg-[#FF6B6B] hover:text-white transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                Batalkan Pesanan
                            </button>
                        </motion.div>
                    </>
                )}

                {/* CTA jika sudah selesai */}
                {order.status === "COMPLETED" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Link
                            href="/premium"
                            className="w-full py-4 font-black text-sm uppercase flex items-center justify-center gap-2 bg-[#FFD700] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                        >
                            <Crown className="w-4 h-4" />
                            Cek Status Premium
                        </Link>
                    </motion.div>
                )}

                {/* Back to premium jika cancelled */}
                {order.status === "CANCELLED" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Link
                            href="/premium"
                            className="w-full py-4 font-black text-sm uppercase flex items-center justify-center gap-2 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:bg-neutral-100 transition-all"
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
                            className="w-full max-w-sm bg-[#FFFDF0] border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 bg-[#FF6B6B] border-[3px] border-black shadow-[3px_3px_0_#000]">
                                    <AlertTriangle className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-black text-black uppercase mb-2">Batalkan Pesanan?</h3>
                                <p className="text-sm font-bold text-black/60 leading-relaxed mb-1">
                                    Pesanan untuk <span className="font-black text-black">Premium {order?.durationDays} Hari</span> akan dibatalkan.
                                </p>
                                <p className="text-xs font-bold text-black/40 mb-6">
                                    Jika kamu sudah melakukan transfer, hubungi admin untuk pengembalian dana.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        disabled={cancelling}
                                        className="flex-1 py-3 text-sm font-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:bg-neutral-100 transition-all disabled:opacity-40"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="flex-1 py-3 text-sm font-black uppercase flex items-center justify-center gap-2 bg-[#FF6B6B] text-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] transition-all disabled:opacity-40"
                                    >
                                        {cancelling
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <><Trash2 className="w-4 h-4" /> Batalkan</>
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
                            className="relative max-w-lg w-full bg-white border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden"
                        >
                            <div className="px-4 py-3 bg-black flex items-center justify-between">
                                <p className="text-[11px] font-black tracking-widest text-white uppercase">Bukti Transfer</p>
                                <button
                                    onClick={() => setShowProofModal(false)}
                                    className="w-7 h-7 bg-white border-[2px] border-white/20 flex items-center justify-center hover:bg-[#FF6B6B] transition-colors"
                                >
                                    <X className="w-4 h-4 text-black" />
                                </button>
                            </div>
                            <div className="p-3">
                                <img
                                    src={order.proofImage}
                                    alt="Bukti transfer"
                                    className="w-full h-auto border-[2px] border-black"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Premium Claim Popup ── */}
            <AnimatePresence>
                {showClaimPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => claimed && setShowClaimPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 40, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm bg-[#FFFDF0] border-[4px] border-black shadow-[12px_12px_0_#000] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-[#FFD700] border-b-[4px] border-black p-5 text-center relative overflow-hidden">
                                {/* Grid pattern */}
                                <div className="absolute inset-0" style={{
                                    backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
                                    backgroundSize: "20px 20px",
                                }} />
                                {/* Decorative shapes */}
                                <div className="absolute top-2 left-3 w-5 h-5 rotate-12" style={{ background: "#fff5cc", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }} />
                                <div className="absolute top-3 right-4 w-4 h-4 rotate-45" style={{ background: "#b8860b", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }} />
                                <div className="absolute bottom-2 left-6 w-3 h-3 -rotate-6" style={{ background: "#fff5cc", border: "2px solid #000" }} />
                                <div className="absolute bottom-3 right-6 w-3 h-3 rotate-12" style={{ background: "#ffd700", border: "2px solid #000" }} />

                                <div className="relative z-10">
                                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-white border-[3px] border-black shadow-[4px_4px_0_#000]">
                                        <Crown className="w-8 h-8 text-black" />
                                    </div>
                                    <h2 className="text-xl font-black text-black uppercase tracking-wider">
                                        {claimed ? "Berhasil!" : "Selamat!"}
                                    </h2>
                                    <p className="text-[12px] font-bold text-black/70 mt-1">
                                        {claimed ? "Item premium telah masuk ke inventori 🎁" : "Premium berhasil diaktifkan 🎉"}
                                    </p>
                                </div>
                            </div>

                            {/* Body — claimed items */}
                            <div className="p-5">
                                <p className="text-[11px] font-black text-black/50 uppercase tracking-widest mb-4 text-center">
                                    {claimed ? "Item Diklaim" : "Hadiah Eksklusif Menunggu"}
                                </p>

                                <div className="space-y-3">
                                    {/* Mahkota Royale frame */}
                                    <div className={`flex items-center gap-3 p-3 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] transition-all ${claimed ? "opacity-100" : "opacity-70"}`}>
                                        <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                                            <div className="relative w-10 h-10">
                                                <div className="absolute -inset-0.5 rounded-full p-[2px]" style={{ background: "conic-gradient(from 0deg, #ffd700, #ffb800, #fff5cc, #ffd700, #b8860b, #ffd700, #fff5cc, #ffb800, #ffd700)" }}>
                                                    <div className="w-full h-full rounded-full" style={{ background: "#0a0a10" }} />
                                                </div>
                                                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-neutral-600" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border-[2px] border-black" style={{ background: "#FFFF00" }}>Bingkai</span>
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border-[2px] border-black text-black" style={{ background: "#FFD700", boxShadow: "1px 1px 0 #000" }}>👑 Premium</span>
                                            </div>
                                            <p className="text-[13px] font-black text-black">Mahkota Royale</p>
                                            <p className="text-[10px] text-black/50 font-bold">Bingkai emas eksklusif premium</p>
                                        </div>
                                        {claimed ? (
                                            <CheckCircle2 className="w-5 h-5 text-[#00CC00] shrink-0" />
                                        ) : (
                                            <Gift className="w-5 h-5 text-[#ffd700] shrink-0" />
                                        )}
                                    </div>

                                    {/* Langit Kerajaan banner */}
                                    <div className={`flex items-center gap-3 p-3 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] transition-all ${claimed ? "opacity-100" : "opacity-70"}`}>
                                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a1508, #2a2010)" }}>
                                            <div className="absolute inset-0" style={{
                                                backgroundImage: "linear-gradient(rgba(255,215,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.1) 1px, transparent 1px)",
                                                backgroundSize: "8px 8px",
                                            }} />
                                            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center" style={{ background: "#ffd700", border: "1.5px solid #000", boxShadow: "1px 1px 0 #000" }}>
                                                <span className="text-[8px] select-none">👑</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border-[2px] border-black text-white" style={{ background: "#FF00FF" }}>Banner</span>
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border-[2px] border-black text-black" style={{ background: "#FFD700", boxShadow: "1px 1px 0 #000" }}>👑 Premium</span>
                                            </div>
                                            <p className="text-[13px] font-black text-black">Langit Kerajaan</p>
                                            <p className="text-[10px] text-black/50 font-bold">Banner neubrutalism emas eksklusif</p>
                                        </div>
                                        {claimed ? (
                                            <CheckCircle2 className="w-5 h-5 text-[#00CC00] shrink-0" />
                                        ) : (
                                            <Gift className="w-5 h-5 text-[#ffd700] shrink-0" />
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {!claimed ? (
                                    <>
                                        <div className="mt-4 p-3 bg-[#FFD700]/10 border-[2px] border-black text-center">
                                            <p className="text-[11px] font-bold text-black/70">
                                                Tekan tombol di bawah untuk <span className="font-black text-black">mengklaim hadiah</span> ke inventorimu.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleClaimItems}
                                            disabled={claiming}
                                            className="w-full mt-4 py-3.5 flex items-center justify-center gap-2 bg-[#FFD700] border-[3px] border-black text-[14px] font-black uppercase text-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                        >
                                            {claiming ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Gift className="w-5 h-5" />
                                                    Klaim Sekarang
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="mt-4 p-3 bg-[#00FF00]/20 border-[2px] border-black text-center">
                                            <p className="text-[11px] font-bold text-black/70">
                                                ✅ Item sudah masuk ke <span className="font-black text-black">Inventori</span>. Pasang lewat halaman inventori!
                                            </p>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => setShowClaimPopup(false)}
                                                className="flex-1 py-3 bg-white border-[3px] border-black text-[13px] font-black uppercase text-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] transition-all"
                                            >
                                                Tutup
                                            </button>
                                            <Link
                                                href="/inventory"
                                                onClick={() => setShowClaimPopup(false)}
                                                className="flex-1 py-3 flex items-center justify-center gap-2 bg-[#FFD700] border-[3px] border-black text-[13px] font-black uppercase text-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] transition-all"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Inventori
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

