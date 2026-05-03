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
    <footer className="relative overflow-hidden bg-black">
      {/* Top accent border */}
      <div className="h-[4px] bg-[#FFFF00]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8 mb-14">

          {/* ── Brand Column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-white group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[3px_3px_0_#FFFF00] transition-all" />
                <MapPin className="relative w-4 h-4 text-black z-10" />
              </div>
              <span className="font-black text-[20px] font-[Outfit] text-white tracking-tight">
                Memory<span className="text-[#FFFF00]">Map</span>
              </span>
            </Link>

            <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-8 font-medium">
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
                    className="w-9 h-9 border-[3px] border-white/30 bg-transparent flex items-center justify-center text-white/60 hover:text-black hover:bg-[#FFFF00] hover:border-[#FFFF00] transition-all"
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
              <h4 className="text-[11px] font-black text-[#FFFF00] uppercase tracking-[0.15em] mb-5 font-[Outfit]">Produk</h4>
              <ul className="space-y-3.5">
                <li>
                  <button onClick={(e) => scrollToSection(e, "features")} className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Fitur
                  </button>
                </li>
                <li>
                  <button onClick={(e) => scrollToSection(e, "how-it-works")} className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Cara Kerja
                  </button>
                </li>
                <li>
                  <button onClick={(e) => scrollToSection(e, "map")} className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Jelajahi Peta
                  </button>
                </li>
                <li>
                  <button onClick={onMobileAppOpen} className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Aplikasi Mobile
                  </button>
                </li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <h4 className="text-[11px] font-black text-[#FFFF00] uppercase tracking-[0.15em] mb-5 font-[Outfit]">Perusahaan</h4>
              <ul className="space-y-3.5">
                <li>
                  <a href="#" className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <button onClick={onContactOpen} className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Kontak
                  </button>
                </li>
              </ul>
            </div>

            {/* Sumber Daya */}
            <div>
              <h4 className="text-[11px] font-black text-[#FFFF00] uppercase tracking-[0.15em] mb-5 font-[Outfit]">Sumber Daya</h4>
              <ul className="space-y-3.5">
                <li>
                  <a href="#" className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Komunitas
                  </a>
                </li>
                <li>
                  <button onClick={onChangelogOpen} className="text-[13px] text-white/60 hover:text-[#FFFF00] transition-colors font-medium">
                    Changelog
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ────────────────────────────────────────────────── */}
        <div className="pt-8 border-t-[3px] border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/40 order-2 md:order-1 font-medium">
            © {new Date().getFullYear()} MemoryMap. Hak cipta dilindungi.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 order-1 md:order-2">
            <button onClick={onPrivacyOpen} className="text-[12px] text-white/40 hover:text-[#FFFF00] transition-colors font-medium">
              Kebijakan Privasi
            </button>
            <button onClick={onTermsOpen} className="text-[12px] text-white/40 hover:text-[#FFFF00] transition-colors font-medium">
              Ketentuan Layanan
            </button>
            <a href="#" className="text-[12px] text-white/40 hover:text-[#FFFF00] transition-colors font-medium">
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
