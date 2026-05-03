"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <motion.div
          animate={{
            boxShadow: scrolled
              ? "4px 4px 0px #000"
              : "none",
            borderColor: scrolled ? "#000" : "transparent",
            backgroundColor: scrolled ? "#FFFFFF" : "rgba(255,253,240,0.95)",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative border-[3px] bg-white"
        >
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
                <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-black group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[4px_4px_0_#000] transition-all duration-200" />
                <MapPin className="relative w-4 h-4 text-black z-10" />
              </div>
              <span className="font-black text-[20px] font-[Outfit] text-black tracking-tight">
                Memory<span className="text-[#FF00FF]">Map</span>
              </span>
            </Link>

            {/* ── Nav Links (desktop) ───────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="px-4 py-2 text-sm font-bold text-black hover:bg-[#FFFF00] border-2 border-transparent hover:border-black transition-all cursor-pointer"
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
                    className="hidden sm:flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-black
                               border-[3px] border-black bg-white hover:bg-[#00FFFF] shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all"
                  >
                    <img
                      src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                      className="w-6 h-6 border-2 border-black"
                      alt="User avatar"
                    />
                    <span>{session.user.name}</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="sm:hidden flex items-center justify-center w-9 h-9 border-[3px] border-black bg-white overflow-hidden"
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
                    className="px-4 py-2 text-sm font-bold text-black hover:bg-[#00FFFF] border-2 border-transparent hover:border-black transition-all"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:inline-flex items-center justify-center px-5 py-2 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all uppercase tracking-wide"
                  >
                    Mulai Gratis
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-black hover:bg-[#FFFF00] border-2 border-transparent hover:border-black transition-all"
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
              <div className="border-[3px] border-black bg-white shadow-[4px_4px_0_#000] px-4 py-4 flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false)
                      setTimeout(() => scrollToSection(e, item.id), 150)
                    }}
                    className="text-left px-4 py-3 text-[15px] font-bold text-black hover:bg-[#FFFF00] border-2 border-transparent hover:border-black transition-all"
                  >
                    {item.label}
                  </button>
                ))}
                {!session?.user && (
                  <>
                    <div className="h-[3px] bg-black my-2" />
                    <Link
                      href="/register"
                      className="w-full inline-flex items-center justify-center py-3 text-[15px] font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] transition-all uppercase"
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
