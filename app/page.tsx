"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { MapPin, Globe, BookOpen, Heart, ArrowRight, Loader2, Sparkles, Users, Star, Zap, Lock, Share2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-neutral-500 text-sm font-medium">Loading map...</span>
      </div>
    </div>
  )
})

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } }
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } }
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
}

const staggerSlow = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.18, delayChildren: 0.1 } }
}

// ─── Feature Data ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: MapPin,
    gradient: "from-indigo-500 to-violet-600",
    glow: "shadow-indigo-500/20",
    title: "Global Plotting",
    desc: "Drop memory pins anywhere on Earth with our interactive dark-mode map. Every coordinate tells a story.",
    badge: "Interactive"
  },
  {
    icon: BookOpen,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    title: "Rich Journaling",
    desc: "Attach stories, emotions, photos, music, and feelings to each geographical moment in your life.",
    badge: "Multimedia"
  },
  {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    title: "Community Driven",
    desc: "React, comment, and connect with explorers who share their memories with the world.",
    badge: "Social"
  },
  {
    icon: Lock,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    title: "Private by Default",
    desc: "Your memories are yours alone. Choose exactly what to share and what to keep close to heart.",
    badge: "Secure"
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
    title: "Instant Recall",
    desc: "Full-text search and date filters let you travel back to any moment within seconds.",
    badge: "Fast"
  },
  {
    icon: Share2,
    gradient: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    title: "Story Sharing",
    desc: "Share curated memories with friends via unique links — no account required to view.",
    badge: "Shareable"
  },
]

const stats = [
  { value: "∞", label: "Memories" },
  { value: "100+", label: "Countries" },
  { value: "Free", label: "Forever" },
  { value: "5★", label: "Experience" },
]

// ─── Section-level InView wrapper ────────────────────────────────────────────
function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session } = useSession()
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/memories?public=true")
      .then(res => res.json())
      .then(data => {
        setMemories(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setMemories([])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#080810] overflow-hidden relative selection:bg-indigo-500/30">

      {/* ── Ambient Background ──────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />
        {/* Orbs */}
        <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-indigo-600/[0.12] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-violet-600/[0.12] rounded-full blur-[140px]" />
        <div className="absolute top-[35%] left-[50%] w-[30%] h-[30%] bg-emerald-600/[0.06] rounded-full blur-[100px]" />
        <div className="absolute top-[60%] left-[20%] w-[25%] h-[25%] bg-rose-600/[0.05] rounded-full blur-[100px]" />
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="relative z-50 border-b border-white/[0.06]">
        <div
          className="absolute inset-0 backdrop-blur-2xl"
          style={{ background: "linear-gradient(to bottom, rgba(8,8,16,0.85), rgba(8,8,16,0.6))" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-12deg] group-hover:rotate-0 transition-all duration-300 shadow-lg shadow-indigo-500/30" />
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
                Memory<span className="text-indigo-400">Map</span>
              </span>
            </Link>

            {/* Nav links (desktop) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#map" className="hover:text-white transition-colors">Explore</a>
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold text-white
                             border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  <img
                    src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                    className="w-6 h-6 rounded-full border border-indigo-400/40"
                    alt=""
                  />
                  {session.user.name}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block text-sm font-medium text-neutral-400 hover:text-white transition-colors px-3">
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden group"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    <span className="relative">Get Started</span>
                    <ArrowRight className="relative w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="pt-20 md:pt-28 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="flex flex-col items-center text-center"
            >
              {/* Pill badge */}
              <motion.div variants={fadeUp} className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-indigo-300 border border-indigo-500/25 bg-indigo-500/[0.08] backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Your life, pinned to the world</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase tracking-wider">New</span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-7xl lg:text-[88px] font-extrabold font-[Outfit] text-white tracking-tight leading-[1.05] mb-6"
              >
                Map the{" "}
                <span
                  className="relative inline-block"
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundImage: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 100%)",
                    backgroundClip: "text"
                  }}
                >
                  Moments
                </span>
                <br />
                <span className="text-neutral-300">That Matter.</span>
              </motion.h1>

              {/* Subheader */}
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                More than a journal — MemoryMap lets you pin your life's most precious stories to their exact{" "}
                <span className="text-neutral-300">geographical locations</span>. Share with the world or keep them forever private.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {session?.user ? (
                  <Link
                    href="/dashboard"
                    className="group relative flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white overflow-hidden shadow-2xl"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)" }} />
                    <span className="relative flex items-center gap-2">
                      Return to Map
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="group relative flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white overflow-hidden shadow-2xl shadow-indigo-500/20"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)" }} />
                      <span className="relative flex items-center gap-2">
                        Start Mapping Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      {/* Glow ring */}
                      <span className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10"
                        style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }} />
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-7 py-4 rounded-full text-base font-medium text-neutral-300 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white transition-all backdrop-blur-sm"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Micro social proof */}
              <motion.div variants={fadeIn} className="mt-8 flex items-center gap-3 text-sm text-neutral-600">
                <div className="flex -space-x-2">
                  {["alice", "bob", "carol", "dave"].map(seed => (
                    <img
                      key={seed}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      className="w-7 h-7 rounded-full border-2 border-[#080810] bg-neutral-800"
                      alt=""
                    />
                  ))}
                </div>
                <span>Joined by <strong className="text-neutral-400">explorers worldwide</strong></span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Live Map Preview ─────────────────────────────────────────────── */}
        <section id="map" className="px-4 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.9, type: "spring", stiffness: 80 }}
            className="max-w-6xl mx-auto"
          >
            {/* Outer glow frame */}
            <div className="relative group">
              <div
                className="absolute -inset-px rounded-[28px] opacity-60 group-hover:opacity-90 transition-opacity duration-700 blur-xl"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #10b981 100%)" }}
              />

              {/* Card */}
              <div className="relative rounded-[24px] overflow-hidden border border-white/[0.08]"
                style={{ background: "rgba(12, 12, 22, 0.95)" }}>

                {/* Browser chrome bar */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs text-neutral-500 border border-white/[0.06]"
                      style={{ background: "rgba(255,255,255,0.03)", minWidth: "220px", maxWidth: "360px" }}>
                      <div className="w-3 h-3 rounded-full bg-emerald-400/60 shrink-0" />
                      <span className="truncate">memorymap.app/explore</span>
                    </div>
                  </div>
                  {/* Floating badge */}
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-300 border border-emerald-400/20 bg-emerald-400/[0.08]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </div>
                </div>

                {/* Real Map */}
                <div className="relative w-full" style={{ aspectRatio: "16/8.5" }}>
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                      style={{ background: "rgba(8,8,16,0.8)" }}>
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-neutral-500 text-sm">Loading live memories...</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                      <MapView memories={memories} />
                    </div>
                  )}

                  {/* Overlay: corner decorations */}
                  <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 backdrop-blur-md border border-white/10"
                      style={{ background: "rgba(8,8,16,0.7)" }}>
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Public Memories</span>
                    </div>
                  </div>

                  {/* Subtle vignette edges */}
                  <div className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: "radial-gradient(ellipse at center, transparent 60%, rgba(8,8,16,0.4) 100%)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)"
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Stats Strip ─────────────────────────────────────────────────── */}
        <section className="px-4 pb-24">
          <AnimatedSection className="max-w-4xl mx-auto">
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden border border-white/[0.06]"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex flex-col items-center justify-center py-8 px-4 text-center"
                  style={{ background: "rgba(8,8,16,0.7)" }}
                >
                  <span className="text-3xl md:text-4xl font-extrabold font-[Outfit] text-white mb-1"
                    style={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)",
                      backgroundClip: "text"
                    }}>
                    {stat.value}
                  </span>
                  <span className="text-sm text-neutral-500 font-medium">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* ── Features Grid ────────────────────────────────────────────────── */}
        <section id="features" className="px-4 pb-32">
          <AnimatedSection className="max-w-7xl mx-auto">
            {/* Section header */}
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-neutral-400 mb-5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                Everything you need
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white leading-tight mb-4">
                Relive the past,<br />
                <span style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
                  backgroundClip: "text"
                }}>build the future.</span>
              </h2>
              <p className="text-neutral-500 text-lg max-w-xl mx-auto leading-relaxed">
                Every feature is crafted to make your journey of reminiscence beautiful, secure, and deeply personal.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  className="group relative rounded-2xl p-6 border border-white/[0.07] overflow-hidden cursor-default"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
                >
                  {/* Hover gradient bg */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.05]`} />

                  {/* Gradient border on hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    style={{ background: `linear-gradient(135deg, transparent 60%, rgba(99,102,241,0.08) 100%)` }} />

                  {/* Icon */}
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow}`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Badge */}
                  <span className="inline-block mb-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-neutral-500 border border-white/[0.08]">
                    {feature.badge}
                  </span>

                  <h3 className="text-lg font-bold font-[Outfit] text-white mb-2">{feature.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────────────────── */}
        <section className="px-4 pb-32">
          <AnimatedSection className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeUp}
              className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
            >
              {/* BG */}
              <div className="absolute inset-0 -z-10"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(168,85,247,0.1) 100%)" }} />
              <div className="absolute inset-0 -z-10 border border-white/[0.08] rounded-3xl" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6">
                <Users className="w-3.5 h-3.5" />
                Join the community
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold font-[Outfit] text-white mb-4">
                Your memories deserve<br />a beautiful home.
              </h2>
              <p className="text-neutral-400 text-lg mb-10 max-w-lg mx-auto">
                Start pinning your life's most meaningful moments to the world map — completely free.
              </p>

              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 group"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 group"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </motion.div>
          </AnimatedSection>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/[0.06]" style={{ background: "rgba(8,8,16,0.9)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center rotate-[-8deg] shadow-md shadow-indigo-500/30">
                <MapPin className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-lg font-[Outfit] text-white">
                Memory<span className="text-indigo-400">Map</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-neutral-600">
              <a href="#" className="hover:text-neutral-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-neutral-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-neutral-300 transition-colors">Contact</a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-neutral-700">
              © {new Date().getFullYear()} MemoryMap. Made with ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
