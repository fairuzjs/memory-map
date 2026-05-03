"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2, Globe } from "lucide-react"

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-[#E5E5E5] border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col items-center justify-center gap-4">
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
        <div className="flex flex-col h-[calc(100vh-64px)] w-full relative bg-white">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="px-4 sm:px-6 lg:px-8 py-4 bg-[#FFFF00] border-b-[4px] border-black shadow-[0_4px_0_#000] z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                        <Globe className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-black uppercase text-black">Global Memories</h1>
                        <p className="text-[12px] font-bold text-black/80 mt-0.5 uppercase">
                            Jelajahi kenangan publik dari {session?.user?.name || "komunitas"}.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative p-4 sm:p-6 z-10 flex flex-col">
                {loading ? (
                    <div className="flex-1 w-full bg-[#E5E5E5] border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-12 h-12 text-black animate-spin" />
                        <p className="text-[14px] font-black uppercase text-black">Memuat Kenangan...</p>
                    </div>
                ) : (
                    <div className="flex-1 w-full border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden bg-white">
                        <MapView memories={memories} />
                    </div>
                )}
            </div>
        </div>
    )
}
