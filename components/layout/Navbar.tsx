"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
    MapPin, Map, LogOut, LayoutDashboard, User as UserIcon, Globe, Shield,
    MessageSquareText, Menu, X, Flame, Package, Crown, Settings, ShoppingBag,
    Dices, BookOpen, ChevronDown, MoreHorizontal,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { NotificationDropdown } from "./NotificationDropdown"
import { openOnboardingGuide } from "./OnboardingGuide"
import { motion, AnimatePresence } from "framer-motion"

// ─── Link helper for active states ──────────────────────────────────────────
function NavLink({
    href, icon: Icon, label, active, tutorialId, onClick, className = "",
}: {
    href: string; icon: any; label: string; active: boolean; tutorialId?: string; onClick?: () => void; className?: string
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            data-tutorial={tutorialId}
            className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold border-[2px] transition-all rounded-xl ${
                active
                    ? "bg-[#00FFFF] border-black shadow-[2px_2px_0_#000] text-black"
                    : "border-transparent text-black hover:bg-[#FFFF00] hover:border-black"
            } ${className}`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </Link>
    )
}

// ─── Desktop profile dropdown ───────────────────────────────────────────────
function ProfileDropdown({
    session, pathname, isPremium,
}: {
    session: any; pathname: string; isPremium: boolean | null
}) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
        }
        if (isOpen) document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [isOpen])

    // Close on route change
    useEffect(() => { setIsOpen(false) }, [pathname])

    const items = [
        { href: `/profile/${session.user.id}`, icon: UserIcon, label: "Profile", tutorialId: "nav-profile", color: "" },
        { href: "/settings", icon: Settings, label: "Settings", tutorialId: "nav-settings", color: "" },
        { href: "/inventory", icon: Package, label: "Inventori", tutorialId: "nav-inventory", color: "" },
        "divider",
        { href: "/shop", icon: ShoppingBag, label: "Shop", tutorialId: "nav-shop", color: "#00FFFF" },
        { href: "/gacha", icon: Dices, label: "Gacha", tutorialId: "nav-gacha", color: "#FF00FF" },
        "divider",
        { href: "/feedbacks", icon: MessageSquareText, label: "Pusat Bantuan", tutorialId: "nav-help", color: "#00FF00" },
    ] as const

    return (
        <div className="relative hidden md:block" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 border-[2px] rounded-xl transition-all ${
                    isOpen
                        ? "border-black shadow-[2px_2px_0_#000] bg-[#FFFF00]"
                        : "border-transparent hover:border-black"
                }`}
                style={{ padding: "3px 6px 3px 3px" }}
            >
                <div className="w-8 h-8 border-[2px] border-black overflow-hidden bg-white flex items-center justify-center shrink-0 rounded-lg">
                    {session.user.image ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-3.5 h-3.5 text-black" />
                    )}
                </div>
                <ChevronDown className={`w-3 h-3 text-black transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white border-[3px] border-black shadow-[6px_6px_0_#000] z-[200] py-2 rounded-2xl overflow-hidden"
                    >
                        {items.map((item, i) => {
                            if (item === "divider") {
                                return <div key={`d-${i}`} className="h-[2px] bg-black/15 mx-3 my-1" />
                            }
                            const Icon = item.icon
                            const isActive = item.href.startsWith("/profile")
                                ? pathname.startsWith(`/profile/${session.user.id}`)
                                : pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    data-tutorial={item.tutorialId}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-2.5 mx-1.5 px-3 py-2 text-[13px] font-bold transition-all border-[2px] border-transparent rounded-xl ${
                                        isActive
                                            ? "bg-[#FFFF00] border-black text-black"
                                            : "text-black hover:bg-[#FFFF00] hover:border-black"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {item.label}
                                </Link>
                            )
                        })}
                        <div className="h-[2px] bg-black/15 mx-3 my-1" />
                        <button
                            onClick={() => { setIsOpen(false); signOut({ callbackUrl: "/login" }) }}
                            className="flex items-center gap-2.5 mx-1.5 px-3 py-2 text-[13px] font-bold text-black hover:bg-black hover:text-white transition-all w-[calc(100%-12px)] border-[2px] border-transparent rounded-xl hover:border-black"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Sign Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Mobile Drawer Item ─────────────────────────────────────────────────────
function DrawerItem({
    href, icon: Icon, label, active, tutorialId, onClick, accent,
}: {
    href: string; icon: any; label: string; active: boolean; tutorialId?: string; onClick: () => void; accent?: string
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            data-tutorial={tutorialId}
            className={`flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold border-[2px] border-transparent rounded-xl transition-all ${
                active
                    ? `border-black shadow-[2px_2px_0_#000] text-black`
                    : "text-black hover:bg-[#FFFF00] hover:border-black"
            }`}
            style={active && accent ? { backgroundColor: accent } : undefined}
        >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
        </Link>
    )
}

// ─── Mobile Grid Item ───────────────────────────────────────────────────────
function GridItem({
    href, icon: Icon, label, active, tutorialId, onClick, accent = "#E5E5E5",
}: {
    href: string; icon: any; label: string; active: boolean; tutorialId?: string; onClick: () => void; accent?: string
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            data-tutorial={tutorialId}
            className={`flex flex-col items-center justify-center gap-1.5 py-3 text-[11px] font-black uppercase tracking-wide border-[2px] rounded-xl transition-all ${
                active
                    ? "border-black shadow-[2px_2px_0_#000] text-black"
                    : "border-black/15 hover:border-black text-black/80 hover:text-black"
            }`}
            style={{ backgroundColor: active ? accent : `${accent}40` }}
        >
            <Icon className="w-5 h-5" />
            {label}
        </Link>
    )
}

// ─── Section Title ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: string }) {
    return (
        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.15em] px-1 pt-3 pb-1">
            {children}
        </p>
    )
}

// ═════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═════════════════════════════════════════════════════════════════════════════
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
    useEffect(() => { setIsMenuOpen(false) }, [pathname])

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

    const close = () => setIsMenuOpen(false)

    return (
        <nav className="fixed top-0 z-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <motion.div
                    animate={{
                        boxShadow: scrolled ? "4px 4px 0px #000" : "4px 4px 0px #000",
                        borderColor: "#000",
                        backgroundColor: scrolled ? "#FFFFFF" : "rgba(255,253,240,0.95)",
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative border-[3px] border-black rounded-2xl shadow-[4px_4px_0_#000] transition-colors"
                >
                    <div className="flex items-center justify-between h-[56px] px-4" style={{ minWidth: 0 }}>

                        {/* ── LEFT: Logo ──────────────────────────────── */}
                        <Link href="/" className="flex items-center gap-2 group shrink-0">
                            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                                <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-black rounded-lg group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[3px_3px_0_#000] transition-all duration-200" />
                                <MapPin className="relative w-3.5 h-3.5 text-black z-10" />
                            </div>
                            <span className="font-black text-[18px] font-[Outfit] text-black tracking-tight">
                                Memory<span className="text-[#FF00FF]">Map</span>
                            </span>
                        </Link>

                        {/* ── CENTER: Main nav links (desktop) ────────── */}
                        <div className="hidden md:flex items-center gap-1 flex-nowrap min-w-0 overflow-hidden mx-4">
                            <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} tutorialId="nav-dashboard" />
                            <NavLink href="/map" icon={Map} label="Map" active={pathname === "/map"} tutorialId="nav-map" />
                            <NavLink href="/community" icon={Globe} label="Community" active={pathname === "/community"} tutorialId="nav-community" className="hidden lg:flex" />
                            <NavLink href="/streak" icon={Flame} label="Streak" active={pathname === "/streak"} tutorialId="nav-streak" className="hidden lg:flex" />

                            {/* Panduan */}
                            <button
                                onClick={() => openOnboardingGuide()}
                                data-tutorial="nav-guide"
                                className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold border-[2px] border-transparent rounded-xl text-black hover:bg-[#00FF00] hover:border-black transition-all"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Panduan</span>
                            </button>

                            {/* Admin */}
                            {session?.user?.role === "ADMIN" && (
                                <NavLink href="/admin" icon={Shield} label="Admin" active={pathname.startsWith("/admin")} />
                            )}
                        </div>

                        {/* ── RIGHT: Actions (desktop) ───────────────── */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {session?.user ? (
                                <>
                                    {/* Premium — compact */}
                                    <Link
                                        href="/premium"
                                        data-tutorial="nav-premium"
                                        className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-black border-[2px] rounded-xl transition-all uppercase tracking-wider ${
                                            pathname === "/premium"
                                                ? "bg-[#FFFF00] border-black shadow-[2px_2px_0_#000] text-black"
                                                : isPremium
                                                    ? "bg-[#FFFF00]/30 border-black text-black hover:bg-[#FFFF00] hover:shadow-[2px_2px_0_#000]"
                                                    : "bg-white border-black text-black hover:bg-[#00FF00] hover:shadow-[2px_2px_0_#000]"
                                        }`}
                                    >
                                        <Crown className="w-3.5 h-3.5" />
                                        {isPremium ? "PRO" : "Premium"}
                                    </Link>

                                    {/* Notification Bell */}
                                    <NotificationDropdown />

                                    {/* Profile dropdown (desktop) */}
                                    <ProfileDropdown session={session} pathname={pathname} isPremium={isPremium} />
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden sm:block px-3 py-1.5 text-[13px] font-bold text-black hover:bg-[#00FFFF] border-[2px] border-transparent hover:border-black transition-all rounded-xl">
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-[13px] font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] transition-all uppercase tracking-wide rounded-xl"
                                    >
                                        Mulai Gratis
                                    </Link>
                                </>
                            )}

                            {/* Mobile Profile Avatar */}
                            {session?.user && (
                                <Link
                                    href={`/profile/${session.user.id}`}
                                    data-tutorial="mobile-nav-profile"
                                    className="flex md:hidden items-center justify-center w-8 h-8 border-[2px] border-black overflow-hidden bg-white hover:shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all rounded-lg"
                                >
                                    {session.user.image ? (
                                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-3.5 h-3.5 text-black" />
                                    )}
                                </Link>
                            )}

                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                data-tutorial="mobile-menu-button"
                                className="flex md:hidden items-center justify-center w-9 h-9 text-black hover:bg-[#FFFF00] border-[2px] border-transparent rounded-lg hover:border-black transition-all"
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

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* MOBILE DRAWER                                              */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden mt-2 animate-none"
                        >
                            <div
                                data-tutorial="mobile-drawer"
                                className="border-[3px] border-black bg-white rounded-3xl shadow-[6px_6px_0_#000] flex flex-col overflow-hidden"
                                style={{
                                    maxHeight: "calc(100vh - 120px)",
                                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                                }}
                            >
                                {/* ── Scrollable content ─────────────────── */}
                                <div className="overflow-y-auto flex-1 px-3 pb-3" style={{ overscrollBehavior: "contain" }}>

                                    {/* SECTION: UTAMA */}
                                    <SectionTitle>UTAMA</SectionTitle>
                                    <div className="space-y-0.5">
                                        <DrawerItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} tutorialId="mobile-nav-dashboard" onClick={close} accent="#00FFFF" />
                                        <DrawerItem href="/map" icon={Map} label="Map" active={pathname === "/map"} tutorialId="mobile-nav-map" onClick={close} accent="#00FFFF" />
                                        <DrawerItem href="/community" icon={Globe} label="Community" active={pathname === "/community"} tutorialId="mobile-nav-community" onClick={close} accent="#00FFFF" />
                                        <DrawerItem href="/streak" icon={Flame} label="Streak" active={pathname === "/streak"} tutorialId="mobile-nav-streak" onClick={close} accent="#FFFF00" />
                                    </div>

                                    {session?.user && (
                                        <>
                                            {/* SECTION: AKUN */}
                                            <SectionTitle>AKUN</SectionTitle>
                                            <div className="space-y-0.5">
                                                <DrawerItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} tutorialId="mobile-nav-settings" onClick={close} accent="#FF00FF" />
                                                <DrawerItem href="/inventory" icon={Package} label="Inventori" active={pathname === "/inventory"} tutorialId="mobile-nav-inventory" onClick={close} accent="#FF00FF" />
                                            </div>

                                            {/* SECTION: FITUR — 2-column grid */}
                                            <SectionTitle>FITUR</SectionTitle>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <GridItem href="/shop" icon={ShoppingBag} label="Shop" active={pathname === "/shop"} tutorialId="mobile-nav-shop" onClick={close} accent="#00FFFF" />
                                                <GridItem href="/gacha" icon={Dices} label="Gacha" active={pathname === "/gacha"} tutorialId="mobile-nav-gacha" onClick={close} accent="#FF00FF" />
                                                <button
                                                    onClick={() => { close(); openOnboardingGuide() }}
                                                    data-tutorial="mobile-nav-guide"
                                                    className="flex flex-col items-center justify-center gap-1.5 py-3 text-[11px] font-black uppercase tracking-wide border-[2px] border-black/15 hover:border-black text-black/80 hover:text-black transition-all rounded-xl"
                                                    style={{ backgroundColor: "rgba(0, 255, 0, 0.25)" }}
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                    Panduan
                                                </button>
                                                <GridItem href="/premium" icon={Crown} label={isPremium ? "PRO ✦" : "Premium"} active={pathname === "/premium"} tutorialId="mobile-nav-premium" onClick={close} accent="#FFFF00" />
                                            </div>

                                            {/* SECTION: BANTUAN */}
                                            <SectionTitle>BANTUAN</SectionTitle>
                                            <div className="space-y-0.5">
                                                <DrawerItem href="/feedbacks" icon={MessageSquareText} label="Pusat Bantuan" active={pathname === "/feedbacks"} tutorialId="mobile-nav-help" onClick={close} accent="#00FF00" />
                                            </div>

                                            {/* Admin */}
                                            {session.user.role === "ADMIN" && (
                                                <>
                                                    <SectionTitle>ADMIN</SectionTitle>
                                                    <DrawerItem href="/admin" icon={Shield} label="Admin Panel" active={pathname.startsWith("/admin")} onClick={close} accent="#FF00FF" />
                                                </>
                                            )}
                                        </>
                                    )}

                                    {!session?.user && (
                                        <div className="space-y-2 pt-3">
                                            <Link href="/login" onClick={close} className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold text-black hover:bg-[#00FFFF] border-[2px] border-transparent hover:border-black transition-all rounded-xl">
                                                <UserIcon className="w-[18px] h-[18px] shrink-0" />
                                                Sign In
                                            </Link>
                                            <Link
                                                href="/register"
                                                onClick={close}
                                                className="w-full inline-flex items-center justify-center py-2.5 text-[14px] font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] transition-all uppercase rounded-xl"
                                            >
                                                Mulai Gratis
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* ── Sign Out — sticky bottom ────────────── */}
                                {session?.user && (
                                    <div className="shrink-0 border-t-[3px] border-black px-3 py-2">
                                        <button
                                            onClick={() => { close(); signOut({ callbackUrl: "/login" }) }}
                                            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-[13px] font-black text-white bg-black hover:bg-[#FF00FF] border-[2px] border-black rounded-xl transition-all uppercase tracking-wider"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    )
}
