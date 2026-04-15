"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Music2, CheckCircle2 } from "lucide-react"

export interface SpotifyTrack {
    id: string
    name: string
    artists: string
    albumArt: string
    duration_ms: number
    preview_url: string | null
    explicit: boolean
    external_url: string
}

interface SpotifySearchProps {
    value: string | null // track ID
    onChange: (trackId: string | null) => void
}

export function SpotifySearch({ value, onChange }: SpotifySearchProps) {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [results, setResults] = useState<SpotifyTrack[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
    const [isSearching, setIsSearching] = useState(false)

    // Debounce input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    // Fetch from Spotify via our internal API
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([])
            setIsSearching(false)
            return
        }

        const fetchTracks = async () => {
            setIsLoading(true)
            setIsSearching(true)
            try {
                const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(debouncedQuery)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data.tracks || [])
                }
            } catch (error) {
                console.error("Failed to search Spotify", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTracks()
    }, [debouncedQuery])

    // Load initial track if we have a value but no selected track details
    // (This is useful if editing a memory with an existing track, though we don't have an endpoint to fetch a single track yet.
    // Assuming for now the value is loaded properly or we only keep track of ID).
    
    const handleSelect = (track: SpotifyTrack) => {
        setSelectedTrack(track)
        onChange(track.id)
        setQuery("") // hide results after selection
        setResults([])
    }

    const handleClear = () => {
        setSelectedTrack(null)
        onChange(null)
    }

    return (
        <div className="space-y-4">
            {/* Selected Track View */}
            {value && selectedTrack ? (
                <div className="flex items-center gap-4 bg-neutral-900/60 p-4 border border-green-500/30 rounded-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-green-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Album Art */}
                    <img 
                        src={selectedTrack.albumArt} 
                        alt="Album Art" 
                        className="w-14 h-14 object-cover rounded-md shadow-md z-10"
                    />

                    {/* Track Info */}
                    <div className="flex-1 min-w-0 z-10">
                        <p className="text-white font-medium truncate text-sm">{selectedTrack.name}</p>
                        <p className="text-neutral-400 text-xs truncate">{selectedTrack.artists}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 z-10">
                        <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Tersimpan
                        </span>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-lg transition-colors text-xs"
                        >
                            Ganti
                        </button>
                    </div>
                </div>
            ) : value && !selectedTrack ? (
                // Fallback UI if we only have ID (e.g. on edit mount)
                <div className="flex items-center justify-between bg-neutral-900/60 p-4 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-3 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">Spotify Track Selected ({value})</span>
                    </div>
                    <button type="button" onClick={handleClear} className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-lg text-xs">Singkirkan</button>
                </div>
            ) : (
                /* Search View */
                <div className="space-y-4 relative z-20">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5 text-neutral-400" />
                            )}
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari lagu di Spotify..."
                            className="w-full bg-neutral-900/50 border border-neutral-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all placeholder:text-neutral-500"
                        />
                    </div>

                    {/* Results Dropdown / Inline list */}
                    {isSearching && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 max-h-[300px] overflow-y-auto space-y-1 shadow-2xl">
                            {results.length > 0 ? (
                                results.map((track) => (
                                    <button
                                        key={track.id}
                                        type="button"
                                        onClick={() => handleSelect(track)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-neutral-800 rounded-lg text-left transition-colors group"
                                    >
                                        {track.albumArt ? (
                                            <img src={track.albumArt} alt={track.name} className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 bg-neutral-800 rounded-md flex items-center justify-center flex-shrink-0">
                                                <Music2 className="w-5 h-5 text-neutral-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate group-hover:text-green-400 transition-colors">{track.name}</p>
                                            <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artists}</p>
                                        </div>
                                        {track.explicit && (
                                            <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700">E</span>
                                        )}
                                    </button>
                                ))
                            ) : !isLoading ? (
                                <div className="text-center py-6 text-neutral-500 text-sm">
                                    Pencarian tidak menemukan lagu
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
