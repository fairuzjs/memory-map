"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Calendar, Zap, Medal, Star, Crown, Users, ChevronRight, Loader2, CheckCircle2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { BadgeUnlockModal } from "@/components/ui/BadgeUnlockModal"
import { LeaderboardModal } from "@/components/ui/LeaderboardModal"

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreakData {
    currentStreak: number
    longestStreak: number
    totalActiveDays: number
    lastClaimedAt: string | null
    alreadyClaimed: boolean
    badges: { milestone: number; earnedAt: string }[]
    nextMilestone: number | null
    daysToNext: number | null
}

interface LeaderboardEntry {
    rank: number
    userId: string
    name: string
    image: string | null
    longestStreak: number
    currentStreak: number
    equippedDecoration?: any
}

function getDecorationClass(name?: string) {
    if (!name) return "";
    const n = name.toLowerCase();
    if (n.includes("kristal")) return "anim-kristal";
    if (n.includes("api")) return "anim-api";
    if (n.includes("neon")) return "anim-neon";
    if (n.includes("emas")) return "anim-emas";
    if (n.includes("pelangi")) return "anim-pelangi";
    if (n.includes("glitch")) return "anim-glitch";
    if (n.includes("quasar")) return "anim-quasar";
    if (n.includes("celestial")) return "anim-celestial";
    if (n.includes("supernova")) return "anim-supernova";
    if (n.includes("rune")) return "anim-rune";
    return "";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MILESTONES = [
    {
        days: 7,
        label: "Baru Panas",
        desc: "Login 7 hari berturut-turut",
        glow: "rgba(245,158,11,0.3)",
        barColor: "linear-gradient(90deg, #f59e0b, #ea580c)",
        iconColor: "rgba(245,158,11,0.15)",
        iconBorder: "rgba(245,158,11,0.3)",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z" fill="#f59e0b" />
            </svg>
        ),
        badgeBg: "rgba(245,158,11,0.08)",
        badgeBorder: "rgba(245,158,11,0.25)",
        badgeIconBg: "linear-gradient(135deg, rgba(245,158,11,0.4), rgba(234,88,12,0.2))",
        badgeIcon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z" fill="#fbbf24" />
            </svg>
        ),
    },
    {
        days: 30,
        label: "Menyala Terus",
        desc: "Login 30 hari berturut-turut",
        glow: "rgba(99,102,241,0.3)",
        barColor: "linear-gradient(90deg, #6366f1, #8b5cf6)",
        iconColor: "rgba(99,102,241,0.15)",
        iconBorder: "rgba(99,102,241,0.3)",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(129,140,248,0.3)" />
            </svg>
        ),
        badgeBg: "rgba(99,102,241,0.08)",
        badgeBorder: "rgba(99,102,241,0.25)",
        badgeIconBg: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.2))",
        badgeIcon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#a5b4fc" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(165,180,252,0.4)" />
            </svg>
        ),
    },
    {
        days: 60,
        label: "Anti Kendor",
        desc: "Login 60 hari berturut-turut",
        glow: "rgba(16,185,129,0.3)",
        barColor: "linear-gradient(90deg, #10b981, #14b8a6)",
        iconColor: "rgba(16,185,129,0.1)",
        iconBorder: "rgba(16,185,129,0.2)",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#34d399" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        badgeBg: "rgba(16,185,129,0.08)",
        badgeBorder: "rgba(16,185,129,0.25)",
        badgeIconBg: "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(20,184,166,0.2))",
        badgeIcon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#6ee7b7" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        days: 90,
        label: "GOAT Streak",
        desc: "Login 90 hari berturut-turut",
        glow: "rgba(244,63,94,0.3)",
        barColor: "linear-gradient(90deg, #f43f5e, #ec4899)",
        iconColor: "rgba(244,63,94,0.1)",
        iconBorder: "rgba(244,63,94,0.2)",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 3h14l2 4-9 13L3 7z" stroke="#fb7185" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(251,113,133,0.2)" />
                <path d="M3 7h18M9 3l3 17M15 3l-3 17" stroke="#fb7185" strokeWidth="1" opacity="0.5" />
            </svg>
        ),
        badgeBg: "rgba(244,63,94,0.08)",
        badgeBorder: "rgba(244,63,94,0.25)",
        badgeIconBg: "linear-gradient(135deg, rgba(244,63,94,0.4), rgba(236,72,153,0.2))",
        badgeIcon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 3h14l2 4-9 13L3 7z" stroke="#fda4af" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(253,164,175,0.3)" />
            </svg>
        ),
    },
]

// ─── Fade-up animation ────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function FlameIcon({ size = 16, className }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z" fill="#fb923c" />
        </svg>
    )
}

function HeroFlameIcon() {
    return (
        <svg width="36" height="40" viewBox="0 0 36 44" fill="none">
            <defs>
                <linearGradient id="heroFg" x1="18" y1="44" x2="18" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#fed7aa" />
                    <stop offset="100%" stopColor="#fdba74" stopOpacity="0.7" />
                </linearGradient>
            </defs>
            <path
                d="M18 2C13 12 6 16 6 26a12 12 0 0 0 24 0c0-6-3-11-6-15C22 16 21 20 18 22c-1-5-3-9 0-20z"
                fill="url(#heroFg)"
            />
            <ellipse cx="18" cy="34" rx="5" ry="3" fill="rgba(255,255,255,0.2)" />
        </svg>
    )
}

function CrownIconSm() {
    return (
        <svg width="18" height="16" viewBox="0 0 38 32" fill="none">
            <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="38" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
            </defs>
            <path d="M3 26L6 10L13 18L19 4L25 18L32 10L35 26Z" fill="url(#cg)" stroke="#f59e0b" strokeWidth="0.8" strokeLinejoin="round" />
            <rect x="3" y="25" width="32" height="5" rx="2" fill="#f59e0b" />
            <circle cx="19" cy="27.5" r="2" fill="#fff" opacity="0.9" />
        </svg>
    )
}

function SilverMedalIconSm() {
    return (
        <svg width="16" height="18" viewBox="0 0 30 34" fill="none">
            <circle cx="15" cy="20" r="12" fill="rgba(203,213,225,0.1)" stroke="#cbd5e1" strokeWidth="1.2" />
            <path d="M10 10L6 2L12 5L15 8Z" fill="#94a3b8" opacity="0.8" />
            <path d="M20 10L24 2L18 5L15 8Z" fill="#64748b" opacity="0.8" />
            <text x="15" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#cbd5e1" fontFamily="sans-serif">2</text>
        </svg>
    )
}

function BronzeMedalIconSm() {
    return (
        <svg width="16" height="18" viewBox="0 0 30 34" fill="none">
            <circle cx="15" cy="20" r="12" fill="rgba(251,146,60,0.1)" stroke="#fb923c" strokeWidth="1.2" />
            <path d="M10 10L6 2L12 5L15 8Z" fill="#ea7c3a" opacity="0.8" />
            <path d="M20 10L24 2L18 5L15 8Z" fill="#c2601e" opacity="0.8" />
            <text x="15" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fb923c" fontFamily="sans-serif">3</text>
        </svg>
    )
}

function TrophyIconSvg() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 15c-3.314 0-6-2.686-6-6V4h12v5c0 3.314-2.686 6-6 6z" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M12 15v4M9 19h6" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function StarIconSvg() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(245,158,11,0.1)" />
        </svg>
    )
}

function UsersIconSvg() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="7" r="4" stroke="#818cf8" strokeWidth="1.5" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function LockIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <CrownIconSm />
    if (rank === 2) return <SilverMedalIconSm />
    if (rank === 3) return <BronzeMedalIconSm />
    return (
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>
            #{rank}
        </span>
    )
}

function StreakColor(rank: number) {
    if (rank === 1) return "#fbbf24"
    if (rank === 2) return "#cbd5e1"
    if (rank === 3) return "#fb923c"
    return "rgba(255,255,255,0.7)"
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StreakPage() {
    const { data: session } = useSession()
    const [streak, setStreak] = useState<StreakData | null>(null)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)
    const [newBadges, setNewBadges] = useState<number[]>([])
    const [activeBadgeIndex, setActiveBadgeIndex] = useState<number | null>(null)
    const [justClaimed, setJustClaimed] = useState(false)
    const [lastPointsEarned, setLastPointsEarned] = useState<number | null>(null)
    const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [streakRes, leaderRes] = await Promise.all([
                fetch("/api/streak"),
                fetch("/api/streak/leaderboard"),
            ])
            const [streakData, leaderData] = await Promise.all([streakRes.json(), leaderRes.json()])
            setStreak(streakData)
            setLeaderboard(leaderData)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (session?.user?.id) fetchData()
    }, [session?.user?.id, fetchData])

    const handleClaim = async () => {
        if (!streak || streak.alreadyClaimed || claiming) return
        setClaiming(true)
        try {
            const res = await fetch("/api/streak/claim", { method: "POST" })
            const data = await res.json()
            if (!data.alreadyClaimed) {
                setStreak({
                    currentStreak: data.streak.currentStreak,
                    longestStreak: data.streak.longestStreak,
                    totalActiveDays: data.streak.totalActiveDays,
                    lastClaimedAt: data.streak.lastClaimedAt,
                    alreadyClaimed: true,
                    badges: data.badges,
                    nextMilestone: data.nextMilestone,
                    daysToNext: data.daysToNext,
                })
                if (data.newBadges?.length) {
                    setNewBadges(data.newBadges)
                    setActiveBadgeIndex(0)
                }
                setLastPointsEarned(data.pointsEarned ?? null)
                setJustClaimed(true)
                setTimeout(() => { setJustClaimed(false); setLastPointsEarned(null) }, 3500)
            }
        } finally {
            setClaiming(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-neutral-500 text-sm">Memuat data streak…</span>
                </div>
            </div>
        )
    }

    if (!streak) return null

    const earnedMilestones = streak.badges.map((b) => b.milestone)
    const claimedToday = streak.alreadyClaimed

    return (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-5">

            {/* ── Badge Unlock Modal ── */}
            <BadgeUnlockModal
                isOpen={activeBadgeIndex !== null && newBadges.length > 0}
                onClose={() => {
                    if (activeBadgeIndex !== null && activeBadgeIndex + 1 < newBadges.length) {
                        setActiveBadgeIndex(activeBadgeIndex + 1)
                    } else {
                        setActiveBadgeIndex(null)
                        setTimeout(() => setNewBadges([]), 500)
                    }
                }}
                milestone={newBadges[activeBadgeIndex ?? 0] ?? 0}
            />

            {/* ── Points Toast ── */}
            <AnimatePresence>
                {justClaimed && lastPointsEarned !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.95 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl"
                        style={{ background: "rgba(20,15,5,0.95)", border: "1px solid rgba(251,191,36,0.35)", backdropFilter: "blur(12px)" }}
                    >
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-white">
                            +{lastPointsEarned} <span className="text-amber-400">Memory Points</span> didapat!
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Badge Toast ── */}
            <AnimatePresence>
                {newBadges.map((m) => (
                    <motion.div
                        key={m}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.95 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-amber-500/30 shadow-xl"
                        style={{ background: "rgba(20,15,5,0.92)", backdropFilter: "blur(12px)" }}
                    >
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-sm font-semibold text-white">
                            🎉 Badge baru! <span className="text-amber-400">Streak {m} Hari</span> diraih!
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* ── Page Header ── */}
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <FlameIcon size={18} />
                        <h1 className="text-2xl font-extrabold text-white" style={{ letterSpacing: "-0.5px" }}>
                            Daily Streak
                        </h1>
                    </div>
                    <Link
                        href="/shop"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.03] relative overflow-hidden group"
                        style={{
                            background: "rgba(251,191,36,0.08)",
                            border: "1px solid rgba(251,191,36,0.25)",
                            color: "#fbbf24",
                        }}
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(251,191,36,0.08)" }} />
                        <ShoppingBag className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Memory Shop</span>
                    </Link>
                </div>
                <p className="text-sm text-neutral-500">Login setiap hari untuk membangun streak dan kumpulkan poin nya</p>
            </motion.div>

            {/* ── Hero Banner ── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
                <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{ boxShadow: "0 20px 60px rgba(180,60,0,0.3)" }}
                >
                    {/* Background gradient */}
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(135deg, #7c1d06 0%, #b83200 30%, #ea580c 65%, #f97316 100%)",
                    }} />

                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                        style={{
                            background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)",
                            transform: "translate(30%, -30%)",
                        }} />
                    <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full pointer-events-none"
                        style={{
                            background: "radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)",
                            transform: "translate(-30%, 30%)",
                        }} />

                    {/* Content */}
                    <div className="relative px-6 sm:px-8 pt-7">
                        {/* Top row: flame + number + stats */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">

                            {/* Left: flame icon + streak number */}
                            <div className="flex items-end gap-5">
                                <div
                                    className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: "rgba(0,0,0,0.25)",
                                        border: "1px solid rgba(255,255,255,0.15)",
                                    }}
                                >
                                    <HeroFlameIcon />
                                </div>
                                <div>
                                    <p className="text-white/65 text-[11px] font-semibold mb-1">Streak saat ini</p>
                                    <p
                                        className="text-white leading-none font-black"
                                        style={{ fontSize: 72, letterSpacing: "-3px" }}
                                    >
                                        {streak.currentStreak}
                                    </p>
                                    <p className="text-white/70 text-sm font-semibold mt-1">hari berturut-turut</p>
                                </div>
                            </div>

                            {/* Right: stat chips */}
                            <div className="flex flex-col gap-2 items-end">
                                {[
                                    { value: streak.longestStreak, label: "Terpanjang" },
                                    { value: streak.totalActiveDays, label: "Total Hari" },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="px-5 py-2.5 rounded-xl text-center w-[115px]"
                                        style={{
                                            background: "rgba(0,0,0,0.25)",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                        }}
                                    >
                                        <p className="text-white font-black text-xl">{s.value}</p>
                                        <p className="text-white/55 text-[9px] uppercase tracking-widest mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom row: status + claim button */}
                        <div
                            className="mt-5 pt-4 pb-6 flex items-center justify-between gap-3"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {claimedToday ? (
                                        <>
                                            <span className="text-sm font-semibold text-green-200">Anda sudah aktif hari ini!</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse flex-shrink-0" />
                                            <span className="text-sm font-semibold text-white/90">Belum klaim streakmu hari ini</span>
                                        </>
                                    )}
                                </div>
                                {streak.daysToNext !== null && streak.daysToNext > 0 && (
                                    <p className="text-xs font-semibold mt-1" style={{ color: "rgba(255,220,160,0.9)" }}>
                                        {streak.daysToNext} hari lagi untuk badge {streak.nextMilestone} Hari
                                    </p>
                                )}
                            </div>

                            {/* Claim button — inside hero */}
                            <button
                                onClick={handleClaim}
                                disabled={claimedToday || claiming}
                                className="flex-shrink-0 flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-[14px] text-sm font-bold transition-all disabled:cursor-not-allowed"
                                style={{
                                    background: claimedToday ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.15)",
                                    border: claimedToday ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.25)",
                                    color: claimedToday ? "rgba(255,255,255,0.45)" : "#fff",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                {claiming ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Mengklaim…</span></>
                                ) : claimedToday ? (
                                    <>
                                        <span>Sudah diklaim</span>
                                    </>
                                ) : (
                                    <>
                                        <FlameIcon size={15} />
                                        <span>Klaim Hari Ini</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Grid: Milestone + Badge ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Milestone Progress (3/5) */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="lg:col-span-3 rounded-2xl border border-white/[0.06] p-5"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <TrophyIconSvg />
                        <h2 className="font-bold text-white text-[11px] uppercase tracking-widest">Milestone Progress</h2>
                        <span className="ml-auto text-xs text-neutral-500">{earnedMilestones.length}/4 badge</span>
                    </div>

                    <div className="flex flex-col gap-5">
                        {MILESTONES.map((m) => {
                            const earned = earnedMilestones.includes(m.days)
                            const progress = Math.min((streak.currentStreak / m.days) * 100, 100)
                            const remaining = Math.max(m.days - streak.currentStreak, 0)

                            return (
                                <div key={m.days} className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div
                                        className="w-[38px] h-[38px] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{
                                            background: earned ? m.iconColor : "rgba(255,255,255,0.04)",
                                            border: earned ? `1px solid ${m.iconBorder}` : "1px solid rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        {m.icon}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-sm font-bold ${earned ? "text-white" : "text-neutral-400"}`}>
                                                {m.label}
                                            </span>
                                            <span className="text-[11px] text-neutral-600">{m.days} hari</span>
                                        </div>
                                        <p className="text-[11px] text-neutral-600 mb-2">{m.desc}</p>

                                        {/* Progress bar */}
                                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: m.barColor }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-neutral-600">
                                                {streak.currentStreak}/{m.days} hari
                                            </span>
                                            {earned ? (
                                                <span className="text-[10px] font-bold text-green-400">✓ Diraih!</span>
                                            ) : (
                                                <span className="text-[10px] text-neutral-600">Sisa {remaining} hari</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Badge Saya (2/5) */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="lg:col-span-2 rounded-2xl border border-white/[0.06] p-5 flex flex-col"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <StarIconSvg />
                        <h2 className="font-bold text-white text-[11px] uppercase tracking-widest">Badge Saya</h2>
                        <span
                            className="ml-auto text-xs px-2 py-0.5 rounded-full"
                            style={{
                                background: "rgba(245,158,11,0.12)",
                                color: "#f59e0b",
                                border: "1px solid rgba(245,158,11,0.2)",
                            }}
                        >
                            {earnedMilestones.length} Badge
                        </span>
                    </div>

                    {earnedMilestones.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                            <div className="w-16 h-16 rounded-2xl border border-dashed border-white/10 flex items-center justify-center mb-3">
                                <Medal className="w-7 h-7 text-neutral-700" />
                            </div>
                            <p className="text-sm text-neutral-500 font-medium">Belum Ada Badge</p>
                            <p className="text-xs text-neutral-700 mt-1">Login setiap hari untuk mendapat badge!</p>
                        </div>
                    ) : (
                        /* Show all 4 milestones — earned ones bright, locked ones dimmed */
                        <div className="grid grid-cols-2 gap-3 flex-1">
                            {MILESTONES.map((m) => {
                                const earned = earnedMilestones.includes(m.days)
                                const badge = streak.badges.find((b) => b.milestone === m.days)

                                return earned ? (
                                    <div
                                        key={m.days}
                                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-[14px] border text-center"
                                        style={{ background: m.badgeBg, borderColor: m.badgeBorder }}
                                    >
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center"
                                            style={{ background: m.badgeIconBg }}
                                        >
                                            {m.badgeIcon}
                                        </div>
                                        <p className="text-[11px] font-bold text-white leading-tight">{m.label}</p>
                                        {badge && (
                                            <p className="text-[9px] text-neutral-500">
                                                {new Date(badge.earnedAt).toLocaleDateString("id-ID", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        key={m.days}
                                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-[14px] border text-center"
                                        style={{
                                            background: "rgba(255,255,255,0.02)",
                                            borderColor: "rgba(255,255,255,0.07)",
                                            opacity: 0.45,
                                        }}
                                    >
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center"
                                            style={{ background: "rgba(255,255,255,0.05)" }}
                                        >
                                            <LockIcon />
                                        </div>
                                        <p className="text-[11px] font-bold leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>
                                            {m.label}
                                        </p>
                                        <p className="text-[9px] text-neutral-600">{m.days} hari</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Top Streakers ── */}
            {leaderboard.length > 0 && (
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="rounded-2xl border border-white/[0.06] p-5"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <UsersIconSvg />
                        <h2 className="font-bold text-white text-[11px] uppercase tracking-widest">Top Streakers</h2>
                        <span className="ml-auto text-xs text-neutral-500">Streak terpanjang</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        {leaderboard.slice(0, 5).map((entry) => {
                            const isMe = entry.userId === session?.user?.id
                            const streakColor = StreakColor(entry.rank)

                            return (
                                <motion.div
                                    key={entry.userId}
                                    whileHover={{ x: 3, transition: { type: "spring", stiffness: 400, damping: 28 } }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                                    style={{
                                        background: isMe ? "rgba(99,102,241,0.08)" : "transparent",
                                        border: isMe ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                                    }}
                                >
                                    {/* Rank icon */}
                                    <div className="w-7 flex items-center justify-center flex-shrink-0">
                                        <RankIcon rank={entry.rank} />
                                    </div>

                                    {/* Avatar */}
                                    <div
                                        className="w-[34px] h-[34px] rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                                        style={{
                                            background: "rgba(255,255,255,0.06)",
                                            border: "1px solid rgba(255,255,255,0.09)",
                                        }}
                                    >
                                        {entry.image ? (
                                            <img src={entry.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-white">
                                                {entry.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${entry.userId}`} className="group flex items-center gap-1.5">
                                            <span 
                                                className={`text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate ${entry.equippedDecoration ? getDecorationClass(entry.equippedDecoration.name) : ""}`}
                                                style={entry.equippedDecoration ? (() => { try { return JSON.parse(entry.equippedDecoration.value) } catch { return {} } })() : {}}
                                            >
                                                {entry.name}
                                            </span>
                                            {isMe && (
                                                <span
                                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                                                    style={{
                                                        background: "rgba(99,102,241,0.2)",
                                                        color: "#a5b4fc",
                                                        border: "1px solid rgba(99,102,241,0.3)",
                                                    }}
                                                >
                                                    Kamu
                                                </span>
                                            )}
                                        </Link>
                                    </div>

                                    {/* Streak */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <FlameIcon size={13} />
                                        <span className="text-sm font-bold" style={{ color: streakColor }}>
                                            {entry.longestStreak}
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {leaderboard.length > 5 && (
                        <button
                            onClick={() => setIsLeaderboardModalOpen(true)}
                            className="mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group"
                            style={{
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.5)",
                                background: "transparent",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                                e.currentTarget.style.color = "#fff"
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent"
                                e.currentTarget.style.color = "rgba(255,255,255,0.5)"
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                            }}
                        >
                            Lihat Semua Leaderboard
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </motion.div>
            )}

            <LeaderboardModal
                isOpen={isLeaderboardModalOpen}
                onClose={() => setIsLeaderboardModalOpen(false)}
                leaderboard={leaderboard}
                currentUserId={session?.user?.id}
            />
        </div>
    )
}