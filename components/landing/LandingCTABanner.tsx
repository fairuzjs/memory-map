"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export function LandingCTABanner() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const { data: session } = useSession()

  return (
    <section className="px-4 pb-32 relative z-10">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={stagger}
        className="max-w-4xl mx-auto"
      >
        <motion.div variants={fadeUp} className="relative rounded-3xl overflow-hidden">
          {/* Background layer */}
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(10,10,18,0.98) 100%)" }}
          />

          {/* Indigo glow at center-top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 -z-10 opacity-40 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top, rgba(99,102,241,0.3) 0%, transparent 70%)" }}
          />

          {/* Top accent line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.6), transparent)" }}
          />

          {/* Border */}
          <div className="absolute inset-0 rounded-3xl border border-white/[0.07] pointer-events-none" />

          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-indigo-300/80">Mulai perjalananmu</span>
            </motion.div>

            {/* Headline */}
            <motion.h2 variants={fadeUp} className="text-4xl md:text-[56px] font-extrabold font-[Outfit] text-white leading-[1.1] mb-5 tracking-tight">
              Kenanganmu layak punya
              <br />
              <span
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)",
                  backgroundClip: "text",
                }}
              >
                tempat yang indah.
              </span>
            </motion.h2>

            {/* Subtext */}
            <motion.p variants={fadeUp} className="text-neutral-500 text-lg mb-12 max-w-7xl mx-auto font-light leading-relaxed">
              Tandai momen paling bermakna dalam hidupmu ke peta dunia <span className="text-white">sepenuhnya gratis, selamanya.</span>
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_-8px_rgba(255,255,255,0.5)]"
                >
                  Buka Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-8px_rgba(255,255,255,0.45)]"
                  >
                    Buat Akun Gratis
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-base font-medium text-neutral-400 hover:text-white border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] transition-all backdrop-blur-sm"
                  >
                    Sudah punya akun
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
