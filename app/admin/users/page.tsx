"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Search, BadgeCheck, Shield, CheckCircle2, XCircle, Users
} from "lucide-react"
import toast from "react-hot-toast"

interface UserRow {
    id: string
    name: string
    email: string
    username: string | null
    image: string | null
    isVerified: boolean
    role: string
    createdAt: string
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<UserRow[]>([])
    const [search, setSearch] = useState("")
    const [toggling, setToggling] = useState<string | null>(null)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        } else if (status === "authenticated" && session.user.role === "ADMIN") {
            fetchUsers()
        }
    }, [status, session, router])

    const fetchUsers = async (q = "") => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`)
            if (res.ok) setUsers(await res.json())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    const toggleVerified = async (userId: string, current: boolean) => {
        setToggling(userId)
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVerified: !current }),
            })
            if (!res.ok) throw new Error()
            const updated = await res.json()
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: updated.isVerified } : u))
            toast.success(updated.isVerified ? "✅ Verified badge diberikan!" : "❌ Verified badge dicabut")
        } catch {
            toast.error("Gagal mengubah status verified")
        } finally {
            setToggling(null)
        }
    }

    if (loading && users.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                    <p className="text-sm text-neutral-600">Memuat data pengguna...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                            <BadgeCheck className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold tracking-widest text-neutral-600 uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-[Outfit] font-bold text-white tracking-tight">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Kelola verified badge untuk pengguna terpilih
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/[0.08] border border-sky-500/15 self-start sm:self-auto">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-medium text-sky-400">{users.length} pengguna</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari nama, email, atau username..."
                    className="w-full bg-neutral-900/60 border border-white/[0.07] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
                />
            </div>

            {/* User List */}
            <div className="space-y-2">
                {users.map(user => (
                    <div
                        key={user.id}
                        className="flex items-center gap-4 bg-neutral-900/50 border border-white/[0.06] rounded-2xl px-5 py-4 hover:border-white/10 transition-all"
                    >
                        {/* Avatar */}
                        <img
                            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white text-sm truncate">
                                    {user.username ? `@${user.username}` : user.name}
                                </span>
                                {user.isVerified && (
                                    <BadgeCheck className="w-4 h-4 text-sky-400 shrink-0" />
                                )}
                                {user.role === "ADMIN" && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shrink-0">
                                        ADMIN
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-neutral-600 truncate mt-0.5">
                                {user.email}
                                {user.username && <span className="text-neutral-700"> · {user.name}</span>}
                            </p>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => toggleVerified(user.id, user.isVerified)}
                            disabled={toggling === user.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                user.isVerified
                                    ? "bg-sky-500/10 border border-sky-500/25 text-sky-400 hover:bg-rose-500/10 hover:border-rose-500/25 hover:text-rose-400"
                                    : "bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:bg-sky-500/10 hover:border-sky-500/25 hover:text-sky-400"
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            {toggling === user.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : user.isVerified ? (
                                <>
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Verified
                                </>
                            ) : (
                                <>
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Beri Verified
                                </>
                            )}
                        </button>
                    </div>
                ))}

                {!loading && users.length === 0 && (
                    <div className="text-center py-16 text-neutral-600">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Tidak ada pengguna ditemukan</p>
                    </div>
                )}
            </div>
        </div>
    )
}
