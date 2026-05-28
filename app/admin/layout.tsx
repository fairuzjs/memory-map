"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, MessageSquare, Flag, ArrowLeft, LogOut, Menu, X, Shield, Coins, Zap, BadgeCheck, Crown } from "lucide-react"
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
        { label: "Pesanan Premium", href: "/admin/premium", icon: Crown },
        { label: "Pengguna", href: "/admin/users", icon: BadgeCheck },
    ]

    if (pathname === "/admin/login") {
        return <>{children}</>
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#FFFDF0]">
            {/* Logo */}
            <div className="px-5 py-5 border-b-[3px] border-black">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-300 flex items-center justify-center border-[2px] border-black shadow-[3px_3px_0_#000]">
                        <Shield className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <span className="font-[Outfit] font-black text-base tracking-tight text-black">
                            ADMIN<span className="text-cyan-600">PANEL</span>
                        </span>
                        <p className="text-[10px] text-black font-bold tracking-widest uppercase mt-0.5">MemoryMap</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                <p className="text-[10px] font-black tracking-widest text-black uppercase px-2 mb-3">Menu</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-[2px] ${
                                isActive
                                    ? "bg-yellow-300 border-black shadow-[4px_4px_0_#000] text-black translate-x-1"
                                    : "bg-white border-transparent text-neutral-800 hover:border-black hover:shadow-[4px_4px_0_#000] hover:bg-cyan-100 hover:-translate-y-0.5"
                            }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-black" : "text-black"}`} />
                            <span className="uppercase tracking-wide">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 pb-6 border-t-[3px] border-black pt-6 space-y-3">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-black border-[2px] border-black bg-white shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] hover:bg-yellow-100 transition-all duration-200"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="uppercase tracking-wide">Aplikasi</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-black border-[2px] border-black bg-rose-400 shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] hover:bg-rose-500 transition-all duration-200 w-full text-left"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="uppercase tracking-wide">Sign Out</span>
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#FFFDF0] text-black flex font-[Outfit]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r-[3px] border-black bg-[#FFFDF0] shrink-0 flex-col sticky top-0 h-screen z-20 shadow-[4px_0_0_rgba(0,0,0,0.05)]">
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
            <aside className={`fixed left-0 top-0 h-full w-64 border-r-[3px] border-black bg-[#FFFDF0] z-50 lg:hidden transition-transform duration-300 ease-in-out shadow-[8px_0_0_#000] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1.5 rounded-xl border-[2px] border-black bg-rose-400 shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] text-black transition-all"
                    >
                        <X className="w-5 h-5 font-black" />
                    </button>
                </div>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 max-h-screen overflow-y-auto relative bg-[#FFFDF0]">
                {/* Mobile topbar */}
                <div className="lg:hidden sticky top-0 z-30 bg-[#FFFDF0] border-b-[3px] border-black px-4 py-3 flex items-center gap-3 shadow-[0_4px_0_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl border-[2px] border-black bg-cyan-300 shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] text-black transition-all"
                    >
                        <Menu className="w-5 h-5 font-black" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-cyan-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <Shield className="w-3 h-3 text-black" />
                        </div>
                        <span className="font-[Outfit] font-black text-sm text-black tracking-tight">
                            ADMIN<span className="text-cyan-600">PANEL</span>
                        </span>
                    </div>
                </div>

                <div className="p-6 lg:p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}