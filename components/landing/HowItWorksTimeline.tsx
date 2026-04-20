"use client"

import { motion, AnimatePresence, useInView } from "framer-motion"
import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowRight, MapPin, PenLine, UserPlus, ImagePlus, Share2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

// ─── Data ──────────────────────────────────────────────────────────────────────
interface Step {
  number: string
  icon: LucideIcon
  title: string
  desc: string
  cta: { label: string; href: string } | null
  preview: React.ReactNode
}

// ─── Step Preview Mockups ─────────────────────────────────────────────────────
function RegisterPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[280px] bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 space-y-4">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-white">Buat Akun</p>
          <p className="text-xs text-neutral-500 mt-0.5">Gratis, 30 detik</p>
        </div>
        <div className="space-y-3">
          {["Nama Lengkap", "Email Kamu", "Password"].map((placeholder, i) => (
            <div key={i} className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-neutral-500">
              {placeholder}
            </div>
          ))}
        </div>
        <div className="w-full py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-center text-xs font-semibold text-indigo-300">
          Daftar Sekarang →
        </div>
      </div>
    </div>
  )
}

function MapPickPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0e0e1a] min-h-[220px]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-[25%] left-[10%] w-[35%] h-[40%] bg-indigo-500/[0.08] rounded-2xl" />
        <div className="absolute top-[20%] left-[50%] w-[40%] h-[50%] bg-indigo-500/[0.08] rounded-2xl" />
        {/* Active pin */}
        <div className="absolute left-[55%] top-[32%] -translate-x-1/2 -translate-y-full">
          <div className="px-3 py-1.5 rounded-xl bg-[#12121e]/90 backdrop-blur-md border border-indigo-500/40 text-[10px] text-white whitespace-nowrap shadow-xl mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
            Pilih lokasi ini
          </div>
          <div className="w-px h-4 bg-indigo-400/60 mx-auto" />
          <div className="w-3 h-3 rounded-full bg-indigo-400 mx-auto shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
        </div>
        {/* Other pins */}
        <div className="absolute left-[25%] top-[50%] w-2 h-2 rounded-full bg-indigo-400/40" />
        <div className="absolute left-[72%] top-[60%] w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
        <div className="absolute left-[40%] top-[40%] w-1.5 h-1.5 rounded-full bg-indigo-400/30" />
      </div>
    </div>
  )
}

function WritePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[300px] space-y-3">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-indigo-400/70 font-medium uppercase tracking-wider">
            <PenLine className="w-3 h-3" />
            Tulis Kenangan
          </div>
          <div className="space-y-2">
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <p className="text-[10px] text-neutral-500 mb-1">Judul</p>
              <p className="text-xs text-white/80">Sunset di Labuan Bajo</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] min-h-[60px]">
              <p className="text-[10px] text-neutral-500 mb-1">Cerita</p>
              <p className="text-xs text-white/60 leading-relaxed">Akhirnya setelah semua perjalanan, aku bisa berdiri di sini dan melihat...</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-1.5">
            <span className="text-[10px]">📅</span>
            <span className="text-[10px] text-neutral-500">14 Apr 2025</span>
          </div>
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-1.5">
            <span className="text-[10px]">📍</span>
            <span className="text-[10px] text-neutral-500">Labuan Bajo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[300px] space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 rounded-2xl bg-indigo-950/40 border border-white/[0.07] overflow-hidden h-28 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-indigo-400/50" />
            </div>
            <div className="absolute bottom-2 left-2">
              <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[9px] text-white/70">Foto Utama</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl bg-indigo-950/40 border border-white/[0.07] h-[54px] flex items-center justify-center">
              <ImagePlus className="w-4 h-4 text-indigo-400/40" />
            </div>
            <div className="rounded-2xl bg-indigo-950/40 border border-white/[0.07] h-[54px] flex items-center justify-center">
              <ImagePlus className="w-4 h-4 text-indigo-400/40" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ label: "😊 Bahagia", active: true }, { label: "🌊 Petualangan", active: false }, { label: "✨ Nostalgia", active: true }].map((tag) => (
            <div key={tag.label} className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${tag.active ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300" : "bg-white/[0.04] border-white/[0.08] text-neutral-500"}`}>
              {tag.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SharePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[300px] space-y-4">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0 overflow-hidden border-2 border-[#151520]">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=explorer1" className="w-full h-full" alt="" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Sunset di Labuan Bajo</p>
              <p className="text-[10px] text-indigo-400">by @kamu · 14 Apr 2025</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <div className="h-1.5 bg-white/[0.07] rounded-full w-full" />
            <div className="h-1.5 bg-white/[0.07] rounded-full w-5/6" />
            <div className="h-1.5 bg-white/[0.05] rounded-full w-3/4" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] text-neutral-400 font-mono flex-1">memorymap.app/m/bajo-trip</span>
            <div className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">Salin</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-center text-[10px] text-neutral-400">🔒 Privat</div>
          <div className="flex-1 px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-center text-[10px] text-indigo-300 font-semibold">🌍 Publik</div>
        </div>
      </div>
    </div>
  )
}

const steps: Step[] = [
  {
    number: "01",
    icon: UserPlus,
    title: "Buat Akunmu",
    desc: "Daftar gratis dalam hitungan detik, nggak perlu kartu kredit. Akunmu adalah brankas kenangan pribadimu yang aman.",
    cta: { label: "Daftar sekarang", href: "/register" },
    preview: <RegisterPreview />,
  },
  {
    number: "02",
    icon: MapPin,
    title: "Pilih Lokasi di Peta",
    desc: "Cari dan ketuk di mana saja di peta dunia interaktif kami untuk menancapkan pin kenangan di tempat pastinya.",
    cta: null,
    preview: <MapPickPreview />,
  },
  {
    number: "03",
    icon: PenLine,
    title: "Tulis Kenanganmu",
    desc: "Beri judul, tanggal, dan curahkan ceritamu. Ini kanvasmu, bisa singkat atau sepanjang apapun yang kamu mau.",
    cta: null,
    preview: <WritePreview />,
  },
  {
    number: "04",
    icon: ImagePlus,
    title: "Tambah Foto & Suasana",
    desc: "Upload foto dan beri tag emosi, Bahagia, Nostalgia, Romantis, Petualangan, biar kenanganmu makin hidup.",
    cta: null,
    preview: <MediaPreview />,
  },
  {
    number: "05",
    icon: Share2,
    title: "Bagikan atau Simpan Sendiri",
    desc: "Jadikan kenangan publik buat ditemukan komunitas, atau simpan untuk dirimu sendiri selamanya.",
    cta: { label: "Jelajahi komunitas", href: "/community" },
    preview: <SharePreview />,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export function HowItWorksTimeline() {
  const [activeStep, setActiveStep] = useState("01")
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const active = steps.find((s) => s.number === activeStep)!
  const ActiveIcon = active.icon

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={stagger}
      className="max-w-6xl mx-auto"
    >
      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-indigo-300/80 mb-5 backdrop-blur-sm">
          Langkah demi langkah
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white leading-tight mb-3">
          Cara{" "}
          <span
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundImage: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)",
              backgroundClip: "text",
            }}
          >
            Kerjanya
          </span>
        </h2>
        <p className="text-neutral-500 text-base md:text-lg max-w-7xl mx-auto leading-relaxed font-light">
          Dari daftar akun hingga berbagi kenangan pertamamu <span className="text-white"></span>hanya dalam lima langkah.
        </p>
      </motion.div>

      {/* ── Two-Column Layout (desktop) / Accordion (mobile) ──────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Step List ───────────────────────────────────────────────── */}
        <div className="relative">
          {/* Vertical spine line */}
          <div className="absolute left-[21px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-indigo-500/5 pointer-events-none" />

          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = step.number === activeStep

              return (
                <div key={step.number}>
                  {/* Step button */}
                  <button
                    onClick={() => setActiveStep(step.number)}
                    className={`w-full flex items-start gap-5 p-4 rounded-2xl text-left transition-all duration-300 group ${
                      isActive
                        ? "bg-indigo-500/10 border border-indigo-500/25"
                        : "border border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
                    }`}
                  >
                    {/* Step icon */}
                    <div className="relative shrink-0">
                      <div
                        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center z-10 transition-all duration-300 ${
                          isActive
                            ? "bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.5)]"
                            : "bg-white/[0.05] border border-white/[0.08] group-hover:border-indigo-500/30"
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-neutral-500 group-hover:text-indigo-400"}`} />
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? "text-indigo-400" : "text-neutral-600"}`}>
                          Step {step.number}
                        </span>
                      </div>
                      <h3 className={`text-sm font-bold font-[Outfit] leading-snug transition-colors ${isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>
                        {step.title}
                      </h3>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            key="desc"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <p className="text-xs text-neutral-500 leading-relaxed mt-2 pr-2">{step.desc}</p>
                            {step.cta && (
                              <Link
                                href={step.cta.href}
                                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/cta"
                              >
                                {step.cta.label}
                                <ArrowRight className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" />
                              </Link>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Active indicator dot */}
                    <div className={`shrink-0 mt-3 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "bg-transparent"}`} />
                  </button>

                  {/* ── Mobile inline preview (below each active step, hidden on lg+) ── */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        key={`preview-mobile-${step.number}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                        className="lg:hidden ml-4 mt-2 mb-1"
                      >
                        <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.025]">
                          {/* Mini header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
                                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                              </div>
                              <p className="text-[11px] font-bold text-white font-[Outfit]">{step.title}</p>
                            </div>
                            {/* Nav dots */}
                            <div className="flex items-center gap-1">
                              {steps.map((s) => (
                                <button
                                  key={s.number}
                                  onClick={(e) => { e.stopPropagation(); setActiveStep(s.number) }}
                                  className={`rounded-full transition-all duration-300 ${s.number === activeStep ? "w-4 h-1 bg-indigo-500" : "w-1 h-1 bg-white/20"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {/* Preview scaled for mobile */}
                          <div className="overflow-hidden">
                            {step.preview}
                          </div>
                          {/* Prev/Next nav */}
                          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                            <button
                              onClick={(e) => { e.stopPropagation(); const idx = steps.findIndex((s) => s.number === activeStep); if (idx > 0) setActiveStep(steps[idx - 1].number) }}
                              disabled={activeStep === "01"}
                              className="text-[11px] text-neutral-500 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3 rotate-180" /> Sebelumnya
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); const idx = steps.findIndex((s) => s.number === activeStep); if (idx < steps.length - 1) setActiveStep(steps[idx + 1].number) }}
                              disabled={activeStep === steps[steps.length - 1].number}
                              className="text-[11px] text-neutral-500 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1"
                            >
                              Selanjutnya <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Preview Panel (desktop only) ──────────────────────────────── */}
        <div className="relative lg:sticky lg:top-28 hidden lg:block">
          <div
            className="relative rounded-3xl overflow-hidden border border-white/[0.07] bg-white/[0.025]"
            style={{ minHeight: "420px" }}
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30`}>
                <ActiveIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white font-[Outfit]">{active.title}</p>
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Step {active.number} / {steps.length}</p>
              </div>
              {/* Progress dots */}
              <div className="ml-auto flex items-center gap-1.5">
                {steps.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => setActiveStep(s.number)}
                    className={`rounded-full transition-all duration-300 ${s.number === activeStep ? "w-5 h-1.5 bg-indigo-500" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
                style={{ minHeight: "360px" }}
              >
                {active.preview}
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  const idx = steps.findIndex((s) => s.number === activeStep)
                  if (idx > 0) setActiveStep(steps[idx - 1].number)
                }}
                disabled={activeStep === "01"}
                className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
                Sebelumnya
              </button>
              <button
                onClick={() => {
                  const idx = steps.findIndex((s) => s.number === activeStep)
                  if (idx < steps.length - 1) setActiveStep(steps[idx + 1].number)
                }}
                disabled={activeStep === steps[steps.length - 1].number}
                className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Selanjutnya
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}
