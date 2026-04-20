"use client"

import Link from "next/link"
import { MapPin, Twitter, Instagram, Github, Heart } from "lucide-react"

interface LandingFooterProps {
  scrollToSection: (e: React.MouseEvent, id: string) => void
  onPrivacyOpen: () => void
  onTermsOpen: () => void
  onChangelogOpen: () => void
  onContactOpen: () => void
  onBlogOpen: () => void
  onMobileAppOpen: () => void
}

export function LandingFooter({
  scrollToSection,
  onPrivacyOpen,
  onTermsOpen,
  onChangelogOpen,
  onContactOpen,
  onBlogOpen,
  onMobileAppOpen,
}: LandingFooterProps) {
  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Github, href: "#", label: "GitHub" },
  ]

  return (
    <footer className="relative border-t border-white/[0.06] overflow-hidden" style={{ background: "rgba(8,8,16,0.95)" }}>
      {/* Top Gradient Line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }}
      />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 mb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group inline-flex">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center rotate-[-8deg] group-hover:rotate-0 transition-all duration-300 shadow-lg shadow-indigo-500/30">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-2xl font-[Outfit] text-white tracking-tight">
                Memory<span className="text-indigo-400">Map</span>
              </span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-8">
              Platform jurnal visual interaktif yang membantu Anda mengabadikan, membagikan, dan mengenang setiap momen berharga tepat di lokasi ia terjadi.
            </p>
            <div className="flex items-center gap-4 mt-8">
              {socialLinks.map((social, i) => {
                const Icon = social.icon
                return (
                  <a
                    key={i}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Produk */}
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-[13px] font-[Outfit]">Produk</h4>
              <ul className="space-y-3.5 flex flex-col items-start">
                <li>
                  <button onClick={(e) => scrollToSection(e, "features")} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors text-left">Fitur</button>
                </li>
                <li>
                  <button onClick={(e) => scrollToSection(e, "how-it-works")} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors text-left">Cara Kerja</button>
                </li>
                <li>
                  <button onClick={(e) => scrollToSection(e, "map")} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors text-left">Jelajahi Peta</button>
                </li>
                <li>
                  <button onClick={() => onMobileAppOpen()} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Aplikasi Mobile</button>
                </li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-[13px] font-[Outfit]">Perusahaan</h4>
              <ul className="space-y-3.5 flex flex-col items-start">
                <li className="w-full">
                  <a href="#" className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Tentang Kami</a>
                </li>
                <li className="w-full">
                  <button onClick={() => onBlogOpen()} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Blog</button>
                </li>
                <li className="w-full">
                  <button onClick={() => onContactOpen()} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Kontak</button>
                </li>
              </ul>
            </div>

            {/* Sumber Daya */}
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-[13px] font-[Outfit]">Sumber Daya</h4>
              <ul className="space-y-3.5 flex flex-col items-start">
                <li className="w-full">
                  <a href="#" className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Komunitas</a>
                </li>
                <li className="w-full">
                  <button onClick={() => onChangelogOpen()} className="text-[14px] text-neutral-500 hover:text-indigo-400 transition-colors block text-left">Status Sistem</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} MemoryMap Inc. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6">
            <button onClick={onPrivacyOpen} className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors">Kebijakan Privasi</button>
            <button onClick={onTermsOpen} className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors">Ketentuan Layanan</button>
            <a href="#" className="text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors">Pengaturan Cookie</a>
          </div>
          <div className="text-[13px] text-neutral-600 lg:flex items-center gap-2 hidden">
            Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" /> di Indonesia
          </div>
        </div>
      </div>
    </footer>
  )
}
