"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold text-black bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000]">
              <span className="relative flex h-3 w-3">
                <span className="inline-flex rounded-full h-3 w-3 bg-[#00FF00] border-2 border-black"></span>
              </span>
              <span>Hidupmu, tertancap di peta dunia</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl lg:text-[88px] font-black font-[Outfit] text-black tracking-tight leading-[1.05] mb-6"
          >
            Tandai{" "}
            <span
              className="relative inline-block bg-[#FFFF00] px-3 -rotate-1 border-[3px] border-black shadow-[3px_3px_0_#000]"
            >
              Momenmu
            </span>
            <br />
            <span className="text-black">yang Berarti.</span>
          </motion.h1>

          {/* Subheader */}
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-black/60 max-w-4xl mx-auto mb-10 leading-relaxed font-medium">
            MemoryMap bisa bikin kamu mengabadikan kenangan kamu bersama pasangan atau teman ke lokasi aslinya di peta. Mau dibagikan ke publik atau disimpan pribadi, semua terserah kamu.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-none mx-auto">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="group flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all uppercase tracking-wide"
              >
                Kembali ke Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group relative flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all uppercase tracking-wide"
                >
                  Mulai Sekarang
                </Link>
                <Link
                  href="/login"
                  className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-black bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#00FFFF] transition-all"
                >
                  Masuk ke Akun
                </Link>
              </>
            )}
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center gap-3 text-sm text-black/70">
            <div className="flex -space-x-2">
              {["alice", "carol", "dave"].map((seed) => (
                <img
                  key={seed}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                  className="w-8 h-8 border-[3px] border-black bg-[#FFFF00]"
                  alt={`User avatar ${seed}`}
                />
              ))}
            </div>
            <span>
              Bergabung bersama explorer <strong className="text-black font-black">di seluruh dunia</strong>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
