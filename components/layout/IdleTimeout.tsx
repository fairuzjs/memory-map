"use client"

import { useSession, signOut } from "next-auth/react"
import { useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, ShieldAlert, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { useIdleTimeout } from "@/hooks/useIdleTimeout"

const IDLE_MS = 2 * 60 * 1_000  // 2 minutes total idle time
const WARNING_MS = 30 * 1_000      // show warning in the last 30 seconds

export function IdleTimeout() {
    const { data: session, status } = useSession()
    const isAuthenticated = status === "authenticated" && !!session?.user
    const pathname = usePathname()

    const handleIdle = useCallback(() => {
        // Silent logout — redirect to corresponding login page
        const isAdminArea = pathname?.startsWith('/admin')
        signOut({ callbackUrl: isAdminArea ? "/admin/login" : "/login" })
    }, [pathname])

    const { secondsLeft, isWarning, reset } = useIdleTimeout({
        idleMs: IDLE_MS,
        warningMs: WARNING_MS,
        onIdle: handleIdle,
        enabled: isAuthenticated,
    })

    // Format mm:ss
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
    const ss = String(secondsLeft % 60).padStart(2, "0")

    return (
        <AnimatePresence>
            {isWarning && isAuthenticated && (
                <motion.div
                    key="idle-warning"
                    initial={{ opacity: 0, y: 32, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="fixed bottom-6 right-6 z-[9999] w-[320px] select-none"
                    role="alertdialog"
                    aria-live="assertive"
                    aria-label="Session expiry warning"
                >
                    {/* Card */}
                    <div
                        className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-2xl"
                        style={{ background: "linear-gradient(135deg, rgba(12,12,24,0.97) 0%, rgba(20,16,36,0.97) 100%)" }}
                    >
                        {/* Urgent top-edge glow */}
                        <div
                            className="absolute top-0 left-0 right-0 h-px"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.7), rgba(251,146,60,0.7), transparent)" }}
                        />

                        {/* Progress bar — shrinks from full to 0 over WARNING_MS seconds */}
                        <div
                            className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000 ease-linear rounded-t-2xl"
                            style={{ width: `${(secondsLeft / (WARNING_MS / 1000)) * 100}%` }}
                        />

                        <div className="p-5">
                            {/* Header row */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                    <ShieldAlert className="w-4 h-4 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white leading-tight">Session expiring soon</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">No activity detected</p>
                                </div>
                            </div>

                            {/* Countdown display */}
                            <div
                                className="flex items-center justify-center gap-3 py-3 mb-4 rounded-xl border border-white/[0.05]"
                                style={{ background: "rgba(239,68,68,0.06)" }}
                            >
                                <Clock className="w-4 h-4 text-red-400 shrink-0" />
                                <span className="text-2xl font-bold font-[Outfit] tabular-nums text-white tracking-tight">
                                    {mm}:{ss}
                                </span>
                                <span className="text-xs text-neutral-500">until logout</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2.5">
                                <button
                                    onClick={reset}
                                    className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                >
                                    Stay logged in
                                </button>
                                <button
                                    onClick={handleIdle}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-neutral-400 border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:text-red-400 transition-all active:scale-95"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
