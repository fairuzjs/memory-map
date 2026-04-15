"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Star, Package, ShoppingBag,
    ChevronRight, Info, X, Repeat2,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ItemType = "AVATAR_FRAME" | "PROFILE_BANNER" | "MEMORY_CARD_THEME" | "USERNAME_DECORATION" | "MEMORY_STICKER" | "PREMIUM_FEATURE"

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

type GachaResult = {
    item: {
        id: string
        name: string
        description: string
        price: number
        type: ItemType
        value: string
        previewColor: string | null
    }
    tier: TierName
    isDuplicate: boolean
    refundAmount: number
}

type TierName = "BASIC" | "ELITE" | "EPIC" | "LEGEND"

// ─── Tier Config (consistent with shop/inventory) ──────────────────────────────

const TIER_CONFIG: Record<TierName, {
    label: string
    icon: string
    color: string
    glow: string
    bg: string
    border: string
    gradient: string
}> = {
    BASIC: {
        label: "Basic",
        icon: "◆",
        color: "#94a3b8",
        glow: "rgba(148,163,184,0.5)",
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.2)",
        gradient: "linear-gradient(135deg, #94a3b8, #64748b)",
    },
    ELITE: {
        label: "Elite",
        icon: "◈",
        color: "#818cf8",
        glow: "rgba(99,102,241,0.5)",
        bg: "rgba(99,102,241,0.1)",
        border: "rgba(99,102,241,0.25)",
        gradient: "linear-gradient(135deg, #818cf8, #6366f1)",
    },
    EPIC: {
        label: "Epic",
        icon: "✦",
        color: "#f472b6",
        glow: "rgba(236,72,153,0.5)",
        bg: "rgba(236,72,153,0.1)",
        border: "rgba(236,72,153,0.25)",
        gradient: "linear-gradient(135deg, #f472b6, #ec4899)",
    },
    LEGEND: {
        label: "Legend",
        icon: "★",
        color: "#fbbf24",
        glow: "rgba(245,158,11,0.6)",
        bg: "rgba(245,158,11,0.12)",
        border: "rgba(245,158,11,0.3)",
        gradient: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
    },
}

const TYPE_ICONS: Record<ItemType, React.FC<any>> = {
    AVATAR_FRAME: User,
    PROFILE_BANNER: ImageIcon,
    MEMORY_CARD_THEME: Grid2x2,
    USERNAME_DECORATION: Type,
    MEMORY_STICKER: Sticker,
    PREMIUM_FEATURE: Package,
}

function getTier(price: number): TierName {
    if (price <= 100) return "BASIC"
    if (price <= 175) return "ELITE"
    if (price <= 275) return "EPIC"
    return "LEGEND"
}

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

const TYPE_SHORT_LABELS: Record<ItemType, string> = {
    AVATAR_FRAME: "Bingkai Avatar",
    PROFILE_BANNER: "Banner Profil",
    MEMORY_CARD_THEME: "Tema Kartu",
    USERNAME_DECORATION: "Dekorasi Nama",
    MEMORY_STICKER: "Stiker",
    PREMIUM_FEATURE: "Premium",
}

function formatPoints(num: number): string {
    return num.toLocaleString("id-ID")
}

function TierBadge({ tier, size = "sm" }: { tier: TierName; size?: "sm" | "md" }) {
    const cfg = TIER_CONFIG[tier]
    const isLegend = tier === "LEGEND"

    return (
        <span
            className="inline-flex items-center gap-0.5 font-black uppercase tracking-wider"
            style={{
                fontSize: size === "md" ? "10px" : "9px",
                padding: size === "md" ? "3px 8px" : "2px 6px",
                borderRadius: "6px",
                background: isLegend
                    ? "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))"
                    : cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                boxShadow: isLegend ? `0 0 8px -2px ${cfg.glow}` : "none",
            }}
        >
            <span style={{ fontSize: size === "md" ? "9px" : "8px" }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    )
}

// ─── Item Preview Components (same as Shop) ───────────────────────────────────

function CardThemePreview({ value }: { value: string }) {
    let theme: any = null
    try { theme = JSON.parse(value) } catch { }
    return (
        <div
            className="relative w-full h-full rounded-lg overflow-hidden flex flex-col justify-end"
            style={{
                background: theme?.background ?? "#11111a",
                border: theme?.border ?? "1px solid rgba(255,255,255,0.08)",
                boxShadow: theme?.shadow ?? "none",
            }}
        >
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: theme?.patternImage, backgroundSize: "cover" }} />
            <div className="p-2 relative z-10">
                <div className="w-8 h-1.5 rounded-full mb-1 opacity-60"
                    style={{ background: theme?.titleColor ?? "#fff" }} />
                <div className="w-12 h-1 rounded-full opacity-40"
                    style={{ background: theme?.storyColor ?? "#ccc" }} />
            </div>
        </div>
    )
}

function BannerPreview({ value }: { value: string }) {
    return (
        <div
            className="w-full h-full rounded-lg overflow-hidden relative"
            style={{ background: value }}
        >
            <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
        </div>
    )
}

function FramePreview({ value }: { value: string }) {
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-12 h-12">
                <div className="absolute -inset-1 rounded-full p-[2px]" style={{ background: value }}>
                    <div className="w-full h-full rounded-full" style={{ background: "rgba(14,14,24,1)" }} />
                </div>
                <div className="relative w-12 h-12 rounded-full z-10 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <User className="w-5 h-5 text-neutral-600" />
                </div>
            </div>
        </div>
    )
}

function DecorationPreview({ item }: { item: ShopItem }) {
    let style: React.CSSProperties = {}
    try { style = JSON.parse(item.value) } catch { }
    return (
        <div className="flex items-center justify-center">
            <span
                className={`text-sm font-black ${getDecorationClass(item.name)}`}
                style={style}
            >
                {item.name}
            </span>
        </div>
    )
}

function StickerPreview({ item }: { item: ShopItem }) {
    let cfg: StickerConfig | null = null
    try { cfg = JSON.parse(item.value) } catch { }
    if (!cfg) return <div className="w-8 h-8 rounded-lg" style={{ background: item.previewColor ?? "#6366f1" }} />
    return (
        <div className="flex items-center justify-center" style={{ transform: `rotate(${cfg.defaultRotation}deg) scale(0.8)` }}>
            <StickerRenderer config={cfg} />
        </div>
    )
}

function ItemPreview({ item }: { item: ShopItem }) {
    switch (item.type) {
        case "AVATAR_FRAME":
            return <FramePreview value={item.value} />
        case "PROFILE_BANNER":
            return <BannerPreview value={item.value} />
        case "MEMORY_CARD_THEME":
            return <CardThemePreview value={item.value} />
        case "USERNAME_DECORATION":
            return <DecorationPreview item={item} />
        case "MEMORY_STICKER":
            return <StickerPreview item={item} />
        default:
            return null
    }
}

// ─── Roulette Slot Component ───────────────────────────────────────────────────

function RouletteSlot({ isLocked, finalResult, poolItems }: { isLocked: boolean, finalResult?: GachaResult, poolItems: ShopItem[] }) {
    const [displayTier, setDisplayTier] = useState<TierName>("BASIC")
    const [displayType, setDisplayType] = useState<ItemType>("AVATAR_FRAME")
    const [displayName, setDisplayName] = useState("")
    const [hasExploded, setHasExploded] = useState(false)

    useEffect(() => {
        if (!isLocked) {
            if (poolItems.length === 0) return
            const interval = setInterval(() => {
                const item = poolItems[Math.floor(Math.random() * poolItems.length)]
                setDisplayTier(getTier(item.price))
                setDisplayType(item.type)
                setDisplayName(item.name)
            }, 60)
            return () => clearInterval(interval)
        } else if (finalResult) {
            setDisplayTier(finalResult.tier)
            setDisplayType(finalResult.item.type)
            setDisplayName(finalResult.item.name)
            setHasExploded(true)
        }
    }, [isLocked, finalResult, poolItems])

    const cfg = TIER_CONFIG[displayTier]
    const Icon = TYPE_ICONS[displayType] || Package

    return (
        <div className="relative w-24 h-36 sm:w-32 sm:h-40 shrink-0">
            {/* Explosion */}
            <AnimatePresence>
                {hasExploded && (
                    <motion.div
                        key="explosion"
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: [1, 2.5, 3], opacity: [1, 0.8, 0] }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-0 rounded-2xl z-50 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, white 10%, ${cfg.color} 50%, transparent 80%)`,
                            boxShadow: `0 0 40px ${cfg.color}`
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Slot Box */}
            <motion.div
                animate={isLocked ? { scale: [1, 1.1, 1], y: [0, -10, 0] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full flex flex-col items-center justify-center rounded-2xl relative overflow-hidden transition-colors duration-300"
                style={{
                    background: isLocked
                        ? "linear-gradient(160deg, rgba(18,18,28,0.98), rgba(10,10,16,0.99))"
                        : "rgba(255,255,255,0.03)",
                    border: isLocked ? `2px solid ${cfg.color}` : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isLocked ? `0 0 20px ${cfg.color}40, inset 0 0 20px ${cfg.color}10` : "none",
                }}
            >
                {isLocked && (
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cfg.gradient }} />
                )}

                {/* Preview area */}
                {isLocked && finalResult ? (
                    <div className="w-full h-full flex flex-col pt-3 pb-2.5 px-1">
                        {/* Preview Item Component (Centered via flex-1) */}
                        <div className="w-full flex-1 flex items-center justify-center min-h-0">
                            <ItemPreview item={{
                                id: finalResult.item.id,
                                name: finalResult.item.name,
                                description: finalResult.item.description,
                                price: finalResult.item.price,
                                type: finalResult.item.type,
                                value: finalResult.item.value,
                                previewColor: finalResult.item.previewColor,
                                owned: false,
                                equipped: false,
                            }} />
                        </div>
                        
                        {/* Title and Badge Container (Stick to bottom) */}
                        <div className="flex flex-col items-center shrink-0 mt-2 gap-1.5">
                            <span className="text-[9px] sm:text-[10px] font-black text-center leading-tight line-clamp-2" style={{ color: cfg.color }}>
                                {displayName}
                            </span>
                            <TierBadge tier={displayTier} size="sm" />
                        </div>
                    </div>
                ) : (
                    <Icon
                        className="w-8 h-8 sm:w-10 sm:h-10 transition-all opacity-40"
                        style={{ color: "#64748b" }}
                    />
                )}
            </motion.div>
        </div>
    )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function GachaPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [points, setPoints] = useState(0)
    const [shopItems, setShopItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)
    const [phase, setPhase] = useState<"idle" | "spinning" | "reveal">("idle")
    const [pullCount, setPullCount] = useState<1 | 5>(1)
    const [results, setResults] = useState<GachaResult[]>([])
    const [lockedSlots, setLockedSlots] = useState<GachaResult[]>([])
    const [resultMeta, setResultMeta] = useState<{ totalCost: number; totalRefund: number; newPoints: number } | null>(null)
    const [showInfo, setShowInfo] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const res = await fetch("/api/shop")
            if (res.ok) {
                const data = await res.json()
                setPoints(data.points)
                // Filter out PREMIUM_FEATURE for gacha pool display
                const poolItems = (data.items as ShopItem[]).filter(i => i.type !== "PREMIUM_FEATURE")
                setShopItems(poolItems)
            }
        } catch (error) {
            console.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [])

    // Create tripled carousel array from real shop items
    const carouselItems = [...shopItems, ...shopItems, ...shopItems]

    useEffect(() => {
        if (status === "unauthenticated") { router.push("/login"); return }
        if (status === "authenticated") loadData()
    }, [status, loadData, router])

    const openBox = async (count: 1 | 5) => {
        const cost = count === 5 ? 85 : 20
        if (points < cost) {
            toast.error("Poin tidak cukup!")
            return
        }

        setPhase("spinning")
        setPullCount(count)
        setLockedSlots([])
        setResults([])

        try {
            const res = await fetch("/api/gacha/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count }),
            })
            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Gagal membuka box")
                setPhase("idle")
                return
            }

            const pulls: GachaResult[] = data.results
            setResults(pulls)
            setResultMeta({ totalCost: data.totalCost, totalRefund: data.totalRefund, newPoints: data.newPoints })

            pulls.forEach((pullResult, index) => {
                setTimeout(() => {
                    setLockedSlots(prev => [...prev, pullResult])
                }, 1000 + (index * 600))
            })

            setTimeout(() => {
                setPhase("reveal")
                setPoints(data.newPoints)
            }, 1000 + (pulls.length * 600) + 1200)

        } catch (error) {
            toast.error("Terjadi kesalahan sistem")
            setPhase("idle")
        }
    }

    const closeResults = () => {
        setPhase("idle")
        setResults([])
        setLockedSlots([])
        setResultMeta(null)
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* ── Header (consistent with Shop/Inventory pattern) ── */}
            <AnimatePresence>
                {phase === "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-8"
                    >
                        <div className="flex items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}
                                >
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">Mystery Box</h1>
                                        {/* Mobile Shop Button */}
                                        <Link
                                            href="/shop"
                                            className="sm:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-95"
                                            style={{
                                                background: "rgba(99,102,241,0.1)",
                                                border: "1px solid rgba(99,102,241,0.2)",
                                                color: "#818cf8",
                                            }}
                                            title="Ke Shop"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                    <p className="text-[13px] text-neutral-500 mt-1">
                                        Uji keberuntunganmu dan dapatkan item langka dari mystery box
                                    </p>
                                </div>
                            </div>

                            {/* Desktop Shop Button */}
                            <Link
                                href="/shop"
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                                style={{
                                    background: "rgba(99,102,241,0.08)",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                    color: "#818cf8",
                                }}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Ke Shop
                                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </Link>
                        </div>

                        {/* Stat pills (consistent with Shop/Inventory) */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <span
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                    background: "rgba(251,191,36,0.1)",
                                    border: "1px solid rgba(251,191,36,0.25)",
                                    color: "#fbbf24",
                                }}
                            >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {formatPoints(points)} poin
                            </span>
                            <span
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                    background: "rgba(139,92,246,0.1)",
                                    border: "1px solid rgba(139,92,246,0.25)",
                                    color: "#a78bfa",
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8b5cf6" }} />
                                20 poin / buka
                            </span>
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:bg-white/8"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "#6b7280",
                                }}
                            >
                                <Info className="w-3 h-3" />
                                Drop Rate
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content Area ── */}
            <AnimatePresence mode="wait">
                {/* ── IDLE PHASE ── */}
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Carousel Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="rounded-3xl py-8 mb-6 overflow-hidden relative"
                            style={{
                                background: "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                                border: "1px solid rgba(255,255,255,0.07)",
                            }}
                        >
                            {/* Ambient glow */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                                <div className="absolute top-[-30%] left-[-10%] w-[50%] h-[90%] rounded-full mix-blend-screen"
                                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)" }} />
                                <div className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[90%] rounded-full mix-blend-screen"
                                    style={{ background: "radial-gradient(circle, rgba(168,85,247,0.06), transparent 70%)" }} />
                            </div>

                            <div className="text-center mb-5 relative z-10">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-600">Preview Hadiah</p>
                            </div>

                            {/* Seamless Carousel */}
                            <div className="relative w-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 w-16 sm:w-32 z-10 pointer-events-none"
                                    style={{ background: "linear-gradient(90deg, rgba(18,18,28,0.98), transparent)" }} />
                                <div className="absolute inset-y-0 right-0 w-16 sm:w-32 z-10 pointer-events-none"
                                    style={{ background: "linear-gradient(270deg, rgba(10,10,16,0.98), transparent)" }} />

                                <motion.div
                                    animate={{ x: [0, -(shopItems.length * 140)] }}
                                    transition={{ duration: Math.max(20, shopItems.length * 1.5), ease: "linear", repeat: Infinity }}
                                    className="flex gap-3 items-stretch w-max py-2"
                                >
                                    {carouselItems.map((item, i) => {
                                        const tier = getTier(item.price)
                                        const cfg = TIER_CONFIG[tier]
                                        return (
                                            <div
                                                key={i}
                                                className="w-28 sm:w-32 rounded-2xl flex flex-col relative overflow-hidden shrink-0"
                                                style={{
                                                    background: "rgba(255,255,255,0.03)",
                                                    border: "1px solid rgba(255,255,255,0.07)",
                                                }}
                                            >
                                                <div className="absolute top-0 left-0 right-0 h-0.5 z-10" style={{ background: cfg.gradient }} />
                                                {/* Item preview */}
                                                <div className="h-20 sm:h-24 flex items-center justify-center p-2">
                                                    <ItemPreview item={item} />
                                                </div>
                                                {/* Name + tier badge */}
                                                <div className="px-2 pb-2 flex flex-col items-center gap-1">
                                                    <span className="text-[8px] sm:text-[9px] text-center font-bold text-neutral-500 line-clamp-1 w-full">{item.name}</span>
                                                    <TierBadge tier={tier} size="sm" />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="grid grid-cols-2 gap-4 mb-6"
                        >
                            {/* Single pull */}
                            <button
                                onClick={() => openBox(1)}
                                disabled={points < 20}
                                className="relative flex flex-col items-center justify-center gap-1.5 py-4 sm:py-5 min-h-[90px] rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))" }} />
                                <span className="relative text-xs sm:text-sm font-bold text-neutral-400 group-hover:text-neutral-200 transition-colors">Buka 1x</span>
                                <span className="relative flex items-center gap-1 text-amber-400 text-xs font-bold">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    20 poin
                                </span>
                            </button>

                            {/* Multi pull */}
                            <button
                                onClick={() => openBox(5)}
                                disabled={points < 85}
                                className="relative flex flex-col items-center justify-center gap-1.5 py-4 sm:py-5 min-h-[90px] rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                }}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))" }} />
                                
                                {/* Discount badge */}
                                <div
                                    className="relative z-10 px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider mb-0.5"
                                    style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
                                >
                                    Hemat 15 poin
                                </div>
                                <span className="relative text-xs sm:text-sm font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors">Buka 5x</span>
                                <span className="relative flex items-center gap-1 text-amber-400 text-xs font-bold">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    85 poin
                                    <span className="text-neutral-600 line-through ml-1 font-normal opacity-70">100</span>
                                </span>
                            </button>
                        </motion.div>

                        {/* Quick links (consistent with other pages) */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            <Link
                                href="/shop"
                                className="flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all group"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-300 transition-colors">Memory Shop</span>
                                <ChevronRight className="w-3 h-3 text-neutral-600 ml-auto" />
                            </Link>
                            <Link
                                href="/inventory"
                                className="flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all group"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <Package className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-300 transition-colors">Inventori</span>
                                <ChevronRight className="w-3 h-3 text-neutral-600 ml-auto" />
                            </Link>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── SPINNING PHASE ── */}
                {phase === "spinning" && (
                    <motion.div
                        key="spinning"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center justify-center min-h-[75vh] py-16 relative"
                    >
                        {/* Spinning background ring */}
                        <motion.div
                            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                            className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full"
                            style={{ border: "1px solid rgba(99,102,241,0.1)", background: "rgba(99,102,241,0.02)", filter: "blur(8px)" }}
                        />

                        <div className="flex flex-wrap justify-center gap-2 sm:gap-5 px-2 sm:px-4 relative z-10 w-full max-w-4xl">
                            {Array.from({ length: pullCount }).map((_, i) => {
                                const isLocked = i < lockedSlots.length
                                return (
                                    <RouletteSlot
                                        key={i}
                                        isLocked={isLocked}
                                        finalResult={lockedSlots[i]}
                                        poolItems={shopItems}
                                    />
                                )
                            })}
                        </div>

                        <p className="text-sm font-bold text-neutral-500 mt-8 relative z-10">
                            Membuka keberuntungan...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── REVEAL PHASE (Full Screen Results) ── */}
            <AnimatePresence>
                {phase === "reveal" && results.length > 0 && resultMeta && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[100] overflow-y-auto"
                        style={{ background: "rgba(3,3,10,0.95)", backdropFilter: "blur(20px)" }}
                    >
                        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 sm:px-8 py-12 md:py-20">
                            <motion.h2
                                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                className="text-2xl sm:text-3xl font-black text-white mb-8 tracking-wide text-center"
                                style={{ textShadow: "0 0 20px rgba(255,255,255,0.15)" }}
                            >
                                ITEM DIDAPATKAN
                            </motion.h2>

                            <div className={`grid gap-4 sm:gap-5 w-full mx-auto ${results.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-5xl'}`}>
                                {results.map((res, i) => {
                                    const cfg = TIER_CONFIG[res.tier]

                                    // Build ShopItem for ItemPreview
                                    const previewItem: ShopItem = {
                                        id: res.item.id,
                                        name: res.item.name,
                                        description: res.item.description,
                                        price: res.item.price,
                                        type: res.item.type,
                                        value: res.item.value,
                                        previewColor: res.item.previewColor,
                                        owned: false,
                                        equipped: false,
                                    }

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 50, scale: 0.8, rotateY: 90 }}
                                            animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                                            transition={{ delay: i * 0.15, duration: 0.6, type: "spring", bounce: 0.4 }}
                                            className="relative group w-full"
                                            style={{ perspective: "1000px" }}
                                        >
                                            {/* Card Glow */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-2xl"
                                                style={{ background: cfg.color, filter: "blur(20px)" }} />

                                            <div
                                                className="relative flex flex-col rounded-2xl overflow-hidden"
                                                style={{
                                                    background: "linear-gradient(160deg, rgba(18,18,28,0.98), rgba(10,10,16,0.99))",
                                                    border: `1px solid ${cfg.border}`,
                                                    boxShadow: `0 0 20px -4px ${cfg.glow}`,
                                                }}
                                            >
                                                {/* Top Gradient Accent */}
                                                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cfg.gradient }} />

                                                {/* Tier + Duplicate badge row */}
                                                <div className="flex justify-between items-start z-10 px-3 pt-3">
                                                    <TierBadge tier={res.tier} size="md" />
                                                    {res.isDuplicate && (
                                                        <span className="text-[9px] font-bold text-amber-400 px-2 py-0.5 rounded-full"
                                                            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
                                                            Duplikat +{res.refundAmount}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Item Preview (real visual) */}
                                                <div className="h-24 sm:h-32 flex items-center justify-center relative z-10 mx-3 my-2 rounded-xl overflow-hidden"
                                                    style={{ background: "rgba(255,255,255,0.02)" }}
                                                >
                                                    <motion.div
                                                        animate={res.tier === 'LEGEND' ? { y: [-3, 3, -3] } : {}}
                                                        transition={{ duration: 3, repeat: Infinity }}
                                                        className="w-full h-full flex items-center justify-center"
                                                    >
                                                        <ItemPreview item={previewItem} />
                                                    </motion.div>
                                                </div>

                                                {/* Item info */}
                                                <div className="text-center z-10 relative px-3 pb-3">
                                                    <p className="text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-0.5">
                                                        {TYPE_SHORT_LABELS[res.item.type]}
                                                    </p>
                                                    <h3 className="text-sm sm:text-base font-black text-white leading-tight mb-1.5">{res.item.name}</h3>
                                                    <div className="flex items-center justify-center gap-1 text-amber-400">
                                                        <Star className="w-3 h-3 fill-amber-400" />
                                                        <span className="text-[11px] font-bold">Nilai: {res.item.price} poin</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Actions (inline, not absolute) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: results.length * 0.15 + 0.5 }}
                                className="w-full max-w-xl mt-8 space-y-3"
                            >
                                {/* Summary */}
                                <div
                                    className="rounded-xl px-4 py-3 flex items-center justify-between"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                >
                                    <div className="text-[11px] sm:text-xs text-neutral-500">
                                        <p>Total biaya: <span className="text-amber-400 font-bold">{resultMeta.totalCost} poin</span></p>
                                        {resultMeta.totalRefund > 0 && <p>Refund duplikat: <span className="text-green-400 font-bold">+{resultMeta.totalRefund} poin</span></p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Sisa poin</p>
                                        <p className="text-base font-black text-amber-400">{formatPoints(resultMeta.newPoints)}</p>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={closeResults}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                                    >
                                        Konfirmasi
                                    </button>
                                    <button
                                        onClick={() => {
                                            closeResults()
                                            setTimeout(() => openBox(pullCount), 300)
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                        <span className="relative flex items-center gap-2 text-white">
                                            <Repeat2 className="w-4 h-4" />
                                            Buka {pullCount}x Lagi
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── INFO MODAL ── */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
                        onClick={() => setShowInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
                            className="w-full max-w-sm rounded-3xl overflow-hidden"
                            style={{
                                background: "linear-gradient(160deg, #0e0e18, #0a0a12)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal top accent */}
                            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)" }} />

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-base font-black text-white flex items-center gap-2">
                                        <Info className="w-4 h-4 text-indigo-400" />
                                        Drop Rates
                                    </h3>
                                    <button
                                        onClick={() => setShowInfo(false)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/8 transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {(["LEGEND", "EPIC", "ELITE", "BASIC"] as TierName[]).map(tier => {
                                        const cfg = TIER_CONFIG[tier]
                                        const rates: Record<TierName, string> = { LEGEND: "3%", EPIC: "12%", ELITE: "30%", BASIC: "55%" }
                                        return (
                                            <div key={tier} className="flex items-center gap-3">
                                                <TierBadge tier={tier} size="md" />
                                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: rates[tier],
                                                            background: cfg.gradient,
                                                            boxShadow: `0 0 6px ${cfg.glow}`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: cfg.color }}>
                                                    {rates[tier]}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div
                                    className="mt-5 px-4 py-3 rounded-xl text-[11px] text-neutral-500 leading-relaxed text-center"
                                    style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
                                >
                                    Harga buka gacha: <strong className="text-amber-400/80">20 poin</strong> per gacha.
                                    5x buka gacha mendapat diskon menjadi <strong className="text-amber-400/80">85 poin</strong>.
                                    Item duplikat mendapat refund <strong className="text-green-400/80">5 poin</strong>.
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}