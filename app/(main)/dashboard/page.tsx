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
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 20 } },
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
    
    // Fallback untuk history lama
    if (lastClaimedAt && currentStreak > 0) {
        const last = new Date(lastClaimedAt)
        last.setHours(12, 0, 0, 0)
        for (let i = 0; i < currentStreak; i++) {
            const d = new Date(last); d.setDate(last.getDate() - i)
            active.add(toWIBKey(d))
        }
    }
    
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
    if (isFuture) return { background: '#FFFDF0', border: '2px solid black' }
    if (count === 0) return { background: 'white', border: '2px solid black' }
    if (count === 1) return { background: '#00FFFF', border: '2px solid black' }
    if (count === 2) return { background: '#00FF00', border: '2px solid black' }
    if (count === 3) return { background: '#FF00FF', border: '2px solid black' }
    return { background: '#FFFF00', border: '2px solid black', boxShadow: '2px 2px 0 #000' }
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
                <div className="flex items-baseline gap-2 bg-[#FFFF00] border-[3px] border-black px-3 py-1 shadow-[2px_2px_0_#000]">
                    <span className="text-xl font-black text-black" style={{ fontFamily: "'Syne',sans-serif" }}>{thisYearCount}</span>
                    <span className="text-xs font-bold text-black/70 uppercase tracking-widest">kenangan</span>
                </div>
                <div className="flex items-baseline gap-2 bg-[#00FFFF] border-[3px] border-black px-3 py-1 shadow-[2px_2px_0_#000]">
                    <span className="text-xl font-black text-black" style={{ fontFamily: "'Syne',sans-serif" }}>{activeDays}</span>
                    <span className="text-xs font-bold text-black/70 uppercase tracking-widest">hari aktif</span>
                </div>
            </div>

            {/* Scrollable grid */}
            <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                    {/* Month labels */}
                    <div style={{ display: 'flex', paddingLeft: '2.1rem', marginBottom: 6, height: 14, position: 'relative' }}>
                        {weeks.map((_, wi) => {
                            const ml = monthLabels.find(l => l.weekIdx === wi)
                            return (
                                <div key={wi} style={{ width: CELL + GAP, flexShrink: 0, position: 'relative' }}>
                                    {ml && <span style={{ position: 'absolute', left: 0, fontSize: 10, color: '#000', whiteSpace: 'nowrap', fontWeight: 800, textTransform: 'uppercase' }}>{ml.label}</span>}
                                </div>
                            )
                        })}
                    </div>

                    {/* Day labels + cells */}
                    <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingRight: 6, flexShrink: 0 }}>
                            {DAY_LABELS.map((lbl, di) => (
                                <div key={di} style={{ height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: 10, color: '#000', fontWeight: 800, visibility: lbl ? 'visible' : 'hidden' }}>{lbl || 'X'}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: GAP }}>
                            {weeks.map((week, wi) => (
                                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                                    {week.map((cell, di) => (
                                        <div
                                            key={di}
                                            style={{ width: CELL, height: CELL, flexShrink: 0, cursor: cell.count > 0 ? 'pointer' : 'default', transition: 'all 0.1s', ...heatCellStyle(cell.count, cell.isFuture) }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px, -2px)';
                                                (e.currentTarget as HTMLDivElement).style.boxShadow = '3px 3px 0 #000';
                                                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                                                setTooltip({ x: r.left + r.width / 2, y: r.top, cell })
                                            }}
                                            onMouseLeave={e => { 
                                                (e.currentTarget as HTMLDivElement).style.transform = 'translate(0, 0)'; 
                                                (e.currentTarget as HTMLDivElement).style.boxShadow = cell.count >= 4 ? '2px 2px 0 #000' : 'none'; 
                                                setTooltip(null) 
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, paddingLeft: '2.1rem' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#000', marginRight: 4 }}>Kurang</span>
                        {[0, 1, 2, 3, 4].map(lvl => (
                            <div key={lvl} style={{ width: CELL, height: CELL, flexShrink: 0, ...heatCellStyle(lvl, false) }} />
                        ))}
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#000', marginLeft: 4 }}>Lebih</span>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div className="fixed z-[9999] pointer-events-none" style={{ left: tooltip.x, top: tooltip.y - 50, transform: 'translateX(-50%)' }}>
                    <div className="px-3 py-2 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] whitespace-nowrap">
                        <span className="font-black text-black">
                            {tooltip.cell.isFuture ? 'Akan datang' : tooltip.cell.count === 0 ? 'Tidak ada kenangan' : `${tooltip.cell.count} kenangan`}
                        </span>
                        <span className="text-black/60 font-bold ml-2 text-xs">{formatDate(tooltip.cell.dayObj)}</span>
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
    memories, currentStreak, lastClaimedAt, permanentDates
}: {
    memories: any[]; currentStreak: number; lastClaimedAt: string | null
    permanentDates: string[]
}) {
    const activeDates = useMemo(() => buildActiveDates(memories, currentStreak, lastClaimedAt, permanentDates), [memories, currentStreak, lastClaimedAt, permanentDates])
    const { weeks, activeDaysCount } = useMemo(() => build30DayCalendar(activeDates), [activeDates])

    return (
        <div className="flex flex-col gap-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-black" />
                    <span className="text-[11px] font-black uppercase tracking-[0.1em] text-black">30 Hari Terakhir</span>
                </div>
                <div className="bg-[#FFFF00] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0_#000]">
                    <span className="text-[11px] font-black text-black">{activeDaysCount} hari aktif</span>
                </div>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1.5">
                {DAY_LABELS_ID.map(d => (
                    <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-black/70">{d}</div>
                ))}
            </div>

            {/* Calendar cells */}
            <div className="flex flex-col gap-1.5">
                {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1.5">
                        {week.map((day, di) => (
                            <div
                                key={di}
                                className="aspect-square flex items-center justify-center transition-all"
                                style={{
                                    background: day.isActive ? '#00FF00' : day.inRange ? '#FFFDF0' : 'rgba(0,0,0,0.05)',
                                    border: day.isToday ? '3px solid black' : '2px solid black',
                                    boxShadow: (day.isActive || day.isToday) ? '2px 2px 0 #000' : 'none',
                                    opacity: !day.inRange ? 0.4 : 1,
                                }}
                            >
                                <span className={`text-xs font-black ${day.isActive || day.isToday ? 'text-black' : 'text-black/60'}`}>
                                    {day.dayNum}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2">
                {[
                    { bg: '#00FF00', label: 'Aktif', border: '2px solid black' },
                    { bg: '#FFFDF0', label: 'Tidak Aktif', border: '2px solid black' },
                    { bg: 'transparent', label: 'Hari Ini', border: '3px solid black' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 shadow-[1px_1px_0_#000]" style={{ background: item.bg, border: item.border }} />
                        <span className="text-[10px] font-bold text-black/70">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Compact Stat Bar ─────────────────────────────────────────────────────────
function StatBar({ label, value, barColor, sub }: { label: string; value: string | number; barColor: string; sub: string }) {
    const isLong = typeof value === 'string' && value.length > 6
    return (
        <div className="flex-1 min-w-0 px-4 py-4 border-r-[3px] border-black last:border-r-0 bg-white group hover:bg-[#FFFDF0] transition-colors">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-black/50 mb-1.5">{label}</p>
            <p className="font-black leading-none mb-3 text-black" style={{ fontSize: isLong ? '1.4rem' : '2rem', fontFamily: "'Syne',sans-serif" }}>
                {value}
            </p>
            <div className="h-[5px] w-10 border-[2px] border-black shadow-[2px_2px_0_#000] mb-2 group-hover:w-full transition-all duration-300" style={{ background: barColor }} />
            <p className="text-[11px] font-bold text-black/70">{sub}</p>
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
    const greeting = hour < 12 ? "Selamat Pagi" : hour < 18 ? "Selamat Siang" : "Selamat Malam"

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 pb-32">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="show" variants={stagger}>
                <motion.div
                    variants={fadeUp}
                    className="relative px-7 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-[#00FFFF] border-[4px] border-black shadow-[8px_8px_0_#000]"
                >
                    <div className="absolute inset-0 pointer-events-none opacity-[0.1]" style={{ backgroundImage: "radial-gradient(black 2px, transparent 2px)", backgroundSize: "20px 20px" }} />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-block px-2 py-1 bg-[#FFFF00] border-2 border-black text-[10px] font-black uppercase tracking-widest text-black shadow-[2px_2px_0_#000]">
                                {greeting}
                            </span>
                        </div>
                        <h1 className="text-[32px] sm:text-[40px] font-black text-black leading-tight mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Selamat Datang,{" "}
                            <span className="inline-block bg-[#FF00FF] text-white px-2 mt-1 border-[3px] border-black shadow-[4px_4px_0_#000] -rotate-1">
                                {firstName}
                            </span>.
                        </h1>
                        <p className="text-base font-bold text-black/70 max-w-7xl w-full leading-relaxed">Siap untuk menyimpan kenangan baru Anda di peta?</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
                        <Link href="/memories/create" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all uppercase">
                            <Plus className="w-5 h-5" />
                            <span>Tambah Kenangan</span>
                        </Link>
                        <Link href="/map" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-black bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all uppercase hover:bg-[#00FF00]">
                            <Globe className="w-5 h-5" />
                            <span>Jelajahi Peta</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Floating Streak Banner ────────────────────────────────────── */}
            {streakData !== null && showStreakBanner && (
                <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 w-[calc(100%-2rem)] md:w-auto max-w-sm pointer-events-auto">
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <div className="relative border-[4px] border-black bg-white p-5 flex items-center justify-between gap-4 shadow-[8px_8px_0_#000]">
                            <button onClick={() => setShowStreakBanner(false)} className="absolute -top-3 -right-3 p-1.5 bg-[#FF00FF] border-[3px] border-black text-white hover:bg-black hover:text-[#FF00FF] rounded-none transition-colors z-10 shadow-[4px_4px_0_#000]">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-4 min-w-0 pr-4">
                                <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border-[3px] border-black shadow-[3px_3px_0_#000] ${streakData.alreadyClaimed ? "bg-[#00FF00]" : "bg-[#FFFF00]"}`}>
                                    <Flame className={`w-6 h-6 text-black`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
                                        <span className="text-2xl font-black text-black leading-none" style={{ fontFamily: "'Syne',sans-serif" }}>{streakData.currentStreak}</span>
                                        <span className="text-xs font-bold text-black/60 uppercase">hari streak</span>
                                    </div>
                                    {streakData.alreadyClaimed
                                        ? <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-[#00FF00] text-black border-2 border-black uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" />Sudah klaim</span>
                                        : <span className="inline-block text-[10px] font-black px-2 py-0.5 bg-[#FFFF00] text-black border-2 border-black uppercase tracking-wider">Belum klaim</span>
                                    }
                                </div>
                            </div>
                            <Link href="/streak" className={`flex items-center justify-center gap-1 text-xs font-black px-4 py-2 border-[3px] border-black shadow-[3px_3px_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] uppercase ${streakData.alreadyClaimed ? "bg-white" : "bg-[#00FFFF]"}`}>
                                {streakData.alreadyClaimed ? "Detail" : "Klaim"}<ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ── Memory Stats (compact) ────────────────────────────────────── */}
            <AnimatedSection>
                <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF00FF] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[18px] font-black text-black leading-none" style={{ fontFamily: "'Syne',sans-serif" }}>Statistik Kenangan</h2>
                            <p className="text-[12px] font-bold text-black/50 mt-1">Perjalanan Anda dalam angka</p>
                        </div>
                    </div>
                    <Link href="/memories" className="group flex items-center gap-1.5 text-xs font-black text-black bg-[#FFFF00] px-3 py-2 border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all uppercase tracking-wide">
                        <span>Lihat Jurnal</span><ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </motion.div>

                <motion.div variants={fadeUp} className="border-[4px] border-black bg-white shadow-[8px_8px_0_#000]">
                    {/* Mobile 2×2 */}
                    <div className="grid grid-cols-2 sm:hidden">
                        {[
                            { label: 'Kenangan', value: stats.totalMemories, barColor: '#00FFFF', sub: '+1 minggu ini' },
                            { label: 'Tempat', value: stats.uniqueLocations, barColor: '#00FF00', sub: 'Di berbagai kota' },
                            { label: 'Perasaan Utama', value: emotionDisplay, barColor: '#FF00FF', sub: 'Paling sering' },
                            { label: 'Foto', value: stats.totalPhotos, barColor: '#FFFF00', sub: 'Terlampir' },
                        ].map((item, i) => (
                            <div key={item.label} style={{ borderRight: i % 2 === 0 ? '3px solid black' : 'none', borderBottom: i < 2 ? '3px solid black' : 'none' }}>
                                <StatBar {...item} />
                            </div>
                        ))}
                    </div>
                    {/* Desktop row */}
                    <div className="hidden sm:flex">
                        <StatBar label="Kenangan" value={stats.totalMemories} barColor="#00FFFF" sub="+1 minggu ini" />
                        <StatBar label="Tempat" value={stats.uniqueLocations} barColor="#00FF00" sub="Di berbagai kota" />
                        <StatBar label="Perasaan Utama" value={emotionDisplay} barColor="#FF00FF" sub="Paling sering" />
                        <StatBar label="Foto" value={stats.totalPhotos} barColor="#FFFF00" sub="Terlampir" />
                    </div>
                </motion.div>
            </AnimatedSection>

            {/* ── Activity Section: Heatmap (left) + Calendar (right) ───────── */}
            <AnimatedSection>
                {/* Mobile Tab Switcher */}
                <div className="flex lg:hidden mb-5 border-[3px] border-black shadow-[4px_4px_0_#000] bg-white">
                    {(['graph', 'calendar'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setMobileTab(t)}
                            className="flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-r-[3px] border-black last:border-r-0"
                            style={{
                                background: mobileTab === t ? '#FFFF00' : 'white',
                                color: 'black',
                            }}
                        >
                            {t === 'graph' ? <Activity className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                            {t === 'graph' ? 'Contribution' : '30 Hari'}
                        </button>
                    ))}
                </div>

                {/* Section header (Desktop only) */}
                <motion.div variants={fadeUp} className="hidden lg:flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                        <Activity className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h2 className="text-[18px] font-black text-black leading-none" style={{ fontFamily: "'Syne',sans-serif" }}>Grafik Aktivitas</h2>
                        <p className="text-[12px] font-bold text-black/50 mt-1">Contribution graph & kalender 30 hari terakhir</p>
                    </div>
                </motion.div>

                {/* 2-column layout on desktop, stacked/tabbed on mobile */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── LEFT: GitHub Heatmap ─────────────────────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className={`relative p-6 bg-white border-[4px] border-black shadow-[8px_8px_0_#000] flex-1 min-w-0 ${mobileTab !== 'graph' ? 'hidden lg:block' : 'block'}`}
                    >
                        <div className="flex items-center gap-2 mb-6 bg-black text-white w-fit px-3 py-1.5 border-[2px] border-black shadow-[2px_2px_0_#FF00FF]">
                            <Activity className="w-4 h-4 text-[#00FFFF]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">Contribution Graph</span>
                        </div>

                        <ActivityHeatmap memories={memories} />
                    </motion.div>

                    {/* ── RIGHT: 30-Day Calendar ─────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className={`relative p-6 bg-white border-[4px] border-black shadow-[8px_8px_0_#000] w-full lg:w-[360px] flex-shrink-0 ${mobileTab !== 'calendar' ? 'hidden lg:block' : 'block'}`}
                    >
                        {streakData ? (
                            <ActivityCalendar
                                memories={memories}
                                currentStreak={streakData.currentStreak}
                                lastClaimedAt={streakData.lastClaimedAt}
                                permanentDates={streakData.activeDates}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-6 h-6 text-black animate-spin" />
                            </div>
                        )}
                    </motion.div>
                </div>
            </AnimatedSection>

        </div>
    )
}