import React from "react"
import { motion } from "framer-motion"
import { Navigation2, Globe } from "lucide-react"
import Link from "next/link"
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

interface ProfileMapTeaserProps {
    mappedMemories: any[]
    isOwner: boolean
    userName: string
}

export function ProfileMapTeaser({ mappedMemories, isOwner, userName }: ProfileMapTeaserProps) {
    const avgLat = mappedMemories.length
        ? mappedMemories.reduce((s: number, m: any) => s + m.latitude, 0) / mappedMemories.length
        : 1.3521
    const avgLng = mappedMemories.length
        ? mappedMemories.reduce((s: number, m: any) => s + m.longitude, 0) / mappedMemories.length
        : 103.8198

    return (
        <div className="rounded-[1.5rem] overflow-hidden flex flex-col relative group h-full"
            style={{ background: "#0a0a10", border: "1px solid rgba(255,255,255,0.07)", minHeight: "280px" }}>
            <div className="absolute top-0 inset-x-0 p-5 z-20 flex items-start justify-between pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(10,10,16,0.95) 0%, rgba(10,10,16,0) 100%)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md"
                        style={{ background: "rgba(244,114,182,0.15)", border: "1px solid rgba(244,114,182,0.3)" }}>
                        <Navigation2 className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white tracking-tight leading-none drop-shadow-md">Jejak Langkah</h2>
                        <p className="text-[11px] font-semibold text-pink-300 mt-1 drop-shadow-md">
                            {mappedMemories.length > 0 ? `${mappedMemories.length} Titik Kenangan` : "Belum ada jejak"}
                        </p>
                    </div>
                </div>
                {mappedMemories.length > 0 && (
                    <Link href="/map" className="flex items-center justify-center p-2.5 rounded-full bg-white/10 hover:bg-pink-500/20 transition-all backdrop-blur-md border border-white/10 group-hover:scale-110 pointer-events-auto">
                        <Globe className="w-4 h-4 text-white" />
                    </Link>
                )}
            </div>

            <div className="flex-1 relative w-full h-full z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                {mappedMemories.length > 0 ? (
                    <Map
                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                        initialViewState={{
                            longitude: avgLng,
                            latitude: avgLat,
                            zoom: mappedMemories.length === 1 ? 10 : 2.5,
                            pitch: 45,
                            bearing: -15
                        }}
                        mapStyle="mapbox://styles/mapbox/satellite-v9"
                        dragPan={true}
                        scrollZoom={true}
                        doubleClickZoom={true}
                        dragRotate={true}
                        touchZoomRotate={true}
                        attributionControl={false}
                        style={{ width: "100%", height: "100%" }}
                    >
                        {mappedMemories.length > 1 && (
                            <Source id="route" type="geojson" data={{
                                type: "Feature", properties: {}, geometry: {
                                    type: "LineString",
                                    coordinates: mappedMemories
                                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                                        .map((m) => [m.longitude, m.latitude])
                                }
                            }}>
                                <Layer id="route-line" type="line" paint={{ "line-color": "#f472b6", "line-width": 1.5, "line-dasharray": [3, 3], "line-opacity": 0.6 }} />
                            </Source>
                        )}
                        {mappedMemories.map((m, i) => (
                            <Marker key={m.id} longitude={m.longitude} latitude={m.latitude} anchor="center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + (i * 0.1) }} className="relative flex items-center justify-center">
                                    <div className="absolute w-6 h-6 bg-pink-500/30 rounded-full blur-md animate-pulse" />
                                    <div className="w-2.5 h-2.5 bg-pink-400 rounded-full border border-white/80 shadow-[0_0_12px_#f472b6]" />
                                </motion.div>
                            </Marker>
                        ))}
                    </Map>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                        <Navigation2 className="w-8 h-8 text-neutral-800" />
                        <p className="text-xs text-neutral-500">
                            {isOwner ? "Jelajahi dunia dan simpan kenanganmu di sini." : `${userName} belum memiliki jejak langkah.`}
                        </p>
                    </div>
                )}
                <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none z-20 bg-gradient-to-t from-neutral-950 to-transparent" />
            </div>
        </div>
    )
}
