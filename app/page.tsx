"use client"

import Link from "next/link"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { MapPin, Globe, BookOpen, Heart, ArrowRight, Loader2, Users, Star, Zap, Lock, Share2, UserPlus, PenLine, ImagePlus, Twitter, Instagram, Github, X, Menu, Mail, Phone, Send, Smartphone, Bell, Construction, Activity, Shield, Clock, Server, Sparkles, Bug, Palette, GitBranch, MessageCircle, Headphones, Music, Coins, ChevronLeft, ChevronRight, Play, Pause, SkipForward, Volume2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { NotificationDropdown } from "@/components/layout/NotificationDropdown"

const GlobeView = dynamic(() => import("@/components/map/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-neutral-500 text-sm font-medium">Memuat globe...</span>
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
    title: "Tandai di Mana Saja",
    desc: "Tancapkan pin kenangan di mana pun di bumi ini pakai peta dark-mode interaktif kami. Setiap koordinat punya cerita.",
    badge: "Interaktif"
  },
  {
    icon: BookOpen,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    title: "Jurnal Lengkap",
    desc: "Curhatin cerita, emosi, foto, musik, dan perasaanmu di setiap momen geografis dalam hidupmu.",
    badge: "Multimedia"
  },
  {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    title: "Berbasis Komunitas",
    desc: "React, komentar, dan terhubung sama para penjelajah yang berbagi kenangan mereka ke dunia.",
    badge: "Sosial"
  },
  {
    icon: Lock,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    title: "Privat secara Default",
    desc: "Kenanganmu ya milik kamu. Pilih sendiri mau dibagiin ke siapa atau disimpan rapat-rapat.",
    badge: "Aman"
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
    title: "Temukan Secepat Kilat",
    desc: "Pencarian teks penuh dan filter tanggal bikin kamu bisa balik ke momen apa pun dalam hitungan detik.",
    badge: "Cepat"
  },
  {
    icon: Share2,
    gradient: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    title: "Bagikan Ceritamu",
    desc: "Bagikan kenangan pilihanmu ke teman lewat link unik — nggak perlu akun buat bisa lihatnya.",
    badge: "Shareable"
  },
]

const stats = [
  { value: "∞", label: "Kenangan" },
  { value: "100+", label: "Negara" },
  { value: "Gratis", label: "Selamanya" },
  { value: "5★", label: "Pengalaman" },
]

// ─── How It Works Steps ───────────────────────────────────────────────────────
const howItWorksSteps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Buat Akunmu",
    desc: "Daftar gratis dalam hitungan detik, nggak perlu kartu kredit. Akunmu adalah brankas kenangan pribadimu.",
    color: "#818cf8",
    gradient: "from-indigo-500 to-violet-600",
    glow: "rgba(99,102,241,0.3)",
    border: "rgba(99,102,241,0.2)",
    bg: "rgba(99,102,241,0.06)",
    cta: { label: "Mulai sekarang", href: "/register" },
  },
  {
    number: "02",
    icon: MapPin,
    title: "Pilih Lokasi di Peta",
    desc: "Cari dan ketuk di mana saja di peta dunia kami yang interaktif buat nancapin pin kenangan di tempat pastinya.",
    color: "#a78bfa",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.3)",
    border: "rgba(139,92,246,0.2)",
    bg: "rgba(139,92,246,0.06)",
    cta: null,
  },
  {
    number: "03",
    icon: PenLine,
    title: "Tulis Kenanganmu",
    desc: "Kasih judul, tanggal, dan ceritamu. Tuangkan perasaanmu ke dalam kata-kata singkat atau panjang, ini kanvasmu.",
    color: "#60a5fa",
    gradient: "from-sky-500 to-blue-600",
    glow: "rgba(59,130,246,0.3)",
    border: "rgba(59,130,246,0.2)",
    bg: "rgba(59,130,246,0.06)",
    cta: null,
  },
  {
    number: "04",
    icon: ImagePlus,
    title: "Tambah Foto & Suasana",
    desc: "Upload foto dan kasih tag emosi Bahagia, Nostalgia, Romantis, Petualangan, dan masih banyak lagi biar kenanganmu makin hidup.",
    color: "#fbbf24",
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(245,158,11,0.3)",
    border: "rgba(245,158,11,0.2)",
    bg: "rgba(245,158,11,0.06)",
    cta: null,
  },
  {
    number: "05",
    icon: Share2,
    title: "Bagikan atau Simpan Sendiri",
    desc: "Jadikan kenangan kamu publik buat ditemukan komunitas, atau simpan buat diri sendiri aman selamanya.",
    color: "#34d399",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(52,211,153,0.3)",
    border: "rgba(52,211,153,0.2)",
    bg: "rgba(52,211,153,0.06)",
    cta: { label: "Jelajahi komunitas", href: "/community" },
  },
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

// ─── Interactive How It Works Timeline ────────────────────────────────────
function HowItWorksTimeline() {
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set(["01"]))

  const toggle = (number: string) => {
    setOpenSteps(prev => {
      const next = new Set(prev)
      next.has(number) ? next.delete(number) : next.add(number)
      return next
    })
  }

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={stagger}
      className="max-w-5xl mx-auto"
    >
      {/* Section header */}
      <motion.div variants={fadeUp} className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-neutral-400 mb-5 backdrop-blur-sm">
          Langkah demi langkah
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white leading-tight mb-4">
          Cara{" "}
          <span style={{
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
            backgroundClip: "text"
          }}>Kerjanya</span>
        </h2>
        <p className="text-neutral-500 text-lg max-w-7xl mx-auto leading-relaxed">
          Dari daftar akun, sampai berbagi kenangan pertamamu hanya dalam lima langkah.
        </p>
      </motion.div>

      {/* ════════════════ DESKTOP: 3-row horizontal layout ════════════════ */}
      <motion.div variants={fadeUp} className="hidden md:block">

        {/* ROW 1 — Icon buttons */}
        <div className="grid grid-cols-5 gap-x-3">
          {howItWorksSteps.map(step => {
            const Icon = step.icon
            const isOpen = openSteps.has(step.number)
            return (
              <div key={step.number} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => toggle(step.number)}
                  className="relative focus:outline-none group/icon"
                  aria-expanded={isOpen}
                >
                  {/* Glow halo */}
                  <motion.div
                    animate={{ opacity: isOpen ? 0.85 : 0.2, scale: isOpen ? 1.5 : 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
                    style={{ background: step.glow }}
                  />
                  {/* Icon square */}
                  <motion.div
                    animate={{
                      scale: isOpen ? 1.1 : 1,
                      boxShadow: isOpen
                        ? `0 16px 48px ${step.glow}, 0 0 0 1.5px ${step.border}`
                        : `0 4px 16px ${step.glow.replace("0.3", "0.1")}`
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.gradient} z-10`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                </button>
                {/* Step number label */}
                <motion.span
                  animate={{ opacity: isOpen ? 1 : 0.4 }}
                  className="text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ color: step.color }}
                >
                  {step.number}
                </motion.span>
              </div>
            )
          })}
        </div>

        {/* ROW 2 — Horizontal spine + dots + vertical connectors */}
        <div className="relative grid grid-cols-5 gap-x-3" style={{ height: "44px" }}>
          {/* Gradient spine line */}
          <div
            className="absolute left-[10%] right-[10%] h-px top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(99,102,241,0.6), rgba(139,92,246,0.5), rgba(59,130,246,0.4), rgba(245,158,11,0.4), rgba(52,211,153,0.55))"
            }}
          />
          {howItWorksSteps.map(step => {
            const isOpen = openSteps.has(step.number)
            return (
              <div key={step.number} className="flex flex-col items-center justify-between h-full">
                {/* Top connector (icon → dot) */}
                <div
                  className="w-px flex-1"
                  style={{ background: `linear-gradient(to bottom, transparent, ${step.border})` }}
                />
                {/* Dot */}
                <motion.button
                  onClick={() => toggle(step.number)}
                  animate={{
                    scale: isOpen ? 1.7 : 1,
                    backgroundColor: isOpen ? step.color : "rgba(255,255,255,0.18)",
                    boxShadow: isOpen ? `0 0 18px 5px ${step.glow}` : "none"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="w-3 h-3 rounded-full z-10 shrink-0 cursor-pointer focus:outline-none"
                />
                {/* Bottom connector (dot → card), extends when open */}
                <motion.div
                  animate={{
                    flexGrow: isOpen ? 1 : 0,
                    opacity: isOpen ? 1 : 0
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="w-px min-h-0"
                  style={{ background: `linear-gradient(to bottom, ${step.color}, transparent)` }}
                />
              </div>
            )
          })}
        </div>

        {/* ROW 3 — Expandable cards (same 5-col grid, aligned) */}
        <div className="grid grid-cols-5 gap-x-3">
          {howItWorksSteps.map(step => {
            const isOpen = openSteps.has(step.number)
            return (
              <motion.div
                key={step.number}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                initial={false}
                transition={{
                  height: { type: "spring", stiffness: 270, damping: 30 },
                  opacity: { duration: 0.22 }
                }}
                style={{ overflow: "hidden" }}
              >
                <div
                  className="rounded-2xl p-4 border relative overflow-hidden"
                  style={{
                    background: step.bg,
                    borderColor: step.border,
                    backdropFilter: "blur(16px)",
                    boxShadow: `0 12px 40px ${step.glow.replace("0.3", "0.1")}, inset 0 1px 0 rgba(255,255,255,0.06)`
                  }}
                >
                  {/* Corner ambient glow */}
                  <div
                    className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${step.glow.replace("0.3", "0.18")}, transparent 70%)` }}
                  />
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: step.color }}>
                    Step {step.number}
                  </span>
                  <h3 className="text-sm font-bold font-[Outfit] text-white mb-1.5 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {step.desc}
                  </p>
                  {step.cta && (
                    <Link
                      href={step.cta.href}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-semibold group/cta transition-colors"
                      style={{ color: step.color }}
                    >
                      {step.cta.label}
                      <ArrowRight className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ════════════════ MOBILE: vertical accordion ════════════════ */}
      <motion.div variants={fadeUp} className="md:hidden relative">
        {/* Vertical spine */}
        <div
          className="absolute left-[27px] top-6 bottom-6 w-px pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 40%, rgba(59,130,246,0.2) 60%, rgba(245,158,11,0.2) 80%, rgba(52,211,153,0.4) 100%)"
          }}
        />
        <div className="space-y-3">
          {howItWorksSteps.map(step => {
            const Icon = step.icon
            const isOpen = openSteps.has(step.number)
            return (
              <div key={step.number} className="relative">
                <button
                  onClick={() => toggle(step.number)}
                  className="w-full flex items-center gap-5 group/step text-left"
                  aria-expanded={isOpen}
                >
                  {/* Icon */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      animate={{ opacity: isOpen ? 0.85 : 0.25, scale: isOpen ? 1.4 : 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
                      style={{ background: step.glow }}
                    />
                    <motion.div
                      animate={{
                        scale: isOpen ? 1.08 : 1,
                        boxShadow: isOpen
                          ? `0 12px 40px ${step.glow}, 0 0 0 1.5px ${step.border}`
                          : `0 4px 16px ${step.glow.replace("0.3", "0.12")}`
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.gradient} z-10`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                  {/* Collapsed inline label */}
                  <AnimatePresence initial={false}>
                    {!isOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.18 }}
                        className="flex-1 min-w-0"
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: step.color }}>
                          Step {step.number}
                        </span>
                        <p className="text-sm font-semibold text-neutral-300 group-hover/step:text-white transition-colors leading-tight mt-0.5 truncate">
                          {step.title}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Chevron */}
                  <div className={`ml-auto mr-1 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-600 group-hover/step:text-neutral-400 transition-colors">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
                {/* Expanded card */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: { type: "spring", stiffness: 280, damping: 28 }, opacity: { duration: 0.22 } }}
                      style={{ overflow: "hidden" }}
                    >
                      <motion.div
                        initial={{ y: -8 }}
                        animate={{ y: 0 }}
                        exit={{ y: -8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        className="ml-[76px] mt-3 mb-2"
                      >
                        <div
                          className="rounded-2xl p-5 border relative overflow-hidden"
                          style={{
                            background: step.bg,
                            borderColor: step.border,
                            backdropFilter: "blur(16px)",
                            boxShadow: `0 16px 48px ${step.glow.replace("0.3", "0.12")}, inset 0 1px 0 rgba(255,255,255,0.06)`
                          }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                            style={{ background: `radial-gradient(circle at top right, ${step.glow.replace("0.3", "0.2")}, transparent 70%)` }} />
                          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: step.color }}>
                            Step {step.number}
                          </span>
                          <h3 className="text-lg font-bold font-[Outfit] text-white mb-2 leading-snug">{step.title}</h3>
                          <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
                          {step.cta && (
                            <Link
                              href={step.cta.href}
                              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold transition-colors group/cta"
                              style={{ color: step.color }}
                            >
                              {step.cta.label}
                              <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-1 transition-transform" />
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    const duration = 2000

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4) // easeOutQuart

      setDisplayValue(value * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  const formatted = value % 1 !== 0 ? displayValue.toFixed(1) : Math.round(displayValue).toString()
  return <>{formatted}{suffix}</>
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session } = useSession()
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isBlogOpen, setIsBlogOpen] = useState(false)
  const [isMobileAppOpen, setIsMobileAppOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Welcome popup states
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [welcomeSlide, setWelcomeSlide] = useState(0)

  // Show welcome popup unless user explicitly clicked "Jangan tampilkan" (valid for 1 hour)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dontShowUntilStr = localStorage.getItem("mm_welcome_hide_until")
      let shouldShow = true

      if (dontShowUntilStr) {
        const dontShowUntil = parseInt(dontShowUntilStr, 10)
        if (Date.now() < dontShowUntil) {
          shouldShow = false
        } else {
          localStorage.removeItem("mm_welcome_hide_until")
        }
      }

      if (shouldShow) {
        const timer = setTimeout(() => setIsWelcomeOpen(true), 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const closeWelcome = () => {
    setIsWelcomeOpen(false)
  }

  const dontShowAgain = () => {
    setIsWelcomeOpen(false)
    // Hide for 1 hour
    const oneHourFromNow = Date.now() + 60 * 60 * 1000
    localStorage.setItem("mm_welcome_hide_until", oneHourFromNow.toString())
  }

  // Smooth scroll logic
  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // height of fixed header approx
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

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
      <nav className="fixed top-0 w-full z-50 transition-all duration-300">
        {/* Glassmorphism Background */}
        <div
          className="absolute inset-0 backdrop-blur-xl border-b border-white/[0.08]"
          style={{ background: "rgba(8,8,16,0.7)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)" }}
        />

        {/* Subtle Bottom Gradient Line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-indigo-500/30" />
                <MapPin className="relative w-5 h-5 text-white z-10" />
              </div>
              <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
                Memory<span className="text-indigo-400">Map</span>
              </span>
            </Link>

            {/* Nav links (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: 'Fitur', id: 'features' },
                { label: 'Cara Kerja', id: 'how-it-works' },
                { label: 'Jelajahi', id: 'map' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Auth */}
            <div className="flex items-center gap-2 sm:gap-4">
              {session?.user ? (
                <>
                  <NotificationDropdown />
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold text-white
                               border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm shadow-sm"
                  >
                    <img
                      src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                      className="w-6 h-6 rounded-full border border-indigo-400/40"
                      alt="User avatar"
                    />
                    <span className="inline">{session.user.name}</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="sm:hidden flex items-center justify-center relative w-9 h-9 rounded-full border border-white/10 bg-white/5"
                  >
                    <img
                      src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                      className="w-full h-full rounded-full object-cover"
                      alt="User avatar"
                    />
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/[0.05] transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="relative hidden md:inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden group shadow-lg shadow-indigo-500/20"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                    <span className="relative">Mulai Gratis</span>
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/[0.06] bg-[#0c0c16]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-5 py-6 flex flex-col gap-3">
                {[
                  { label: 'Fitur', id: 'features' },
                  { label: 'Cara Kerja', id: 'how-it-works' },
                  { label: 'Jelajahi Peta', id: 'map' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false)
                      // Use setTimeout to allow the menu collapse animation to yield the correct scroll position
                      setTimeout(() => scrollToSection(e, item.id), 150)
                    }}
                    className="text-left px-4 py-3 text-[15px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                  >
                    {item.label}
                  </button>
                ))}

                {!session?.user && (
                  <Link
                    href="/register"
                    className="mt-4 w-full relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-white overflow-hidden shadow-lg shadow-indigo-500/20"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="relative">Mulai Gratis</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <motion.div variants={fadeUp} className="mb-8 mt-6 md:mt-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-indigo-300 border border-indigo-500/25 bg-indigo-500/[0.08] backdrop-blur-sm">
                  <span>Hidupmu, tertancap di peta dunia</span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-7xl lg:text-[88px] font-extrabold font-[Outfit] text-white tracking-tight leading-[1.05] mb-6"
              >
                Tandai{" "}
                <span
                  className="relative inline-block"
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundImage: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 100%)",
                    backgroundClip: "text"
                  }}
                >
                  Momenmu
                </span>
                <br />
                <span className="text-neutral-300">yang Berarti.</span>
              </motion.h1>

              {/* Subheader */}
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-neutral-500 max-w-4xl mx-auto mb-10 leading-relaxed">
                Lebih dari sekadar jurnal, MemoryMap bikin kamu bisa menancapkan cerita hidupmu ke{" "}
                <span className="text-neutral-300">lokasi pastinya di peta</span>. Mau dibagikan ke dunia atau disimpan buat diri sendiri, semuanya bisa.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeUp} className="flex flex-row items-center justify-center gap-3">
                {session?.user ? (
                  <Link
                    href="/dashboard"
                    className="group relative flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white overflow-hidden shadow-2xl"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)" }} />
                    <span className="relative flex items-center gap-2">
                      Mulai Sekarang
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
                        Mulai Gratis
                      </span>
                      {/* Glow ring */}
                      <span className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10"
                        style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }} />
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-7 py-4 rounded-full text-base font-medium text-neutral-300 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white transition-all backdrop-blur-sm"
                    >
                      Masuk
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
                <span>Bergabung bersama <strong className="text-neutral-400">di seluruh dunia</strong></span>
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
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                      style={{ background: "rgba(8,8,16,0.8)" }}>
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <span className="text-neutral-500 text-sm">Memuat kenangan...</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <GlobeView memories={memories} />
                    </div>
                  )}

                  {/* Overlay: corner decorations */}
                  <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 backdrop-blur-md border border-white/10"
                      style={{ background: "rgba(8,8,16,0.7)" }}>
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{memories.length} Kenangan Publik</span>
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
                Semua yang kamu butuhkan
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white leading-tight mb-4">
                When Loves End<br />
                <span style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
                  backgroundClip: "text"
                }}>Memories Begin</span>
              </h2>
              <p className="text-neutral-500 text-lg max-w-7xl mx-auto leading-relaxed">
                Setiap fitur dirancang biar perjalanan kenanganmu terasa indah, aman, dan benar-benar personal.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  className="group relative rounded-2xl p-4 sm:p-6 border border-white/[0.07] overflow-hidden cursor-default"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
                >
                  {/* Hover gradient bg */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.05]`} />

                  {/* Gradient border on hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    style={{ background: `linear-gradient(135deg, transparent 60%, rgba(99,102,241,0.08) 100%)` }} />

                  {/* Icon */}
                  <div className={`relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-5 bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow}`}>
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>

                  {/* Badge */}
                  <span className="hidden sm:inline-block mb-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-neutral-500 border border-white/[0.08]">
                    {feature.badge}
                  </span>

                  <h3 className="text-sm sm:text-lg font-bold font-[Outfit] text-white mb-1 sm:mb-2 leading-tight">{feature.title}</h3>
                  <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* ── How It Works — Interactive Timeline ────────────────────────────── */}
        <section id="how-it-works" className="px-4 pb-32">
          <HowItWorksTimeline />
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
                Gabung komunitas
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold font-[Outfit] text-white mb-4">
                Kenanganmu layak punya<br />tempat yang indah.
              </h2>
              <p className="text-neutral-400 text-lg mb-10 max-w-4xl mx-auto">
                Mulai tancapin momen paling bermakna dalam hidupmu ke peta dunia sepenuhnya gratis.
              </p>

              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 group"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}
                >
                  Buka Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 group"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}
                >
                  Buat Akun Gratis
                </Link>
              )}
            </motion.div>
          </AnimatedSection>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/[0.06] overflow-hidden" style={{ background: "rgba(8,8,16,0.95)" }}>
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />

        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

            {/* Brand Column (takes 2 cols on lg) */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6 group inline-flex">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center rotate-[-8deg] group-hover:rotate-0 transition-all duration-300 shadow-lg shadow-indigo-500/30">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-2xl font-[Outfit] text-white tracking-tight">
                  Memory<span className="text-indigo-400">Map</span>
                </span>
              </Link>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-8">
                Platform jurnal visual interaktif yang membantu Anda mengabadikan, membagikan, dan mengenang setiap momen berharga tepat di lokasi ia terjadi.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-4 mt-8">
                {[
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Instagram, href: "#", label: "Instagram" },
                  { icon: Github, href: "#", label: "GitHub" },
                ].map((social, i) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={i}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all"
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Links Columns Group */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
              {/* Links - Produk */}
              <div>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-[13px] font-[Outfit]">Produk</h4>
                <ul className="space-y-3.5 flex flex-col items-start">
                  <li>
                    <button onClick={(e) => scrollToSection(e, "features")} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors text-left">Fitur</button>
                  </li>
                  <li>
                    <button onClick={(e) => scrollToSection(e, "how-it-works")} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors text-left">Cara Kerja</button>
                  </li>
                  <li>
                    <button onClick={(e) => scrollToSection(e, "map")} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors text-left">Jelajahi Peta</button>
                  </li>
                  <li>
                    <button onClick={(e) => { e.preventDefault(); setIsMobileAppOpen(true); }} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Aplikasi Mobile</button>
                  </li>
                </ul>
              </div>

              {/* Links - Perusahaan */}
              <div>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-[13px] font-[Outfit]">Perusahaan</h4>
                <ul className="space-y-3.5 flex flex-col items-start">
                  <li className="w-full">
                    <a href="#" className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Tentang Kami</a>
                  </li>
                  <li className="w-full">
                    <button onClick={(e) => { e.preventDefault(); setIsBlogOpen(true); }} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Blog</button>
                  </li>
                  <li className="w-full">
                    <button onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Kontak</button>
                  </li>
                </ul>
              </div>

              {/* Links - Sumber Daya */}
              <div>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-[13px] font-[Outfit]">Sumber Daya</h4>
                <ul className="space-y-3.5 flex flex-col items-start">
                  <li className="w-full">
                    <a href="#" className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Komunitas</a>
                  </li>
                  <li className="w-full">
                    <button onClick={(e) => { e.preventDefault(); setIsChangelogOpen(true); }} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Status Sistem</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} MemoryMap Inc. Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <button onClick={() => setIsPrivacyOpen(true)} className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors">Kebijakan Privasi</button>
              <button onClick={() => setIsTermsOpen(true)} className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors">Ketentuan Layanan</button>
              <a href="#" className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors">Pengaturan Cookie</a>
            </div>
            {/* Built with love mark */}
            <div className="text-[13px] text-neutral-600 lg:flex items-center gap-2 hidden">
              Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" /> di Indonesia
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <h3 className="text-xl font-bold text-white font-[Outfit]">Kebijakan Privasi</h3>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar text-neutral-300 text-sm leading-relaxed space-y-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">1. Pengumpulan Informasi</h4>
                  <p>Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami saat Anda membuat akun, memposting kenangan, atau berkomunikasi dengan kami. Informasi ini dapat mencakup nama pengguna, alamat email, foto, teks kenangan, dan data lokasi geografis (koordinat peta) yang Anda sertakan pada setiap memori Anda.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">2. Penggunaan Informasi</h4>
                  <p>Informasi yang kami kumpulkan digunakan untuk menyediakan, memelihara, dan meningkatkan layanan MemoryMap, termasuk untuk memetakan kenangan Anda secara akurat, menampilkan profil Anda, dan memungkinkan fitur sosial jika Anda memilih untuk membuat kenangan Anda menjadi publik.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">3. Keamanan Data</h4>
                  <p>Kami menerapkan langkah-sehari-hari keamanan yang dirancang untuk melindungi informasi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, perlu diingat bahwa tidak ada sistem transmisi atau penyimpanan elektronik yang aman di internet secara absolut.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">4. Kontrol Pengguna</h4>
                  <p>Anda selalu memiliki kendali atas kenangan yang Anda buat. Anda dapat mengatur privasi memori (publik atau privat), mengubah detail memori, atau menghapus akun dan seluruh data terkait kapan saja melalui pengaturan akun Anda.</p>
                </div>
                <p className="text-neutral-500 text-xs mt-8">Pembaruan Terakhir: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </motion.div>
          </div>
        )}

        {isTermsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <h3 className="text-xl font-bold text-white font-[Outfit]">Ketentuan Layanan</h3>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar text-neutral-300 text-sm leading-relaxed space-y-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">1. Penerimaan Syarat</h4>
                  <p>Dengan mengakses atau menggunakan platform MemoryMap, Anda menyetujui untuk terikat dengan Ketentuan Layanan ini. Jika Anda tidak setuju dengan ketentuan layanan ini, Anda dilarang menggunakan atau mengakses situs ini.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">2. Pengguna Akun</h4>
                  <p>Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi dan akun Anda, serta sepenuhnya bertanggung jawab atas seluruh aktivitas yang terjadi menggunakan kata sandi atau akun Anda.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">3. Pedoman Konten</h4>
                  <p>Anda setuju untuk tidak memposting, mengunggah, atau mendistribusikan kenangan yang mengandung materi yang:</p>
                  <ul className="list-disc leading-relaxed pl-5 mt-2 space-y-1 text-neutral-400">
                    <li>Ilegal, memfitnah, atau mengancam</li>
                    <li>Melanggar hak cipta, merek dagang, atau kekayaan intelektual orang lain</li>
                    <li>Mengandung virus atau kode komputer berbahaya</li>
                    <li>Mempromosikan kebencian, kekerasan, atau diskriminasi</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">4. Hak Penghentian</h4>
                  <p>Kami dapat menghentikan atau membekukan akun Anda segera, tanpa pemberitahuan sebelumnya, untuk alasan apa pun, termasuk tanpa batas jika Anda melanggar Ketentuan Layanan ini.</p>
                </div>
                <p className="text-neutral-500 text-xs mt-8">Pembaruan Terakhir: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </motion.div>
          </div>
        )}

        {isChangelogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangelogOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Activity className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-[Outfit]">Status Sistem & Changelog</h3>
                </div>
                <button
                  onClick={() => setIsChangelogOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {/* System Status Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 mb-6">
                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(52,211,153,0.15), transparent 70%)" }} />
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <div className="relative">
                        <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-40"></span>
                        <Shield className="relative w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-emerald-300 font-bold text-[15px] mb-1.5 font-[Outfit]">Semua Sistem Berjalan Normal</h4>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Layanan MemoryMap saat ini beroperasi dengan lancar tanpa ada gangguan yang dilaporkan. Kami terus memantau performa sistem secara real-time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {[
                    { icon: Server, label: "Uptime", value: 99.9, isNumber: true, suffix: "%", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15" },
                    { icon: Zap, label: "Respons", value: 42, isNumber: true, suffix: "ms", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" },
                    { icon: Globe, label: "API", value: "Aktif", isNumber: false, suffix: "", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/15" },
                    { icon: Users, label: "Pengguna", value: "Online", isNumber: false, suffix: "", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/15" },
                  ].map((metric, i) => {
                    const Icon = metric.icon
                    return (
                      <div key={i} className={`p-3.5 rounded-xl border ${metric.border} bg-white/[0.02] text-center hover:bg-white/[0.04] transition-colors`}>
                        <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className={`w-4 h-4 ${metric.color}`} />
                        </div>
                        <p className={`text-lg font-bold ${metric.color} font-[Outfit]`}>
                          {metric.isNumber ? (
                            <AnimatedCounter value={metric.value as number} suffix={metric.suffix} />
                          ) : (
                            metric.value
                          )}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 uppercase tracking-wider font-medium">{metric.label}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Changelog Section */}
                <div className="border-t border-white/[0.06] pt-6">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <h4 className="text-white font-bold text-lg font-[Outfit]">Changelog Terbaru</h4>
                    <span className="ml-auto px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-wider">Live</span>
                  </div>

                  <div className="relative space-y-3">
                    {/* Timeline connector */}
                    <div className="absolute left-[19px] top-8 bottom-8 w-[1px] bg-gradient-to-b from-[#1DB954]/40 via-indigo-500/20 to-transparent pointer-events-none" />

                    {/* V2.3 — Spotify Integration (NEW) */}
                    <div className="relative overflow-hidden rounded-2xl border border-[#1DB954]/30 p-5" style={{ background: "linear-gradient(135deg, rgba(29,185,84,0.06), rgba(0,0,0,0), rgba(29,185,84,0.03))" }}>
                      {/* Spotify glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(29,185,84,0.15), transparent 70%)" }} />
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: "linear-gradient(180deg, #1DB954, rgba(29,185,84,0.2))" }} />

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        {/* Spotify dot on timeline */}
                        <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-[#1DB954] bg-[#0a0f0a] shadow-[0_0_8px_rgba(29,185,84,0.6)]" />
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border" style={{ backgroundColor: "rgba(29,185,84,0.15)", color: "#1DB954", borderColor: "rgba(29,185,84,0.35)" }}>Terbaru</span>
                        <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.3</span>
                        <span className="text-[11px] text-neutral-500 ml-auto">April 2026</span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#1DB954">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        <h5 className="text-white font-bold text-[15px] font-[Outfit]">Spotify Music Integration</h5>
                      </div>

                      <div className="space-y-2 pl-1">
                        {[
                          { text: "Integrasi Spotify API untuk mencari dan memilih lagu langsung dari platform.", tag: "Integrasi" },
                          { text: "Lampirkan lagu Spotify ke setiap kenangan untuk menciptakan soundtrack memorimu.", tag: "Fitur Baru" },
                          { text: "Pemutar Spotify Embed terintegrasi pada detail kenangan dan peta interaktif.", tag: "Fitur Baru" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.25)" }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#1DB954" }} />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm text-neutral-300 leading-relaxed">{item.text}</span>
                              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: "rgba(29,185,84,0.1)", color: "#1DB954" }}>{item.tag}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* V2.2 — Memory Points */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5 hover:bg-amber-500/[0.05] transition-colors">
                      <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(245,158,11,0.1), transparent 70%)" }} />
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-amber-500/40" />

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-amber-500/60 bg-[#0c0a06]" />
                        <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.2</span>
                        <span className="text-[11px] text-neutral-500 ml-auto">April 2026</span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <Star className="w-4 h-4 text-amber-400 shrink-0" />
                        <h5 className="text-white font-bold text-[15px] font-[Outfit]">Sistem Memory Point</h5>
                      </div>

                      <div className="space-y-2 pl-1">
                        {[
                          { icon: Sparkles, text: "Integrasi fitur Exchange Memory Point untuk menukar poin dengan item eksklusif.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                          { icon: Sparkles, text: "Peluncuran fitur Topup Memory Point secara manual dengan konfirmasi admin.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0 mt-0.5`}>
                              <item.icon className={`w-3 h-3 ${item.color}`} />
                            </div>
                            <span className="text-sm text-neutral-300 leading-relaxed">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* V2.1 — Community */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 hover:bg-white/[0.03] transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-sky-500/30" />

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-sky-500/40 bg-[#06090c]" />
                        <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.1</span>
                        <span className="text-[11px] text-neutral-500 ml-auto">Maret 2026</span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <Users className="w-4 h-4 text-sky-400 shrink-0" />
                        <h5 className="text-white font-bold text-[15px] font-[Outfit]">Fitur Komunitas & Peningkatan Performa</h5>
                      </div>

                      <div className="space-y-2 pl-1">
                        {[
                          { icon: Globe, text: "Penambahan halaman jelajah real-time untuk melihat kenangan dari komunitas global.", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
                          { icon: Zap, text: "Optimasi kecepatan rendering peta interaktif hingga 30% lebih cepat pada perangkat mobile.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                          { icon: Bug, text: "Perbaikan bug minor terkait sinkronisasi data profil pengguna.", color: "text-neutral-400", bg: "bg-white/[0.06]", border: "border-white/[0.08]" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0 mt-0.5`}>
                              <item.icon className={`w-3 h-3 ${item.color}`} />
                            </div>
                            <span className="text-sm text-neutral-400 leading-relaxed">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* V2.0 — Dashboard Redesign */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 hover:bg-white/[0.03] transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-violet-500/30" />

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-violet-500/40 bg-[#09060c]" />
                        <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.0</span>
                        <span className="text-[11px] text-neutral-500 ml-auto">Februari 2026</span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <Palette className="w-4 h-4 text-violet-400 shrink-0" />
                        <h5 className="text-white font-bold text-[15px] font-[Outfit]">Desain Ulang Dashboard</h5>
                      </div>

                      <div className="space-y-2 pl-1">
                        {[
                          { icon: Palette, text: "Pembaruan antarmuka pengguna secara menyeluruh dengan elemen glassmorphism.", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                          { icon: Sparkles, text: "Mode gelap cerdas (smart dark mode) dengan kontras yang disempurnakan.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                          { icon: Sparkles, text: "Sistem filter canggih untuk memilah memori berdasarkan kategori.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0 mt-0.5`}>
                              <item.icon className={`w-3 h-3 ${item.color}`} />
                            </div>
                            <span className="text-sm text-neutral-400 leading-relaxed">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* V1.5 — Initial Release */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 hover:bg-white/[0.03] transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-white/10" />

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-white/20 bg-[#0c0c16]" />
                        <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v1.5</span>
                        <span className="text-[11px] text-neutral-500 ml-auto">Januari 2026</span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-3 pl-1">
                        <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                        <h5 className="text-white font-bold text-[15px] font-[Outfit]">Rilis Utama</h5>
                      </div>

                      <div className="space-y-2 pl-1">
                        {[
                          { icon: MapPin, text: "Fitur penanda lokasi interaktif yang otomatis menyinkronkan zona waktu.", color: "text-neutral-400", bg: "bg-white/[0.06]", border: "border-white/[0.08]" },
                          { icon: Lock, text: "Profil pengguna dasar beserta fitur Single Sign-On (SSO) Google terintegrasi.", color: "text-neutral-400", bg: "bg-white/[0.06]", border: "border-white/[0.08]" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0 mt-0.5`}>
                              <item.icon className={`w-3 h-3 ${item.color}`} />
                            </div>
                            <span className="text-sm text-neutral-500 leading-relaxed">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] text-center">
                  <p className="text-sm text-neutral-300 mb-1">Ada kendala atau saran?</p>
                  <p className="text-xs text-neutral-500">Hubungi tim dukungan kami melalui halaman Kontak untuk melaporkan masalah atau memberikan masukan.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isContactOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                    <Headphones className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-[Outfit]">Hubungi Kami</h3>
                </div>
                <button
                  onClick={() => setIsContactOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-5 mb-6">
                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(14,165,233,0.15), transparent 70%)" }} />
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0 border border-sky-500/20">
                      <MessageCircle className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h4 className="text-sky-300 font-bold text-[15px] mb-1.5 font-[Outfit]">Kami Siap Membantu Anda</h4>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Punya pertanyaan, masukan, atau kendala terkait MemoryMap? Tim dukungan kami siap membantu melalui berbagai saluran komunikasi di bawah ini.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Email Support */}
                  <a href="mailto:support@memorymap.app" className="group relative overflow-hidden p-5 rounded-xl border border-indigo-500/15 bg-white/[0.02] hover:bg-indigo-500/[0.06] hover:border-indigo-500/25 transition-all cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "radial-gradient(circle at top right, rgba(99,102,241,0.12), transparent 70%)" }} />
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/15 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all shadow-lg shadow-indigo-500/5 group-hover:shadow-indigo-500/20">
                        <Mail className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-[15px] mb-1 font-[Outfit]">Email Dukungan</h4>
                        <p className="text-indigo-400 text-sm font-medium truncate group-hover:text-indigo-300 transition-colors">support@memorymap.app</p>
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span className="text-[11px] text-neutral-500">Balasan dalam 1x24 jam kerja</span>
                        </div>
                      </div>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  <a href="https://wa.me/6285883917835" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden p-5 rounded-xl border border-emerald-500/15 bg-white/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/25 transition-all cursor-pointer">
                    <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "radial-gradient(circle at top right, rgba(52,211,153,0.12), transparent 70%)" }} />
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/15 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all shadow-lg shadow-emerald-500/5 group-hover:shadow-emerald-500/20">
                        <Phone className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-[15px] mb-1 font-[Outfit]">WhatsApp</h4>
                        <p className="text-emerald-400 text-sm font-medium group-hover:text-emerald-300 transition-colors">+62 858 8391 7835</p>
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span className="text-[11px] text-neutral-500">Senin - Jumat, 09:00 - 17:00 WIB</span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>

                {/* Social Media Section */}
                <div className="border-t border-white/[0.06] pt-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 className="w-4 h-4 text-violet-400" />
                    <h4 className="text-white font-bold text-sm font-[Outfit] uppercase tracking-wider">Media Sosial</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Twitter, label: "Twitter", handle: "@memorymap_id", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/15", hoverBg: "hover:bg-sky-500/[0.08]" },
                      { icon: Instagram, label: "Instagram", handle: "@memorymap.app", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/15", hoverBg: "hover:bg-pink-500/[0.08]" },
                      { icon: Github, label: "GitHub", handle: "memorymap", color: "text-neutral-300", bg: "bg-white/[0.08]", border: "border-white/[0.1]", hoverBg: "hover:bg-white/[0.06]" },
                    ].map((social, i) => {
                      const Icon = social.icon
                      return (
                        <a key={i} href="#" className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border ${social.border} bg-white/[0.02] ${social.hoverBg} hover:border-opacity-40 transition-all text-center`}>
                          <div className={`w-10 h-10 rounded-xl ${social.bg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${social.color}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{social.label}</p>
                            <p className={`text-[11px] ${social.color} mt-0.5`}>{social.handle}</p>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isBlogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlogOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <h3 className="text-xl font-bold text-white font-[Outfit]">Blog MemoryMap</h3>
                <button
                  onClick={() => setIsBlogOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {/* Featured Post */}
                <div className="group relative rounded-2xl overflow-hidden mb-6 border border-white/[0.08]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c16] via-[#0c0c16]/80 to-transparent z-10" />
                  <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" alt="Featured Post" className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-700" />
                  
                  <div className="absolute bottom-0 left-0 p-6 sm:p-8 z-20 w-full">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">Pengumuman</span>
                      <span className="text-xs text-neutral-400">10 Maret 2026</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-[Outfit] text-white mb-2 leading-tight">Memperkenalkan MemoryMap V2: Jurnal Interaktif Era Baru</h2>
                    <p className="text-neutral-300 text-sm sm:text-base max-w-2xl line-clamp-2 mb-4">Pembaruan terbesar kami menghadirkan tampilan antarmuka yang lebih segar, performa peta yang melesat, dan peluncuran portal komunitas real-time...</p>
                    <button className="flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors text-sm">
                      Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Post 1 */}
                  <div className="group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="relative h-48 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=2070&auto=format&fit=crop" alt="Post thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Tips</span>
                        <span className="text-[11px] text-neutral-500">5 Mar 2026</span>
                      </div>
                      <h4 className="text-white font-bold text-lg mb-2 leading-snug group-hover:text-indigo-400 transition-colors">7 Lokasi Tersembunyi di Peta Dunia</h4>
                      <p className="text-neutral-400 text-sm line-clamp-3 mb-4 flex-1">Temukan spot-spot rahasia yang jarang diketahui orang untuk mengabadikan kenangan terbaik Anda musim liburan ini.</p>
                      <button className="text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 self-start">Baca Artikel <ArrowRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Post 2 */}
                  <div className="group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="relative h-48 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" alt="Post thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Cerita</span>
                        <span className="text-[11px] text-neutral-500">28 Feb 2026</span>
                      </div>
                      <h4 className="text-white font-bold text-lg mb-2 leading-snug group-hover:text-indigo-400 transition-colors">Bagaimana MemoryMap Membantu Saya Mengingat</h4>
                      <p className="text-neutral-400 text-sm line-clamp-3 mb-4 flex-1">Wawancara eksklusif bersama komunitas mengenai dampak menyimpan kenangan visual yang terikat pada lokasi.</p>
                      <button className="text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 self-start">Baca Artikel <ArrowRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Post 3 */}
                  <div className="group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="relative h-48 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop" alt="Post thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Teknologi</span>
                        <span className="text-[11px] text-neutral-500">15 Feb 2026</span>
                      </div>
                      <h4 className="text-white font-bold text-lg mb-2 leading-snug group-hover:text-indigo-400 transition-colors">Arsitektur Dibalik Peta Interaktif Kami</h4>
                      <p className="text-neutral-400 text-sm line-clamp-3 mb-4 flex-1">Membongkar stack teknologi dan trik rendering yang kami gunakan untuk membuat jutaan token memori tanpa lag.</p>
                      <button className="text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 self-start">Baca Artikel <ArrowRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <button className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors text-sm font-semibold flex items-center gap-2">
                    Muat Lebih Banyak Artikel <Loader2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isMobileAppOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileAppOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Smartphone className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-[Outfit]">Aplikasi Mobile</h3>
                </div>
                <button
                  onClick={() => setIsMobileAppOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {/* Under Development Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 mb-8">
                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(245,158,11,0.15), transparent 70%)" }} />
                  <div className="flex items-start gap-4">
                    <div>
                      <h4 className="text-amber-300 font-bold text-[15px] mb-1.5 font-[Outfit]">Sedang Dalam Tahap Pengembangan</h4>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Aplikasi mobile MemoryMap saat ini sedang dalam proses pengembangan aktif oleh tim kami. Kami akan menghadirkan pengalaman terbaik dalam mengabadikan kenangan langsung dari genggaman tangan Anda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Preview Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
                  {/* Phone Mockup */}
                  <div className="flex justify-center">
                    <div className="relative">
                      {/* Ambient glow behind phone */}
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-[60px] scale-90" />
                      <div className="absolute inset-0 bg-violet-500/10 rounded-[3rem] blur-[80px] scale-75" />
                      {/* Phone frame */}
                      <div className="relative w-[240px] h-[490px] rounded-[2.5rem] border-[3px] border-white/[0.15] bg-[#0a0a14] shadow-2xl shadow-indigo-500/10 overflow-hidden">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#0a0a14] rounded-b-2xl z-20 flex items-center justify-center">
                          <div className="w-[50px] h-[5px] bg-white/10 rounded-full" />
                        </div>
                        {/* Screen content */}
                        <div className="relative w-full h-full overflow-hidden">
                          <img src="/mobile-preview.png" alt="MemoryMap Mobile Preview" className="w-full h-full object-cover" />
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-[#0a0a14]/30" />
                          {/* Status bar mockup */}
                          <div className="absolute top-[32px] left-0 right-0 px-5 flex items-center justify-between z-10">
                            <span className="text-[10px] text-white/70 font-semibold">9:41</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-2 border border-white/40 rounded-[2px] relative"><div className="absolute inset-[1px] right-[2px] bg-white/40 rounded-[1px]" /></div>
                            </div>
                          </div>
                          {/* App header mockup */}
                          <div className="absolute top-[54px] left-0 right-0 px-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[11px] font-bold text-white font-[Outfit]">MemoryMap</span>
                            </div>
                            <Bell className="w-3.5 h-3.5 text-white/50" />
                          </div>
                          {/* Bottom nav mockup */}
                          <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c16]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-2.5 flex items-center justify-around z-10">
                            <div className="flex flex-col items-center gap-0.5">
                              <Globe className="w-4 h-4 text-indigo-400" />
                              <span className="text-[8px] text-indigo-400 font-medium">Peta</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <BookOpen className="w-4 h-4 text-white/30" />
                              <span className="text-[8px] text-white/30 font-medium">Jurnal</span>
                            </div>
                            <div className="w-10 h-10 -mt-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                              <span className="text-white text-lg font-bold">+</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <Heart className="w-4 h-4 text-white/30" />
                              <span className="text-[8px] text-white/30 font-medium">Favorit</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <Users className="w-4 h-4 text-white/30" />
                              <span className="text-[8px] text-white/30 font-medium">Profil</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* App Info */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-2xl font-bold text-white font-[Outfit] mb-3 leading-tight">
                        Kenangan di 
                        <span style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", backgroundClip: "text" }}> Genggamanmu</span>
                      </h4>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Nikmati semua fitur MemoryMap langsung dari smartphone. Tandai kenangan di mana pun, kapan pun, bahkan saat offline.
                      </p>
                    </div>

                    {/* Feature highlights */}
                    <div className="space-y-3">
                      {[
                        { icon: MapPin, text: "Tandai lokasi dengan GPS real-time", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                        { icon: ImagePlus, text: "Ambil foto langsung dari kamera", color: "text-violet-400", bg: "bg-violet-500/10" },
                        { icon: Bell, text: "Notifikasi push untuk interaksi", color: "text-sky-400", bg: "bg-sky-500/10" },
                        { icon: Zap, text: "Mode offline — simpan lalu sync", color: "text-amber-400", bg: "bg-amber-500/10" },
                      ].map((feature, i) => {
                        const Icon = feature.icon
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                            <div className={`w-8 h-8 rounded-lg ${feature.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${feature.color}`} />
                            </div>
                            <span className="text-sm text-neutral-300">{feature.text}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Progress indicator */}
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Progress Pengembangan</span>
                        <span className="text-xs font-bold text-indigo-400">20%</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "20%" }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)" }}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-2">Estimasi rilis: Q4 2026</p>
                    </div>
                  </div>
                </div>

                {/* Store Badges */}
                <div className="border-t border-white/[0.06] pt-6">
                  <p className="text-center text-neutral-500 text-sm mb-5">Segera tersedia di platform favoritmu</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {/* Google Play Store Badge */}
                    <button className="group relative flex items-center gap-3 px-6 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.18] transition-all w-full sm:w-auto">
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, rgba(52,168,83,0.06), rgba(66,133,244,0.06))" }} />
                      {/* Google Play Icon */}
                      <svg className="w-8 h-8 shrink-0 relative z-10" viewBox="0 0 512 512" fill="none">
                        <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="url(#play_gradient)"/>
                        <defs>
                          <linearGradient id="play_gradient" x1="25.3" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#4285F4"/>
                            <stop offset="25%" stopColor="#34A853"/>
                            <stop offset="50%" stopColor="#FBBC04"/>
                            <stop offset="100%" stopColor="#EA4335"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="text-left relative z-10">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider leading-none">Segera di</p>
                        <p className="text-[15px] font-bold text-white leading-tight mt-0.5">Google Play</p>
                      </div>
                    </button>

                    {/* Apple App Store Badge */}
                    <button className="group relative flex items-center gap-3 px-6 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.18] transition-all w-full sm:w-auto">
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(200,200,200,0.04))" }} />
                      {/* Apple Icon */}
                      <svg className="w-8 h-8 shrink-0 relative z-10 text-white" viewBox="0 0 384 512" fill="currentColor">
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-46.8-42.3-83.6-45.8-35.3-3.5-73.8 20.6-88 20.6-15.2 0-48-19.4-73.4-19.4C76.4 140.5 0 186 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.9 59 127.2 107.2 125.7 25-0.6 42.7-18 75.3-18s46.3 18 77.8 17.4c49.1-0.8 89.7-82.3 101.9-119.3-65.2-30.7-96.9-90.4-97-91.8zM257.2 76.3c27.1-32.7 24.4-62.6 23.6-73.3-23.6 1.5-51 15.8-66.9 34.3-17.4 19.8-27.6 44.4-25.4 71.1 25.6 1.8 51.7-12.3 68.7-32.1z"/>
                      </svg>
                      <div className="text-left relative z-10">
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider leading-none">Segera di</p>
                        <p className="text-[15px] font-bold text-white leading-tight mt-0.5">App Store</p>
                      </div>
                    </button>
                  </div>

                  {/* Newsletter signup for mobile app */}
                  <div className="mt-6 p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] text-center">
                    <p className="text-sm text-neutral-300 mb-1">Ingin jadi yang pertama tahu saat aplikasi rilis?</p>
                    <p className="text-xs text-neutral-500">Ikuti akun sosial media kami untuk mendapatkan notifikasi peluncuran terbaru.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isWelcomeOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeWelcome}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.12] shadow-2xl flex flex-col"
              style={{ background: "linear-gradient(180deg, rgba(14,14,24,0.98), rgba(8,8,16,0.99))" }}
            >
              {/* Top accent line — Spotify green on slide 0, amber on slide 1 */}
              <motion.div
                animate={{ background: welcomeSlide === 0
                  ? "linear-gradient(90deg, transparent, #1DB954, #16c454, #1DB954, transparent)"
                  : "linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)"
                }}
                transition={{ duration: 0.4 }}
                className="h-[2px] w-full"
              />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      animate={{ boxShadow: welcomeSlide === 0 ? "0 0 24px rgba(29,185,84,0.4)" : "0 0 24px rgba(245,158,11,0.4)" }}
                      className="absolute inset-0 rounded-xl blur-lg"
                      style={{ backgroundColor: welcomeSlide === 0 ? "rgba(29,185,84,0.25)" : "rgba(245,158,11,0.25)" }}
                    />
                    <motion.div
                      animate={{ background: welcomeSlide === 0
                        ? "linear-gradient(135deg, #1a9e4a, #1DB954)"
                        : "linear-gradient(135deg, #d97706, #f59e0b)"
                      }}
                      className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      {welcomeSlide === 0 ? (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      ) : (
                        <Star className="w-5 h-5 text-white fill-white" />
                      )}
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-[Outfit] leading-tight">Yang Baru di MemoryMap</h3>
                    <motion.p
                      animate={{ color: welcomeSlide === 0 ? "#1DB954" : "#f59e0b" }}
                      className="text-[11px] mt-0.5 font-medium"
                    >
                      {welcomeSlide === 0 ? "✦ Spotify Music Integration" : "✦ Memory Point Exchange"}
                    </motion.p>
                  </div>
                </div>
                <button
                  onClick={closeWelcome}
                  className="p-2 -mr-1 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slide content */}
              <div className="px-6 pb-2 overflow-hidden">
                <AnimatePresence mode="wait">
                  {welcomeSlide === 0 && (
                    <motion.div
                      key="slide-0"
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -60 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Slide 1: Spotify Integration */}
                      <div className="relative overflow-hidden rounded-2xl border border-[#1DB954]/25 bg-[#1DB954]/[0.04] p-5 mb-4">
                        {/* Spotify ambient glow */}
                        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(29,185,84,0.15), transparent 70%)" }} />
                        <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" style={{ background: "radial-gradient(circle at bottom left, rgba(29,185,84,0.08), transparent 70%)" }} />

                        {/* Spotify Player Mockup */}
                        <div className="relative rounded-xl border border-[#1DB954]/20 bg-[#0a0a0f]/90 p-4 mb-4 overflow-hidden">
                          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(29,185,84,0.06), rgba(0,0,0,0), rgba(29,185,84,0.03))" }} />

                          {/* Now Playing label */}
                          <div className="flex items-center gap-1.5 mb-3 relative">
                            <div className="flex gap-[3px] items-end h-3">
                              {[1, 2, 3].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-[3px] rounded-full"
                                  style={{ backgroundColor: "#1DB954" }}
                                  animate={{ height: ["40%", "100%", "60%", "90%", "40%"] }}
                                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#1DB954" }}>Now Playing</span>
                          </div>

                          <div className="relative flex items-center gap-4">
                            {/* Album art with Spotify logo watermark */}
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-black/40">
                              <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/40 to-[#191414]" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {/* Spotify logo SVG */}
                                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#1DB954">
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">Kicau Mania</p>
                              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">Ndayboy Genk · BoyCord Music</p>
                              {/* Spotify-style progress bar */}
                              <div className="mt-2.5 relative">
                                <div className="w-full h-1 bg-white/[0.1] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "45%" }}
                                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: "#1DB954" }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[9px] text-neutral-500">1:57</span>
                                  <span className="text-[9px] text-neutral-500">4:41</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="relative flex items-center justify-center gap-6 mt-3">
                            <SkipForward className="w-4 h-4 text-neutral-500 rotate-180 hover:text-white transition-colors" />
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: "#1DB954", boxShadow: "0 0 20px rgba(29,185,84,0.35)" }}
                            >
                              <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
                            </div>
                            <SkipForward className="w-4 h-4 text-neutral-500 hover:text-white transition-colors" />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border" style={{ backgroundColor: "rgba(29,185,84,0.15)", color: "#1DB954", borderColor: "rgba(29,185,84,0.3)" }}>Baru</span>
                            <span className="text-[11px] text-neutral-500">v2.3</span>
                          </div>
                          <h4 className="text-white font-bold text-lg font-[Outfit] mb-1.5 leading-tight">Spotify Integration</h4>
                          <p className="text-neutral-400 text-sm leading-relaxed">
                            Hubungkan kenanganmu dengan musik dari Spotify. Cari lagu favoritmu dan jadikan setiap memori lebih hidup dengan musik yang tepat.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {welcomeSlide === 1 && (
                    <motion.div
                      key="slide-1"
                      initial={{ opacity: 0, x: 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -60 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Slide 2: Exchange Memory Points */}
                      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 mb-4">
                        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 70%)" }} />

                        {/* Shop/Exchange Mockup */}
                        <div className="relative rounded-xl border border-white/[0.08] bg-[#0c0c16]/80 p-4 mb-4 overflow-hidden">
                          <div className="absolute inset-0 opacity-30" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.08), transparent)" }} />
                          
                          {/* Balance */}
                          <div className="relative flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Saldo Poin</p>
                                <p className="text-base font-bold text-amber-400 font-[Outfit] leading-tight">2.500 MP</p>
                              </div>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Topup</span>
                            </div>
                          </div>

                          {/* Item cards mockup */}
                          <div className="relative grid grid-cols-3 gap-2">
                            {[
                              { name: "Bingkai Neon", price: "500", gradient: "from-indigo-500 to-violet-600", icon: "✨" },
                              { name: "Banner Sunset", price: "800", gradient: "from-rose-500 to-orange-500", icon: "🌅" },
                              { name: "Tema Galaxy", price: "1.2rb", gradient: "from-purple-500 to-blue-600", icon: "🌌" },
                            ].map((item, i) => (
                              <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                                <div className={`w-full h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-1.5 text-lg`}>
                                  {item.icon}
                                </div>
                                <p className="text-[9px] font-bold text-white truncate">{item.name}</p>
                                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                  <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                                  <span className="text-[8px] font-bold text-amber-400">{item.price}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/25 uppercase tracking-wider">Baru</span>
                            <span className="text-[11px] text-neutral-500">v2.2</span>
                          </div>
                          <h4 className="text-white font-bold text-lg font-[Outfit] mb-1.5 leading-tight">Exchange Memory Points</h4>
                          <p className="text-neutral-400 text-sm leading-relaxed">
                            Tukarkan Memory Point-mu dengan dekorasi profil eksklusif! Bingkai avatar, banner profil, tema kartu, dan masih banyak item premium lainnya.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer with navigation */}
              <div className="px-6 pb-6 pt-2">
                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[0, 1].map((i) => (
                    <button
                      key={i}
                      onClick={() => setWelcomeSlide(i)}
                      className="transition-all"
                    >
                      <motion.div
                        animate={{
                          width: welcomeSlide === i ? 24 : 8,
                          backgroundColor: welcomeSlide === i ? (i === 0 ? "#1DB954" : "#f59e0b") : "rgba(255,255,255,0.15)",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="h-2 rounded-full"
                      />
                    </button>
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-3">
                  {welcomeSlide === 0 ? (
                    <>
                      <button
                        onClick={closeWelcome}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-neutral-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                      >
                        Lewati
                      </button>
                      <button
                        onClick={() => setWelcomeSlide(1)}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-black relative overflow-hidden group"
                        style={{ background: "#1DB954", boxShadow: "0 0 20px rgba(29,185,84,0.3)" }}
                      >
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#17a349" }} />
                        <span className="relative flex items-center justify-center gap-1.5">
                          Selanjutnya
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setWelcomeSlide(0)}
                        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-neutral-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                      >
                        <ChevronLeft className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={closeWelcome}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white relative overflow-hidden group"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                        <span className="relative flex items-center justify-center gap-1.5">
                          Mulai Jelajahi
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/* Don't show again link */}
                <div className="mt-4 text-center">
                  <button 
                    onClick={dontShowAgain}
                    className="text-[11px] font-medium text-neutral-500 hover:text-white transition-colors underline-offset-2 hover:underline"
                  >
                    Jangan tampilkan lagi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
