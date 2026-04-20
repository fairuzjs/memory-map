"use client"

import { Globe, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const GlobeView = dynamic(() => import("@/components/map/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-transparent flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <span className="text-indigo-300/80 text-sm font-medium">Memuat globe interaktif...</span>
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
    <section id="map" className="relative px-4 pb-28 w-full max-w-[1400px] mx-auto z-10">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {/* Subtle backdrop glow behind the map */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* The Immersive Edge-to-Edge Map Container */}
        <div 
          className="relative w-full rounded-[32px] md:rounded-[48px] overflow-hidden border border-white/5 shadow-2xl shadow-indigo-900/20" 
          style={{ background: "rgba(10, 10, 16, 0.6)", height: "calc(100vh - 400px)", minHeight: "500px", maxHeight: "800px" }}
        >
          
          {/* Glass overlay details (aesthetic only) */}
          <div className="absolute top-6 left-6 z-20 pointer-events-none hidden md:block">
            <div className="px-4 py-2 rounded-2xl bg-[#0A0A10]/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-pulse" />
              Live Memory Engine
            </div>
          </div>

          {/* Stats floating on map */}
          <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-20 flex flex-col gap-3 pointer-events-none">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border border-white/10"
              style={{ background: "rgba(16, 16, 24, 0.7)" }}
            >
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold">{memories.length > 0 ? memories.length : '100+'} Kenangan</span>
                <span className="text-white/50 text-[10px] uppercase tracking-wider">Publik yang Dibagikan</span>
              </div>
            </div>
          </div>

          {/* Example fake memory floating as social proof mockup */}
          <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 z-20 pointer-events-none max-w-[220px] hidden sm:block">
             <div className="p-4 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl" style={{ background: "linear-gradient(135deg, rgba(30,30,40,0.7), rgba(15,15,20,0.6))" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 shadow-lg shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center border-2 border-[#151520]">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=explorer1" className="w-full h-full rounded-full" alt="" />
                  </div>
                  <div>
                    <p className="text-xs text-white/90 font-medium">Fairuzz</p>
                    <p className="text-[10px] text-indigo-300">Indonesia</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">"Lautnya sangat biru, momen yang tak akan pernah kulupakan..."</p>
             </div>
          </div>

          {/* Interactive Globe Container */}
          <div className="relative w-full h-full">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              </div>
            ) : (
              <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                <GlobeView memories={memories} />
              </div>
            )}
            
            {/* Soft edge Vignette for cinematic look */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: "radial-gradient(circle at center, transparent 40%, rgba(8,8,16,0.9) 100%)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
              }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
