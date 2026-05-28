"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, MessageSquare, Flag, ChevronRight,
    Clock, CheckCircle2, AlertCircle, Shield, Coins, Zap, Crown, Users, Award, History
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"
import { timeAgo } from "@/lib/utils"
import { captureError, captureAPIError, captureInteraction, capturePerformance } from "@/lib/monitoring"

interface DashboardStats {
    totalUsers: number
    newUsersToday: number
    newUsersThisWeek: number
    pendingFeedback: number
    pendingReports: number
    pendingTopup: number
    pendingPremium: number
}

interface AuditLog {
    id: string
    adminId: string
    action: string
    targetType: string
    targetId: string | null
    metadata: string | null
    createdAt: string
    admin: {
        name: string
        email: string
        image: string | null
    }
}

interface QuickActionItem {
    id: string
    type: "TOPUP" | "PREMIUM" | "REPORT" | "FEEDBACK"
    title: string
    description: string
    createdAt: string
    href: string
}

function formatAction(action: string) {
    switch (action) {
        case "GRANT_VERIFICATION": return "memberikan verified badge"
        case "REVOKE_VERIFICATION": return "mencabut verified badge"
        case "REPLY_FEEDBACK": return "membalas tiket feedback"
        case "UPDATE_FEEDBACK_STATUS": return "memperbarui status feedback"
        case "DELETE_FEEDBACK": return "menghapus tiket feedback"
        case "UPDATE_REPORT_STATUS": return "memproses laporan postingan"
        case "DELETE_REPORT": return "menghapus catatan laporan"
        case "DIRECT_TOPUP": return "menambahkan poin langsung (direct)"
        case "APPROVE_TOPUP": return "menyetujui pesanan topup"
        case "REJECT_TOPUP": return "menolak pesanan topup"
        case "APPROVE_PREMIUM": return "mengaktifkan langganan premium"
        case "REJECT_PREMIUM": return "menolak pesanan premium"
        default: return action.toLowerCase().replace(/_/g, " ")
    }
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
    const [actionQueue, setActionQueue] = useState<QuickActionItem[]>([])
    const [fetchError, setFetchError] = useState(false)

    const fetchStats = async (bypass = false, signal?: AbortSignal) => {
        setLoading(true)
        setFetchError(false)
        const startTime = performance.now()
        try {
            const url = bypass ? "/api/admin/stats?bypassCache=true" : "/api/admin/stats"
            const res = await fetch(url, { signal })
            if (res.ok) {
                const data = await res.json()
                
                // Show graceful fallback toast warning if database pool is busy/unreachable
                if (data.isFallback) {
                    toast.error("Menggunakan data cadangan karena koneksi database sibuk", { id: "stats-fallback" })
                }

                setStats(data.stats)
                setRecentLogs(data.recentActivity ?? [])
                setActionQueue(data.quickActionsQueue ?? [])
                
                const latency = performance.now() - startTime
                capturePerformance("admin_dashboard_stats_load", latency)
            } else {
                captureAPIError("/api/admin/stats", res.status, res.statusText)
                setFetchError(true)
                toast.error("Gagal memuat ringkasan data dasbor")
            }
        } catch (err: any) {
            if (err.name === "AbortError") return
            captureError(err, { context: "fetchStats" })
            setFetchError(true)
            toast.error("Gagal memuat ringkasan data dasbor")
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        } else if (status === "authenticated" && session.user.role === "ADMIN") {
            const controller = new AbortController()
            fetchStats(false, controller.signal)
            captureInteraction("admin_dashboard_landing_visit")

            return () => {
                controller.abort()
            }
        }
    }, [status, session, router])

    // Neubrutalist Loading Dashboard Skeleton
    const DashboardSkeleton = () => (
        <div className="space-y-8 font-[Outfit] pb-10 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-24" />
                    <div className="h-8 bg-neutral-200 rounded border border-neutral-300 w-64" />
                    <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-44" />
                </div>
                <div className="w-28 h-10 rounded-xl bg-neutral-200 border-[3px] border-black shadow-[4px_4px_0_#000]" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="h-5 bg-neutral-200 rounded border border-neutral-300 w-12" />
                            <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-16" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 border-[3px] border-black bg-white shadow-[6px_6px_0_#000] rounded-2xl p-5 h-[400px] flex flex-col space-y-4">
                    <div className="w-48 h-5 bg-neutral-200 rounded border border-neutral-300" />
                    <div className="flex-1 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-neutral-100 rounded-xl border-2 border-neutral-200" />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 border-[3px] border-black bg-white shadow-[6px_6px_0_#000] rounded-2xl p-5 h-[400px] flex flex-col space-y-4">
                    <div className="w-48 h-5 bg-neutral-200 rounded border border-neutral-300" />
                    <div className="flex-1 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-neutral-100 rounded-xl border-2 border-neutral-200" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    if (loading || !stats) {
        return <DashboardSkeleton />
    }

    const quickActions = [
        {
            title: "Saran & Kritik",
            description: "Pantau dan kelola masukan dari pengguna aplikasi",
            href: "/admin/feedbacks",
            icon: MessageSquare,
            accentColor: "indigo",
            pendingCount: stats.pendingFeedback,
        },
        {
            title: "Laporan Postingan",
            description: "Tinjau memory yang dilaporkan oleh pengguna",
            href: "/admin/reports",
            icon: Flag,
            accentColor: "rose",
            pendingCount: stats.pendingReports,
        },
        {
            title: "Pesanan Topup",
            description: "Kelola dan verifikasi pesanan topup poin dari pengguna",
            href: "/admin/topup",
            icon: Coins,
            accentColor: "amber",
            pendingCount: stats.pendingTopup,
        },
        {
            title: "Proses Topup",
            description: "Tambah poin langsung ke akun user berdasarkan email atau username",
            href: "/admin/topup/process",
            icon: Zap,
            accentColor: "amber",
            pendingCount: 0,
        },
        {
            title: "Pesanan Premium",
            description: "Verifikasi dan kelola pesanan langganan premium dari pengguna",
            href: "/admin/premium",
            icon: Crown,
            accentColor: "violet",
            pendingCount: stats.pendingPremium,
        },
    ]

    const colorMap: Record<string, {
        bg: string, border: string, iconBg: string, iconText: string,
        hover: string, shadow: string
    }> = {
        indigo: {
            bg: "bg-cyan-300",
            border: "border-black",
            iconBg: "bg-white",
            iconText: "text-black",
            hover: "hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-[2px]",
            shadow: "shadow-[5px_5px_0_#000]"
        },
        rose: {
            bg: "bg-rose-400",
            border: "border-black",
            iconBg: "bg-white",
            iconText: "text-black",
            hover: "hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-[2px]",
            shadow: "shadow-[5px_5px_0_#000]"
        },
        amber: {
            bg: "bg-yellow-300",
            border: "border-black",
            iconBg: "bg-white",
            iconText: "text-black",
            hover: "hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-[2px]",
            shadow: "shadow-[5px_5px_0_#000]"
        },
        violet: {
            bg: "bg-fuchsia-400",
            border: "border-black",
            iconBg: "bg-white",
            iconText: "text-black",
            hover: "hover:-translate-y-1 hover:shadow-[8px_8px_0_#000] active:translate-y-[2px]",
            shadow: "shadow-[5px_5px_0_#000]"
        },
    }

    return (
        <div className="space-y-8 font-[Outfit] pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md bg-cyan-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="text-xs font-black tracking-widest text-black uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight uppercase">
                        ADMIN CONTROL CENTER
                    </h1>
                    <p className="text-neutral-700 font-bold text-sm mt-1">
                        Selamat datang kembali,{" "}
                        <span className="text-black font-black">{session?.user?.name ?? "Admin"}</span>
                    </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-300 border-[3px] border-black shadow-[4px_4px_0_#000] self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                    <span className="text-xs font-black text-black uppercase tracking-wide">Sistem Aktif</span>
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
                        <p className="text-xs font-bold text-neutral-600 mt-1">Gagal memuat ringkasan data dasbor</p>
                    </div>
                    <button
                        onClick={() => fetchStats(true)}
                        className="px-4 py-2 bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Metrik Utama Dasbor */}
            {!fetchError && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Users */}
                    <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-[Outfit] font-black leading-none">{stats.totalUsers.toLocaleString("id-ID")}</p>
                            <p className="text-[10px] font-black uppercase text-neutral-600 mt-1">Total Users</p>
                        </div>
                    </div>

                    {/* New Users Today */}
                    <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-[Outfit] font-black leading-none">+{stats.newUsersToday}</p>
                            <p className="text-[10px] font-black uppercase text-neutral-600 mt-1">User Baru Hari Ini</p>
                        </div>
                    </div>

                    {/* Pending Orders */}
                    <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-fuchsia-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                            <Coins className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-[Outfit] font-black leading-none">{stats.pendingTopup + stats.pendingPremium}</p>
                            <p className="text-[10px] font-black uppercase text-neutral-600 mt-1">Order Pending</p>
                        </div>
                    </div>

                    {/* Pending Moderations */}
                    <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-400 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                            <Flag className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-[Outfit] font-black leading-none">{stats.pendingFeedback + stats.pendingReports}</p>
                            <p className="text-[10px] font-black uppercase text-neutral-600 mt-1">Tiket Moderasi</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Antrean & Riwayat Panel */}
            {!fetchError && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Quick Action Queue (3/5 width) */}
                    <div className="lg:col-span-3 border-[3px] border-black bg-white shadow-[6px_6px_0_#000] rounded-2xl p-5 flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                            <div className="w-6 h-6 rounded-md bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                                <Clock className="w-3.5 h-3.5 text-black font-black" />
                            </div>
                            <h2 className="text-base font-black text-black uppercase tracking-wide">Antrean Tindakan Cepat (Pending)</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                            {actionQueue.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                                    <p className="text-sm font-black text-black uppercase">SEMUA BERES!</p>
                                    <p className="text-xs font-bold text-neutral-600 mt-1">Tidak ada tugas tertunda yang membutuhkan tindakan Anda.</p>
                                </div>
                            ) : (
                                actionQueue.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className="flex items-center gap-3 p-3 bg-[#FFFDF0] hover:bg-yellow-100 transition-colors border-[2px] border-black shadow-[3px_3px_0_#000] rounded-xl group active:translate-y-[2px]"
                                    >
                                        <div className={`w-8 h-8 rounded-lg border-[2px] border-black flex items-center justify-center shrink-0 ${
                                            item.type === "TOPUP" ? "bg-yellow-300" :
                                            item.type === "PREMIUM" ? "bg-fuchsia-300" :
                                            item.type === "REPORT" ? "bg-rose-400" : "bg-cyan-300"
                                        }`}>
                                            {item.type === "TOPUP" && <Coins className="w-4 h-4 text-black" />}
                                            {item.type === "PREMIUM" && <Crown className="w-4 h-4 text-black" />}
                                            {item.type === "REPORT" && <Flag className="w-4 h-4 text-black" />}
                                            {item.type === "FEEDBACK" && <MessageSquare className="w-4 h-4 text-black" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-black uppercase truncate group-hover:underline underline-offset-2">{item.title}</p>
                                            <p className="text-[10px] font-bold text-neutral-600 truncate mt-0.5">{item.description}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-black bg-white px-2 py-0.5 rounded border border-black shrink-0">
                                            {timeAgo(item.createdAt)}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Activities / Audit Logs (2/5 width) */}
                    <div className="lg:col-span-2 border-[3px] border-black bg-white shadow-[6px_6px_0_#000] rounded-2xl p-5 flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                            <div className="w-6 h-6 rounded-md bg-cyan-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                                <History className="w-3.5 h-3.5 text-black font-black" />
                            </div>
                            <h2 className="text-base font-black text-black uppercase tracking-wide">Aktivitas Terbaru Admin</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                            {recentLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <History className="w-10 h-10 text-neutral-400 mb-2 animate-pulse" />
                                    <p className="text-xs font-bold text-neutral-500 uppercase">Belum ada riwayat aktivitas.</p>
                                </div>
                            ) : (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="flex gap-3 items-start">
                                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-cyan-100 border border-black shadow-[1px_1px_0_#000] shrink-0 relative">
                                            <Image
                                                src={log.admin.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.admin.name}`}
                                                alt=""
                                                width={28}
                                                height={28}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-black leading-tight">
                                                <span className="font-black truncate uppercase">{log.admin.name}</span>{" "}
                                                {formatAction(log.action)}
                                            </p>
                                            <p className="text-[10px] font-black text-cyan-600 mt-1 uppercase">
                                                {log.targetType} · {timeAgo(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Access Cards */}
            <div>
                <p className="text-xs font-black tracking-widest text-black uppercase mb-4">Menu Manajemen</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickActions.map((action) => {
                        const Icon = action.icon
                        const c = colorMap[action.accentColor] || colorMap.amber
                        return (
                            <Link
                                key={action.title}
                                href={action.href}
                                className={`group relative bg-white border-[3px] ${c.border} ${c.shadow} ${c.hover} rounded-2xl p-5 lg:p-6 transition-all duration-200 overflow-hidden flex flex-col`}
                            >
                                <div className="relative space-y-4 z-10">
                                    {/* Icon + Title */}
                                    <div className="flex items-start justify-between">
                                        <div className={`w-12 h-12 rounded-xl ${c.bg} border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_#000]`}>
                                            <Icon className={`w-6 h-6 ${c.iconText}`} />
                                        </div>
                                        {action.pendingCount > 0 ? (
                                            <span className="bg-rose-400 text-black text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 animate-bounce">
                                                {action.pendingCount} pending
                                            </span>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center bg-white group-hover:bg-yellow-300 transition-colors">
                                                <ChevronRight className="w-5 h-5 text-black group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h2 className="text-lg font-black text-black uppercase tracking-wide">{action.title}</h2>
                                        <p className="text-neutral-700 font-bold text-xs mt-2 leading-relaxed">{action.description}</p>
                                    </div>

                                    {/* Stat row */}
                                    <div className="flex items-center gap-1.5 text-xs font-black text-black mt-auto pt-2">
                                        <Zap className="w-3.5 h-3.5 text-black" />
                                        <span className="uppercase tracking-wider">Akses Menu →</span>
                                    </div>
                                </div>
                                {/* Decorative background shape */}
                                <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full border-[3px] border-black ${c.bg} opacity-20 pointer-events-none group-hover:scale-110 transition-transform`} />
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Info footer */}
            <div className="border-[3px] border-black rounded-2xl p-5 bg-yellow-200 shadow-[6px_6px_0_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-rose-400 border-[3px] border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0_#000]">
                        <AlertCircle className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <p className="text-base font-black text-black uppercase tracking-wide">Akses Terbatas</p>
                        <p className="text-sm font-bold text-neutral-800 mt-1">Halaman ini hanya dapat diakses oleh administrator yang telah terverifikasi.</p>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="relative z-10 px-4 py-2 bg-white border-[2px] border-black shadow-[3px_3px_0_#000] text-sm font-black text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] transition-all whitespace-nowrap rounded-xl uppercase"
                >
                    Aplikasi →
                </Link>
                {/* Warning tape decoration */}
                <div className="absolute top-0 right-0 w-32 h-6 bg-black text-yellow-300 text-[10px] font-black tracking-widest flex items-center justify-center rotate-45 translate-x-10 translate-y-4">
                    WARNING WARNING
                </div>
            </div>
        </div>
    )
}