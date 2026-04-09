"use client"

import { useEffect, useState } from "react"
import { X, Loader2, Sticker, AlertCircle, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { StickerRenderer, StickerConfig } from "./StickerRenderer"

type OwnedSticker = {
    id: string
    itemId: string
    item: {
        id: string
        name: string
        value: string
        previewColor: string | null
        description: string
    }
}

interface StickerPanelProps {
    memoryId: string
    memoryDate?: string
    currentCount: number
    maxCount?: number
    onStickerAdded: (placement: any) => void
    onClose: () => void
}

const MAX = 3

export function StickerPanel({
    memoryId,
    memoryDate,
    currentCount,
    maxCount = MAX,
    onStickerAdded,
    onClose,
}: StickerPanelProps) {
    const [stickers, setStickers] = useState<OwnedSticker[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState<string | null>(null)

    // Editable sticker flow
    const [pendingSticker, setPendingSticker] = useState<OwnedSticker | null>(null)
    const [customText, setCustomText] = useState("")

    useEffect(() => {
        fetch("/api/inventory?type=MEMORY_STICKER")
            .then(r => r.json())
            .then(data => {
                setStickers(data.items ?? [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleAdd = async (itemId: string, text?: string) => {
        if (currentCount >= maxCount) return
        setAdding(itemId)
        try {
            const body: any = { itemId }
            if (text !== undefined && text.trim() !== "") body.customText = text.slice(0, 20)

            const res = await fetch(`/api/memories/${memoryId}/stickers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) {
                alert(data.error ?? "Gagal menambahkan stiker")
                return
            }
            onStickerAdded(data)
            onClose()
        } catch {
            alert("Terjadi kesalahan")
        } finally {
            setAdding(null)
        }
    }

    const handleStickerClick = (s: OwnedSticker, cfg: StickerConfig | null) => {
        if (currentCount >= maxCount) return
        // If editable, show text input step first
        if (cfg?.editable) {
            setPendingSticker(s)
            setCustomText("")
            return
        }
        handleAdd(s.item.id)
    }

    const handleConfirmCustom = () => {
        if (!pendingSticker) return
        handleAdd(pendingSticker.item.id, customText)
    }

    const remaining = maxCount - currentCount

    // ── Text input step for editable stickers ──
    if (pendingSticker) {
        let cfg: StickerConfig | null = null
        try { cfg = JSON.parse(pendingSticker.item.value) } catch { }
        const isStamp = cfg?.shape === "stamp"

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setPendingSticker(null)}
                >
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                        className="w-full max-w-sm rounded-3xl overflow-hidden"
                        style={{
                            background: "linear-gradient(160deg, #0e0e18, #0a0a12)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
                                >
                                    <Sticker className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-none">{pendingSticker.item.name}</p>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                        {isStamp ? "Atur tanggal stiker" : "Atur teks stiker (maks 20 karakter)"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingSticker(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/8 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Live preview */}
                            <div
                                className="flex items-center justify-center py-6 rounded-2xl"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                {cfg && (
                                    <div style={{ transform: `rotate(${cfg.defaultRotation ?? 0}deg)` }}>
                                        <StickerRenderer
                                            config={cfg}
                                            memoryDate={memoryDate}
                                            customText={customText || undefined}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Text input */}
                            <div className="space-y-2">
                                <div className="relative">
                                    {isStamp ? (
                                        <input
                                            type="date"
                                            value={customText}
                                            onChange={e => setCustomText(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl text-sm text-white focus:outline-none transition-all"
                                            style={{
                                                background: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                colorScheme: "dark"
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={customText}
                                                maxLength={20}
                                                onChange={e => setCustomText(e.target.value.slice(0, 20))}
                                                placeholder={cfg?.defaultText ?? "Ketik teks..."}
                                                autoFocus
                                                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-all"
                                                style={{
                                                    background: "rgba(255,255,255,0.05)",
                                                    border: customText.length === 20
                                                        ? "1px solid rgba(239,68,68,0.4)"
                                                        : "1px solid rgba(255,255,255,0.1)",
                                                }}
                                            />
                                            <span
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono tabular-nums"
                                                style={{ color: customText.length >= 18 ? "#f87171" : "#525252" }}
                                            >
                                                {customText.length}/20
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-[11px] text-neutral-600">
                                    {isStamp ? "Pilih tanggal untuk ditampilkan." : "Kosongkan untuk menggunakan teks bawaan stiker."}
                                </p>
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={handleConfirmCustom}
                                disabled={adding === pendingSticker.item.id}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                                    border: "1px solid rgba(99,102,241,0.35)",
                                    color: "#c7d2fe",
                                }}
                            >
                                {adding === pendingSticker.item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Tempel Stiker
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        )
    }

    // ── Sticker grid ──
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                    className="w-full max-w-sm rounded-3xl overflow-hidden"
                    style={{
                        background: "linear-gradient(160deg, #0e0e18, #0a0a12)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                            >
                                <Sticker className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none">Koleksi Stiker</p>
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                    {remaining > 0
                                        ? `${remaining} slot tersisa untuk kenangan ini`
                                        : "Batas maksimal tercapai"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/8 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Limit warning */}
                    {remaining <= 0 && (
                        <div
                            className="flex items-center gap-2.5 mx-5 mt-4 px-3.5 py-2.5 rounded-xl"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-xs text-red-400">
                                Kenangan ini sudah memiliki {maxCount} stiker (batas maksimal).
                            </p>
                        </div>
                    )}

                    {/* Sticker grid */}
                    <div className="p-5">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                            </div>
                        ) : stickers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Sticker className="w-8 h-8 text-neutral-700 mb-3" />
                                <p className="text-sm text-neutral-500 font-medium">Belum punya stiker</p>
                                <p className="text-xs text-neutral-700 mt-1">Beli stiker di Memory Shop</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {stickers.map(s => {
                                    let config: StickerConfig | null = null
                                    try { config = JSON.parse(s.item.value) } catch { }
                                    const isAdding = adding === s.item.id
                                    const disabled = remaining <= 0 || isAdding
                                    const isEditable = config?.editable === true

                                    return (
                                        <button
                                            key={s.id}
                                            disabled={disabled}
                                            onClick={() => handleStickerClick(s, config)}
                                            className="relative flex flex-col items-center gap-2.5 p-3 rounded-2xl transition-all group"
                                            style={{
                                                background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                                                border: disabled
                                                    ? "1px solid rgba(255,255,255,0.05)"
                                                    : "1px solid rgba(255,255,255,0.08)",
                                                opacity: disabled && !isAdding ? 0.4 : 1,
                                                cursor: disabled ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {/* Editable badge */}
                                            {isEditable && !disabled && (
                                                <span
                                                    className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                                    style={{
                                                        background: "rgba(251,191,36,0.12)",
                                                        border: "1px solid rgba(251,191,36,0.25)",
                                                        color: "#fbbf24",
                                                    }}
                                                >
                                                    Kustom
                                                </span>
                                            )}

                                            {/* Preview */}
                                            <div className="relative flex items-center justify-center h-[60px]">
                                                {isAdding ? (
                                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                                ) : config ? (
                                                    <div style={{
                                                        transform: `rotate(${config.defaultRotation}deg)`,
                                                        transformOrigin: "center",
                                                    }}>
                                                        <StickerRenderer config={config} memoryDate={memoryDate} />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl"
                                                        style={{ background: s.item.previewColor ?? "#6366f1" }} />
                                                )}
                                            </div>

                                            <p className="text-[11px] font-bold text-neutral-300 leading-tight text-center">
                                                {s.item.name}
                                            </p>

                                            {/* Hover overlay */}
                                            {!disabled && (
                                                <div
                                                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    style={{
                                                        background: "rgba(99,102,241,0.12)",
                                                        border: "1px solid rgba(99,102,241,0.3)",
                                                    }}
                                                >
                                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">
                                                        {isEditable ? "Atur Teks" : "Tempel"}
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
