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
        label: "MENUNGGU VERIFIKASI",
        description: "Pembayaran sedang menunggu konfirmasi admin",
        color: "text-black",
        bg: "bg-[#FFFF00]",
        border: "border-black",
    },
    COMPLETED: {
        icon: CheckCircle2,
        label: "POIN SUDAH DITAMBAHKAN!",
        description: "Topup berhasil. Poin telah ditambahkan ke akun kamu.",
        color: "text-black",
        bg: "bg-[#00FF00]",
        border: "border-black",
    },
    CANCELLED: {
        icon: XCircle,
        label: "DIBATALKAN",
        description: "Order ini telah dibatalkan.",
        color: "text-white",
        bg: "bg-[#FF00FF]",
        border: "border-black",
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
        toast.success("ID Order disalin!", {
            style: { border: "3px solid black", borderRadius: 0, background: "#00FF00", color: "#000", fontWeight: 900 }
        })
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
            if (!res.ok) { 
                toast.error(data.error || "Gagal membatalkan pesanan", {
                    style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
                })
                return 
            }
            setOrder(data)
            setShowCancelModal(false)
            toast.success("Pesanan berhasil dibatalkan", {
                style: { border: "3px solid black", borderRadius: 0, background: "#00FF00", color: "#000", fontWeight: 900 }
            })
        } catch {
            toast.error("Terjadi kesalahan", {
                style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
            })
        } finally {
            setCancelling(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowed.includes(file.type)) {
            toast.error("Format tidak didukung. Gunakan JPG, PNG, atau WebP.", {
                style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
            })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB", {
                style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
            })
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
                toast.error(data.error || "Gagal mengunggah bukti", {
                    style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
                })
                return
            }

            setOrder(prev => prev ? { ...prev, proofImage: data.proofImage } : null)
            setProofFile(null)
            setProofPreview(null)
            toast.success("Bukti transfer berhasil dikirim!", {
                style: { border: "3px solid black", borderRadius: 0, background: "#00FF00", color: "#000", fontWeight: 900 }
            })
        } catch {
            toast.error("Terjadi kesalahan saat upload", {
                style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
            })
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
                <Loader2 className="w-12 h-12 text-black animate-spin" />
            </div>
        )
    }

    if (!order) return null

    const statusCfg = STATUS_CONFIG[order.status]
    const StatusIcon = statusCfg.icon
    const hasProof = !!order.proofImage

    return (
        <div className="min-h-screen w-full relative">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
                {/* Back */}
                <Link
                    href="/topup"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black text-[12px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#FFFF00] transition-all mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    KEMBALI
                </Link>

                {/* Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-5 border-[4px] border-black shadow-[6px_6px_0_#000] flex items-center gap-4 ${statusCfg.bg}`}
                >
                    <StatusIcon className={`w-8 h-8 shrink-0 ${statusCfg.color}`} />
                    <div className="flex-1">
                        <p className={`text-[16px] font-black ${statusCfg.color}`}>{statusCfg.label}</p>
                        <p className={`text-[12px] font-bold ${statusCfg.color} mt-0.5 opacity-80`}>{statusCfg.description}</p>
                        {order.note && (
                            <p className="text-[12px] font-bold text-black mt-2 bg-white border-[2px] border-black p-2 shadow-[2px_2px_0_#000] italic">
                                "{order.note}"
                            </p>
                        )}
                    </div>
                    {order.status === "PENDING" && (
                        <button
                            onClick={() => fetchOrder(true)}
                            className="shrink-0 w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#00FFFF] shadow-[2px_2px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                            title="Refresh status"
                        >
                            <RefreshCw className={`w-5 h-5 text-black ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </motion.div>

                {/* Order Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6 bg-white border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col"
                >
                    <div className="p-5 border-b-[4px] border-black bg-neutral-100">
                        <p className="text-[14px] font-black tracking-widest text-black uppercase mb-4 bg-[#FFFF00] border-[2px] border-black inline-block px-2 py-0.5 shadow-[2px_2px_0_#000]">
                            Rincian Order
                        </p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] font-bold text-black/60 uppercase">Nominal Poin</span>
                                <div className="flex items-center gap-1.5 bg-white border-[2px] border-black px-2 py-1 shadow-[2px_2px_0_#000]">
                                    <Star className="w-4 h-4 text-black fill-black" />
                                    <span className="text-[14px] font-black text-black">{order.amount.toLocaleString("id-ID")} poin</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] font-bold text-black/60 uppercase">Total Bayar</span>
                                <span className="text-[18px] font-black text-[#FF3300] bg-white border-[2px] border-black px-2 py-1 shadow-[2px_2px_0_#000]">
                                    {formatRupiah(order.price)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] font-bold text-black/60 uppercase">Waktu Order</span>
                                <span className="text-[12px] font-black text-black">
                                    {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Order ID */}
                    <div className="px-5 py-4 flex items-center justify-between gap-2 bg-white">
                        <div>
                            <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">ID Order</p>
                            <p className="text-[12px] font-black text-black break-all">{order.id}</p>
                        </div>
                        <button
                            onClick={copyOrderId}
                            className="shrink-0 w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#FFFF00] shadow-[2px_2px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                        >
                            <Copy className="w-5 h-5 text-black" />
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
                            className="mb-6 bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                        >
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-[#FF00FF] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                                        <Smartphone className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-[16px] font-black text-black uppercase">Bayar via QRIS</p>
                                </div>

                                {/* QRIS Image */}
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white border-[4px] border-black p-3 shadow-[6px_6px_0_#000] inline-block w-full max-w-xs">
                                        <img
                                            src="/qris.jpeg"
                                            alt="QRIS Payment Code"
                                            className="w-full h-auto object-contain border-[2px] border-black"
                                            onError={(e) => {
                                                const target = e.currentTarget
                                                target.style.display = "none"
                                                target.parentElement!.innerHTML = `
                                                    <div style="width:100%;padding:40px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:black;background:#E5E5E5;border:2px solid black;">
                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                                                        <p style="font-size:12px;font-weight:900;text-transform:uppercase;">QRIS Belum Tersedia</p>
                                                    </div>
                                                `
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Transfer amount */}
                                <div className="p-4 text-center mb-6 bg-[#FFFF00] border-[4px] border-black shadow-[4px_4px_0_#000]">
                                    <p className="text-[12px] font-black text-black uppercase mb-1">Transfer tepat sebesar</p>
                                    <p className="text-[28px] font-black text-[#FF3300] bg-white border-[3px] border-black inline-block px-4 py-1 shadow-[2px_2px_0_#000]">{formatRupiah(order.price)}</p>
                                    <p className="text-[10px] font-bold text-black/80 mt-3 uppercase">
                                        Scan QRIS di atas menggunakan aplikasi banking kamu
                                    </p>
                                </div>

                                {/* Steps */}
                                <div className="space-y-3">
                                    {[
                                        "Scan QRIS di atas menggunakan aplikasi banking kamu",
                                        `Transfer tepat sebesar ${formatRupiah(order.price)}`,
                                        "Upload bukti transfer di bawah ini",
                                        "Admin akan memverifikasi pembayaran kamu",
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-6 h-6 border-[2px] border-black bg-white text-[12px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_0_#000]">
                                                {i + 1}
                                            </span>
                                            <p className="text-[12px] font-bold text-black uppercase leading-relaxed mt-1">{step}</p>
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
                            className="mb-6 bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                        >
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] ${hasProof ? "bg-[#00FF00]" : "bg-[#00FFFF]"}`}>
                                            {hasProof
                                                ? <CheckCircle2 className="w-5 h-5 text-black" />
                                                : <Upload className="w-5 h-5 text-black" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-black text-black uppercase">Bukti Transfer</p>
                                            <p className="text-[10px] font-bold text-black/60 uppercase mt-0.5">
                                                {hasProof ? "Sudah dikirim" : "Wajib di-upload"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lihat bukti yang sudah diupload */}
                                    {hasProof && (
                                        <button
                                            onClick={() => setShowProofModal(true)}
                                            className="flex items-center gap-2 px-3 py-2 bg-white border-[3px] border-black text-[12px] font-black uppercase shadow-[2px_2px_0_#000] hover:bg-[#FFFF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                                        >
                                            <Eye className="w-4 h-4 text-black" />
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
                                                className="w-full bg-[#E5E5E5] border-[4px] border-black border-dashed flex flex-col items-center justify-center gap-3 py-8 transition-all hover:bg-[#00FFFF]/20 hover:border-solid"
                                            >
                                                <div className="w-14 h-14 bg-white border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_#000]">
                                                    <ImageIcon className="w-7 h-7 text-black" />
                                                </div>
                                                <div className="text-center mt-2">
                                                    <p className="text-[14px] font-black text-black uppercase">
                                                        Pilih Gambar Bukti
                                                    </p>
                                                    <p className="text-[10px] font-bold text-black/60 mt-1 uppercase">
                                                        JPG, PNG, WebP · Maks 5MB
                                                    </p>
                                                </div>
                                            </button>
                                        ) : (
                                            /* Preview sebelum submit */
                                            <div className="space-y-4">
                                                <div className="relative border-[4px] border-black p-2 bg-white shadow-[4px_4px_0_#000]">
                                                    <img
                                                        src={proofPreview}
                                                        alt="Preview bukti transfer"
                                                        className="w-full max-h-64 object-contain border-[2px] border-black bg-neutral-100"
                                                    />
                                                    <button
                                                        onClick={removeSelectedFile}
                                                        className="absolute -top-3 -right-3 w-8 h-8 bg-[#FF3300] border-[3px] border-black flex items-center justify-center transition-all hover:scale-110"
                                                    >
                                                        <X className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 py-3 bg-white border-[4px] border-black text-[12px] font-black uppercase shadow-[4px_4px_0_#000] hover:bg-[#E5E5E5] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                                                    >
                                                        Ganti Gambar
                                                    </button>
                                                    <button
                                                        onClick={handleUploadProof}
                                                        disabled={uploading}
                                                        className="flex-1 py-3 bg-[#FFFF00] border-[4px] border-black text-[12px] font-black flex items-center justify-center gap-2 uppercase shadow-[4px_4px_0_#000] hover:bg-[#00FF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {uploading
                                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...</>
                                                            : <><Upload className="w-4 h-4" /> Kirim Bukti</>
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
                                    <div className="flex items-center gap-4 p-4 bg-white border-[4px] border-black shadow-[4px_4px_0_#000]">
                                        <img
                                            src={order.proofImage!}
                                            alt="Bukti transfer"
                                            className="w-16 h-16 object-cover border-[3px] border-black shrink-0 shadow-[2px_2px_0_#000]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-black text-black uppercase bg-[#00FF00] inline-block px-2 border-[2px] border-black shadow-[2px_2px_0_#000] mb-1">Diterima</p>
                                            <p className="text-[10px] font-bold text-black/60 uppercase">Tunggu verifikasi admin</p>
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
                            className="space-y-5"
                        >
                            <div className="flex items-start gap-3 p-4 bg-[#FF00FF] border-[4px] border-black shadow-[4px_4px_0_#000]">
                                <ShieldAlert className="w-5 h-5 shrink-0 text-white mt-0.5" />
                                <p className="text-[11px] font-black text-white uppercase leading-relaxed tracking-wider">
                                    Simpan ID Order kamu sebagai bukti. Poin akan ditambahkan dalam 1×24 jam setelah diverifikasi.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="w-full py-4 bg-white border-[4px] border-black text-[14px] font-black text-[#FF3300] flex items-center justify-center gap-2 uppercase shadow-[4px_4px_0_#000] hover:bg-[#FF3300] hover:text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
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
                            className="w-full py-4 bg-[#FFFF00] border-[4px] border-black font-black text-[16px] flex items-center justify-center gap-3 uppercase shadow-[6px_6px_0_#000] hover:bg-[#00FF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all"
                        >
                            <Star className="w-5 h-5 text-black" />
                            Belanja Sekarang
                        </Link>
                    </motion.div>
                )}

                {/* Back to topup jika cancelled */}
                {order.status === "CANCELLED" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Link
                            href="/topup"
                            className="w-full py-4 bg-white border-[4px] border-black font-black text-[16px] text-black flex items-center justify-center gap-3 uppercase shadow-[6px_6px_0_#000] hover:bg-[#FFFF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-black" />
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !cancelling && setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm bg-white border-[4px] border-black shadow-[12px_12px_0_#000] p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-[#FF3300] border-[4px] border-black flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_0_#000]">
                                <AlertTriangle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-[20px] font-black text-black uppercase mb-3 bg-[#FFFF00] inline-block px-3 py-1 border-[3px] border-black shadow-[2px_2px_0_#000]">Batalkan Pesanan?</h3>
                            <p className="text-[12px] font-bold text-black/80 uppercase mb-2">
                                Pesanan untuk <span className="text-[#FF3300] font-black">{order?.amount.toLocaleString("id-ID")} poin</span> akan dibatalkan.
                            </p>
                            <p className="text-[10px] font-bold text-black/60 uppercase mb-6 bg-neutral-100 p-2 border-[2px] border-black border-dashed">
                                Jika kamu sudah transfer, hubungi admin untuk pengembalian dana.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    disabled={cancelling}
                                    className="flex-1 py-3 bg-white border-[3px] border-black text-[12px] font-black uppercase shadow-[4px_4px_0_#000] hover:bg-neutral-100 transition-all disabled:opacity-50"
                                >
                                    Kembali
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="flex-1 py-3 bg-[#FF3300] border-[3px] border-black text-[12px] font-black text-white flex items-center justify-center gap-2 uppercase shadow-[4px_4px_0_#000] hover:bg-rose-600 transition-all disabled:opacity-50"
                                >
                                    {cancelling
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <><Trash2 className="w-4 h-4" /> Batalkan</>
                                    }
                                </button>
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => setShowProofModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-lg w-full bg-white border-[4px] border-black p-4 shadow-[12px_12px_0_#000]"
                        >
                            <div className="flex items-center justify-between border-b-[4px] border-black pb-3 mb-4">
                                <p className="text-[16px] font-black text-black uppercase bg-[#FFFF00] px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">Bukti Transfer</p>
                                <button
                                    onClick={() => setShowProofModal(false)}
                                    className="w-10 h-10 bg-[#FF3300] border-[3px] border-black flex items-center justify-center hover:bg-rose-600 shadow-[2px_2px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <img
                                src={order.proofImage}
                                alt="Bukti transfer"
                                className="w-full h-auto border-[4px] border-black"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
