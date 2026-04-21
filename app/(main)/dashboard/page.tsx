"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef, useMemo } from "react"
import Link from "next/link"
import {
    Plus, Globe, Loader2, ArrowRight, X,
    BookOpen, TrendingUp, Map, Heart, Image as ImageIcon,
    Flame, ChevronRight, CheckCircle2, CalendarDays, Activity, Zap
} from "lucide-react"
import { motion, useInView } from "framer-motion"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"

import { formatDate } from "@/lib/utils"

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
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

// ─── Date Helpers ─────────────────────────────────────────────────────────────
function toWIBKey(date: Date): string {
    const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    return wib.toISOString().slice(0, 10)
}

/** Reconstruct active dates from memory dates + streak claim history + permanent activeDates records */
function buildActiveDates(memories: any[], currentStreak: number, lastClaimedAt: string | null, permanentDates: string[] = []): Set<string> {
    const active = new Set<string>()
    for (const m of memories) {
        try { active.add(toWIBKey(new Date(m.date ?? m.createdAt))) } catch { /* skip */ }
    }
    
    // Fallback untuk history lama (kalau user punya streak panjang, tapi activeDates blm tersimpan di db)
    if (lastClaimedAt && currentStreak > 0) {
        const last = new Date(lastClaimedAt)
        last.setHours(12, 0, 0, 0)
        for (let i = 0; i < currentStreak; i++) {
            const d = new Date(last); d.setDate(last.getDate() - i)
            active.add(toWIBKey(d))
        }
    }
    
    // Masukkan data permanen dari db
    for (const d of permanentDates) {
        active.add(d)
    }
    
    return active
}

// ─── ── GitHub-style Heatmap ─────────────────────────────────────────────────
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

interface HeatCell { dateKey: string; count: number; dayObj: Date; isFuture: boolean }

function buildHeatmapCells(memories: any[]): HeatCell[] {
    const countMap: Record<string, number> = {}
    for (const m of memories) {
        try {
            const key = toWIBKey(new Date(m.date ?? m.createdAt))
            countMap[key] = (countMap[key] || 0) + 1
        } catch { /* skip */ }
    }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const start = new Date(today); start.setDate(today.getDate() - 52 * 7)
    start.setDate(start.getDate() - start.getDay()) // align Sunday
    const end = new Date(today); end.setDate(today.getDate() + (6 - today.getDay()))
    const cells: HeatCell[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
        const key = toWIBKey(cursor)
        const isFuture = cursor > new Date()
        cells.push({ dateKey: key, count: isFuture ? 0 : (countMap[key] || 0), dayObj: new Date(cursor), isFuture })
        cursor.setDate(cursor.getDate() + 1)
    }
    return cells
}

function heatCellStyle(count: number, isFuture: boolean): React.CSSProperties {
    if (isFuture) return { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }
    if (count === 0) return { background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)' }
    if (count === 1) return { background: 'rgba(99,102,241,0.42)', border: '1px solid rgba(99,102,241,0.55)' }
    if (count === 2) return { background: 'rgba(99,102,241,0.68)', border: '1px solid rgba(99,102,241,0.8)' }
    if (count === 3) return { background: 'rgba(139,92,246,0.82)', border: '1px solid rgba(139,92,246,0.95)' }
    return { background: 'rgba(167,139,250,1)', border: '1px solid rgba(167,139,250,1)', boxShadow: '0 0 8px rgba(167,139,250,0.4)' }
}

function ActivityHeatmap({ memories }: { memories: any[] }) {
    const allCells = useMemo(() => buildHeatmapCells(memories), [memories])
    const [tooltip, setTooltip] = useState<{ x: number; y: number; cell: HeatCell } | null>(null)

    const weeks: HeatCell[][] = useMemo(() => {
        const r: HeatCell[][] = []
        for (let i = 0; i < allCells.length; i += 7) r.push(allCells.slice(i, i + 7))
        return r
    }, [allCells])

    const monthLabels: { weekIdx: number; label: string }[] = useMemo(() => {
        const labels: { weekIdx: number; label: string }[] = []; let last = -1
        weeks.forEach((week, wi) => {
            const m = week[0]?.dayObj.getMonth()
            if (m !== undefined && m !== last) { labels.push({ weekIdx: wi, label: MONTHS_ID[m] }); last = m }
        })
        return labels
    }, [weeks])

    const thisYear = new Date().getFullYear()
    const thisYearCount = useMemo(() =>
        allCells.filter(c => !c.isFuture && c.count > 0 && c.dayObj.getFullYear() === thisYear).reduce((s, c) => s + c.count, 0),
        [allCells])
    const activeDays = useMemo(() =>
        allCells.filter(c => !c.isFuture && c.count > 0 && c.dayObj.getFullYear() === thisYear).length,
        [allCells])

    const CELL = 14; const GAP = 4
    const DAY_LABELS = ['', 'Sen', '', 'Rab', '', 'Jum', '']

    return (
        <div className="w-full">
            {/* Year summary */}
            <div className="flex items-center gap-5 mb-4 flex-wrap">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>{thisYearCount}</span>
                    <span className="text-xs text-neutral-500">kenangan tahun ini</span>
                </div>
                <div className="w-px h-4 bg-white/[0.08]" />
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>{activeDays}</span>
                    <span className="text-xs text-neutral-500">hari aktif</span>
                </div>
            </div>

            {/* Scrollable grid */}
            <div className="overflow-x-auto pb-1">
                <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                    {/* Month labels */}
                    <div style={{ display: 'flex', paddingLeft: '2.1rem', marginBottom: 6, height: 14, position: 'relative' }}>
                        {weeks.map((_, wi) => {
                            const ml = monthLabels.find(l => l.weekIdx === wi)
                            return (
                                <div key={wi} style={{ width: CELL + GAP, flexShrink: 0, position: 'relative' }}>
                                    {ml && <span style={{ position: 'absolute', left: 0, fontSize: 9, color: 'rgba(115,115,115,1)', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ml.label}</span>}
                                </div>
                            )
                        })}
                    </div>

                    {/* Day labels + cells */}
                    <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingRight: 6, flexShrink: 0 }}>
                            {DAY_LABELS.map((lbl, di) => (
                                <div key={di} style={{ height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: 9, color: 'rgba(82,82,82,1)', fontWeight: 500, visibility: lbl ? 'visible' : 'hidden' }}>{lbl || 'X'}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: GAP }}>
                            {weeks.map((week, wi) => (
                                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                                    {week.map((cell, di) => (
                                        <div
                                            key={di}
                                            style={{ width: CELL, height: CELL, borderRadius: 2, flexShrink: 0, cursor: cell.count > 0 ? 'pointer' : 'default', transition: 'transform 0.08s', ...heatCellStyle(cell.count, cell.isFuture) }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.45)'
                                                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                                                setTooltip({ x: r.left + r.width / 2, y: r.top, cell })
                                            }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; setTooltip(null) }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, paddingLeft: '2.1rem' }}>
                        <span style={{ fontSize: 9, color: 'rgba(82,82,82,1)' }}>Kurang</span>
                        {[0, 1, 2, 3, 4].map(lvl => (
                            <div key={lvl} style={{ width: CELL, height: CELL, borderRadius: 2, flexShrink: 0, ...heatCellStyle(lvl, false) }} />
                        ))}
                        <span style={{ fontSize: 9, color: 'rgba(82,82,82,1)' }}>Lebih</span>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-[9999] pointer-events-none" style={{ left: tooltip.x, top: tooltip.y - 46, transform: 'translateX(-50%)' }}>
                    <div style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, background: 'rgba(10,10,16,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>
                            {tooltip.cell.isFuture ? 'Akan datang' : tooltip.cell.count === 0 ? 'Tidak ada kenangan' : `${tooltip.cell.count} kenangan`}
                        </span>
                        <span style={{ color: 'rgba(115,115,115,1)', marginLeft: 6, fontSize: 10 }}>{formatDate(tooltip.cell.dayObj)}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── 30-Day Activity Calendar ─────────────────────────────────────────────────
const DAY_LABELS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

interface CalDay { dateKey: string; date: Date; dayNum: number; inRange: boolean; isActive: boolean; isToday: boolean }

function build30DayCalendar(activeDates: Set<string>): { weeks: CalDay[][]; activeDaysCount: number } {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayKey = toWIBKey(today)
    const start = new Date(today); start.setDate(today.getDate() - 29)
    // align to Monday
    const startMon = new Date(start)
    const dow = startMon.getDay()
    startMon.setDate(startMon.getDate() - (dow === 0 ? 6 : dow - 1))
    // align end to Sunday
    const endSun = new Date(today)
    const todayDow = today.getDay()
    endSun.setDate(today.getDate() + (todayDow === 0 ? 0 : 7 - todayDow))

    const days: CalDay[] = []
    const cursor = new Date(startMon)
    while (cursor <= endSun) {
        const key = toWIBKey(cursor)
        const inRange = cursor >= start && cursor <= today
        days.push({ dateKey: key, date: new Date(cursor), dayNum: cursor.getDate(), inRange, isActive: inRange && activeDates.has(key), isToday: key === todayKey })
        cursor.setDate(cursor.getDate() + 1)
    }
    const weeks: CalDay[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return { weeks, activeDaysCount: days.filter(d => d.isActive).length }
}

function ActivityCalendar({
    memories, currentStreak, lastClaimedAt, longestStreak, totalActiveDays, nextMilestone, daysToNext, alreadyClaimed, permanentDates
}: {
    memories: any[]; currentStreak: number; lastClaimedAt: string | null
    longestStreak: number; totalActiveDays: number; nextMilestone: number | null; daysToNext: number | null; alreadyClaimed: boolean; permanentDates: string[]
}) {
    const activeDates = useMemo(() => buildActiveDates(memories, currentStreak, lastClaimedAt, permanentDates), [memories, currentStreak, lastClaimedAt, permanentDates])
    const { weeks, activeDaysCount } = useMemo(() => build30DayCalendar(activeDates), [activeDates])

    return (
        <div className="flex flex-col gap-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">30 Hari Terakhir</span>
                </div>
                <span className="text-[11px] font-bold text-orange-400">{activeDaysCount} hari aktif</span>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS_ID.map(d => (
                    <div key={d} className="text-center text-[8px] font-semibold uppercase tracking-wider text-neutral-600">{d}</div>
                ))}
            </div>

            {/* Calendar cells */}
            <div className="flex flex-col gap-1">
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1">
                        {week.map((day, di) => (
                            <div
                                key={di}
                                className="aspect-square rounded-lg flex items-center justify-center"
                                style={{
                                    background: day.isActive ? 'linear-gradient(135deg,#ea580c,#f97316)' : day.inRange ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                    border: day.isToday ? '1.5px solid rgba(249,115,22,0.85)' : day.isActive ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(255,255,255,0.06)',
                                    boxShadow: day.isActive ? '0 2px 8px rgba(234,88,12,0.3)' : 'none',
                                    opacity: !day.inRange ? 0.25 : 1,
                                }}
                            >
                                <span className={`text-[10px] font-bold ${day.isActive ? 'text-white' : day.inRange ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    {day.dayNum}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4">
                {[
                    { bg: 'linear-gradient(135deg,#ea580c,#f97316)', label: 'Aktif' },
                    { bg: 'rgba(255,255,255,0.05)', label: 'Tidak Aktif', border: '1px solid rgba(255,255,255,0.08)' },
                    { bg: 'transparent', label: 'Hari Ini', border: '1.5px solid rgba(249,115,22,0.85)' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-[3px]" style={{ background: item.bg, border: item.border }} />
                        <span className="text-[9px] text-neutral-500">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Compact Stat Bar ─────────────────────────────────────────────────────────
function StatBar({ label, value, barColor, valueColor, sub }: { label: string; value: string | number; barColor: string; valueColor?: string; sub: string }) {
    const isLong = typeof value === 'string' && value.length > 6
    return (
        <div className="flex-1 min-w-0 px-4 py-3 border-r border-white/[0.06] last:border-r-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-500 mb-1.5">{label}</p>
            <p className="font-black leading-none mb-2" style={{ fontSize: isLong ? '1.2rem' : '1.75rem', fontFamily: "'Syne',sans-serif", color: valueColor ?? '#fff' }}>
                {value}
            </p>
            <div className="h-[2px] w-7 rounded-full mb-1.5" style={{ background: barColor }} />
            <p className="text-[10px] text-neutral-600">{sub}</p>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { data: session } = useSession()
    const [memories, setMemories] = useState<any[]>([])
    const [stats, setStats] = useState({ totalMemories: 0, uniqueLocations: 0, topEmotion: "-", totalPhotos: 0 })
    const [loading, setLoading] = useState(true)
    const [mobileTab, setMobileTab] = useState<'graph' | 'calendar'>('graph')
    const [streakData, setStreakData] = useState<{
        currentStreak: number; longestStreak: number; totalActiveDays: number
        lastClaimedAt: string | null; alreadyClaimed: boolean
        nextMilestone: number | null; daysToNext: number | null; activeDates: string[]
    } | null>(null)
    const [showStreakBanner, setShowStreakBanner] = useState(true)

    const firstName = session?.user?.name?.split(" ")[0] || "Penjelajah"
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Selamat pagi" : hour < 18 ? "Selamat siang" : "Selamat malam"

    useEffect(() => {
        if (!session?.user?.id) return
        fetch(`/api/memories?userId=${session.user.id}`)
            .then(r => r.json())
            .then((data: any[]) => {
                setMemories(data)
                const totalMemories = data.length
                const locations = new Set(data.filter(m => m.locationName).map(m => m.locationName)).size
                const emotions = data.reduce((acc: any, cur: any) => { acc[cur.emotion] = (acc[cur.emotion] || 0) + 1; return acc }, {})
                const topEmotion = Object.keys(emotions).sort((a, b) => emotions[b] - emotions[a])[0] || "-"
                const totalPhotos = data.reduce((acc, cur) => acc + (cur.photos?.length || 0), 0)
                setStats({ totalMemories, uniqueLocations: locations, topEmotion, totalPhotos })
                setLoading(false)
            })
            .catch(() => setLoading(false))

        fetch("/api/streak")
            .then(r => r.json())
            .then(d => setStreakData({
                currentStreak: d.currentStreak, longestStreak: d.longestStreak,
                totalActiveDays: d.totalActiveDays, lastClaimedAt: d.lastClaimedAt,
                alreadyClaimed: d.alreadyClaimed, nextMilestone: d.nextMilestone, daysToNext: d.daysToNext,
                activeDates: d.activeDates || [],
            }))
            .catch(() => { })
    }, [session?.user?.id])

    if (loading) return <DashboardSkeleton />

    const emotionDisplay = stats.topEmotion !== '-'
        ? stats.topEmotion.charAt(0).toUpperCase() + stats.topEmotion.slice(1).toLowerCase()
        : '-'

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.div
                    variants={fadeUp}
                    className="relative rounded-2xl overflow-hidden border border-indigo-500/[0.12] px-7 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
                    style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.09) 0%,rgba(139,92,246,0.06) 50%,rgba(8,8,16,0) 100%)" }}
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(99,102,241,0.18) 1px,transparent 1px)", backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse 60% 100% at 90% 50%,black 10%,transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 60% 100% at 90% 50%,black 10%,transparent 70%)" }} />
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.55) 40%,rgba(99,102,241,0.55) 60%,transparent)" }} />
                    <div className="absolute right-0 top-0 h-full w-72 pointer-events-none opacity-[0.07]" style={{ background: "radial-gradient(ellipse at right center,#6366f1,transparent 70%)" }} />

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="relative flex h-[7px] w-[7px]">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-indigo-400" />
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-400">{greeting}</span>
                        </div>
                        <h1 className="text-[28px] sm:text-[34px] font-extrabold text-white leading-tight mb-2" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Selamat datang kembali,{" "}
                            <span style={{ backgroundImage: "linear-gradient(135deg,#a5b4fc,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                {firstName}
                            </span>.
                        </h1>
                        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">Siap untuk menyimpan kenangan baru Anda di peta?</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 relative">
                        <Link href="/memories/create" className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden"
                            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35),inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                            <span className="absolute inset-0 bg-white/0 hover:bg-white/[0.08] transition-colors rounded-xl" />
                            <span className="relative">Tambah Kenangan</span>
                        </Link>
                        <Link href="/map" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-white hover:border-white/[0.14] transition-all">
                            <span>Jelajahi Peta</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Floating Streak Banner ────────────────────────────────────── */}
            {streakData !== null && showStreakBanner && (
                <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 w-[calc(100%-2rem)] md:w-auto max-w-sm pointer-events-auto">
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                        <div className="relative rounded-2xl border p-4 flex items-center justify-between gap-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
                            style={{ background: "linear-gradient(135deg,rgba(20,20,20,0.95),rgba(10,10,10,0.98))", borderColor: streakData.alreadyClaimed ? "rgba(34,197,94,0.25)" : "rgba(234,88,12,0.25)", backdropFilter: "blur(12px)" }}>
                            <button onClick={() => setShowStreakBanner(false)} className="absolute -top-2.5 -right-2.5 p-1 bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors z-10 shadow-lg">
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: streakData.alreadyClaimed ? "rgba(34,197,94,0.15)" : "rgba(234,88,12,0.15)", border: streakData.alreadyClaimed ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(234,88,12,0.3)" }}>
                                    <Flame className={`w-5 h-5 ${streakData.alreadyClaimed ? "text-green-400" : "text-orange-400"}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-lg font-black text-white leading-none whitespace-nowrap" style={{ fontFamily: "'Syne',sans-serif" }}>{streakData.currentStreak}</span>
                                        <span className="text-xs text-neutral-400 whitespace-nowrap">hari streak</span>
                                        {streakData.alreadyClaimed
                                            ? <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}><CheckCircle2 className="w-3 h-3" />Sudah klaim</span>
                                            : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>Belum klaim</span>
                                        }
                                    </div>
                                    <p className="text-[11px] text-neutral-500 mt-1 truncate">{streakData.alreadyClaimed ? "Streak Anda aman hari ini!" : "Jangan lewatkan streak Anda!"}</p>
                                </div>
                            </div>
                            <Link href="/streak" className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 whitespace-nowrap min-w-[max-content]"
                                style={streakData.alreadyClaimed
                                    ? { background: "rgba(255,255,255,0.05)", color: "#a3a3a3", border: "1px solid rgba(255,255,255,0.1)" }
                                    : { background: "linear-gradient(135deg,#ea580c,#f97316)", color: "white", boxShadow: "0 4px 14px rgba(234,88,12,0.3)" }}>
                                {streakData.alreadyClaimed ? "Detail" : "Klaim"}<ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ── Memory Stats (compact) ────────────────────────────────────── */}
            <AnimatedSection>
                <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/[0.15] flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-white leading-none" style={{ fontFamily: "'Syne',sans-serif" }}>Statistik Kenangan</h2>
                            <p className="text-[10px] text-neutral-600 mt-0.5">Perjalanan Anda dalam angka</p>
                        </div>
                    </div>
                    <Link href="/memories" className="group flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-all">
                        <span>Lihat Jurnal</span><ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </motion.div>

                <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(160deg,rgba(255,255,255,0.028),rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* Mobile 2×2 */}
                    <div className="grid grid-cols-2 sm:hidden">
                        {[
                            { label: 'Kenangan', value: stats.totalMemories, barColor: '#6366f1', sub: '+1 minggu ini' },
                            { label: 'Tempat', value: stats.uniqueLocations, barColor: '#10b981', sub: 'Di berbagai kota' },
                            { label: 'Perasaan Utama', value: emotionDisplay, barColor: '#f43f5e', valueColor: '#fb7185', sub: 'Paling sering' },
                            { label: 'Foto', value: stats.totalPhotos, barColor: '#f59e0b', sub: 'Terlampir' },
                        ].map((item, i) => (
                            <div key={item.label} className="px-4 py-4" style={{ borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                <StatBar {...item} />
                            </div>
                        ))}
                    </div>
                    {/* Desktop row */}
                    <div className="hidden sm:flex px-2 py-4">
                        <StatBar label="Kenangan" value={stats.totalMemories} barColor="#6366f1" sub="+1 minggu ini" />
                        <StatBar label="Tempat" value={stats.uniqueLocations} barColor="#10b981" sub="Di berbagai kota" />
                        <StatBar label="Perasaan Utama" value={emotionDisplay} barColor="#f43f5e" valueColor="#fb7185" sub="Paling sering" />
                        <StatBar label="Foto" value={stats.totalPhotos} barColor="#f59e0b" sub="Terlampir" />
                    </div>
                </motion.div>
            </AnimatedSection>

            {/* ── Activity Section: Heatmap (left) + Calendar (right) ───────── */}
            <AnimatedSection>
                {/* Mobile Tab Switcher */}
                <div className="flex lg:hidden rounded-xl overflow-hidden mb-5 border border-white/[0.07]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {(['graph', 'calendar'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setMobileTab(t)}
                            className="flex-1 py-2.5 text-[11px] font-semibold transition-all flex items-center justify-center gap-2"
                            style={{
                                background: mobileTab === t ? 'rgba(139,92,246,0.15)' : 'transparent',
                                color: mobileTab === t ? '#c4b5fd' : 'rgba(115,115,115,1)',
                                borderBottom: mobileTab === t ? '2px solid rgba(139,92,246,0.6)' : '2px solid transparent',
                            }}
                        >
                            {t === 'graph' ? <Activity className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
                            {t === 'graph' ? 'Contribution Graph' : '30 Hari Terakhir'}
                        </button>
                    ))}
                </div>

                {/* Section header (Desktop only) */}
                <motion.div variants={fadeUp} className="hidden lg:flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/[0.08] border border-violet-500/[0.15] flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-white leading-none" style={{ fontFamily: "'Syne',sans-serif" }}>Grafik Aktivitas</h2>
                        <p className="text-[10px] text-neutral-600 mt-0.5">Contribution graph & kalender 30 hari terakhir</p>
                    </div>
                </motion.div>

                {/* 2-column layout on desktop, stacked/tabbed on mobile */}
                <div className="flex flex-col lg:flex-row gap-4">

                    {/* ── LEFT: GitHub Heatmap ─────────────────────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className={`relative rounded-2xl p-5 overflow-hidden flex-1 min-w-0 ${mobileTab !== 'graph' ? 'hidden lg:block' : 'block'}`}
                        style={{ background: 'linear-gradient(160deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        {/* Top glow */}
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.4) 50%,transparent)' }} />

                        {/* Sub-header */}
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">Contribution Graph</span>
                            <span className="text-[9px] text-neutral-600 ml-1">— 52 minggu terakhir</span>
                        </div>

                        <ActivityHeatmap memories={memories} />
                    </motion.div>

                    {/* ── RIGHT: 30-Day Calendar + Streak Info ─────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className={`relative rounded-2xl p-5 overflow-hidden w-full lg:w-[325px] flex-shrink-0 ${mobileTab !== 'calendar' ? 'hidden lg:block' : 'block'}`}
                        style={{ background: 'linear-gradient(160deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        {/* Top glow */}
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(234,88,12,0.4) 50%,transparent)' }} />

                        {streakData ? (
                            <ActivityCalendar
                                memories={memories}
                                currentStreak={streakData.currentStreak}
                                lastClaimedAt={streakData.lastClaimedAt}
                                longestStreak={streakData.longestStreak}
                                totalActiveDays={streakData.totalActiveDays}
                                nextMilestone={streakData.nextMilestone}
                                daysToNext={streakData.daysToNext}
                                alreadyClaimed={streakData.alreadyClaimed}
                                permanentDates={streakData.activeDates}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                            </div>
                        )}
                    </motion.div>
                </div>
            </AnimatedSection>

        </div>
    )
}