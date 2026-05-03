"use client"

import { motion, useInView } from "framer-motion"
import { MapPin, BookOpen, Heart, Lock, Zap, Share2, Music } from "lucide-react"
import { useRef } from "react"

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

// ─── Shared card style ────────────────────────────────────────────────────────
const card =
  "relative bg-white border-[3px] border-black shadow-[4px_4px_0_#000] overflow-hidden group transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]"

// ─── Mini mock components ─────────────────────────────────────────────────────
function MapDot({ x, y, size = 2, glow = false }: { x: number; y: number; size?: number; glow?: boolean }) {
  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className={`bg-[#FF00FF] border-2 border-black ${glow ? "shadow-[0_0_0_2px_#FFFF00]" : ""}`}
        style={{ width: size * 4, height: size * 4 }}
      />
    </div>
  )
}

function MiniMap() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FFFDF0]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Continent blobs */}
      <div className="absolute top-[30%] left-[15%] w-[25%] h-[30%] bg-[#00FFFF]/20 border-2 border-black/10" />
      <div className="absolute top-[25%] left-[43%] w-[28%] h-[40%] bg-[#FFFF00]/20 border-2 border-black/10" />
      <div className="absolute top-[45%] left-[38%] w-[12%] h-[20%] bg-[#FF00FF]/15 border-2 border-black/10" />
      <div className="absolute top-[20%] right-[8%] w-[20%] h-[35%] bg-[#00FF00]/20 border-2 border-black/10" />
      {/* Memory pins */}
      <MapDot x={22} y={42} size={2} glow />
      <MapDot x={57} y={35} size={1.5} />
      <MapDot x={68} y={50} size={2} glow />
      <MapDot x={80} y={30} size={1.5} />
      <MapDot x={40} y={55} size={1.5} />
      <MapDot x={35} y={38} size={2} glow />
      {/* Active pin tooltip */}
      <div className="absolute left-[19%] top-[26%] -translate-x-1/2 pointer-events-none">
        <div className="px-2.5 py-1.5 bg-[#FFFF00] border-[3px] border-black text-[10px] text-black font-bold whitespace-nowrap shadow-[2px_2px_0_#000]">
          📍 Bajo, NTT
        </div>
        <div className="w-[3px] h-3 bg-black mx-auto" />
        <div className="w-3 h-3 bg-[#FF00FF] border-2 border-black mx-auto" />
      </div>
    </div>
  )
}

function MiniJournal() {
  return (
    <div className="w-full h-full flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-[#FF00FF] border-2 border-black shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="h-2 w-3/4 bg-black/20" />
          <div className="h-1.5 w-1/2 bg-black/10" />
        </div>
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="h-2 bg-black/10 w-full" />
        <div className="h-2 bg-black/10 w-5/6" />
        <div className="h-2 bg-black/10 w-4/6" />
        <div className="h-2 bg-black/10 w-5/6" />
        <div className="h-2 bg-black/[0.06] w-3/4" />
      </div>
      <div className="flex gap-2 mt-1">
        {["😊", "🌊", "✨"].map((e, i) => (
          <div key={i} className="px-2 py-1 bg-[#FFFF00]/30 border-2 border-black text-[10px] font-bold">
            {e}
          </div>
        ))}
      </div>
      <div className="relative overflow-hidden h-16 bg-[#00FFFF]/20 border-[3px] border-black">
        <div className="absolute inset-0 flex items-center px-3 gap-2">
          <div className="w-10 h-10 bg-[#FF00FF]/30 border-2 border-black shrink-0 flex items-center justify-center">
            <Music className="w-4 h-4 text-black" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-1.5 w-2/3 bg-black/20" />
            <div className="h-1.5 w-1/2 bg-black/10" />
          </div>
          <div className="flex gap-0.5">
            {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
              <div key={i} className="w-1 bg-black/40" style={{ height: h * 3 }} />
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
          className={`flex items-center gap-3 px-3 py-2.5 border-[3px] border-black transition-all ${
            item.active
              ? "bg-[#00FF00] shadow-[3px_3px_0_#000] text-black font-bold"
              : "bg-white text-black/50"
          }`}
        >
          <span className="text-sm">{item.icon}</span>
          <span className="text-xs font-bold">{item.label}</span>
          {item.active && (
            <span className="ml-auto text-[9px] font-black text-black uppercase tracking-wider bg-white px-2 py-0.5 border-2 border-black">Aktif</span>
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
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF00FF] border-[3px] border-black shadow-[3px_3px_0_#000] text-sm text-white font-bold mb-6">
            Semua yang kamu butuhkan
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-[Outfit] text-black leading-tight mb-4">
            When Loves End,{" "}
            <span className="inline-block bg-[#FFFF00] px-3 -rotate-1 border-[3px] border-black shadow-[3px_3px_0_#000]">
              Memories Begin
            </span>
          </h2>
          <p className="text-black/60 text-lg max-w-7xl mx-auto leading-relaxed font-medium">
            Setiap fitur dirancang biar perjalanan kenanganmu terasa indah, aman, dan benar-benar personal.
          </p>
        </motion.div>

        {/* ── Bento Grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 grid-rows-[auto] gap-4">

          {/* ── [1] Tandai di Mana Saja — Large landscape ────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 md:col-span-7 p-7`}>
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#FFFF00] border-[3px] border-black shadow-[2px_2px_0_#000] shrink-0">
                  <MapPin className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1.5">Interaktif</div>
                  <h3 className="text-lg font-black font-[Outfit] text-black leading-snug">Tandai di Mana Saja</h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1.5 font-medium">
                    Tancapkan pin kenangan di mana pun di bumi ini. Peta dark-mode yang interaktif, setiap koordinat punya cerita.
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden border-[3px] border-black min-h-[180px]">
                <MiniMap />
              </div>
            </div>
          </motion.div>

          {/* ── [2] Privat secara Default ─────────────────────────────────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 md:col-span-5 p-7`}>
            <div className="flex flex-col h-full gap-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#00FFFF] border-[3px] border-black shadow-[2px_2px_0_#000] shrink-0">
                  <Lock className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1.5">Aman</div>
                  <h3 className="text-lg font-black font-[Outfit] text-black leading-snug">Privat secara Default</h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1.5 font-medium">
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
                <div className="p-2.5 bg-[#FF00FF] border-[3px] border-black shadow-[2px_2px_0_#000] shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1.5">Multimedia</div>
                  <h3 className="text-lg font-black font-[Outfit] text-black leading-snug">Jurnal Lengkap</h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1.5 font-medium">
                    Cerita, emosi, foto, dan musik semua tersimpan rapi di setiap momen geografis dalam hidupmu.
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden border-[3px] border-black bg-[#FFFDF0] min-h-[200px]">
                <MiniJournal />
              </div>
            </div>
          </motion.div>

          {/* ── [4] Community + Search — 2 stacked small cards ───────────────── */}
          <motion.div variants={fadeUp} className="col-span-12 md:col-span-7 flex flex-col gap-4">
            
            {/* Community card */}
            <div className={`${card} p-6 flex-1`}>
              <div className="flex items-center gap-4 h-full">
                <div className="p-2.5 bg-[#00FF00] border-[3px] border-black shadow-[2px_2px_0_#000] shrink-0">
                  <Heart className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1">Sosial</div>
                  <h3 className="text-base font-black font-[Outfit] text-black">Berbasis Komunitas</h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1 font-medium">
                    React, komentar, dan terhubung sama para penjelajah yang berbagi kenangan ke dunia.
                  </p>
                </div>
                {/* Avatar stack */}
                <div className="shrink-0 hidden sm:flex -space-x-3">
                  {["alice", "bob", "carol", "dave", "eve"].map((seed) => (
                    <img
                      key={seed}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      className="w-9 h-9 border-[3px] border-black bg-[#FFFF00]"
                      alt=""
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Search card */}
            <div className={`${card} p-6 flex-1`}>
              <div className="flex items-center gap-4 h-full">
                <div className="p-2.5 bg-[#FFFF00] border-[3px] border-black shadow-[2px_2px_0_#000] shrink-0">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1">Cepat</div>
                  <h3 className="text-base font-black font-[Outfit] text-black">Temukan Secepat Kilat</h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1 font-medium">
                    Pencarian teks penuh dan filter tanggal, balik ke momen apa pun dalam hitungan detik.
                  </p>
                </div>
                {/* Fake search bar */}
                <div className="shrink-0 hidden sm:flex items-center gap-2 px-3 py-2 bg-[#FFFDF0] border-[3px] border-black w-36">
                  <Zap className="w-3 h-3 text-black shrink-0" />
                  <div className="h-2 w-full bg-black/15" />
                </div>
              </div>
            </div>

          </motion.div>

          {/* ── [5] Bagikan — Wide bottom card ────────────────────────────────── */}
          <motion.div variants={fadeUp} className={`${card} col-span-12 p-7`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2.5 bg-[#00FFFF] border-[3px] border-black shadow-[2px_2px_0_#000] shrink-0">
                  <Share2 className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1.5">Shareable</div>
                  <h3 className="text-lg font-black font-[Outfit] text-black">Bagikan Ceritamu Tanpa Batas</h3>
                  <p className="text-black/50 text-sm leading-relaxed mt-1.5 max-w-lg font-medium">
                    Bagikan kenangan pilihanmu ke teman lewat link unik, nggak perlu akun buat bisa melihatnya. Sesederhana itu.
                  </p>
                </div>
              </div>
              {/* Shareable link mockup */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-[#FFFDF0] border-[3px] border-black shadow-[3px_3px_0_#000]">
                <div className="w-3 h-3 bg-[#00FF00] border-2 border-black" />
                <span className="text-xs text-black/50 font-mono font-bold">memorymap.app/m/</span>
                <span className="text-xs text-black font-mono font-black">bajo-trip-2024</span>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  )
}
