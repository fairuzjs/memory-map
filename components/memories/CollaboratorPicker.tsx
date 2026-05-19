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
    maxCollaborators?: number
}

export function CollaboratorPicker({ value, onChange, maxCollaborators = 5 }: CollaboratorPickerProps) {
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

    // Fetch initial selected users if value is populated but selectedUsers is empty
    useEffect(() => {
        if (value.length > 0 && selectedUsers.length === 0) {
            Promise.all(value.map(id => fetch(`/api/users/${id}`).then(res => res.json())))
                .then(users => {
                    const validUsers = users.filter((u): u is User => !!u && !u.error);
                    setSelectedUsers(validUsers);
                })
                .catch(err => console.error("Failed to fetch initial collaborators:", err));
        }
    }, [value]);

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
        if (value.length >= maxCollaborators) return

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

    const isAtMax = value.length >= maxCollaborators

    return (
        <div className="space-y-4" ref={containerRef}>
            {/* Selected collaborators chips */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-2 bg-[#FFFF00] border-[3px] border-black text-black shadow-[3px_3px_0_#000] pl-1.5 pr-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all"
                        >
                            <img
                                src={avatarUrl(user)}
                                alt={user.name}
                                className="w-6 h-6 border-[2px] border-black object-cover bg-white"
                            />
                            <span className="max-w-[120px] truncate">{user.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(user.id)}
                                className="text-black/60 hover:text-black hover:scale-110 transition-all ml-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div className="relative">
                <div className="relative flex items-center">
                    <span className="absolute left-3 text-black pointer-events-none">
                        {loading
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <Search className="w-5 h-5" />
                        }
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => results.length > 0 && setIsOpen(true)}
                        placeholder={
                            isAtMax
                                ? `Maximum ${maxCollaborators} collaborators reached`
                                : "Cari nama atau email..."
                        }
                        disabled={isAtMax}
                        className="w-full bg-white border-[3px] border-black shadow-[4px_4px_0_#000] pl-11 pr-4 py-3.5 text-sm font-bold text-black placeholder-neutral-400 focus:outline-none focus:bg-[#00FFFF] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[6px_6px_0_#000] disabled:opacity-50 disabled:bg-neutral-200 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                {/* Dropdown results */}
                {isOpen && results.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-[#FFFDF0] border-[4px] border-black shadow-[6px_6px_0_#000] overflow-hidden">
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {results.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleSelect(user)}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#00FFFF] border-b-[3px] border-black last:border-b-0 transition-all text-left group"
                                >
                                    <img
                                        src={avatarUrl(user)}
                                        alt={user.name}
                                        className="w-9 h-9 border-[2px] border-black object-cover bg-white shrink-0 group-hover:shadow-[2px_2px_0_#000] transition-all"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-black uppercase tracking-wide truncate group-hover:translate-x-1 transition-transform">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-black/70 font-bold truncate group-hover:translate-x-1 transition-transform">{user.email}</p>
                                    </div>
                                    <UserCheck className="w-5 h-5 text-black opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* No results state */}
                {isOpen && !loading && results.length === 0 && query.length >= 2 && (
                    <div className="absolute z-50 mt-2 w-full bg-white border-[4px] border-black shadow-[6px_6px_0_#000] p-6 text-center">
                        <Users className="w-10 h-10 text-black mx-auto mb-3" />
                        <p className="text-sm font-black text-black uppercase tracking-wider">Pencarian "{query}" tidak ditemukan</p>
                    </div>
                )}
            </div>

            {/* Counter */}
            <p className="text-[11px] font-black text-black/70 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <Users className="w-4 h-4 text-black" />
                {value.length} / {maxCollaborators} Collaborator Diundang
                {isAtMax && <span className="text-[#FF00FF] font-black bg-black px-1.5 py-0.5 ml-1">· MAKSIMUM</span>}
            </p>
        </div>
    )
}
