"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const stats = [
  { value: "∞", label: "Kenangan", bg: "bg-[#FFFF00]" },
  { value: "100+", label: "Negara", bg: "bg-[#00FFFF]" },
  { value: "Gratis", label: "Selamanya", bg: "bg-[#FF00FF]" },
  { value: "5★", label: "Pengalaman", bg: "bg-[#00FF00]" },
]

export function LandingStatsStrip() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="px-4 pb-24">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={stagger}
        className="max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`flex flex-col items-center justify-center py-8 px-4 text-center ${stat.bg} border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all`}
            >
              <span className="text-3xl md:text-4xl font-black font-[Outfit] text-black mb-1">
                {stat.value}
              </span>
              <span className="text-sm text-black/70 font-bold uppercase tracking-wider">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
