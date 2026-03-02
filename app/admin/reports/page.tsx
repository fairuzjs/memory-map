"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Flag, AlertTriangle, Eye, Trash2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function AdminReportsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })
            if (!res.ok) throw new Error("Failed")

            setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
            toast.success("Status laporan diperbarui")
        } catch {
            toast.error("Gagal mengupdate status")
        }
    }

    const handleDeleteReport = async (id: string) => {
        if (!confirm("Hapus laporan ini dari catatan? (Memory tidak akan dihapus)")) return
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
        if (!confirm(`Hapus memory: "${title}"?\nTindakan ini dapat dilakukan karena pelanggaran berat.`)) return
        try {
            const res = await fetch(`/api/memories/${memoryId}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")

            toast.success("Memory berhasil dihapus")
            // Remove all reports associated with the memory or just refresh
            fetchReports()
        } catch {
            toast.error("Gagal menghapus memory")
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-[Outfit] font-bold text-white tracking-tight flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-rose-500" />
                    Laporan Postingan
                </h1>
                <p className="text-neutral-400 mt-2">Daftar laporan pelanggaran pada postingan memory.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-800 shadow-xl bg-neutral-900/50 backdrop-blur-xl">
                {reports.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <span className="text-neutral-500 mb-2">(Tidak ada data)</span>
                        <p className="text-neutral-400">Belum ada laporan yang masuk.</p>
                    </div>
                ) : (
                    <table className="w-full whitespace-nowrap text-left text-sm text-neutral-300">
                        <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Memory</th>
                                <th className="px-6 py-4 font-medium">Pelapor</th>
                                <th className="px-6 py-4 font-medium">Alasan</th>
                                <th className="px-6 py-4 font-medium">Detail</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-neutral-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 max-w-[200px]">
                                            {report.memory?.photos?.[0]?.url ? (
                                                <img src={report.memory.photos[0].url} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-800" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                                                    <Flag className="w-4 h-4 text-neutral-500" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/memories/${report.memory.id}`} className="font-medium text-white truncate hover:underline hover:text-indigo-400 block" title={report.memory.title}>
                                                    {report.memory.title}
                                                </Link>
                                                <p className="text-xs text-neutral-500 truncate">oleh {report.memory.user.name}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <p className="font-medium">{report.reporter.name}</p>
                                        <p className="text-xs text-neutral-500">{new Date(report.createdAt).toLocaleDateString('id-ID')}</p>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500 border border-rose-500/20">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            {report.reason}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <p className="max-w-[150px] truncate" title={report.details || "-"}>
                                            {report.details || "-"}
                                        </p>
                                    </td>

                                    <td className="px-6 py-4">
                                        <select
                                            value={report.status}
                                            onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                            className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="REVIEWED">REVIEWED</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                            <option value="DISMISSED">DISMISSED</option>
                                        </select>
                                    </td>

                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Link
                                            href={`/memories/${report.memory.id}`}
                                            className="inline-flex items-center justify-center p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                            title="Lihat Memory"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteMemory(report.memory.id, report.memory.title)}
                                            className="inline-flex items-center justify-center p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                            title="Hapus Memory"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
