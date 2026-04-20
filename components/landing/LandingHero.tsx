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
                backgroundClip: "text",
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
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)" }}
                />
                <span className="relative flex items-center gap-2">Mulai Sekarang</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group relative flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white overflow-hidden shadow-2xl shadow-indigo-500/20"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                >
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)" }}
                  />
                  <span className="relative flex items-center gap-2">Mulai Gratis</span>
                  <span
                    className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  />
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

          {/* Social proof */}
          <motion.div variants={fadeIn} className="mt-8 flex items-center gap-3 text-sm text-neutral-600">
            <div className="flex -space-x-2">
              {["alice", "bob", "carol", "dave"].map((seed) => (
                <img
                  key={seed}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                  className="w-7 h-7 rounded-full border-2 border-[#080810] bg-neutral-800"
                  alt=""
                />
              ))}
            </div>
            <span>
              Bergabung bersama <strong className="text-neutral-400">di seluruh dunia</strong>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
