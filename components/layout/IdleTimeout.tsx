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
                        className="relative bg-[var(--mm-surface)] border-[4px] border-[var(--mm-border)] shadow-[8px_8px_0_var(--mm-shadow)] overflow-hidden"
                    >
                        {/* Progress bar — shrinks from full to 0 over WARNING_MS seconds */}
                        <div
                            className="absolute top-0 left-0 h-[6px] bg-[var(--mm-accent)] transition-all duration-1000 ease-linear border-b-[3px] border-[var(--mm-border)] z-10"
                            style={{ width: `${(secondsLeft / (WARNING_MS / 1000)) * 100}%` }}
                        />

                        <div className="p-5 pt-7">
                            {/* Header row */}
                            <div className="flex items-start gap-3 mb-5">
                                <div className="w-10 h-10 bg-[var(--mm-primary)] border-[3px] border-[var(--mm-border)] flex items-center justify-center shrink-0 shadow-[2px_2px_0_var(--mm-shadow)]">
                                    <ShieldAlert className="w-5 h-5 text-[var(--mm-ink)]" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-black uppercase text-[var(--mm-ink)] leading-tight tracking-tight">Sesi Berakhir</p>
                                    <p className="text-[11px] font-bold text-[var(--mm-ink-muted)] mt-1 uppercase tracking-wider">Tidak ada aktivitas</p>
                                </div>
                            </div>

                            {/* Countdown display */}
                            <div
                                className="flex items-center justify-center gap-3 py-4 mb-5 border-[3px] border-[var(--mm-border)] bg-[var(--mm-bg)] shadow-[4px_4px_0_var(--mm-shadow)]"
                            >
                                <Clock className="w-5 h-5 text-[var(--mm-ink)] shrink-0" />
                                <span className="text-3xl font-black font-[Outfit] tabular-nums text-[var(--mm-ink)] tracking-tight" style={{ textShadow: "2px 2px 0 var(--mm-secondary)" }}>
                                    {mm}:{ss}
                                </span>
                                <span className="text-[11px] font-black uppercase text-[var(--mm-ink-muted)]">detik</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="flex-1 py-3 bg-[var(--mm-secondary)] border-[3px] border-[var(--mm-border)] text-[13px] font-black uppercase text-[var(--mm-ink)] shadow-[4px_4px_0_var(--mm-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--mm-shadow)] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                >
                                    Tetap Login
                                </button>
                                <button
                                    onClick={handleIdle}
                                    className="flex items-center justify-center gap-1.5 px-4 py-3 bg-[var(--mm-surface)] border-[3px] border-[var(--mm-border)] text-[13px] font-black uppercase text-[var(--mm-ink)] shadow-[4px_4px_0_var(--mm-shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--mm-shadow)] hover:bg-[var(--mm-danger)] hover:text-white transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
