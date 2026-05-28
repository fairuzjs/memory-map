"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { MapPin, Search, Layers, X } from "lucide-react"


import { getPremiumMarkerStyle } from "@/components/map/MapIcons"

interface LocationPickerProps {
    latitude: number
    longitude: number
    locationName: string
    onChange: (lat: number, lng: number, name: string) => void
    markerStyle?: string | null
}

// ── Map Style Definitions ───────────────────────────────────────────────
const MAP_STYLES = [
    { id: "dark-v11",              label: "Dark",      style: "mapbox://styles/mapbox/dark-v11",                  preview: "#0d0d1a" },
    { id: "streets-v12",           label: "Streets",   style: "mapbox://styles/mapbox/streets-v12",               preview: "#e8e0d8" },
    { id: "satellite-streets-v12", label: "Satellite", style: "mapbox://styles/mapbox/satellite-streets-v12",     preview: "#1a2e1a" },
    { id: "outdoors-v12",          label: "Outdoors",  style: "mapbox://styles/mapbox/outdoors-v12",              preview: "#c8dfc8" },
    { id: "light-v11",             label: "Light",     style: "mapbox://styles/mapbox/light-v11",                 preview: "#f8f8f8" },
]

export default function LocationPicker({ latitude, longitude, locationName, onChange, markerStyle }: LocationPickerProps) {
    const mapRef = useRef<MapRef>(null)
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState(locationName || "")
    const [isSearching, setIsSearching] = useState(false)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    )
    const [mapStyle, setMapStyle] = useState(MAP_STYLES[2].style)
    const [styleOpen, setStyleOpen] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    // Debounced autocomplete search
    useEffect(() => {
        if (!searchQuery || !showSuggestions) { setSuggestions([]); return }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`)
                const data = await res.json()
                setSuggestions(data || [])
            } catch { }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery, showSuggestions])

    const handlePositionChange = useCallback(async (lat: number, lng: number) => {
        setPosition({ lat, lng })
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 1500 })
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            const data = await res.json()
            const name = data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || "Lokasi Tidak Diketahui"
            setSearchQuery(name)
            onChange(lat, lng, name)
        } catch {
            onChange(lat, lng, "Lokasi Tidak Diketahui")
        }
    }, [onChange])

    const handleMapClick = (e: any) => {
        const { lng, lat } = e.lngLat
        handlePositionChange(lat, lng)
    }

    const handleSearch = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.preventDefault()
        if (!searchQuery) return
        setIsSearching(true)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0]
                const newLat = parseFloat(lat)
                const newLng = parseFloat(lon)
                const shortName = display_name.split(',')[0]
                setPosition({ lat: newLat, lng: newLng })
                mapRef.current?.flyTo({ center: [newLng, newLat], zoom: 13, duration: 1500 })
                onChange(newLat, newLng, shortName)
                setSearchQuery(shortName)
                setShowSuggestions(false)
            }
        } catch { console.error("Search failed") }
        finally { setIsSearching(false) }
    }

    const handleSelectSuggestion = (suggestion: any) => {
        const newLat = parseFloat(suggestion.lat)
        const newLng = parseFloat(suggestion.lon)
        const shortName = suggestion.display_name.split(',')[0]
        setPosition({ lat: newLat, lng: newLng })
        mapRef.current?.flyTo({ center: [newLng, newLat], zoom: 13, duration: 1500 })
        onChange(newLat, newLng, shortName)
        setSearchQuery(shortName)
        setShowSuggestions(false)
    }

    if (!mounted) return <div className="h-64 bg-[#E5E5E5] animate-pulse border-[3px] border-black" />

    const initialCenter = position ? [position.lng, position.lat] : [118.0149, -2.5489]
    const activeStyleLabel = MAP_STYLES.find(s => s.style === mapStyle)?.label ?? "Dark"

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1 flex items-center bg-white border-[2.5px] border-black rounded-xl overflow-hidden focus-within:bg-[#FFFDF0] transition-all">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                    <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSearch(); setShowSuggestions(false) }
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Cari lokasi (cth: Bali, Jakarta)"
                        className="w-full pl-9 pr-10 py-2.5 bg-transparent text-black font-bold placeholder:text-neutral-400 outline-none text-sm"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false) }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-[#FFFDF0] border-[2.5px] border-black shadow-[5px_5px_0_#000] rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <button key={i} type="button"
                                    className="w-full text-left px-4 py-2.5 text-xs text-black font-black uppercase hover:bg-[#fef08a]/35 transition-colors border-b-[2px] border-black/10 last:border-b-0 truncate"
                                    onClick={() => handleSelectSuggestion(s)}
                                >
                                    {s.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={(e) => handleSearch(e)}
                    disabled={isSearching}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#86efac] border-[2.5px] border-black shadow-[3px_3px_0_#000] text-black font-black text-sm uppercase hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 shrink-0 rounded-xl"
                >
                    <Search className="w-4 h-4" />
                    {isSearching ? "..." : "Cari"}
                </button>
            </div>

            {/* Map */}
            <div className="h-64 sm:h-80 w-full overflow-hidden border-[3px] border-black relative z-0">
                <Map
                    ref={mapRef}
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                    initialViewState={{ longitude: initialCenter[0], latitude: initialCenter[1], zoom: position ? 13 : 5 }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle={mapStyle}
                    onClick={handleMapClick}
                >
                    <NavigationControl position="bottom-right" />

                    {/* Style Switcher — top-right */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                        {/* Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setStyleOpen(o => !o)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase border-[2px] border-black shadow-[2px_2px_0_#000] bg-[#FFFDF0] text-black hover:bg-[#fef08a] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[3px_3px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150"
                            title="Ganti tampilan peta"
                        >
                            <Layers className="w-3.5 h-3.5 text-black shrink-0" />
                            <span>{activeStyleLabel}</span>
                        </button>

                        {styleOpen && (
                            <div className="bg-white border-[2px] border-black shadow-[3px_3px_0_#000] rounded-xl p-1.5 flex flex-col gap-1 min-w-[110px]">
                                {MAP_STYLES.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => { setMapStyle(s.style); setStyleOpen(false) }}
                                        className={`flex items-center gap-1.5 w-full px-2 py-1 rounded text-[9px] font-black uppercase border-[1.5px] transition-all duration-150 ${
                                            mapStyle === s.style
                                                ? "bg-[#fef08a] border-black shadow-[1.5px_1.5px_0_#000]"
                                                : "bg-white border-black/10 hover:border-black hover:bg-[#F5F2EB] shadow-none"
                                        }`}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                                            style={{ backgroundColor: s.preview }}
                                        />
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Location Pin Marker */}
                    {position && (
                        <Marker longitude={position.lng} latitude={position.lat} anchor="center">
                            {markerStyle ? (() => {
                                const style = getPremiumMarkerStyle(markerStyle)
                                const shapeClass = style.shape !== "circle" ? `pm-shape-${style.shape}` : "rounded-full"
                                return (
                                    <div className={`${style.animation}`}>
                                        <div
                                            className={`relative w-10 h-10 ${shapeClass}`}
                                            style={{
                                                background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`,
                                                border: `2.5px solid ${style.borderColor}`,
                                                boxShadow: `0 0 16px ${style.glowColor}, 0 2px 8px rgba(0,0,0,0.4)`,
                                                ["--pm-glow" as any]: style.glowColor,
                                            }}
                                        >
                                            <div
                                                className={`absolute inset-[3px] opacity-25 ${shapeClass}`}
                                                style={{ background: `radial-gradient(circle at 35% 35%, white, transparent 60%)` }}
                                            />
                                            <div
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center z-20"
                                                style={{ background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`, border: `1.5px solid ${style.borderColor}` }}
                                            >
                                                <span className="text-[7px]">👑</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })() : (
                                <div className="relative flex flex-col items-center group">
                                    <div className="w-9 h-9 rounded-full border-[2.5px] border-black bg-[#fef08a] flex items-center justify-center shadow-[2.5px_2.5px_0_#000] z-10 transition-transform duration-200 group-hover:-translate-y-0.5">
                                        <span className="text-base select-none">📍</span>
                                    </div>
                                    <div className="w-3.5 h-3.5 border-r-[2.5px] border-b-[2.5px] border-black bg-[#fef08a] rotate-45 -mt-[9px] z-0 shadow-[1.5px_1.5px_0_#000] transition-transform duration-200 group-hover:-translate-y-0.5" />
                                </div>
                            )}
                        </Marker>
                    )}
                </Map>
            </div>

            <p className="text-xs text-neutral-500 font-bold">
                Klik di peta untuk menjatuhkan pin, atau gunakan pencarian untuk menemukan tempat terindah.
            </p>
        </div>
    )
}
