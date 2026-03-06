"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Users, Loader2, UserCheck } from "lucide-react"

interface User {
    id: string
    name: string
    image: string | null
    email: string
}

interface CollaboratorPickerProps {
    value: string[]                        // array of selected user IDs
    onChange: (ids: string[]) => void
}

const MAX_COLLABORATORS = 5

export function CollaboratorPicker({ value, onChange }: CollaboratorPickerProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Tutup dropdown ketika klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounce search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!query.trim() || query.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    // Filter keluar user yang sudah dipilih
                    setResults(data.filter((u: User) => !value.includes(u.id)))
                    setIsOpen(true)
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query, value])

    const handleSelect = (user: User) => {
        if (value.includes(user.id)) return
        if (value.length >= MAX_COLLABORATORS) return

        const newIds = [...value, user.id]
        const newUsers = [...selectedUsers, user]
        onChange(newIds)
        setSelectedUsers(newUsers)
        setQuery("")
        setResults([])
        setIsOpen(false)
    }

    const handleRemove = (userId: string) => {
        const newIds = value.filter(id => id !== userId)
        const newUsers = selectedUsers.filter(u => u.id !== userId)
        onChange(newIds)
        setSelectedUsers(newUsers)
    }

    const avatarUrl = (user: User) =>
        user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`

    const isAtMax = value.length >= MAX_COLLABORATORS

    return (
        <div className="space-y-3" ref={containerRef}>
            {/* Selected collaborators chips */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full pl-1 pr-3 py-1 text-sm font-medium transition-all"
                        >
                            <img
                                src={avatarUrl(user)}
                                alt={user.name}
                                className="w-6 h-6 rounded-full border border-indigo-500/40 object-cover bg-neutral-800"
                            />
                            <span className="max-w-[120px] truncate">{user.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(user.id)}
                                className="text-indigo-400 hover:text-rose-400 transition-colors ml-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div className="relative">
                <div className="relative flex items-center">
                    <span className="absolute left-3 text-neutral-500 pointer-events-none">
                        {loading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Search className="w-4 h-4" />
                        }
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => results.length > 0 && setIsOpen(true)}
                        placeholder={
                            isAtMax
                                ? `Maximum ${MAX_COLLABORATORS} collaborators reached`
                                : "Search by name or email..."
                        }
                        disabled={isAtMax}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                {/* Dropdown results */}
                {isOpen && results.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-[#13131e] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelect(user)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-500/10 transition-all text-left group"
                                >
                                    <img
                                        src={avatarUrl(user)}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full border border-neutral-700 group-hover:border-indigo-500/50 object-cover bg-neutral-800 shrink-0 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-neutral-200 truncate group-hover:text-indigo-300 transition-colors">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                                    </div>
                                    <UserCheck className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* No results state */}
                {isOpen && !loading && results.length === 0 && query.length >= 2 && (
                    <div className="absolute z-50 mt-2 w-full bg-[#13131e] border border-neutral-800 rounded-2xl shadow-2xl p-5 text-center">
                        <Users className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">No users found for "{query}"</p>
                    </div>
                )}
            </div>

            {/* Counter */}
            <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {value.length} / {MAX_COLLABORATORS} collaborators invited
                {isAtMax && <span className="text-amber-400 font-medium">· Maximum reached</span>}
            </p>
        </div>
    )
}
