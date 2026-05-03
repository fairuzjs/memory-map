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
        <div className="overflow-hidden flex flex-col relative group h-full bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
            style={{ minHeight: "280px" }}>
            <div className="absolute top-0 inset-x-0 p-5 z-20 flex items-start justify-between pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-[#FF00FF] border-[3px] border-black shadow-[2px_2px_0_#000]">
                        <Navigation2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-black tracking-tight leading-none uppercase">Jejak Langkah</h2>
                        <p className="text-[11px] font-black text-black mt-1 uppercase tracking-wider">
                            {mappedMemories.length > 0 ? `${mappedMemories.length} Titik Kenangan` : "Belum ada jejak"}
                        </p>
                    </div>
                </div>
                {mappedMemories.length > 0 && (
                    <Link href="/map" className="flex items-center justify-center p-2.5 bg-white border-[3px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all pointer-events-auto">
                        <Globe className="w-4 h-4 text-black" />
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
                                <Layer id="route-line" type="line" paint={{ "line-color": "#FF00FF", "line-width": 2, "line-dasharray": [3, 3], "line-opacity": 0.8 }} />
                            </Source>
                        )}
                        {mappedMemories.map((m, i) => (
                            <Marker key={m.id} longitude={m.longitude} latitude={m.latitude} anchor="center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + (i * 0.1) }} className="relative flex items-center justify-center">
                                    <div className="w-4 h-4 bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000]" />
                                </motion.div>
                            </Marker>
                        ))}
                    </Map>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#E5E5E5]"
                        style={{
                            backgroundImage: "linear-gradient(#D5D5D5 2px, transparent 2px), linear-gradient(90deg, #D5D5D5 2px, transparent 2px)",
                            backgroundSize: "24px 24px",
                        }}>
                        <Navigation2 className="w-8 h-8 text-neutral-400" />
                        <p className="text-xs text-neutral-500 font-bold">
                            {isOwner ? "Jelajahi dunia dan simpan kenanganmu di sini." : `${userName} belum memiliki jejak langkah.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
