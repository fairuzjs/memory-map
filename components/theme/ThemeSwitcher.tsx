"use client"

import { useState } from "react"
import { useTheme } from "./ThemeProvider"
import { Check, Palette, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ═══════════════════════════════════════════════════════════════════════
// ThemeSwitcher Popup — Neobrutalism Style
// ═══════════════════════════════════════════════════════════════════════

export function ThemeSwitcherPopup({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const { theme, setTheme, themes } = useTheme()

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 24 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[var(--mm-surface)] border-[3px] border-[var(--mm-border)] shadow-[8px_8px_0_var(--mm-shadow)] rounded-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 pt-5 pb-4 border-b-[3px] border-[var(--mm-border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 flex items-center justify-center bg-[var(--mm-primary)] border-[2.5px] border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)] rounded-xl">
                                    <Palette className="w-4 h-4" style={{ color: "var(--mm-ink)" }} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase" style={{ color: "var(--mm-ink)" }}>
                                        Pilih Tema
                                    </h2>
                                    <p className="text-xs font-bold" style={{ color: "var(--mm-ink-muted)" }}>
                                        Ubah tampilan warna Memory Map
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 border-[2.5px] border-[var(--mm-border)] rounded-xl shadow-[2px_2px_0_var(--mm-shadow)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--mm-shadow)] active:translate-y-px active:shadow-none transition-all bg-[var(--mm-surface)]"
                                style={{ color: "var(--mm-ink)" }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Theme Grid */}
                        <div className="p-6 space-y-3">
                            {themes.map((t) => {
                                const isActive = theme === t.id
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`w-full flex items-center gap-4 p-4 border-[2.5px] rounded-xl transition-all ${
                                            isActive
                                                ? "border-[var(--mm-border)] shadow-[4px_4px_0_var(--mm-shadow)] -translate-y-0.5"
                                                : "border-[var(--mm-border)] shadow-[2px_2px_0_var(--mm-shadow)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--mm-shadow)]"
                                        }`}
                                        style={{
                                            backgroundColor: isActive ? t.preview.primary : "var(--mm-surface)",
                                        }}
                                    >
                                        {/* Color preview dots */}
                                        <div className="flex gap-1.5 shrink-0">
                                            {[t.preview.bg, t.preview.primary, t.preview.secondary, t.preview.accent].map(
                                                (color, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-6 h-6 rounded-lg border-[2px] border-[var(--mm-border)]"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                )
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm font-black uppercase truncate" style={{ color: "var(--mm-ink)" }}>
                                                {t.emoji} {t.name}
                                            </p>
                                            <p className="text-[11px] font-bold truncate" style={{ color: "var(--mm-ink-muted)" }}>
                                                {t.description}
                                            </p>
                                        </div>

                                        {/* Check mark */}
                                        {isActive && (
                                            <div className="w-7 h-7 flex items-center justify-center shrink-0 border-[2px] border-[var(--mm-border)] rounded-lg shadow-[2px_2px_0_var(--mm-shadow)]" style={{ backgroundColor: "var(--mm-success)" }}>
                                                <Check className="w-4 h-4" style={{ color: "var(--mm-ink)" }} />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Footer hint */}
                        <div className="px-6 pb-5">
                            <p className="text-[11px] font-bold text-center" style={{ color: "var(--mm-ink-muted)" }}>
                                Tema akan otomatis tersimpan dan tetap aktif saat refresh.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
