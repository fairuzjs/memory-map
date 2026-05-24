"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    type ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { AnimatePresence } from "framer-motion"

import { SpotlightOverlay } from "./SpotlightOverlay"
import { OnboardingTooltip } from "./OnboardingTooltip"
import { GuideSelectionPopup } from "./GuideSelectionPopup"
import { WelcomeIntroModal } from "./WelcomeIntroModal"
import {
    FIRST_MEMORY_STEPS,
    ALBUM_GUIDE_STEPS,
    GUIDE_DEFINITIONS,
    ONBOARDING_STORAGE_KEYS,
    createNavigationStep,
    type OnboardingStep,
    type GuideDefinition,
} from "./onboardingSteps"

// ─── Confetti effect (simple CSS-based) ─────────────────────────────────────
function ConfettiOverlay({ onDone }: { onDone: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDone, 3500)
        return () => clearTimeout(timer)
    }, [onDone])

    return (
        <div className="fixed inset-0 z-[10010] pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => {
                const colors = ["#FFFF00", "#00FFFF", "#FF00FF", "#00FF00", "#FF6600", "#FFFFFF"]
                const color = colors[i % colors.length]
                const left = Math.random() * 100
                const delay = Math.random() * 1.2
                const duration = 2 + Math.random() * 1.5
                const size = 6 + Math.random() * 10
                const rotate = Math.random() * 360
                return (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${left}%`,
                            top: "-20px",
                            width: size,
                            height: size,
                            backgroundColor: color,
                            border: "2px solid #000",
                            transform: `rotate(${rotate}deg)`,
                            animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
                        }}
                    />
                )
            })}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

// ─── Success Modal ──────────────────────────────────────────────────────────
function SuccessModal({ onClose }: { onClose: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-[10000] bg-black/70" onClick={onClose} />
            <div
                className="fixed z-[10001] bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-6 text-center"
                style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "calc(100vw - 32px)",
                    maxWidth: 400,
                }}
            >
                <div className="w-16 h-16 mx-auto mb-4 bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center">
                    <span className="text-3xl">🎉</span>
                </div>
                <h2
                    className="text-xl font-black text-black uppercase mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                    Selamat!
                </h2>
                <p className="text-sm text-black/70 font-medium mb-6 leading-relaxed">
                    Kenangan pertamamu berhasil dibuat. Sekarang kamu bisa menjelajahi peta dan melihat kenanganmu di sana!
                </p>
                <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-black uppercase bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                    style={{ minHeight: 44 }}
                >
                    Lihat Kenanganku
                </button>
            </div>
        </>
    )
}

// ─── Types ──────────────────────────────────────────────────────────────────
type OnboardingMode = "idle" | "welcome-intro" | "guide-selection" | "active-tutorial"

// ─── Context ────────────────────────────────────────────────────────────────
interface OnboardingContextType {
    isActive: boolean
    currentStepIndex: number
    currentStep: OnboardingStep | null
    mode: OnboardingMode
    startOnboarding: () => void
    openGuideSelection: () => void
    completeOnboarding: () => void
    /** Called by the create memory form after successful submit */
    notifyMemoryCreated: () => void
    /** Programmatically advance to the next step */
    advanceStep: () => void
}

const OnboardingContext = createContext<OnboardingContextType>({
    isActive: false,
    currentStepIndex: 0,
    currentStep: null,
    mode: "idle",
    startOnboarding: () => {},
    openGuideSelection: () => {},
    completeOnboarding: () => {},
    notifyMemoryCreated: () => {},
    advanceStep: () => {},
})

export const useOnboarding = () => useContext(OnboardingContext)

// ─── Utility: detect mobile ─────────────────────────────────────────────────
function isMobileViewport(): boolean {
    if (typeof window === "undefined") return false
    return window.innerWidth < 768
}

// ─── Utility: wait for element ──────────────────────────────────────────────
function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
        const existing = document.querySelector(selector)
        if (existing) return resolve(existing)

        const interval = setInterval(() => {
            const el = document.querySelector(selector)
            if (el) {
                clearInterval(interval)
                resolve(el)
            }
        }, 200)

        setTimeout(() => {
            clearInterval(interval)
            resolve(null)
        }, timeout)
    })
}

// ─── Utility: wait for route ────────────────────────────────────────────────
function waitForRoute(targetPath: string, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.location.pathname === targetPath) return resolve(true)
        const start = Date.now()
        const interval = setInterval(() => {
            if (window.location.pathname === targetPath) {
                clearInterval(interval)
                resolve(true)
            } else if (Date.now() - start > timeout) {
                clearInterval(interval)
                resolve(false)
            }
        }, 100)
    })
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()

    const [mode, setMode] = useState<OnboardingMode>("idle")
    const [stepIndex, setStepIndex] = useState(0)
    const [steps, setSteps] = useState<OnboardingStep[]>(FIRST_MEMORY_STEPS)
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [hasChecked, setHasChecked] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null)

    const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const rectPollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const actionListenerCleanup = useRef<(() => void) | null>(null)

    const isActive = mode === "active-tutorial"
    const isGuideOpen = mode === "guide-selection"
    const isWelcomeOpen = mode === "welcome-intro"
    const currentStep = steps[stepIndex] ?? null

    const getStorageKey = useCallback((key: string) => {
        return `${key}_${session?.user?.id || "guest"}`
    }, [session?.user?.id])

    // ── LocalStorage helpers (DB-ready abstraction) ─────────
    const isCompleted = useCallback(() => {
        if (typeof window === "undefined") return true
        return localStorage.getItem(getStorageKey(ONBOARDING_STORAGE_KEYS.completed)) === "true"
    }, [getStorageKey])

    const hasSeenWelcome = useCallback(() => {
        if (typeof window === "undefined") return true
        return localStorage.getItem(getStorageKey(ONBOARDING_STORAGE_KEYS.welcomeGuide)) === "true"
    }, [getStorageKey])

    const markCompleted = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(getStorageKey(ONBOARDING_STORAGE_KEYS.completed), "true")
        }
        // Also persist to DB
        fetch("/api/onboarding", { method: "PATCH" }).catch(() => {})
    }, [getStorageKey])

    const markWelcomeSeen = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(getStorageKey(ONBOARDING_STORAGE_KEYS.welcomeGuide), "true")
        }
        // Persist to DB
        fetch("/api/onboarding", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: "welcomeGuide" }),
        }).catch(() => {})
    }, [getStorageKey])

    const markFirstMemory = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(getStorageKey(ONBOARDING_STORAGE_KEYS.firstMemoryCreated), "true")
        }
    }, [getStorageKey])

    const saveStep = useCallback((idx: number) => {
        if (typeof window !== "undefined") {
            localStorage.setItem(getStorageKey(ONBOARDING_STORAGE_KEYS.currentStep), String(idx))
        }
    }, [getStorageKey])

    // ── Auto-show check on first load ───────────────────────
    // Priority: welcome-intro (new user) > guide-selection (returning user who hasn't completed)
    useEffect(() => {
        if (!session?.user?.id || hasChecked) return
        if (pathname !== "/dashboard") return

        // Fast-path: check localStorage first
        const localWelcomeSeen = hasSeenWelcome()
        const localCompleted = isCompleted()

        if (localWelcomeSeen && localCompleted) {
            setHasChecked(true)
            return
        }

        fetch("/api/onboarding")
            .then(r => r.json())
            .then(data => {
                setHasChecked(true)

                const dbWelcomeSeen = data.hasSeenWelcomeGuide ?? false
                const dbCompleted = data.hasCompletedOnboarding ?? false

                // Sync DB state to localStorage
                if (dbWelcomeSeen) {
                    localStorage.setItem(getStorageKey(ONBOARDING_STORAGE_KEYS.welcomeGuide), "true")
                }
                if (dbCompleted) {
                    localStorage.setItem(getStorageKey(ONBOARDING_STORAGE_KEYS.completed), "true")
                }

                if (!dbWelcomeSeen && !localWelcomeSeen) {
                    // Brand new user → show Welcome Popup first
                    setTimeout(() => {
                        setMode("welcome-intro")
                    }, 1200)
                } else if (!dbCompleted && !localCompleted) {
                    // Returning user who skipped welcome but hasn't completed onboarding
                    // Don't auto-open anything — they can use the Panduan button
                }
            })
            .catch(() => setHasChecked(true))
    }, [session?.user?.id, pathname, hasChecked, isCompleted, hasSeenWelcome, getStorageKey])

    // ── Welcome intro handlers ──────────────────────────────
    const handleWelcomeSkip = useCallback(() => {
        setMode("idle")
        markWelcomeSeen()
        markCompleted() // Mark onboarding done so it never shows again
    }, [markWelcomeSeen, markCompleted])

    const handleWelcomeOpenGuide = useCallback(() => {
        markWelcomeSeen()
        // Transition: welcome-intro → guide-selection (Buku Panduan)
        setMode("guide-selection")
    }, [markWelcomeSeen])

    // ── Target element tracking ─────────────────────────────
    const updateTargetRect = useCallback(() => {
        if (!currentStep?.targetSelector || currentStep.position === "center") {
            setTargetRect(null)
            return
        }

        // Try primary selector first, then mobile alternative
        let el = document.querySelector(currentStep.targetSelector)

        if (!el && currentStep.mobileTargetSelector && isMobileViewport()) {
            el = document.querySelector(currentStep.mobileTargetSelector)
        }

        if (el) {
            const rect = el.getBoundingClientRect()
            setTargetRect(rect)

            // Scroll into view if needed
            if (currentStep.scrollToTarget) {
                const elTop = rect.top
                const elBottom = rect.bottom
                const vh = window.innerHeight
                if (elTop < 80 || elBottom > vh - 80) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" })
                    // Re-measure after scroll
                    setTimeout(() => {
                        setTargetRect(el!.getBoundingClientRect())
                    }, 400)
                }
            }
        } else {
            setTargetRect(null)
        }
    }, [currentStep])

    // Resize + scroll listeners
    useEffect(() => {
        if (!isActive) return

        // Initial measurement with a small delay for route transitions
        const initTimer = setTimeout(updateTargetRect, 300)

        const handleResize = () => {
            if (resizeTimer.current) clearTimeout(resizeTimer.current)
            resizeTimer.current = setTimeout(updateTargetRect, 100)
        }

        // Poll for element availability (in case of delayed renders)
        rectPollTimer.current = setInterval(() => {
            if (currentStep?.targetSelector) {
                let el = document.querySelector(currentStep.targetSelector)
                if (!el && currentStep.mobileTargetSelector && isMobileViewport()) {
                    el = document.querySelector(currentStep.mobileTargetSelector)
                }
                if (el) {
                    setTargetRect(el.getBoundingClientRect())
                    if (rectPollTimer.current) clearInterval(rectPollTimer.current)
                }
            }
        }, 500)

        // Stop polling after 5 seconds
        const stopPollTimer = setTimeout(() => {
            if (rectPollTimer.current) clearInterval(rectPollTimer.current)
        }, 5000)

        let scrollRafId: number | null = null
        const handleScroll = () => {
            if (scrollRafId === null) {
                scrollRafId = requestAnimationFrame(() => {
                    updateTargetRect()
                    scrollRafId = null
                })
            }
        }

        window.addEventListener("resize", handleResize)
        window.addEventListener("scroll", handleScroll, true)

        return () => {
            clearTimeout(initTimer)
            clearTimeout(stopPollTimer)
            if (resizeTimer.current) clearTimeout(resizeTimer.current)
            if (rectPollTimer.current) clearInterval(rectPollTimer.current)
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("scroll", handleScroll, true)
            if (scrollRafId !== null) cancelAnimationFrame(scrollRafId)
        }
    }, [isActive, stepIndex, updateTargetRect, currentStep])

    // ── Block body scroll only during active tutorial (skip for floating helpers) ───
    useEffect(() => {
        if (isActive && !currentStep?.isFloatingHelper) {
            document.body.style.overflow = "hidden"
            document.body.style.touchAction = "none"
        } else {
            document.body.style.overflow = ""
            document.body.style.touchAction = ""
        }
        return () => {
            document.body.style.overflow = ""
            document.body.style.touchAction = ""
        }
    }, [isActive, currentStep])

    // ── Route navigation for step requirements ──────────────
    useEffect(() => {
        if (!isActive || !currentStep?.requiredPath) return
        const targetPath = currentStep.requiredPath.replace("__USER__", session?.user?.id || "")
        if (pathname !== targetPath) {
            router.push(targetPath)
        }
    }, [isActive, stepIndex, currentStep, pathname, router, session?.user?.id])

    // ── Action step: auto-advance when user interacts with target ──
    useEffect(() => {
        if (!isActive || !currentStep?.isActionStep || !currentStep?.targetSelector) return
        if (currentStep.manualAdvance) return // Skip auto-advance if step is manual

        // Cleanup previous listener
        if (actionListenerCleanup.current) {
            actionListenerCleanup.current()
            actionListenerCleanup.current = null
        }

        const setupActionListener = async () => {
            // Find the target element
            let el = document.querySelector(currentStep.targetSelector!)
            if (!el && currentStep.mobileTargetSelector && isMobileViewport()) {
                el = document.querySelector(currentStep.mobileTargetSelector)
            }

            if (!el) {
                // Wait for element to appear
                el = await waitForElement(currentStep.targetSelector!, 5000)
                if (!el && currentStep.mobileTargetSelector) {
                    el = await waitForElement(currentStep.mobileTargetSelector, 3000)
                }
            }

            if (!el) return // Target not found, fallback handled by tooltip

            let hasAdvanced = false

            const handleAction = () => {
                if (hasAdvanced) return
                hasAdvanced = true

                // Wait for the action's side effects (route change, DOM update, etc.)
                const delay = currentStep.actionDelay || 500
                setTimeout(() => {
                    const nextIdx = stepIndex + 1
                    if (nextIdx < steps.length) {
                        setStepIndex(nextIdx)
                        saveStep(nextIdx)
                    }
                }, delay)
            }

            // Use event capture to observe the click without interfering
            el.addEventListener("click", handleAction, { once: true })

            // Also listen for any link navigation within the target
            const links = el.querySelectorAll("a")
            links.forEach(link => {
                link.addEventListener("click", handleAction, { once: true })
            })

            actionListenerCleanup.current = () => {
                el?.removeEventListener("click", handleAction)
                links.forEach(link => {
                    link.removeEventListener("click", handleAction)
                })
            }
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(setupActionListener, 400)

        return () => {
            clearTimeout(timer)
            if (actionListenerCleanup.current) {
                actionListenerCleanup.current()
                actionListenerCleanup.current = null
            }
        }
    }, [isActive, stepIndex, currentStep, steps.length, saveStep])

    // ── DOM observer auto-advance (for modal close detection) ──
    useEffect(() => {
        if (!isActive || !currentStep?.observeSelector) return

        // Track whether we've already advanced to prevent double-fire
        let hasAdvanced = false
        // Track whether the observed element was initially present
        let wasPresent = !!document.querySelector(currentStep.observeSelector)

        const observer = new MutationObserver(() => {
            if (hasAdvanced) return

            const el = document.querySelector(currentStep.observeSelector!)

            if (currentStep.observeDisappear) {
                // Wait until the element appears first, then advance when it disappears
                if (el) {
                    wasPresent = true
                } else if (wasPresent && !el) {
                    hasAdvanced = true
                    const delay = currentStep.actionDelay || 500
                    setTimeout(() => {
                        const nextIdx = stepIndex + 1
                        if (nextIdx < steps.length) {
                            setStepIndex(nextIdx)
                            saveStep(nextIdx)
                        }
                    }, delay)
                }
            }
        })

        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
        }
    }, [isActive, stepIndex, currentStep, steps.length, saveStep])

    // ── Actions ─────────────────────────────────────────────
    const handleNext = useCallback(() => {
        setStepIndex((prevIdx) => {
            const nextIdx = prevIdx + 1
            if (nextIdx < steps.length) {
                saveStep(nextIdx)
                return nextIdx
            }
            return prevIdx
        })
    }, [steps.length, saveStep])

    const handleBack = useCallback(() => {
        setStepIndex((prevIdx) => {
            if (prevIdx > 0) {
                const nextIdx = prevIdx - 1
                saveStep(nextIdx)
                return nextIdx
            }
            return prevIdx
        })
    }, [saveStep])

    const handleSkip = useCallback(() => {
        setMode("idle")
        setStepIndex(0)
        setActiveGuideKey(null)
        // Only mark completed if it was the firstMemory guide
        if (activeGuideKey === "firstMemory" || !activeGuideKey) {
            markCompleted()
        }
    }, [markCompleted, activeGuideKey])

    const handleFinish = useCallback(() => {
        setMode("idle")
        setStepIndex(0)
        setActiveGuideKey(null)
        if (activeGuideKey === "firstMemory" || !activeGuideKey) {
            markCompleted()
        }
    }, [markCompleted, activeGuideKey])

    // ── Open guide selection popup ──────────────────────────
    const openGuideSelection = useCallback(() => {
        setMode("guide-selection")
    }, [])

    // ── Start first memory onboarding directly ─────────────
    const startOnboarding = useCallback(() => {
        setSteps(FIRST_MEMORY_STEPS)
        setStepIndex(0)
        setActiveGuideKey("firstMemory")
        setMode("active-tutorial")
    }, [])

    // ── Handle guide selection from popup ───────────────────
    const handleSelectGuide = useCallback(async (guide: GuideDefinition) => {
        setMode("idle") // Close popup first

        if (guide.useSteps) {
            // Full step-by-step tutorial (firstMemory or album)
            if (guide.key === "album") {
                setSteps(ALBUM_GUIDE_STEPS)
            } else {
                setSteps(FIRST_MEMORY_STEPS)
            }
            setStepIndex(0)
            setActiveGuideKey(guide.key)
            // Small delay for popup close animation
            setTimeout(() => {
                setMode("active-tutorial")
            }, 250)
            return
        }

        // Navigation-based guide: navigate to page, optionally highlight
        let targetPath = guide.navigateTo || "/dashboard"

        // Replace __USER__ placeholder with actual user ID
        if (session?.user?.id) {
            targetPath = targetPath.replace("__USER__", session.user.id)
        }

        // Check if we're on mobile and need hamburger menu flow
        if (isMobileViewport() && targetPath !== pathname) {
            // On mobile: open the hamburger menu
            const hamburgerBtn = document.querySelector("[data-tutorial='mobile-menu-button']")
            if (hamburgerBtn) {
                // Check if drawer is already open
                const drawer = document.querySelector("[data-tutorial='mobile-drawer']")
                if (!drawer) {
                    ;(hamburgerBtn as HTMLElement).click()
                    // Wait for drawer to render
                    await new Promise(r => setTimeout(r, 400))
                }
            }
        }

        // Navigate to the target page
        if (targetPath !== pathname) {
            router.push(targetPath)
        }

        // If there's a highlight selector, start a simple 1-step highlight guide
        if (guide.highlightSelector) {
            setActiveGuideKey(guide.key)
            const navStep = createNavigationStep(guide, guide.highlightSelector)
            navStep.requiredPath = targetPath
            setSteps([navStep])
            setStepIndex(0)

            // Wait for page to load then show
            setTimeout(() => {
                setMode("active-tutorial")
            }, 800)
        }
    }, [router, pathname, session?.user?.id])

    // ── Close guide selection ───────────────────────────────
    const handleCloseGuideSelection = useCallback(() => {
        setMode("idle")
    }, [])

    const completeOnboarding = useCallback(() => {
        setMode("idle")
        setStepIndex(0)
        setActiveGuideKey(null)
        markCompleted()
    }, [markCompleted])

    const notifyMemoryCreated = useCallback(() => {
        markFirstMemory()
        markCompleted()
        setMode("idle")
        setStepIndex(0)
        setActiveGuideKey(null)

        // Show success + confetti
        setShowConfetti(true)
        setShowSuccess(true)
    }, [markFirstMemory, markCompleted])

    // ── Keyboard navigation ─────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isWelcomeOpen) {
                    handleWelcomeSkip()
                } else if (isGuideOpen) {
                    handleCloseGuideSelection()
                } else if (isActive) {
                    handleSkip()
                }
            } else if (isActive) {
                if (e.key === "ArrowRight" || e.key === "Enter") {
                    // Don't auto-advance on action steps
                    if (currentStep?.isActionStep) return
                    if (stepIndex === steps.length - 1) handleFinish()
                    else handleNext()
                } else if (e.key === "ArrowLeft") {
                    handleBack()
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isActive, isGuideOpen, isWelcomeOpen, stepIndex, handleNext, handleBack, handleSkip, handleFinish, handleCloseGuideSelection, handleWelcomeSkip, steps.length, currentStep])

    // ── Expose globally for Navbar GuideBook button ─────────
    useEffect(() => {
        ;(window as any).__openOnboardingGuide = openGuideSelection
        return () => {
            delete (window as any).__openOnboardingGuide
        }
    }, [openGuideSelection])

    // ── Handle success close ────────────────────────────────
    const handleSuccessClose = useCallback(() => {
        setShowSuccess(false)
        setShowConfetti(false)
        router.push("/memories")
    }, [router])

    const contextValue = useMemo(() => ({
        isActive,
        currentStepIndex: stepIndex,
        currentStep,
        mode,
        startOnboarding,
        openGuideSelection,
        completeOnboarding,
        notifyMemoryCreated,
        advanceStep: handleNext,
    }), [isActive, stepIndex, currentStep, mode, startOnboarding, openGuideSelection, completeOnboarding, notifyMemoryCreated, handleNext])

    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}

            {/* Confetti */}
            {showConfetti && (
                <ConfettiOverlay onDone={() => setShowConfetti(false)} />
            )}

            {/* Success modal */}
            {showSuccess && (
                <SuccessModal onClose={handleSuccessClose} />
            )}

            {/* Welcome Intro Modal (Mode: welcome-intro) — new user first visit */}
            <WelcomeIntroModal
                isOpen={isWelcomeOpen}
                onOpenGuide={handleWelcomeOpenGuide}
                onSkip={handleWelcomeSkip}
            />

            {/* Guide Selection Popup (Mode: guide-selection) */}
            <GuideSelectionPopup
                isOpen={isGuideOpen}
                onClose={handleCloseGuideSelection}
                onSelectGuide={handleSelectGuide}
            />

            {/* Active Tutorial Overlay (Mode: active-tutorial) */}
            <AnimatePresence mode="wait">
                {isActive && currentStep && (
                    <div key={`onboarding-${stepIndex}`}>
                        {/* Skip spotlight overlay for floating helper steps */}
                        {!currentStep.isFloatingHelper && (
                            <SpotlightOverlay
                                targetRect={targetRect}
                                onClickOverlay={() => {}}
                                passThrough={currentStep.allowInteraction}
                            />
                        )}
                        <OnboardingTooltip
                            step={currentStep}
                            currentIndex={stepIndex}
                            totalSteps={steps.length}
                            targetRect={targetRect}
                            onNext={handleNext}
                            onBack={handleBack}
                            onSkip={handleSkip}
                            onFinish={handleFinish}
                        />
                    </div>
                )}
            </AnimatePresence>
        </OnboardingContext.Provider>
    )
}

// ─── Helper for Navbar ──────────────────────────────────────────────────────
export function openOnboardingGuide() {
    if (typeof window !== "undefined" && (window as any).__openOnboardingGuide) {
        ;(window as any).__openOnboardingGuide()
    }
}
