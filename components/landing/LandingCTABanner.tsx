"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
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
        <motion.div variants={fadeUp} className="relative bg-[#FFFF00] border-[4px] border-black shadow-[8px_8px_0_#000]">
          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-black border-[3px] border-black flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#FFFF00]" />
              </div>
              <span className="text-sm font-black text-black uppercase tracking-wider">Mulai perjalananmu</span>
            </motion.div>

            {/* Headline */}
            <motion.h2 variants={fadeUp} className="text-4xl md:text-[56px] font-black font-[Outfit] text-black leading-[1.1] mb-5 tracking-tight">
              Kenanganmu layak punya
              <br />
              <span className="inline-block bg-[#FF00FF] text-white px-4 py-1 -rotate-1 border-[3px] border-black shadow-[3px_3px_0_#000] mt-2">
                tempat yang indah.
              </span>
            </motion.h2>

            {/* Subtext */}
            <motion.p variants={fadeUp} className="text-black/60 text-lg mb-12 max-w-7xl mx-auto font-bold leading-relaxed">
              Tandai momen paling bermakna dalam hidupmu ke peta dunia <span className="text-black font-black">sepenuhnya gratis, selamanya.</span>
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex flex-row items-center justify-center gap-4 w-full max-w-sm sm:max-w-none mx-auto">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="group flex flex-1 sm:flex-none items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black text-[#FFFF00] bg-black border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,0.3)] transition-all uppercase tracking-wide"
                >
                  Buka Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group flex flex-1 sm:flex-none items-center justify-center gap-2.5 px-4 sm:px-8 py-3.5 sm:py-4 text-[13px] sm:text-base font-black text-[#FFFF00] bg-black border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,0.3)] transition-all text-center leading-tight uppercase tracking-wide"
                  >
                    Buat Akun Gratis
                  </Link>
                  <Link
                    href="/login"
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-7 py-3.5 sm:py-4 text-[13px] sm:text-base font-bold text-black bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#00FFFF] transition-all text-center leading-tight"
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
