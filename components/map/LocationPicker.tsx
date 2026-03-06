"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin, Search } from "lucide-react"
import { setupLeafletDefaultIcon } from "./MapIcons"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface LocationPickerProps {
    latitude: number
    longitude: number
    locationName: string
    onChange: (lat: number, lng: number, name: string) => void
}

function LocationMarker({ position, setPosition }: any) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    return position === null ? null : (
        <Marker position={position} icon={L.divIcon({
            className: "custom-div-icon",
            html: `
        <div style="background-color: #6366f1; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <span style="font-size: 16px;">📍</span>
        </div>
      `,
            iconSize: [32, 42],
            iconAnchor: [16, 42],
        })} />
    )
}

function MapUpdater({ position }: { position: L.LatLng | null }) {
    const map = useMap()
    useEffect(() => {
        if (position) {
            map.flyTo(position, 13, { duration: 1.5 })
        }
    }, [position, map])
    return null
}

export default function LocationPicker({ latitude, longitude, locationName, onChange }: LocationPickerProps) {
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState(locationName || "")
    const [isSearching, setIsSearching] = useState(false)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Debounce exact query
    useEffect(() => {
        if (!searchQuery || !showSuggestions) {
            setSuggestions([])
            return
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`)
                const data = await res.json()
                setSuggestions(data || [])
            } catch (e) { }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery, showSuggestions])

    // Memoize so reference stays same for map initial load
    const pos = useMemo(() => {
        return latitude && longitude ? new L.LatLng(latitude, longitude) : null
    }, [latitude, longitude])

    const [position, setPosition] = useState<L.LatLng | null>(pos)

    useEffect(() => {
        setMounted(true)
        setupLeafletDefaultIcon()
    }, [])

    const handlePositionChange = useCallback(async (newPos: L.LatLng) => {
        setPosition(newPos)

        // Reverse Geocoding via Nominatim OpenStreetMap
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
            const data = await res.json()

            const name = data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || "Lokasi Tidak Diketahui"
            setSearchQuery(name)
            onChange(newPos.lat, newPos.lng, name)
        } catch (e) {
            onChange(newPos.lat, newPos.lng, "Lokasi Tidak Diketahui")
        }
    }, [onChange])

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

                setPosition(new L.LatLng(newLat, newLng))
                onChange(newLat, newLng, shortName)
                setSearchQuery(shortName)
                setShowSuggestions(false)
            }
        } catch (error) {
            console.error("Search failed")
        } finally {
            setIsSearching(false)
        }
    }

    const handleSelectSuggestion = (suggestion: any) => {
        const newLat = parseFloat(suggestion.lat)
        const newLng = parseFloat(suggestion.lon)
        const shortName = suggestion.display_name.split(',')[0]

        setPosition(new L.LatLng(newLat, newLng))
        onChange(newLat, newLng, shortName)
        setSearchQuery(shortName)
        setShowSuggestions(false)
    }

    if (!mounted) return <div className="h-64 bg-neutral-900 animate-pulse rounded-2xl" />

    const defaultCenter = position || new L.LatLng(-2.5489, 118.0149) // Center Indonesia

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setShowSuggestions(true)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSearch()
                                setShowSuggestions(false)
                            }
                        }}
                        onBlur={() => {
                            // Delay hiding so clicking suggestion works
                            setTimeout(() => setShowSuggestions(false), 200)
                        }}
                        placeholder="Cari lokasi (cth: Bali, Jakarta)"
                        className="pl-9"
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    type="button"
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

            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-neutral-700 relative z-0">
                <MapContainer
                    center={defaultCenter as L.LatLngExpression}
                    zoom={position ? 13 : 5}
                    style={{ width: "100%", height: "100%", zIndex: 10 }}
                >
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Jalanan (Bawaan)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satelit">
                            <TileLayer
                                attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Gelap">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Dataran">
                            <TileLayer
                                attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                    <MapUpdater position={position} />
                    <LocationMarker position={position} setPosition={handlePositionChange} />
                </MapContainer>
            </div>

            <p className="text-xs text-neutral-500">
                Klik di peta untuk menjatuhkan pin, atau gunakan pencarian untuk menemukan tempat terindah.
            </p>
        </div>
    )
}
