"use client"

import { motion } from "framer-motion"

interface SpotlightOverlayProps {
    targetRect: DOMRect | null
    onClickOverlay?: () => void
    /** If true, the target area is fully click-through (pointer-events pass to underlying element) */
    passThrough?: boolean
}

/**
 * Full-screen overlay with a real cutout using 4 divs.
 *
 * The cutout area has NO element covering it at all — clicks pass through
 * to the real DOM element underneath. This is more reliable than SVG masks,
 * which only affect rendering but still intercept pointer events.
 *
 * Layout:
 *   ┌───────────────────────┐
 *   │       TOP STRIP       │  ← pointer-events: auto (blocks clicks)
 *   ├────┬──────────┬───────┤
 *   │ L  │ (cutout) │   R   │  ← L/R block clicks; cutout has NOTHING
 *   ├────┴──────────┴───────┤
 *   │      BOTTOM STRIP     │  ← pointer-events: auto (blocks clicks)
 *   └───────────────────────┘
 */
export function SpotlightOverlay({ targetRect, onClickOverlay, passThrough }: SpotlightOverlayProps) {
    if (!targetRect) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[9990]"
                style={{ background: "rgba(0, 0, 0, 0.78)", pointerEvents: "auto" }}
                onClick={onClickOverlay}
            />
        )
    }

    const pad = 10
    const r = {
        top: Math.max(0, targetRect.top - pad),
        left: Math.max(0, targetRect.left - pad),
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
    }
    const bottom = r.top + r.height
    const right = r.left + r.width

    const overlayColor = "rgba(0, 0, 0, 0.78)"

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9990]"
            style={{ pointerEvents: "none" }}
        >
            {/* ── 4 overlay strips around the cutout ─────────────────── */}

            {/* Top strip: full width, from top to cutout top */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: r.top,
                    background: overlayColor,
                    pointerEvents: "auto",
                    cursor: "default",
                }}
                onClick={onClickOverlay}
            />

            {/* Bottom strip: full width, from cutout bottom to viewport bottom */}
            <div
                style={{
                    position: "absolute",
                    top: bottom,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: overlayColor,
                    pointerEvents: "auto",
                    cursor: "default",
                }}
                onClick={onClickOverlay}
            />

            {/* Left strip: between top and bottom, from left edge to cutout left */}
            <div
                style={{
                    position: "absolute",
                    top: r.top,
                    left: 0,
                    width: r.left,
                    height: r.height,
                    background: overlayColor,
                    pointerEvents: "auto",
                    cursor: "default",
                }}
                onClick={onClickOverlay}
            />

            {/* Right strip: between top and bottom, from cutout right to right edge */}
            <div
                style={{
                    position: "absolute",
                    top: r.top,
                    left: right,
                    right: 0,
                    height: r.height,
                    background: overlayColor,
                    pointerEvents: "auto",
                    cursor: "default",
                }}
                onClick={onClickOverlay}
            />

            {/* ── Highlight border around target — decorative, no pointer events ── */}
            <motion.div
                key={`highlight-${r.top}-${r.left}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="absolute pointer-events-none"
                style={{
                    top: r.top - 3,
                    left: r.left - 3,
                    width: r.width + 6,
                    height: r.height + 6,
                    border: "3px solid #FFFF00",
                    boxShadow: "0 0 0 3px #000, 0 0 24px rgba(255, 255, 0, 0.35)",
                    animation: "spotlight-pulse 2s ease-in-out infinite",
                }}
            />

            {/* ── Pulsing hint ring for action steps ── */}
            {passThrough && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute pointer-events-none"
                    style={{
                        top: r.top - 8,
                        left: r.left - 8,
                        width: r.width + 16,
                        height: r.height + 16,
                        border: "2px dashed #FFFF00",
                    }}
                />
            )}

            <style>{`
                @keyframes spotlight-pulse {
                    0%, 100% { box-shadow: 0 0 0 3px #000, 0 0 24px rgba(255, 255, 0, 0.35); }
                    50% { box-shadow: 0 0 0 3px #000, 0 0 32px rgba(255, 255, 0, 0.55); }
                }
            `}</style>
        </motion.div>
    )
}
