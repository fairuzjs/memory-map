"use client"

import { useEffect, useState } from "react"
import { LandingNavbar }     from "@/components/landing/LandingNavbar"
import { LandingHero }       from "@/components/landing/LandingHero"
import { LandingMapPreview } from "@/components/landing/LandingMapPreview"
import { LandingStatsStrip } from "@/components/landing/LandingStatsStrip"
import { LandingFeatures }   from "@/components/landing/LandingFeatures"
import { LandingCTABanner }  from "@/components/landing/LandingCTABanner"
import { LandingFooter }     from "@/components/landing/LandingFooter"
import { LandingModals }     from "@/components/landing/LandingModals"
import { WelcomePopup }      from "@/components/landing/WelcomePopup"
import { HowItWorksTimeline } from "@/components/landing/HowItWorksTimeline"

// ─── Types ────────────────────────────────────────────────────────────────────
interface PublicMemory {
  id: string
  title: string
  date: string
  latitude: number
  longitude: number
  [key: string]: unknown
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [memories, setMemories] = useState<PublicMemory[]>([])
  const [loading, setLoading]   = useState(true)

  // Modal states
  const [isPrivacyOpen,   setIsPrivacyOpen]   = useState(false)
  const [isTermsOpen,     setIsTermsOpen]     = useState(false)
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)
  const [isContactOpen,   setIsContactOpen]   = useState(false)
  const [isMobileAppOpen, setIsMobileAppOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Welcome popup
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const hideUntil = localStorage.getItem("mm_welcome_hide_until")
    if (hideUntil && Date.now() < parseInt(hideUntil, 10)) return
    if (hideUntil) localStorage.removeItem("mm_welcome_hide_until")

    const timer = setTimeout(() => setIsWelcomeOpen(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Fetch public memories for the globe
  useEffect(() => {
    fetch("/api/memories?public=true&limit=100&page=1")
      .then((res) => res.json())
      .then((res) => {
        // API returns paginated shape { data: Memory[] } when ?page= is present
        const list = Array.isArray(res) ? res : (res.data ?? [])
        setMemories(list)
      })
      .catch(() => setMemories([]))
      .finally(() => setLoading(false))
  }, [])

  // Smooth scroll helper
  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const offset = 80
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0] overflow-hidden relative selection:bg-[#FFFF00] selection:text-black">

      {/* ── Neubrutalism Background ───────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Bold grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px),
                              linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
            backgroundSize: "80px 80px",
          }}
        />
        {/* Decorative geometric shapes */}
        <div className="absolute top-[10%] right-[5%] w-24 h-24 border-[3px] border-black/[0.06] rotate-12" />
        <div className="absolute top-[40%] left-[3%] w-16 h-16 rounded-full border-[3px] border-black/[0.05]" />
        <div className="absolute bottom-[15%] right-[10%] w-20 h-20 border-[3px] border-black/[0.04] rotate-45" />
        <div className="absolute top-[70%] left-[8%] w-12 h-12 bg-[#FFFF00]/[0.06] border-[3px] border-black/[0.04]" />
        <div className="absolute top-[25%] left-[50%] w-8 h-8 rounded-full bg-[#FF00FF]/[0.05]" />
        <div className="absolute bottom-[40%] right-[25%] w-14 h-14 rounded-full border-[3px] border-black/[0.03]" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <LandingNavbar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        scrollToSection={scrollToSection}
      />

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="relative z-10">
        <LandingHero />
        <LandingMapPreview memories={memories} loading={loading} />
        <LandingStatsStrip />
        <LandingFeatures />

        <section id="how-it-works" className="px-4 pb-32">
          <HowItWorksTimeline />
        </section>

        <LandingCTABanner />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <LandingFooter
        scrollToSection={scrollToSection}
        onPrivacyOpen={() => setIsPrivacyOpen(true)}
        onTermsOpen={() => setIsTermsOpen(true)}
        onChangelogOpen={() => setIsChangelogOpen(true)}
        onContactOpen={() => setIsContactOpen(true)}
        onMobileAppOpen={() => setIsMobileAppOpen(true)}
      />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <LandingModals
        isPrivacyOpen={isPrivacyOpen}
        isTermsOpen={isTermsOpen}
        isChangelogOpen={isChangelogOpen}
        isContactOpen={isContactOpen}
        isMobileAppOpen={isMobileAppOpen}
        onPrivacyClose={() => setIsPrivacyOpen(false)}
        onTermsClose={() => setIsTermsOpen(false)}
        onChangelogClose={() => setIsChangelogOpen(false)}
        onContactClose={() => setIsContactOpen(false)}
        onMobileAppClose={() => setIsMobileAppOpen(false)}
      />

      {/* ── Welcome Popup ──────────────────────────────────────────────────── */}
      <WelcomePopup
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onDontShowAgain={() => {
          setIsWelcomeOpen(false)
          localStorage.setItem("mm_welcome_hide_until", String(Date.now() + 60 * 60 * 1000))
        }}
      />

    </div>
  )
}
