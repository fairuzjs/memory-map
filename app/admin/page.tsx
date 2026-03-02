"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, MessageSquare, Flag } from "lucide-react"

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
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-[Outfit] font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-neutral-400 mt-2">Selamat datang di Panel Administrasi MemoryMap.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Saran & Kritik</h2>
                            <p className="text-neutral-400 text-sm mt-1">Pantau dan kelola masukan pengguna</p>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <Flag className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Laporan Postingan</h2>
                            <p className="text-neutral-400 text-sm mt-1">Tinjau memory yang dilaporkan pengguna</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
