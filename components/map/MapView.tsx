"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import Map, { Marker, Popup, NavigationControl, MapRef } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { getEmotionConfig } from "./MapIcons"
import Link from "next/link"
import { Calendar, MapPin, Search, Loader2, Layers } from "lucide-react"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"
import { PopupMiniPlayer } from "@/components/memories/PopupMiniPlayer"
import useSupercluster from "use-supercluster"

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

function SearchControl({ mapRef }: { mapRef: React.RefObject<MapRef | null> }) {
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
        mapRef.current?.flyTo({
            center: [lon, lat],
            zoom: 14,
            duration: 1500
        })
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

// ── Map Style Definitions ─────────────────────────────────────────────
const MAP_STYLES = [
    {
        id: "dark-v11",
        label: "Dark",
        style: "mapbox://styles/mapbox/dark-v11",
        preview: "#0d0d1a",
        accent: "#6366f1",
        emoji: "🌃"
    },
    {
        id: "streets-v12",
        label: "Streets",
        style: "mapbox://styles/mapbox/streets-v12",
        preview: "#e8e0d8",
        accent: "#f97316",
        emoji: "🏙️"
    },
    {
        id: "satellite-streets-v12",
        label: "Satellite",
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        preview: "#1a2e1a",
        accent: "#10b981",
        emoji: "🛰️"
    },
    {
        id: "outdoors-v12",
        label: "Outdoors",
        style: "mapbox://styles/mapbox/outdoors-v12",
        preview: "#c8dfc8",
        accent: "#84cc16",
        emoji: "🏔️"
    },
    {
        id: "light-v11",
        label: "Light",
        style: "mapbox://styles/mapbox/light-v11",
        preview: "#f8f8f8",
        accent: "#8b5cf6",
        emoji: "☀️"
    },
]

function StyleSwitcher({ current, onChange }: { current: string; onChange: (style: string) => void }) {
    const [open, setOpen] = useState(false)
    const currentStyle = MAP_STYLES.find(s => s.style === current) || MAP_STYLES[0]

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
            {/* Expanded options */}
            {open && (
                <div className="flex flex-col gap-1.5 mb-1">
                    {MAP_STYLES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => { onChange(s.style); setOpen(false) }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold backdrop-blur-md transition-all duration-200 shadow-lg border ${
                                current === s.style
                                    ? "bg-white/20 border-white/30 text-white scale-105"
                                    : "bg-neutral-900/80 border-neutral-700/50 text-neutral-300 hover:bg-neutral-800/90 hover:text-white hover:scale-105"
                            }`}
                            title={s.label}
                        >
                            <span
                                className="w-4 h-4 rounded-full border-2 border-white/30 shrink-0"
                                style={{ backgroundColor: s.preview, boxShadow: current === s.style ? `0 0 8px ${s.accent}` : "none" }}
                            />
                            <span className="text-xs">{s.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold backdrop-blur-md transition-all duration-200 shadow-xl border ${
                    open
                        ? "bg-indigo-600/90 border-indigo-400/50 text-white"
                        : "bg-neutral-900/85 border-neutral-700/50 text-neutral-200 hover:bg-neutral-800 hover:text-white"
                }`}
                title="Change map style"
            >
                <Layers className="w-4 h-4" />
                <span className="text-xs">{currentStyle.label}</span>
            </button>
        </div>
    )
}

export default function MapView({ memories }: MapViewProps) {
    const mapRef = useRef<MapRef>(null)
    const [bounds, setBounds] = useState<any>(null)
    const [zoom, setZoom] = useState(5)
    const [selectedMemory, setSelectedMemory] = useState<any>(null)
    const [mounted, setMounted] = useState(false)
    const [mapStyle, setMapStyle] = useState(MAP_STYLES[2].style)

    useEffect(() => {
        setMounted(true)
    }, [])

    const safeMemories = useMemo(() => Array.isArray(memories) ? memories : [], [memories])

    // Supercluster preparation
    const points = useMemo(() => safeMemories.map(memory => ({
        type: "Feature" as const,
        properties: { cluster: false, memoryId: memory.id, memory: memory },
        geometry: {
            type: "Point" as const,
            coordinates: [memory.longitude, memory.latitude]
        }
    })), [safeMemories])

    const { clusters, supercluster } = useSupercluster({
        points,
        bounds,
        zoom,
        options: { radius: 75, maxZoom: 20 }
    })

    if (!mounted) {
        return (
            <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center border border-neutral-800 rounded-2xl">
                <MapPin className="w-8 h-8 text-neutral-600 animate-bounce" />
            </div>
        )
    }

    const initialCenter = safeMemories.length > 0
        ? { longitude: safeMemories[0].longitude, latitude: safeMemories[0].latitude }
        : { longitude: 118.0149, latitude: -2.5489 }

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/50 sticky border border-neutral-200 relative">
            <Map
                ref={mapRef}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                initialViewState={{
                    ...initialCenter,
                    zoom: zoom
                }}
                style={{ width: "100%", height: "100%", minHeight: "60vh" }}
                mapStyle={mapStyle}
                onMove={evt => {
                    setZoom(evt.viewState.zoom)
                    const b = mapRef.current?.getMap().getBounds()?.toArray()
                    if (b) {
                        setBounds([b[0][0], b[0][1], b[1][0], b[1][1]])
                    }
                }}
                onLoad={() => {
                    const b = mapRef.current?.getMap().getBounds()?.toArray()
                    if (b) {
                        setBounds([b[0][0], b[0][1], b[1][0], b[1][1]])
                    }
                }}
            >
                <SearchControl mapRef={mapRef} />
                <NavigationControl position="bottom-right" />
                <StyleSwitcher current={mapStyle} onChange={setMapStyle} />

                {clusters.map(cluster => {
                    const [longitude, latitude] = cluster.geometry.coordinates
                    const props = cluster.properties as any
                    const isCluster = props.cluster as boolean
                    const pointCount = props.point_count as number

                    if (isCluster) {
                        let size = "w-10 h-10"
                        if (pointCount >= 10) size = "w-12 h-12"
                        if (pointCount >= 100) size = "w-14 h-14"

                        return (
                            <Marker
                                key={`cluster-${cluster.id}`}
                                longitude={longitude}
                                latitude={latitude}
                            >
                                <div
                                    className={`${size} rounded-full flex items-center justify-center relative p-[2px] shadow-2xl transition-all duration-300 transform hover:scale-110 cursor-pointer`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const expansionZoom = Math.min(
                                            supercluster?.getClusterExpansionZoom(cluster.id as number) || 20,
                                            20
                                        )
                                        mapRef.current?.flyTo({
                                            center: [longitude, latitude],
                                            zoom: expansionZoom,
                                            duration: 1000
                                        })
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full animate-pulse opacity-80"></div>
                                    <div className="absolute inset-[3px] bg-neutral-900 rounded-full z-10"></div>
                                    <div className="relative z-20 text-white font-black text-sm font-[Outfit] tracking-tighter">
                                        {pointCount}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full z-30 ring-2 ring-indigo-500 animate-bounce"></div>
                                </div>
                            </Marker>
                        )
                    }

                    const memory = cluster.properties.memory
                    const { iconChar, color } = getEmotionConfig(memory.emotion)

                    return (
                        <Marker
                            key={`memory-${memory.id}`}
                            longitude={longitude}
                            latitude={latitude}
                            anchor="bottom"
                        >
                            <div
                                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedMemory(memory)
                                    mapRef.current?.flyTo({
                                        center: [longitude, latitude],
                                        zoom: 14,
                                        duration: 800
                                    })
                                }}
                            >
                                <div style={{ backgroundColor: color }} className="w-8 h-8 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                                    <span className="text-base">{iconChar}</span>
                                </div>
                                <div style={{ borderTopColor: color }} className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] mx-auto -mt-0.5"></div>
                            </div>
                        </Marker>
                    )
                })}

                {selectedMemory && (
                    <Popup
                        longitude={selectedMemory.longitude}
                        latitude={selectedMemory.latitude}
                        anchor="bottom"
                        offset={40}
                        onClose={() => setSelectedMemory(null)}
                        closeButton={false}
                        maxWidth="320px"
                        className="memory-mapbox-popup"
                    >
                        {(() => {
                            const theme = parseTheme(selectedMemory.user?.inventories?.[0]?.item?.value)
                            const footerBorderColor = theme ? (
                                theme.footerBorder.includes("neutral-200") ? "rgba(200,200,200,0.3)" :
                                    theme.footerBorder.includes("amber-900") ? "rgba(100,60,10,0.4)" :
                                        theme.footerBorder.includes("indigo") ? "rgba(99,102,241,0.2)" :
                                            "rgba(255,255,255,0.08)"
                            ) : "rgba(255,255,255,0.08)"

                            return (
                                <Link
                                    href={`/memories/${selectedMemory.id}`}
                                    className="block overflow-hidden text-left cursor-pointer group/popup rounded-xl"
                                    style={{
                                        background: theme?.background ?? "#11111a",
                                    }}
                                >
                                    {(() => {
                                        const photos = (selectedMemory.photos ?? []).map((p: any) => {
                                            try {
                                                const parsed = JSON.parse(p.url)
                                                return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
                                            } catch {
                                                return p
                                            }
                                        }).filter((p: any) => p && p.url)

                                        if (photos.length === 0) return null

                                        return (
                                            <div className="w-full h-32 sm:h-40 overflow-hidden relative">
                                                <img
                                                    src={photos[0].url}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/popup:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                                {(selectedMemory.stickerPlacements ?? []).map((p: any) => {
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
                                                                memoryDate={selectedMemory.date}
                                                                customText={p.customText}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })()}
                                    <div className="p-4">
                                        <h4
                                            className="font-bold font-[Outfit] text-base mb-1 leading-tight tracking-tight transition-colors"
                                            style={{ color: theme?.titleColor ?? "#ffffff" }}
                                        >
                                            {selectedMemory.title}
                                        </h4>
                                        <p
                                            className="text-xs line-clamp-2 mb-3 leading-relaxed font-light opacity-90"
                                            style={{ color: theme?.storyColor ?? "#d4d4d4" }}
                                        >
                                            {selectedMemory.story}
                                        </p>

                                        {selectedMemory.spotifyTrackId ? (
                                            <div className="mt-2 mb-2 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                <iframe
                                                    style={{ borderRadius: '8px', background: 'transparent' }}
                                                    src={`https://open.spotify.com/embed/track/${selectedMemory.spotifyTrackId}?utm_source=generator&theme=0`}
                                                    width="100%"
                                                    height="80"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                    loading="lazy"
                                                ></iframe>
                                            </div>
                                        ) : selectedMemory.audioUrl ? (
                                            <PopupMiniPlayer
                                                audioUrl={selectedMemory.audioUrl}
                                                startTime={selectedMemory.audioStartTime || 0}
                                                duration={selectedMemory.audioDuration || 15}
                                                fileName={selectedMemory.audioFileName || "Audio"}
                                            />
                                        ) : null}

                                        <div
                                            className="flex items-center justify-between pt-2 mt-2"
                                            style={{ borderTop: `1px solid ${footerBorderColor}` }}
                                        >
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: theme?.storyColor ?? "#a3a3a3" }}>
                                                <Calendar className="w-3 h-3 text-indigo-400" />
                                                {new Date(selectedMemory.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-white/[0.05] px-1.5 py-0.5 rounded-full" style={{ color: theme?.titleColor ?? "#e5e5e5" }}>
                                                <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                {selectedMemory.user?.name}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })()}
                    </Popup>
                )}
            </Map>
        </div>
    )
}