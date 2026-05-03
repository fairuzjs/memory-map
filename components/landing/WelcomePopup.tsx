"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Star, X, Sparkles, Shield, Zap, MapPin } from "lucide-react"

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
          className="absolute inset-0 bg-black/70"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative w-full max-w-lg overflow-hidden border-[4px] border-black shadow-[12px_12px_0_#000] bg-white flex flex-col"
        >
          {/* Top accent line */}
          <motion.div
            animate={{
              backgroundColor: slide === 0 ? "#FFD700" : "#00FF00",
            }}
            transition={{ duration: 0.3 }}
            className="h-[6px] w-full border-b-[4px] border-black"
          />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  backgroundColor: slide === 0 ? "#FFD700" : "#00FF00",
                }}
                className="relative w-12 h-12 border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center shrink-0"
              >
                {slide === 0 ? (
                  <Crown className="w-6 h-6 text-black" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="black">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                )}
              </motion.div>
              <div>
                <h3 className="text-[20px] font-black text-black font-[Outfit] leading-tight uppercase">Yang Baru di MemoryMap</h3>
                <motion.p
                  animate={{ color: "#000" }}
                  className="text-[12px] mt-0.5 font-bold"
                >
                  {slide === 0 ? "👑 Akun Premium" : "✦ Spotify Music Integration"}
                </motion.p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center shrink-0 -mr-2 bg-white border-[3px] border-black hover:bg-[#FF00FF] hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slide content */}
          <div className="px-6 pb-2 overflow-hidden">
            <AnimatePresence mode="wait">
              {slide === 1 && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="border-[4px] border-black bg-[#E5E5E5] p-5 mb-4 shadow-[4px_4px_0_#000]">
                    {/* Spotify player mockup */}
                    <div className="border-[3px] border-black bg-white p-4 mb-4 shadow-[4px_4px_0_#000]">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-[3px] items-end h-4">
                          {[1, 2, 3].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-[4px]"
                              style={{ backgroundColor: "#1DB954" }}
                              animate={{ height: ["40%", "100%", "60%", "90%", "40%"] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#1DB954]">Now Playing</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 shrink-0 bg-[#00FF00] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="black">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-black text-black uppercase truncate">Kicau Mania</p>
                          <p className="text-[12px] font-bold text-neutral-500 mt-0.5 truncate">Ndayboy Genk · BoyCord Music</p>
                          <div className="mt-3">
                            <div className="w-full h-2 bg-[#E5E5E5] border-[2px] border-black overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "45%" }}
                                transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
                                className="h-full bg-[#1DB954]"
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] font-black text-black">1:57</span>
                              <span className="text-[10px] font-black text-black">4:41</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-[#00FF00] border-[2px] border-black text-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#000]">Baru</span>
                        <span className="text-[12px] font-black text-black uppercase tracking-wider">v2.3</span>
                      </div>
                      <h4 className="text-black font-black text-[20px] font-[Outfit] mb-2 leading-tight uppercase underline decoration-4 decoration-[#00FF00] underline-offset-4">Spotify Integration</h4>
                      <p className="text-neutral-700 font-bold text-[14px] leading-relaxed">
                        Hubungkan kenanganmu dengan musik dari Spotify. Cari lagu favoritmu dan jadikan setiap memori lebih hidup dengan musik yang tepat.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {slide === 0 && (
                <motion.div
                  key="slide-0"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="border-[4px] border-black bg-[#E5E5E5] p-5 mb-4 shadow-[4px_4px_0_#000]">
                    {/* Premium card mockup */}
                    <div className="border-[3px] border-black bg-white p-4 mb-4 shadow-[4px_4px_0_#000]">
                      {/* Premium header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#FFD700] border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0">
                          <Crown className="w-5 h-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">Akun Premium</p>
                          <p className="text-[16px] font-black text-black font-[Outfit] leading-tight">Rp 20.000 / bulan</p>
                        </div>
                        <div className="px-2 py-1 bg-[#FFD700] border-[2px] border-black shadow-[2px_2px_0_#000]">
                          <span className="text-[9px] font-black text-black uppercase tracking-wider">Aktifkan</span>
                        </div>
                      </div>
                      {/* Benefits grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: Sparkles, label: "5x Gacha Gratis/Minggu", bg: "bg-[#FF00FF]" },
                          { icon: Shield, label: "Streak Freeze 2x/Bulan", bg: "bg-[#00FFFF]" },
                          { icon: Zap, label: "Multiplier Streak 2x", bg: "bg-[#00FF00]" },
                          { icon: MapPin, label: "Custom Map Markers", bg: "bg-[#FFFF00]" },
                        ].map((item, i) => {
                          const Icon = item.icon
                          return (
                            <div key={i} className="flex items-center gap-2 p-2 border-[2px] border-black bg-white shadow-[1px_1px_0_#000]">
                              <div className={`w-6 h-6 ${item.bg} border-[2px] border-black flex items-center justify-center shrink-0`}>
                                <Icon className="w-3 h-3 text-black" />
                              </div>
                              <span className="text-[8px] font-black text-black uppercase leading-tight">{item.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-[#FFD700] border-[2px] border-black text-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#000]">Baru</span>
                        <span className="text-[12px] font-black text-black uppercase tracking-wider">v2.4</span>
                      </div>
                      <h4 className="text-black font-black text-[20px] font-[Outfit] mb-2 leading-tight uppercase underline decoration-4 decoration-[#FFD700] underline-offset-4">Akun Premium</h4>
                      <p className="text-neutral-700 font-bold text-[14px] leading-relaxed">
                        Upgrade ke Premium dan nikmati benefit eksklusif: gacha gratis, streak freeze, badge crown, banner & bingkai premium, custom map markers, dan banyak lagi!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2">
            <div className="flex items-center justify-center gap-2 mb-5">
              {[0, 1].map((i) => (
                <button key={i} onClick={() => setSlide(i)} className="transition-all p-2">
                  <motion.div
                    animate={{
                      width: slide === i ? 32 : 12,
                      backgroundColor: slide === i ? "#000" : "#E5E5E5",
                      borderColor: "#000",
                      borderWidth: slide === i ? 3 : 2,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="h-3 border-black shadow-[1px_1px_0_#000]"
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {slide === 0 ? (
                <>
                  <button onClick={onClose} className="flex-1 py-3 text-[14px] font-black text-black uppercase border-[3px] border-black bg-[#E5E5E5] hover:bg-[#00FFFF] shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                    Lewati
                  </button>
                  <button onClick={() => setSlide(1)} className="flex-1 py-3 text-[14px] font-black text-black uppercase bg-[#FFD700] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all flex items-center justify-center gap-2">
                    Selanjutnya <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setSlide(0)} className="w-12 h-12 shrink-0 flex items-center justify-center text-black border-[3px] border-black bg-white shadow-[4px_4px_0_#000] hover:bg-[#FFD700] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={onClose} className="flex-1 py-3 text-[14px] font-black text-black uppercase bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all flex items-center justify-center gap-2">
                    Mulai Jelajahi <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            <div className="mt-5 text-center">
              <button onClick={onDontShowAgain} className="text-[12px] font-black text-neutral-500 uppercase tracking-widest hover:text-black transition-colors underline decoration-2 underline-offset-4 decoration-neutral-400 hover:decoration-black">
                Jangan tampilkan lagi
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
