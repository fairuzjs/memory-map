"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { MapPin, Map, LogOut, LayoutDashboard, User as UserIcon, Globe, Shield, MessageSquareText, Menu, X, Flame, Package, Crown } from "lucide-react"
import { useState, useEffect } from "react"
import { NotificationDropdown } from "./NotificationDropdown"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [isPremium, setIsPremium] = useState<boolean | null>(null)

    // Scroll-aware background
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

    // Fetch premium status
    useEffect(() => {
        if (session?.user) {
            fetch("/api/premium/status")
                .then(res => res.ok ? res.json() : null)
                .then(data => { if (data) setIsPremium(data.isPremium) })
                .catch(() => {})
        }
    }, [session?.user])

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Map", href: "/map", icon: Map },
        { name: "Community", href: "/community", icon: Globe },
        { name: "Streak", href: "/streak", icon: Flame },
    ]

    return (
        <nav className="fixed top-0 z-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <motion.div
                    animate={{
                        boxShadow: scrolled ? "4px 4px 0px #000" : "none",
                        borderColor: scrolled ? "#000" : "transparent",
                        backgroundColor: scrolled ? "#FFFFFF" : "rgba(255,253,240,0.95)",
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative border-[3px] border-transparent transition-colors"
                >
                    <div className="flex items-center justify-between h-[64px] px-5">

                        {/* ── Left: Logo + Nav Links ───────────────────────────── */}
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                                <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                                    <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-black group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[4px_4px_0_#000] transition-all duration-200" />
                                    <MapPin className="relative w-4 h-4 text-black z-10" />
                                </div>
                                <span className="font-black text-[20px] font-[Outfit] text-black tracking-tight">
                                    Memory<span className="text-[#FF00FF]">Map</span>
                                </span>
                            </Link>

                            {/* Nav Links — Desktop */}
                            <div className="hidden md:flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon
                                    const isActive = pathname === link.href
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm font-bold border-[3px] border-transparent transition-all ${
                                                isActive
                                                    ? "bg-[#00FFFF] border-black shadow-[3px_3px_0_#000] text-black"
                                                    : "text-black hover:bg-[#FFFF00] hover:border-black"
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
                                        className={`flex items-center gap-2 px-3 py-2 text-sm font-bold border-[3px] border-transparent transition-all ${
                                            pathname.startsWith("/admin")
                                                ? "bg-[#FF00FF] border-black shadow-[3px_3px_0_#000] text-white"
                                                : "text-black hover:bg-[#FF00FF] hover:text-white hover:border-black"
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
                                        className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-bold text-black hover:bg-[#FFFF00] border-2 border-transparent hover:border-black transition-all"
                                    >
                                        <MessageSquareText className="w-4 h-4" />
                                        <span>Bantuan</span>
                                    </Link>

                                    {/* Premium Button — desktop */}
                                    <Link
                                        href="/premium"
                                        title="MemoryMap Premium"
                                        className={`hidden md:flex items-center gap-2 px-3 py-2 text-sm font-black border-[3px] transition-all uppercase tracking-wider ${
                                            pathname === "/premium"
                                                ? "bg-[#FFFF00] border-black text-black shadow-[3px_3px_0_#000]"
                                                : isPremium
                                                    ? "bg-white border-black text-black hover:bg-[#FFFF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000]"
                                                    : "bg-white border-black text-black hover:bg-[#00FF00] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000]"
                                        }`}
                                    >
                                        <Crown className="w-4 h-4" />
                                        <span>Premium</span>
                                    </Link>

                                    {/* Notification Bell */}
                                    <NotificationDropdown />

                                    {/* Divider */}
                                    <div className="w-[3px] h-6 bg-black mx-1" />

                                    {/* Inventory — desktop */}
                                    <Link
                                        href="/inventory"
                                        title="Inventori Dekorasi"
                                        className={`hidden md:flex items-center justify-center w-10 h-10 border-[3px] transition-all ${
                                            pathname === "/inventory"
                                                ? "bg-[#FF00FF] border-black shadow-[3px_3px_0_#000] text-white"
                                                : "bg-white border-transparent hover:border-black text-black hover:bg-[#FFFF00]"
                                        }`}
                                    >
                                        <Package className="w-4 h-4" />
                                    </Link>

                                    {/* Profile Avatar */}
                                    <Link
                                        href={`/profile/${session.user.id}`}
                                        title="Profile"
                                        className="flex items-center justify-center w-10 h-10 bg-white border-[3px] border-black hover:shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden"
                                    >
                                        {session.user.image ? (
                                            <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-black" />
                                        )}
                                    </Link>

                                    {/* Sign Out — desktop */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        title="Sign out"
                                        className="hidden md:flex items-center justify-center w-10 h-10 text-black hover:text-white border-[3px] border-transparent hover:border-black hover:bg-black transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-bold text-black hover:bg-[#00FFFF] border-2 border-transparent hover:border-black transition-all">
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all uppercase tracking-wide"
                                    >
                                        Mulai Gratis
                                    </Link>
                                </>
                            )}

                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex md:hidden items-center justify-center w-10 h-10 text-black hover:bg-[#FFFF00] border-[3px] border-transparent hover:border-black transition-all"
                                aria-label="Toggle menu"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {isMenuOpen ? (
                                        <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                            <X className="w-6 h-6" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                            <Menu className="w-6 h-6" />
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
                            <div className="border-[4px] border-black bg-white px-4 py-4 flex flex-col gap-1 shadow-[8px_8px_0_#000]">
                                {/* Nav links */}
                                {navLinks.map((link) => {
                                    const Icon = link.icon
                                    const isActive = pathname === link.href
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all ${
                                                isActive
                                                    ? "bg-[#00FFFF] border-black shadow-[3px_3px_0_#000] text-black"
                                                    : "text-black hover:bg-[#FFFF00] hover:border-black"
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
                                        className={`flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all ${
                                            pathname.startsWith("/admin")
                                                ? "bg-[#FF00FF] border-black shadow-[3px_3px_0_#000] text-white"
                                                : "text-black hover:bg-[#FF00FF] hover:text-white hover:border-black"
                                        }`}
                                    >
                                        <Shield className="w-5 h-5 shrink-0" />
                                        Admin Panel
                                    </Link>
                                )}

                                <div className="h-[3px] bg-black my-2 mx-2" />

                                {session?.user && (
                                    <>
                                        <Link href={`/profile/${session.user.id}`} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all ${pathname.startsWith(`/profile/${session.user.id}`) ? "bg-[#FFFF00] border-black shadow-[3px_3px_0_#000] text-black" : "text-black hover:bg-[#FFFF00] hover:border-black"}`}>
                                            <UserIcon className="w-5 h-5 shrink-0" />
                                            Profile
                                        </Link>
                                        <Link href="/inventory" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all ${pathname === "/inventory" ? "bg-[#FF00FF] border-black shadow-[3px_3px_0_#000] text-white" : "text-black hover:bg-[#FF00FF] hover:text-white hover:border-black"}`}>
                                            <Package className="w-5 h-5 shrink-0" />
                                            Inventori
                                        </Link>
                                        <Link href="/feedbacks" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all ${pathname === "/feedbacks" ? "bg-[#00FF00] border-black shadow-[3px_3px_0_#000] text-black" : "text-black hover:bg-[#00FF00] hover:border-black"}`}>
                                            <MessageSquareText className="w-5 h-5 shrink-0" />
                                            Pusat Bantuan
                                        </Link>
                                        <Link
                                            href="/premium"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all ${
                                                pathname === "/premium"
                                                    ? "bg-[#FFFF00] border-black shadow-[3px_3px_0_#000] text-black"
                                                    : "text-black hover:bg-[#FFFF00] hover:border-black"
                                            }`}
                                        >
                                            <Crown className="w-5 h-5 shrink-0" />
                                            {isPremium ? "Premium ✦" : "Upgrade Premium"}
                                        </Link>

                                        <div className="h-[3px] bg-black my-2 mx-2" />

                                        <button
                                            onClick={() => { setIsMenuOpen(false); signOut({ callbackUrl: "/login" }) }}
                                            className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold text-white bg-black hover:bg-[#FF00FF] hover:text-white border-[3px] border-black shadow-[3px_3px_0_#000] transition-all text-left"
                                        >
                                            <LogOut className="w-5 h-5 shrink-0" />
                                            Sign Out
                                        </button>
                                    </>
                                )}

                                {!session?.user && (
                                    <>
                                        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold text-black hover:bg-[#00FFFF] border-[3px] border-transparent hover:border-black transition-all">
                                            <UserIcon className="w-5 h-5 shrink-0" />
                                            Sign In
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="mt-1 w-full inline-flex items-center justify-center py-3 text-[15px] font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all uppercase"
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
