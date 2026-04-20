"use client"

import { motion, useInView } from "framer-motion"
import { MapPin, BookOpen, Heart, Lock, Zap, Share2, Music } from "lucide-react"
import { useRef } from "react"

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

// ─── Shared card style ────────────────────────────────────────────────────────
const card =
  "relative rounded-3xl border border-white/[0.07] bg-white/[0.025] overflow-hidden group transition-all duration-500 hover:border-indigo-500/30 hover:bg-white/[0.04]"

// ─── Mini mock components ─────────────────────────────────────────────────────
function MapDot({ x, y, size = 2, glow = false }: { x: number; y: number; size?: number; glow?: boolean }) {
  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className={`rounded-full bg-indigo-400 ${glow ? "shadow-[0_0_8px_rgba(129,140,248,0.9)]" : ""}`}
        style={{ width: size * 4, height: size * 4 }}
      />
    </div>
  )
}

function MiniMap() {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0e0e1a]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Continent blobs */}
      <div className="absolute top-[30%] left-[15%] w-[25%] h-[30%] bg-indigo-500/[0.07] rounded-2xl" />
      <div className="absolute top-[25%] left-[43%] w-[28%] h-[40%] bg-indigo-500/[0.07] rounded-2xl" />
      <div className="absolute top-[45%] left-[38%] w-[12%] h-[20%] bg-indigo-500/[0.06] rounded-xl" />
      <div className="absolute top-[20%] right-[8%] w-[20%] h-[35%] bg-indigo-500/[0.07] rounded-2xl" />
      {/* Memory pins */}
      <MapDot x={22} y={42} size={2} glow />
      <MapDot x={57} y={35} size={1.5} />
      <MapDot x={68} y={50} size={2} glow />
      <MapDot x={80} y={30} size={1.5} />
      <MapDot x={40} y={55} size={1.5} />
      <MapDot x={35} y={38} size={2} glow />
      {/* Active pin tooltip */}
      <div className="absolute left-[19%] top-[26%] -translate-x-1/2 pointer-events-none">
        <div className="px-2.5 py-1.5 rounded-xl bg-[#12121e]/90 backdrop-blur-md border border-indigo-500/30 text-[10px] text-white/80 whitespace-nowrap shadow-xl">
          📍 Bajo, NTT
        </div>
        <div className="w-px h-3 bg-indigo-400/60 mx-auto" />
        <div className="w-2 h-2 rounded-full bg-indigo-400 mx-auto shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      </div>
    </div>
  )
}

function MiniJournal() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="h-2 w-3/4 bg-white/10 rounded-full" />
          <div className="h-1.5 w-1/2 bg-white/5 rounded-full" />
        </div>
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="h-2 bg-white/[0.06] rounded-full w-full" />
        <div className="h-2 bg-white/[0.06] rounded-full w-5/6" />
        <div className="h-2 bg-white/[0.06] rounded-full w-4/6" />
        <div className="h-2 bg-white/[0.06] rounded-full w-5/6" />
        <div className="h-2 bg-white/[0.04] rounded-full w-3/4" />
      </div>
      <div className="flex gap-2 mt-1">
        {["😊", "🌊", "✨"].map((e, i) => (
          <div key={i} className="px-2 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px]">
            {e}
          </div>
        ))}
      </div>
      <div className="relative rounded-xl overflow-hidden h-16 bg-indigo-950/40 border border-white/[0.06]">
        <div className="absolute inset-0 flex items-center px-3 gap-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 shrink-0 flex items-center justify-center">
            <Music className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-1.5 w-2/3 bg-white/10 rounded-full" />
            <div className="h-1.5 w-1/2 bg-white/5 rounded-full" />
          </div>
          <div className="flex gap-0.5">
            {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
              <div key={i} className="w-1 bg-indigo-400/60 rounded-full" style={{ height: h * 3 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PrivacyMock() {
  return (
    <div className="flex flex-col gap-3 p-4 w-full h-full">
      {[
        { label: "Hanya Saya", active: true, icon: "🔒" },
        { label: "Teman Dekat", active: false, icon: "👥" },
        { label: "Semua Orang", active: false, icon: "🌍" },
      ].map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all ${
            item.active
              ? "bg-indigo-500/15 border-indigo-500/40 text-white"
              : "bg-white/[0.03] border-white/[0.06] text-white/40"
          }`}
        >
          <span className="text-sm">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
          {item.active && (
            <span className="ml-auto text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Aktif</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingFeatures() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="features" className="relative px-4 pb-32 z-10">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={stagger}
        className="max-w-7xl mx-auto"
      >
        {/* ── Section Header ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-indigo-300/80 mb-6 backdrop-blur-sm">
            Semua yang kamu butuhkan
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white leading-tight mb-4">
            When Loves End,{" "}
            <span
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)",
                backgroundClip: "text",
              }}
            >
              Memories Begin
            </span>
          </h2>
          <p className="text-neutral-500 text-lg max-w-7xl mx-auto leading-relaxed font-light">
            Setiap fitur dirancang biar perjalanan kenanganmu terasa indah, aman, dan benar-benar personal.
          </p>
        </motion.div>

        {/* ── Bento Grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 grid-rows-[auto] gap-4">

          {/* ── [1] Tandai di Mana Saja — Large landscape (maps mini) ────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 md:col-span-7 p-7`}>
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70 mb-1.5">Interaktif</div>
                  <h3 className="text-lg font-bold font-[Outfit] text-white leading-snug">Tandai di Mana Saja</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1.5">
                    Tancapkan pin kenangan di mana pun di bumi ini. Peta dark-mode yang interaktif, setiap koordinat punya cerita.
                  </p>
                </div>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden border border-white/[0.06] min-h-[180px]">
                <MiniMap />
              </div>
            </div>
          </motion.div>

          {/* ── [2] Privat secara Default ─────────────────────────────────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 md:col-span-5 p-7`}>
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70 mb-1.5">Aman</div>
                  <h3 className="text-lg font-bold font-[Outfit] text-white leading-snug">Privat secara Default</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1.5">
                    Kenanganmu ya milik kamu. Pilih sendiri mau dibagiin ke siapa atau disimpan rapat-rapat.
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-[140px]">
                <PrivacyMock />
              </div>
            </div>
          </motion.div>

          {/* ── [3] Jurnal Lengkap — Tall portrait ────────────────────────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 md:col-span-5 p-7`}>
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70 mb-1.5">Multimedia</div>
                  <h3 className="text-lg font-bold font-[Outfit] text-white leading-snug">Jurnal Lengkap</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1.5">
                    Cerita, emosi, foto, dan musik — semua tersimpan rapi di setiap momen geografis dalam hidupmu.
                  </p>
                </div>
              </div>
              <div className="flex-1 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] min-h-[200px]">
                <MiniJournal />
              </div>
            </div>
          </motion.div>

          {/* ── [4] Community + Search — 2 stacked small cards ───────────────── */}
          <motion.div variants={fadeUp} className="col-span-12 md:col-span-7 flex flex-col gap-4">
            
            {/* Community card */}
            <div className={`${card} p-6 flex-1`}>
              <div className="flex items-center gap-4 h-full">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                  <Heart className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70 mb-1">Sosial</div>
                  <h3 className="text-base font-bold font-[Outfit] text-white">Berbasis Komunitas</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1">
                    React, komentar, dan terhubung sama para penjelajah yang berbagi kenangan ke dunia.
                  </p>
                </div>
                {/* Avatar stack */}
                <div className="shrink-0 hidden sm:flex -space-x-3">
                  {["alice", "bob", "carol", "dave", "eve"].map((seed) => (
                    <img
                      key={seed}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      className="w-9 h-9 rounded-full border-2 border-[#0A0A14] bg-neutral-800"
                      alt=""
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Search card */}
            <div className={`${card} p-6 flex-1`}>
              <div className="flex items-center gap-4 h-full">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70 mb-1">Cepat</div>
                  <h3 className="text-base font-bold font-[Outfit] text-white">Temukan Secepat Kilat</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1">
                    Pencarian teks penuh dan filter tanggal — balik ke momen apa pun dalam hitungan detik.
                  </p>
                </div>
                {/* Fake search bar */}
                <div className="shrink-0 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] w-36">
                  <Zap className="w-3 h-3 text-indigo-400 shrink-0" />
                  <div className="h-2 w-full bg-white/10 rounded-full" />
                </div>
              </div>
            </div>

          </motion.div>

          {/* ── [5] Bagikan — Wide bottom card ────────────────────────────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 p-7`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                  <Share2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70 mb-1.5">Shareable</div>
                  <h3 className="text-lg font-bold font-[Outfit] text-white">Bagikan Ceritamu Tanpa Batas</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-1.5 max-w-lg">
                    Bagikan kenangan pilihanmu ke teman lewat link unik — nggak perlu akun buat bisa melihatnya. Sesederhana itu.
                  </p>
                </div>
              </div>
              {/* Shareable link mockup */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs text-white/50 font-mono">memorymap.app/m/</span>
                <span className="text-xs text-white/90 font-mono">bajo-trip-2024</span>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  )
}
