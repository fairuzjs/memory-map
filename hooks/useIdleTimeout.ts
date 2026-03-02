import { useEffect, useRef, useCallback, useState } from "react"

interface UseIdleTimeoutOptions {
    /** Total idle time in milliseconds before triggering onIdle */
    idleMs: number
    /** How many ms before expiry to start showing a warning */
    warningMs?: number
    /** Called when the user has been idle for idleMs */
    onIdle: () => void
    /** Only start tracking when enabled (e.g. user is logged in) */
    enabled?: boolean
}

interface UseIdleTimeoutReturn {
    /** Seconds remaining until logout */
    secondsLeft: number
    /** Whether we are in the "warning" window */
    isWarning: boolean
    /** Manually reset the idle timer (e.g. when user clicks "Stay logged in") */
    reset: () => void
}

// Events that count as "user activity"
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "touchmove",
    "scroll",
    "click",
    "wheel",
    "focus",
]

export function useIdleTimeout({
    idleMs,
    warningMs = 30_000,
    onIdle,
    enabled = true,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
    const [secondsLeft, setSecondsLeft] = useState(Math.round(idleMs / 1000))
    const [isWarning, setIsWarning] = useState(false)

    // Use refs for timer handles so we never capture stale closures
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const expiresAtRef = useRef<number>(Date.now() + idleMs)
    const onIdleRef = useRef(onIdle)

    // Keep onIdle ref fresh without re-registering event listeners
    useEffect(() => {
        onIdleRef.current = onIdle
    }, [onIdle])

    const clearTimers = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
    }, [])

    const startCountdown = useCallback(() => {
        // tick every second to update the UI counter
        if (countdownRef.current) clearInterval(countdownRef.current)
        countdownRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.round((expiresAtRef.current - Date.now()) / 1000))
            setSecondsLeft(remaining)
            setIsWarning(remaining <= Math.round(warningMs / 1000))
        }, 1_000)
    }, [warningMs])

    const reset = useCallback(() => {
        if (!enabled) return

        clearTimers()

        expiresAtRef.current = Date.now() + idleMs
        setSecondsLeft(Math.round(idleMs / 1000))
        setIsWarning(false)

        // Schedule the logout
        idleTimerRef.current = setTimeout(() => {
            clearTimers()
            onIdleRef.current()
        }, idleMs)

        startCountdown()
    }, [enabled, idleMs, clearTimers, startCountdown])

    useEffect(() => {
        if (!enabled) {
            clearTimers()
            return
        }

        // Start fresh
        reset()

        // Throttled activity handler — only resets once per second at most
        let lastReset = 0
        const handleActivity = () => {
            const now = Date.now()
            if (now - lastReset > 1_000) {
                lastReset = now
                reset()
            }
        }

        ACTIVITY_EVENTS.forEach(event =>
            window.addEventListener(event, handleActivity, { passive: true })
        )

        return () => {
            clearTimers()
            ACTIVITY_EVENTS.forEach(event =>
                window.removeEventListener(event, handleActivity)
            )
        }
        // reset is stable (useCallback), clearTimers is stable
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, idleMs])

    return { secondsLeft, isWarning, reset }
}
