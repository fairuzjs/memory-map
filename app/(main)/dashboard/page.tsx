"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
    Plus, Globe, Users, MapPin, Loader2, ArrowRight,
    BookOpen, TrendingUp, Map, Heart, Image as ImageIcon, Sparkles, Flame, ChevronRight, CheckCircle2
} from "lucide-react"
import { motion, useInView } from "framer-motion"

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: {
        opacity: 1, y: 0,
        transition: { type: "spring" as const, stiffness: 280, damping: 24 }
    },
}
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.09 } },
}

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })
    return (
        <motion.div ref={ref} initial="hidden" animate={isInView ? "show" : "hidden"} variants={stagger} className={className}>
            {children}
        </motion.div>
    )
}

// ─── Feature Cards Data ───────────────────────────────────────────────────────
const features = [
    {
        icon: MapPin,
        label: "Jangkauan Global",
        desc: "Temukan tempat tersembunyi yang ditandai oleh orang-orang di seluruh dunia.",
        iconBg: "bg-indigo-500/10 border border-indigo-500/20",
        iconColor: "text-indigo-400",
        hoverBg: "from-indigo-500/[0.06] to-violet-500/[0.03]",
        accentLine: "from-indigo-500 to-violet-500",
    },
    {
        icon: Users,
        label: "Komunitas",
        desc: "Bagikan pengalaman Anda dan tanggapi petualangan dari penjelajah lain.",
        iconBg: "bg-emerald-500/10 border border-emerald-500/20",
        iconColor: "text-emerald-400",
        hoverBg: "from-emerald-500/[0.06] to-teal-500/[0.03]",
        accentLine: "from-emerald-500 to-teal-500",
    },
    {
        icon: BookOpen,
        label: "Jurnal Pribadi",
        desc: "Simpan kenangan dengan aman, kategorikan berdasarkan perasaan, dan lihat kembali kapan saja.",
        iconBg: "bg-amber-500/10 border border-amber-500/20",
        iconColor: "text-amber-400",
        hoverBg: "from-amber-500/[0.06] to-orange-500/[0.03]",
        accentLine: "from-amber-500 to-orange-500",
    },
]

// ─── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
    icon: React.ElementType
    label: string
    value: string | number
    iconBg: string
    iconColor: string
    barColor: string
    barWidth: number
    footer: string
    valueLg?: boolean
    valueColor?: string
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor, barColor, barWidth, footer, valueLg, valueColor }: StatCardProps) {
    return (
        <motion.div
            variants={fadeUp}
            whileHover={{ y: -3, transition: { type: "spring", stiffness: 320, damping: 22 } }}
            className="group relative rounded-2xl p-5 border border-white/[0.06] bg-gradient-to-br from-white/[0.025] to-white/[0.01] overflow-hidden"
        >
            {/* Top-left glow on hover */}
            <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${iconBg.split(" ")[0]}`} />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{label}</span>
                </div>

                {/* Value */}
                <p className={`font-bold leading-none mb-3 ${valueLg ? "text-2xl" : "text-4xl"} ${valueColor ?? "text-white"}`}
                    style={{ fontFamily: "'Syne', sans-serif" }}>
                    {value}
                </p>

                {/* Progress Bar */}
                <div className="h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.4 }}
                    />
                </div>

                {/* Footer label */}
                <p className="text-[11px] text-neutral-600 mt-2">{footer}</p>
            </div>
        </motion.div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState({
        totalMemories: 0,
        uniqueLocations: 0,
        topEmotion: "-",
        totalPhotos: 0,
    })
    const [loading, setLoading] = useState(true)
    const [streakData, setStreakData] = useState<{ currentStreak: number; alreadyClaimed: boolean } | null>(null)

    const firstName = session?.user?.name?.split(" ")[0] || "Penjelajah"
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Selamat pagi" : hour < 18 ? "Selamat siang" : "Selamat malam"

    useEffect(() => {
        if (!session?.user?.id) return
        fetch(`/api/memories?userId=${session.user.id}`)
            .then(res => res.json())
            .then((data: any[]) => {
                const totalMemories = data.length
                const locations = new Set(data.filter(m => m.locationName).map(m => m.locationName)).size
                const emotions = data.reduce((acc: any, curr: any) => {
                    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1
                    return acc
                }, {})
                const topEmotion = Object.keys(emotions).sort((a, b) => emotions[b] - emotions[a])[0] || "-"
                const totalPhotos = data.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0)
                setStats({ totalMemories, uniqueLocations: locations, topEmotion, totalPhotos })
                setLoading(false)
            })
            .catch(() => setLoading(false))

        // Fetch streak data untuk widget
        fetch("/api/streak")
            .then(res => res.json())
            .then(data => setStreakData({ currentStreak: data.currentStreak, alreadyClaimed: data.alreadyClaimed }))
            .catch(() => { })
    }, [session?.user?.id])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-neutral-500 text-sm">Memuat dashboard Anda…</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

            {/* ── Hero / Welcome ─────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.div
                    variants={fadeUp}
                    className="relative rounded-2xl overflow-hidden border border-indigo-500/[0.12] px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
                    style={{
                        background: "linear-gradient(135deg, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.06) 50%, rgba(8,8,16,0) 100%)",
                    }}
                >
                    {/* Dot-grid background (masked to right side) */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: "radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                            maskImage: "radial-gradient(ellipse 60% 100% at 90% 50%, black 10%, transparent 70%)",
                            WebkitMaskImage: "radial-gradient(ellipse 60% 100% at 90% 50%, black 10%, transparent 70%)",
                        }}
                    />
                    {/* Top edge glow line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.55) 40%, rgba(99,102,241,0.55) 60%, transparent)" }}
                    />
                    {/* Right radial orb */}
                    <div
                        className="absolute right-0 top-0 h-full w-72 pointer-events-none opacity-[0.07]"
                        style={{ background: "radial-gradient(ellipse at right center, #6366f1, transparent 70%)" }}
                    />

                    {/* Text content */}
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            {/* Animated pulse dot */}
                            <span className="relative flex h-[7px] w-[7px]">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-indigo-400" />
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
                                {greeting}
                            </span>
                        </div>
                        <h1
                            className="text-[28px] sm:text-[34px] font-extrabold text-white leading-tight mb-2"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            Selamat datang kembali,{" "}
                            <span
                                style={{
                                    backgroundImage: "linear-gradient(135deg, #a5b4fc, #c084fc)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {firstName}
                            </span>
                            .
                        </h1>
                        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
                            Siap untuk menyimpan kenangan baru Anda di peta?
                        </p>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex items-center gap-3 shrink-0 relative">
                        <Link
                            href="/memories/create"
                            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                boxShadow: "0 4px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
                            }}
                        >
                            <span className="absolute inset-0 bg-white/0 hover:bg-white/[0.08] transition-colors rounded-xl" />
                            <Plus className="relative w-4 h-4" />
                            <span className="relative">Tambah Kenangan</span>
                        </Link>
                        <Link
                            href="/map"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-white hover:border-white/[0.14] transition-all"
                        >
                            <Globe className="w-4 h-4" />
                            <span>Jelajahi Peta</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Feature Cards ──────────────────────────────────────────────── */}
            {/* ── Streak Widget ──────────────────────────────────────────────── */}
            {streakData !== null && (
                <motion.div initial="hidden" animate="show" variants={stagger}>
                    <motion.div
                        variants={fadeUp}
                        className="relative rounded-2xl overflow-hidden border px-5 py-4 flex items-center justify-between gap-4"
                        style={{
                            background: "linear-gradient(135deg, rgba(234,88,12,0.08) 0%, rgba(249,115,22,0.04) 100%)",
                            borderColor: "rgba(234,88,12,0.18)",
                        }}
                    >
                        {/* Left: icon + info */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.3)" }}>
                                <Flame className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="text-lg font-black text-white leading-none whitespace-nowrap" style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {streakData.currentStreak}
                                    </span>
                                    <span className="text-xs text-neutral-400 whitespace-nowrap">hari streak</span>
                                    {streakData.alreadyClaimed ? (
                                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                                            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                                            <CheckCircle2 className="w-3 h-3" />
                                            Sudah klaim
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                                            style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                                            Belum klaim
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-neutral-600 mt-1 truncate">Daily Streak</p>
                            </div>
                        </div>

                        {/* Right: CTA */}
                        <Link
                            href="/streak"
                            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 whitespace-nowrap min-w-[max-content]"
                            style={{
                                background: "rgba(234,88,12,0.12)",
                                color: "#fb923c",
                                border: "1px solid rgba(234,88,12,0.2)",
                            }}
                        >
                            {streakData.alreadyClaimed ? "Lihat Detail" : "Klaim Sekarang"}
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </motion.div>
                </motion.div>
            )}

            {/* ── Feature Cards ──────────────────────────────────────────────── */}
            <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((item, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        whileHover={{ y: -4, transition: { type: "spring", stiffness: 320, damping: 22 } }}
                        className={`group relative rounded-2xl p-5 border border-white/[0.06] overflow-hidden cursor-default`}
                        style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                    >
                        {/* Hover background tint */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${item.hoverBg}`} />

                        {/* Bottom accent line — slides in on hover */}
                        <div
                            className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r ${item.accentLine} transition-all duration-500 ease-out`}
                        />

                        {/* Icon */}
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.iconBg}`}>
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>

                        <h3
                            className="relative text-sm font-bold text-white mb-1.5"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            {item.label}
                        </h3>
                        <p className="relative text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </AnimatedSection>

            {/* ── Memory Stats ───────────────────────────────────────────────── */}
            <AnimatedSection>
                {/* Section header */}
                <motion.div variants={fadeUp} className="flex items-end justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/[0.15] flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h2
                                className="text-[18px] font-bold text-white leading-none"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                Statistik & Aktivitas Kenangan
                            </h2>
                            <p className="text-[11px] text-neutral-600 mt-0.5 tracking-wide">Perjalanan Anda dalam angka</p>
                        </div>
                    </div>
                    <Link
                        href="/memories"
                        className="group flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-all"
                    >
                        <span>Lihat Jurnal</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </motion.div>

                {/* Stat cards */}
                <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={BookOpen}
                        label="Kenangan"
                        value={stats.totalMemories}
                        iconBg="bg-indigo-500/10 border border-indigo-500/20"
                        iconColor="text-indigo-400"
                        barColor="from-indigo-500 to-violet-500"
                        barWidth={Math.min((stats.totalMemories / 20) * 100, 100)}
                        footer="+1 minggu ini"
                    />
                    <StatCard
                        icon={Map}
                        label="Tempat"
                        value={stats.uniqueLocations}
                        iconBg="bg-emerald-500/10 border border-emerald-500/20"
                        iconColor="text-emerald-400"
                        barColor="from-emerald-500 to-teal-500"
                        barWidth={Math.min((stats.uniqueLocations / 20) * 100, 100)}
                        footer="Di berbagai kota"
                    />
                    <StatCard
                        icon={Heart}
                        label="Perasaan Utama"
                        value={stats.topEmotion.charAt(0).toUpperCase() + stats.topEmotion.slice(1).toLowerCase()}
                        iconBg="bg-rose-500/10 border border-rose-500/20"
                        iconColor="text-rose-400"
                        barColor="from-rose-500 to-pink-500"
                        barWidth={65}
                        footer="Paling sering"
                        valueLg
                        valueColor="text-rose-300"
                    />
                    <StatCard
                        icon={ImageIcon}
                        label="Foto"
                        value={stats.totalPhotos}
                        iconBg="bg-amber-500/10 border border-amber-500/20"
                        iconColor="text-amber-400"
                        barColor="from-amber-500 to-orange-500"
                        barWidth={Math.min((stats.totalPhotos / 50) * 100, 100)}
                        footer="Terlampir di kenangan"
                    />
                </motion.div>
            </AnimatedSection>

        </div>
    )
}