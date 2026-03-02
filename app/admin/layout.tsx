"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, MessageSquare, Flag, ArrowLeft, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Saran & Kritik", href: "/admin/feedbacks", icon: MessageSquare },
        { label: "Laporan Postingan", href: "/admin/reports", icon: Flag },
    ]

    if (pathname === "/admin/login") {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 p-4 shrink-0 flex flex-col gap-6">
                <div className="flex items-center gap-2 px-2 py-4 border-b border-neutral-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">A</div>
                    <span className="font-[Outfit] font-bold text-lg tracking-tight">Admin<span className="text-indigo-400">Panel</span></span>
                </div>

                <nav className="flex-1 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="border-t border-neutral-800 pt-4 flex flex-col gap-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Aplikasi
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-colors w-full text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out Admin
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative max-h-screen overflow-y-auto">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950 pointer-events-none -z-10" />
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
