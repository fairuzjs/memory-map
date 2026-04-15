"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Trash2, X, ShieldAlert, Info } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmVariant = "danger" | "warning" | "info"

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: ConfirmVariant
    isLoading?: boolean
}

// ─── Variant Config ───────────────────────────────────────────────────────────

const variantConfig = {
    danger: {
        icon: Trash2,
        iconBg: "bg-rose-500/10",
        iconBorder: "border-rose-500/20",
        iconColor: "text-rose-400",
        glow: "rgba(244,63,94,0.12)",
        accent: "border-rose-500/20",
        confirmBg: "bg-rose-600 hover:bg-rose-500",
        confirmShadow: "shadow-rose-500/20",
        dot: "#f43f5e",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-amber-500/10",
        iconBorder: "border-amber-500/20",
        iconColor: "text-amber-400",
        glow: "rgba(245,158,11,0.12)",
        accent: "border-amber-500/20",
        confirmBg: "bg-amber-600 hover:bg-amber-500",
        confirmShadow: "shadow-amber-500/20",
        dot: "#f59e0b",
    },
    info: {
        icon: Info,
        iconBg: "bg-indigo-500/10",
        iconBorder: "border-indigo-500/20",
        iconColor: "text-indigo-400",
        glow: "rgba(99,102,241,0.12)",
        accent: "border-indigo-500/20",
        confirmBg: "bg-indigo-600 hover:bg-indigo-500",
        confirmShadow: "shadow-indigo-500/20",
        dot: "#6366f1",
    },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Konfirmasi",
    cancelLabel = "Batal",
    variant = "danger",
    isLoading = false,
}: ConfirmDialogProps) {
    const config = variantConfig[variant]
    const Icon = config.icon

    const handleConfirm = () => {
        onConfirm()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 20 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className={`relative w-full max-w-sm overflow-hidden rounded-2xl border ${config.accent} shadow-2xl`}
                        style={{ background: "linear-gradient(160deg, rgba(14,14,24,0.99), rgba(8,8,16,1))" }}
                    >
                        {/* Glow background */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at top, ${config.glow}, transparent 70%)` }}
                        />

                        {/* Top accent line */}
                        <div
                            className="h-[1.5px] w-full"
                            style={{ background: `linear-gradient(90deg, transparent, ${config.dot}, transparent)` }}
                        />

                        {/* Content */}
                        <div className="relative p-6">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/5 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-2xl ${config.iconBg} border ${config.iconBorder} flex items-center justify-center mb-5 shadow-lg`}>
                                <Icon className={`w-5 h-5 ${config.iconColor}`} />
                            </div>

                            {/* Text */}
                            <h3 className="text-[17px] font-bold text-white font-[Outfit] mb-2 leading-snug pr-6">
                                {title}
                            </h3>
                            <p className="text-sm text-neutral-400 leading-relaxed mb-7">
                                {description}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-neutral-400 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white ${config.confirmBg} shadow-lg ${config.confirmShadow} transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {isLoading ? (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                    ) : null}
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

// ─── useConfirm Hook ──────────────────────────────────────────────────────────
// Usage:
//   const { confirmProps, openConfirm } = useConfirm()
//   <ConfirmDialog {...confirmProps} />
//   openConfirm({ title: "...", onConfirm: () => ... })

interface OpenConfirmOptions {
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: ConfirmVariant
    onConfirm: () => void | Promise<void>
}

export function useConfirm() {
    const [state, setState] = useState<(OpenConfirmOptions & { isOpen: boolean; isLoading: boolean }) | null>(null)

    const openConfirm = useCallback((options: OpenConfirmOptions) => {
        setState({ ...options, isOpen: true, isLoading: false })
    }, [])

    const handleClose = useCallback(() => {
        setState(prev => prev ? { ...prev, isOpen: false } : null)
    }, [])

    const handleConfirm = useCallback(async () => {
        if (!state) return
        setState(prev => prev ? { ...prev, isLoading: true } : null)
        try {
            await state.onConfirm()
        } finally {
            setState(prev => prev ? { ...prev, isOpen: false, isLoading: false } : null)
        }
    }, [state])

    const confirmProps: ConfirmDialogProps = {
        isOpen: state?.isOpen ?? false,
        onClose: handleClose,
        onConfirm: handleConfirm,
        title: state?.title ?? "",
        description: state?.description ?? "",
        confirmLabel: state?.confirmLabel,
        cancelLabel: state?.cancelLabel,
        variant: state?.variant,
        isLoading: state?.isLoading ?? false,
    }

    return { confirmProps, openConfirm }
}
