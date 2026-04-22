"use client"

import Link from "next/link"
import { MapPin, Twitter, Instagram, Github } from "lucide-react"

interface LandingFooterProps {
  scrollToSection: (e: React.MouseEvent, id: string) => void
  onPrivacyOpen: () => void
  onTermsOpen: () => void
  onChangelogOpen: () => void
  onContactOpen: () => void
  onMobileAppOpen: () => void
}

export function LandingFooter({
  scrollToSection,
  onPrivacyOpen,
  onTermsOpen,
  onChangelogOpen,
  onContactOpen,
  onMobileAppOpen,
}: LandingFooterProps) {
  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "https://www.instagram.com/draafrzz_", label: "Instagram" },
    { icon: Github, href: "#", label: "GitHub" },
  ]

  return (
    <footer className="relative overflow-hidden" style={{ background: "rgba(8,8,14,0.98)" }}>
      {/* Top separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.2) 30%, rgba(99,102,241,0.2) 70%, transparent 100%)" }}
      />

      {/* Faint top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(99,102,241,0.07) 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8 mb-14">

          {/* ── Brand Column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 shadow-lg shadow-indigo-500/30" />
                <MapPin className="relative w-4 h-4 text-white z-10" />
              </div>
              <span className="font-extrabold text-[20px] font-[Outfit] text-white tracking-tight">
                Memory<span className="text-indigo-400">Map</span>
              </span>
            </Link>

            <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mb-8 font-light">
              Platform jurnal visual yang membantu Anda mengabadikan setiap momen berharga tepat di lokasi ia terjadi.
            </p>

            <div className="flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-xl border border-white/[0.07] bg-white/[0.03] flex items-center justify-center text-neutral-600 hover:text-white hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* ── Link Columns ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Produk */}
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.15em] mb-5 font-[Outfit]">Produk</h4>
              <ul className="space-y-3.5">
                <li>
                  <button onClick={(e) => scrollToSection(e, "features")} className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Fitur
                  </button>
                </li>
                <li>
                  <button onClick={(e) => scrollToSection(e, "how-it-works")} className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Cara Kerja
                  </button>
                </li>
                <li>
                  <button onClick={(e) => scrollToSection(e, "map")} className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Jelajahi Peta
                  </button>
                </li>
                <li>
                  <button onClick={onMobileAppOpen} className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Aplikasi Mobile
                  </button>
                </li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.15em] mb-5 font-[Outfit]">Perusahaan</h4>
              <ul className="space-y-3.5">
                <li>
                  <a href="#" className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <button onClick={onContactOpen} className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Kontak
                  </button>
                </li>
              </ul>
            </div>

            {/* Sumber Daya */}
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.15em] mb-5 font-[Outfit]">Sumber Daya</h4>
              <ul className="space-y-3.5">
                <li>
                  <a href="#" className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Komunitas
                  </a>
                </li>
                <li>
                  <button onClick={onChangelogOpen} className="text-[13px] text-neutral-600 hover:text-indigo-400 transition-colors">
                    Changelog
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ────────────────────────────────────────────────── */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-neutral-700 order-2 md:order-1">
            © {new Date().getFullYear()} MemoryMap. Hak cipta dilindungi.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 order-1 md:order-2">
            <button onClick={onPrivacyOpen} className="text-[12px] text-neutral-700 hover:text-neutral-400 transition-colors">
              Kebijakan Privasi
            </button>
            <button onClick={onTermsOpen} className="text-[12px] text-neutral-700 hover:text-neutral-400 transition-colors">
              Ketentuan Layanan
            </button>
            <a href="#" className="text-[12px] text-neutral-700 hover:text-neutral-400 transition-colors">
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
