"use client"

import Link from "next/link"
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion"
import { MapPin, X, Menu } from "lucide-react"
import { useSession } from "next-auth/react"
import { NotificationDropdown } from "@/components/layout/NotificationDropdown"
import { useEffect, useState } from "react"

interface LandingNavbarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  scrollToSection: (e: React.MouseEvent, id: string) => void
}

export function LandingNavbar({ isMobileMenuOpen, setIsMobileMenuOpen, scrollToSection }: LandingNavbarProps) {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navItems = [
    { label: "Fitur", id: "features" },
    { label: "Cara Kerja", id: "how-it-works" },
    { label: "Jelajahi", id: "map" },
  ]

  return (
    <nav className="fixed top-0 w-full z-50">
      {/* Floating pill container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <motion.div
          animate={{
            backgroundColor: scrolled ? "rgba(10,10,16,0.85)" : "rgba(10,10,16,0)",
            borderColor: scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0)",
            boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)" : "none",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative rounded-2xl border backdrop-blur-xl overflow-visible"
        >
          {/* Subtle indigo accent line on top */}
          <motion.div
            animate={{ opacity: scrolled ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }}
          />

          <div className="flex items-center justify-between h-[64px] px-5">
            {/* ── Logo ─────────────────────────────────────────────────────── */}
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
              }}
            >
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-indigo-500/30" />
                <MapPin className="relative w-4 h-4 text-white z-10" />
              </div>
              <span className="font-extrabold text-[20px] font-[Outfit] text-white tracking-tight">
                Memory<span className="text-indigo-400">Map</span>
              </span>
            </Link>

            {/* ── Nav Links (desktop) ───────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-white rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ── Auth ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {session?.user ? (
                <>
                  <NotificationDropdown />
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold text-white
                               border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                  >
                    <img
                      src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                      className="w-6 h-6 rounded-full border border-indigo-400/40"
                      alt="User avatar"
                    />
                    <span>{session.user.name}</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden"
                  >
                    <img
                      src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                      className="w-full h-full object-cover"
                      alt="User avatar"
                    />
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors shadow-[0_0_20px_-6px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-4px_rgba(255,255,255,0.4)]"
                  >
                    Mulai Gratis
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMobileMenuOpen ? (
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

        {/* ── Mobile Dropdown ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden mt-2"
            >
              <div
                className="rounded-2xl border border-white/[0.07] backdrop-blur-xl px-4 py-4 flex flex-col gap-1"
                style={{ background: "rgba(10,10,16,0.95)" }}
              >
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false)
                      setTimeout(() => scrollToSection(e, item.id), 150)
                    }}
                    className="text-left px-4 py-3 text-[15px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                {!session?.user && (
                  <>
                    <div className="h-px bg-white/[0.06] my-2 mx-2" />
                    <Link
                      href="/register"
                      className="w-full inline-flex items-center justify-center py-3 rounded-xl text-[15px] font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
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
