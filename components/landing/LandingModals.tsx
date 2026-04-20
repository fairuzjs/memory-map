"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  X, Activity, Shield, Server, Zap, Globe, Users, GitBranch,
  Star, Sparkles, Bug, Palette, MapPin, Lock, Headphones, MessageCircle,
  Clock, Phone, Mail, Share2, Twitter, Instagram, Github, Smartphone,
  Bell, BookOpen, Heart, ImagePlus, ArrowRight, Loader2, Play, SkipForward
} from "lucide-react"
import { useEffect, useState } from "react"

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    const duration = 2000
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(value * easeOut)
      if (progress < 1) requestAnimationFrame(animate)
      else setDisplayValue(value)
    }
    requestAnimationFrame(animate)
  }, [value])

  const formatted = value % 1 !== 0 ? displayValue.toFixed(1) : Math.round(displayValue).toString()
  return <>{formatted}{suffix}</>
}

// ─── Shared Modal Wrapper ──────────────────────────────────────────────────────
function ModalWrapper({
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col`}
        style={{ background: "rgba(12, 12, 22, 0.95)" }}
      >
        {children}
      </motion.div>
    </div>
  )
}

function ModalHeader({ title, onClose, icon }: { title: string; onClose: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
      {icon ? (
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-xl font-bold text-white font-[Outfit]">{title}</h3>
        </div>
      ) : (
        <h3 className="text-xl font-bold text-white font-[Outfit]">{title}</h3>
      )}
      <button
        onClick={onClose}
        className="p-2 -mr-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

// ─── Privacy Modal ─────────────────────────────────────────────────────────────
function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Kebijakan Privasi" onClose={onClose} />
      <div className="p-6 overflow-y-auto custom-scrollbar text-neutral-300 text-sm leading-relaxed space-y-6">
        <div>
          <h4 className="text-white font-semibold mb-2">1. Pengumpulan Informasi</h4>
          <p>Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami saat Anda membuat akun, memposting kenangan, atau berkomunikasi dengan kami. Informasi ini dapat mencakup nama pengguna, alamat email, foto, teks kenangan, dan data lokasi geografis (koordinat peta) yang Anda sertakan pada setiap memori Anda.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">2. Penggunaan Informasi</h4>
          <p>Informasi yang kami kumpulkan digunakan untuk menyediakan, memelihara, dan meningkatkan layanan MemoryMap, termasuk untuk memetakan kenangan Anda secara akurat, menampilkan profil Anda, dan memungkinkan fitur sosial jika Anda memilih untuk membuat kenangan Anda menjadi publik.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">3. Keamanan Data</h4>
          <p>Kami menerapkan langkah-langkah keamanan yang dirancang untuk melindungi informasi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, perlu diingat bahwa tidak ada sistem transmisi atau penyimpanan elektronik yang aman di internet secara absolut.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">4. Kontrol Pengguna</h4>
          <p>Anda selalu memiliki kendali atas kenangan yang Anda buat. Anda dapat mengatur privasi memori (publik atau privat), mengubah detail memori, atau menghapus akun dan seluruh data terkait kapan saja melalui pengaturan akun Anda.</p>
        </div>
        <p className="text-neutral-500 text-xs mt-8">
          Pembaruan Terakhir: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </ModalWrapper>
  )
}

// ─── Terms Modal ───────────────────────────────────────────────────────────────
function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Ketentuan Layanan" onClose={onClose} />
      <div className="p-6 overflow-y-auto custom-scrollbar text-neutral-300 text-sm leading-relaxed space-y-6">
        <div>
          <h4 className="text-white font-semibold mb-2">1. Penerimaan Syarat</h4>
          <p>Dengan mengakses atau menggunakan platform MemoryMap, Anda menyetujui untuk terikat dengan Ketentuan Layanan ini.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">2. Pengguna Akun</h4>
          <p>Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi dan akun Anda, serta sepenuhnya bertanggung jawab atas seluruh aktivitas yang terjadi menggunakan kata sandi atau akun Anda.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">3. Pedoman Konten</h4>
          <p>Anda setuju untuk tidak memposting, mengunggah, atau mendistribusikan kenangan yang mengandung materi yang:</p>
          <ul className="list-disc leading-relaxed pl-5 mt-2 space-y-1 text-neutral-400">
            <li>Ilegal, memfitnah, atau mengancam</li>
            <li>Melanggar hak cipta, merek dagang, atau kekayaan intelektual orang lain</li>
            <li>Mengandung virus atau kode komputer berbahaya</li>
            <li>Mempromosikan kebencian, kekerasan, atau diskriminasi</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">4. Hak Penghentian</h4>
          <p>Kami dapat menghentikan atau membekukan akun Anda segera, tanpa pemberitahuan sebelumnya, untuk alasan apa pun, termasuk tanpa batas jika Anda melanggar Ketentuan Layanan ini.</p>
        </div>
        <p className="text-neutral-500 text-xs mt-8">
          Pembaruan Terakhir: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </ModalWrapper>
  )
}

// ─── Changelog Modal ───────────────────────────────────────────────────────────
function ChangelogModal({ onClose }: { onClose: () => void }) {
  const metrics = [
    { icon: Server, label: "Uptime", value: 99.9, isNumber: true, suffix: "%", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15" },
    { icon: Zap, label: "Respons", value: 42, isNumber: true, suffix: "ms", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" },
    { icon: Globe, label: "API", value: "Aktif", isNumber: false, suffix: "", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/15" },
    { icon: Users, label: "Pengguna", value: "Online", isNumber: false, suffix: "", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/15" },
  ]

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader
        title="Status Sistem & Changelog"
        onClose={onClose}
        icon={
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-4 h-4 text-white" />
          </div>
        }
      />
      <div className="p-6 overflow-y-auto custom-scrollbar">
        {/* System Status */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <div className="relative">
                <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-40"></span>
                <Shield className="relative w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h4 className="text-emerald-300 font-bold text-[15px] mb-1.5 font-[Outfit]">Semua Sistem Berjalan Normal</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Layanan MemoryMap saat ini beroperasi dengan lancar tanpa ada gangguan yang dilaporkan. Kami terus memantau performa sistem secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <div key={i} className={`p-3.5 rounded-xl border ${metric.border} bg-white/[0.02] text-center`}>
                <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
                <p className={`text-lg font-bold ${metric.color} font-[Outfit]`}>
                  {metric.isNumber ? <AnimatedCounter value={metric.value as number} suffix={metric.suffix} /> : metric.value}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5 uppercase tracking-wider font-medium">{metric.label}</p>
              </div>
            )
          })}
        </div>

        {/* Changelog */}
        <div className="border-t border-white/[0.06] pt-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h4 className="text-white font-bold text-lg font-[Outfit]">Changelog Terbaru</h4>
            <span className="ml-auto px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-wider">Live</span>
          </div>

          <div className="relative space-y-3">
            <div className="absolute left-[19px] top-8 bottom-8 w-[1px] bg-gradient-to-b from-[#1DB954]/40 via-indigo-500/20 to-transparent pointer-events-none" />

            {/* V2.3 */}
            <div className="relative overflow-hidden rounded-2xl border border-[#1DB954]/30 p-5" style={{ background: "linear-gradient(135deg, rgba(29,185,84,0.06), rgba(0,0,0,0), rgba(29,185,84,0.03))" }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: "linear-gradient(180deg, #1DB954, rgba(29,185,84,0.2))" }} />
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-[#1DB954] bg-[#0a0f0a] shadow-[0_0_8px_rgba(29,185,84,0.6)]" />
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border" style={{ backgroundColor: "rgba(29,185,84,0.15)", color: "#1DB954", borderColor: "rgba(29,185,84,0.35)" }}>Terbaru</span>
                <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.3</span>
                <span className="text-[11px] text-neutral-500 ml-auto">April 2026</span>
              </div>
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                <h5 className="text-white font-bold text-[15px] font-[Outfit]">Spotify Music Integration</h5>
              </div>
              <div className="space-y-2 pl-1">
                {[
                  { text: "Integrasi Spotify API untuk mencari dan memilih lagu langsung dari platform.", tag: "Integrasi" },
                  { text: "Lampirkan lagu Spotify ke setiap kenangan untuk menciptakan soundtrack memorimu.", tag: "Fitur Baru" },
                  { text: "Pemutar Spotify Embed terintegrasi pada detail kenangan dan peta interaktif.", tag: "Fitur Baru" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.25)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#1DB954" }} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-neutral-300 leading-relaxed">{item.text}</span>
                      <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider" style={{ backgroundColor: "rgba(29,185,84,0.1)", color: "#1DB954" }}>{item.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* V2.2 */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-amber-500/40" />
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-amber-500/60 bg-[#0c0a06]" />
                <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.2</span>
                <span className="text-[11px] text-neutral-500 ml-auto">April 2026</span>
              </div>
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <h5 className="text-white font-bold text-[15px] font-[Outfit]">Sistem Memory Point</h5>
              </div>
              <div className="space-y-2 pl-1">
                {[
                  "Integrasi fitur Exchange Memory Point untuk menukar poin dengan item eksklusif.",
                  "Peluncuran fitur Topup Memory Point secara manual dengan konfirmasi admin.",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm text-neutral-300 leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* V2.1 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-sky-500/30" />
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-sky-500/40 bg-[#06090c]" />
                <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.1</span>
                <span className="text-[11px] text-neutral-500 ml-auto">Maret 2026</span>
              </div>
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <Users className="w-4 h-4 text-sky-400 shrink-0" />
                <h5 className="text-white font-bold text-[15px] font-[Outfit]">Fitur Komunitas & Peningkatan Performa</h5>
              </div>
              <div className="space-y-2 pl-1">
                {[
                  { icon: Globe, text: "Penambahan halaman jelajah real-time untuk melihat kenangan dari komunitas global.", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
                  { icon: Zap, text: "Optimasi kecepatan rendering peta interaktif hingga 30% lebih cepat pada perangkat mobile.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  { icon: Bug, text: "Perbaikan bug minor terkait sinkronisasi data profil pengguna.", color: "text-neutral-400", bg: "bg-white/[0.06]", border: "border-white/[0.08]" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0 mt-0.5`}>
                      <item.icon className={`w-3 h-3 ${item.color}`} />
                    </div>
                    <span className="text-sm text-neutral-400 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* V2.0 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-violet-500/30" />
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <div className="absolute left-[14px] w-[11px] h-[11px] rounded-full border-2 border-violet-500/40 bg-[#09060c]" />
                <span className="px-2.5 py-1 bg-white/[0.05] text-neutral-400 text-[10px] font-semibold rounded-full border border-white/[0.08] uppercase tracking-wider">v2.0</span>
                <span className="text-[11px] text-neutral-500 ml-auto">Februari 2026</span>
              </div>
              <div className="flex items-center gap-2.5 mb-3 pl-1">
                <Palette className="w-4 h-4 text-violet-400 shrink-0" />
                <h5 className="text-white font-bold text-[15px] font-[Outfit]">Desain Ulang Dashboard</h5>
              </div>
              <div className="space-y-2 pl-1">
                {[
                  { icon: Palette, text: "Pembaruan antarmuka pengguna secara menyeluruh dengan elemen glassmorphism.", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                  { icon: Sparkles, text: "Mode gelap cerdas (smart dark mode) dengan kontras yang disempurnakan.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0 mt-0.5`}>
                      <item.icon className={`w-3 h-3 ${item.color}`} />
                    </div>
                    <span className="text-sm text-neutral-400 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] text-center">
          <p className="text-sm text-neutral-300 mb-1">Ada kendala atau saran?</p>
          <p className="text-xs text-neutral-500">Hubungi tim dukungan kami melalui halaman Kontak untuk melaporkan masalah atau memberikan masukan.</p>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Contact Modal ─────────────────────────────────────────────────────────────
function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader
        title="Hubungi Kami"
        onClose={onClose}
        icon={
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Headphones className="w-4 h-4 text-white" />
          </div>
        }
      />
      <div className="p-6 overflow-y-auto custom-scrollbar">
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0 border border-sky-500/20">
              <MessageCircle className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sky-300 font-bold text-[15px] mb-1.5 font-[Outfit]">Kami Siap Membantu Anda</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Punya pertanyaan, masukan, atau kendala terkait MemoryMap? Tim dukungan kami siap membantu melalui berbagai saluran komunikasi di bawah ini.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <a href="mailto:support@memorymap.app" className="group relative overflow-hidden p-5 rounded-xl border border-indigo-500/15 bg-white/[0.02] hover:bg-indigo-500/[0.06] hover:border-indigo-500/25 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/15 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all">
                <Mail className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[15px] mb-1 font-[Outfit]">Email Dukungan</h4>
                <p className="text-indigo-400 text-sm font-medium">support@memorymap.app</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span className="text-[11px] text-neutral-500">Balasan dalam 1x24 jam kerja</span>
                </div>
              </div>
            </div>
          </a>
          <a href="https://wa.me/6285883917835" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden p-5 rounded-xl border border-emerald-500/15 bg-white/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/25 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/15 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                <Phone className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h4 className="text-white font-bold text-[15px] mb-1 font-[Outfit]">WhatsApp</h4>
                <p className="text-emerald-400 text-sm font-medium">+62 858 8391 7835</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span className="text-[11px] text-neutral-500">Senin - Jumat, 09:00 - 17:00 WIB</span>
                </div>
              </div>
            </div>
          </a>
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-4 h-4 text-violet-400" />
            <h4 className="text-white font-bold text-sm font-[Outfit] uppercase tracking-wider">Media Sosial</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Twitter, label: "Twitter", handle: "@memorymap_id", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/15" },
              { icon: Instagram, label: "Instagram", handle: "@memorymap.app", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/15" },
              { icon: Github, label: "GitHub", handle: "memorymap", color: "text-neutral-300", bg: "bg-white/[0.08]", border: "border-white/[0.1]" },
            ].map((social, i) => {
              const Icon = social.icon
              return (
                <a key={i} href="#" className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border ${social.border} bg-white/[0.02] hover:border-opacity-40 transition-all text-center`}>
                  <div className={`w-10 h-10 rounded-xl ${social.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${social.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{social.label}</p>
                    <p className={`text-[11px] ${social.color} mt-0.5`}>{social.handle}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Mobile App Modal ──────────────────────────────────────────────────────────
function MobileAppModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader
        title="Aplikasi Mobile"
        onClose={onClose}
        icon={
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
        }
      />
      <div className="p-6 overflow-y-auto custom-scrollbar">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 mb-8">
          <div className="flex items-start gap-4">
            <div>
              <h4 className="text-amber-300 font-bold text-[15px] mb-1.5 font-[Outfit]">Sedang Dalam Tahap Pengembangan</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Aplikasi mobile MemoryMap saat ini sedang dalam proses pengembangan aktif oleh tim kami. Kami akan menghadirkan pengalaman terbaik dalam mengabadikan kenangan langsung dari genggaman tangan Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-[60px] scale-90" />
              <div className="relative w-[240px] h-[490px] rounded-[2.5rem] border-[3px] border-white/[0.15] bg-[#0a0a14] shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#0a0a14] rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-[50px] h-[5px] bg-white/10 rounded-full" />
                </div>
                <div className="relative w-full h-full overflow-hidden">
                  <img src="/mobile-preview.png" alt="MemoryMap Mobile Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-[#0a0a14]/30" />
                  <div className="absolute top-[32px] left-0 right-0 px-5 flex items-center justify-between z-10">
                    <span className="text-[10px] text-white/70 font-semibold">9:41</span>
                  </div>
                  <div className="absolute top-[54px] left-0 right-0 px-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-white font-[Outfit]">MemoryMap</span>
                    </div>
                    <Bell className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c16]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-2.5 flex items-center justify-around z-10">
                    {[
                      { Icon: Globe, label: "Peta", active: true },
                      { Icon: BookOpen, label: "Jurnal", active: false },
                      { Icon: Heart, label: "Favorit", active: false },
                      { Icon: Users, label: "Profil", active: false },
                    ].map(({ Icon, label, active }, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : "text-white/30"}`} />
                        <span className={`text-[8px] font-medium ${active ? "text-indigo-400" : "text-white/30"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App info */}
          <div className="space-y-6">
            <div>
              <h4 className="text-2xl font-bold text-white font-[Outfit] mb-3 leading-tight">
                Kenangan di{" "}
                <span style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundImage: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", backgroundClip: "text" }}>
                  Genggamanmu
                </span>
              </h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Nikmati semua fitur MemoryMap langsung dari smartphone. Tandai kenangan di mana pun, kapan pun, bahkan saat offline.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: MapPin, text: "Tandai lokasi dengan GPS real-time", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                { icon: ImagePlus, text: "Ambil foto langsung dari kamera", color: "text-violet-400", bg: "bg-violet-500/10" },
                { icon: Bell, text: "Notifikasi push untuk interaksi", color: "text-sky-400", bg: "bg-sky-500/10" },
                { icon: Zap, text: "Mode offline — simpan lalu sync", color: "text-amber-400", bg: "bg-amber-500/10" },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className={`w-8 h-8 rounded-lg ${feature.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${feature.color}`} />
                    </div>
                    <span className="text-sm text-neutral-300">{feature.text}</span>
                  </div>
                )
              })}
            </div>
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Progress Pengembangan</span>
                <span className="text-xs font-bold text-indigo-400">20%</span>
              </div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "20%" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)" }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">Estimasi rilis: Q4 2026</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <p className="text-center text-neutral-500 text-sm mb-5">Segera tersedia di platform favoritmu</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group relative flex items-center gap-3 px-6 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] transition-all w-full sm:w-auto">
              <svg className="w-8 h-8 shrink-0" viewBox="0 0 512 512" fill="none">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="url(#play_g)"/>
                <defs><linearGradient id="play_g" x1="25.3" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4285F4"/><stop offset="25%" stopColor="#34A853"/><stop offset="50%" stopColor="#FBBC04"/><stop offset="100%" stopColor="#EA4335"/></linearGradient></defs>
              </svg>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider leading-none">Segera di</p>
                <p className="text-[15px] font-bold text-white leading-tight mt-0.5">Google Play</p>
              </div>
            </button>
            <button className="group relative flex items-center gap-3 px-6 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] transition-all w-full sm:w-auto">
              <svg className="w-8 h-8 shrink-0 text-white" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-46.8-42.3-83.6-45.8-35.3-3.5-73.8 20.6-88 20.6-15.2 0-48-19.4-73.4-19.4C76.4 140.5 0 186 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.9 59 127.2 107.2 125.7 25-0.6 42.7-18 75.3-18s46.3 18 77.8 17.4c49.1-0.8 89.7-82.3 101.9-119.3-65.2-30.7-96.9-90.4-97-91.8zM257.2 76.3c27.1-32.7 24.4-62.6 23.6-73.3-23.6 1.5-51 15.8-66.9 34.3-17.4 19.8-27.6 44.4-25.4 71.1 25.6 1.8 51.7-12.3 68.7-32.1z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider leading-none">Segera di</p>
                <p className="text-[15px] font-bold text-white leading-tight mt-0.5">App Store</p>
              </div>
            </button>
          </div>
          <div className="mt-6 p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] text-center">
            <p className="text-sm text-neutral-300 mb-1">Ingin jadi yang pertama tahu saat aplikasi rilis?</p>
            <p className="text-xs text-neutral-500">Ikuti akun sosial media kami untuk mendapatkan notifikasi peluncuran terbaru.</p>
          </div>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Blog Modal ────────────────────────────────────────────────────────────────
function BlogModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-4xl">
      <ModalHeader title="Blog MemoryMap" onClose={onClose} />
      <div className="p-6 overflow-y-auto custom-scrollbar">
        <div className="group relative rounded-2xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c16] via-[#0c0c16]/80 to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" alt="Featured Post" className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 z-20 w-full">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">Pengumuman</span>
              <span className="text-xs text-neutral-400">10 Maret 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-[Outfit] text-white mb-2 leading-tight">Memperkenalkan MemoryMap V2: Jurnal Interaktif Era Baru</h2>
            <p className="text-neutral-300 text-sm sm:text-base max-w-2xl line-clamp-2 mb-4">Pembaruan terbesar kami menghadirkan tampilan antarmuka yang lebih segar, performa peta yang melesat, dan peluncuran portal komunitas real-time...</p>
            <button className="flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors text-sm">
              Baca Selengkapnya <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { img: "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=2070&auto=format&fit=crop", category: "Tips", categoryColor: "text-emerald-400", date: "5 Mar 2026", title: "7 Lokasi Tersembunyi di Peta Dunia", desc: "Temukan spot-spot rahasia yang jarang diketahui orang untuk mengabadikan kenangan terbaik Anda musim liburan ini." },
            { img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", category: "Cerita", categoryColor: "text-violet-400", date: "28 Feb 2026", title: "Bagaimana MemoryMap Membantu Saya Mengingat", desc: "Wawancara eksklusif bersama komunitas mengenai dampak menyimpan kenangan visual yang terikat pada lokasi." },
            { img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop", category: "Teknologi", categoryColor: "text-rose-400", date: "15 Feb 2026", title: "Arsitektur Dibalik Peta Interaktif Kami", desc: "Membongkar stack teknologi dan trik rendering yang kami gunakan untuk membuat jutaan token memori tanpa lag." },
          ].map((post, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="relative h-48 overflow-hidden">
                <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-semibold ${post.categoryColor} uppercase tracking-wider`}>{post.category}</span>
                  <span className="text-[11px] text-neutral-500">{post.date}</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-2 leading-snug group-hover:text-indigo-400 transition-colors">{post.title}</h4>
                <p className="text-neutral-400 text-sm line-clamp-3 mb-4 flex-1">{post.desc}</p>
                <button className="text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 self-start">
                  Baca Artikel <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors text-sm font-semibold flex items-center gap-2">
            Muat Lebih Banyak Artikel <Loader2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Main Modals Export ────────────────────────────────────────────────────────
export interface LandingModalsProps {
  isPrivacyOpen: boolean
  isTermsOpen: boolean
  isChangelogOpen: boolean
  isContactOpen: boolean
  isBlogOpen: boolean
  isMobileAppOpen: boolean
  onPrivacyClose: () => void
  onTermsClose: () => void
  onChangelogClose: () => void
  onContactClose: () => void
  onBlogClose: () => void
  onMobileAppClose: () => void
}

export function LandingModals({
  isPrivacyOpen,
  isTermsOpen,
  isChangelogOpen,
  isContactOpen,
  isBlogOpen,
  isMobileAppOpen,
  onPrivacyClose,
  onTermsClose,
  onChangelogClose,
  onContactClose,
  onBlogClose,
  onMobileAppClose,
}: LandingModalsProps) {
  return (
    <AnimatePresence>
      {isPrivacyOpen && <PrivacyModal onClose={onPrivacyClose} />}
      {isTermsOpen && <TermsModal onClose={onTermsClose} />}
      {isChangelogOpen && <ChangelogModal onClose={onChangelogClose} />}
      {isContactOpen && <ContactModal onClose={onContactClose} />}
      {isBlogOpen && <BlogModal onClose={onBlogClose} />}
      {isMobileAppOpen && <MobileAppModal onClose={onMobileAppClose} />}
    </AnimatePresence>
  )
}
