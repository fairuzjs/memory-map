"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
    Plus, Compass, Users, MapPin, Loader2, ArrowRight,
    Globe, BookOpen, Sparkles, TrendingUp, Clock,
    Map, Heart, Image as ImageIcon
} from "lucide-react"
import { motion, useInView } from "framer-motion"

// ─── Animation variants ────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } }
}
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-60px" })
    return (
        <motion.div ref={ref} initial="hidden" animate={isInView ? "show" : "hidden"} variants={stagger} className={className}>
            {children}
        </motion.div>
    )
}

// ─── Quick-action tiles ────────────────────────────────────────────────────
const quickActions = [
    {
        icon: MapPin,
        gradient: "from-indigo-500 to-violet-600",
        shadow: "shadow-indigo-500/20",
        label: "Global Coverage",
        desc: "Discover hidden gems pinned by people all over the world.",
    },
    {
        icon: Users,
        gradient: "from-emerald-500 to-teal-600",
        shadow: "shadow-emerald-500/20",
        label: "Community First",
        desc: "Share your experiences and react to adventures from fellow explorers.",
    },
    {
        icon: BookOpen,
        gradient: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/20",
        label: "Personal Journal",
        desc: "Keep your memories safe, categorize by emotion, and look back anytime.",
    },
]

// ─── Main page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState({
        totalMemories: 0,
        uniqueLocations: 0,
        topEmotion: "-",
        totalPhotos: 0
    })
    const [loading, setLoading] = useState(true)
    const firstName = session?.user?.name?.split(" ")[0] || "Explorer"
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

    useEffect(() => {
        if (!session?.user?.id) return

        fetch(`/api/memories?userId=${session.user.id}`)
            .then(res => res.json())
            .then((data: any[]) => {
                // Calculate Stats
                const totalMemories = data.length
                const locations = new Set(data.filter(m => m.locationName).map(m => m.locationName)).size

                // Calculate Top Emotion
                const emotions = data.reduce((acc: any, curr: any) => {
                    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1
                    return acc
                }, {})
                const topEmotion = Object.keys(emotions).sort((a, b) => emotions[b] - emotions[a])[0] || "-"

                // Calculate total photos
                const totalPhotos = data.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0)

                setStats({
                    totalMemories,
                    uniqueLocations: locations,
                    topEmotion,
                    totalPhotos
                })
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [session?.user?.id])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    <span className="text-neutral-500 text-sm">Loading your dashboard...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">

            {/* ── Hero / Welcome Strip ──────────────────────────────────── */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={stagger}
            >
                {/* Compact welcome strip — not a huge banner */}
                <motion.div
                    variants={fadeUp}
                    className="relative rounded-2xl overflow-hidden border border-white/[0.07] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(8,8,16,0.6) 100%)" }}
                >
                    {/* Subtle top edge glow */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.5) 40%, rgba(99,102,241,0.5) 60%, transparent 100%)" }}
                    />
                    {/* Faint orb */}
                    <div className="absolute right-0 top-0 w-64 h-full opacity-[0.06] pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at right center, #6366f1, transparent 70%)" }} />

                    {/* Text */}
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{greeting}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold font-[Outfit] text-white leading-tight">
                            Welcome back,{" "}
                            <span
                                style={{
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)",
                                    backgroundClip: "text",
                                }}
                            >
                                {firstName}
                            </span>
                            .
                        </h1>
                        <p className="text-sm text-neutral-500 mt-1 max-w-sm">
                            Ready to pin your next memory to the world?
                        </p>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            href="/memories/create"
                            className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                            {/* hover overlay — 'absolute inset-0' now stays INSIDE this Link */}
                            <span className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors" />
                            <Plus className="relative w-4 h-4" />
                            <span className="relative">Add Memory</span>
                        </Link>
                        <Link
                            href="/map"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-neutral-300 border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                            <Globe className="w-4 h-4" />
                            <span>Explore Map</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Quick-action Cards ────────────────────────────────────── */}
            <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((item, i) => (
                    <motion.div
                        key={i}
                        variants={fadeUp}
                        whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                        className="group relative rounded-2xl p-5 border border-white/[0.06] overflow-hidden cursor-default"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))" }}
                    >
                        {/* Hover bg tint */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 bg-gradient-to-br ${item.gradient}`} />

                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${item.gradient} shadow-md ${item.shadow}`}>
                            <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-white font-[Outfit] mb-1">{item.label}</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </AnimatedSection>

            {/* ── Memory Stats & Activity ───────────────────────────────── */}
            <AnimatedSection>
                {/* Section header */}
                <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-[Outfit] text-white leading-none">Memory Stats & Activity</h2>
                            <p className="text-neutral-600 text-xs mt-0.5">Your journey by the numbers</p>
                        </div>
                    </div>
                    <Link
                        href="/memories"
                        className="group flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <span>View Journal</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </motion.div>

                {/* Stat Grid */}
                <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Memories */}
                    <motion.div variants={fadeUp} className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Memories</span>
                        </div>
                        <div>
                            <span className="text-3xl font-extrabold text-white font-[Outfit]">{stats.totalMemories}</span>
                        </div>
                    </motion.div>

                    {/* Unique Locations */}
                    <motion.div variants={fadeUp} className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Map className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Places</span>
                        </div>
                        <div>
                            <span className="text-3xl font-extrabold text-white font-[Outfit]">{stats.uniqueLocations}</span>
                        </div>
                    </motion.div>

                    {/* Top Emotion */}
                    <motion.div variants={fadeUp} className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <Heart className="w-4 h-4 text-rose-400" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Top Vibe</span>
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white font-[Outfit] capitalize">
                                {stats.topEmotion.toLowerCase()}
                            </span>
                        </div>
                    </motion.div>

                    {/* Total Photos */}
                    <motion.div variants={fadeUp} className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-amber-400" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Photos</span>
                        </div>
                        <div>
                            <span className="text-3xl font-extrabold text-white font-[Outfit]">{stats.totalPhotos}</span>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatedSection>
        </div>
    )
}
