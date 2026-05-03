"use client"

import { motion, AnimatePresence, useInView } from "framer-motion"
import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowRight, MapPin, PenLine, UserPlus, ImagePlus, Share2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
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
  color: string
  cta: { label: string; href: string } | null
  preview: React.ReactNode
}

// ─── Step Preview Mockups ─────────────────────────────────────────────────────
function RegisterPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[280px] bg-[#FFFDF0] border-[3px] border-black p-6 space-y-4 shadow-[4px_4px_0_#000]">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-[#FFFF00] border-[3px] border-black flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0_#000]">
            <UserPlus className="w-6 h-6 text-black" />
          </div>
          <p className="text-sm font-black text-black">Buat Akun</p>
          <p className="text-xs text-black/50 mt-0.5 font-bold">Gratis, 30 detik</p>
        </div>
        <div className="space-y-3">
          {["Nama Lengkap", "Email Kamu", "Password"].map((placeholder, i) => (
            <div key={i} className="px-4 py-2.5 bg-white border-[3px] border-black text-xs text-black/50 font-bold">
              {placeholder}
            </div>
          ))}
        </div>
        <div className="w-full py-2.5 bg-[#FFFF00] border-[3px] border-black text-center text-xs font-black text-black shadow-[2px_2px_0_#000] uppercase">
          Daftar Sekarang →
        </div>
      </div>
    </div>
  )
}

function MapPickPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full relative overflow-hidden border-[3px] border-black bg-[#FFFDF0] min-h-[220px] shadow-[4px_4px_0_#000]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-[25%] left-[10%] w-[35%] h-[40%] bg-[#00FFFF]/20 border-2 border-black/10" />
        <div className="absolute top-[20%] left-[50%] w-[40%] h-[50%] bg-[#FFFF00]/20 border-2 border-black/10" />
        {/* Active pin */}
        <div className="absolute left-[55%] top-[32%] -translate-x-1/2 -translate-y-full">
          <div className="px-3 py-1.5 bg-[#FFFF00] border-[3px] border-black text-[10px] text-black font-black whitespace-nowrap shadow-[2px_2px_0_#000] mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#FF00FF] border border-black" />
            Pilih lokasi ini
          </div>
          <div className="w-[3px] h-4 bg-black mx-auto" />
          <div className="w-4 h-4 bg-[#FF00FF] border-[3px] border-black mx-auto" />
        </div>
        {/* Other pins */}
        <div className="absolute left-[25%] top-[50%] w-3 h-3 bg-[#FF00FF]/60 border-2 border-black/40" />
        <div className="absolute left-[72%] top-[60%] w-2 h-2 bg-[#FF00FF]/40 border-2 border-black/30" />
        <div className="absolute left-[40%] top-[40%] w-2 h-2 bg-[#FF00FF]/30 border-2 border-black/20" />
      </div>
    </div>
  )
}

function WritePreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[300px] space-y-3">
        <div className="bg-white border-[3px] border-black p-4 space-y-2.5 shadow-[3px_3px_0_#000]">
          <div className="flex items-center gap-2 text-xs text-black/60 font-black uppercase tracking-wider">
            <PenLine className="w-3 h-3" />
            Tulis Kenangan
          </div>
          <div className="space-y-2">
            <div className="px-3 py-2 bg-[#FFFDF0] border-[3px] border-black">
              <p className="text-[10px] text-black/40 mb-1 font-bold">Judul</p>
              <p className="text-xs text-black font-bold">Sunset di Labuan Bajo</p>
            </div>
            <div className="px-3 py-2 bg-[#FFFDF0] border-[3px] border-black min-h-[60px]">
              <p className="text-[10px] text-black/40 mb-1 font-bold">Cerita</p>
              <p className="text-xs text-black/60 leading-relaxed font-medium">Akhirnya setelah semua perjalanan, aku bisa berdiri di sini dan melihat...</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-[#FFFF00]/30 border-[3px] border-black flex items-center gap-1.5">
            <span className="text-[10px]">📅</span>
            <span className="text-[10px] text-black/60 font-bold">14 Apr 2025</span>
          </div>
          <div className="flex-1 px-3 py-2 bg-[#00FFFF]/30 border-[3px] border-black flex items-center gap-1.5">
            <span className="text-[10px]">📍</span>
            <span className="text-[10px] text-black/60 font-bold">Labuan Bajo</span>
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
          <div className="col-span-2 bg-[#FF00FF]/20 border-[3px] border-black overflow-hidden h-28 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-black/40" />
            </div>
            <div className="absolute bottom-2 left-2">
              <div className="px-2 py-1 bg-[#FFFF00] border-2 border-black text-[9px] text-black font-black">Foto Utama</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-[#00FFFF]/20 border-[3px] border-black h-[54px] flex items-center justify-center">
              <ImagePlus className="w-4 h-4 text-black/30" />
            </div>
            <div className="bg-[#00FF00]/20 border-[3px] border-black h-[54px] flex items-center justify-center">
              <ImagePlus className="w-4 h-4 text-black/30" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ label: "😊 Bahagia", active: true }, { label: "🌊 Petualangan", active: false }, { label: "✨ Nostalgia", active: true }].map((tag) => (
            <div key={tag.label} className={`px-2.5 py-1 text-[10px] font-bold border-[3px] border-black ${tag.active ? "bg-[#FFFF00] text-black shadow-[2px_2px_0_#000]" : "bg-white text-black/50"}`}>
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
        <div className="bg-white border-[3px] border-black p-5 shadow-[3px_3px_0_#000]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#FF00FF] border-[3px] border-black shrink-0 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=explorer1" className="w-full h-full" alt="" />
            </div>
            <div>
              <p className="text-xs font-black text-black">Sunset di Labuan Bajo</p>
              <p className="text-[10px] text-black/50 font-bold">by @kamu · 14 Apr 2025</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <div className="h-1.5 bg-black/10 w-full" />
            <div className="h-1.5 bg-black/10 w-5/6" />
            <div className="h-1.5 bg-black/[0.06] w-3/4" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#00FF00]/20 border-[3px] border-black">
            <div className="w-2 h-2 bg-[#00FF00] border-2 border-black" />
            <span className="text-[10px] text-black/50 font-mono font-bold flex-1">memorymap.app/m/bajo-trip</span>
            <div className="text-[9px] font-black text-black uppercase tracking-wider bg-[#FFFF00] px-2 py-0.5 border-2 border-black">Salin</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 bg-white border-[3px] border-black text-center text-[10px] text-black/50 font-bold">🔒 Privat</div>
          <div className="flex-1 px-3 py-2 bg-[#00FFFF] border-[3px] border-black text-center text-[10px] text-black font-black shadow-[2px_2px_0_#000]">🌍 Publik</div>
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
    color: "bg-[#FFFF00]",
    cta: { label: "Daftar sekarang", href: "/register" },
    preview: <RegisterPreview />,
  },
  {
    number: "02",
    icon: MapPin,
    title: "Pilih Lokasi di Peta",
    desc: "Cari dan ketuk di mana saja di peta dunia interaktif kami untuk menancapkan pin kenangan di tempat pastinya.",
    color: "bg-[#00FFFF]",
    cta: null,
    preview: <MapPickPreview />,
  },
  {
    number: "03",
    icon: PenLine,
    title: "Tulis Kenanganmu",
    desc: "Beri judul, tanggal, dan curahkan ceritamu. Ini kanvasmu, bisa singkat atau sepanjang apapun yang kamu mau.",
    color: "bg-[#FF00FF]",
    cta: null,
    preview: <WritePreview />,
  },
  {
    number: "04",
    icon: ImagePlus,
    title: "Tambah Foto & Suasana",
    desc: "Upload foto dan beri tag emosi, Bahagia, Nostalgia, Romantis, Petualangan, biar kenanganmu makin hidup.",
    color: "bg-[#00FF00]",
    cta: null,
    preview: <MediaPreview />,
  },
  {
    number: "05",
    icon: Share2,
    title: "Bagikan atau Simpan Sendiri",
    desc: "Jadikan kenangan publik buat ditemukan komunitas, atau simpan untuk dirimu sendiri selamanya.",
    color: "bg-[#FFFF00]",
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
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] text-sm text-black font-bold mb-5">
          Langkah demi langkah
        </div>
        <h2 className="text-4xl md:text-5xl font-black font-[Outfit] text-black leading-tight mb-3">
          Cara{" "}
          <span className="inline-block bg-[#FFFF00] px-3 -rotate-1 border-[3px] border-black shadow-[3px_3px_0_#000]">
            Kerjanya
          </span>
        </h2>
        <p className="text-black/50 text-base md:text-lg max-w-7xl mx-auto leading-relaxed font-medium">
          Dari daftar akun hingga berbagi kenangan pertamamu hanya dalam lima langkah.
        </p>
      </motion.div>

      {/* ── Two-Column Layout (desktop) / Accordion (mobile) ──────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Step List ───────────────────────────────────────────────── */}
        <div className="relative">
          {/* Vertical spine line */}
          <div className="absolute left-[21px] top-6 bottom-6 w-[3px] bg-black/20 pointer-events-none" />

          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = step.number === activeStep

              return (
                <div key={step.number}>
                  {/* Step button */}
                  <button
                    onClick={() => setActiveStep(step.number)}
                    className={`w-full flex items-start gap-5 p-4 text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-white border-[3px] border-black shadow-[4px_4px_0_#000]"
                        : "border-[3px] border-transparent hover:border-black/30 hover:bg-white/50"
                    }`}
                  >
                    {/* Step icon */}
                    <div className="relative shrink-0">
                      <div
                        className={`relative w-11 h-11 flex items-center justify-center z-10 transition-all duration-200 border-[3px] border-black ${
                          isActive
                            ? `${step.color} shadow-[3px_3px_0_#000]`
                            : "bg-white group-hover:bg-[#FFFDF0]"
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-black" : "text-black/40 group-hover:text-black"}`} />
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? "text-black" : "text-black/30"}`}>
                          Step {step.number}
                        </span>
                      </div>
                      <h3 className={`text-sm font-black font-[Outfit] leading-snug transition-colors ${isActive ? "text-black" : "text-black/50 group-hover:text-black/80"}`}>
                        {step.title}
                      </h3>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            key="desc"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <p className="text-xs text-black/50 leading-relaxed mt-2 pr-2 font-medium">{step.desc}</p>
                            {step.cta && (
                              <Link
                                href={step.cta.href}
                                className="inline-flex items-center gap-1 mt-3 text-xs font-black text-black hover:text-[#FF00FF] transition-colors group/cta uppercase tracking-wider"
                              >
                                {step.cta.label}
                                <ArrowRight className="w-3 h-3 group-hover/cta:translate-x-0.5 transition-transform" />
                              </Link>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Active indicator */}
                    <div className={`shrink-0 mt-3 w-3 h-3 border-2 border-black transition-all duration-200 ${isActive ? `${step.color} shadow-[2px_2px_0_#000]` : "bg-transparent border-transparent"}`} />
                  </button>

                  {/* ── Mobile inline preview ── */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        key={`preview-mobile-${step.number}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                        className="lg:hidden ml-4 mt-2 mb-1"
                      >
                        <div className="overflow-hidden border-[3px] border-black bg-white shadow-[4px_4px_0_#000]">
                          {/* Mini header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 flex items-center justify-center ${step.color} border-[3px] border-black`}>
                                <Icon className="w-3.5 h-3.5 text-black" />
                              </div>
                              <p className="text-[11px] font-black text-black font-[Outfit]">{step.title}</p>
                            </div>
                            {/* Nav dots */}
                            <div className="flex items-center gap-1">
                              {steps.map((s) => (
                                <button
                                  key={s.number}
                                  onClick={(e) => { e.stopPropagation(); setActiveStep(s.number) }}
                                  className={`transition-all duration-200 border-2 border-black ${s.number === activeStep ? "w-4 h-2 bg-black" : "w-2 h-2 bg-white"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {/* Preview */}
                          <div className="overflow-hidden">
                            {step.preview}
                          </div>
                          {/* Prev/Next nav */}
                          <div className="flex items-center justify-between px-4 py-3 border-t-[3px] border-black">
                            <button
                              onClick={(e) => { e.stopPropagation(); const idx = steps.findIndex((s) => s.number === activeStep); if (idx > 0) setActiveStep(steps[idx - 1].number) }}
                              disabled={activeStep === "01"}
                              className="text-[11px] text-black font-bold hover:text-[#FF00FF] disabled:opacity-30 transition-colors flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3 rotate-180" /> Sebelumnya
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); const idx = steps.findIndex((s) => s.number === activeStep); if (idx < steps.length - 1) setActiveStep(steps[idx + 1].number) }}
                              disabled={activeStep === steps[steps.length - 1].number}
                              className="text-[11px] text-black font-bold hover:text-[#FF00FF] disabled:opacity-30 transition-colors flex items-center gap-1"
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
            className="relative overflow-hidden border-[3px] border-black bg-white shadow-[6px_6px_0_#000]"
            style={{ minHeight: "420px" }}
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b-[3px] border-black">
              <div className={`w-9 h-9 flex items-center justify-center ${active.color} border-[3px] border-black shadow-[2px_2px_0_#000]`}>
                <ActiveIcon className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-xs font-black text-black font-[Outfit]">{active.title}</p>
                <p className="text-[10px] text-black/40 uppercase tracking-wider font-bold">Step {active.number} / {steps.length}</p>
              </div>
              {/* Progress dots */}
              <div className="ml-auto flex items-center gap-1.5">
                {steps.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => setActiveStep(s.number)}
                    className={`transition-all duration-200 border-2 border-black ${s.number === activeStep ? "w-5 h-2 bg-black" : "w-2 h-2 bg-white hover:bg-black/20"}`}
                  />
                ))}
              </div>
            </div>

            {/* Preview content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
                style={{ minHeight: "360px" }}
              >
                {active.preview}
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <div className="flex items-center justify-between px-5 py-4 border-t-[3px] border-black">
              <button
                onClick={() => {
                  const idx = steps.findIndex((s) => s.number === activeStep)
                  if (idx > 0) setActiveStep(steps[idx - 1].number)
                }}
                disabled={activeStep === "01"}
                className="text-xs text-black font-bold hover:text-[#FF00FF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-3 py-1.5 border-[3px] border-black hover:bg-[#FFFF00] disabled:hover:bg-transparent"
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
                className="text-xs text-black font-bold hover:text-[#FF00FF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-3 py-1.5 border-[3px] border-black hover:bg-[#FFFF00] disabled:hover:bg-transparent"
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
