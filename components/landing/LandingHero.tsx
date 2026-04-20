"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

export function LandingHero() {
  const { data: session } = useSession()

  return (
    <section className="relative z-10 pt-24 md:pt-32 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col items-center text-center"
        >
          {/* Pill badge */}
          <motion.div variants={fadeUp} className="mb-8 mt-6 md:mt-0">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium text-indigo-300 border border-indigo-500/20 bg-indigo-500/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
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
                backgroundImage: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)",
                backgroundClip: "text",
              }}
            >
              Momenmu
            </span>
            <br />
            <span className="text-neutral-100">yang Berarti.</span>
          </motion.h1>

          {/* Subheader */}
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-neutral-400 max-w-4xl mx-auto mb-10 leading-relaxed font-light">
            MemoryMap bisa bikin kamu mengabadikan kenangan kamu bersama pasangan atau teman ke lokasi aslinya di peta. Mau dibagikan ke publik atau disimpan pribadi, semua terserah kamu.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors shadow-lg shadow-white/10"
              >
                Kembali ke Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)]"
                >
                  Mulai Sekarang
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-medium text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  Masuk ke Akun
                </Link>
              </>
            )}
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeIn} className="mt-12 flex items-center justify-center gap-3 text-sm text-neutral-500">
            <div className="flex -space-x-2">
              {["alice", "carol", "dave"].map((seed) => (
                <img
                  key={seed}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                  className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] bg-neutral-800"
                  alt={`User avatar ${seed}`}
                />
              ))}
            </div>
            <span>
              Bergabung bersama explorer <strong className="text-neutral-300 font-medium">di seluruh dunia</strong>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
