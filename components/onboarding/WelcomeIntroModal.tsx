"use client"

import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Sparkles, X } from "lucide-react"

interface WelcomeIntroModalProps {
    isOpen: boolean
    onOpenGuide: () => void
    onSkip: () => void
}

/**
 * Lightweight welcome modal for first-time users.
 * Points them to the Buku Panduan without starting a full tutorial.
 * Neobrutalism style consistent with Memory Map.
 *
 * Flow: Register → Login → Dashboard → THIS POPUP → Buku Panduan → Choose Guide → Tutorial
 */
export function WelcomeIntroModal({ isOpen, onOpenGuide, onSkip }: WelcomeIntroModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[9800]"
                        style={{ background: "rgba(0, 0, 0, 0.5)" }}
                        onClick={onSkip}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, x: "-50%", y: "-45%", scale: 0.93 }}
                        animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                        exit={{ opacity: 0, x: "-50%", y: "-48%", scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                        className="fixed z-[9801] bg-[#FFFDF0] border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden"
                        style={{
                            top: "50%",
                            left: "50%",
                            width: "calc(100vw - 24px)",
                            maxWidth: 460,
                            maxHeight: "80vh",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* Top accent bar — 4-color MemoryMap palette */}
                        <div className="flex h-[6px] shrink-0">
                            <div className="flex-1 bg-[#00FFFF]" />
                            <div className="flex-1 bg-[#FFFF00]" />
                            <div className="flex-1 bg-[#FF00FF]" />
                            <div className="flex-1 bg-[#00FF00]" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onSkip}
                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border-[2px] border-black hover:bg-black hover:text-white transition-all z-10"
                            title="Lewati"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Scrollable Body */}
                        <div className="px-6 pt-8 pb-6 text-center overflow-y-auto flex-1">
                            {/* Sparkle icon */}
                            <motion.div
                                initial={{ rotate: -12, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                                className="w-16 h-16 mx-auto mb-5 bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center"
                            >
                                <Sparkles className="w-7 h-7 text-black" />
                            </motion.div>

                            {/* Title */}
                            <h2
                                className="text-xl sm:text-3xl font-black text-black uppercase mb-3 leading-tight"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                Selamat Datang di Memory Map
                            </h2>

                            {/* Description */}
                            <p className="text-sm text-black/65 font-medium leading-relaxed mb-6 max-4w-xs mx-auto">
                                Senang melihatmu di sini! Sebelum mulai menyimpan kenangan, yuk kenali
                                fitur-fitur <strong className="text-black font-black">Memory Map</strong> dan
                                pelajari cara membuat kenangan pertamamu.
                            </p>

                            {/* Actions — stack vertically on small screens */}
                            <div className="flex flex-col-reverse sm:flex-row items-stretch gap-2">
                                {/* Lewati (left on desktop, bottom on mobile) */}
                                <button
                                    onClick={onSkip}
                                    className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-black text-black/50 uppercase bg-white border-[3px] border-black/20 hover:border-black hover:text-black transition-all"
                                    style={{ minHeight: 44 }}
                                >
                                    Lewati
                                </button>

                                {/* Buka Buku Panduan (right on desktop, top on mobile) */}
                                <button
                                    onClick={onOpenGuide}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-black uppercase bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                                    style={{ minHeight: 44 }}
                                >
                                    Buka Buku Panduan
                                </button>
                            </div>
                        </div>

                        {/* Bottom accent bar — 4-color MemoryMap palette */}
                        <div className="flex h-[6px] shrink-0">
                            <div className="flex-1 bg-[#00FFFF]" />
                            <div className="flex-1 bg-[#FFFF00]" />
                            <div className="flex-1 bg-[#FF00FF]" />
                            <div className="flex-1 bg-[#00FF00]" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
