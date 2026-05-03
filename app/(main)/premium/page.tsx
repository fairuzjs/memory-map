"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Crown, Camera, Users, Sparkles, ShoppingBag, Target,
    Zap, Star, Shield, MapPin, BadgeCheck, ChevronRight,
    Loader2, CheckCircle2, Clock, AlertTriangle, Gift, User
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

// ─── Benefit Data ────────────────────────────────────────────────
const BENEFITS = [
    {
        icon: Camera,
        title: "10 Foto per Kenangan",
        desc: "Upload lebih banyak momen dalam satu kenangan",
        free: "3 foto",
        premium: "10 foto",
        bg: "bg-[#00FFFF]",
    },
    {
        icon: Users,
        title: "10 Kolaborator",
        desc: "Ajak lebih banyak teman untuk berkolaborasi",
        free: "5 orang",
        premium: "10 orang",
        bg: "bg-[#FF00FF]",
    },
    {
        icon: Sparkles,
        title: "5 Free Gacha / Minggu",
        desc: "Buka Mystery Box tanpa keluar poin",
        free: "—",
        premium: "5 pull",
        bg: "bg-[#00FF00]",
    },
    {
        icon: ShoppingBag,
        title: "Diskon Shop 10%",
        desc: "Hemat poin untuk setiap pembelian di shop",
        free: "0%",
        premium: "-10%",
        bg: "bg-[#FFFF00]",
    },
    {
        icon: Target,
        title: "Pity System 30 Pull",
        desc: "Dijamin dapat item Legend dalam 30 pull",
        free: "—",
        premium: "30 pull",
        bg: "bg-[#FF3300]",
    },
    {
        icon: Zap,
        title: "Streak x2 Poin",
        desc: "Dapatkan double poin dari klaim streak harian",
        free: "x1",
        premium: "x2",
        bg: "bg-[#00FFFF]",
    },
    {
        icon: Star,
        title: "Bonus 250 Poin",
        desc: "Langsung dapat bonus poin saat upgrade",
        free: "—",
        premium: "+250",
        bg: "bg-[#FFFF00]",
    },
    {
        icon: MapPin,
        title: "Custom Map Markers",
        desc: "5 gaya marker eksklusif di peta kenangan",
        free: "—",
        premium: "5 style",
        bg: "bg-[#FF00FF]",
    },
    {
        icon: BadgeCheck,
        title: "Premium Badge",
        desc: "Badge crown 👑 Premium di profil & komentar",
        free: "—",
        premium: "👑",
        bg: "bg-[#00FF00]",
    },
    {
        icon: Shield,
        title: "Streak Freeze 2x/bulan",
        desc: "Jaga streak walau skip login 2 kali per bulan",
        free: "—",
        premium: "2x",
        bg: "bg-[#FF3300]",
    },
]

// ─── Status Interface ────────────────────────────────────────────
interface PremiumStatus {
    isPremium: boolean
    isInGracePeriod: boolean
    daysRemaining: number
    premiumExpiresAt: string | null
    pendingOrder: { id: string; createdAt: string } | null
    pricing: { price: number; durationDays: number; label: string }
    canClaimItems?: boolean
}

// ─── Main Page ───────────────────────────────────────────────────
export default function PremiumPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [ordering, setOrdering] = useState(false)
    const [showClaimPopup, setShowClaimPopup] = useState(false)
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(false)

    useEffect(() => {
        if (authStatus === "unauthenticated") { router.push("/login"); return }
        if (authStatus === "authenticated") {
            fetch("/api/premium/status")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setPremiumStatus(data)
                        // If they can claim, show the popup
                        if (data.canClaimItems) {
                            setShowClaimPopup(true)
                        }
                    }
                })
                .catch(() => {})
                .finally(() => setLoading(false))
        }
    }, [authStatus, router])

    const handleClaimItems = async () => {
        setClaiming(true)
        try {
            const res = await fetch("/api/premium/claim", { method: "POST" })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal mengklaim item", { style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 } })
                return
            }
            setClaimed(true)
            setPremiumStatus(prev => prev ? { ...prev, canClaimItems: false } : prev)
            toast.success("🎁 Item premium berhasil diklaim!", { style: { border: "3px solid black", borderRadius: 0, background: "#00FF00", color: "#000", fontWeight: 900 } })
        } catch {
            toast.error("Terjadi kesalahan saat mengklaim", { style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 } })
        } finally {
            setClaiming(false)
        }
    }

    const handleOrder = async () => {
        setOrdering(true)
        try {
            const res = await fetch("/api/premium", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "order" }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal membuat order", {
                    style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
                })
                return
            }
            router.push(`/premium/payment?orderId=${data.id}`)
        } catch {
            toast.error("Terjadi kesalahan", {
                style: { border: "3px solid black", borderRadius: 0, background: "#FF00FF", color: "#FFF", fontWeight: 900 }
            })
        } finally {
            setOrdering(false)
        }
    }

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
            </div>
        )
    }

    const isActive = premiumStatus?.isPremium ?? false
    const inGrace = premiumStatus?.isInGracePeriod ?? false
    const hasPending = !!premiumStatus?.pendingOrder
    const price = premiumStatus?.pricing?.price ?? 20000

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="relative z-10">

                {/* ── Hero Section ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-12 flex flex-col items-center"
                >
                    {/* Crown Icon */}
                    <div className="relative inline-flex items-center justify-center mb-6">
                        <div className="w-20 h-20 bg-[#FFFF00] border-[4px] border-black shadow-[6px_6px_0_#000] flex items-center justify-center">
                            <Crown className="w-10 h-10 text-black" />
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-3 uppercase bg-white border-[4px] border-black px-4 py-2 shadow-[6px_6px_0_#000] inline-block">
                        MemoryMap <span className="text-[#FF00FF]">Premium</span>
                    </h1>
                    <p className="text-black font-bold text-[14px] sm:text-[16px] max-w-lg mx-auto leading-relaxed mt-4 bg-[#00FFFF] border-[3px] border-black p-3 shadow-[4px_4px_0_#000]">
                        Unlock semua fitur eksklusif dan tingkatkan pengalaman MemoryMap kamu ke level berikutnya!
                    </p>

                    {/* Status Badge */}
                    {isActive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`inline-flex items-center gap-2 mt-6 px-5 py-3 border-[3px] border-black shadow-[4px_4px_0_#000] ${
                                inGrace ? "bg-[#FF3300] text-white" : "bg-[#00FF00] text-black"
                            }`}
                        >
                            {inGrace ? (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                    <span className="text-[14px] font-black uppercase tracking-wider">
                                        Masa Tenggang ({premiumStatus?.daysRemaining ?? 0} hari tersisa)
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-black" />
                                    <span className="text-[14px] font-black uppercase tracking-wider">
                                        Premium Aktif ({premiumStatus?.daysRemaining ?? 0} hari tersisa)
                                    </span>
                                </>
                            )}
                        </motion.div>
                    )}
                </motion.div>

                {/* ── Pricing Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-12 max-w-4xl mx-auto"
                >
                    <div className="bg-white border-[4px] border-black shadow-[12px_12px_0_#000] p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="text-center sm:text-left">
                            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-black bg-[#FFFF00] inline-block px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000] mb-4">
                                Premium 1 Bulan
                            </p>
                            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                                <span className="text-4xl sm:text-6xl font-black text-black">{formatRupiah(price)}</span>
                                <span className="text-[14px] font-bold text-black/60 uppercase">/bulan</span>
                            </div>
                            <p className="text-[12px] font-bold text-black mt-3">
                                10 Benefit Eksklusif • Estimasi Value ≥ Rp 20.000/bulan dari poin saja
                            </p>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto">
                            {isActive && !inGrace ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-center gap-2 px-8 py-4 border-[4px] border-black text-[16px] font-black uppercase bg-[#00FF00] text-black shadow-[6px_6px_0_#000]">
                                        <CheckCircle2 className="w-6 h-6" />
                                        Sudah Aktif
                                    </div>
                                    {premiumStatus?.canClaimItems && (
                                        <button
                                            onClick={() => setShowClaimPopup(true)}
                                            className="flex items-center justify-center gap-2 px-8 py-4 border-[4px] border-black text-[16px] font-black uppercase bg-[#FFD700] text-black shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all"
                                        >
                                            <Gift className="w-5 h-5" />
                                            Klaim Hadiah
                                        </button>
                                    )}
                                </div>
                            ) : hasPending ? (
                                <div className="text-center flex flex-col items-stretch sm:items-center">
                                    <div className="flex items-center justify-center gap-2 px-6 py-4 border-[4px] border-black text-[14px] font-black uppercase bg-[#FFFF00] text-black shadow-[6px_6px_0_#000] mb-4">
                                        <Clock className="w-5 h-5" />
                                        Menunggu Pembayaran
                                    </div>
                                    <Link href={`/premium/payment?orderId=${premiumStatus?.pendingOrder?.id}`} className="text-[12px] font-black uppercase text-black bg-white border-[3px] border-black px-4 py-2 hover:bg-[#FF00FF] hover:text-white transition-colors shadow-[2px_2px_0_#000]">
                                        Lanjutkan Pembayaran →
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    onClick={handleOrder}
                                    disabled={ordering}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border-[4px] border-black text-[16px] font-black uppercase bg-[#FF3300] text-white shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {ordering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                                    {ordering ? "Memproses..." : inGrace ? "Perpanjang" : "Upgrade Sekarang"}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Benefits Grid ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="flex justify-center mb-8">
                        <h2 className="text-[20px] font-black text-black uppercase bg-[#00FFFF] border-[4px] border-black px-6 py-2 shadow-[6px_6px_0_#000] tracking-widest inline-block transform -rotate-1">
                            10 Premium Benefits
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {BENEFITS.map((b, i) => {
                            const Icon = b.icon
                            return (
                                <motion.div
                                    key={b.title}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                                    className="relative flex items-start gap-4 p-5 bg-white border-[4px] border-black shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all group"
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000] ${b.bg}`}>
                                        <Icon className={`w-6 h-6 ${b.bg === "bg-[#FF00FF]" || b.bg === "bg-[#FF3300]" ? "text-white" : "text-black"}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[16px] font-black text-black uppercase tracking-wide mb-1">{b.title}</p>
                                        <p className="text-[12px] font-bold text-black/70 mb-3">{b.desc}</p>
                                        {/* Comparison */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-black bg-neutral-200 border-[2px] border-black px-2 py-1 uppercase shadow-[2px_2px_0_#000]">
                                                Free: {b.free}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-black font-black" />
                                            <span className={`text-[10px] font-black border-[2px] border-black px-2 py-1 uppercase shadow-[2px_2px_0_#000] ${b.bg} ${b.bg === "bg-[#FF00FF]" || b.bg === "bg-[#FF3300]" ? "text-white" : "text-black"}`}>
                                                Premium: {b.premium}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Check for active */}
                                    {isActive && (
                                        <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-[#00FF00] stroke-[3]" />
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* ── Savings Summary ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-12 max-w-4xl mx-auto"
                >
                    <div className="bg-[#FFFF00] border-[4px] border-black p-6 sm:p-8 shadow-[12px_12px_0_#000] text-center">
                        <p className="text-[14px] font-black uppercase tracking-widest text-black mb-6 bg-white inline-block px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000] transform rotate-1">
                            Estimasi Keuntungan Bulanan
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Free Gacha", value: "400 pts", sub: "5 pull × 4 minggu", bg: "bg-[#00FFFF]" },
                                { label: "Streak x2", value: "1.320 pts", sub: "30 hari bonus", bg: "bg-[#FF00FF]", text: "text-white" },
                                { label: "Bonus Upgrade", value: "250 pts", sub: "Langsung dapat", bg: "bg-[#00FF00]" },
                                { label: "Shop Diskon", value: "~30 pts", sub: "10% hemat", bg: "bg-[#FF3300]", text: "text-white" },
                            ].map(s => (
                                <div key={s.label} className={`p-4 border-[3px] border-black shadow-[4px_4px_0_#000] flex flex-col justify-center items-center ${s.bg} ${s.text || "text-black"}`}>
                                    <p className="text-[20px] font-black leading-none">{s.value}</p>
                                    <p className="text-[11px] font-black uppercase mt-2">{s.label}</p>
                                    <p className="text-[10px] font-bold mt-1 opacity-80">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[14px] font-bold text-black mt-6 bg-white border-[3px] border-black inline-block px-4 py-2 shadow-[4px_4px_0_#000]">
                            Total terukur: <span className="font-black text-[#FF3300]">~2.000 poin</span> (≈ Rp 20.000) + fitur eksklusif lainnya!
                        </p>
                    </div>
                </motion.div>

                {/* ── Bottom CTA ── */}
                {!isActive && !hasPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mt-12 text-center"
                    >
                        <button
                            onClick={handleOrder}
                            disabled={ordering}
                            className="inline-flex items-center gap-3 px-10 py-5 bg-[#00FF00] border-[4px] border-black text-[18px] font-black uppercase shadow-[8px_8px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
                        >
                            {ordering ? <Loader2 className="w-6 h-6 animate-spin" /> : <Crown className="w-6 h-6" />}
                            {ordering ? "Memproses..." : "Upgrade ke Premium"}
                        </button>
                        <p className="text-[12px] font-bold text-black/60 uppercase mt-4">
                            Pembayaran manual via transfer • Aktif dalam 1×24 jam setelah verifikasi
                        </p>
                    </motion.div>
                )}
            </div>

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
