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
    <div className="min-h-screen bg-[#080810] overflow-hidden relative selection:bg-indigo-500/30">

      {/* ── Ambient Background ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-indigo-600/[0.08] rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-indigo-500/[0.05] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
        />
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
