"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const stats = [
  { value: "∞", label: "Kenangan" },
  { value: "100+", label: "Negara" },
  { value: "Gratis", label: "Selamanya" },
  { value: "5★", label: "Pengalaman" },
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
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden border border-white/[0.06]"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
              style={{ background: "rgba(8,8,16,0.7)" }}
            >
              <span
                className="text-3xl md:text-4xl font-extrabold font-[Outfit] text-white mb-1"
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </span>
              <span className="text-sm text-neutral-500 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
