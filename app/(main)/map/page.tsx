"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2, Globe } from "lucide-react"

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[var(--mm-surface)] border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-black animate-spin" />
            <p className="text-[14px] font-black uppercase text-black">Memuat Peta...</p>
        </div>
    )
})

export default function MapPage() {
    const { data: session } = useSession()
    const [memories, setMemories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/memories?public=true")
            .then(res => res.json())
            .then(data => {
                setMemories(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    return (
        <div className="h-[calc(100vh-92px)] w-full flex flex-col p-4 sm:p-6 lg:p-8 gap-4 bg-[var(--mm-bg)] overflow-hidden relative">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            {/* Redesigned Premium Header Card */}
            <div className="relative bg-[var(--mm-primary)] border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 z-20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000] rounded-xl shrink-0">
                        <Globe className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-[18px] sm:text-[22px] font-black uppercase text-black leading-none">Global Memories</h1>
                        <p className="text-[11px] sm:text-[12px] font-bold text-black/80 mt-1.5 uppercase tracking-wide">
                            Jelajahi kenangan publik dari {session?.user?.name || "komunitas"}.
                        </p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full relative z-10 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 w-full bg-[var(--mm-surface)] border-[3px] border-black shadow-[6px_6px_0_#000] flex flex-col items-center justify-center gap-4 rounded-3xl">
                        <Loader2 className="w-12 h-12 text-black animate-spin" />
                        <p className="text-[14px] font-black uppercase text-black">Memuat Kenangan...</p>
                    </div>
                ) : (
                    <div className="flex-1 w-full border-[3px] border-black shadow-[6px_6px_0_#000] overflow-hidden bg-white rounded-3xl relative">
                        <MapView memories={memories} />
                    </div>
                )}
            </div>
        </div>
    )
}

