"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
    MapPin, Map, LogOut, LayoutDashboard, User as UserIcon, Globe, Shield,
    MessageSquareText, Menu, X, Flame, Package, Crown, Settings, ShoppingBag,
    Dices, BookOpen, ChevronDown, MoreHorizontal, Palette,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { NotificationDropdown } from "./NotificationDropdown"
import { openOnboardingGuide } from "./OnboardingGuide"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeSwitcherPopup } from "@/components/theme/ThemeSwitcher"

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
                    ? "border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)] text-[var(--mm-ink)]"
                    : "border-transparent text-[var(--mm-ink)] hover:border-[var(--mm-border)]"
            } ${className}`}
            style={active ? { backgroundColor: "var(--mm-secondary)" } : undefined}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--mm-primary)" }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
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
                        ? "border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)]"
                        : "border-transparent hover:border-[var(--mm-border)]"
                }`}
                style={{ padding: "3px 6px 3px 3px", ...(isOpen ? { backgroundColor: "var(--mm-primary)" } : {}) }}
            >
                <div className="w-8 h-8 border-[2px] border-[var(--mm-border)] overflow-hidden bg-[var(--mm-surface)] flex items-center justify-center shrink-0 rounded-lg">
                    {session.user.image ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-3.5 h-3.5 text-[var(--mm-ink)]" />
                    )}
                </div>
                <ChevronDown className={`w-3 h-3 text-[var(--mm-ink)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-[var(--mm-surface)] border-[3px] border-[var(--mm-border)] shadow-[6px_6px_0_var(--mm-shadow)] z-[200] py-2 rounded-2xl overflow-hidden"
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
                                            ? "border-[var(--mm-border)] text-[var(--mm-ink)]"
                                            : "text-[var(--mm-ink)] hover:border-[var(--mm-border)]"
                                    }`}
                                    style={{ backgroundColor: isActive ? "var(--mm-primary)" : undefined }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--mm-primary)" }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {item.label}
                                </Link>
                            )
                        })}
                        <div className="h-[2px] bg-black/15 mx-3 my-1" />
                        <button
                            onClick={() => { setIsOpen(false); signOut({ callbackUrl: "/login" }) }}
                            className="flex items-center gap-2.5 mx-1.5 px-3 py-2 text-[13px] font-bold text-[var(--mm-ink)] hover:bg-[var(--mm-ink)] hover:text-[var(--mm-surface)] transition-all w-[calc(100%-12px)] border-[2px] border-transparent rounded-xl hover:border-[var(--mm-border)]"
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
                    ? `border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)] text-[var(--mm-ink)]`
                    : "text-[var(--mm-ink)] hover:border-[var(--mm-border)]"
            }`}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--mm-primary)" }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
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
                    ? "border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)] text-[var(--mm-ink)]"
                    : "border-[var(--mm-border)]/15 hover:border-[var(--mm-border)] text-[var(--mm-ink)]/80 hover:text-[var(--mm-ink)]"
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
        <p className="text-[10px] font-black uppercase tracking-[0.15em] px-1 pt-3 pb-1" style={{ color: "var(--mm-ink-muted)" }}>
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
    const [isThemePopupOpen, setIsThemePopupOpen] = useState(false)
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
                        boxShadow: "4px 4px 0px var(--mm-shadow)",
                        borderColor: "var(--mm-border)",
                        backgroundColor: scrolled ? "var(--mm-surface)" : "var(--mm-bg-95)",
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative border-[3px] border-[var(--mm-border)] rounded-2xl shadow-[4px_4px_0_var(--mm-shadow)] transition-colors"
                >
                    <div className="flex items-center justify-between h-[56px] px-4" style={{ minWidth: 0 }}>

                        {/* ── LEFT: Logo ──────────────────────────────── */}
                        <Link href="/" className="flex items-center gap-2 group shrink-0">
                            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                                <div className="absolute inset-0 bg-[var(--mm-primary)] border-[3px] border-[var(--mm-border)] rounded-lg group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[3px_3px_0_var(--mm-shadow)] transition-all duration-200" />
                                <MapPin className="relative w-3.5 h-3.5 text-[var(--mm-ink)] z-10" />
                            </div>
                            <span className="font-black text-[18px] font-[Outfit] text-[var(--mm-ink)] tracking-tight">
                                Memory<span className="text-[var(--mm-accent)]">Map</span>
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
                                className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold border-[2px] border-transparent rounded-xl text-[var(--mm-ink)] hover:bg-[var(--mm-lime)] hover:border-[var(--mm-border)] transition-all"
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
                            {/* Theme Selector Button */}
                            <button
                                onClick={() => setIsThemePopupOpen(true)}
                                className="flex items-center justify-center w-10 h-10 border-[3px] border-transparent rounded-xl transition-all relative bg-[var(--mm-surface)] hover:border-[var(--mm-border)] text-[var(--mm-ink)] hover:bg-[var(--mm-primary)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--mm-shadow)] cursor-pointer shrink-0"
                                title="Ubah Tema"
                            >
                                <Palette className="w-5 h-5" />
                            </button>

                            {session?.user ? (
                                <>
                                    {/* Premium — compact */}
                                    <Link
                                        href="/premium"
                                        data-tutorial="nav-premium"
                                        className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-black border-[2px] rounded-xl transition-all uppercase tracking-wider ${
                                            pathname === "/premium"
                                                ? "border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)] text-[var(--mm-ink)]"
                                                : isPremium
                                                    ? "border-[var(--mm-border)] text-[var(--mm-ink)] hover:shadow-[2px_2px_0_var(--mm-shadow)]"
                                                    : "bg-[var(--mm-surface)] border-[var(--mm-border)] text-[var(--mm-ink)] hover:shadow-[2px_2px_0_var(--mm-shadow)]"
                                        }`}
                                        style={{
                                            backgroundColor: pathname === "/premium" ? "var(--mm-primary)"
                                                : isPremium ? "color-mix(in srgb, var(--mm-primary) 30%, transparent)" : undefined
                                        }}
                                        onMouseEnter={e => {
                                            if (pathname !== "/premium") {
                                                (e.currentTarget as HTMLElement).style.backgroundColor = isPremium ? "var(--mm-primary)" : "var(--mm-lime)"
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (pathname !== "/premium") {
                                                (e.currentTarget as HTMLElement).style.backgroundColor = isPremium ? "color-mix(in srgb, var(--mm-primary) 30%, transparent)" : "var(--mm-surface)"
                                            }
                                        }}
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
                                    <Link href="/login" className="hidden sm:block px-3 py-1.5 text-[13px] font-bold text-[var(--mm-ink)] hover:bg-[var(--mm-secondary)] border-[2px] border-transparent hover:border-[var(--mm-border)] transition-all rounded-xl">
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-[13px] font-black text-[var(--mm-ink)] bg-[var(--mm-primary)] border-[3px] border-[var(--mm-border)] shadow-[3px_3px_0_var(--mm-shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--mm-shadow)] transition-all uppercase tracking-wide rounded-xl"
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
                                    className="flex md:hidden items-center justify-center w-8 h-8 border-[2px] border-[var(--mm-border)] overflow-hidden bg-[var(--mm-surface)] hover:shadow-[2px_2px_0_var(--mm-shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all rounded-lg"
                                >
                                    {session.user.image ? (
                                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-3.5 h-3.5 text-[var(--mm-ink)]" />
                                    )}
                                </Link>
                            )}

                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                data-tutorial="mobile-menu-button"
                                className="flex md:hidden items-center justify-center w-9 h-9 text-[var(--mm-ink)] hover:bg-[var(--mm-primary)] border-[2px] border-transparent rounded-lg hover:border-[var(--mm-border)] transition-all"
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
                                className="border-[3px] border-[var(--mm-border)] bg-[var(--mm-surface)] rounded-3xl shadow-[6px_6px_0_var(--mm-shadow)] flex flex-col overflow-hidden"
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
                                        <DrawerItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} tutorialId="mobile-nav-dashboard" onClick={close} accent="var(--mm-secondary)" />
                                        <DrawerItem href="/map" icon={Map} label="Map" active={pathname === "/map"} tutorialId="mobile-nav-map" onClick={close} accent="var(--mm-secondary)" />
                                        <DrawerItem href="/community" icon={Globe} label="Community" active={pathname === "/community"} tutorialId="mobile-nav-community" onClick={close} accent="var(--mm-secondary)" />
                                        <DrawerItem href="/streak" icon={Flame} label="Streak" active={pathname === "/streak"} tutorialId="mobile-nav-streak" onClick={close} accent="var(--mm-primary)" />
                                    </div>

                                    {session?.user && (
                                        <>
                                            {/* SECTION: AKUN */}
                                            <SectionTitle>AKUN</SectionTitle>
                                            <div className="space-y-0.5">
                                                <DrawerItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} tutorialId="mobile-nav-settings" onClick={close} accent="var(--mm-accent)" />
                                                <DrawerItem href="/inventory" icon={Package} label="Inventori" active={pathname === "/inventory"} tutorialId="mobile-nav-inventory" onClick={close} accent="var(--mm-accent)" />
                                            </div>

                                            {/* SECTION: FITUR — 2-column grid */}
                                            <SectionTitle>FITUR</SectionTitle>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <GridItem href="/shop" icon={ShoppingBag} label="Shop" active={pathname === "/shop"} tutorialId="mobile-nav-shop" onClick={close} accent="var(--mm-secondary)" />
                                                <GridItem href="/gacha" icon={Dices} label="Gacha" active={pathname === "/gacha"} tutorialId="mobile-nav-gacha" onClick={close} accent="var(--mm-accent)" />
                                                <button
                                                    onClick={() => { close(); openOnboardingGuide() }}
                                                    data-tutorial="mobile-nav-guide"
                                                    className="flex flex-col items-center justify-center gap-1.5 py-3 text-[11px] font-black uppercase tracking-wide border-[2px] border-[var(--mm-border)]/15 hover:border-[var(--mm-border)] text-[var(--mm-ink)]/80 hover:text-[var(--mm-ink)] transition-all rounded-xl"
                                                    style={{ backgroundColor: "color-mix(in srgb, var(--mm-lime) 25%, transparent)" }}
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                    Panduan
                                                </button>
                                                <GridItem href="/premium" icon={Crown} label={isPremium ? "PRO ✦" : "Premium"} active={pathname === "/premium"} tutorialId="mobile-nav-premium" onClick={close} accent="var(--mm-primary)" />
                                            </div>

                                            {/* SECTION: BANTUAN */}
                                            <SectionTitle>BANTUAN</SectionTitle>
                                            <div className="space-y-0.5">
                                                <DrawerItem href="/feedbacks" icon={MessageSquareText} label="Pusat Bantuan" active={pathname === "/feedbacks"} tutorialId="mobile-nav-help" onClick={close} accent="var(--mm-lime)" />
                                            </div>

                                            {/* Admin */}
                                            {session.user.role === "ADMIN" && (
                                                <>
                                                    <SectionTitle>ADMIN</SectionTitle>
                                                    <DrawerItem href="/admin" icon={Shield} label="Admin Panel" active={pathname.startsWith("/admin")} onClick={close} accent="var(--mm-accent)" />
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* SECTION: TAMPILAN */}
                                    <SectionTitle>TAMPILAN</SectionTitle>
                                    <div className="space-y-0.5">
                                        <button
                                            onClick={() => { close(); setIsThemePopupOpen(true); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold border-[2px] border-[var(--mm-border)] rounded-xl transition-all text-[var(--mm-ink)] hover:bg-[var(--mm-primary)] shadow-[2px_2px_0_var(--mm-shadow)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--mm-shadow)] bg-[var(--mm-surface)] cursor-pointer text-left"
                                        >
                                            <Palette className="w-[18px] h-[18px] shrink-0" />
                                            Ganti Tema Warna
                                        </button>
                                    </div>

                                    {!session?.user && (
                                        <div className="space-y-2 pt-3">
                                            <Link href="/login" onClick={close} className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold text-[var(--mm-ink)] hover:bg-[var(--mm-secondary)] border-[2px] border-transparent hover:border-[var(--mm-border)] transition-all rounded-xl">
                                                <UserIcon className="w-[18px] h-[18px] shrink-0" />
                                                Sign In
                                            </Link>
                                            <Link
                                                href="/register"
                                                onClick={close}
                                                className="w-full inline-flex items-center justify-center py-2.5 text-[14px] font-black text-[var(--mm-ink)] bg-[var(--mm-primary)] border-[3px] border-[var(--mm-border)] shadow-[3px_3px_0_var(--mm-shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--mm-shadow)] transition-all uppercase rounded-xl"
                                            >
                                                Mulai Gratis
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* ── Sign Out — sticky bottom ────────────── */}
                                {session?.user && (
                                    <div className="shrink-0 border-t-[3px] border-[var(--mm-border)] px-3 py-2">
                                        <button
                                            onClick={() => { close(); signOut({ callbackUrl: "/login" }) }}
                                            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-[13px] font-black text-[var(--mm-surface)] bg-[var(--mm-ink)] hover:bg-[var(--mm-accent)] border-[2px] border-[var(--mm-border)] rounded-xl transition-all uppercase tracking-wider"
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

                <ThemeSwitcherPopup
                    isOpen={isThemePopupOpen}
                    onClose={() => setIsThemePopupOpen(false)}
                />
            </div>
        </nav>
    )
}
