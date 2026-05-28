"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Flag, AlertTriangle, Eye, Trash2,
    ShieldAlert, CheckCircle2, Clock, XCircle, Search, Filter,
    LucideIcon, AlertCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"
import { captureError, captureAPIError, captureInteraction, capturePerformance } from "@/lib/monitoring"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: LucideIcon }> = {
    PENDING: {
        label: "Pending",
        color: "text-black",
        bg: "bg-yellow-300",
        border: "border-black",
        icon: Clock,
    },
    REVIEWED: {
        label: "Ditinjau",
        color: "text-black",
        bg: "bg-cyan-300",
        border: "border-black",
        icon: Eye,
    },
    RESOLVED: {
        label: "Selesai",
        color: "text-white",
        bg: "bg-black",
        border: "border-black",
        icon: CheckCircle2,
    },
    DISMISSED: {
        label: "Ditolak",
        color: "text-black",
        bg: "bg-neutral-300",
        border: "border-black",
        icon: XCircle,
    },
}

const STATUS_OPTIONS = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]

export default function AdminReportsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [reports, setReports] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("ALL")
    const [page, setPage] = useState(1)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const { confirmProps, openConfirm } = useConfirm()
    const [fetchError, setFetchError] = useState(false)

    const [stats, setStats] = useState<Record<string, number>>({
        PENDING: 0,
        REVIEWED: 0,
        RESOLVED: 0,
        DISMISSED: 0,
    })

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
            return
        }
    }, [status, session, router])

    const fetchReports = useCallback(async (q = "", p = 1, st = "ALL", signal?: AbortSignal) => {
        setLoading(true)
        setFetchError(false)
        const startTime = performance.now()
        try {
            const params = new URLSearchParams({
                page: String(p),
                limit: "15",
                search: q,
            })
            if (st !== "ALL") params.set("status", st)

            const res = await fetch(`/api/admin/reports?${params}`, { signal })
            if (res.ok) {
                const data = await res.json()
                setReports(data.reports ?? [])
                setTotal(data.total ?? 0)
                setStats({
                    PENDING: data.pendingCount ?? 0,
                    REVIEWED: data.reviewedCount ?? 0,
                    RESOLVED: data.resolvedCount ?? 0,
                    DISMISSED: data.dismissedCount ?? 0,
                })

                const latency = performance.now() - startTime
                if (latency > 1000) {
                    capturePerformance("admin_reports_fetch_slow", latency, { q, p, st })
                }
            } else {
                captureAPIError("/api/admin/reports", res.status, res.statusText, { q, p, st })
                setFetchError(true)
                toast.error("Gagal mengambil data laporan")
            }
        } catch (err: any) {
            if (err.name === "AbortError") return
            captureError(err, { context: "fetchReports", q, p, st })
            setFetchError(true)
            toast.error("Gagal mengambil data laporan")
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [])

    // Debounced search & filter controller
    useEffect(() => {
        if (status !== "authenticated" || session?.user?.role !== "ADMIN") return

        const controller = new AbortController()

        const runFetch = () => {
            fetchReports(searchQuery, page, filterStatus, controller.signal)
        }

        let debounceTimer: NodeJS.Timeout
        if (searchQuery) {
            debounceTimer = setTimeout(runFetch, 400)
        } else {
            runFetch()
        }

        return () => {
            controller.abort()
            if (debounceTimer) clearTimeout(debounceTimer)
        }
    }, [status, session, searchQuery, page, filterStatus, fetchReports])

    const handleSearchChange = (val: string) => {
        setSearchQuery(val)
        setPage(1)
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        captureInteraction("admin_report_update_status_start", { id, newStatus })
        setUpdatingId(id)

        const originalReports = [...reports]
        const originalStats = { ...stats }
        const originalStatus = reports.find(r => r.id === id)?.status

        // Optimistic UI updates
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))

        if (originalStatus && originalStatus !== newStatus) {
            setStats(prev => {
                const next = { ...prev }
                if (next[originalStatus] !== undefined) next[originalStatus] = Math.max(0, next[originalStatus] - 1)
                if (next[newStatus] !== undefined) next[newStatus] = next[newStatus] + 1
                return next
            })
        }

        toast.success("Memperbarui status...", { id: `report-${id}` })

        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!res.ok) {
                captureAPIError(`/api/admin/reports/${id}`, res.status, res.statusText, { newStatus })
                throw new Error("Failed update status")
            }
            toast.success("✅ Status laporan diperbarui", { id: `report-${id}` })
            captureInteraction("admin_report_update_status_success", { id, newStatus })
        } catch (err: any) {
            setReports(originalReports)
            setStats(originalStats)
            captureError(err, { context: "handleUpdateStatus_rollback", id, newStatus })
            captureInteraction("admin_rollback_event", { action: "admin_report_update_status", targetId: id, error: err.message })
            toast.error("Gagal memperbarui status. Dikembalikan ke awal.", { id: `report-${id}` })
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDeleteReport = async (id: string) => {
        openConfirm({
            title: "Hapus Catatan Laporan?",
            description: "Catatan laporan ini akan dihapus. Memory yang dilaporkan tidak akan terpengaruh.",
            confirmLabel: "Hapus Catatan",
            cancelLabel: "Batal",
            variant: "danger",
            onConfirm: async () => {
                captureInteraction("admin_report_delete_start", { id })
                setUpdatingId(id)

                const originalReports = [...reports]
                const originalStats = { ...stats }
                const targetReport = reports.find(r => r.id === id)

                // Optimistic UI updates
                setReports(prev => prev.filter(r => r.id !== id))
                if (targetReport && targetReport.status) {
                    setStats(prev => {
                        const next = { ...prev }
                        if (next[targetReport.status] !== undefined) {
                            next[targetReport.status] = Math.max(0, next[targetReport.status] - 1)
                        }
                        return next
                    })
                }

                toast.success("Menghapus catatan...", { id: `delete-report-${id}` })

                try {
                    const res = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" })
                    if (!res.ok) {
                        captureAPIError(`/api/admin/reports/${id}`, res.status, res.statusText)
                        throw new Error("Failed deleting report")
                    }
                    toast.success("✅ Catatan laporan berhasil dihapus", { id: `delete-report-${id}` })
                    fetchReports(searchQuery, page, filterStatus)
                    captureInteraction("admin_report_delete_success", { id })
                } catch (e: any) {
                    setReports(originalReports)
                    setStats(originalStats)
                    captureError(e, { context: "handleDeleteReport_rollback", id })
                    captureInteraction("admin_rollback_event", { action: "admin_report_delete", targetId: id, error: e.message })
                    toast.error("Gagal menghapus catatan laporan. Dikembalikan.", { id: `delete-report-${id}` })
                } finally {
                    setUpdatingId(null)
                }
            }
        })
    }

    const handleDeleteMemory = async (memoryId: string, title: string) => {
        openConfirm({
            title: "Hapus Memory Secara Permanen?",
            description: `Memory "${title}" akan dihapus karena pelanggaran berat. Tindakan ini tidak dapat dibatalkan.`,
            confirmLabel: "Ya, Hapus Permanen",
            cancelLabel: "Batal",
            variant: "danger",
            onConfirm: async () => {
                captureInteraction("admin_report_delete_memory_start", { memoryId, title })
                toast.success("Menghapus memory...", { id: `delete-mem-${memoryId}` })

                try {
                    const res = await fetch(`/api/memories/${memoryId}`, { method: "DELETE" })
                    if (!res.ok) {
                        captureAPIError(`/api/memories/${memoryId}`, res.status, res.statusText)
                        throw new Error("Failed deleting memory")
                    }
                    toast.success("✅ Memory berhasil dihapus secara permanen", { id: `delete-mem-${memoryId}` })
                    fetchReports(searchQuery, page, filterStatus)
                    captureInteraction("admin_report_delete_memory_success", { memoryId })
                } catch (e: any) {
                    captureError(e, { context: "handleDeleteMemory", memoryId })
                    toast.error("Gagal menghapus memory secara permanen.", { id: `delete-mem-${memoryId}` })
                }
            }
        })
    }

    const totalPages = Math.ceil(total / 15)
    const totalStatsCount = stats.PENDING + stats.REVIEWED + stats.RESOLVED + stats.DISMISSED

    // Neubrutalist Skeletons
    const TableRowSkeleton = () => (
        <tr className="animate-pulse border-b-[3px] border-black bg-white">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3 w-[200px]">
                    <div className="w-10 h-10 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-2/3" />
                        <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-1/2" />
                    </div>
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-2/3" />
                <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-1/3 mt-2" />
            </td>
            <td className="px-5 py-4">
                <div className="w-24 h-6 rounded-xl bg-neutral-200 border-[2px] border-black" />
            </td>
            <td className="px-5 py-4">
                <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-2/3" />
            </td>
            <td className="px-5 py-4">
                <div className="w-28 h-8 rounded-xl bg-neutral-200 border-[2px] border-black" />
            </td>
            <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                    <div className="w-9 h-9 rounded-xl bg-neutral-200 border-[2px] border-black" />
                    <div className="w-9 h-9 rounded-xl bg-neutral-200 border-[2px] border-black" />
                    <div className="w-9 h-9 rounded-xl bg-neutral-200 border-[2px] border-black" />
                </div>
            </td>
        </tr>
    )

    const MobileCardSkeleton = () => (
        <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-1/3" />
                    <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-1/2" />
                </div>
                <div className="w-20 h-5 rounded bg-neutral-200 border border-neutral-300 shrink-0" />
            </div>
            <div className="flex gap-2">
                <div className="w-24 h-6 rounded-xl bg-neutral-200 border-[2px] border-black" />
                <div className="w-24 h-6 rounded-xl bg-neutral-200 border-[2px] border-black" />
            </div>
        </div>
    )

    return (
        <>
        <div className="space-y-6 pb-10 font-[Outfit]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-rose-400 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <ShieldAlert className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-black uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight uppercase">
                        Laporan Postingan
                    </h1>
                    <p className="text-black font-bold text-sm mt-1">
                        Tinjau dan kelola laporan pelanggaran dari pengguna.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-[3px] border-black shadow-[4px_4px_0_#000] self-start sm:self-auto">
                    <Flag className="w-4 h-4 text-black" />
                    <span className="text-sm font-black text-black uppercase">{totalStatsCount} Total Laporan</span>
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
                            onClick={() => { setFilterStatus(isActive ? "ALL" : s); setPage(1); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[3px] text-left transition-all duration-200 ${
                                isActive
                                    ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-[3px_3px_0_#000] translate-x-[1px] translate-y-[1px]`
                                    : "bg-white border-black text-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-[1px]"
                            }`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-xl font-black leading-none">{stats[s] ?? 0}</p>
                                <p className="text-xs font-bold mt-0.5 uppercase tracking-wide">{cfg.label}</p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 font-bold" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan judul, pelapor, atau alasan..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-xl text-sm font-bold text-black placeholder:text-neutral-500 focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#000] transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-xl text-sm font-black text-black uppercase">
                    <Filter className="w-4 h-4" />
                    <span>{total} hasil</span>
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
                        <p className="text-xs font-bold text-neutral-600 mt-1">Gagal mengambil data laporan postingan</p>
                    </div>
                    <button
                        onClick={() => fetchReports(searchQuery, page, filterStatus)}
                        className="px-4 py-2 bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Content */}
            {!loading && reports.length === 0 && !fetchError && (
                <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_#000] rounded-2xl p-14 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-400 border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mb-4 rotate-3">
                        <Flag className="w-8 h-8 text-black" />
                    </div>
                    <p className="text-black font-black uppercase text-xl tracking-wide">Tidak ada laporan ditemukan</p>
                    <p className="text-black font-bold text-sm mt-1">
                        {searchQuery || filterStatus !== "ALL" ? "Coba ubah filter pencarian." : "Belum ada laporan yang masuk."}
                    </p>
                    {(searchQuery || filterStatus !== "ALL") && (
                        <button
                            onClick={() => { setSearchQuery(""); setFilterStatus("ALL"); setPage(1); }}
                            className="mt-4 text-xs font-black uppercase tracking-widest text-black bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] px-3 py-1.5 rounded-lg hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all"
                        >
                            Reset filter
                        </button>
                    )}
                </div>
            )}

            {(reports.length > 0 || loading) && !fetchError && (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto rounded-2xl border-[3px] border-black shadow-[8px_8px_0_#000] bg-white">
                        <table className="w-full text-left text-sm text-black">
                            <thead className="border-b-[3px] border-black bg-[#FFFDF0]">
                                <tr>
                                    {["Memory", "Pelapor", "Alasan", "Detail", "Status", "Aksi"].map(h => (
                                        <th key={h} className={`px-5 py-3.5 text-xs font-black tracking-wider text-black uppercase ${h === "Aksi" ? "text-right" : ""}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-[3px] divide-black">
                                {loading && (
                                    <>
                                        <TableRowSkeleton />
                                        <TableRowSkeleton />
                                        <TableRowSkeleton />
                                    </>
                                )}
                                
                                {!loading && reports.map((report) => {
                                    const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING
                                    const StatusIcon = cfg.icon
                                    const isRowUpdating = updatingId === report.id
                                    return (
                                        <tr key={report.id} className={`hover:bg-yellow-50 transition-colors group ${isRowUpdating ? "opacity-60" : ""}`}>
                                            {/* Memory */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 max-w-[200px]">
                                                    {report.memory?.photos?.[0]?.url ? (
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 relative">
                                                            <Image
                                                                src={report.memory.photos[0].url}
                                                                alt=""
                                                                width={40}
                                                                height={40}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-cyan-100 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                                                            <Flag className="w-4 h-4 text-black" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        {report.memory ? (
                                                            <>
                                                                <Link
                                                                    href={`/memories/${report.memory.id}`}
                                                                    className="font-black text-black truncate hover:underline underline-offset-2 transition-all block text-sm"
                                                                    title={report.memory.title}
                                                                >
                                                                    {report.memory.title}
                                                                </Link>
                                                                <p className="text-xs font-bold text-neutral-600 truncate">oleh {report.memory.user.name}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm font-bold text-neutral-500 italic">Memory telah dihapus</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Pelapor */}
                                            <td className="px-5 py-4">
                                                <p className="font-black text-black text-sm uppercase">{report.reporter.name}</p>
                                                <p className="text-xs font-bold text-neutral-600 mt-0.5">
                                                    {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </td>

                                            {/* Alasan */}
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black uppercase tracking-wide bg-rose-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000]`}>
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {report.reason}
                                                </span>
                                            </td>

                                            {/* Detail */}
                                            <td className="px-5 py-4">
                                                <p className="max-w-[160px] truncate text-sm font-bold text-black" title={report.details || "—"}>
                                                    {report.details || <span className="text-neutral-500">—</span>}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={report.status}
                                                        onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                                        disabled={isRowUpdating}
                                                        className={`appearance-none pl-8 pr-6 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border-[2px] cursor-pointer focus:outline-none transition-all shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] ${cfg.bg} ${cfg.color} ${cfg.border} disabled:opacity-50`}
                                                    >
                                                        {STATUS_OPTIONS.map(s => (
                                                            <option key={s} value={s} className="bg-white text-black font-bold">
                                                                {STATUS_CONFIG[s].label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <StatusIcon className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${cfg.color} pointer-events-none`} />
                                                </div>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {report.memory && (
                                                        <Link
                                                            href={`/memories/${report.memory.id}`}
                                                            className="p-2 rounded-xl bg-cyan-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all"
                                                            title="Lihat Memory"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        disabled={isRowUpdating}
                                                        className="p-2 rounded-xl bg-yellow-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all disabled:opacity-50"
                                                        title="Hapus Catatan Laporan"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                    {report.memory && (
                                                        <button
                                                            onClick={() => handleDeleteMemory(report.memory.id, report.memory.title)}
                                                            disabled={isRowUpdating}
                                                            className="p-2 rounded-xl bg-rose-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all disabled:opacity-50"
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
                    <div className="lg:hidden space-y-4">
                        {loading && (
                            <>
                                <MobileCardSkeleton />
                                <MobileCardSkeleton />
                            </>
                        )}
                        
                        {!loading && reports.map((report) => {
                            const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING
                            const StatusIcon = cfg.icon
                            const isCardUpdating = updatingId === report.id
                            return (
                                <div key={report.id} className={`bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 space-y-3 ${isCardUpdating ? "opacity-60" : ""}`}>
                                    {/* Top row */}
                                    <div className="flex items-start gap-3">
                                        {report.memory?.photos?.[0]?.url ? (
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 relative">
                                                <Image
                                                    src={report.memory.photos[0].url}
                                                    alt=""
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-cyan-100 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                                                <Flag className="w-4 h-4 text-black" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            {report.memory ? (
                                                <>
                                                    <Link href={`/memories/${report.memory.id}`} className="font-black text-black text-sm hover:underline underline-offset-2 transition-all line-clamp-1 uppercase">
                                                        {report.memory.title}
                                                    </Link>
                                                    <p className="text-xs font-bold text-neutral-600 mt-0.5">oleh {report.memory.user.name}</p>
                                                </>
                                            ) : (
                                                <p className="text-sm font-bold text-neutral-500 italic">Memory telah dihapus</p>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-black uppercase tracking-wider border-[2px] shrink-0 shadow-[2px_2px_0_#000] ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wide bg-rose-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            <AlertTriangle className="w-3 h-3" />
                                            {report.reason}
                                        </span>
                                        <span className="text-[11px] font-bold text-black flex items-center gap-1 bg-white border-[2px] border-black shadow-[2px_2px_0_#000] px-2.5 py-1 rounded-xl">
                                            <Clock className="w-3 h-3" />
                                            {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    </div>

                                    {report.details && (
                                        <p className="text-xs font-bold text-black bg-[#FFFDF0] p-2 rounded-xl border-[2px] border-black line-clamp-2">
                                            {report.details}
                                        </p>
                                    )}

                                    {/* Actions row */}
                                    <div className="flex items-center justify-between pt-2 border-t-[3px] border-black mt-2">
                                        <div className="relative">
                                            <select
                                                value={report.status}
                                                onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                                disabled={isCardUpdating}
                                                className={`appearance-none pl-7 pr-6 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border-[2px] cursor-pointer focus:outline-none shadow-[2px_2px_0_#000] ${cfg.bg} ${cfg.color} ${cfg.border} disabled:opacity-50`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s} className="bg-white text-black font-bold">
                                                        {STATUS_CONFIG[s].label}
                                                    </option>
                                                ))}
                                            </select>
                                            <StatusIcon className={`absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${cfg.color} pointer-events-none`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {report.memory && (
                                                <Link href={`/memories/${report.memory.id}`} className="p-2 rounded-xl bg-cyan-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            )}
                                            <button onClick={() => handleDeleteReport(report.id)} disabled={isCardUpdating} className="p-2 rounded-xl bg-yellow-300 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all disabled:opacity-50">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                            {report.memory && (
                                                <button onClick={() => handleDeleteMemory(report.memory.id, report.memory.title)} disabled={isCardUpdating} className="p-2 rounded-xl bg-rose-400 text-black border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] active:translate-y-[2px] transition-all disabled:opacity-50">
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

            {/* Pagination Controls */}
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
        <ConfirmDialog {...confirmProps} />
        </>
    )
}