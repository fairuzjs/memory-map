"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X, CheckCircle2, MousePointerClick } from "lucide-react"
import type { OnboardingStep } from "./onboardingSteps"

interface OnboardingTooltipProps {
    step: OnboardingStep
    currentIndex: number
    totalSteps: number
    targetRect: DOMRect | null
    onNext: () => void
    onBack: () => void
    onSkip: () => void
    onFinish: () => void
}

type Placement = "below" | "above" | "left" | "right" | "center"

/**
 * Mobile-first tooltip/card for onboarding steps.
 * Smart positioning: tries below → above → left → right → fallback center.
 * Never overlaps the target element.
 * Supports action steps where user must interact with the highlighted element.
 */
export function OnboardingTooltip({
    step,
    currentIndex,
    totalSteps,
    targetRect,
    onNext,
    onBack,
    onSkip,
    onFinish,
}: OnboardingTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const [tooltipSize, setTooltipSize] = useState({ w: 380, h: 260 })
    const Icon = step.icon
    const isFirst = currentIndex === 0
    const isLast = currentIndex === totalSteps - 1
    const isCenter = step.position === "center" || !targetRect
    const isAction = step.isActionStep && !isCenter

    // ── Measure actual tooltip size after render ─────────────
    const measureTooltip = useCallback(() => {
        if (tooltipRef.current) {
            const { offsetWidth, offsetHeight } = tooltipRef.current
            if (offsetWidth > 0 && offsetHeight > 0) {
                setTooltipSize({ w: offsetWidth, h: offsetHeight })
            }
        }
    }, [])

    useEffect(() => {
        // Measure after a frame to get actual rendered size
        const raf = requestAnimationFrame(measureTooltip)
        return () => cancelAnimationFrame(raf)
    }, [currentIndex, measureTooltip])

    // ── Compute placement & position ─────────────────────────
    const positionStyle = useMemo((): React.CSSProperties => {
        if (step.isFloatingHelper) {
            const vw = typeof window !== "undefined" ? window.innerWidth : 375
            const tw = Math.min(380, vw - 32)
            const left = (vw - tw) / 2
            return {
                position: "fixed",
                top: "16px",
                left,
                width: tw,
            }
        }

        if (isCenter || !targetRect) {
            return {
                position: "fixed",
                inset: 0,
                margin: "auto",
                width: "fit-content",
                height: "fit-content",
            }
        }

        const vw = typeof window !== "undefined" ? window.innerWidth : 375
        const vh = typeof window !== "undefined" ? window.innerHeight : 667
        const safeMargin = 12
        const gap = 14
        const tw = Math.min(420, vw - 24)
        const th = tooltipSize.h

        // Available space in each direction
        const spaceBelow = vh - targetRect.bottom - gap - safeMargin
        const spaceAbove = targetRect.top - gap - safeMargin
        const spaceRight = vw - targetRect.right - gap - safeMargin
        const spaceLeft = targetRect.left - gap - safeMargin

        // Pick best placement
        let placement: Placement = "below"
        if (spaceBelow >= th) {
            placement = "below"
        } else if (spaceAbove >= th) {
            placement = "above"
        } else if (spaceRight >= tw && vw >= 768) {
            placement = "right"
        } else if (spaceLeft >= tw && vw >= 768) {
            placement = "left"
        } else if (spaceBelow >= spaceAbove) {
            // Neither fits perfectly — pick the side with more space
            placement = "below"
        } else {
            placement = "above"
        }

        let top = 0
        let left = 0

        switch (placement) {
            case "below":
                top = targetRect.bottom + gap
                left = targetRect.left + targetRect.width / 2 - tw / 2
                // If it overflows bottom, clamp it
                if (top + th > vh - safeMargin) {
                    top = vh - th - safeMargin
                }
                break

            case "above":
                top = targetRect.top - th - gap
                left = targetRect.left + targetRect.width / 2 - tw / 2
                // If it overflows top, clamp it
                if (top < safeMargin) {
                    top = safeMargin
                }
                break

            case "right":
                top = targetRect.top + targetRect.height / 2 - th / 2
                left = targetRect.right + gap
                break

            case "left":
                top = targetRect.top + targetRect.height / 2 - th / 2
                left = targetRect.left - tw - gap
                break

            default:
                top = vh / 2 - th / 2
                left = vw / 2 - tw / 2
        }

        // Clamp within viewport
        if (left < safeMargin) left = safeMargin
        if (left + tw > vw - safeMargin) left = vw - tw - safeMargin
        if (top < safeMargin) top = safeMargin
        if (top + th > vh - safeMargin) top = vh - th - safeMargin

        return {
            position: "fixed",
            top,
            left,
        }
    }, [isCenter, targetRect, tooltipSize.h])

    // ── Focus management ────────────────────────────────────────
    useEffect(() => {
        tooltipRef.current?.focus()
    }, [currentIndex])

    if (step.isFloatingHelper) {
        return (
            <motion.div
                ref={tooltipRef}
                tabIndex={-1}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="z-[10005] outline-none"
                style={{
                    pointerEvents: "auto",
                    ...positionStyle,
                }}
            >
                <div
                    className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] overflow-hidden flex flex-col"
                    style={{
                        paddingBottom: "env(safe-area-inset-bottom, 0px)",
                    }}
                >
                    {/* ── Header ─────────────────────────────────────── */}
                    <div
                        className="flex items-center justify-between px-3 py-2 border-b-[2.5px] border-black shrink-0"
                        style={{ backgroundColor: step.accentColor }}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 shrink-0 bg-white border-[2px] border-black shadow-[1px_1px_0_#000] flex items-center justify-center">
                                <Icon className="w-3 h-3 text-black" />
                            </div>
                            <span className="text-[10px] font-black text-black uppercase tracking-widest truncate">
                                Langkah {currentIndex + 1} / {totalSteps}
                            </span>
                        </div>
                        <button
                            onClick={onSkip}
                            className="p-1 shrink-0 bg-white border-[2px] border-black hover:bg-black hover:text-white transition-all text-xs font-black"
                            title="Lewati Tutorial"
                            style={{ minWidth: 22, minHeight: 22, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* ── Body ───────────────────────────────────────── */}
                    <div className="px-4 py-3.5 flex flex-col">
                        <h3
                            className="text-sm font-black text-black mb-1 leading-tight uppercase"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            {step.title}
                        </h3>
                        <p className="text-xs text-black/85 font-medium leading-relaxed mb-3">
                            {step.description}
                        </p>

                        {/* Checklist Indicators */}
                        <div className="bg-neutral-50 border-[2.5px] border-black p-2.5 mb-3 flex flex-col gap-1.5 shadow-[2px_2px_0_#000]">
                            <div className="flex items-center gap-2">
                                <span className="text-[#00FF00] font-black text-sm select-none">✓</span>
                                <span className="text-xs font-black text-black uppercase tracking-wide">Geser foto</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#00FF00] font-black text-sm select-none">✓</span>
                                <span className="text-xs font-black text-black uppercase tracking-wide">Zoom</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#00FF00] font-black text-sm select-none">✓</span>
                                <span className="text-xs font-black text-black uppercase tracking-wide">Rotate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#00FF00] font-black text-sm select-none">✓</span>
                                <span className="text-xs font-black text-black uppercase tracking-wide">Simpan Cover</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-1 mb-3">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[3px] flex-1 transition-all duration-300"
                                    style={{
                                        backgroundColor: i <= currentIndex ? step.accentColor : "#E5E5E5",
                                        border: i <= currentIndex ? "1px solid #000" : "1px solid #CCC",
                                    }}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {!isFirst && (
                                <button
                                    onClick={onBack}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-black text-black uppercase bg-white border-[2.5px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                                    style={{ minHeight: 36 }}
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                    {step.backLabel || "Kembali"}
                                </button>
                            )}
                            <button
                                onClick={onSkip}
                                className="flex-1 py-2 text-[10px] font-black text-black/50 uppercase bg-white border-[2.5px] border-black/20 hover:border-black hover:text-black transition-all"
                                style={{ minHeight: 36 }}
                            >
                                Lewati
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            ref={tooltipRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="z-[9999] outline-none"
            style={{
                width: "calc(100vw - 24px)",
                maxWidth: "420px",
                maxHeight: "80vh",
                pointerEvents: "auto",
                ...positionStyle,
            }}
        >
            <div
                className="bg-white border-[4px] border-black shadow-[6px_6px_0_#000] overflow-hidden flex flex-col"
                style={{
                    maxHeight: "80vh",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}
            >
                {/* ── Header ─────────────────────────────────────── */}
                <div
                    className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black shrink-0"
                    style={{ backgroundColor: step.accentColor }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 shrink-0 bg-white border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-[11px] font-black text-black uppercase tracking-widest truncate">
                            Langkah {currentIndex + 1} / {totalSteps}
                        </span>
                    </div>
                    <button
                        onClick={onSkip}
                        className="p-1.5 shrink-0 bg-white border-[2px] border-black hover:bg-black hover:text-white transition-all"
                        title="Lewati Tutorial"
                        style={{ minWidth: 28, minHeight: 28 }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Body (scrollable) ──────────────────────────── */}
                <div className="px-4 py-4 overflow-y-auto flex-1">
                    <h3
                        className="text-base sm:text-lg font-black text-black mb-2 leading-tight"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                        {step.title}
                    </h3>
                    <p className="text-sm text-black/70 font-medium leading-relaxed mb-4">
                        {step.description}
                    </p>

                    {/* ── Action step hint ────────────────────────── */}
                    {isAction && (
                        <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-[#FFFF00]/20 border-[2px] border-[#FFFF00] border-dashed">
                            <MousePointerClick className="w-4 h-4 text-black shrink-0" />
                            <span className="text-xs font-bold text-black uppercase tracking-wide">
                                {step.actionHint || "Klik area yang disorot untuk melanjutkan"}
                            </span>
                        </div>
                    )}

                    {/* ── Progress bar ────────────────────────────── */}
                    <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className="h-[4px] flex-1 transition-all duration-300"
                                style={{
                                    backgroundColor: i <= currentIndex ? step.accentColor : "#E5E5E5",
                                    border: i <= currentIndex ? "1.5px solid #000" : "1.5px solid #CCC",
                                }}
                            />
                        ))}
                    </div>

                    {/* ── Actions ─────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        {/* Back / Skip row */}
                        {!isFirst ? (
                            <button
                                onClick={onBack}
                                className="flex items-center justify-center gap-1.5 px-4 text-xs font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                                style={{ minHeight: 44 }}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                {step.backLabel || "Kembali"}
                            </button>
                        ) : step.showSkip ? (
                            <button
                                onClick={onSkip}
                                className="flex items-center justify-center gap-1.5 px-4 text-xs font-black text-black/50 uppercase bg-white border-[3px] border-black/20 hover:border-black hover:text-black transition-all"
                                style={{ minHeight: 44 }}
                            >
                                Lewati
                            </button>
                        ) : null}

                        {/* Next / Finish button — hidden on action steps */}
                        {!isAction && (
                            <button
                                onClick={isLast ? onFinish : onNext}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 text-xs font-black text-black uppercase border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                                style={{ backgroundColor: step.accentColor, minHeight: 44 }}
                            >
                                {isLast ? (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Selesai!
                                    </>
                                ) : (
                                    <>
                                        {step.nextLabel || "Lanjut"}
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
