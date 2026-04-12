"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, ShoppingBag, Sparkles, CheckCircle2, Star,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    Package, ChevronRight, Eye, X, Zap, Coins
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ItemType = "AVATAR_FRAME" | "PROFILE_BANNER" | "MEMORY_CARD_THEME" | "USERNAME_DECORATION" | "MEMORY_STICKER"

type ShopItem = {
    id: string
    name: string
    description: string
    price: number
    type: ItemType
    value: string
    previewColor: string | null
    owned: boolean
    equipped: boolean
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ItemType, string> = {
    AVATAR_FRAME:       "Bingkai Avatar",
    PROFILE_BANNER:     "Banner Profil",
    MEMORY_CARD_THEME:  "Tema Kartu Kenangan",
    USERNAME_DECORATION:"Dekorasi Nama",
    MEMORY_STICKER:     "Stiker Kenangan",
}

const TYPE_SHORT_LABELS: Record<ItemType, string> = {
    AVATAR_FRAME:       "Bingkai Avatar",
    PROFILE_BANNER:     "Banner Profil",
    MEMORY_CARD_THEME:  "Tema Kartu",
    USERNAME_DECORATION:"Dekorasi Nama",
    MEMORY_STICKER:     "Stiker",
}

const TYPE_ICONS: Record<ItemType, React.FC<any>> = {
    AVATAR_FRAME:       User,
    PROFILE_BANNER:     ImageIcon,
    MEMORY_CARD_THEME:  Grid2x2,
    USERNAME_DECORATION:Type,
    MEMORY_STICKER:     Sticker,
}

const TYPE_COLORS: Record<ItemType, { bg: string; border: string; text: string; accent: string; pill: string; pillText: string }> = {
    AVATAR_FRAME:       { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.2)",  text: "#818cf8", accent: "#6366f1", pill: "rgba(99,102,241,0.18)", pillText: "#a5b4fc" },
    PROFILE_BANNER:     { bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)", text: "#f472b6", accent: "#ec4899", pill: "rgba(244,114,182,0.18)", pillText: "#f9a8d4" },
    MEMORY_CARD_THEME:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  text: "#34d399", accent: "#10b981", pill: "rgba(52,211,153,0.18)", pillText: "#6ee7b7" },
    USERNAME_DECORATION:{ bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  text: "#fbbf24", accent: "#f59e0b", pill: "rgba(251,191,36,0.18)", pillText: "#fcd34d" },
    MEMORY_STICKER:     { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  text: "#a78bfa", accent: "#8b5cf6", pill: "rgba(139,92,246,0.18)", pillText: "#c4b5fd" },
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

function formatPoints(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt"
    }
    if (num >= 1000) {
        return (num / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " rb"
    }
    return num.toLocaleString("id-ID")
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

// ─── Decoration Preview ─────────────────────────────────────────────────────────

function DecorationPreview({ item }: { item: ShopItem }) {
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

function StickerPreview({ item }: { item: ShopItem }) {
    let cfg: StickerConfig | null = null
    try { cfg = JSON.parse(item.value) } catch { }
    if (!cfg) return <div className="w-10 h-10 rounded-xl" style={{ background: item.previewColor ?? "#6366f1" }} />
    return (
        <div className="flex items-center justify-center py-3" style={{ transform: `rotate(${cfg.defaultRotation}deg)` }}>
            <StickerRenderer config={cfg} />
        </div>
    )
}

// ─── Section Divider ────────────────────────────────────────────────────────────

function SectionDivider({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div className="flex items-center gap-3 w-full col-span-full mb-1">
            <span
                className="text-[11px] font-black uppercase tracking-[0.15em] shrink-0"
                style={{ color }}
            >
                {label}
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
            <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: `${color}18`, color }}
            >
                {count}
            </span>
        </div>
    )
}

// ─── Shop Card ──────────────────────────────────────────────────────────────────

function ShopCard({
    item,
    onPurchase,
    onEquip,
    onPreview,
    purchasing,
    equipping,
    points,
}: {
    item: ShopItem
    onPurchase: (item: ShopItem) => void
    onEquip: (item: ShopItem) => void
    onPreview: (item: ShopItem) => void
    purchasing: string | null
    equipping: string | null
    points: number
}) {
    const color = TYPE_COLORS[item.type]
    const isNonEquip = NON_EQUIPPABLE.includes(item.type)
    const isBuying = purchasing === item.id
    const isEquipping = equipping === item.id

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex flex-col rounded-2xl overflow-hidden group shop-card"
            style={{
                background: item.equipped
                    ? `linear-gradient(160deg, ${color.bg}, rgba(10,10,16,0.9))`
                    : "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                border: item.equipped
                    ? `1px solid ${color.border}`
                    : "1px solid rgba(255,255,255,0.07)",
                boxShadow: item.equipped ? `0 0 20px -5px ${color.accent}30` : "none",
                transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
            }}
        >
            {/* Equipped badge — compact, type-colored */}
            {item.equipped && (
                <div
                    className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                    style={{
                        background: `linear-gradient(135deg, ${color.accent}cc, ${color.accent}99)`,
                        color: "#fff",
                        boxShadow: `0 2px 8px ${color.accent}40`,
                    }}
                >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    DIPAKAI
                </div>
            )}

            {/* Owned badge */}
            {item.owned && !item.equipped && (
                <div
                    className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                    style={{
                        background: "rgba(74,222,128,0.2)",
                        color: "#4ade80",
                    }}
                >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    DIMILIKI
                </div>
            )}

            {/* Preview area */}
            <div
                className="px-4 pt-4 pb-2 cursor-pointer"
                onClick={() => onPreview(item)}
            >
                {item.type === "AVATAR_FRAME"        && <FramePreview value={item.value} />}
                {item.type === "PROFILE_BANNER"      && <BannerPreview value={item.value} />}
                {item.type === "MEMORY_CARD_THEME"   && <CardThemePreview value={item.value} />}
                {item.type === "USERNAME_DECORATION" && <DecorationPreview item={item} />}
                {item.type === "MEMORY_STICKER"      && <StickerPreview item={item} />}
            </div>

            {/* Type badge pill */}
            <div className="px-4 pb-1.5">
                <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{
                        background: color.pill,
                        color: color.pillText,
                        border: `1px solid ${color.border}`,
                    }}
                >
                    {(() => {
                        const Icon = TYPE_ICONS[item.type]
                        return <Icon className="w-2.5 h-2.5" />
                    })()}
                    {TYPE_SHORT_LABELS[item.type]}
                </span>
            </div>

            {/* Info */}
            <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
                <div>
                    <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
                </div>

                {/* Price */}
                {!item.owned && (
                    <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-amber-400">{formatPoints(item.price)}</span>
                        <span className="text-[10px] text-neutral-600">poin</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={() => onPreview(item)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        title="Lihat preview"
                    >
                        <Eye className="w-4 h-4 text-neutral-400" />
                    </button>

                    <div className="flex-1">
                        {!item.owned ? (
                            <button
                                onClick={() => onPurchase(item)}
                                disabled={isBuying || points < item.price}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group/btn"
                                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                    style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                <span className="relative flex items-center gap-1.5 text-white">
                                    {isBuying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                                    {isBuying ? "Membeli..." : points < item.price ? "Poin kurang" : "Beli"}
                                </span>
                            </button>
                        ) : isNonEquip ? (
                            <div
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                                style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", color: "#4ade80" }}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Dimiliki
                            </div>
                        ) : (
                            <button
                                onClick={() => onEquip(item)}
                                disabled={isEquipping}
                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 relative overflow-hidden group/btn"
                                style={{
                                    background: item.equipped
                                        ? `${color.accent}14`
                                        : "rgba(255,255,255,0.04)",
                                    border: item.equipped
                                        ? `1px solid ${color.accent}40`
                                        : "1px solid rgba(255,255,255,0.08)",
                                    color: item.equipped ? color.text : "#9ca3af",
                                }}
                            >
                                {!item.equipped && (
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity rounded-xl"
                                        style={{ background: "rgba(99,102,241,0.1)" }}
                                    />
                                )}
                                <span className="relative flex items-center gap-1.5">
                                    {isEquipping
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : item.equipped
                                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Dipakai</>
                                            : <><Star className="w-3.5 h-3.5" /> Pakai</>
                                    }
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Preview Modal ──────────────────────────────────────────────────────────────

function ShopPreviewModal({
    item,
    onClose,
    onPurchase,
    onEquip,
    purchasing,
    equipping,
    points,
    session,
}: {
    item: ShopItem
    onClose: () => void
    onPurchase: (item: ShopItem) => void
    onEquip: (item: ShopItem) => void
    purchasing: string | null
    equipping: string | null
    points: number
    session: any
}) {
    const color = TYPE_COLORS[item.type]
    const isNonEquip = NON_EQUIPPABLE.includes(item.type)
    const isBuying = purchasing === item.id
    const isEquipping = equipping === item.id
    const TypeIcon = TYPE_ICONS[item.type]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
                        {item.type === "AVATAR_FRAME" && (
                            <div className="relative">
                                <div className="absolute -inset-4 rounded-full animate-pulse" style={{ background: item.value, filter: "blur(20px)", opacity: 0.5 }} />
                                <div className="absolute -inset-1.5 rounded-full p-[5px]" style={{ background: item.value }}>
                                    <div className="w-full h-full rounded-full" style={{ background: "rgba(8,8,14,1)" }} />
                                </div>
                                <div className="w-24 h-24 rounded-full bg-neutral-800 relative z-10 flex items-center justify-center overflow-hidden">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-neutral-500" />
                                    )}
                                </div>
                            </div>
                        )}
                        {item.type === "PROFILE_BANNER" && <div className="w-full px-4"><BannerPreview value={item.value} /></div>}
                        {item.type === "MEMORY_CARD_THEME" && <div className="w-full px-4"><CardThemePreview value={item.value} /></div>}
                        {item.type === "USERNAME_DECORATION" && (
                            <div className="text-center z-10 p-4">
                                <span className={`text-3xl font-black ${getDecorationClass(item.name)} tracking-tight`} style={(() => { try { return JSON.parse(item.value) } catch { return {} } })()}>
                                    {session?.user?.name || "Username"}
                                </span>
                            </div>
                        )}
                        {item.type === "MEMORY_STICKER" && (() => {
                            let cfg: StickerConfig | null = null
                            try { cfg = JSON.parse(item.value) } catch { }
                            return (
                                <div className="flex flex-col items-center gap-4 z-10">
                                    {cfg ? (
                                        <div style={{ transform: `rotate(${cfg.defaultRotation ?? 0}deg)`, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.4))" }}>
                                            <StickerRenderer config={cfg} />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl" style={{ background: item.previewColor ?? "#6366f1" }} />
                                    )}
                                    <p className="text-xs text-neutral-500 text-center max-w-[180px]">
                                        Stiker ini bisa ditempel di atas foto kenangan kamu
                                    </p>
                                </div>
                            )
                        })()}
                    </div>
                </div>

                {/* Description */}
                <div className="px-6 pb-4">
                    <p className="text-sm text-neutral-500 leading-relaxed">{item.description}</p>
                    {/* Price in modal */}
                    {!item.owned && (
                        <div className="flex items-center gap-1.5 mt-3">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-base font-black text-amber-400">{formatPoints(item.price)}</span>
                            <span className="text-xs text-neutral-600">poin</span>
                        </div>
                    )}
                </div>

                {/* Action */}
                <div className="px-6 pb-6">
                    {!item.owned ? (
                        <button
                            onClick={() => onPurchase(item)}
                            disabled={isBuying || points < item.price}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                            <span className="relative flex items-center gap-2 text-white">
                                {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                                {isBuying ? "Membeli..." : points < item.price ? "Poin tidak cukup" : "Beli Sekarang"}
                            </span>
                        </button>
                    ) : isNonEquip ? (
                        <div
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                            style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Stiker bisa ditempel langsung di kenangan
                        </div>
                    ) : (
                        <button
                            onClick={() => onEquip(item)}
                            disabled={isEquipping}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                            style={{
                                background: item.equipped
                                    ? "rgba(74,222,128,0.08)"
                                    : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                                border: item.equipped
                                    ? "1px solid rgba(74,222,128,0.3)"
                                    : "1px solid rgba(99,102,241,0.35)",
                                color: item.equipped ? "#4ade80" : "#c7d2fe",
                            }}
                        >
                            {isEquipping
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : item.equipped
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

export default function ShopPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [items, setItems] = useState<ShopItem[]>([])
    const [points, setPoints] = useState(0)
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState<"ALL" | ItemType>("ALL")
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [equipping, setEquipping] = useState<string | null>(null)
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(null)

    const loadShop = useCallback(async () => {
        const res = await fetch("/api/shop")
        if (!res.ok) return
        const data = await res.json()
        setItems(data.items)
        setPoints(data.points)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (status === "unauthenticated") { router.push("/login"); return }
        if (status === "authenticated") loadShop()
    }, [status, loadShop, router])

    const handlePurchase = async (item: ShopItem) => {
        setPurchasing(item.id)
        try {
            const res = await fetch("/api/shop/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error === "Insufficient points" ? "Poin tidak cukup!" : (data.error || "Gagal membeli"))
                return
            }
            setPoints(data.newPoints)
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, owned: true } : i))
            // Update preview if open
            if (previewItem?.id === item.id) {
                setPreviewItem(prev => prev ? { ...prev, owned: true } : null)
            }
            toast.success(`🎉 "${item.name}" berhasil dibeli!`)
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setPurchasing(null)
        }
    }

    const handleEquip = async (item: ShopItem) => {
        setEquipping(item.id)
        try {
            const res = await fetch("/api/inventory/equip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error || "Gagal memakai item"); return }

            const willEquip = data.equipped
            setItems(prev => prev.map(i => {
                if (i.type !== item.type) return i
                if (i.id === item.id) return { ...i, equipped: willEquip }
                return { ...i, equipped: false }
            }))
            // Update preview if open
            if (previewItem?.id === item.id) {
                setPreviewItem(prev => prev ? { ...prev, equipped: willEquip } : null)
            }
            toast.success(willEquip ? `✨ "${item.name}" sedang dipakai!` : `"${item.name}" dilepas.`)
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setEquipping(null)
        }
    }

    const filtered = activeType === "ALL" ? items : items.filter(i => i.type === activeType)

    const ownedItems = filtered.filter(i => i.owned)
    const notOwnedItems = filtered.filter(i => !i.owned)

    const countByType = (type: ItemType) => items.filter(i => i.type === type).length
    const ownedCount = items.filter(i => i.owned).length

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* ── Hover lift style ── */}
            <style jsx global>{`
                .shop-card {
                    transform: translateY(0);
                }
                .shop-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important;
                    border-color: rgba(255,255,255,0.12) !important;
                }
            `}</style>

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
            >
                <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                        >
                            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">Memory Shop</h1>
                                {/* Mobile Inventory Button */}
                                <Link
                                    href="/inventory"
                                    className="sm:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-95"
                                    style={{
                                        background: "rgba(99,102,241,0.1)",
                                        border: "1px solid rgba(99,102,241,0.2)",
                                        color: "#818cf8",
                                    }}
                                    title="Ke Inventori"
                                >
                                    <Package className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <p className="text-[13px] text-neutral-500 mt-1">
                                Tukarkan poin kamu dengan dekorasi profil eksklusif
                            </p>
                        </div>
                    </div>

                    {/* Desktop Inventory Button */}
                    <Link
                        href="/inventory"
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                        style={{
                            background: "rgba(99,102,241,0.08)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            color: "#818cf8",
                        }}
                    >
                        <Package className="w-4 h-4" />
                        Ke Inventori
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                </div>

                {/* Stat pills */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
                        style={{
                            background: "rgba(99,102,241,0.12)",
                            border: "1px solid rgba(99,102,241,0.25)",
                            color: "#a5b4fc",
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1" }} />
                        {items.length} item tersedia
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
                        style={{
                            background: "rgba(74,222,128,0.1)",
                            border: "1px solid rgba(74,222,128,0.25)",
                            color: "#6ee7b7",
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                        {ownedCount} sudah dimiliki
                    </span>
                </div>

                {/* Topup Banner */}
                <Link
                    href="/topup"
                    className="flex items-center gap-3 mt-5 px-4 py-3 rounded-2xl group transition-all"
                    style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.07), rgba(245,158,11,0.03))",
                        border: "1px solid rgba(251,191,36,0.2)",
                    }}
                >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.1)" }}>
                        <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-300">Topup Memory Point</p>
                        <p className="text-xs text-neutral-500">Butuh lebih banyak poin? Topup sekarang secara instan</p>
                    </div>
                    <div className="text-amber-500/50 group-hover:text-amber-400 transition-colors text-xs font-bold">
                        Topup →
                    </div>
                </Link>
            </motion.div>

            {/* ── Filter Tabs ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Semua
                        <span
                            className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: "rgba(255,255,255,0.08)", color: "#6b7280" }}
                        >
                            {items.length}
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
            {filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}
                    >
                        <ShoppingBag className="w-7 h-7 text-indigo-500/50" />
                    </div>
                    <p className="text-base font-bold text-neutral-400 mb-1">Belum ada item di kategori ini</p>
                    <p className="text-sm text-neutral-600 max-w-xs leading-relaxed mb-5">
                        Item baru akan segera ditambahkan. Stay tuned!
                    </p>
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
                >
                    {/* Belum Dimiliki Section */}
                    {notOwnedItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 mb-8">
                            <SectionDivider
                                label="Tersedia untuk Dibeli"
                                count={notOwnedItems.length}
                                color="#818cf8"
                            />
                            <AnimatePresence mode="popLayout">
                                {notOwnedItems.map(item => (
                                    <ShopCard
                                        key={item.id}
                                        item={item}
                                        onPurchase={handlePurchase}
                                        onEquip={handleEquip}
                                        onPreview={setPreviewItem}
                                        purchasing={purchasing}
                                        equipping={equipping}
                                        points={points}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Sudah Dimiliki Section */}
                    {ownedItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
                            <SectionDivider
                                label="Sudah Dimiliki"
                                count={ownedItems.length}
                                color="#4ade80"
                            />
                            <AnimatePresence mode="popLayout">
                                {ownedItems.map(item => (
                                    <ShopCard
                                        key={item.id}
                                        item={item}
                                        onPurchase={handlePurchase}
                                        onEquip={handleEquip}
                                        onPreview={setPreviewItem}
                                        purchasing={purchasing}
                                        equipping={equipping}
                                        points={points}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Preview Modal ── */}
            <AnimatePresence>
                {previewItem && (
                    <ShopPreviewModal
                        item={previewItem}
                        onClose={() => setPreviewItem(null)}
                        onPurchase={handlePurchase}
                        onEquip={handleEquip}
                        purchasing={purchasing}
                        equipping={equipping}
                        points={points}
                        session={session}
                    />
                )}
            </AnimatePresence>

            {/* ── Floating Points Balance ── */}
            <div
                className="fixed top-24 right-4 sm:top-24 sm:right-8 z-40 flex items-center gap-2 px-1.5 py-1.5 pr-4 rounded-full shadow-lg backdrop-blur-md cursor-default"
                style={{
                    background: "rgba(10,10,15,0.75)",
                    border: "1px solid rgba(251,191,36,0.3)",
                    boxShadow: "0 4px 20px -5px rgba(245,158,11,0.3)"
                }}
            >
                <div className="flex items-center justify-center p-1.5 rounded-full bg-amber-400/10">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex flex-col justify-center">
                    <p className="text-sm font-black text-amber-400 leading-[1]">{formatPoints(points)}</p>
                    <p className="text-[8px] text-amber-500/80 font-black uppercase tracking-widest mt-0.5 leading-[1]">Points</p>
                </div>
            </div>
        </div>
    )
}