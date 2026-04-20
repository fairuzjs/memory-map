"use client"

import { motion, AnimatePresence, useInView } from "framer-motion"
import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, PenLine, UserPlus, ImagePlus, Share2, Star, X } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

interface WelcomePopupProps {
  isOpen: boolean
  onClose: () => void
  onDontShowAgain: () => void
}

export function WelcomePopup({ isOpen, onClose, onDontShowAgain }: WelcomePopupProps) {
  const [slide, setSlide] = useState(0)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.12] shadow-2xl flex flex-col"
          style={{ background: "linear-gradient(180deg, rgba(14,14,24,0.98), rgba(8,8,16,0.99))" }}
        >
          {/* Top accent line */}
          <motion.div
            animate={{
              background: slide === 0
                ? "linear-gradient(90deg, transparent, #1DB954, #16c454, #1DB954, transparent)"
                : "linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)",
            }}
            transition={{ duration: 0.4 }}
            className="h-[2px] w-full"
          />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  animate={{ boxShadow: slide === 0 ? "0 0 24px rgba(29,185,84,0.4)" : "0 0 24px rgba(245,158,11,0.4)" }}
                  className="absolute inset-0 rounded-xl blur-lg"
                  style={{ backgroundColor: slide === 0 ? "rgba(29,185,84,0.25)" : "rgba(245,158,11,0.25)" }}
                />
                <motion.div
                  animate={{
                    background: slide === 0
                      ? "linear-gradient(135deg, #1a9e4a, #1DB954)"
                      : "linear-gradient(135deg, #d97706, #f59e0b)",
                  }}
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                >
                  {slide === 0 ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  ) : (
                    <Star className="w-5 h-5 text-white fill-white" />
                  )}
                </motion.div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-[Outfit] leading-tight">Yang Baru di MemoryMap</h3>
                <motion.p
                  animate={{ color: slide === 0 ? "#1DB954" : "#f59e0b" }}
                  className="text-[11px] mt-0.5 font-medium"
                >
                  {slide === 0 ? "✦ Spotify Music Integration" : "✦ Memory Point Exchange"}
                </motion.p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-1 text-neutral-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slide content */}
          <div className="px-6 pb-2 overflow-hidden">
            <AnimatePresence mode="wait">
              {slide === 0 && (
                <motion.div
                  key="slide-0"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-[#1DB954]/25 bg-[#1DB954]/[0.04] p-5 mb-4">
                    <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(29,185,84,0.15), transparent 70%)" }} />
                    {/* Spotify player mockup */}
                    <div className="relative rounded-xl border border-[#1DB954]/20 bg-[#0a0a0f]/90 p-4 mb-4 overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex gap-[3px] items-end h-3">
                          {[1, 2, 3].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-[3px] rounded-full"
                              style={{ backgroundColor: "#1DB954" }}
                              animate={{ height: ["40%", "100%", "60%", "90%", "40%"] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#1DB954" }}>Now Playing</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/40 to-[#191414]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#1DB954">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">Kicau Mania</p>
                          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">Ndayboy Genk · BoyCord Music</p>
                          <div className="mt-2.5">
                            <div className="w-full h-1 bg-white/[0.1] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "45%" }}
                                transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: "#1DB954" }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] text-neutral-500">1:57</span>
                              <span className="text-[9px] text-neutral-500">4:41</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border" style={{ backgroundColor: "rgba(29,185,84,0.15)", color: "#1DB954", borderColor: "rgba(29,185,84,0.3)" }}>Baru</span>
                        <span className="text-[11px] text-neutral-500">v2.3</span>
                      </div>
                      <h4 className="text-white font-bold text-lg font-[Outfit] mb-1.5 leading-tight">Spotify Integration</h4>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Hubungkan kenanganmu dengan musik dari Spotify. Cari lagu favoritmu dan jadikan setiap memori lebih hidup dengan musik yang tepat.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {slide === 1 && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 mb-4">
                    <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 70%)" }} />
                    <div className="relative rounded-xl border border-white/[0.08] bg-[#0c0c16]/80 p-4 mb-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Saldo Poin</p>
                            <p className="text-base font-bold text-amber-400 font-[Outfit] leading-tight">2.500 MP</p>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Topup</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: "Bingkai Neon", price: "500", gradient: "from-indigo-500 to-violet-600", icon: "✨" },
                          { name: "Banner Sunset", price: "800", gradient: "from-rose-500 to-orange-500", icon: "🌅" },
                          { name: "Tema Galaxy", price: "1.2rb", gradient: "from-purple-500 to-blue-600", icon: "🌌" },
                        ].map((item, i) => (
                          <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                            <div className={`w-full h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-1.5 text-lg`}>{item.icon}</div>
                            <p className="text-[9px] font-bold text-white truncate">{item.name}</p>
                            <div className="flex items-center justify-center gap-0.5 mt-0.5">
                              <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                              <span className="text-[8px] font-bold text-amber-400">{item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/25 uppercase tracking-wider">Baru</span>
                        <span className="text-[11px] text-neutral-500">v2.2</span>
                      </div>
                      <h4 className="text-white font-bold text-lg font-[Outfit] mb-1.5 leading-tight">Exchange Memory Points</h4>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Tukarkan Memory Point-mu dengan dekorasi profil eksklusif! Bingkai avatar, banner profil, tema kartu, dan masih banyak item premium lainnya.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2">
            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[0, 1].map((i) => (
                <button key={i} onClick={() => setSlide(i)} className="transition-all">
                  <motion.div
                    animate={{
                      width: slide === i ? 24 : 8,
                      backgroundColor: slide === i ? (i === 0 ? "#1DB954" : "#f59e0b") : "rgba(255,255,255,0.15)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="h-2 rounded-full"
                  />
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {slide === 0 ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-neutral-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                  >
                    Lewati
                  </button>
                  <button
                    onClick={() => setSlide(1)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-black relative overflow-hidden group"
                    style={{ background: "#1DB954", boxShadow: "0 0 20px rgba(29,185,84,0.3)" }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#17a349" }} />
                    <span className="relative flex items-center justify-center gap-1.5">
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSlide(0)}
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-neutral-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white relative overflow-hidden group"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                    <span className="relative flex items-center justify-center gap-1.5">
                      Mulai Jelajahi <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={onDontShowAgain}
                className="text-[11px] font-medium text-neutral-500 hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                Jangan tampilkan lagi
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
