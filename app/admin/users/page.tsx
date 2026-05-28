"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Search, BadgeCheck, XCircle, Users, Filter, AlertCircle
} from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"
import { captureError, captureAPIError, captureInteraction, capturePerformance } from "@/lib/monitoring"

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
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [roleFilter, setRoleFilter] = useState("ALL")
    const [verifiedFilter, setVerifiedFilter] = useState("ALL")
    const [toggling, setToggling] = useState<string | null>(null)
    const [fetchError, setFetchError] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        }
    }, [status, session, router])

    const fetchUsers = useCallback(async (q = "", p = 1, r = "ALL", v = "ALL", signal?: AbortSignal) => {
        setLoading(true)
        setFetchError(false)
        const startTime = performance.now()
        try {
            const params = new URLSearchParams({
                page: String(p),
                limit: "15",
                search: q,
            })
            if (r !== "ALL") params.set("role", r)
            if (v !== "ALL") params.set("isVerified", v)

            const res = await fetch(`/api/admin/users?${params}`, { signal })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users ?? [])
                setTotal(data.total ?? 0)
                
                const latency = performance.now() - startTime
                if (latency > 1000) {
                    capturePerformance("admin_users_fetch_slow", latency, { q, p, r, v })
                }
            } else {
                captureAPIError(`/api/admin/users`, res.status, res.statusText, { q, p, r, v })
                setFetchError(true)
                toast.error("Gagal memuat data pengguna")
            }
        } catch (err: any) {
            if (err.name === "AbortError") {
                return
            }
            captureError(err, { context: "fetchUsers", q, p, r, v })
            setFetchError(true)
            toast.error("Gagal memuat data pengguna")
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [])

    // Combined stable search + filter effect using AbortController
    useEffect(() => {
        if (status !== "authenticated" || session?.user?.role !== "ADMIN") return

        const controller = new AbortController()

        const runFetch = () => {
            fetchUsers(search, page, roleFilter, verifiedFilter, controller.signal)
        }

        let debounceTimer: NodeJS.Timeout
        if (search) {
            debounceTimer = setTimeout(runFetch, 400)
        } else {
            runFetch()
        }

        return () => {
            controller.abort()
            if (debounceTimer) clearTimeout(debounceTimer)
        }
    }, [status, session, search, page, roleFilter, verifiedFilter, fetchUsers])

    const toggleVerified = async (userId: string, current: boolean) => {
        captureInteraction("admin_toggle_verify_user_start", { userId, toStatus: !current })
        setToggling(userId)
        
        const originalUsers = [...users]
        const targetStatus = !current
        
        // Optimistic UI update
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: targetStatus } : u))
        toast.success(targetStatus ? "Mengaktifkan verifikasi..." : "Mencabut verifikasi...", { id: `verify-${userId}` })

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVerified: targetStatus }),
            })
            if (!res.ok) {
                captureAPIError(`/api/admin/users/${userId}`, res.status, res.statusText, { userId, isVerified: targetStatus })
                throw new Error("Failed verification patching")
            }
            const updated = await res.json()
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: updated.isVerified } : u))
            toast.success(updated.isVerified ? "✅ Verified badge diberikan!" : "❌ Verified badge dicabut", { id: `verify-${userId}` })
            captureInteraction("admin_toggle_verify_user_success", { userId, isVerified: updated.isVerified })
        } catch (err: any) {
            // Rollback
            setUsers(originalUsers)
            captureError(err, { context: "toggleVerified_rollback", userId, originalStatus: current })
            captureInteraction("admin_rollback_event", { action: "admin_toggle_verify_user", targetId: userId, error: err.message })
            toast.error("Gagal mengubah status verified. Dikembalikan ke kondisi semula.", { id: `verify-${userId}` })
        } finally {
            setToggling(null)
        }
    }

    const handleSearchChange = (val: string) => {
        setSearch(val)
        setPage(1)
    }

    const totalPages = Math.ceil(total / 15)

    // Neubrutalist Shimmer Skeletons
    const UserRowSkeleton = () => (
        <div className="flex items-center gap-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl px-5 py-4 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-1/3" />
                <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-1/2" />
            </div>
            <div className="w-36 h-10 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
        </div>
    )

    return (
        <div className="space-y-6 pb-10 font-[Outfit]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-cyan-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <BadgeCheck className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-black uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight uppercase">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-black font-bold text-sm mt-1">
                        Kelola verified badge untuk pengguna terpilih
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000] self-start sm:self-auto">
                    <Users className="w-4 h-4 text-black font-black" />
                    <span className="text-sm font-black text-black uppercase tracking-wide">{total} pengguna</span>
                </div>
            </div>

            {/* Controls: Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black font-black" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        placeholder="CARI NAMA, EMAIL, ATAU USERNAME..."
                        className="w-full bg-white border-[3px] border-black rounded-2xl pl-12 pr-4 py-3.5 text-sm font-black text-black placeholder-neutral-500 focus:outline-none transition-all shadow-[4px_4px_0_#000] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0_#000]"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    {/* Role Filter */}
                    <div className="relative inline-block">
                        <select
                            value={roleFilter}
                            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                            className="appearance-none pl-4 pr-10 py-3.5 bg-white border-[3px] border-black rounded-2xl text-xs font-black uppercase tracking-wide cursor-pointer focus:outline-none transition-all shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#000] min-w-[140px]"
                        >
                            <option value="ALL">Semua Peran</option>
                            <option value="ADMIN">Admin</option>
                            <option value="USER">User</option>
                        </select>
                        <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black pointer-events-none" />
                    </div>

                    {/* Verified Filter */}
                    <div className="relative inline-block">
                        <select
                            value={verifiedFilter}
                            onChange={e => { setVerifiedFilter(e.target.value); setPage(1) }}
                            className="appearance-none pl-4 pr-10 py-3.5 bg-white border-[3px] border-black rounded-2xl text-xs font-black uppercase tracking-wide cursor-pointer focus:outline-none transition-all shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#000] min-w-[160px]"
                        >
                            <option value="ALL">Semua Verifikasi</option>
                            <option value="true">Verified Only</option>
                            <option value="false">Unverified Only</option>
                        </select>
                        <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Error Retry State */}
            {fetchError && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0_#000] space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-black flex items-center justify-center text-rose-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-base font-black text-black uppercase">Koneksi Bermasalah</p>
                        <p className="text-xs font-bold text-neutral-600 mt-1">Gagal mengambil data dari server admin</p>
                    </div>
                    <button
                        onClick={() => fetchUsers(search, page, roleFilter, verifiedFilter)}
                        className="px-4 py-2 bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* User List */}
            <div className="space-y-4">
                {loading && (
                    <>
                        <UserRowSkeleton />
                        <UserRowSkeleton />
                        <UserRowSkeleton />
                        <UserRowSkeleton />
                        <UserRowSkeleton />
                    </>
                )}

                {!loading && users.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl px-5 py-4 hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-[1px] transition-all"
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-violet-100 overflow-hidden border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 relative">
                            <Image
                                src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                alt={user.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-base font-black text-black uppercase truncate">
                                    {user.username ? `@${user.username}` : user.name}
                                </span>
                                {user.isVerified && (
                                    <BadgeCheck className="w-5 h-5 text-sky-500 shrink-0 fill-current" />
                                )}
                                {user.role === "ADMIN" && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-rose-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0">
                                        ADMIN
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold text-neutral-600 truncate mt-0.5">
                                {user.email}
                                {user.username && <span className="text-neutral-600"> · {user.name}</span>}
                            </p>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => toggleVerified(user.id, user.isVerified)}
                            disabled={toggling === user.id}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all shrink-0 border-[3px] border-black shadow-[3px_3px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[1px_1px_0_#000] ${
                                user.isVerified
                                    ? "bg-rose-400 text-black"
                                    : "bg-green-300 text-black"
                            } disabled:opacity-50 disabled:cursor-not-allowed w-36`}
                        >
                            {toggling === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.isVerified ? (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    Cabut Verified
                                </>
                            ) : (
                                <>
                                    <BadgeCheck className="w-4 h-4" />
                                    Beri Verified
                                </>
                            )}
                        </button>
                    </div>
                ))}

                {!loading && users.length === 0 && !fetchError && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white border-[3px] border-black rounded-2xl shadow-[8px_8px_0_#000]">
                        <div className="w-16 h-16 bg-yellow-300 border-[3px] border-black rounded-2xl shadow-[4px_4px_0_#000] flex items-center justify-center mb-4 rotate-3">
                            <Users className="w-8 h-8 text-black" />
                        </div>
                        <p className="text-xl font-black text-black uppercase tracking-wide">Tidak ada pengguna ditemukan</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-[1px_1px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        ← Sebelumnya
                    </button>
                    <span className="text-sm font-black text-black bg-yellow-300 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0_#000]">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-[1px_1px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Berikutnya →
                    </button>
                </div>
            )}
        </div>
    )
}

