"use client"

import { motion, AnimatePresence, useInView } from "framer-motion"
import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowRight, MapPin, PenLine, UserPlus, ImagePlus, Share2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

// ─── Data ──────────────────────────────────────────────────────────────────────
interface Step {
  number: string
  icon: LucideIcon
  title: string
  desc: string
  color: string
  gradient: string
  glow: string
  border: string
  bg: string
  cta: { label: string; href: string } | null
}

const steps: Step[] = [
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

// ─── Component ────────────────────────────────────────────────────────────────
export function HowItWorksTimeline() {
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set(["01"]))
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const toggle = (number: string) => {
    setOpenSteps((prev) => {
      const next = new Set(prev)
      next.has(number) ? next.delete(number) : next.add(number)
      return next
    })
  }

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
          <span
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
              backgroundClip: "text",
            }}
          >
            Kerjanya
          </span>
        </h2>
        <p className="text-neutral-500 text-lg max-w-7xl mx-auto leading-relaxed">
          Dari daftar akun, sampai berbagi kenangan pertamamu hanya dalam lima langkah.
        </p>
      </motion.div>

      {/* ────── DESKTOP: 3-row horizontal layout ────── */}
      <motion.div variants={fadeUp} className="hidden md:block">
        {/* ROW 1 — Icons */}
        <div className="grid grid-cols-5 gap-x-3">
          {steps.map((step) => {
            const Icon = step.icon
            const isOpen = openSteps.has(step.number)
            return (
              <div key={step.number} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => toggle(step.number)}
                  className="relative focus:outline-none group/icon"
                  aria-expanded={isOpen}
                >
                  <motion.div
                    animate={{ opacity: isOpen ? 0.85 : 0.2, scale: isOpen ? 1.5 : 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
                    style={{ background: step.glow }}
                  />
                  <motion.div
                    animate={{
                      scale: isOpen ? 1.1 : 1,
                      boxShadow: isOpen
                        ? `0 16px 48px ${step.glow}, 0 0 0 1.5px ${step.border}`
                        : `0 4px 16px ${step.glow.replace("0.3", "0.1")}`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.gradient} z-10`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                </button>
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

        {/* ROW 2 — Spine + dots */}
        <div className="relative grid grid-cols-5 gap-x-3" style={{ height: "44px" }}>
          <div
            className="absolute left-[10%] right-[10%] h-px top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(99,102,241,0.6), rgba(139,92,246,0.5), rgba(59,130,246,0.4), rgba(245,158,11,0.4), rgba(52,211,153,0.55))" }}
          />
          {steps.map((step) => {
            const isOpen = openSteps.has(step.number)
            return (
              <div key={step.number} className="flex flex-col items-center justify-between h-full">
                <div className="w-px flex-1" style={{ background: `linear-gradient(to bottom, transparent, ${step.border})` }} />
                <motion.button
                  onClick={() => toggle(step.number)}
                  animate={{
                    scale: isOpen ? 1.7 : 1,
                    backgroundColor: isOpen ? step.color : "rgba(255,255,255,0.18)",
                    boxShadow: isOpen ? `0 0 18px 5px ${step.glow}` : "none",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="w-3 h-3 rounded-full z-10 shrink-0 cursor-pointer focus:outline-none"
                />
                <motion.div
                  animate={{ flexGrow: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="w-px min-h-0"
                  style={{ background: `linear-gradient(to bottom, ${step.color}, transparent)` }}
                />
              </div>
            )
          })}
        </div>

        {/* ROW 3 — Cards */}
        <div className="grid grid-cols-5 gap-x-3">
          {steps.map((step) => {
            const isOpen = openSteps.has(step.number)
            return (
              <motion.div
                key={step.number}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                initial={false}
                transition={{
                  height: { type: "spring", stiffness: 270, damping: 30 },
                  opacity: { duration: 0.22 },
                }}
                style={{ overflow: "hidden" }}
              >
                <div
                  className="rounded-2xl p-4 border relative overflow-hidden"
                  style={{
                    background: step.bg,
                    borderColor: step.border,
                    backdropFilter: "blur(16px)",
                    boxShadow: `0 12px 40px ${step.glow.replace("0.3", "0.1")}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${step.glow.replace("0.3", "0.18")}, transparent 70%)` }} />
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: step.color }}>Step {step.number}</span>
                  <h3 className="text-sm font-bold font-[Outfit] text-white mb-1.5 leading-snug">{step.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{step.desc}</p>
                  {step.cta && (
                    <Link href={step.cta.href} className="inline-flex items-center gap-1 mt-3 text-xs font-semibold group/cta transition-colors" style={{ color: step.color }}>
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

      {/* ────── MOBILE: vertical accordion ────── */}
      <motion.div variants={fadeUp} className="md:hidden relative">
        <div
          className="absolute left-[27px] top-6 bottom-6 w-px pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 40%, rgba(59,130,246,0.2) 60%, rgba(245,158,11,0.2) 80%, rgba(52,211,153,0.4) 100%)" }}
        />
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon
            const isOpen = openSteps.has(step.number)
            return (
              <div key={step.number} className="relative">
                <button onClick={() => toggle(step.number)} className="w-full flex items-center gap-5 group/step text-left" aria-expanded={isOpen}>
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
                          : `0 4px 16px ${step.glow.replace("0.3", "0.12")}`,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.gradient} z-10`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                  <AnimatePresence initial={false}>
                    {!isOpen && (
                      <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }} className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: step.color }}>Step {step.number}</span>
                        <p className="text-sm font-semibold text-neutral-300 group-hover/step:text-white transition-colors leading-tight mt-0.5 truncate">{step.title}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={`ml-auto mr-1 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-600">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
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
                      <motion.div initial={{ y: -8 }} animate={{ y: 0 }} exit={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="ml-[76px] mt-3 mb-2">
                        <div
                          className="rounded-2xl p-5 border relative overflow-hidden"
                          style={{
                            background: step.bg,
                            borderColor: step.border,
                            backdropFilter: "blur(16px)",
                            boxShadow: `0 16px 48px ${step.glow.replace("0.3", "0.12")}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                          }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${step.glow.replace("0.3", "0.2")}, transparent 70%)` }} />
                          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: step.color }}>Step {step.number}</span>
                          <h3 className="text-lg font-bold font-[Outfit] text-white mb-2 leading-snug">{step.title}</h3>
                          <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
                          {step.cta && (
                            <Link href={step.cta.href} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold transition-colors group/cta" style={{ color: step.color }}>
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
