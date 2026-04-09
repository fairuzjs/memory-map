"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Package, CheckCircle2, Sparkles,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    ShoppingBag, ChevronRight, Eye, X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ItemType = "AVATAR_FRAME" | "PROFILE_BANNER" | "MEMORY_CARD_THEME" | "USERNAME_DECORATION" | "MEMORY_STICKER"

type InventoryItem = {
    id: string          // inventory record id
    isEquipped: boolean
    item: {
        id: string
        name: string
        description: string
        type: ItemType
        value: string
        previewColor: string | null
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemType, string> = {
    AVATAR_FRAME:       "Bingkai Avatar",
    PROFILE_BANNER:     "Banner Profil",
    MEMORY_CARD_THEME:  "Tema Kartu Kenangan",
    USERNAME_DECORATION:"Dekorasi Nama",
    MEMORY_STICKER:     "Stiker Kenangan",
}

const TYPE_ICONS: Record<ItemType, React.FC<any>> = {
    AVATAR_FRAME:       User,
    PROFILE_BANNER:     ImageIcon,
    MEMORY_CARD_THEME:  Grid2x2,
    USERNAME_DECORATION:Type,
    MEMORY_STICKER:     Sticker,
}

const TYPE_COLORS: Record<ItemType, { bg: string; border: string; text: string; accent: string }> = {
    AVATAR_FRAME:       { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.2)",  text: "#818cf8", accent: "#6366f1" },
    PROFILE_BANNER:     { bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)", text: "#f472b6", accent: "#ec4899" },
    MEMORY_CARD_THEME:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  text: "#34d399", accent: "#10b981" },
    USERNAME_DECORATION:{ bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  text: "#fbbf24", accent: "#f59e0b" },
    MEMORY_STICKER:     { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  text: "#a78bfa", accent: "#8b5cf6" },
}

const ALL_TYPES: ItemType[] = [
    "AVATAR_FRAME",
    "PROFILE_BANNER",
    "MEMORY_CARD_THEME",
    "USERNAME_DECORATION",
    "MEMORY_STICKER",
]

const NON_EQUIPPABLE: ItemType[] = ["MEMORY_STICKER"]

function getDecorationClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("kristal")) return "anim-kristal"
    if (n.includes("api")) return "anim-api"
    if (n.includes("neon")) return "anim-neon"
    if (n.includes("emas")) return "anim-emas"
    if (n.includes("pelangi")) return "anim-pelangi"
    return ""
}

// ─── Card Theme Preview ─────────────────────────────────────────────────────────

function CardThemePreview({ value }: { value: string }) {
    let theme: any = null
    try { theme = JSON.parse(value) } catch { }
    return (
        <div
            className="relative w-full h-28 rounded-xl overflow-hidden flex flex-col justify-end"
            style={{
                background: theme?.background ?? "#11111a",
                border: theme?.border ?? "1px solid rgba(255,255,255,0.08)",
                boxShadow: theme?.shadow ?? "none",
            }}
        >
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: theme?.patternImage, backgroundSize: "cover" }} />
            <div className="p-3 relative z-10">
                <div className="w-12 h-2 rounded-full mb-1.5 opacity-60"
                    style={{ background: theme?.titleColor ?? "#fff" }} />
                <div className="w-20 h-1.5 rounded-full opacity-40"
                    style={{ background: theme?.storyColor ?? "#ccc" }} />
            </div>
        </div>
    )
}

// ─── Banner Preview ─────────────────────────────────────────────────────────────

function BannerPreview({ value }: { value: string }) {
    return (
        <div
            className="w-full h-16 rounded-xl overflow-hidden relative"
            style={{ background: value }}
        >
            <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        </div>
    )
}

// ─── Frame Preview ──────────────────────────────────────────────────────────────

function FramePreview({ value }: { value: string }) {
    return (
        <div className="flex items-center justify-center py-3">
            <div className="relative w-16 h-16">
                <div className="absolute -inset-1 rounded-full p-[2px]" style={{ background: value }}>
                    <div className="w-full h-full rounded-full" style={{ background: "rgba(14,14,24,1)" }} />
                </div>
                <div className="relative w-16 h-16 rounded-full z-10 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <User className="w-7 h-7 text-neutral-600" />
                </div>
            </div>
        </div>
    )
}

// ─── Badge Preview ──────────────────────────────────────────────────────────────

function DecorationPreview({ item }: { item: InventoryItem["item"] }) {
    let style: React.CSSProperties = {}
    try { style = JSON.parse(item.value) } catch { }
    return (
        <div className="flex items-center justify-center py-3">
            <span
                className={`text-xl font-black ${getDecorationClass(item.name)}`}
                style={style}
            >
                {item.name}
            </span>
        </div>
    )
}

// ─── Sticker Preview ────────────────────────────────────────────────────────────

function StickerPreview({ item }: { item: InventoryItem["item"] }) {
    let cfg: StickerConfig | null = null
    try { cfg = JSON.parse(item.value) } catch { }
    if (!cfg) return <div className="w-10 h-10 rounded-xl" style={{ background: item.previewColor ?? "#6366f1" }} />
    return (
        <div className="flex items-center justify-center py-3" style={{ transform: `rotate(${cfg.defaultRotation}deg)` }}>
            <StickerRenderer config={cfg} />
        </div>
    )
}

// ─── Inventory Card ─────────────────────────────────────────────────────────────

function InventoryCard({
    entry,
    onEquip,
    onPreview,
    equipping,
}: {
    entry: InventoryItem
    onEquip: (inventoryId: string, itemId: string) => void
    onPreview: (entry: InventoryItem) => void
    equipping: string | null
}) {
    const { item, isEquipped, id: inventoryId } = entry
    const color = TYPE_COLORS[item.type]
    const isNonEquip = NON_EQUIPPABLE.includes(item.type)
    const isEquipping = equipping === item.id

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col rounded-2xl overflow-hidden group"
            style={{
                background: isEquipped
                    ? `linear-gradient(160deg, ${color.bg}, rgba(10,10,16,0.9))`
                    : "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                border: isEquipped
                    ? `1px solid ${color.border}`
                    : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isEquipped ? `0 0 20px -5px ${color.accent}30` : "none",
                transition: "all 0.2s ease",
            }}
        >
            {/* Equipped badge */}
            {isEquipped && (
                <div
                    className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide"
                    style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}
                >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Dipakai
                </div>
            )}

            {/* Preview area */}
            <div
                className="px-4 pt-4 pb-2 cursor-pointer"
                onClick={() => onPreview(entry)}
            >
                {item.type === "AVATAR_FRAME"        && <FramePreview value={item.value} />}
                {item.type === "PROFILE_BANNER"      && <BannerPreview value={item.value} />}
                {item.type === "MEMORY_CARD_THEME"   && <CardThemePreview value={item.value} />}
                {item.type === "USERNAME_DECORATION" && <DecorationPreview item={item} />}
                {item.type === "MEMORY_STICKER"      && <StickerPreview item={item} />}
            </div>

            {/* Info */}
            <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
                <div>
                    <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={() => onPreview(entry)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        title="Lihat preview"
                    >
                        <Eye className="w-4 h-4 text-neutral-400" />
                    </button>

                    {isNonEquip ? (
                        <div
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                            style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", color: "#4ade80" }}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Dimiliki
                        </div>
                    ) : (
                        <button
                            onClick={() => onEquip(inventoryId, item.id)}
                            disabled={isEquipping}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 relative overflow-hidden group/btn"
                            style={{
                                background: isEquipped
                                    ? "rgba(74,222,128,0.08)"
                                    : "rgba(255,255,255,0.04)",
                                border: isEquipped
                                    ? "1px solid rgba(74,222,128,0.3)"
                                    : "1px solid rgba(255,255,255,0.08)",
                                color: isEquipped ? "#4ade80" : "#9ca3af",
                            }}
                        >
                            {!isEquipped && (
                                <div
                                    className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-xl"
                                    style={{ background: "rgba(99,102,241,0.1)" }}
                                />
                            )}
                            <span className="relative flex items-center gap-1.5">
                                {isEquipping
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : isEquipped
                                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Sedang Dipakai</>
                                        : <><Sparkles className="w-3.5 h-3.5" /> Pakai</>
                                }
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Preview Modal ──────────────────────────────────────────────────────────────

function PreviewModal({
    entry,
    onClose,
    onEquip,
    equipping,
}: {
    entry: InventoryItem
    onClose: () => void
    onEquip: (inventoryId: string, itemId: string) => void
    equipping: string | null
}) {
    const { item, isEquipped, id: inventoryId } = entry
    const color = TYPE_COLORS[item.type]
    const isNonEquip = NON_EQUIPPABLE.includes(item.type)
    const isEquipping = equipping === item.id
    const TypeIcon = TYPE_ICONS[item.type]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
                className="w-full max-w-sm rounded-3xl overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, #0e0e18, #0a0a12)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top accent */}
                <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${color.accent}, transparent)` }} />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                            <TypeIcon className="w-4 h-4" style={{ color: color.text }} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: color.text }}>
                                {TYPE_LABELS[item.type]}
                            </p>
                            <p className="text-base font-black text-white leading-tight">{item.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/8 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Preview */}
                <div className="px-6 pb-4">
                    <div className="rounded-2xl flex items-center justify-center py-8 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {item.type === "AVATAR_FRAME"        && <div className="scale-150"><FramePreview value={item.value} /></div>}
                        {item.type === "PROFILE_BANNER"      && <div className="w-full px-4"><BannerPreview value={item.value} /></div>}
                        {item.type === "MEMORY_CARD_THEME"   && <div className="w-full px-4"><CardThemePreview value={item.value} /></div>}
                        {item.type === "USERNAME_DECORATION" && <DecorationPreview item={item} />}
                        {item.type === "MEMORY_STICKER"      && <StickerPreview item={item} />}
                    </div>
                </div>

                {/* Description */}
                <div className="px-6 pb-4">
                    <p className="text-sm text-neutral-500 leading-relaxed">{item.description}</p>
                </div>

                {/* Action */}
                <div className="px-6 pb-6">
                    {isNonEquip ? (
                        <div
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                            style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Stiker bisa ditempel langsung di kenangan
                        </div>
                    ) : (
                        <button
                            onClick={() => onEquip(inventoryId, item.id)}
                            disabled={isEquipping}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                            style={{
                                background: isEquipped
                                    ? "rgba(74,222,128,0.08)"
                                    : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                                border: isEquipped
                                    ? "1px solid rgba(74,222,128,0.3)"
                                    : "1px solid rgba(99,102,241,0.35)",
                                color: isEquipped ? "#4ade80" : "#c7d2fe",
                            }}
                        >
                            {isEquipping
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : isEquipped
                                    ? <><CheckCircle2 className="w-4 h-4" /> Sedang Dipakai</>
                                    : <><Sparkles className="w-4 h-4" /> Pakai Sekarang</>
                            }
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState<"ALL" | ItemType>("ALL")
    const [equipping, setEquipping] = useState<string | null>(null)
    const [previewEntry, setPreviewEntry] = useState<InventoryItem | null>(null)

    const loadInventory = useCallback(async () => {
        try {
            const res = await fetch("/api/inventory/all")
            if (!res.ok) return
            const data = await res.json()
            setInventory(data.items ?? [])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (status === "unauthenticated") { router.push("/login"); return }
        if (status === "authenticated") loadInventory()
    }, [status, loadInventory, router])

    const handleEquip = async (inventoryId: string, itemId: string) => {
        setEquipping(itemId)
        try {
            const res = await fetch("/api/inventory/equip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error || "Gagal memakai item"); return }

            const willEquip = data.equipped
            const equippedItem = inventory.find(e => e.item.id === itemId)?.item

            setInventory(prev => prev.map(e => {
                if (e.item.type !== equippedItem?.type) return e
                if (e.item.id === itemId) return { ...e, isEquipped: willEquip }
                return { ...e, isEquipped: false }
            }))

            // Update preview modal if open
            if (previewEntry?.item.id === itemId) {
                setPreviewEntry(prev => prev ? { ...prev, isEquipped: willEquip } : null)
            }

            toast.success(willEquip ? `✨ "${equippedItem?.name}" sedang dipakai!` : `"${equippedItem?.name}" dilepas.`)
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setEquipping(null)
        }
    }

    const filtered = activeType === "ALL"
        ? inventory
        : inventory.filter(e => e.item.type === activeType)

    const countByType = (type: ItemType) => inventory.filter(e => e.item.type === type).length
    const equippedCount = inventory.filter(e => e.isEquipped).length

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                        >
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">Inventori</h1>
                            <p className="text-[13px] text-neutral-500 mt-1">
                                {inventory.length} item dimiliki · {equippedCount} sedang dipakai
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/shop"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                        style={{
                            background: "rgba(251,191,36,0.08)",
                            border: "1px solid rgba(251,191,36,0.2)",
                            color: "#fbbf24",
                        }}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Ke Memory Shop
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                </div>
            </motion.div>

            {/* ── Filter Tabs ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6 overflow-x-auto pb-1"
            >
                <div className="flex items-center gap-2 min-w-max">
                    {/* ALL */}
                    <button
                        onClick={() => setActiveType("ALL")}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                            background: activeType === "ALL" ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                            border: activeType === "ALL" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.07)",
                            color: activeType === "ALL" ? "#c7d2fe" : "#6b7280",
                        }}
                    >
                        <Package className="w-3.5 h-3.5" />
                        Semua
                        <span
                            className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: "rgba(255,255,255,0.08)", color: "#6b7280" }}
                        >
                            {inventory.length}
                        </span>
                    </button>

                    {ALL_TYPES.map(type => {
                        const Icon = TYPE_ICONS[type]
                        const color = TYPE_COLORS[type]
                        const count = countByType(type)
                        if (count === 0) return null
                        const isActive = activeType === type
                        return (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{
                                    background: isActive ? color.bg : "rgba(255,255,255,0.04)",
                                    border: isActive ? `1px solid ${color.border}` : "1px solid rgba(255,255,255,0.07)",
                                    color: isActive ? color.text : "#6b7280",
                                }}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {TYPE_LABELS[type]}
                                <span
                                    className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                                    style={{ background: "rgba(255,255,255,0.08)", color: "#6b7280" }}
                                >
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            {/* ── Content ── */}
            {inventory.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}
                    >
                        <Package className="w-7 h-7 text-indigo-500/50" />
                    </div>
                    <p className="text-base font-bold text-neutral-400 mb-1">Inventori masih kosong</p>
                    <p className="text-sm text-neutral-600 max-w-xs leading-relaxed mb-5">
                        Beli dekorasi dari Memory Shop menggunakan poin streak kamu.
                    </p>
                    <Link
                        href="/shop"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Buka Memory Shop
                    </Link>
                </motion.div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                >
                    <p className="text-sm text-neutral-500 mb-2">Belum ada item {TYPE_LABELS[activeType as ItemType]} di inventori.</p>
                    <button
                        onClick={() => setActiveType("ALL")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                    >
                        Lihat semua →
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.map(entry => (
                            <InventoryCard
                                key={entry.id}
                                entry={entry}
                                onEquip={handleEquip}
                                onPreview={setPreviewEntry}
                                equipping={equipping}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Preview Modal ── */}
            <AnimatePresence>
                {previewEntry && (
                    <PreviewModal
                        entry={previewEntry}
                        onClose={() => setPreviewEntry(null)}
                        onEquip={handleEquip}
                        equipping={equipping}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
