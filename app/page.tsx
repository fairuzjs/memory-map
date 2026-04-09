"use client"

import Link from "next/link"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { MapPin, Globe, BookOpen, Heart, ArrowRight, Loader2, Users, Star, Zap, Lock, Share2, UserPlus, PenLine, ImagePlus, Twitter, Instagram, Github, X, Menu, Mail, Phone, Send } from "lucide-react"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
                    <a href="#" className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block">Aplikasi Mobile</a>
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
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <h3 className="text-xl font-bold text-white font-[Outfit]">Status Sistem & Changelog</h3>
                <button
                  onClick={() => setIsChangelogOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar text-neutral-300 text-sm leading-relaxed space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-3 w-3 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <span className="font-semibold text-emerald-400 text-base">Semua Sistem Berjalan Normal</span>
                  </div>
                  <p className="text-neutral-400 mb-2">Layanan MemoryMap saat ini beroperasi dengan lancar tanpa ada gangguan yang dilaporkan. Kami terus memantau performa sistem secara real-time.</p>
                </div>
                
                <div className="pt-6 border-t border-white/[0.06]">
                  <h4 className="text-white font-bold text-lg mb-6 font-[Outfit]">Changelog Terbaru</h4>
                  
                  <div className="relative border-l border-white/10 ml-3 space-y-8 pb-4">
                    {/* Item 0 */}
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#0c0c16]"></div>
                      <span className="text-xs font-semibold text-indigo-400 mb-1 block uppercase tracking-wider">April 2026</span>
                      <h5 className="text-white font-bold text-base mb-2">V2.2 - Sistem Memory Point</h5>
                      <ul className="list-disc leading-relaxed pl-4 space-y-1.5 text-neutral-400 text-sm">
                        <li>Integrasi fitur Exchange Memory Point untuk menukar poin.</li>
                        <li>Peluncuran fitur Topup Memory Point secara manual.</li>
                      </ul>
                    </div>

                    {/* Item 1 */}
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-neutral-600 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#0c0c16]"></div>
                      <span className="text-xs font-semibold text-neutral-500 mb-1 block uppercase tracking-wider">Maret 2026</span>
                      <h5 className="text-white font-bold text-base mb-2">V2.1 - Fitur Komunitas & Peningkatan Performa</h5>
                      <ul className="list-disc leading-relaxed pl-4 space-y-1.5 text-neutral-400 text-sm">
                        <li>Penambahan halaman jelajah secara real-time untuk melihat kenangan dari komunitas global.</li>
                        <li>Optimasi kecepatan rendering peta interaktif hingga 30% lebih cepat pada perangkat mobile.</li>
                        <li>Perbaikan bug minor terkait sinkronisasi data profil pengguna.</li>
                      </ul>
                    </div>

                    {/* Item 2 */}
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-neutral-600 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#0c0c16]"></div>
                      <span className="text-xs font-semibold text-neutral-500 mb-1 block uppercase tracking-wider">Februari 2026</span>
                      <h5 className="text-white font-bold text-base mb-2">V2.0 - Desain Ulang Dashboard</h5>
                      <ul className="list-disc leading-relaxed pl-4 space-y-1.5 text-neutral-400 text-sm">
                        <li>Pembaruan antarmuka pengguna secara menyeluruh dengan elemen glassmorphism.</li>
                        <li>Penambahan mode gelap cerdas (smart dark mode) dengan kontras yang disempurnakan.</li>
                        <li>Peluncuran sistem filter canggih untuk memilah memori berdasarkan kategori.</li>
                      </ul>
                    </div>

                    {/* Item 3 */}
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-neutral-600 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#0c0c16]"></div>
                      <span className="text-xs font-semibold text-neutral-500 mb-1 block uppercase tracking-wider">Januari 2026</span>
                      <h5 className="text-white font-bold text-base mb-2">V1.5 - Rilis Utama</h5>
                      <ul className="list-disc leading-relaxed pl-4 space-y-1.5 text-neutral-400 text-sm">
                        <li>Fitur penanda lokasi interaktif yang otomatis menyinkronkan zona waktu.</li>
                        <li>Profil pengguna dasar beserta fitur Single Sign-On (SSO) Google terintegrasi.</li>
                      </ul>
                    </div>
                  </div>
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
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col"
              style={{ background: "rgba(12, 12, 22, 0.95)" }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <h3 className="text-xl font-bold text-white font-[Outfit]">Hubungi Kami</h3>
                <button
                  onClick={() => setIsContactOpen(false)}
                  className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar text-neutral-300 text-sm leading-relaxed space-y-6">
                <div>
                  <p className="text-neutral-400 mb-6 text-base">Punya pertanyaan, masukkan, atau kendala terkait MemoryMap? Tim kami selalu siap membantu Anda. Silakan hubungi kami melalui salah satu saluran di bawah ini.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Support */}
                  <div className="relative p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col gap-3 group hover:bg-white/[0.04] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shadow-indigo-500/10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-[15px] mb-1">Email Dukungan</h4>
                      <a href="mailto:support@memorymap.app" className="text-indigo-400 hover:text-indigo-300 font-medium">support@memorymap.app</a>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Estimasi balasan: 1x24 Jam kerja</p>
                  </div>

                  {/* Phone / WA */}
                  <div className="relative p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col gap-3 group hover:bg-white/[0.04] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/10">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-[15px] mb-1">Telepon / WhatsApp</h4>
                      <span className="text-neutral-300">+62 858 8391 7835</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Senin - Jumat, 09:00 - 17:00 WIB</p>
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
      </AnimatePresence>

    </div>
  )
}
