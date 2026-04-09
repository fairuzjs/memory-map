"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, ZoomIn, ZoomOut, Save } from "lucide-react"
import { StickerRenderer, StickerConfig } from "./StickerRenderer"

export type StickerPlacement = {
    id: string
    posX: number
    posY: number
    rotation: number
    scale: number
    zIndex?: number
    customText?: string | null
    item: {
        id: string
        name: string
        value: string
        previewColor: string | null
    }
}

interface StickerLayerProps {
    memoryId: string
    memoryDate?: string
    placements: StickerPlacement[]
    isOwner: boolean
    onPlacementUpdate: (id: string, posX: number, posY: number, rotation: number, scale: number) => void
    onPlacementDelete: (id: string) => void
}

export function StickerLayer({
    memoryId,
    memoryDate,
    placements,
    isOwner,
    onPlacementUpdate,
    onPlacementDelete,
}: StickerLayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [transforms, setTransforms] = useState<Record<string, { x: number; y: number; r: number; s: number }>>({})

    useEffect(() => {
        const init: Record<string, { x: number; y: number; r: number; s: number }> = {}
        for (const p of placements) {
            init[p.id] = { x: p.posX, y: p.posY, r: p.rotation, s: p.scale }
        }
        setTransforms(init)
    }, [placements])

    const getTransform = (p: StickerPlacement) =>
        transforms[p.id] ?? { x: p.posX, y: p.posY, r: p.rotation, s: p.scale }

    // ── Pointer drag ──────────────────────────────────────────
    const dragState = useRef<{
        id: string
        startX: number; startY: number
        origX: number; origY: number
    } | null>(null)

    const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
        if (!isOwner) return
        e.preventDefault()
        e.stopPropagation()
        setSelected(id)
        const p = placements.find(p => p.id === id)
        const t = transforms[id] ?? { x: p?.posX ?? 50, y: p?.posY ?? 50, r: p?.rotation ?? 0, s: p?.scale ?? 1 }
        dragState.current = { id, startX: e.clientX, startY: e.clientY, origX: t.x, origY: t.y }
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }, [isOwner, placements, transforms])

    const onPointerMove = useCallback((e: React.PointerEvent, id: string) => {
        if (!dragState.current || dragState.current.id !== id) return
        const container = containerRef.current
        if (!container) return
        const { width, height } = container.getBoundingClientRect()
        const dx = ((e.clientX - dragState.current.startX) / width) * 100
        const dy = ((e.clientY - dragState.current.startY) / height) * 100
        const newX = Math.max(0, Math.min(100, dragState.current.origX + dx))
        const newY = Math.max(0, Math.min(100, dragState.current.origY + dy))
        setTransforms(prev => ({ ...prev, [id]: { ...prev[id], x: newX, y: newY } }))
    }, [])

    const onPointerUp = useCallback((e: React.PointerEvent, id: string) => {
        if (!dragState.current || dragState.current.id !== id) return
        const t = transforms[id]
        if (t) onPlacementUpdate(id, t.x, t.y, t.r, t.s)
        dragState.current = null
    }, [transforms, onPlacementUpdate])

    // ── Pinch / rotate (two fingers) ─────────────────────────
    const touchState = useRef<{
        id: string
        touches: Map<number, { x: number; y: number }>
        initDist: number; initAngle: number
        initScale: number; initRotation: number
    } | null>(null)

    const getTouchDist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.hypot(b.x - a.x, b.y - a.y)
    const getTouchAngle = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)

    const onTouchStart = useCallback((e: React.TouchEvent, id: string) => {
        if (!isOwner || e.touches.length < 2) return
        e.preventDefault()
        const t = transforms[id]
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const a = { x: t1.clientX, y: t1.clientY }
        const b = { x: t2.clientX, y: t2.clientY }
        touchState.current = {
            id, touches: new Map(),
            initDist: getTouchDist(a, b),
            initAngle: getTouchAngle(a, b),
            initScale: t?.s ?? 1,
            initRotation: t?.r ?? 0,
        }
    }, [isOwner, transforms])

    const onTouchMove = useCallback((e: React.TouchEvent, id: string) => {
        if (!touchState.current || touchState.current.id !== id || e.touches.length < 2) return
        e.preventDefault()
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const a = { x: t1.clientX, y: t1.clientY }
        const b = { x: t2.clientX, y: t2.clientY }
        const dist = getTouchDist(a, b)
        const angle = getTouchAngle(a, b)
        const scaleRatio = dist / touchState.current.initDist
        const angleDelta = angle - touchState.current.initAngle
        const newScale = Math.max(0.5, Math.min(2.5, touchState.current.initScale * scaleRatio))
        const newRot = touchState.current.initRotation + angleDelta
        setTransforms(prev => ({ ...prev, [id]: { ...prev[id], s: newScale, r: newRot } }))
    }, [])

    const onTouchEnd = useCallback((e: React.TouchEvent, id: string) => {
        if (!touchState.current || touchState.current.id !== id) return
        const t = transforms[id]
        if (t) onPlacementUpdate(id, t.x, t.y, t.r, t.s)
        touchState.current = null
    }, [transforms, onPlacementUpdate])

    // ── Button Controls (D-Pad / Analog) ──────────────────────
    const adjustTransform = useCallback((id: string, dx: number, dy: number, dr: number, ds: number) => {
        setTransforms(prev => {
            const t = prev[id]
            if (!t) return prev
            return {
                ...prev,
                [id]: {
                    ...t,
                    x: Math.max(0, Math.min(100, t.x + dx)),
                    y: Math.max(0, Math.min(100, t.y + dy)),
                    r: t.r + dr,
                    s: Math.max(0.5, Math.min(2.5, t.s + ds))
                }
            }
        })
    }, [])

    const handleSaveAdjustment = useCallback((id: string) => {
        const t = transforms[id]
        if (t) onPlacementUpdate(id, t.x, t.y, t.r, t.s)
        setSelected(null)
    }, [transforms, onPlacementUpdate])

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
            onClick={() => setSelected(null)}
        >
            {placements.map((placement) => {
                const t = getTransform(placement)
                let config: StickerConfig | null = null
                try { config = JSON.parse(placement.item.value) } catch { return null }
                if (!config) return null

                const isSelected = selected === placement.id

                return (
                    <div
                        key={placement.id}
                        className="absolute pointer-events-auto select-none cursor-grab active:cursor-grabbing"
                        style={{
                            touchAction: "none",
                            left: `${t.x}%`,
                            top: `${t.y}%`,
                            transform: `translate(-50%, -50%) rotate(${t.r}deg) scale(${t.s})`,
                            transformOrigin: "center",
                            zIndex: isSelected ? 50 : (placement.zIndex ?? 10),
                            filter: isSelected
                                ? "drop-shadow(0 0 8px rgba(99,102,241,0.7))"
                                : "drop-shadow(1px 2px 4px rgba(0,0,0,0.3))",
                        }}
                        onPointerDown={e => onPointerDown(e, placement.id)}
                        onPointerMove={e => onPointerMove(e, placement.id)}
                        onPointerUp={e => onPointerUp(e, placement.id)}
                        onTouchStart={e => onTouchStart(e, placement.id)}
                        onTouchMove={e => onTouchMove(e, placement.id)}
                        onTouchEnd={e => onTouchEnd(e, placement.id)}
                        onClick={e => { e.stopPropagation(); setSelected(placement.id) }}
                    >
                        <StickerRenderer
                            config={config}
                            memoryDate={memoryDate}
                            customText={placement.customText}
                        />

                        {/* Delete handle */}
                        {isSelected && isOwner && (
                            <button
                                className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg z-50 hover:bg-red-600 transition-colors"
                                onClick={e => {
                                    e.stopPropagation()
                                    onPlacementDelete(placement.id)
                                    setSelected(null)
                                }}
                                title="Hapus stiker"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        )}
                    </div>
                )
            })}

            {/* Controller Dock / Alat Bantu Analog Khusus Mobile */}
            {selected && isOwner && (
                <div
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] bg-neutral-950/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-6"
                    onClick={e => e.stopPropagation()}
                >
                    {/* D-Pad */}
                    <div className="grid grid-cols-3 gap-1.5">
                        <div />
                        <button
                            onClick={() => adjustTransform(selected, 0, -1, 0, 0)}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                        <div />
                        <button
                            onClick={() => adjustTransform(selected, -1, 0, 0, 0)}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/30 font-bold shrink-0">
                            Move
                        </div>
                        <button
                            onClick={() => adjustTransform(selected, 1, 0, 0, 0)}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div />
                        <button
                            onClick={() => adjustTransform(selected, 0, 1, 0, 0)}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowDown className="w-5 h-5" />
                        </button>
                        <div />
                    </div>

                    <div className="w-px h-24 bg-white/10" />

                    {/* Scale & Rotate & Save */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => adjustTransform(selected, 0, 0, -5, 0)}
                                className="w-12 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-indigo-400 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => adjustTransform(selected, 0, 0, 5, 0)}
                                className="w-12 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-indigo-400 transition-colors"
                            >
                                <RotateCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => adjustTransform(selected, 0, 0, 0, -0.05)}
                                className="w-12 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-emerald-400 transition-colors"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => adjustTransform(selected, 0, 0, 0, 0.05)}
                                className="w-12 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-emerald-400 transition-colors"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => handleSaveAdjustment(selected)}
                            className="w-full h-10 mt-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center gap-2 text-white text-xs font-bold transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Simpan
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
