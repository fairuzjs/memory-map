"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Flag, AlertTriangle, Eye, Trash2,
    ShieldAlert, CheckCircle2, Clock, XCircle, Search, Filter,
    LucideIcon
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: LucideIcon }> = {
    PENDING: {
        label: "Pending",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: Clock,
    },
    REVIEWED: {
        label: "Ditinjau",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: Eye,
    },
    RESOLVED: {
        label: "Selesai",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: CheckCircle2,
    },
    DISMISSED: {
        label: "Ditolak",
        color: "text-neutral-400",
        bg: "bg-neutral-500/10",
        border: "border-neutral-700",
        icon: XCircle,
    },
}

const STATUS_OPTIONS = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]

export default function AdminReportsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("ALL")
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
            return
        }
        if (status === "authenticated" && session.user.role === "ADMIN") {
            fetchReports()
        }
    }, [status, session, router])

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/admin/reports")
            if (!res.ok) throw new Error("Failed")
            const data = await res.json()
            setReports(data)
        } catch {
            toast.error("Gagal mengambil data laporan")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id)
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!res.ok) throw new Error("Failed")
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
            toast.success("Status laporan diperbarui")
        } catch {
            toast.error("Gagal mengupdate status")
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDeleteReport = async (id: string) => {
        if (!confirm("Hapus catatan laporan ini? (Memory tidak akan dihapus)")) return
        try {
            const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")
            setReports(prev => prev.filter(r => r.id !== id))
            toast.success("Catatan laporan dihapus")
        } catch {
            toast.error("Gagal menghapus laporan")
        }
    }

    const handleDeleteMemory = async (memoryId: string, title: string) => {
        if (!confirm(`Hapus memory "${title}" secara permanen?\n\nTindakan ini tidak dapat dibatalkan dan dilakukan karena pelanggaran berat.`)) return
        try {
            const res = await fetch(`/api/memories/${memoryId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")
            toast.success("Memory berhasil dihapus")
            fetchReports()
        } catch {
            toast.error("Gagal menghapus memory")
        }
    }

    const filtered = reports.filter(r => {
        const matchStatus = filterStatus === "ALL" || r.status === filterStatus
        const matchSearch =
            r.memory?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reporter?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchStatus && matchSearch
    })

    const counts = STATUS_OPTIONS.reduce((acc, s) => {
        acc[s] = reports.filter(r => r.status === s).length
        return acc
    }, {} as Record<string, number>)

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                    <p className="text-sm text-neutral-600">Memuat laporan...</p>
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
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center">
                            <ShieldAlert className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold tracking-widest text-neutral-600 uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-[Outfit] font-bold text-white tracking-tight">
                        Laporan Postingan
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Tinjau dan kelola laporan pelanggaran dari pengguna.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/[0.08] border border-rose-500/15 self-start sm:self-auto">
                    <Flag className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-medium text-rose-400">{reports.length} Total Laporan</span>
                </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STATUS_OPTIONS.map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    const Icon = cfg.icon
                    const isActive = filterStatus === s
                    return (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(isActive ? "ALL" : s)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                                isActive
                                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                                    : "bg-neutral-900/40 border-white/[0.05] text-neutral-500 hover:border-white/[0.1] hover:text-neutral-300"
                            }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <div>
                                <p className="text-lg font-bold leading-none">{counts[s] ?? 0}</p>
                                <p className="text-xs mt-0.5 opacity-70">{cfg.label}</p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan judul, pelapor, atau alasan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-neutral-900/60 border border-white/[0.06] rounded-xl text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500/30 focus:ring-1 focus:ring-rose-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-900/60 border border-white/[0.06] rounded-xl text-sm text-neutral-500">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs">{filtered.length} hasil</span>
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <div className="bg-neutral-900/40 border border-white/[0.05] rounded-2xl p-14 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 border border-white/[0.05] flex items-center justify-center mb-4">
                        <Flag className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-300 font-medium">Tidak ada laporan ditemukan</p>
                    <p className="text-neutral-600 text-sm mt-1">
                        {searchQuery || filterStatus !== "ALL" ? "Coba ubah filter pencarian." : "Belum ada laporan yang masuk."}
                    </p>
                    {(searchQuery || filterStatus !== "ALL") && (
                        <button
                            onClick={() => { setSearchQuery(""); setFilterStatus("ALL") }}
                            className="mt-4 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                        >
                            Reset filter
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/[0.05] bg-neutral-900/40">
                        <table className="w-full text-left text-sm text-neutral-300">
                            <thead className="border-b border-white/[0.05]">
                                <tr>
                                    {["Memory", "Pelapor", "Alasan", "Detail", "Status", "Aksi"].map(h => (
                                        <th key={h} className={`px-5 py-3.5 text-xs font-semibold tracking-wider text-neutral-600 uppercase ${h === "Aksi" ? "text-right" : ""}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filtered.map((report) => {
                                    const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING
                                    const StatusIcon = cfg.icon
                                    return (
                                        <tr key={report.id} className="hover:bg-white/[0.02] transition-colors group">
                                            {/* Memory */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 max-w-[200px]">
                                                    {report.memory?.photos?.[0]?.url ? (
                                                        <img src={report.memory.photos[0].url} alt="" className="w-9 h-9 rounded-lg object-cover bg-neutral-800 shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-white/[0.04] flex items-center justify-center shrink-0">
                                                            <Flag className="w-3.5 h-3.5 text-neutral-600" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        {report.memory ? (
                                                            <>
                                                                <Link
                                                                    href={`/memories/${report.memory.id}`}
                                                                    className="font-medium text-white truncate hover:text-rose-400 transition-colors block text-sm"
                                                                    title={report.memory.title}
                                                                >
                                                                    {report.memory.title}
                                                                </Link>
                                                                <p className="text-xs text-neutral-600 truncate">oleh {report.memory.user.name}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-neutral-500 italic">Memory telah dihapus</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Pelapor */}
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-neutral-200 text-sm">{report.reporter.name}</p>
                                                <p className="text-xs text-neutral-600 mt-0.5">
                                                    {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </td>

                                            {/* Alasan */}
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20`}>
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {report.reason}
                                                </span>
                                            </td>

                                            {/* Detail */}
                                            <td className="px-5 py-4">
                                                <p className="max-w-[160px] truncate text-sm text-neutral-400" title={report.details || "—"}>
                                                    {report.details || <span className="text-neutral-700">—</span>}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <div className="relative">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                                        disabled={updatingId === report.id}
                                                        className={`appearance-none pl-7 pr-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none transition-all ${cfg.bg} ${cfg.color} ${cfg.border} disabled:opacity-50`}
                                                    >
                                                        {STATUS_OPTIONS.map(s => (
                                                            <option key={s} value={s} className="bg-neutral-900 text-neutral-200">
                                                                {STATUS_CONFIG[s].label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <StatusIcon className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 ${cfg.color} pointer-events-none`} />
                                                </div>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {report.memory && (
                                                        <Link
                                                            href={`/memories/${report.memory.id}`}
                                                            className="p-2 rounded-lg text-neutral-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                                            title="Lihat Memory"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        className="p-2 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                                        title="Hapus Catatan Laporan"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    {report.memory && (
                                                        <button
                                                            onClick={() => handleDeleteMemory(report.memory.id, report.memory.title)}
                                                            className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                            title="Hapus Memory (Pelanggaran Berat)"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {filtered.map((report) => {
                            const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING
                            const StatusIcon = cfg.icon
                            return (
                                <div key={report.id} className="bg-neutral-900/50 border border-white/[0.05] rounded-2xl p-4 space-y-3">
                                    {/* Top row */}
                                    <div className="flex items-start gap-3">
                                        {report.memory?.photos?.[0]?.url ? (
                                            <img src={report.memory.photos[0].url} alt="" className="w-10 h-10 rounded-xl object-cover bg-neutral-800 shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-white/[0.04] flex items-center justify-center shrink-0">
                                                <Flag className="w-4 h-4 text-neutral-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {report.memory ? (
                                                <>
                                                    <Link href={`/memories/${report.memory.id}`} className="font-semibold text-white text-sm hover:text-rose-400 transition-colors line-clamp-1">
                                                        {report.memory.title}
                                                    </Link>
                                                    <p className="text-xs text-neutral-600 mt-0.5">oleh {report.memory.user.name}</p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-neutral-500 italic">Memory telah dihapus</p>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                            <AlertTriangle className="w-3 h-3" />
                                            {report.reason}
                                        </span>
                                        <span className="text-xs text-neutral-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    </div>

                                    {report.details && (
                                        <p className="text-xs text-neutral-500 line-clamp-2">{report.details}</p>
                                    )}

                                    {/* Actions row */}
                                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                                        <select
                                            value={report.status}
                                            onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                            disabled={updatingId === report.id}
                                            className={`appearance-none pl-2 pr-2 py-1.5 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none ${cfg.bg} ${cfg.color} ${cfg.border} disabled:opacity-50`}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s} className="bg-neutral-900 text-neutral-200">
                                                    {STATUS_CONFIG[s].label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-1">
                                            {report.memory && (
                                                <Link href={`/memories/${report.memory.id}`} className="p-2 rounded-lg text-neutral-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            )}
                                            <button onClick={() => handleDeleteReport(report.id)} className="p-2 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                            {report.memory && (
                                                <button onClick={() => handleDeleteMemory(report.memory.id, report.memory.title)} className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}