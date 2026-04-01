"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, MessageSquare, Flag, ChevronRight,
    TrendingUp, Clock, CheckCircle2, AlertCircle, Shield
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        } else if (status === "authenticated" && session.user.role === "ADMIN") {
            setLoading(false)
        }
    }, [status, session, router])

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                    <p className="text-sm text-neutral-600">Memuat dashboard...</p>
                </div>
            </div>
        )
    }

    const stats = [
        {
            label: "Total Saran & Kritik",
            value: "—",
            icon: MessageSquare,
            color: "indigo",
            trend: null,
        },
        {
            label: "Laporan Postingan",
            value: "—",
            icon: Flag,
            color: "rose",
            trend: null,
        },
    ]

    const quickActions = [
        {
            title: "Saran & Kritik",
            description: "Pantau dan kelola masukan dari pengguna aplikasi",
            href: "/admin/feedbacks",
            icon: MessageSquare,
            accentColor: "indigo",
            stats: [
                { icon: Clock, label: "Menunggu tinjau" },
                { icon: CheckCircle2, label: "Sudah ditangani" },
            ],
        },
        {
            title: "Laporan Postingan",
            description: "Tinjau memory yang dilaporkan oleh pengguna",
            href: "/admin/reports",
            icon: Flag,
            accentColor: "rose",
            stats: [
                { icon: AlertCircle, label: "Perlu tindakan" },
                { icon: CheckCircle2, label: "Sudah diselesaikan" },
            ],
        },
    ]

    const colorMap: Record<string, {
        bg: string, border: string, iconBg: string, iconText: string,
        badge: string, badgeText: string, chevron: string, hover: string, statText: string
    }> = {
        indigo: {
            bg: "bg-indigo-500/[0.06]",
            border: "border-indigo-500/20",
            iconBg: "bg-indigo-500/10",
            iconText: "text-indigo-400",
            badge: "bg-indigo-500/10",
            badgeText: "text-indigo-400",
            chevron: "text-indigo-500/50 group-hover:text-indigo-400",
            hover: "hover:border-indigo-500/40",
            statText: "text-indigo-300/70",
        },
        rose: {
            bg: "bg-rose-500/[0.06]",
            border: "border-rose-500/20",
            iconBg: "bg-rose-500/10",
            iconText: "text-rose-400",
            badge: "bg-rose-500/10",
            badgeText: "text-rose-400",
            chevron: "text-rose-500/50 group-hover:text-rose-400",
            hover: "hover:border-rose-500/40",
            statText: "text-rose-300/70",
        },
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold tracking-widest text-neutral-600 uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-[Outfit] font-bold text-white tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Selamat datang kembali,{" "}
                        <span className="text-neutral-300 font-medium">{session?.user?.name ?? "Admin"}</span>
                    </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15 self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">Sistem Aktif</span>
                </div>
            </div>

            {/* Quick Access Cards */}
            <div>
                <p className="text-xs font-semibold tracking-widest text-neutral-600 uppercase mb-3">Manajemen</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon
                        const c = colorMap[action.accentColor]
                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className={`group relative bg-neutral-900/60 border border-white/[0.06] ${c.hover} rounded-2xl p-5 lg:p-6 transition-all duration-200 hover:bg-neutral-900/80 overflow-hidden`}
                            >
                                {/* Subtle gradient accent */}
                                <div className={`absolute top-0 right-0 w-32 h-32 ${c.bg} rounded-full blur-2xl translate-x-8 -translate-y-8 pointer-events-none`} />

                                <div className="relative space-y-4">
                                    {/* Icon + Title */}
                                    <div className="flex items-start justify-between">
                                        <div className={`w-10 h-10 rounded-xl ${c.iconBg} border ${c.border} flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${c.iconText}`} />
                                        </div>
                                        <ChevronRight className={`w-4 h-4 mt-1 transition-all duration-200 ${c.chevron} group-hover:translate-x-0.5`} />
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h2 className="text-base font-semibold text-white">{action.title}</h2>
                                        <p className="text-neutral-500 text-sm mt-1 leading-relaxed">{action.description}</p>
                                    </div>

                                    {/* Stat row */}
                                    <div className={`flex items-center gap-1 text-xs ${c.statText}`}>
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Lihat semua data</span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Info footer */}
            <div className="border border-white/[0.05] rounded-2xl p-4 bg-neutral-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-neutral-300">Akses Terbatas</p>
                        <p className="text-xs text-neutral-600 mt-0.5">Halaman ini hanya dapat diakses oleh administrator yang telah terverifikasi.</p>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
                >
                    Kembali ke Aplikasi →
                </Link>
            </div>
        </div>
    )
}