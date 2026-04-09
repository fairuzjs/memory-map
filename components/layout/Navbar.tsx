"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { MapPin, Map, Plus, LogOut, LayoutDashboard, User as UserIcon, ArrowRight, Globe, Shield, MessageSquareText, Menu, X, Flame, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { NotificationDropdown } from "./NotificationDropdown"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false)
    }, [pathname])

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isMenuOpen])

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Map", href: "/map", icon: Map },
        { name: "Community", href: "/community", icon: Globe },
        { name: "Streak", href: "/streak", icon: Flame },
    ]

    return (
        <nav className="fixed top-0 z-50 w-full transition-all duration-300">
            {/* Glassmorphism Background */}
            <div
                className="absolute inset-0 backdrop-blur-xl border-b border-white/[0.08]"
                style={{ background: "rgba(8,8,16,0.7)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)" }}
            />

            {/* Subtle Bottom Gradient Line */}
            <div className="absolute bottom-0 left-0 w-full h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }} />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[76px]">

                    {/* ── Left: Logo + Nav Links ─────────────────────── */}
                    <div className="flex items-center gap-8">
                        {/* Logo — identical to landing page */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-indigo-500/30" />
                                <MapPin className="relative w-5 h-5 text-white z-10" />
                            </div>
                            <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
                                Memory<span className="text-indigo-400">Map</span>
                            </span>
                        </Link>

                        {/* Nav Links - Desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                const isActive = pathname === link.href
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? "bg-white/[0.08] text-white"
                                            : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
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
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin')
                                        ? "bg-rose-500/10 text-rose-400"
                                        : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ── Right: CTA + User + Hamburger ──────────────────────────── */}
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

                                <NotificationDropdown />

                                <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
                                    {/* Inventory shortcut - Desktop */}
                                    <Link
                                        href="/inventory"
                                        className={`hidden md:flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                                            pathname === '/inventory'
                                                ? 'bg-indigo-500/15 border border-indigo-500/30'
                                                : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08]'
                                        }`}
                                        title="Inventori Dekorasi"
                                    >
                                        <Package className={`w-4 h-4 transition-colors ${
                                            pathname === '/inventory' ? 'text-indigo-400' : 'text-neutral-400 hover:text-white'
                                        }`} />
                                    </Link>

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

                                    {/* Sign out - Desktop only */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="hidden md:block p-2 text-neutral-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/[0.05]"
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
                                    className="relative hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden group"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                >
                                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                    <span className="relative">Get Started</span>
                                    <ArrowRight className="relative w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Navigation Menu ────────────────────────── */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-t border-white/[0.06] bg-[#0c0c16]/95 backdrop-blur-xl overflow-hidden absolute top-[76px] left-0 w-full z-40"
                    >
                        {/* Menu Content */}
                        <div className="px-5 py-6 flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon
                                const isActive = pathname === link.href
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${isActive
                                            ? "bg-white/[0.08] text-white"
                                            : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {link.name}
                                    </Link>
                                )
                            })}

                            {session?.user?.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname.startsWith('/admin')
                                        ? "bg-rose-500/10 text-rose-400"
                                        : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                                        }`}
                                >
                                    <Shield className="w-5 h-5 flex-shrink-0" />
                                    Admin Panel
                                </Link>
                            )}

                            <div className="h-px bg-white/[0.06] my-2 mx-2" />

                            {session?.user && (
                                <Link
                                    href={`/profile/${session.user.id}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname.startsWith(`/profile/${session.user.id}`)
                                        ? "bg-white/[0.08] text-white"
                                        : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                                        }`}
                                >
                                    <UserIcon className="w-5 h-5 flex-shrink-0" />
                                    Profile
                                </Link>
                            )}

                            {session?.user && (
                                <Link
                                    href="/inventory"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname === '/inventory'
                                        ? "bg-indigo-500/10 text-indigo-300"
                                        : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                                        }`}
                                >
                                    <Package className="w-5 h-5 flex-shrink-0" />
                                    Inventori
                                </Link>
                            )}

                            <Link
                                href="/feedbacks"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${pathname === '/feedbacks'
                                    ? "bg-white/[0.08] text-white"
                                    : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                                    }`}
                            >
                                <MessageSquareText className="w-5 h-5 flex-shrink-0" />
                                Pusat Bantuan
                            </Link>

                            {!session?.user && (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-all"
                                    >
                                        <UserIcon className="w-5 h-5 flex-shrink-0" />
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="mt-2 w-full relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-white overflow-hidden shadow-lg shadow-indigo-500/20"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                    >
                                        <span className="relative">Get Started</span>
                                        <ArrowRight className="w-4 h-4 flex-shrink-0 relative" />
                                    </Link>
                                </>
                            )}

                            {session?.user && (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        signOut({ callbackUrl: "/login" })
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
                                >
                                    <LogOut className="w-5 h-5 flex-shrink-0" />
                                    Sign Out
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
