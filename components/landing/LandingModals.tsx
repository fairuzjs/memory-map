"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  X, Activity, Shield, Server, Zap, Globe, Users, GitBranch,
  Star, Sparkles, Bug, Palette, MapPin, Lock, Headphones, MessageCircle,
  Clock, Phone, Mail, Share2, Twitter, Instagram, Github, Smartphone,
  Bell, BookOpen, Heart, ImagePlus, ArrowRight, Loader2, Play, SkipForward
} from "lucide-react"
import { useEffect, useState } from "react"
import { TermsModal } from "@/components/ui/TermsModal"

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -1 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden border-[4px] border-black shadow-[12px_12px_0_#000] bg-white flex flex-col`}
      >
        {children}
      </motion.div>
    </div>
  )
}

function ModalHeader({ title, onClose, icon }: { title: string; onClose: () => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-5 sm:p-6 border-b-[4px] border-black bg-[#E5E5E5]">
      <div className="flex items-center gap-4">
        {icon}
        <h3 className="text-[20px] font-black text-black uppercase tracking-wider">{title}</h3>
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 bg-[#FF00FF] text-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all flex items-center justify-center shrink-0 ml-4"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

// ─── Changelog Modal ───────────────────────────────────────────────────────────
function ChangelogModal({ onClose }: { onClose: () => void }) {
  const metrics = [
    { icon: Server, label: "Uptime", value: 99.9, isNumber: true, suffix: "%", bg: "bg-[#00FF00]" },
    { icon: Zap, label: "Respons", value: 42, isNumber: true, suffix: "ms", bg: "bg-[#FFFF00]" },
    { icon: Globe, label: "API", value: "Aktif", isNumber: false, suffix: "", bg: "bg-[#00FFFF]" },
    { icon: Users, label: "Pengguna", value: "Online", isNumber: false, suffix: "", bg: "bg-[#FF00FF]", text: "text-white" },
  ]

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-3xl">
      <ModalHeader
        title="Status & Changelog"
        onClose={onClose}
        icon={
          <div className="w-12 h-12 bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center">
            <Activity className="w-6 h-6 text-black" />
          </div>
        }
      />
      <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-white">
        {/* System Status */}
        <div className="border-[4px] border-black bg-[#E5E5E5] p-5 mb-8 shadow-[6px_6px_0_#000]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#00FF00] flex items-center justify-center shrink-0 border-[3px] border-black shadow-[2px_2px_0_#000]">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h4 className="text-black font-black text-[16px] uppercase tracking-wide mb-1">Semua Sistem Berjalan Normal</h4>
              <p className="text-black/80 font-bold text-[12px] leading-relaxed">
                Layanan MemoryMap saat ini beroperasi dengan lancar tanpa ada gangguan yang dilaporkan. Kami terus memantau performa sistem secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <div key={i} className={`p-4 border-[3px] border-black shadow-[4px_4px_0_#000] text-center flex flex-col items-center justify-center ${metric.bg}`}>
                <div className="w-8 h-8 flex items-center justify-center mb-2">
                  <Icon className={`w-6 h-6 ${metric.text || "text-black"}`} />
                </div>
                <p className={`text-[20px] font-black leading-none mb-1 ${metric.text || "text-black"}`}>
                  {metric.isNumber ? <AnimatedCounter value={metric.value as number} suffix={metric.suffix} /> : metric.value}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${metric.text || "text-black"}`}>{metric.label}</p>
              </div>
            )
          })}
        </div>

        {/* Changelog */}
        <div className="border-t-[4px] border-black pt-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#FF3300] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-black font-black text-[20px] uppercase">Changelog Terbaru</h4>
            <span className="ml-auto px-3 py-1 bg-[#00FF00] border-[3px] border-black shadow-[2px_2px_0_#000] text-black text-[12px] font-black uppercase tracking-wider transform rotate-2">
              Live
            </span>
          </div>

          <div className="space-y-6">
            {/* V2.4 */}
            <div className="border-[4px] border-black bg-white shadow-[6px_6px_0_#000] p-5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-[#FFD700] text-black text-[10px] font-black border-[2px] border-black shadow-[2px_2px_0_#000] uppercase tracking-wider">Terbaru</span>
                <span className="px-3 py-1 bg-[#E5E5E5] text-black text-[10px] font-black border-[2px] border-black uppercase tracking-wider">v2.4</span>
                <span className="text-[12px] font-bold text-black/60 ml-auto">Mei 2026</span>
              </div>
              <h5 className="text-black font-black text-[18px] uppercase mb-4 underline decoration-[#FFD700] decoration-4 underline-offset-4">Akun Premium</h5>
              <div className="space-y-3">
                {[
                  { text: "Peluncuran fitur Akun Premium dengan harga Rp 20.000/bulan untuk pengalaman eksklusif.", tag: "Fitur Baru", bg: "bg-[#FFD700]" },
                  { text: "Benefit premium: 5x gacha gratis/minggu, streak freeze 2x/bulan, multiplier streak 2x.", tag: "Benefit", bg: "bg-[#00FF00]" },
                  { text: "Badge Crown eksklusif, bingkai avatar Mahkota Royale, dan banner Langit Kerajaan.", tag: "Eksklusif", bg: "bg-[#FF00FF]" },
                  { text: "Custom Map Markers premium dengan 5 desain unik untuk menandai kenangan.", tag: "Fitur Baru", bg: "bg-[#FFFF00]" },
                  { text: "Diskon 10% untuk semua pembelian di shop dan bonus 250 Memory Point saat upgrade.", tag: "Benefit", bg: "bg-[#00FFFF]" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-neutral-100 p-3 border-[2px] border-black">
                    <div className="w-3 h-3 bg-black mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-[14px] font-bold text-black/80">{item.text}</span>
                      <span className={`ml-2 px-2 py-0.5 text-[9px] font-black text-black border-[2px] border-black uppercase tracking-wider ${item.bg}`}>
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* V2.3 */}
            <div className="border-[4px] border-black bg-white shadow-[6px_6px_0_#000] p-5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-[#E5E5E5] text-black text-[10px] font-black border-[2px] border-black uppercase tracking-wider">v2.3</span>
                <span className="text-[12px] font-bold text-black/60 ml-auto">April 2026</span>
              </div>
              <h5 className="text-black font-black text-[18px] uppercase mb-4 underline decoration-[#00FF00] decoration-4 underline-offset-4">Spotify Music Integration</h5>
              <div className="space-y-3">
                {[
                  { text: "Integrasi Spotify API untuk mencari dan memilih lagu langsung dari platform.", tag: "Integrasi", bg: "bg-[#00FFFF]" },
                  { text: "Lampirkan lagu Spotify ke setiap kenangan untuk menciptakan soundtrack memorimu.", tag: "Fitur Baru", bg: "bg-[#FFFF00]" },
                  { text: "Pemutar Spotify Embed terintegrasi pada detail kenangan dan peta interaktif.", tag: "Fitur Baru", bg: "bg-[#FFFF00]" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-neutral-100 p-3 border-[2px] border-black">
                    <div className="w-3 h-3 bg-black mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-[14px] font-bold text-black/80">{item.text}</span>
                      <span className={`ml-2 px-2 py-0.5 text-[9px] font-black text-black border-[2px] border-black uppercase tracking-wider ${item.bg}`}>
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* V2.2 */}
            <div className="border-[4px] border-black bg-white shadow-[6px_6px_0_#000] p-5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-[#E5E5E5] text-black text-[10px] font-black border-[2px] border-black uppercase tracking-wider">v2.2</span>
                <span className="text-[12px] font-bold text-black/60 ml-auto">April 2026</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FFFF00] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                  <Star className="w-4 h-4 text-black" />
                </div>
                <h5 className="text-black font-black text-[18px] uppercase">Sistem Memory Point</h5>
              </div>
              <div className="space-y-3">
                {[
                  "Integrasi fitur Exchange Memory Point untuk menukar poin dengan item eksklusif.",
                  "Peluncuran fitur Topup Memory Point secara manual dengan konfirmasi admin.",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3 bg-neutral-100 p-3 border-[2px] border-black">
                    <div className="w-3 h-3 bg-black mt-1.5 shrink-0" />
                    <span className="text-[14px] font-bold text-black/80">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* V2.1 */}
            <div className="border-[4px] border-black bg-white shadow-[6px_6px_0_#000] p-5">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-[#E5E5E5] text-black text-[10px] font-black border-[2px] border-black uppercase tracking-wider">v2.1</span>
                <span className="text-[12px] font-bold text-black/60 ml-auto">Maret 2026</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#00FFFF] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <h5 className="text-black font-black text-[18px] uppercase">Fitur Komunitas</h5>
              </div>
              <div className="space-y-3">
                {[
                  { text: "Penambahan halaman jelajah real-time untuk komunitas global." },
                  { text: "Optimasi kecepatan rendering peta interaktif hingga 30%." },
                  { text: "Perbaikan bug minor terkait sinkronisasi data profil." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-neutral-100 p-3 border-[2px] border-black">
                    <div className="w-3 h-3 bg-black mt-1.5 shrink-0" />
                    <span className="text-[14px] font-bold text-black/80">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 p-5 border-[4px] border-black bg-[#FFFF00] text-center shadow-[6px_6px_0_#000]">
          <p className="text-[16px] font-black text-black uppercase mb-2">Ada kendala atau saran?</p>
          <p className="text-[12px] font-bold text-black/80">Hubungi tim dukungan kami melalui halaman Kontak untuk melaporkan masalah atau memberikan masukan.</p>
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
          <div className="w-12 h-12 bg-[#00FFFF] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center">
            <Headphones className="w-6 h-6 text-black" />
          </div>
        }
      />
      <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-white">
        <div className="border-[4px] border-black bg-[#E5E5E5] p-5 mb-8 shadow-[6px_6px_0_#000]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FF00FF] flex items-center justify-center shrink-0 border-[3px] border-black shadow-[2px_2px_0_#000]">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-black font-black text-[16px] uppercase tracking-wide mb-1">Kami Siap Membantu Anda</h4>
              <p className="text-black/80 font-bold text-[12px] leading-relaxed">
                Punya pertanyaan, masukan, atau kendala terkait MemoryMap? Tim dukungan kami siap membantu melalui berbagai saluran komunikasi di bawah ini.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <a href="mailto:support@memorymap.app" className="group p-5 border-[4px] border-black bg-white shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all hover:bg-[#FFFF00]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#00FFFF] border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="text-black font-black text-[16px] uppercase mb-1">Email Dukungan</h4>
                <p className="text-[14px] font-bold text-black/80">support@memorymap.app</p>
                <div className="flex items-center gap-2 mt-3 bg-white border-[2px] border-black px-2 py-1 inline-flex">
                  <Clock className="w-3 h-3 text-black" />
                  <span className="text-[10px] font-black text-black uppercase">Balasan 1x24 jam</span>
                </div>
              </div>
            </div>
          </a>
          <a href="https://wa.me/6285883917835" target="_blank" rel="noopener noreferrer" className="group p-5 border-[4px] border-black bg-white shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all hover:bg-[#00FF00]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="text-black font-black text-[16px] uppercase mb-1">WhatsApp</h4>
                <p className="text-[14px] font-bold text-black/80">+62 858 8391 7835</p>
                <div className="flex items-center gap-2 mt-3 bg-white border-[2px] border-black px-2 py-1 inline-flex">
                  <Clock className="w-3 h-3 text-black" />
                  <span className="text-[10px] font-black text-black uppercase">Sen-Jum, 09:00 - 17:00</span>
                </div>
              </div>
            </div>
          </a>
        </div>

        <div className="border-t-[4px] border-black pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FF3300] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-black font-black text-[18px] uppercase">Media Sosial</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Twitter, label: "Twitter", handle: "@memorymap_id", bg: "bg-[#00FFFF]" },
              { icon: Instagram, label: "Instagram", handle: "@memorymap.app", bg: "bg-[#FF00FF]", text: "text-white" },
              { icon: Github, label: "GitHub", handle: "memorymap", bg: "bg-black", text: "text-white" },
            ].map((social, i) => {
              const Icon = social.icon
              return (
                <a key={i} href="#" className="flex flex-col items-center gap-3 p-5 border-[4px] border-black bg-white shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all group">
                  <div className={`w-12 h-12 border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center ${social.bg}`}>
                    <Icon className={`w-6 h-6 ${social.text || "text-black"}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-black uppercase text-black">{social.label}</p>
                    <p className="text-[12px] font-bold text-black/60">{social.handle}</p>
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
    <ModalWrapper onClose={onClose} maxWidth="max-w-4xl">
      <ModalHeader
        title="Aplikasi Mobile"
        onClose={onClose}
        icon={
          <div className="w-12 h-12 bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-black" />
          </div>
        }
      />
      <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar bg-white">
        <div className="border-[4px] border-black bg-[#E5E5E5] p-5 mb-10 shadow-[6px_6px_0_#000]">
          <h4 className="text-black font-black text-[16px] uppercase mb-2">Sedang Dalam Tahap Pengembangan</h4>
          <p className="text-black/80 font-bold text-[12px] leading-relaxed">
            Aplikasi mobile MemoryMap saat ini sedang dalam proses pengembangan aktif oleh tim kami. Kami akan menghadirkan pengalaman terbaik dalam mengabadikan kenangan langsung dari genggaman tangan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-10">
          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative border-[6px] border-black rounded-[2.5rem] bg-white shadow-[12px_12px_0_#000] w-[260px] h-[520px] overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-[1rem] z-20" />
              {/* Screen */}
              <div className="relative w-full h-full bg-black">
                <img src="/mobile-preview.png" alt="MemoryMap Mobile Preview" className="w-full h-full object-cover opacity-90" />
              </div>
            </div>
          </div>

          {/* App info */}
          <div className="space-y-8">
            <div>
              <h4 className="text-[32px] font-black text-black uppercase leading-none mb-4">
                Kenangan di <span className="bg-[#FF00FF] text-white px-2 border-[4px] border-black shadow-[4px_4px_0_#000] inline-block mt-2 transform -rotate-2">Genggamanmu</span>
              </h4>
              <p className="text-[14px] font-bold text-black/80 leading-relaxed bg-[#00FFFF] p-3 border-[3px] border-black shadow-[4px_4px_0_#000]">
                Nikmati semua fitur MemoryMap langsung dari smartphone. Tandai kenangan di mana pun, kapan pun, bahkan saat offline.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: MapPin, text: "Tandai lokasi dengan GPS real-time", bg: "bg-[#00FF00]" },
                { icon: ImagePlus, text: "Ambil foto langsung dari kamera", bg: "bg-[#FFFF00]" },
                { icon: Bell, text: "Notifikasi push untuk interaksi", bg: "bg-[#00FFFF]" },
                { icon: Zap, text: "Mode offline — simpan lalu sync", bg: "bg-[#FF3300]", iconText: "text-white" },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div key={i} className="flex items-center gap-4 p-3 border-[3px] border-black bg-white shadow-[4px_4px_0_#000]">
                    <div className={`w-10 h-10 border-[2px] border-black flex items-center justify-center shrink-0 ${feature.bg}`}>
                      <Icon className={`w-5 h-5 ${feature.iconText || "text-black"}`} />
                    </div>
                    <span className="text-[14px] font-black text-black uppercase">{feature.text}</span>
                  </div>
                )
              })}
            </div>

            <div className="p-5 border-[4px] border-black bg-[#E5E5E5] shadow-[6px_6px_0_#000]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-black text-black uppercase tracking-wider">Progress Pengembangan</span>
                <span className="text-[14px] font-black text-black bg-[#00FF00] border-[2px] border-black px-2 shadow-[2px_2px_0_#000]">20%</span>
              </div>
              <div className="w-full h-4 border-[2px] border-black bg-white">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "20%" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  className="h-full bg-[#FF00FF] border-r-[2px] border-black"
                />
              </div>
              <p className="text-[10px] font-black text-black/60 uppercase mt-3 text-right">Estimasi rilis: Q4 2026</p>
            </div>
          </div>
        </div>

        <div className="border-t-[4px] border-black pt-8 text-center">
          <p className="text-[16px] font-black text-black uppercase mb-6 bg-[#FFFF00] inline-block px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000] transform rotate-1">
            Segera tersedia di platform favoritmu
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button className="w-full sm:w-auto flex items-center gap-4 px-8 py-4 border-[4px] border-black bg-white shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all hover:bg-[#E5E5E5]">
              <svg className="w-8 h-8 shrink-0" viewBox="0 0 512 512" fill="none">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="currentColor"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] font-black text-black/60 uppercase tracking-wider leading-none">Segera di</p>
                <p className="text-[18px] font-black text-black uppercase leading-tight mt-0.5">Google Play</p>
              </div>
            </button>
            <button className="w-full sm:w-auto flex items-center gap-4 px-8 py-4 border-[4px] border-black bg-white shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all hover:bg-[#E5E5E5]">
              <svg className="w-8 h-8 shrink-0 text-black" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-46.8-42.3-83.6-45.8-35.3-3.5-73.8 20.6-88 20.6-15.2 0-48-19.4-73.4-19.4C76.4 140.5 0 186 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.9 59 127.2 107.2 125.7 25-0.6 42.7-18 75.3-18s46.3 18 77.8 17.4c49.1-0.8 89.7-82.3 101.9-119.3-65.2-30.7-96.9-90.4-97-91.8zM257.2 76.3c27.1-32.7 24.4-62.6 23.6-73.3-23.6 1.5-51 15.8-66.9 34.3-17.4 19.8-27.6 44.4-25.4 71.1 25.6 1.8 51.7-12.3 68.7-32.1z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] font-black text-black/60 uppercase tracking-wider leading-none">Segera di</p>
                <p className="text-[18px] font-black text-black uppercase leading-tight mt-0.5">App Store</p>
              </div>
            </button>
          </div>
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
  isMobileAppOpen: boolean
  onPrivacyClose: () => void
  onTermsClose: () => void
  onChangelogClose: () => void
  onContactClose: () => void
  onMobileAppClose: () => void
}

export function LandingModals({
  isPrivacyOpen,
  isTermsOpen,
  isChangelogOpen,
  isContactOpen,
  isMobileAppOpen,
  onPrivacyClose,
  onTermsClose,
  onChangelogClose,
  onContactClose,
  onMobileAppClose,
}: LandingModalsProps) {
  return (
    <>
      <AnimatePresence>
        {isChangelogOpen && <ChangelogModal onClose={onChangelogClose} />}
        {isContactOpen && <ContactModal onClose={onContactClose} />}
        {isMobileAppOpen && <MobileAppModal onClose={onMobileAppClose} />}
      </AnimatePresence>
      <TermsModal isOpen={isPrivacyOpen} onClose={onPrivacyClose} type="privacy" />
      <TermsModal isOpen={isTermsOpen} onClose={onTermsClose} type="terms" />
    </>
  )
}
