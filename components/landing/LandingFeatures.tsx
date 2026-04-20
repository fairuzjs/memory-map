"use client"

import { motion } from "framer-motion"
import { MapPin, BookOpen, Heart, Lock, Zap, Share2 } from "lucide-react"
import { useInView } from "framer-motion"
import { useRef } from "react"
import type { LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  gradient: string
  glow: string
  title: string
  desc: string
  badge: string
}

const features: Feature[] = [
  {
    icon: MapPin,
    gradient: "from-indigo-500 to-violet-600",
    glow: "shadow-indigo-500/20",
    title: "Tandai di Mana Saja",
    desc: "Tancapkan pin kenangan di mana pun di bumi ini pakai peta dark-mode interaktif kami. Setiap koordinat punya cerita.",
    badge: "Interaktif",
  },
  {
    icon: BookOpen,
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    title: "Jurnal Lengkap",
    desc: "Curhatin cerita, emosi, foto, musik, dan perasaanmu di setiap momen geografis dalam hidupmu.",
    badge: "Multimedia",
  },
  {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    title: "Berbasis Komunitas",
    desc: "React, komentar, dan terhubung sama para penjelajah yang berbagi kenangan mereka ke dunia.",
    badge: "Sosial",
  },
  {
    icon: Lock,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    title: "Privat secara Default",
    desc: "Kenanganmu ya milik kamu. Pilih sendiri mau dibagiin ke siapa atau disimpan rapat-rapat.",
    badge: "Aman",
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/20",
    title: "Temukan Secepat Kilat",
    desc: "Pencarian teks penuh dan filter tanggal bikin kamu bisa balik ke momen apa pun dalam hitungan detik.",
    badge: "Cepat",
  },
  {
    icon: Share2,
    gradient: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    title: "Bagikan Ceritamu",
    desc: "Bagikan kenangan pilihanmu ke teman lewat link unik — nggak perlu akun buat bisa lihatnya.",
    badge: "Shareable",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

export function LandingFeatures() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="features" className="px-4 pb-32">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={stagger}
        className="max-w-7xl mx-auto"
      >
        {/* Section header */}
        <motion.div variants={fadeUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-neutral-400 mb-5">
            Semua yang kamu butuhkan
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white leading-tight mb-4">
            When Loves End
            <br />
            <span
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
                backgroundClip: "text",
              }}
            >
              Memories Begin
            </span>
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
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.05]`} />
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, transparent 60%, rgba(99,102,241,0.08) 100%)" }}
              />
              <div className={`relative w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-5 bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow}`}>
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:inline-block mb-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-neutral-500 border border-white/[0.08]">
                {feature.badge}
              </span>
              <h3 className="text-sm sm:text-lg font-bold font-[Outfit] text-white mb-1 sm:mb-2 leading-tight">{feature.title}</h3>
              <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
