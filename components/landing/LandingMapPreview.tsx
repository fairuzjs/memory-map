"use client"

import { Globe, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const GlobeView = dynamic(() => import("@/components/map/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-neutral-500 text-sm font-medium">Memuat globe...</span>
      </div>
    </div>
  ),
})

interface Memory {
  id: string
  title: string
  date: string
  latitude: number
  longitude: number
  [key: string]: unknown
}

interface LandingMapPreviewProps {
  memories: Memory[]
  loading: boolean
}

export function LandingMapPreview({ memories, loading }: LandingMapPreviewProps) {
  return (
    <section id="map" className="px-4 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.9, type: "spring", stiffness: 80 }}
        className="max-w-6xl mx-auto"
      >
        {/* Outer glow frame */}
        <div className="relative group">
          <div
            className="absolute -inset-px rounded-[28px] opacity-60 group-hover:opacity-90 transition-opacity duration-700 blur-xl"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #10b981 100%)" }}
          />

          {/* Card */}
          <div
            className="relative rounded-[24px] overflow-hidden border border-white/[0.08]"
            style={{ background: "rgba(12, 12, 22, 0.95)" }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs text-neutral-500 border border-white/[0.06]"
                  style={{ background: "rgba(255,255,255,0.03)", minWidth: "220px", maxWidth: "360px" }}
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-400/60 shrink-0" />
                  <span className="truncate">memorymap.app/explore</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-300 border border-emerald-400/20 bg-emerald-400/[0.08]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            {/* Map */}
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              {loading ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                  style={{ background: "rgba(8,8,16,0.8)" }}
                >
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-neutral-500 text-sm">Memuat kenangan...</span>
                </div>
              ) : (
                <div className="absolute inset-0">
                  <GlobeView memories={memories} />
                </div>
              )}

              {/* Badge overlay */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 backdrop-blur-md border border-white/10"
                  style={{ background: "rgba(8,8,16,0.7)" }}
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{memories.length} Kenangan Publik</span>
                </div>
              </div>

              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 60%, rgba(8,8,16,0.4) 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
