"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Calendar, Zap, Medal, Star, Crown, Users, ChevronRight, Loader2, CheckCircle2, ShoppingBag, BadgeCheck, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { BadgeUnlockModal } from "@/components/ui/BadgeUnlockModal"
import { LeaderboardModal } from "@/components/ui/LeaderboardModal"
import { formatDate } from "@/lib/utils"

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
    isVerified?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MILESTONES = [
    {
        days: 7,
        label: "Baru Panas",
        desc: "Login 7 hari berturut-turut",
        barColor: "#FFFF00", // Yellow
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z" fill="#000" />
            </svg>
        ),
        badgeBg: "#FFFF00",
    },
    {
        days: 30,
        label: "Menyala Terus",
        desc: "Login 30 hari berturut-turut",
        barColor: "#FF9900", // Orange
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#000" strokeWidth="2" strokeLinejoin="round" fill="#FF9900" />
            </svg>
        ),
        badgeBg: "#FF9900",
    },
    {
        days: 60,
        label: "Anti Kendor",
        desc: "Login 60 hari berturut-turut",
        barColor: "#FF0000", // Red
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#000" strokeWidth="2" fill="#FF0000"/>
                <path d="M8 12l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        badgeBg: "#FF0000",
    },
    {
        days: 90,
        label: "GOAT Streak",
        desc: "Login 90 hari berturut-turut",
        barColor: "#FF00FF", // Pink
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 3h14l2 4-9 13L3 7z" stroke="#000" strokeWidth="2" strokeLinejoin="round" fill="#FF00FF" />
            </svg>
        ),
        badgeBg: "#FF00FF",
    },
]

// ─── Fade-up animation ────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 20 } },
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function FlameIcon({ size = 16, className }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z" stroke="#000" strokeWidth="2" fill="#FF4500" />
        </svg>
    )
}

function HeroFlameIcon() {
    return (
        <svg width="40" height="44" viewBox="0 0 36 44" fill="none">
            <path
                d="M18 2C13 12 6 16 6 26a12 12 0 0 0 24 0c0-6-3-11-6-15C22 16 21 20 18 22c-1-5-3-9 0-20z"
                fill="#FFFF00"
                stroke="#000"
                strokeWidth="2"
            />
            <path
                d="M18 12C15 18 10 22 10 28a8 8 0 0 0 16 0c0-4-2-8-4-11C21 19 20 22 18 24c-1-3-2-6 0-12z"
                fill="#FF0000"
            />
        </svg>
    )
}

function CrownIconSm() {
    return (
        <svg width="20" height="18" viewBox="0 0 38 32" fill="none">
            <path d="M3 26L6 10L13 18L19 4L25 18L32 10L35 26Z" fill="#FFFF00" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
            <rect x="3" y="25" width="32" height="5" rx="0" fill="#FFFF00" stroke="#000" strokeWidth="2" />
        </svg>
    )
}

function SilverMedalIconSm() {
    return (
        <svg width="18" height="20" viewBox="0 0 30 34" fill="none">
            <circle cx="15" cy="20" r="12" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
            <path d="M10 10L6 2L12 5L15 8Z" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
            <path d="M20 10L24 2L18 5L15 8Z" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
            <text x="15" y="25" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000" fontFamily="sans-serif">2</text>
        </svg>
    )
}

function BronzeMedalIconSm() {
    return (
        <svg width="18" height="20" viewBox="0 0 30 34" fill="none">
            <circle cx="15" cy="20" r="12" fill="#FF9900" stroke="#000" strokeWidth="2" />
            <path d="M10 10L6 2L12 5L15 8Z" fill="#FF9900" stroke="#000" strokeWidth="2" />
            <path d="M20 10L24 2L18 5L15 8Z" fill="#FF9900" stroke="#000" strokeWidth="2" />
            <text x="15" y="25" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000" fontFamily="sans-serif">3</text>
        </svg>
    )
}

function LockIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="0" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <CrownIconSm />
    if (rank === 2) return <SilverMedalIconSm />
    if (rank === 3) return <BronzeMedalIconSm />
    return (
        <span className="text-[13px] font-black text-black/40">
            #{rank}
        </span>
    )
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
    const [premiumInfo, setPremiumInfo] = useState<{ isPremium: boolean; multiplier: number; freezesRemaining: number } | null>(null)

    // Freeze confirmation state
    const [showFreezeConfirm, setShowFreezeConfirm] = useState(false)
    const [freezeConfirmData, setFreezeConfirmData] = useState<{ currentStreak: number; freezesRemaining: number } | null>(null)

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
        if (session?.user?.id) {
            fetchData()
            fetch("/api/premium/status")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setPremiumInfo({
                            isPremium: data.isPremium,
                            multiplier: data.isPremium ? 2 : 1,
                            freezesRemaining: data.streakFreezesRemaining ?? 0,
                        })
                    }
                })
                .catch(() => {})
        }
    }, [session?.user?.id, fetchData])

    const handleClaim = async (useFreeze?: boolean) => {
        if (!streak || streak.alreadyClaimed || claiming) return
        setClaiming(true)
        try {
            const res = await fetch("/api/streak/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ useFreeze: useFreeze === true }),
            })
            const data = await res.json()

            // API asks for freeze confirmation
            if (data.needsFreezeConfirmation) {
                setFreezeConfirmData({
                    currentStreak: data.currentStreak,
                    freezesRemaining: data.freezesRemaining,
                })
                setShowFreezeConfirm(true)
                return
            }

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

                // Update freeze count if a freeze was used
                if (data.freezeUsed && premiumInfo) {
                    setPremiumInfo(prev => prev ? { ...prev, freezesRemaining: data.streakFreezesRemaining ?? 0 } : prev)
                }
            }
        } finally {
            setClaiming(false)
        }
    }

    // User confirms using freeze
    const handleFreezeConfirm = async () => {
        setShowFreezeConfirm(false)
        setFreezeConfirmData(null)
        await handleClaim(true)
    }

    // User declines freeze — streak resets, but still claim today
    const handleFreezeDecline = async () => {
        setShowFreezeConfirm(false)
        setFreezeConfirmData(null)
        // Claim without freeze — will reset streak to 1
        setClaiming(true)
        try {
            const res = await fetch("/api/streak/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ useFreeze: false, skipFreeze: true }),
            })
            const data = await res.json()
            if (!data.alreadyClaimed && !data.needsFreezeConfirmation) {
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
                    <Loader2 className="w-8 h-8 text-black animate-spin" />
                    <span className="text-black font-black uppercase text-sm">Memuat data streak…</span>
                </div>
            </div>
        )
    }

    if (!streak) return null

    const earnedMilestones = streak.badges.map((b) => b.milestone)
    const claimedToday = streak.alreadyClaimed

    return (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 pb-32">

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
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-[#FFFF00] border-[4px] border-black shadow-[8px_8px_0_#000]"
                    >
                        <Star className="w-6 h-6 text-black fill-black" />
                        <span className="text-base font-black text-black uppercase tracking-wide">
                            +{lastPointsEarned} <span className="text-[#FF00FF]">Memory Points</span> didapat!
                            {premiumInfo?.isPremium && <span className="text-[#00FF00] ml-2 border-[2px] border-black px-1.5 py-0.5 bg-white">(x2 Premium)</span>}
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
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-[#00FFFF] border-[4px] border-black shadow-[8px_8px_0_#000]"
                    >
                        <Star className="w-6 h-6 text-black fill-black" />
                        <span className="text-base font-black text-black uppercase tracking-wide">
                            🎉 Badge baru! <span className="text-white bg-black px-2 py-0.5 ml-1">Streak {m} Hari</span> diraih!
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* ── Page Header ── */}
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 bg-white border-[3px] border-black px-4 py-2 shadow-[4px_4px_0_#FF4500]">
                        <FlameIcon size={24} />
                        <h1 className="text-2xl font-black text-black uppercase tracking-widest">
                            Daily Streak
                        </h1>
                    </div>
                    <Link
                        href="/shop"
                        className="flex items-center gap-2 px-5 py-3 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all uppercase"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Memory Shop</span>
                    </Link>
                </div>
                <p className="text-sm font-bold text-black/60 mt-2">Login setiap hari untuk membangun streak dan kumpulkan poin nya</p>
                
                {/* Premium Status Indicators */}
                {premiumInfo?.isPremium && (
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-[#FFFF00] border-[2px] border-black text-black shadow-[2px_2px_0_#000]">
                            <Sparkles className="w-4 h-4 fill-black" />
                            x{premiumInfo.multiplier} Poin
                        </span>
                        {premiumInfo.freezesRemaining > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-[#00FFFF] border-[2px] border-black text-black shadow-[2px_2px_0_#000]">
                                <Shield className="w-4 h-4 fill-black" />
                                {premiumInfo.freezesRemaining} Freeze
                            </span>
                        )}
                    </div>
                )}
            </motion.div>

            {/* ── Hero Banner ── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
                <div className="relative border-[4px] border-black bg-[#FF3300] shadow-[8px_8px_0_#000] overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(black 2px, transparent 2px)", backgroundSize: "20px 20px" }} />

                    {/* Content */}
                    <div className="relative px-6 sm:px-8 pt-8 pb-6">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 flex-wrap">

                            {/* Left: flame icon + streak number */}
                            <div className="flex items-end gap-5">
                                <div className="w-[88px] h-[88px] bg-white border-[4px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center flex-shrink-0 -rotate-3 hover:rotate-0 transition-transform">
                                    <HeroFlameIcon />
                                </div>
                                <div>
                                    <p className="text-black text-[12px] font-black uppercase tracking-widest mb-1 bg-white border-[2px] border-black px-2 py-0.5 inline-block">Streak saat ini</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-white leading-none font-black" style={{ fontSize: 80, textShadow: "4px 4px 0 #000" }}>
                                            {streak.currentStreak}
                                        </p>
                                        <p className="text-black font-black uppercase tracking-wider text-sm mt-2">Hari</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: stat chips */}
                            <div className="flex flex-row gap-4 items-end">
                                {[
                                    { value: streak.longestStreak, label: "Terpanjang", bg: "#FFFF00" },
                                    { value: streak.totalActiveDays, label: "Total Hari", bg: "#00FFFF" },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="px-5 py-3 border-[3px] border-black shadow-[4px_4px_0_#000] text-center w-[120px]"
                                        style={{ background: s.bg }}
                                    >
                                        <p className="text-black font-black text-3xl">{s.value}</p>
                                        <p className="text-black text-[10px] font-black uppercase tracking-widest mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom row: status + claim button */}
                        <div className="mt-8 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t-[4px] border-black">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    {claimedToday ? (
                                        <span className="text-sm font-black text-black bg-[#00FF00] border-[2px] border-black px-3 py-1 uppercase tracking-wider">Sudah Aktif Hari Ini!</span>
                                    ) : (
                                        <>
                                            <span className="w-3 h-3 border-[2px] border-black bg-[#FFFF00] animate-pulse flex-shrink-0 shadow-[1px_1px_0_#000]" />
                                            <span className="text-sm font-black text-white uppercase tracking-wider text-shadow-sm">Belum klaim streakmu hari ini</span>
                                        </>
                                    )}
                                </div>
                                {streak.daysToNext !== null && streak.daysToNext > 0 && (
                                    <p className="text-[11px] font-black mt-2 text-white bg-black px-2 py-0.5 inline-block uppercase">
                                        {streak.daysToNext} hari lagi untuk badge {streak.nextMilestone} Hari
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => handleClaim()}
                                disabled={claimedToday || claiming}
                                className={`flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wider border-[3px] border-black transition-all ${
                                    claimedToday 
                                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-[4px_4px_0_#000]" 
                                    : "bg-[#FFFF00] text-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]"
                                }`}
                            >
                                {claiming ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Mengklaim…</span></>
                                ) : claimedToday ? (
                                    <span>Sudah diklaim</span>
                                ) : (
                                    <>
                                        <FlameIcon size={18} />
                                        <span>Klaim Hari Ini</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Freeze Confirmation Dialog ── */}
            <AnimatePresence>
                {showFreezeConfirm && freezeConfirmData && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setShowFreezeConfirm(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.88, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.88, y: 20 }}
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            className="relative w-full max-w-sm overflow-hidden bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                        >
                            <div className="p-6">
                                {/* Icon */}
                                <div className="w-14 h-14 bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center mb-5">
                                    <Shield className="w-7 h-7 text-black fill-black" />
                                </div>

                                {/* Text */}
                                <h3 className="text-[18px] font-black text-black uppercase mb-2 leading-snug">
                                    Gunakan Streak Freeze?
                                </h3>
                                <p className="text-sm text-neutral-600 font-bold leading-relaxed mb-2">
                                    Kamu melewatkan 1 hari! Streak-mu saat ini <span className="text-black bg-[#FFFF00] border-[2px] border-black px-1.5 py-0.5 font-black inline-block mx-0.5">{freezeConfirmData.currentStreak} hari</span> akan direset ke 1 jika tidak menggunakan freeze.
                                </p>
                                <div className="flex items-center gap-2 mb-6 mt-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest bg-[#00FFFF] border-[2px] border-black text-black shadow-[2px_2px_0_#000]">
                                        <Shield className="w-3.5 h-3.5 fill-black" />
                                        {freezeConfirmData.freezesRemaining} Freeze tersisa bulan ini
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleFreezeConfirm}
                                        disabled={claiming}
                                        className="w-full py-3 text-sm font-black text-black uppercase bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Shield className="w-4 h-4" />
                                        {claiming ? "Menggunakan..." : "Ya, Gunakan Freeze"}
                                    </button>
                                    <button
                                        onClick={handleFreezeDecline}
                                        disabled={claiming}
                                        className="w-full py-3 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:bg-[#FF3300] hover:text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                    >
                                        {claiming ? "Mengklaim..." : "Tidak, Reset Streak Saja"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Grid: Milestone + Badge ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Milestone Progress (3/5) */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="lg:col-span-3 bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#FF00FF] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-black text-black text-[15px] uppercase tracking-widest">Milestone Progress</h2>
                        <span className="ml-auto text-[11px] font-black bg-[#FFFF00] border-[2px] border-black px-2 py-1 uppercase">{earnedMilestones.length}/4 badge</span>
                    </div>

                    <div className="flex flex-col gap-6">
                        {MILESTONES.map((m) => {
                            const earned = earnedMilestones.includes(m.days)
                            const progress = Math.min((streak.currentStreak / m.days) * 100, 100)
                            const remaining = Math.max(m.days - streak.currentStreak, 0)

                            return (
                                <div key={m.days} className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div
                                        className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border-[3px] border-black ${earned ? 'shadow-[3px_3px_0_#000]' : ''}`}
                                        style={{ background: earned ? m.badgeBg : "#E5E5E5" }}
                                    >
                                        {earned ? m.icon : <LockIcon />}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-base font-black uppercase tracking-wide ${earned ? "text-black" : "text-black/40"}`}>
                                                {m.label}
                                            </span>
                                            <span className="text-[11px] font-black text-black/60 uppercase">{m.days} hari</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-black/50 mb-3">{m.desc}</p>

                                        {/* Progress bar */}
                                        <div className="h-3 w-full border-[2px] border-black bg-white overflow-hidden shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
                                            <motion.div
                                                className="h-full border-r-[2px] border-black"
                                                style={{ background: m.barColor }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[11px] font-black text-black uppercase">
                                                {streak.currentStreak} / {m.days} hari
                                            </span>
                                            {earned ? (
                                                <span className="text-[11px] font-black text-black bg-[#00FF00] border-[2px] border-black px-2 py-0.5 uppercase">✓ Diraih!</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-black/50 uppercase">Sisa {remaining} hari</span>
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
                    className="lg:col-span-2 bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-6 flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                            <Star className="w-5 h-5 text-black fill-black" />
                        </div>
                        <h2 className="font-black text-black text-[15px] uppercase tracking-widest">Badge Saya</h2>
                        <span className="ml-auto text-[11px] font-black bg-black text-white px-2 py-1 uppercase">{earnedMilestones.length} Badge</span>
                    </div>

                    {earnedMilestones.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 bg-[#E5E5E5] border-[3px] border-black">
                            <Medal className="w-10 h-10 text-black mb-3" />
                            <p className="text-sm text-black font-black uppercase">Belum Ada Badge</p>
                            <p className="text-xs font-bold text-black/60 mt-1">Login setiap hari untuk mendapat badge!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            {MILESTONES.map((m) => {
                                const earned = earnedMilestones.includes(m.days)
                                const badge = streak.badges.find((b) => b.milestone === m.days)

                                return earned ? (
                                    <div
                                        key={m.days}
                                        className="flex flex-col items-center justify-center gap-2 p-4 border-[3px] border-black text-center shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all cursor-default"
                                        style={{ background: m.badgeBg }}
                                    >
                                        <div className="w-12 h-12 border-[2px] border-black bg-white flex items-center justify-center mb-1">
                                            {m.icon}
                                        </div>
                                        <p className="text-[12px] font-black text-black leading-tight uppercase">{m.label}</p>
                                        {badge && (
                                            <p className="text-[10px] font-bold text-black/60 bg-white border-[1px] border-black px-1.5 mt-1">
                                                {formatDate(badge.earnedAt)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        key={m.days}
                                        className="flex flex-col items-center justify-center gap-2 p-4 border-[3px] border-black bg-[#E5E5E5] text-center opacity-60"
                                    >
                                        <div className="w-12 h-12 border-[2px] border-black bg-white flex items-center justify-center mb-1">
                                            <LockIcon />
                                        </div>
                                        <p className="text-[12px] font-black text-black/40 leading-tight uppercase">{m.label}</p>
                                        <p className="text-[10px] font-bold text-black/40">{m.days} hari</p>
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
                    className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                            <Users className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="font-black text-black text-[15px] uppercase tracking-widest">Top Streakers</h2>
                        <span className="ml-auto text-[11px] font-black bg-black text-white px-3 py-1 uppercase">Streak terpanjang</span>
                    </div>

                    <div className="flex flex-col">
                        {leaderboard.slice(0, 5).map((entry, index) => {
                            const isMe = entry.userId === session?.user?.id

                            return (
                                <motion.div
                                    key={entry.userId}
                                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 28 } }}
                                    className={`flex items-center gap-4 px-4 py-3 transition-all border-b-[3px] border-black last:border-b-0 ${isMe ? "bg-[#FFFF00]" : "hover:bg-[#FFFDF0]"}`}
                                >
                                    {/* Rank icon */}
                                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                                        <RankIcon rank={entry.rank} />
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 border-[3px] border-black flex-shrink-0 overflow-hidden flex items-center justify-center bg-white">
                                        {entry.image ? (
                                            <img src={entry.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-black text-black">
                                                {entry.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${entry.userId}`} className="group flex items-center gap-2 min-w-0">
                                            <div className="flex items-center gap-1 truncate">
                                                <span className="text-sm font-black text-black uppercase group-hover:underline truncate">
                                                    {entry.name}
                                                </span>
                                                {entry.isVerified && <BadgeCheck className="w-4 h-4 text-black shrink-0 fill-[#00FFFF]" />}
                                            </div>
                                            {isMe && (
                                                <span className="text-[9px] px-2 py-0.5 border-[2px] border-black bg-[#FF00FF] text-white font-black uppercase flex-shrink-0 shadow-[2px_2px_0_#000]">
                                                    Kamu
                                                </span>
                                            )}
                                        </Link>
                                    </div>

                                    {/* Streak */}
                                    <div className="flex items-center gap-2 flex-shrink-0 bg-[#FF3300] border-[2px] border-black px-3 py-1 shadow-[2px_2px_0_#000]">
                                        <FlameIcon size={14} />
                                        <span className="text-sm font-black text-white">
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
                            className="mt-6 w-full py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white border-[3px] border-black text-black shadow-[4px_4px_0_#000] hover:bg-[#FFFF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]"
                        >
                            Lihat Semua Leaderboard
                            <ChevronRight className="w-5 h-5" />
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