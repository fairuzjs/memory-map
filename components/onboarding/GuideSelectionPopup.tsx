"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { GUIDE_DEFINITIONS, type GuideDefinition } from "./onboardingSteps"

interface GuideSelectionPopupProps {
    isOpen: boolean
    onClose: () => void
    onSelectGuide: (guide: GuideDefinition) => void
}

export function GuideSelectionPopup({ isOpen, onClose, onSelectGuide }: GuideSelectionPopupProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Light backdrop — doesn't block aggressively */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9000]"
                        style={{ background: "rgba(0, 0, 0, 0.25)" }}
                        onClick={onClose}
                    />

                    {/* Popup — fixed center with proper inset positioning */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="fixed z-[9001] bg-[#FFFDF0] border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col"
                        style={{
                            /* Use inset + margin:auto for perfect centering that framer-motion can't break */
                            inset: 0,
                            margin: "auto",
                            /* Sizing */
                            width: "calc(100vw - 24px)",
                            maxWidth: 680,
                            /* Height: auto up to max, then scroll */
                            height: "fit-content",
                            maxHeight: "min(80vh, 640px)",
                        }}
                    >
                        {/* Header — sticky */}
                        <div className="flex items-center justify-between px-5 py-4 border-b-[4px] border-black bg-[#FFFF00] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                                    <span className="text-lg">📖</span>
                                </div>
                                <div>
                                    <h2
                                        className="text-lg font-black text-black uppercase tracking-wider"
                                        style={{ fontFamily: "'Outfit', sans-serif" }}
                                    >
                                        BUKU PANDUAN
                                    </h2>
                                    <p className="text-[11px] font-bold text-black/60 uppercase tracking-widest">
                                        Pilih panduan yang ingin kamu buka
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:bg-black hover:text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Guide List — only this scrolls */}
                        <div
                            className="overflow-y-auto flex-1 p-4 space-y-2"
                            style={{ scrollbarGutter: "stable", overscrollBehavior: "contain" }}
                        >
                            {GUIDE_DEFINITIONS.map((guide, index) => {
                                const Icon = guide.icon
                                const accent = guide.accentColor
                                return (
                                    <motion.button
                                        key={guide.key}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04, duration: 0.25 }}
                                        onClick={() => onSelectGuide(guide)}
                                        className="w-full text-left flex items-start gap-3 p-3 border-[3px] border-black bg-white shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all group"
                                    >
                                        <div
                                            className="w-10 h-10 shrink-0 flex items-center justify-center border-[3px] border-black shadow-[2px_2px_0_#000] group-hover:rotate-[-3deg] transition-transform"
                                            style={{ backgroundColor: accent }}
                                        >
                                            <Icon className="w-5 h-5 text-black" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className="text-sm font-black text-black uppercase tracking-wide leading-tight"
                                                style={{ fontFamily: "'Outfit', sans-serif" }}
                                            >
                                                {guide.title}
                                            </h3>
                                            <p className="text-xs text-black/60 font-medium leading-snug mt-0.5 line-clamp-2">
                                                {guide.description}
                                            </p>
                                        </div>
                                        <div className="shrink-0 self-center w-7 h-7 flex items-center justify-center border-[2px] border-black bg-[#FFFDF0] group-hover:bg-[#00FF00] transition-colors">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
                                            </svg>
                                        </div>
                                    </motion.button>
                                )
                            })}
                        </div>

                        {/* Footer — sticky */}
                        <div className="shrink-0 px-5 py-3 border-t-[3px] border-black bg-[#FFFDF0]">
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest text-center">
                                Tekan ESC atau klik di luar untuk menutup
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
