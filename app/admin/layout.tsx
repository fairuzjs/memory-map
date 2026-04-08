"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, MessageSquare, Flag, ArrowLeft, LogOut, Menu, X, Shield, Coins, Zap } from "lucide-react"
import { useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Saran & Kritik", href: "/admin/feedbacks", icon: MessageSquare },
        { label: "Laporan Postingan", href: "/admin/reports", icon: Flag },
        { label: "Pesanan Topup", href: "/admin/topup", icon: Coins },
        { label: "Proses Topup", href: "/admin/topup/process", icon: Zap },
    ]

    if (pathname === "/admin/login") {
        return <>{children}</>
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="font-[Outfit] font-bold text-base tracking-tight text-white">
                            Admin<span className="text-indigo-400">Panel</span>
                        </span>
                        <p className="text-[10px] text-neutral-500 tracking-widest uppercase mt-0.5">MemoryMap</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                <p className="text-[10px] font-semibold tracking-widest text-neutral-600 uppercase px-3 mb-2">Menu</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                                isActive
                                    ? "bg-indigo-500/15 text-indigo-300"
                                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]"
                            }`}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
                            )}
                            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-neutral-600 group-hover:text-neutral-400"}`} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 border-t border-white/[0.06] pt-4 space-y-0.5">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04] transition-all duration-200 group"
                >
                    <ArrowLeft className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    Kembali ke Aplikasi
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 w-full text-left group"
                >
                    <LogOut className="w-4 h-4 text-neutral-600 group-hover:text-rose-400 transition-colors" />
                    Sign Out Admin
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-60 border-r border-white/[0.05] bg-neutral-900/40 shrink-0 flex-col sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside className={`fixed left-0 top-0 h-full w-60 border-r border-white/[0.05] bg-neutral-900 z-50 lg:hidden transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 max-h-screen overflow-y-auto relative">
                {/* Ambient background */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-violet-900/8 rounded-full blur-3xl" />
                </div>

                {/* Mobile topbar */}
                <div className="lg:hidden sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-white/[0.05] px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-[Outfit] font-bold text-sm text-white">
                            Admin<span className="text-indigo-400">Panel</span>
                        </span>
                    </div>
                </div>

                <div className="p-6 lg:p-8 max-w-6xl">
                    {children}
                </div>
            </main>
        </div>
    )
}