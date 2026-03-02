"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { MapPin, Map, Plus, LogOut, LayoutDashboard, User as UserIcon, ArrowRight, Globe, Shield, MessageSquareText } from "lucide-react"

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Map", href: "/map", icon: Map },
        { name: "Community", href: "/community", icon: Globe },
    ]

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06]">
            {/* Glass background — same treatment as landing page */}
            <div
                className="absolute inset-0 backdrop-blur-2xl"
                style={{ background: "linear-gradient(to bottom, rgba(8,8,16,0.88), rgba(8,8,16,0.65))" }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[72px]">

                    {/* ── Left: Logo + Nav Links ─────────────────────── */}
                    <div className="flex items-center gap-8">
                        {/* Logo — identical to landing page */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10">
                                <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-12deg] group-hover:rotate-0 transition-all duration-300 shadow-lg shadow-indigo-500/30" />
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
                                Memory<span className="text-indigo-400">Map</span>
                            </span>
                        </Link>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                const isActive = pathname === link.href
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                            : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.name}
                                    </Link>
                                )
                            })}

                            {/* Admin Link Menu */}
                            {session?.user?.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin')
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]"
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ── Right: CTA + User ──────────────────────────── */}
                    <div className="flex items-center gap-3">
                        {/* User section */}
                        {session?.user ? (
                            <>
                                <Link
                                    href="/feedbacks"
                                    className="hidden sm:flex items-center gap-2 p-2 px-3 text-sm font-medium text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-full transition-all flex-shrink-0"
                                    title="Pusat Bantuan & Tiket"
                                >
                                    <MessageSquareText className="w-4 h-4" />
                                    <span>Pusat Bantuan</span>
                                </Link>
                                <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
                                    {/* Profile avatar */}
                                    <Link
                                        href={`/profile/${session.user.id}`}
                                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all"
                                        title="Profile"
                                    >
                                        {session.user.image ? (
                                            <img
                                                src={session.user.image}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-neutral-300" />
                                        )}
                                    </Link>

                                    {/* Sign out */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="p-2 text-neutral-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/[0.05]"
                                        title="Sign out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:block text-sm font-medium text-neutral-400 hover:text-white transition-colors px-3">
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden group"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                >
                                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                    <span className="relative">Get Started</span>
                                    <ArrowRight className="relative w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
