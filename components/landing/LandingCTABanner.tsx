"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Users, ArrowRight } from "lucide-react"
import { useSession } from "next-auth/react"

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

export function LandingCTABanner() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { data: session } = useSession()

  return (
    <section className="px-4 pb-32">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={stagger}
        className="max-w-4xl mx-auto"
      >
        <motion.div
          variants={fadeUp}
          className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
        >
          {/* BG */}
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(168,85,247,0.1) 100%)" }}
          />
          <div className="absolute inset-0 -z-10 border border-white/[0.08] rounded-3xl" />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }}
          />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6">
            <Users className="w-3.5 h-3.5" />
            Gabung komunitas
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold font-[Outfit] text-white mb-4">
            Kenanganmu layak punya
            <br />
            tempat yang indah.
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
      </motion.div>
    </section>
  )
}
