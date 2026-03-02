"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center rounded-2xl border border-neutral-800"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
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
        <div className="flex flex-col h-[calc(100vh-64px)] w-full">
            <div className="px-4 sm:px-6 lg:px-8 py-4 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50 z-20 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold font-[Outfit]">Global Memories</h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        Explore public moments shared by {session?.user?.name || "the community"}.
                    </p>
                </div>
            </div>

            <div className="flex-1 relative p-4">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center bg-neutral-900/50 rounded-2xl border border-neutral-800">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <MapView memories={memories} />
                )}
            </div>
        </div>
    )
}
