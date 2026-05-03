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
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
                    onClick={() => setPendingSticker(null)}
                >
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                        className="w-full max-w-sm overflow-hidden bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b-[3px] border-black bg-[#E5E5E5]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-[#FFFF00] border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                                    <Sticker className="w-4 h-4 text-black" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-black leading-none uppercase">{pendingSticker.item.name}</p>
                                    <p className="text-[11px] text-neutral-500 font-bold mt-0.5">
                                        {isStamp ? "Atur tanggal stiker" : "Atur teks stiker (maks 20 karakter)"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPendingSticker(null)}
                                className="w-8 h-8 flex items-center justify-center bg-white border-[2px] border-black hover:bg-[#FF00FF] hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Live preview */}
                            <div className="flex items-center justify-center py-6 bg-[#E5E5E5] border-[3px] border-black">
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
                                            className="w-full px-4 py-3 text-sm text-black font-bold bg-[#E5E5E5] border-[3px] border-black focus:bg-[#FFFF00] outline-none transition-all"
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
                                                className={`w-full px-4 py-3 text-sm text-black font-bold placeholder:text-neutral-400 bg-[#E5E5E5] border-[3px] outline-none transition-all ${
                                                    customText.length === 20
                                                        ? "border-[#FF3300]"
                                                        : "border-black focus:bg-[#FFFF00]"
                                                }`}
                                            />
                                            <span
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black tabular-nums"
                                                style={{ color: customText.length >= 18 ? "#FF3300" : "#525252" }}
                                            >
                                                {customText.length}/20
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-[11px] text-neutral-500 font-bold">
                                    {isStamp ? "Pilih tanggal untuk ditampilkan." : "Kosongkan untuk menggunakan teks bawaan stiker."}
                                </p>
                            </div>

                            {/* Confirm button */}
                            <button
                                onClick={handleConfirmCustom}
                                disabled={adding === pendingSticker.item.id}
                                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-black uppercase bg-[#00FF00] text-black border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-60"
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
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                    className="w-full max-w-sm overflow-hidden bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b-[3px] border-black bg-[#E5E5E5]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                                <Sticker className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-black leading-none uppercase">Koleksi Stiker</p>
                                <p className="text-[11px] text-neutral-500 font-bold mt-0.5">
                                    {remaining > 0
                                        ? `${remaining} slot tersisa untuk kenangan ini`
                                        : "Batas maksimal tercapai"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center bg-white border-[2px] border-black hover:bg-[#FF00FF] hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Limit warning */}
                    {remaining <= 0 && (
                        <div className="flex items-center gap-2.5 mx-5 mt-4 px-3.5 py-2.5 bg-[#FF3300] border-[3px] border-black">
                            <AlertCircle className="w-4 h-4 text-white shrink-0" />
                            <p className="text-xs text-white font-black uppercase">
                                Kenangan ini sudah memiliki {maxCount} stiker (batas maksimal).
                            </p>
                        </div>
                    )}

                    {/* Sticker grid */}
                    <div className="p-5">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-10 h-10 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                                </div>
                            </div>
                        ) : stickers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center bg-[#E5E5E5] border-[3px] border-black">
                                <Sticker className="w-8 h-8 text-neutral-400 mb-3" />
                                <p className="text-sm text-black font-black uppercase">Belum punya stiker</p>
                                <p className="text-xs text-neutral-500 font-bold mt-1">Beli stiker di Memory Shop</p>
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
                                            className={`relative flex flex-col items-center gap-2.5 p-3 border-[3px] border-black transition-all group ${
                                                disabled
                                                    ? "bg-[#E5E5E5] opacity-40 cursor-not-allowed"
                                                    : "bg-white shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] cursor-pointer"
                                            }`}
                                        >
                                            {/* Editable badge */}
                                            {isEditable && !disabled && (
                                                <span className="absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide bg-[#FFFF00] border-[2px] border-black text-black">
                                                    Kustom
                                                </span>
                                            )}

                                            {/* Preview */}
                                            <div className="relative flex items-center justify-center h-[60px]">
                                                {isAdding ? (
                                                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                                                ) : config ? (
                                                    <div style={{
                                                        transform: `rotate(${config.defaultRotation}deg)`,
                                                        transformOrigin: "center",
                                                    }}>
                                                        <StickerRenderer config={config} memoryDate={memoryDate} />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 border-[2px] border-black"
                                                        style={{ background: s.item.previewColor ?? "#6366f1" }} />
                                                )}
                                            </div>

                                            <p className="text-[11px] font-black text-black uppercase leading-tight text-center">
                                                {s.item.name}
                                            </p>

                                            {/* Hover overlay */}
                                            {!disabled && (
                                                <div className="absolute inset-0 border-[3px] border-[#00FF00] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-[#00FF00]/10">
                                                    <span className="text-[10px] font-black text-black uppercase tracking-wider bg-[#00FF00] px-2 py-0.5 border-[2px] border-black">
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
