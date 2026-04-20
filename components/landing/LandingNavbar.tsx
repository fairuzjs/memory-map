"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin, X, Menu } from "lucide-react"
import { useSession } from "next-auth/react"
import { NotificationDropdown } from "@/components/layout/NotificationDropdown"

interface LandingNavbarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  scrollToSection: (e: React.MouseEvent, id: string) => void
}

export function LandingNavbar({ isMobileMenuOpen, setIsMobileMenuOpen, scrollToSection }: LandingNavbarProps) {
  const { data: session } = useSession()

  const navItems = [
    { label: "Fitur", id: "features" },
    { label: "Cara Kerja", id: "how-it-works" },
    { label: "Jelajahi", id: "map" },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300">
      {/* Glassmorphism Background */}
      <div
        className="absolute inset-0 backdrop-blur-xl border-b border-white/[0.08]"
        style={{ background: "rgba(8,8,16,0.7)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)" }}
      />
      {/* Subtle Bottom Gradient Line */}
      <div
        className="absolute bottom-0 left-0 w-full h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-indigo-500/30" />
              <MapPin className="relative w-5 h-5 text-white z-10" />
            </div>
            <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
              Memory<span className="text-indigo-400">Map</span>
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={(e) => scrollToSection(e, item.id)}
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            {session?.user ? (
              <>
                <NotificationDropdown />
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold text-white
                             border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm shadow-sm"
                >
                  <img
                    src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                    className="w-6 h-6 rounded-full border border-indigo-400/40"
                    alt="User avatar"
                  />
                  <span className="inline">{session.user.name}</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="sm:hidden flex items-center justify-center relative w-9 h-9 rounded-full border border-white/10 bg-white/5"
                >
                  <img
                    src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}
                    className="w-full h-full rounded-full object-cover"
                    alt="User avatar"
                  />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/[0.05] transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="relative hidden md:inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden group shadow-lg shadow-indigo-500/20"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  <span className="relative">Mulai Gratis</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/[0.06] bg-[#0c0c16]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-6 flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false)
                    setTimeout(() => scrollToSection(e, item.id), 150)
                  }}
                  className="text-left px-4 py-3 text-[15px] font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                >
                  {item.label}
                </button>
              ))}
              {!session?.user && (
                <Link
                  href="/register"
                  className="mt-4 w-full relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-white overflow-hidden shadow-lg shadow-indigo-500/20"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="relative">Mulai Gratis</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
