"use client"

import { Globe, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const GlobeView = dynamic(() => import("@/components/map/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-transparent flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
        <span className="text-black/60 text-sm font-bold">Memuat globe interaktif...</span>
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
        transition={{ delay: 0.4, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {/* The Neubrutalism Map Container */}
        <div 
          className="relative w-full border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden bg-[#0A0A10]" 
          style={{ height: "calc(100vh - 400px)", minHeight: "500px", maxHeight: "800px" }}
        >
          
          {/* Live badge - neubrutalism */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none hidden md:block">
            <div className="px-4 py-2 bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] text-xs font-black text-black flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 bg-black" />
              Live Memory Engine
            </div>
          </div>

          {/* Stats floating on map */}
          <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 z-20 flex flex-col gap-3 pointer-events-none">
            <div className="flex items-center gap-3 px-4 py-3 text-sm font-bold bg-white border-[3px] border-black shadow-[4px_4px_0_#000]">
              <div className="p-2 bg-[#00FFFF] border-[3px] border-black text-black">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-black font-black">{memories.length > 0 ? memories.length : '100+'} Kenangan</span>
                <span className="text-black/50 text-[10px] uppercase tracking-wider font-bold">Publik yang Dibagikan</span>
              </div>
            </div>
          </div>

          {/* Social proof mockup */}
          <div className="absolute bottom-4 left-4 lg:bottom-8 lg:left-8 z-20 pointer-events-none max-w-[220px] hidden sm:block">
             <div className="p-4 bg-[#FF00FF] border-[3px] border-black shadow-[4px_4px_0_#000]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 shadow-lg shrink-0 bg-[#FFFF00] border-[3px] border-black flex items-center justify-center overflow-hidden">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=explorer1" className="w-full h-full" alt="" />
                  </div>
                  <div>
                    <p className="text-xs text-white font-black">Fairuzz</p>
                    <p className="text-[10px] text-white/80 font-bold">Indonesia</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/90 leading-relaxed font-medium">&quot;Lautnya sangat biru, momen yang tak akan pernah kulupakan...&quot;</p>
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
          </div>
        </div>
      </motion.div>
    </section>
  )
}
