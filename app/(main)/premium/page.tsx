"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Crown, Camera, Users, Sparkles, ShoppingBag, Target,
    Zap, Star, Shield, MapPin, BadgeCheck, ChevronRight,
    Loader2, CheckCircle2, Clock, AlertTriangle, Gift, User,
    XCircle, Music2, Lock, Unlock, Info, RefreshCw, ShieldCheck, ArrowRight,
    Minimize2, Maximize2
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

// ─── API Response Interface ─────────────────────────────────────
interface PremiumStatusData {
    isPremium: boolean
    activePremium: boolean
    isInGracePeriod: boolean
    isExpired: boolean
    premiumExpiresAt: string | null
    graceEndsAt: string | null
    daysRemaining: number
    graceDaysRemaining: number
    canRenew: boolean
    spotifyAccess: any
    limits: any
    freeGachaPullsRemaining: number
    streakFreezesRemaining: number
    pityCounter: number
    pendingOrder: { id: string; createdAt: string } | null
    pricing: { price: number; durationDays: number; label: string }
    points: number
    canClaimItems: boolean
}

// ─── Benefit Data ───────────────────────────────────────────────
const BENEFITS = [
    { icon: Camera, title: "10 Foto per Kenangan", desc: "Upload lebih banyak momen dalam satu kenangan", free: "3 foto", premium: "10 foto", bg: "#00FFFF" },
    { icon: Users, title: "10 Kolaborator", desc: "Ajak lebih banyak teman untuk berkolaborasi", free: "5 orang", premium: "10 orang", bg: "#FF00FF" },
    { icon: Sparkles, title: "2 Free Gacha / Minggu", desc: "Buka Mystery Box tanpa keluar poin", free: "—", premium: "2 pull", bg: "#00FF00" },
    { icon: ShoppingBag, title: "Diskon Shop 5%", desc: "Hemat poin untuk setiap pembelian di shop", free: "0%", premium: "-5%", bg: "#FFFF00" },
    { icon: Target, title: "Pity System 30 Pull", desc: "Dijamin dapat item Legend dalam 30 pull", free: "—", premium: "30 pull", bg: "#FF3300" },
    { icon: Zap, title: "Streak x1.5 Poin", desc: "Dapatkan bonus poin dari klaim streak harian", free: "x1", premium: "x1.5", bg: "#00FFFF" },
    { icon: Star, title: "Bonus 100 Poin", desc: "Langsung dapat bonus poin saat upgrade", free: "—", premium: "+100", bg: "#FFFF00" },
    { icon: MapPin, title: "Custom Map Markers", desc: "5 gaya marker eksklusif di peta kenangan", free: "—", premium: "5 style", bg: "#FF00FF" },
    { icon: BadgeCheck, title: "Premium Badge", desc: "Badge crown 👑 Premium di profil & komentar", free: "—", premium: "👑", bg: "#00FF00" },
    { icon: Shield, title: "Streak Freeze 2x/bulan", desc: "Jaga streak walau skip login 2 kali per bulan", free: "—", premium: "2x", bg: "#FF3300" },
]

// ─── Helpers ────────────────────────────────────────────────────

function formatDateWIB(dateStr: string | null): string {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })
}

function formatDateTimeWIB(dateStr: string | null): string {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) +
        " pukul " +
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB"
}

function formatPremiumCountdown(targetDateStr: string | null): string {
    if (!targetDateStr) return "Sudah berakhir"
    const target = new Date(targetDateStr)
    const now = new Date()
    const diffMs = target.getTime() - now.getTime()

    if (diffMs <= 0) return "Sudah berakhir"

    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays >= 2) return `${Math.ceil(diffDays)} hari tersisa`
    if (diffDays >= 1) return `1 hari tersisa`
    if (diffHours >= 1) return `Kurang dari 1 hari tersisa (±${Math.floor(diffHours)} jam)`
    return "Kurang dari 1 jam tersisa"
}

function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
}

function isDarkBg(bg: string) {
    return bg === "#FF00FF" || bg === "#FF3300"
}

// ─── Animation ──────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 22 } },
}
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

// ─── Loading Skeleton ───────────────────────────────────────────
function PremiumSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-pulse">
            {/* Hero */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-neutral-200 border-[4px] border-black" />
                <div className="w-80 h-14 bg-neutral-200 border-[4px] border-black" />
                <div className="w-96 h-12 bg-neutral-200 border-[3px] border-black" />
            </div>
            {/* Status */}
            <div className="h-48 bg-neutral-200 border-[4px] border-black" />
            {/* Timeline */}
            <div className="h-28 bg-neutral-200 border-[4px] border-black" />
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-neutral-200 border-[4px] border-black" />
                ))}
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  GRACE COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════

function GraceCountdown({ targetDateStr }: { targetDateStr: string | null }) {
    const [timeLeft, setTimeLeft] = useState<{
        days: string
        hours: string
        minutes: string
        seconds: string
        isExpired: boolean
    }>({ days: "00", hours: "00", minutes: "00", seconds: "00", isExpired: false })

    useEffect(() => {
        if (!targetDateStr) return

        const calculate = () => {
            const difference = new Date(targetDateStr).getTime() - new Date().getTime()
            if (difference <= 0) {
                setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00", isExpired: true })
                return
            }
            const d = Math.floor(difference / (1000 * 60 * 60 * 24))
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft({
                days: d.toString().padStart(2, '0'),
                hours: h.toString().padStart(2, '0'),
                minutes: m.toString().padStart(2, '0'),
                seconds: s.toString().padStart(2, '0'),
                isExpired: false
            })
        }

        calculate()
        const timer = setInterval(calculate, 1000)
        return () => clearInterval(timer)
    }, [targetDateStr])

    const timeBlocks = [
        { label: "Hari", value: timeLeft.days, bg: "#00FFFF" },
        { label: "Jam", value: timeLeft.hours, bg: "#FF00FF" },
        { label: "Menit", value: timeLeft.minutes, bg: "#00FF00" },
        { label: "Detik", value: timeLeft.seconds, bg: "#FFFF00" },
    ]

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 my-4 select-none">
            {timeBlocks.map((block, index) => (
                <div key={block.label} className="flex items-center">
                    {index > 0 && (
                        <span className="text-xl sm:text-4xl font-black text-white/40 mr-2 sm:mr-4 animate-pulse leading-none">:</span>
                    )}
                    <div className="flex flex-col items-center">
                        <div 
                            className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center relative overflow-hidden group hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-all"
                        >
                            <div className="absolute inset-0 opacity-10 group-hover:scale-110 transition-transform duration-300" style={{ background: block.bg }} />
                            <span className="text-2xl sm:text-4xl font-black text-black tracking-tight relative z-10 font-mono leading-none">
                                {block.value}
                            </span>
                        </div>
                        <span className="text-[9px] sm:text-[11px] font-black uppercase text-white/50 tracking-wider mt-2.5">
                            {block.label}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
//  FLOATING COUNTDOWN TIMER
// ═══════════════════════════════════════════════════════════════

function FloatingCountdown({ targetDateStr }: { targetDateStr: string | null }) {
    const [timeLeft, setTimeLeft] = useState<{
        days: string
        hours: string
        minutes: string
        seconds: string
    }>({ days: "00", hours: "00", minutes: "00", seconds: "00" })

    useEffect(() => {
        if (!targetDateStr) return
        const calculate = () => {
            const difference = new Date(targetDateStr).getTime() - new Date().getTime()
            if (difference <= 0) {
                setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" })
                return
            }
            const d = Math.floor(difference / (1000 * 60 * 60 * 24))
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft({
                days: d.toString().padStart(2, '0'),
                hours: h.toString().padStart(2, '0'),
                minutes: m.toString().padStart(2, '0'),
                seconds: s.toString().padStart(2, '0')
            })
        }
        calculate()
        const timer = setInterval(calculate, 1000)
        return () => clearInterval(timer)
    }, [targetDateStr])

    const blocks = [
        { value: timeLeft.days, label: "hari" },
        { value: timeLeft.hours, label: "jam" },
        { value: timeLeft.minutes, label: "menit" },
        { value: timeLeft.seconds, label: "detik" }
    ]

    return (
        <div className="flex items-center justify-center gap-1.5 font-mono text-black font-black text-[15px]">
            {blocks.map((b, i) => (
                <div key={b.label} className="flex items-center gap-1">
                    {i > 0 && <span className="animate-pulse text-black/40 text-[12px]">:</span>}
                    <div className="flex flex-col items-center">
                        <span className="bg-white rounded-lg border-[2px] border-black px-1.5 py-0.5 shadow-[2px_2px_0_#000]">{b.value}</span>
                        <span className="text-[7px] font-black uppercase text-black/50 mt-0.5">{b.label}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
//  STATUS CARD — The main hero status display
// ═══════════════════════════════════════════════════════════════

function PremiumStatusCard({ status }: { status: PremiumStatusData }) {
    const isActive = status.activePremium && !status.isInGracePeriod && !status.isExpired
    const isGrace = status.isInGracePeriod
    const isExpired = status.isExpired && !status.activePremium

    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("premium_card_minimized") === "true"
        }
        return false
    })

    useEffect(() => {
        localStorage.setItem("premium_card_minimized", isMinimized.toString())
    }, [isMinimized])

    if (isActive) {
        return (
            <>
                {/* 1. Main View (Large / Compact depending on minimized state) */}
                {isMinimized ? (
                    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-black">
                        <div className="flex items-center gap-3">
                            <span className="inline-block rounded-md px-2 py-0.5 bg-black text-[#00FF00] text-[10px] font-black uppercase tracking-wider">
                                Premium Aktif
                            </span>
                            <p className="text-[13px] font-bold text-black">
                                Premium kamu aktif (Floating Countdown aktif di pojok layar).
                            </p>
                        </div>
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 bg-white border-[3px] border-black text-[11px] font-black uppercase text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-0 active:shadow-none transition-all shrink-0"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            Perbesar Detail
                        </button>
                    </motion.div>
                ) : (
                    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-white border-[3px] border-black shadow-[6px_6px_0_#000] p-6 sm:p-8 text-center text-black">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(black 2px, transparent 2px)", backgroundSize: "24px 24px" }} />
                        
                        {/* Minimize Button on top right */}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="absolute top-4 right-4 flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-[#00FF00] border-[3px] border-black text-[10px] font-black uppercase text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-0 active:shadow-none transition-all z-20"
                            title="Kecilkan ke pojok layar"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                            Kecilkan
                        </button>

                        <div className="relative z-10 flex flex-col items-center">
                            <span className="inline-block rounded-lg px-4 py-1.5 bg-[#00FF00] border-[3px] border-black text-[11px] font-black uppercase tracking-[0.15em] text-black shadow-[2px_2px_0_#000] mb-4">
                                Premium Aktif
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                Masa Aktif Berakhir Dalam
                            </h3>
                            <GraceCountdown targetDateStr={status.premiumExpiresAt} />
                            <p className="text-[13px] font-bold text-black mt-4 leading-relaxed max-7xl:w-md mx-auto">
                                Premium kamu aktif sampai <span className="font-black">{formatDateTimeWIB(status.premiumExpiresAt)}</span>. Nikmati semua benefit eksklusif!
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* 2. Floating Countdown Widget (Visible ONLY when minimized) */}
                <AnimatePresence>
                    {isMinimized && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#00FF00] border-[3px] border-black p-4 shadow-[6px_6px_0_#000] w-72 sm:w-80 flex flex-col gap-3 select-none text-black animate-none"
                        >
                            <div className="flex items-center justify-between border-b-[3px] border-black/20 pb-2">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-black shrink-0" />
                                    <span className="text-[12px] font-black uppercase tracking-wider text-black">
                                        Premium Aktif
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMinimized(false)}
                                    title="Perbesar"
                                    className="w-8 h-8 rounded-xl border-[3px] border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="py-1">
                                <FloatingCountdown targetDateStr={status.premiumExpiresAt} />
                            </div>
                            
                            <div className="text-center rounded-xl bg-black text-white text-[10px] font-black uppercase py-2 border-[3px] border-black">
                                Benefit Aktif Sepenuhnya
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    if (isGrace) {
        return (
            <>
                {/* 1. Main View (Large / Compact depending on minimized state) */}
                {isMinimized ? (
                    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-black">
                        <div className="flex items-center gap-3">
                            <span className="inline-block rounded-md px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider">
                                Masa Tenggang
                            </span>
                            <p className="text-[13px] font-bold text-black">
                                Benefit Premium aktif sementara (Floating Countdown aktif di pojok layar).
                            </p>
                        </div>
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 bg-white border-[3px] border-black text-[11px] font-black uppercase text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-0 active:shadow-none transition-all shrink-0"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            Perbesar Detail
                        </button>
                    </motion.div>
                ) : (
                    <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-white border-[3px] border-black shadow-[6px_6px_0_#000] p-6 sm:p-8 text-center text-black">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(white 2px, transparent 2px)", backgroundSize: "24px 24px" }} />
                        
                        {/* Minimize Button on top right */}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="absolute top-4 right-4 flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-[#FFFF00] border-[3px] border-black text-[10px] font-black uppercase text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-0 active:shadow-none transition-all z-20"
                            title="Kecilkan ke pojok layar"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                            Kecilkan
                        </button>

                        <div className="relative z-10 flex flex-col items-center">
                            <span className="inline-block rounded-lg px-4 py-1.5 bg-[#FFFF00] border-[3px] border-black text-[11px] font-black uppercase tracking-[0.15em] text-black shadow-[2px_2px_0_#000] mb-4">
                                Masa Tenggang Premium
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                                Benefit Berakhir Dalam
                            </h3>
                            <GraceCountdown targetDateStr={status.graceEndsAt} />
                            <p className="text-[13px] font-bold text-black mt-4 leading-relaxed max-7xl:w-md mx-auto">
                                Setelah waktu di atas habis, benefit Premium kamu akan terkunci otomatis secara non-destruktif.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* 2. Floating Countdown Widget (Visible ONLY when minimized) */}
                <AnimatePresence>
                    {isMinimized && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#FFFF00] border-[3px] border-black p-4 shadow-[6px_6px_0_#000] w-72 sm:w-80 flex flex-col gap-3 select-none text-black animate-none"
                        >
                            <div className="flex items-center justify-between border-b-[3px] border-black/20 pb-2">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-black shrink-0 animate-bounce" />
                                    <span className="text-[12px] font-black uppercase tracking-wider text-black">
                                        Masa Tenggang Premium
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMinimized(false)}
                                    title="Perbesar"
                                    className="w-8 h-8 rounded-xl border-[3px] border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="py-1">
                                <FloatingCountdown targetDateStr={status.graceEndsAt} />
                            </div>
                            
                            <div className="text-center rounded-xl bg-black text-white text-[10px] font-black uppercase py-2 border-[3px] border-black">
                                Benefit Aktif Sementara
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        )
    }

    // Expired
    return (
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-white border-[3px] border-black shadow-[6px_6px_0_#000]">
            <div className="bg-[#FF3300] border-b-[3px] border-black px-5 py-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-white shrink-0" />
                <span className="text-[12px] font-black uppercase tracking-[0.12em] text-white">
                    Premium Berakhir
                </span>
            </div>
            <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-200 border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center shrink-0">
                        <Crown className="w-8 h-8 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-black leading-relaxed mb-3">
                            Premium kamu sudah <span className="font-black">benar-benar berakhir</span>.
                        </p>
                        <p className="text-[13px] font-bold text-black/60 leading-relaxed">
                            Akun kamu sekarang kembali ke mode Free. Benefit Premium seperti 10 foto, 10 kolaborator, custom marker, badge, diskon shop, gacha premium, dan streak bonus sudah tidak aktif.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  TIMELINE — 3-step visual timeline
// ═══════════════════════════════════════════════════════════════

function PremiumTimeline({ status }: { status: PremiumStatusData }) {
    const isActive = status.activePremium && !status.isInGracePeriod && !status.isExpired
    const isGrace = status.isInGracePeriod
    const isExpired = status.isExpired && !status.activePremium

    const steps = [
        {
            label: "Premium Aktif",
            sub: status.premiumExpiresAt ? `s/d ${formatDateWIB(status.premiumExpiresAt)}` : "—",
            active: isActive,
            done: isGrace || isExpired,
            color: "#00FF00",
        },
        {
            label: "Masa Tenggang",
            sub: status.graceEndsAt ? `s/d ${formatDateWIB(status.graceEndsAt)}` : "—",
            active: isGrace,
            done: isExpired,
            color: "#FFFF00",
        },
        {
            label: "Expired Total",
            sub: "Benefit nonaktif",
            active: isExpired,
            done: false,
            color: "#FF3300",
        },
    ]

    return (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border-[3px] border-black shadow-[6px_6px_0_#000] p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-[#00FFFF]" />
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.15em] text-black">Timeline Status Premium</span>
            </div>

            {/* Desktop horizontal */}
            <div className="hidden sm:flex items-start gap-0">
                {steps.map((step, i) => (
                    <div key={step.label} className="flex-1 flex flex-col items-center relative">
                        {/* Connector line before */}
                        {i > 0 && (
                            <div className="absolute top-4 right-1/2 w-full h-[4px] bg-black -translate-y-1/2 z-0" style={{ opacity: step.done || step.active ? 1 : 0.15 }} />
                        )}
                        {/* Node */}
                        <div
                            className="relative z-10 w-10 h-10 rounded-xl border-[3px] border-black flex items-center justify-center mb-3 transition-all"
                            style={{
                                background: step.active ? step.color : step.done ? step.color : "#E5E5E5",
                                boxShadow: step.active ? `4px 4px 0 #000` : "none",
                                transform: step.active ? "scale(1.15)" : "scale(1)",
                                opacity: step.done ? 0.5 : 1,
                            }}
                        >
                            {step.done ? (
                                <CheckCircle2 className="w-4 h-4 text-black" />
                            ) : step.active ? (
                                <div className="w-3 h-3 bg-black" />
                            ) : (
                                <div className="w-3 h-3 bg-neutral-400" />
                            )}
                        </div>
                        <p className={`text-[11px] font-black uppercase tracking-wide text-center leading-tight ${step.active ? "text-black" : step.done ? "text-black/40" : "text-black/30"}`}>
                            {step.label}
                        </p>
                        <p className={`text-[10px] font-bold text-center mt-1 leading-snug ${step.active ? "text-black/70" : "text-black/30"}`}>
                            {step.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* Mobile vertical */}
            <div className="sm:hidden space-y-0">
                {steps.map((step, i) => (
                    <div key={step.label} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                            <div
                                className="w-9 h-9 rounded-xl border-[3px] border-black flex items-center justify-center shrink-0 transition-all"
                                style={{
                                    background: step.active ? step.color : step.done ? step.color : "#E5E5E5",
                                    boxShadow: step.active ? `4px 4px 0 #000` : "none",
                                    opacity: step.done ? 0.5 : 1,
                                }}
                            >
                                {step.done ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                ) : step.active ? (
                                    <div className="w-2.5 h-2.5 bg-black" />
                                ) : (
                                    <div className="w-2.5 h-2.5 bg-neutral-400" />
                                )}
                            </div>
                            {i < steps.length - 1 && (
                                <div className="w-[3px] h-8 bg-black" style={{ opacity: steps[i + 1].done || steps[i + 1].active ? 1 : 0.15 }} />
                            )}
                        </div>
                        <div className="pb-4">
                            <p className={`text-[12px] font-black uppercase tracking-wide ${step.active ? "text-black" : step.done ? "text-black/40" : "text-black/30"}`}>
                                {step.label}
                            </p>
                            <p className={`text-[10px] font-bold mt-0.5 ${step.active ? "text-black/70" : "text-black/30"}`}>
                                {step.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  BENEFIT STATUS GRID
// ═══════════════════════════════════════════════════════════════

function BenefitStatusGrid({ status }: { status: PremiumStatusData }) {
    const isActive = status.activePremium && !status.isInGracePeriod && !status.isExpired
    const isGrace = status.isInGracePeriod
    const isExpired = status.isExpired && !status.activePremium

    const statusLabel = isActive
        ? { text: "AKTIF", color: "#00FF00", textColor: "text-black" }
        : isGrace
            ? { text: "AKTIF SEMENTARA", color: "#FFFF00", textColor: "text-black" }
            : { text: "TERKUNCI", color: "#FF3300", textColor: "text-white" }

    return (
        <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Section header */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FF00FF] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[20px] font-black text-black leading-none uppercase" style={{ fontFamily: "'Syne',sans-serif" }}>
                            10 Premium Benefits
                        </h2>
                        <p className="text-[12px] font-bold text-black/50 mt-1">
                            {isActive ? "Semua benefit sedang aktif" : isGrace ? "Masih aktif — akan terkunci setelah masa tenggang" : "Kembali ke limit Free"}
                        </p>
                    </div>
                </div>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 border-[3px] border-black text-[11px] font-black uppercase tracking-wider shadow-[4px_4px_0_#000] ${statusLabel.textColor}`}
                    style={{ background: statusLabel.color }}
                >
                    {isActive ? <Unlock className="w-3 h-3" /> : isGrace ? <Clock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {statusLabel.text}
                </span>
            </motion.div>

            {/* Grace period warning */}
            {isGrace && (
                <motion.div variants={fadeUp} className="mb-5 rounded-2xl bg-[#FFFF00]/30 border-[3px] border-black p-4 shadow-[4px_4px_0_#000] flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                    <p className="text-[12px] font-bold text-black leading-relaxed">
                        Semua benefit akan <span className="font-black">terkunci</span> setelah masa tenggang berakhir pada <span className="font-black">{formatDateTimeWIB(status.graceEndsAt)}</span>.
                        Perpanjang sekarang untuk menjaga akses!
                    </p>
                </motion.div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BENEFITS.map((b, i) => {
                    const Icon = b.icon
                    return (
                        <motion.div
                            key={b.title}
                            variants={fadeUp}
                            className={`relative flex items-start gap-4 p-5 rounded-2xl bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-all group ${isExpired ? "opacity-60" : ""}`}
                        >
                            <div
                                className="w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]"
                                style={{ background: b.bg }}
                            >
                                <Icon className={`w-6 h-6 ${isDarkBg(b.bg) ? "text-white" : "text-black"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-black text-black uppercase tracking-wide mb-1">{b.title}</p>
                                <p className="text-[12px] font-bold text-black/70 mb-3">{b.desc}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] rounded-lg font-black text-black bg-neutral-200 border-[2px] border-black px-2 py-1 uppercase shadow-[2px_2px_0_#000]">
                                        Free: {b.free}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-black font-black" />
                                    <span
                                        className={`text-[10px] rounded-lg font-black border-[2px] border-black px-2 py-1 uppercase shadow-[2px_2px_0_#000] ${isDarkBg(b.bg) ? "text-white" : "text-black"}`}
                                        style={{ background: b.bg }}
                                    >
                                        Premium: {b.premium}
                                    </span>
                                </div>
                            </div>
                            {/* Status indicator */}
                            {isActive && <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-[#00CC00] stroke-[3]" />}
                            {isGrace && <Clock className="absolute top-4 right-4 w-5 h-5 text-[#CC8800] stroke-[2.5]" />}
                            {isExpired && <Lock className="absolute top-4 right-4 w-5 h-5 text-neutral-400 stroke-[2.5]" />}
                        </motion.div>
                    )
                })}
            </div>

            {/* Spotify special note */}
            <motion.div variants={fadeUp} className="mt-5 rounded-2xl bg-[#1DB954]/10 border-[3px] border-black p-5 shadow-[4px_4px_0_#000] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1DB954] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center shrink-0">
                    <Music2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-[13px] font-black text-black uppercase mb-1">Catatan Spotify</p>
                    <p className="text-[12px] font-bold text-black/70 leading-relaxed">
                        Lagu Spotify lama yang sudah terpasang <span className="font-black text-black">tetap tampil</span> di memory.
                        Untuk menambahkan atau mengganti lagu, kamu perlu Premium aktif atau beli <span className="font-black text-black">unlock Spotify permanen</span> di Shop.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  NON-DESTRUCTIVE REASSURANCE CARD
// ═══════════════════════════════════════════════════════════════

function NonDestructiveNote() {
    return (
        <motion.div variants={fadeUp} className="rounded-2xl bg-[#FFFDF0] border-[3px] border-black p-5 shadow-[4px_4px_0_#000] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#00FFFF] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
                <p className="text-[12px] font-black text-black uppercase mb-1">Data Aman & Non-Destruktif</p>
                <p className="text-[11px] font-bold text-black/60 leading-relaxed">
                    Tenang — memory lama, foto, kolaborator, dan lagu Spotify yang sudah terpasang <span className="font-black text-black">tidak akan dihapus</span>.
                    Jika kamu mengaktifkan Premium lagi, semua benefit langsung kembali tanpa kehilangan data.
                </p>
            </div>
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  PRICING CARD
// ═══════════════════════════════════════════════════════════════

function PricingCard({
    status, ordering, onOrder, onShowClaim
}: {
    status: PremiumStatusData
    ordering: boolean
    onOrder: () => void
    onShowClaim: () => void
}) {
    const isActive = status.activePremium && !status.isInGracePeriod && !status.isExpired
    const isGrace = status.isInGracePeriod
    const isExpired = status.isExpired && !status.activePremium
    const hasPending = !!status.pendingOrder

    return (
        <motion.div variants={fadeUp} className="rounded-2xl bg-white border-[3px] border-black shadow-[6px_6px_0_#000] p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-center sm:text-left">
                <p className="text-[12px] rounded-lg font-black uppercase tracking-[0.2em] text-black bg-[#FFFF00] inline-block px-3 py-1.5 border-[3px] border-black shadow-[2px_2px_0_#000] mb-4">
                    Premium {status.pricing?.label || "1 Bulan"}
                </p>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                    <span className="text-4xl sm:text-6xl font-black text-black">{formatRupiah(status.pricing?.price ?? 10000)}</span>
                    <span className="text-[14px] font-bold text-black/60 uppercase">/bulan</span>
                </div>
                <p className="text-[12px] font-bold text-black mt-3">
                Estimasi Value ≥ Rp 10.000/bulan dari poin saja
                </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
                {isActive ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 border-[3px] border-black text-[16px] font-black uppercase bg-[#00FF00] text-black shadow-[4px_4px_0_#000]">
                            <CheckCircle2 className="w-6 h-6" />
                            Sudah Aktif
                        </div>
                        {status.canClaimItems && (
                            <button
                                onClick={onShowClaim}
                                className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 border-[3px] border-black text-[16px] font-black uppercase bg-[#FFD700] text-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-none transition-all"
                            >
                                <Gift className="w-5 h-5" />
                                Klaim Hadiah
                            </button>
                        )}
                    </div>
                ) : hasPending ? (
                    <div className="text-center flex flex-col items-stretch sm:items-center">
                        <div className="flex items-center justify-center gap-2 rounded-xl px-6 py-4 border-[3px] border-black text-[14px] font-black uppercase bg-[#FFFF00] text-black shadow-[4px_4px_0_#000] mb-4">
                            <Clock className="w-5 h-5" />
                            Menunggu Verifikasi
                        </div>
                        <p className="text-[11px] font-bold text-black/60 mb-3">
                            Pesanan Premium sedang menunggu verifikasi admin.
                        </p>
                        <Link href={`/premium/payment?orderId=${status.pendingOrder?.id}`} className="text-[12px] rounded-xl font-black uppercase text-black bg-white border-[3px] border-black px-4 py-2 hover:bg-[#FF00FF] hover:text-white transition-colors shadow-[2px_2px_0_#000] active:translate-y-0 active:shadow-none">
                            Lihat Status Pembayaran →
                        </Link>
                    </div>
                ) : (
                    <button
                        onClick={onOrder}
                        disabled={ordering}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 rounded-xl px-8 py-4 border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isGrace
                                ? "bg-[#FF3300] text-white"
                                : "bg-[#00FF00] text-black"
                        }`}
                    >
                        {ordering ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {ordering ? "Memproses..." : isGrace ? "Perpanjang Premium" : "Aktifkan Premium Lagi"}
                    </button>
                )}
            </div>
        </motion.div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function PremiumPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [premiumStatus, setPremiumStatus] = useState<PremiumStatusData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [ordering, setOrdering] = useState(false)
    const [showClaimPopup, setShowClaimPopup] = useState(false)
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(false)

    const fetchStatus = () => {
        setLoading(true)
        setError(false)
        fetch("/api/premium/status")
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                setPremiumStatus(data)
                if (data.canClaimItems) setShowClaimPopup(true)
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (authStatus === "unauthenticated") { router.push("/login"); return }
        if (authStatus === "authenticated") fetchStatus()
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

    // ── Loading ──
    if (loading) return <PremiumSkeleton />

    // ── Error ──
    if (error || !premiumStatus) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-10 inline-block">
                    <XCircle className="w-12 h-12 text-[#FF3300] mx-auto mb-4" />
                    <p className="text-[16px] font-black text-black uppercase mb-2">Gagal Memuat Status</p>
                    <p className="text-[12px] font-bold text-black/60 mb-6">Terjadi kesalahan saat memuat status Premium.</p>
                    <button
                        onClick={fetchStatus}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFFF] border-[3px] border-black text-[13px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Coba Lagi
                    </button>
                </div>
            </div>
        )
    }

    const ps = premiumStatus
    const showBottomCTA = !ps.activePremium && !ps.pendingOrder && !ps.isInGracePeriod

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative pb-24">

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="relative z-10 space-y-8">

                {/* ── Hero Section ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center flex flex-col items-center"
                >
                    <div className="relative inline-flex items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-2xl bg-[#FFFF00] border-[3px] border-black shadow-[6px_6px_0_#000] flex items-center justify-center">
                            <Crown className="w-12 h-12 text-black" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-5xl rounded-2xl font-black text-black tracking-tight mb-3 uppercase bg-white border-[3px] border-black px-6 py-3 shadow-[6px_6px_0_#000] inline-block">
                        MemoryMap <span className="text-[#FF00FF]">Premium</span>
                    </h1>
                    <p className="text-black rounded-xl font-bold text-[13px] sm:text-[15px] max-w-7xl mx-auto leading-relaxed mt-4 bg-[#00FFFF] border-[3px] border-black p-4 shadow-[4px_4px_0_#000]">
                        Unlock semua fitur eksklusif dan tingkatkan pengalaman MemoryMap kamu ke level berikutnya!
                    </p>
                </motion.div>

                {/* ── Status Card ── */}
                <motion.div initial="hidden" animate="show" variants={stagger}>
                    <PremiumStatusCard status={ps} />
                </motion.div>

                {/* ── Timeline ── */}
                {(ps.activePremium || ps.isInGracePeriod || ps.isExpired) && ps.premiumExpiresAt && (
                    <motion.div initial="hidden" animate="show" variants={stagger}>
                        <PremiumTimeline status={ps} />
                    </motion.div>
                )}

                {/* ── Pricing Card ── */}
                <motion.div initial="hidden" animate="show" variants={stagger}>
                    <PricingCard
                        status={ps}
                        ordering={ordering}
                        onOrder={handleOrder}
                        onShowClaim={() => setShowClaimPopup(true)}
                    />
                </motion.div>

                {/* ── Benefits Grid ── */}
                <BenefitStatusGrid status={ps} />

                {/* ── Savings Summary ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <div className="bg-[#FFFF00] rounded-2xl border-[3px] border-black p-6 sm:p-8 shadow-[6px_6px_0_#000] text-center">
                        <p className="text-[14px] rounded-xl font-black uppercase tracking-widest text-black mb-6 bg-white inline-block px-5 py-2.5 border-[3px] border-black shadow-[4px_4px_0_#000] transform rotate-1">
                            Estimasi Keuntungan Bulanan
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Free Gacha", value: "160 pts", sub: "2 pull × 4 minggu", bg: "bg-[#00FFFF]" },
                                { label: "Streak x1.5", value: "660 pts", sub: "30 hari bonus", bg: "bg-[#FF00FF]", text: "text-white" },
                                { label: "Bonus Upgrade", value: "100 pts", sub: "Langsung dapat", bg: "bg-[#00FF00]" },
                                { label: "Shop Diskon", value: "~80 pts", sub: "5% hemat", bg: "bg-[#FF3300]", text: "text-white" },
                            ].map(s => (
                                <div key={s.label} className={`p-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0_#000] flex flex-col justify-center items-center ${s.bg} ${s.text || "text-black"}`}>
                                    <p className="text-[20px] font-black leading-none">{s.value}</p>
                                    <p className="text-[11px] font-black uppercase mt-2">{s.label}</p>
                                    <p className="text-[10px] font-bold mt-1 opacity-80">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[14px] rounded-xl font-bold text-black mt-6 bg-white border-[3px] border-black inline-block px-5 py-2.5 shadow-[4px_4px_0_#000]">
                            Total terukur: <span className="font-black text-[#FF3300]">~1.000 poin</span> (≈ Rp 10.000) + fitur eksklusif lainnya!
                        </p>
                    </div>
                </motion.div>

                {/* ── Non-Destructive Note ── */}
                <motion.div initial="hidden" animate="show" variants={stagger}>
                    <NonDestructiveNote />
                </motion.div>

                {/* ── Bottom CTA ── */}
                {showBottomCTA && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-center"
                    >
                        <button
                            onClick={handleOrder}
                            disabled={ordering}
                            className="inline-flex items-center gap-3 rounded-2xl px-10 py-5 bg-[#00FF00] border-[3px] border-black text-[18px] font-black uppercase shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
                        >
                            {ordering ? <Loader2 className="w-6 h-6 animate-spin" /> : <Crown className="w-6 h-6" />}
                            {ordering ? "Memproses..." : "Aktifkan Premium Sekarang"}
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
                                <div className="absolute inset-0" style={{
                                    backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
                                    backgroundSize: "20px 20px",
                                }} />
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

                            {/* Body */}
                            <div className="p-5">
                                <p className="text-[11px] font-black text-black/50 uppercase tracking-widest mb-4 text-center">
                                    {claimed ? "Item Diklaim" : "Hadiah Eksklusif Menunggu"}
                                </p>

                                <div className="space-y-3">
                                    {/* Mahkota Royale */}
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
                                        {claimed ? <CheckCircle2 className="w-5 h-5 text-[#00CC00] shrink-0" /> : <Gift className="w-5 h-5 text-[#ffd700] shrink-0" />}
                                    </div>

                                    {/* Langit Kerajaan */}
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
                                        {claimed ? <CheckCircle2 className="w-5 h-5 text-[#00CC00] shrink-0" /> : <Gift className="w-5 h-5 text-[#ffd700] shrink-0" />}
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
