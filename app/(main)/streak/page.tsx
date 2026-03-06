"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Trophy, Calendar, Zap, Medal, Star, Crown, Users, ChevronRight, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { BadgeUnlockModal } from "@/components/ui/BadgeUnlockModal"

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
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MILESTONES = [
    { days: 7, label: "Baru Panas", desc: "Login 7 hari berturut-turut", icon: Flame, color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)" },
    { days: 30, label: "Menyala Terus", desc: "Login 30 hari berturut-turut", icon: Zap, color: "from-indigo-500 to-violet-500", glow: "rgba(99,102,241,0.3)" },
    { days: 60, label: "Anti Kendor", desc: "Login 60 hari berturut-turut", icon: Medal, color: "from-emerald-500 to-teal-500", glow: "rgba(16,185,129,0.3)" },
    { days: 90, label: "GOAT Streak", desc: "Login 90 hari berturut-turut", icon: Crown, color: "from-rose-500 to-pink-500", glow: "rgba(244,63,94,0.3)" },
]

// ─── Fade-up animation variant ───────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
}

// ─── Helper: rank color ───────────────────────────────────────────────────────
function rankStyle(rank: number) {
    if (rank === 1) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }
    if (rank === 2) return { color: "#9ca3af", bg: "rgba(156,163,175,0.10)" }
    if (rank === 3) return { color: "#cd7c3e", bg: "rgba(205,124,62,0.12)" }
    return { color: "#6b7280", bg: "transparent" }
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
                    setActiveBadgeIndex(0) // Show modal for the first new badge
                }
                setJustClaimed(true)
                setTimeout(() => setJustClaimed(false), 3500)
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">

            {/* ── Badge Unlock Celebration Modal ── */}
            <BadgeUnlockModal
                isOpen={activeBadgeIndex !== null && newBadges.length > 0}
                onClose={() => {
                    // After one modal closes, check if there are other new badges
                    if (activeBadgeIndex !== null && activeBadgeIndex + 1 < newBadges.length) {
                        setActiveBadgeIndex(activeBadgeIndex + 1)
                    } else {
                        setActiveBadgeIndex(null)
                        // Clean up once all are shown
                        setTimeout(() => setNewBadges([]), 500)
                    }
                }}
                milestone={newBadges[activeBadgeIndex ?? 0] ?? 0}
            />

            {/* ── Badge milestone toast (Mini notification) ──────────────── */}
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

            {/* ── Header ────────────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Daily Streak
                    </h1>
                </div>
                <p className="text-sm text-neutral-500">Login setiap hari untuk membangun streak-mu</p>
            </motion.div>

            {/* ── Hero Banner ───────────────────────────────────────────────── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
                <div
                    className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
                    style={{
                        background: "linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 100%)",
                        boxShadow: "0 20px 60px rgba(234,88,12,0.35)",
                    }}
                >
                    {/* Decorative orbs */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.12]"
                        style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(30%, -30%)" }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.08]"
                        style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(-30%, 30%)" }} />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        {/* Left: flame + streak count */}
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                                <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-sm font-medium mb-1">Streak saat ini</p>
                                <p className="text-6xl sm:text-7xl font-black text-white leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {streak.currentStreak}
                                </p>
                                <p className="text-white/80 text-sm mt-1 font-medium">hari berturut-turut</p>
                            </div>
                        </div>

                        {/* Right: stats chips */}
                        <div className="flex sm:flex-col gap-3 sm:items-end">
                            <div className="px-5 py-3 rounded-xl text-center flex-1 sm:flex-none sm:min-w-[120px]"
                                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                                <p className="text-white font-black text-2xl" style={{ fontFamily: "'Syne', sans-serif" }}>{streak.longestStreak}</p>
                                <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mt-0.5">Terpanjang</p>
                            </div>
                            <div className="px-5 py-3 rounded-xl text-center flex-1 sm:flex-none sm:min-w-[120px]"
                                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                                <p className="text-white font-black text-2xl" style={{ fontFamily: "'Syne', sans-serif" }}>{streak.totalActiveDays}</p>
                                <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mt-0.5">Total Hari</p>
                            </div>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div className="relative mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {claimedToday ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                                    <span className="text-sm font-semibold text-green-200">Anda sudah aktif hari ini!</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                                    <span className="text-sm font-semibold text-white/90">Belum klaim streakmu hari ini</span>
                                </>
                            )}
                        </div>
                        {streak.daysToNext !== null && streak.daysToNext > 0 && (
                            <span className="text-sm font-semibold" style={{ color: "rgba(255,220,180,1)" }}>
                                {streak.daysToNext} hari lagi untuk badge {streak.nextMilestone} Hari
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── Tombol Klaim ──────────────────────────────────────────────── */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex justify-start">
                <button
                    onClick={handleClaim}
                    disabled={claimedToday || claiming}
                    className="relative group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                    style={{
                        background: claimedToday
                            ? "rgba(255,255,255,0.05)"
                            : "linear-gradient(135deg, #ea580c, #f97316)",
                        border: claimedToday ? "1px solid rgba(255,255,255,0.08)" : "none",
                        boxShadow: claimedToday ? "none" : "0 8px 30px rgba(234,88,12,0.4)",
                    }}
                >
                    {!claimedToday && (
                        <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-2xl" />
                    )}
                    {claiming ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Mengklaim…</span></>
                    ) : claimedToday ? (
                        <><CheckCircle2 className="w-5 h-5 text-green-400" /><span className="text-neutral-400">Sudah diklaim hari ini</span></>
                    ) : (
                        <>
                            <Flame className="w-5 h-5" />
                            <span>Klaim Streak Hari Ini</span>
                            <AnimatePresence>
                                {justClaimed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: 4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-green-300 text-sm"
                                    >+1</motion.span>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </button>
            </motion.div>

            {/* ── Grid: Milestone + Badge ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Milestone Progress (3/5 wide) */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="lg:col-span-3 rounded-2xl border border-white/[0.06] p-5"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <h2 className="font-bold text-white text-sm uppercase tracking-widest">Milestone Progress</h2>
                        <span className="ml-auto text-xs text-neutral-500">{earnedMilestones.length}/4 badge</span>
                    </div>

                    <div className="flex flex-col gap-4">
                        {MILESTONES.map((m) => {
                            const earned = earnedMilestones.includes(m.days)
                            const progress = Math.min((streak.currentStreak / m.days) * 100, 100)
                            const remaining = Math.max(m.days - streak.currentStreak, 0)
                            const Icon = m.icon
                            return (
                                <div key={m.days} className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{
                                            background: earned ? `linear-gradient(135deg, ${m.glow.replace("0.3", "0.25")}, transparent)` : "rgba(255,255,255,0.04)",
                                            border: earned ? `1px solid ${m.glow.replace("0.3", "0.4")}` : "1px solid rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        <Icon className={`w-4 h-4 ${earned ? "text-white" : "text-neutral-600"}`} />
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-semibold ${earned ? "text-white" : "text-neutral-400"}`}>{m.label}</span>
                                            <span className="text-xs text-neutral-600">{m.days} hari</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 mb-2">{m.desc}</p>
                                        {/* Progress bar */}
                                        <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-neutral-600">{streak.currentStreak}/{m.days} hari</span>
                                            {earned ? (
                                                <span className="text-[10px] font-semibold text-green-400">✓ Diraih!</span>
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

                {/* Badge Saya (2/5 wide) */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="lg:col-span-2 rounded-2xl border border-white/[0.06] p-5 flex flex-col"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Star className="w-4 h-4 text-amber-400" />
                        <h2 className="font-bold text-white text-sm uppercase tracking-widest">Badge Saya</h2>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
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
                        <div className="grid grid-cols-2 gap-3 flex-1">
                            {MILESTONES.filter((m) => earnedMilestones.includes(m.days)).map((m) => {
                                const Icon = m.icon
                                const badge = streak.badges.find((b) => b.milestone === m.days)!
                                return (
                                    <div
                                        key={m.days}
                                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border"
                                        style={{ background: m.glow.replace("0.3", "0.1"), borderColor: m.glow.replace("0.3", "0.35") }}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ background: `linear-gradient(135deg, ${m.glow.replace("0.3", "0.5")}, transparent)` }}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-[11px] font-bold text-white text-center leading-tight">{m.label}</p>
                                        <p className="text-[9px] text-neutral-500 text-center">
                                            {new Date(badge.earnedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Top Streakers ─────────────────────────────────────────────── */}
            {leaderboard.length > 0 && (
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="rounded-2xl border border-white/[0.06] p-5"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))" }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <h2 className="font-bold text-white text-sm uppercase tracking-widest">Top Streakers</h2>
                        <span className="ml-auto text-xs text-neutral-500">Streak terpanjang</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {leaderboard.map((entry) => {
                            const rs = rankStyle(entry.rank)
                            const isMe = entry.userId === session?.user?.id
                            return (
                                <motion.div
                                    key={entry.userId}
                                    whileHover={{ x: 3, transition: { type: "spring", stiffness: 400, damping: 28 } }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                    style={{
                                        background: isMe ? "rgba(99,102,241,0.07)" : rs.bg,
                                        border: isMe ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                                    }}
                                >
                                    {/* Rank */}
                                    <div className="w-7 text-center font-black text-sm flex-shrink-0" style={{ color: rs.color }}>
                                        {entry.rank === 1 ? "👑" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                                        {entry.image ? (
                                            <img src={entry.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-white">{entry.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${entry.userId}`} className="flex items-center gap-1.5 group">
                                            <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                                                {entry.name}
                                            </span>
                                            {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">Kamu</span>}
                                        </Link>
                                    </div>

                                    {/* Streak */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <Flame className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm font-bold" style={{ color: rs.color }}>{entry.longestStreak}</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
