"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { MapPin, Map, LogOut, LayoutDashboard, User as UserIcon, Globe, Shield, MessageSquareText, Menu, X, Flame, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { NotificationDropdown } from "./NotificationDropdown"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    // Scroll-aware background (same as LandingNavbar)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24)
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false)
    }, [pathname])

    // Prevent body scroll when mobile menu open
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "unset"
        return () => { document.body.style.overflow = "unset" }
    }, [isMenuOpen])

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Map", href: "/map", icon: Map },
        { name: "Community", href: "/community", icon: Globe },
        { name: "Streak", href: "/streak", icon: Flame },
    ]

    return (
        <nav className="fixed top-0 z-50 w-full">
            {/* ── Floating pill wrapper — same approach as LandingNavbar ─────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <motion.div
                    animate={{
                        backgroundColor: scrolled ? "rgba(10,10,16,0.85)" : "rgba(10,10,16,0.6)",
                        borderColor: scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                        boxShadow: scrolled
                            ? "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)"
                            : "none",
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative rounded-2xl border backdrop-blur-xl overflow-visible"
                >
                    {/* Indigo accent line (shows when scrolled) */}
                    <motion.div
                        animate={{ opacity: scrolled ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 pointer-events-none rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }}
                    />

                    <div className="flex items-center justify-between h-[64px] px-5">

                        {/* ── Left: Logo + Nav Links ───────────────────────────── */}
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                                <div className="relative w-9 h-9 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-indigo-500/30" />
                                    <MapPin className="relative w-4 h-4 text-white z-10" />
                                </div>
                                <span className="font-extrabold text-[20px] font-[Outfit] text-white tracking-tight">
                                    Memory<span className="text-indigo-400">Map</span>
                                </span>
                            </Link>

                            {/* Nav Links — Desktop */}
                            <div className="hidden md:flex items-center gap-0.5">
                                {navLinks.map((link) => {
                                    const Icon = link.icon
                                    const isActive = pathname === link.href
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                isActive
                                                    ? "bg-white/[0.08] text-white"
                                                    : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {link.name}
                                        </Link>
                                    )
                                })}

                                {session?.user?.role === "ADMIN" && (
                                    <Link
                                        href="/admin"
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            pathname.startsWith("/admin")
                                                ? "bg-rose-500/10 text-rose-400"
                                                : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                                        }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        Admin
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* ── Right: Actions ───────────────────────────────────── */}
                        <div className="flex items-center gap-2">
                            {session?.user ? (
                                <>
                                    {/* Pusat Bantuan — desktop only */}
                                    <Link
                                        href="/feedbacks"
                                        title="Pusat Bantuan & Tiket"
                                        className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-xl transition-all"
                                    >
                                        <MessageSquareText className="w-4 h-4" />
                                        <span>Bantuan</span>
                                    </Link>

                                    {/* Notification Bell */}
                                    <NotificationDropdown />

                                    {/* Divider */}
                                    <div className="w-px h-5 bg-white/[0.08] mx-1" />

                                    {/* Inventory — desktop */}
                                    <Link
                                        href="/inventory"
                                        title="Inventori Dekorasi"
                                        className={`hidden md:flex items-center justify-center w-9 h-9 rounded-xl transition-all border ${
                                            pathname === "/inventory"
                                                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                                                : "bg-white/[0.03] border-white/[0.07] text-neutral-500 hover:text-white hover:bg-white/[0.07]"
                                        }`}
                                    >
                                        <Package className="w-4 h-4" />
                                    </Link>

                                    {/* Profile Avatar */}
                                    <Link
                                        href={`/profile/${session.user.id}`}
                                        title="Profile"
                                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.09] transition-all overflow-hidden"
                                    >
                                        {session.user.image ? (
                                            <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-neutral-300" />
                                        )}
                                    </Link>

                                    {/* Sign Out — desktop */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        title="Sign out"
                                        className="hidden md:flex items-center justify-center w-9 h-9 text-neutral-600 hover:text-red-400 rounded-xl hover:bg-white/[0.05] transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-neutral-500 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors">
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors shadow-[0_0_20px_-6px_rgba(255,255,255,0.3)]"
                                    >
                                        Mulai Gratis
                                    </Link>
                                </>
                            )}

                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
                                aria-label="Toggle menu"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {isMenuOpen ? (
                                        <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                            <X className="w-5 h-5" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                            <Menu className="w-5 h-5" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Mobile Dropdown ──────────────────────────────────────── */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden mt-2"
                        >
                            <div
                                className="rounded-2xl border border-white/[0.07] backdrop-blur-xl px-4 py-4 flex flex-col gap-1"
                                style={{ background: "rgba(10,10,16,0.97)" }}
                            >
                                {/* Nav links */}
                                {navLinks.map((link) => {
                                    const Icon = link.icon
                                    const isActive = pathname === link.href
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                                                isActive
                                                    ? "bg-white/[0.07] text-white"
                                                    : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                                            }`}
                                        >
                                            <Icon className="w-5 h-5 shrink-0" />
                                            {link.name}
                                        </Link>
                                    )
                                })}

                                {session?.user?.role === "ADMIN" && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                                            pathname.startsWith("/admin")
                                                ? "bg-rose-500/10 text-rose-400"
                                                : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                                        }`}
                                    >
                                        <Shield className="w-5 h-5 shrink-0" />
                                        Admin Panel
                                    </Link>
                                )}

                                <div className="h-px bg-white/[0.06] my-2 mx-2" />

                                {session?.user && (
                                    <>
                                        <Link href={`/profile/${session.user.id}`} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname.startsWith(`/profile/${session.user.id}`) ? "bg-white/[0.07] text-white" : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"}`}>
                                            <UserIcon className="w-5 h-5 shrink-0" />
                                            Profile
                                        </Link>
                                        <Link href="/inventory" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname === "/inventory" ? "bg-indigo-500/10 text-indigo-300" : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"}`}>
                                            <Package className="w-5 h-5 shrink-0" />
                                            Inventori
                                        </Link>
                                        <Link href="/feedbacks" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname === "/feedbacks" ? "bg-white/[0.07] text-white" : "text-neutral-400 hover:text-white hover:bg-white/[0.05]"}`}>
                                            <MessageSquareText className="w-5 h-5 shrink-0" />
                                            Pusat Bantuan
                                        </Link>

                                        <div className="h-px bg-white/[0.06] my-2 mx-2" />

                                        <button
                                            onClick={() => { setIsMenuOpen(false); signOut({ callbackUrl: "/login" }) }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
                                        >
                                            <LogOut className="w-5 h-5 shrink-0" />
                                            Sign Out
                                        </button>
                                    </>
                                )}

                                {!session?.user && (
                                    <>
                                        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all">
                                            <UserIcon className="w-5 h-5 shrink-0" />
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="mt-1 w-full inline-flex items-center justify-center py-3 rounded-xl text-[15px] font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors"
                                        >
                                            Mulai Gratis
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    )
}
