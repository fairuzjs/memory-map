"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
// @ts-ignore
import confetti from "canvas-confetti"
import { Flame, Trophy, X } from "lucide-react"

interface BadgeUnlockModalProps {
    isOpen: boolean
    onClose: () => void
    milestone: number
}

const BADGE_CONFIG: Record<number, any> = {
    7: {
        name: "Baru Panas",
        gradient: "linear-gradient(135deg,#fb923c,#ea580c)",
        glow: "rgba(249,115,22,0.6)",
        colors: ["#fb923c", "#f97316", "#ea580c"],
        rarity: "COMMON"
    },
    30: {
        name: "Menyala Terus",
        gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        glow: "rgba(99,102,241,0.6)",
        colors: ["#6366f1", "#8b5cf6", "#a78bfa"],
        rarity: "RARE"
    },
    60: {
        name: "Anti Kendor",
        gradient: "linear-gradient(135deg,#10b981,#059669)",
        glow: "rgba(16,185,129,0.6)",
        colors: ["#10b981", "#34d399", "#059669"],
        rarity: "EPIC"
    },
    90: {
        name: "GOAT Streak",
        gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)",
        glow: "rgba(251,191,36,0.8)",
        colors: ["#fbbf24", "#f59e0b", "#fde68a"],
        rarity: "LEGENDARY"
    }
}

export function BadgeUnlockModal({
    isOpen,
    onClose,
    milestone
}: BadgeUnlockModalProps) {
    const [mounted, setMounted] = useState(false)

    const badge = BADGE_CONFIG[milestone]

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const timer = setTimeout(() => {

            const particleCount =
                milestone >= 90 ? 220 :
                    milestone >= 60 ? 160 :
                        120

            confetti({
                particleCount,
                spread: 80,
                origin: { y: 0.6 },
                colors: badge.colors
            })

        }, 500)

        return () => clearTimeout(timer)

    }, [isOpen])

    if (!badge || !mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (

                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 backdrop-blur-lg"
                        style={{ background: "rgba(0,0,0,0.85)" }}
                    />

                    {/* MODAL */}
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0, y: 40 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: 0,
                            transition: { type: "spring", stiffness: 220, damping: 16 }
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative w-full max-w-sm rounded-[2rem] p-10 text-center overflow-hidden"
                        style={{
                            background: "linear-gradient(160deg,rgba(20,20,30,0.95),rgba(10,10,15,0.98))",
                            border: `1px solid ${badge.glow}`,
                            boxShadow: `0 0 80px ${badge.glow}`
                        }}
                    >

                        {/* CLOSE */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/40 hover:text-white"
                        >
                            <X />
                        </button>

                        {/* CINEMATIC LIGHT BURST */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1.8 }}
                            transition={{ duration: 1.2 }}
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `radial-gradient(circle, ${badge.glow} 0%, transparent 70%)`,
                                filter: "blur(60px)",
                                opacity: 0.35
                            }}
                        />

                        {/* BADGE */}
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                delay: 0.25,
                                type: "spring",
                                stiffness: 260,
                                damping: 14
                            }}
                            className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center"
                        >

                            {/* RARE AURA RING */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 10,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="absolute inset-0 rounded-full border"
                                style={{ borderColor: badge.glow }}
                            />

                            {/* BADGE FRAME */}
                            <div
                                className="w-24 h-24 rounded-[2rem] flex items-center justify-center rotate-45 border"
                                style={{
                                    background: badge.gradient,
                                    borderColor: badge.glow,
                                    boxShadow: `0 0 40px ${badge.glow}`
                                }}
                            >
                                <Flame className="w-10 h-10 text-white -rotate-45" />
                            </div>

                            {/* MILESTONE */}
                            <motion.div
                                initial={{ y: 30, opacity: 0, scale: 0.7 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 0.6,
                                    type: "spring",
                                    stiffness: 300
                                }}
                                className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg border-4"
                                style={{
                                    background: badge.gradient,
                                    borderColor: "rgba(0,0,0,0.6)"
                                }}
                            >
                                {milestone}
                            </motion.div>

                        </motion.div>

                        {/* TEXT */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >

                            <span
                                className="inline-block mb-3 text-xs font-bold tracking-widest uppercase"
                                style={{ color: badge.glow }}
                            >
                                {badge.rarity} BADGE UNLOCKED
                            </span>

                            <h2 className="text-3xl font-black text-white mb-2">
                                {badge.name}
                            </h2>

                            <p className="text-neutral-400 text-sm mb-8">
                                Kamu berhasil streak <strong>{milestone} hari</strong>.
                                Badge ini masuk ke koleksimu.
                            </p>

                        </motion.div>

                        {/* BUTTON */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                            style={{ background: badge.gradient }}
                        >
                            <Trophy size={18} />
                            Lanjutkan
                        </motion.button>

                    </motion.div>

                </div>

            )}
        </AnimatePresence>,
        document.body
    )
}