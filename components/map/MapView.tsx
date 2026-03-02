"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { createEmotionIcon, setupLeafletDefaultIcon } from "./MapIcons"
import Link from "next/link"
import { Calendar, MapPin, Search, Loader2 } from "lucide-react"

interface MapViewProps {
    memories: any[]
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

                {safeMemories.map((memory) => {
                    const lat = memory.latitude || 0
                    const lng = memory.longitude || 0

                    return (
                        <Marker
                            key={memory.id}
                            position={[lat, lng]}
                            icon={createEmotionIcon(memory.emotion)}
                        >
                            <Popup className="memory-popup">
                                <div className="w-48 overflow-hidden rounded-md bg-neutral-900 text-neutral-200 shadow-lg border border-neutral-800 p-0 text-left">
                                    {memory.photos?.length > 0 && (
                                        <div className="w-full h-24 overflow-hidden mb-2">
                                            <img src={memory.photos[0].url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <h4 className="font-bold font-[Outfit] text-sm text-white mb-1 leading-tight">{memory.title}</h4>
                                        <p className="text-xs text-neutral-400 line-clamp-2 mb-2">{memory.story}</p>

                                        <div className="flex items-center justify-between mt-3 text-[10px] text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(memory.date).toLocaleDateString()}
                                            </span>
                                            <span>{memory.user?.name}</span>
                                        </div>

                                        <Link
                                            href={`/memories/${memory.id}`}
                                            className="block mt-3 w-full text-center text-xs font-semibold py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                                        >
                                            View Story
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}
