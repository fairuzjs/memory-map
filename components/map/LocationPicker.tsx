"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { MapPin, Search, Layers } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface LocationPickerProps {
    latitude: number
    longitude: number
    locationName: string
    onChange: (lat: number, lng: number, name: string) => void
}

// ── Map Style Definitions ───────────────────────────────────────────────
const MAP_STYLES = [
    { id: "dark-v11",              label: "Dark",      style: "mapbox://styles/mapbox/dark-v11",                  preview: "#0d0d1a" },
    { id: "streets-v12",           label: "Streets",   style: "mapbox://styles/mapbox/streets-v12",               preview: "#e8e0d8" },
    { id: "satellite-streets-v12", label: "Satellite", style: "mapbox://styles/mapbox/satellite-streets-v12",     preview: "#1a2e1a" },
    { id: "outdoors-v12",          label: "Outdoors",  style: "mapbox://styles/mapbox/outdoors-v12",              preview: "#c8dfc8" },
    { id: "light-v11",             label: "Light",     style: "mapbox://styles/mapbox/light-v11",                 preview: "#f8f8f8" },
]

export default function LocationPicker({ latitude, longitude, locationName, onChange }: LocationPickerProps) {
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

    if (!mounted) return <div className="h-64 bg-neutral-900 animate-pulse rounded-2xl" />

    const initialCenter = position ? [position.lng, position.lat] : [118.0149, -2.5489]
    const activeStyleLabel = MAP_STYLES.find(s => s.style === mapStyle)?.label ?? "Dark"

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSearch(); setShowSuggestions(false) }
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Cari lokasi (cth: Bali, Jakarta)"
                        className="pl-9"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <button key={i} type="button"
                                    className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0 truncate"
                                    onClick={() => handleSelectSuggestion(s)}
                                >
                                    {s.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Button type="button" onClick={(e) => handleSearch(e)} disabled={isSearching} className="gap-2">
                    <Search className="w-4 h-4" />
                    {isSearching ? "..." : "Cari"}
                </Button>
            </div>

            {/* Map */}
            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-neutral-700 relative z-0">
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
                        {styleOpen && (
                            <div className="flex flex-col gap-1 mb-0.5">
                                {MAP_STYLES.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => { setMapStyle(s.style); setStyleOpen(false) }}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all duration-150 shadow-md border ${
                                            mapStyle === s.style
                                                ? "bg-white/20 border-white/30 text-white"
                                                : "bg-neutral-900/85 border-neutral-700/50 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                        }`}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                                            style={{ backgroundColor: s.preview }}
                                        />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setStyleOpen(o => !o)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition-all duration-150 shadow-lg border ${
                                styleOpen
                                    ? "bg-indigo-600/90 border-indigo-400/50 text-white"
                                    : "bg-neutral-900/85 border-neutral-700/50 text-neutral-200 hover:bg-neutral-800 hover:text-white"
                            }`}
                            title="Ganti tampilan peta"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{activeStyleLabel}</span>
                        </button>
                    </div>

                    {/* Location Pin Marker */}
                    {position && (
                        <Marker longitude={position.lng} latitude={position.lat} anchor="center">
                            <div style={{
                                backgroundColor: '#6366f1',
                                width: '32px', height: '32px',
                                borderRadius: '50%',
                                border: '3px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.5)'
                            }}>
                                <span style={{ fontSize: '16px' }}>📍</span>
                            </div>
                        </Marker>
                    )}
                </Map>
            </div>

            <p className="text-xs text-neutral-500">
                Klik di peta untuk menjatuhkan pin, atau gunakan pencarian untuk menemukan tempat terindah.
            </p>
        </div>
    )
}
