"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { createEmotionIcon, setupLeafletDefaultIcon } from "./MapIcons"
import MarkerClusterGroup from "./MarkerClusterGroup"
import Link from "next/link"
import { Calendar, MapPin, Search, Loader2 } from "lucide-react"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"

interface MapViewProps {
    memories: any[]
}

type CardTheme = {
    border: string
    background: string
    shadow: string
    imageFilter: string
    radius: string
    contentPadding: string
    titleColor: string
    storyColor: string
    footerBorder: string
    footerTextColor: string
}

function parseTheme(rawValue: string | null | undefined): CardTheme | null {
    if (!rawValue) return null
    try { return JSON.parse(rawValue) } catch { return null }
}

function SearchControl() {
    const map = useMap()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const searchNominatim = async (q: string) => {
        if (!q.trim()) {
            setResults([])
            return
        }
        setIsSearching(true)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`)
            const data = await res.json()
            setResults(data)
            setShowResults(true)
        } catch (error) {
            console.error("Search error", error)
        } finally {
            setIsSearching(false)
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

        searchTimeoutRef.current = setTimeout(() => {
            searchNominatim(val)
        }, 500)
    }

    const handleSelect = (result: any) => {
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)
        map.flyTo([lat, lon], 14, { duration: 1.5 })
        setShowResults(false)
        setQuery(result.display_name)
    }

    return (
        <div ref={wrapperRef} className="absolute top-4 left-4 z-[1000] w-72 sm:w-96">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onFocus={() => { if (query) setShowResults(true) }}
                    placeholder="Search locations..."
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-xl leading-5 bg-white text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-lg text-sm transition-all"
                />
                {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                    </div>
                )}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden max-h-64 overflow-y-auto">
                    {results.map((res: any, i: number) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handleSelect(res)}
                            className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors flex items-start gap-3"
                        >
                            <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                            <div className="flex items-center w-full min-w-0">
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium text-neutral-900 truncate">{res.display_name.split(',')[0]}</span>
                                    <span className="text-xs text-neutral-500 truncate">{res.display_name}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function MapView({ memories }: MapViewProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Leaflet accesses window, so we must make sure we're strictly on client side
        setMounted(true)
        setupLeafletDefaultIcon()
    }, [])

    if (!mounted) {
        return (
            <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center border border-neutral-800 rounded-2xl">
                <MapPin className="w-8 h-8 text-neutral-600 animate-bounce" />
            </div>
        )
    }

    // Find center or default to Central Indonesia
    const safeMemories = Array.isArray(memories) ? memories : []
    const center = safeMemories.length > 0
        ? [safeMemories[0].latitude, safeMemories[0].longitude]
        : [-2.5489, 118.0149]

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/50 sticky border border-neutral-200">
            <MapContainer
                center={center as [number, number]}
                zoom={5}
                style={{ width: "100%", height: "100%", minHeight: "60vh", zIndex: 10 }}
                scrollWheelZoom={true}
                zoomControl={false} // Disabled default zoom control so it doesn't overlap search, we re-position it or rely on scroll
            >
                <SearchControl />

                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Street (Default)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Dark">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Terrain">
                        <TileLayer
                            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                <MarkerClusterGroup>
                    {safeMemories.map((memory) => {
                        const lat = memory.latitude || 0
                        const lng = memory.longitude || 0

                        return (() => {
                            const rawTheme = memory.user?.inventories?.[0]?.item?.value ?? null
                            const theme = parseTheme(rawTheme)
                            const footerBorderColor = theme ? (
                                theme.footerBorder.includes("neutral-200") ? "rgba(200,200,200,0.3)" :
                                theme.footerBorder.includes("amber-900") ? "rgba(100,60,10,0.4)" :
                                theme.footerBorder.includes("indigo") ? "rgba(99,102,241,0.2)" :
                                "rgba(255,255,255,0.08)"
                            ) : "rgba(255,255,255,0.08)"

                            return (
                                <Marker
                                    key={memory.id}
                                    position={[lat, lng]}
                                    icon={createEmotionIcon(memory.emotion)}
                                >
                                    <Popup className="memory-popup">
                                        <Link
                                            href={`/memories/${memory.id}`}
                                            className="block w-64 sm:w-72 overflow-hidden text-left cursor-pointer group/popup"
                                            style={{
                                                background: theme?.background ?? "#11111a",
                                                border: "none",
                                            }}
                                        >
                                            {(() => {
                                                const photos = (memory.photos ?? []).map((p: any) => {
                                                    try {
                                                        const parsed = JSON.parse(p.url)
                                                        return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
                                                    } catch {
                                                        return p // legacy fallback
                                                    }
                                                })

                                                if (photos.length === 0) return null

                                                return (
                                                    <div className="w-full h-40 overflow-hidden relative">
                                                        <img
                                                            src={photos[0].url}
                                                            alt=""
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/popup:scale-110"
                                                            style={{ filter: theme?.imageFilter ?? "none" }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                                                        {/* Sticker placements */}
                                                        {(memory.stickerPlacements ?? []).map((p: any) => {
                                                            let cfg: StickerConfig | null = null
                                                            try { cfg = JSON.parse(p.item.value) } catch { return null }
                                                            if (!cfg) return null
                                                            return (
                                                                <div
                                                                    key={p.id}
                                                                    className="absolute pointer-events-none select-none"
                                                                    style={{
                                                                        left: `${p.posX}%`,
                                                                        top: `${p.posY}%`,
                                                                        transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale * 0.75})`,
                                                                        transformOrigin: "center",
                                                                        zIndex: 10,
                                                                        filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.4))",
                                                                    }}
                                                                >
                                                                    <StickerRenderer
                                                                        config={cfg}
                                                                        memoryDate={memory.date}
                                                                        customText={p.customText}
                                                                    />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })()}
                                            <div className="p-5 pt-4">
                                                <h4
                                                    className="font-bold font-[Outfit] text-lg mb-2 leading-tight tracking-tight transition-colors"
                                                    style={{ color: theme?.titleColor ?? "#ffffff" }}
                                                >
                                                    {memory.title}
                                                </h4>

                                                <p
                                                    className="text-sm line-clamp-3 mb-5 leading-relaxed font-light opacity-90"
                                                    style={{ color: theme?.storyColor ?? "#d4d4d4" }}
                                                >
                                                    {memory.story}
                                                </p>

                                                <div
                                                    className="flex items-center justify-between py-3"
                                                    style={{ borderTop: `1px solid ${footerBorderColor}` }}
                                                >
                                                    <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: theme?.storyColor ?? "#a3a3a3" }}>
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                        {new Date(memory.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-semibold bg-white/[0.05] px-2 py-0.5 rounded-full" style={{ color: theme?.titleColor ?? "#e5e5e5" }}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                        {memory.user?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </Popup>
                                </Marker>
                            )
                        })()
                    })}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    )
}