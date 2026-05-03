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
        iconBg: "bg-[#FF3300]",
        iconText: "text-white",
        confirmBg: "bg-[#FF3300]",
        confirmText: "text-white",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-[#FFFF00]",
        iconText: "text-black",
        confirmBg: "bg-[#FFFF00]",
        confirmText: "text-black",
    },
    info: {
        icon: Info,
        iconBg: "bg-[#00FFFF]",
        iconText: "text-black",
        confirmBg: "bg-[#00FFFF]",
        confirmText: "text-black",
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
                        className="absolute inset-0 bg-black/70"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 20 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className="relative w-full max-w-sm overflow-hidden bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                    >
                        {/* Content */}
                        <div className="relative p-6">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[#E5E5E5] border-[2px] border-black hover:bg-[#FF00FF] hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Icon */}
                            <div className={`w-12 h-12 ${config.iconBg} border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center mb-5`}>
                                <Icon className={`w-5 h-5 ${config.iconText}`} />
                            </div>

                            {/* Text */}
                            <h3 className="text-[17px] font-black text-black uppercase mb-2 leading-snug pr-6">
                                {title}
                            </h3>
                            <p className="text-sm text-neutral-600 font-bold leading-relaxed mb-7">
                                {description}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-2.5 text-sm font-black uppercase ${config.confirmBg} ${config.confirmText} border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
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
