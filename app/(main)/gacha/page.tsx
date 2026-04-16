"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Star, Package, ShoppingBag,
    ChevronRight, Info, X, Repeat2,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    Sparkles, Gem, Flame, Zap, Settings
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

type TierName = "BASIC" | "ELITE" | "EPIC" | "LEGEND" | "SPECIAL"

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
    SPECIAL: {
        label: "Special",
        icon: "✧",
        color: "#2dd4bf",
        glow: "rgba(45,212,191,0.6)",
        bg: "rgba(45,212,191,0.12)",
        border: "rgba(45,212,191,0.3)",
        gradient: "linear-gradient(135deg, #2dd4bf, #14b8a6, #0d9488)",
    },
}

const SPECIAL_ITEM_NAMES = new Set(["Cuddlysun", "Shape Coquette", "Grape Blossom", "Soft Bubble Tea"])

export const BOOSTER_CONFIGS = {
    0: { name: "Default Base", single: 20, multi: 85, rates: { BASIC: 55, ELITE: 30, EPIC: 12, LEGEND: 3 }, color: "neutral" },
    1: { name: "Biasa Aja", single: 40, multi: 185, rates: { BASIC: 50, ELITE: 25, EPIC: 15, LEGEND: 10 }, color: "neutral" },
    2: { name: "Cacing Naga", single: 60, multi: 285, rates: { BASIC: 35, ELITE: 30, EPIC: 20, LEGEND: 15 }, color: "emerald" },
    3: { name: "Aura 999+", single: 80, multi: 385, rates: { BASIC: 10, ELITE: 35, EPIC: 35, LEGEND: 20 }, color: "fuchsia" },
}

// SVG icon components for each booster level
const BOOSTER_ICONS: Record<number, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
    1: Gem,
    2: Flame,
    3: Zap,
}

const BOOSTER_ICON_COLORS: Record<number, { inactive: string; active: string }> = {
    1: { inactive: "#6b7280", active: "#818cf8" },
    2: { inactive: "#6b7280", active: "#34d399" },
    3: { inactive: "#6b7280", active: "#e879f9" },
}

// Unique glow/color for each booster relic slot
const BOOSTER_RELIC_STYLES: Record<number, { borderColor: string; glowColor: string; bgActive: string }> = {
    1: { borderColor: "rgba(99,102,241,0.5)", glowColor: "rgba(99,102,241,0.25)", bgActive: "rgba(99,102,241,0.1)" },
    2: { borderColor: "rgba(52,211,153,0.5)", glowColor: "rgba(52,211,153,0.25)", bgActive: "rgba(52,211,153,0.1)" },
    3: { borderColor: "rgba(232,121,249,0.5)", glowColor: "rgba(232,121,249,0.25)", bgActive: "rgba(232,121,249,0.1)" },
}

const TYPE_ICONS: Record<ItemType, React.FC<any>> = {
    AVATAR_FRAME: User,
    PROFILE_BANNER: ImageIcon,
    MEMORY_CARD_THEME: Grid2x2,
    USERNAME_DECORATION: Type,
    MEMORY_STICKER: Sticker,
    PREMIUM_FEATURE: Package,
}

function getTier(price: number, name?: string): TierName {
    if (name && SPECIAL_ITEM_NAMES.has(name)) return "SPECIAL"
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
    // Epic
    if (n.includes("glitch")) return "anim-glitch"
    if (n.includes("quasar")) return "anim-quasar"
    // Legend
    if (n.includes("celestial")) return "anim-celestial"
    if (n.includes("supernova")) return "anim-supernova"
    if (n.includes("rune")) return "anim-rune"
    return ""
}

function getFrameClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    // Epic
    if (n.includes("orbit")) return "anim-frame-orbit"
    if (n.includes("fraktur")) return "anim-frame-fraktur"
    // Legend
    if (n.includes("singularitas")) return "anim-frame-singularitas"
    if (n.includes("cakra")) return "anim-frame-cakra"
    if (n.includes("eternum")) return "anim-frame-eternum"
    return ""
}

function getCardThemeClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    // Epic
    if (n.includes("perkamen")) return "anim-card-perkamen"
    if (n.includes("neon")) return "anim-card-neon"
    if (n.includes("mistik")) return "anim-card-mistik"
    // Legend
    if (n.includes("void")) return "anim-card-void"
    if (n.includes("eter")) return "anim-card-eter"
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
                background: tier === "SPECIAL"
                    ? "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(20,184,166,0.08))"
                    : isLegend
                        ? "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))"
                        : cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                boxShadow: (isLegend || tier === "SPECIAL") ? `0 0 8px -2px ${cfg.glow}` : "none",
            }}
        >
            <span style={{ fontSize: size === "md" ? "9px" : "8px" }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    )
}

// ─── Item Preview Components (same as Shop) ───────────────────────────────────

function CardThemePreview({ value, name }: { value: string; name?: string }) {
    let theme: any = null
    try { theme = JSON.parse(value) } catch { }
    const cc = getCardThemeClass(name)
    return (
        <div
            className={`relative w-full h-full rounded-lg overflow-hidden flex flex-col justify-end ${cc}`}
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

function FramePreview({ value, name }: { value: string; name?: string }) {
    const fc = getFrameClass(name)
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-12 h-12">
                {fc && (
                    <div className={`absolute -inset-2 rounded-full ${fc}-glow`}
                        style={{ background: value, filter: "blur(10px)", opacity: 0.4 }} />
                )}
                <div className={`absolute -inset-1 rounded-full p-[2px] ${fc}`} style={{ background: value }}>
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
            return <FramePreview value={item.value} name={item.name} />
        case "PROFILE_BANNER":
            return <BannerPreview value={item.value} />
        case "MEMORY_CARD_THEME":
            return <CardThemePreview value={item.value} name={item.name} />
        case "USERNAME_DECORATION":
            return <DecorationPreview item={item} />
        case "MEMORY_STICKER":
            return <StickerPreview item={item} />
        default:
            return null
    }
}

// ─── Gacha Audio Engine ─────────────────────────────────────────────────────────

const playTone = (ctx: AudioContext, freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
    try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.stop(ctx.currentTime + duration)
    } catch {}
}

const GachaAudio = {
    ctx: null as AudioContext | null,
    init() {
        if (typeof window !== 'undefined' && !this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            if (AudioContextClass) this.ctx = new AudioContextClass()
        }
        if (this.ctx?.state === 'suspended') this.ctx.resume()
    },
    tick() {
        if (!this.ctx || this.ctx.state !== 'running') return
        playTone(this.ctx, 600, 'square', 0.05, 0.015)
        playTone(this.ctx, 800, 'sine', 0.05, 0.015)
    },
    explosion(tier: string) {
        if (!this.ctx || this.ctx.state !== 'running') return
        playTone(this.ctx, 150, 'square', 0.4, 0.05)
        if (tier === 'LEGEND' || tier === 'EPIC') {
            playTone(this.ctx, 400, 'sine', 0.8, 0.1)
        }
    },
    reveal(tier: string) {
        if (!this.ctx || this.ctx.state !== 'running') return
        if (tier === 'LEGEND') {
            playTone(this.ctx, 440, 'triangle', 2, 0.1)
            playTone(this.ctx, 554, 'triangle', 2, 0.1)
            playTone(this.ctx, 659, 'triangle', 2, 0.1)
            setTimeout(() => { if (this.ctx) playTone(this.ctx, 880, 'sine', 2, 0.15) }, 200)
        } else if (tier === 'EPIC') {
            playTone(this.ctx, 523.25, 'sine', 1, 0.08)
            playTone(this.ctx, 659.25, 'sine', 1, 0.08)
            setTimeout(() => { if (this.ctx) playTone(this.ctx, 783.99, 'sine', 1, 0.1) }, 150)
        } else if (tier === 'ELITE') {
            playTone(this.ctx, 659.25, 'sine', 0.6, 0.05)
            setTimeout(() => { if (this.ctx) playTone(this.ctx, 880, 'sine', 0.6, 0.05) }, 100)
        } else {
            playTone(this.ctx, 523.25, 'triangle', 0.5, 0.05)
        }
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
                setDisplayTier(getTier(item.price, item.name))
                setDisplayType(item.type)
                setDisplayName(item.name)
                GachaAudio.tick()
            }, 60)
            return () => clearInterval(interval)
        } else if (finalResult && !hasExploded) {
            setDisplayTier(finalResult.tier)
            setDisplayType(finalResult.item.type)
            setDisplayName(finalResult.item.name)
            setHasExploded(true)
            GachaAudio.explosion(finalResult.tier)
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
    const [boosterLevel, setBoosterLevel] = useState<0 | 1 | 2 | 3>(0)

    const loadData = useCallback(async () => {
        try {
            const res = await fetch("/api/shop")
            if (res.ok) {
                const data = await res.json()
                setPoints(data.points)
                // Filter out PREMIUM_FEATURE and SPECIAL items for gacha pool display
                const poolItems = (data.items as ShopItem[]).filter(i => i.type !== "PREMIUM_FEATURE" && !SPECIAL_ITEM_NAMES.has(i.name))
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
        const config = BOOSTER_CONFIGS[boosterLevel]
        const cost = count === 5 ? config.multi : config.single
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
                body: JSON.stringify({ count, booster: boosterLevel }),
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-x-hidden relative" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* ══════════════════════════════════════════════════════════════
                Cosmic Ambient Glow Orbs (z-0, behind everything)
                ══════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                {/* Top-left indigo orb */}
                <div
                    className="absolute rounded-full"
                    style={{
                        top: "-8%",
                        left: "-5%",
                        width: "420px",
                        height: "420px",
                        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
                        filter: "blur(120px)",
                    }}
                />
                {/* Bottom-right purple orb */}
                <div
                    className="absolute rounded-full"
                    style={{
                        bottom: "-12%",
                        right: "-8%",
                        width: "500px",
                        height: "500px",
                        background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
                        filter: "blur(120px)",
                    }}
                />
                {/* Center amber accent */}
                <div
                    className="absolute rounded-full"
                    style={{
                        top: "40%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "350px",
                        height: "350px",
                        background: "radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)",
                        filter: "blur(120px)",
                    }}
                />
                {/* Top-right emerald accent */}
                <div
                    className="absolute rounded-full"
                    style={{
                        top: "5%",
                        right: "10%",
                        width: "280px",
                        height: "280px",
                        background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
                        filter: "blur(120px)",
                    }}
                />
            </div>

            {/* All content sits above the glow orbs */}
            <div className="relative" style={{ zIndex: 1 }}>

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
                                    {BOOSTER_CONFIGS[boosterLevel].single} poin / buka
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
                            {/* ════════════════════════════════════════════════════════
                                Borderless Carousel Preview — Infinite Void Flow
                                ════════════════════════════════════════════════════════ */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="py-5 sm:py-6 mb-5 sm:mb-6 overflow-hidden relative"
                            >
                                <div className="text-center mb-5 relative z-10">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-600">Preview Hadiah</p>
                                </div>

                                {/* Seamless Carousel with transparent fade edges */}
                                <div className="relative w-full overflow-hidden">
                                    {/* Left fade — transparent edges into the void */}
                                    <div className="absolute inset-y-0 left-0 w-20 sm:w-40 z-10 pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, rgb(10,10,15) 0%, rgba(10,10,15,0.6) 40%, transparent 100%)" }} />
                                    {/* Right fade */}
                                    <div className="absolute inset-y-0 right-0 w-20 sm:w-40 z-10 pointer-events-none"
                                        style={{ background: "linear-gradient(270deg, rgb(10,10,15) 0%, rgba(10,10,15,0.6) 40%, transparent 100%)" }} />

                                    <motion.div
                                        animate={{ x: [0, -(shopItems.length * 140)] }}
                                        transition={{ duration: Math.max(20, shopItems.length * 1.5), ease: "linear", repeat: Infinity }}
                                        className="flex gap-3 items-stretch w-max py-2"
                                    >
                                        {carouselItems.map((item, i) => {
                                            const tier = getTier(item.price, item.name)
                                            const cfg = TIER_CONFIG[tier]
                                            return (
                                                <div
                                                    key={i}
                                                    className="w-28 sm:w-32 rounded-2xl flex flex-col relative overflow-hidden shrink-0 transition-all duration-300 hover:scale-[1.04]"
                                                    style={{
                                                        background: "rgba(255,255,255,0.025)",
                                                        border: "1px solid rgba(255,255,255,0.06)",
                                                        backdropFilter: "blur(8px)",
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

                            {/* ════════════════════════════════════════════════════════
                                KONSOL PANEL — Unified Glass Control Panel
                                Boosters + Action Buttons merged into one panel
                                ════════════════════════════════════════════════════════ */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="rounded-3xl p-4 sm:p-5 relative overflow-hidden"
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    backdropFilter: "blur(40px)",
                                    WebkitBackdropFilter: "blur(40px)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                                }}
                            >
                                {/* Subtle top accent line */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-px"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(99,102,241,0.3), transparent)" }}
                                />

                                {/* Internal ambient glow */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                                    <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[120%] rounded-full mix-blend-screen"
                                        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)" }} />
                                    <div className="absolute bottom-[-50%] right-[-20%] w-[60%] h-[120%] rounded-full mix-blend-screen"
                                        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.03), transparent 70%)" }} />
                                </div>

                                {/* Section: Booster Relic Slots */}
                                <div className="relative z-10 mb-4 sm:mb-5">
                                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-neutral-600 mb-3 flex items-center gap-1.5">
                                        <Settings className="w-3 h-3" /> Pilih Booster
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {([1, 2, 3] as const).map(lvl => {
                                            const active = boosterLevel === lvl
                                            const bcfg = BOOSTER_CONFIGS[lvl]
                                            const relic = BOOSTER_RELIC_STYLES[lvl]
                                            return (
                                                <button
                                                    key={lvl}
                                                    onClick={() => { GachaAudio.init(); setBoosterLevel(prev => prev === lvl ? 0 : lvl as any); }}
                                                    className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-300"
                                                    style={{
                                                        background: active
                                                            ? relic.bgActive
                                                            : "rgba(255,255,255,0.025)",
                                                        border: active
                                                            ? `1.5px solid ${relic.borderColor}`
                                                            : "1px solid rgba(255,255,255,0.06)",
                                                        boxShadow: active
                                                            ? `0 0 20px ${relic.glowColor}, inset 0 0 16px ${relic.glowColor}`
                                                            : "none",
                                                        color: active ? "#fff" : "#6b7280",
                                                    }}
                                                >
                                                    {/* Active glow ring pulse */}
                                                    {active && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none"
                                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                            style={{
                                                                border: `1px solid ${relic.borderColor}`,
                                                                boxShadow: `0 0 12px ${relic.glowColor}`,
                                                            }}
                                                        />
                                                    )}
                                                    {(() => {
                                                        const IconComp = BOOSTER_ICONS[lvl]
                                                        const iconColor = BOOSTER_ICON_COLORS[lvl]
                                                        return <IconComp className="relative z-10 w-5 h-5 sm:w-6 sm:h-6" style={{ color: active ? iconColor.active : iconColor.inactive }} />
                                                    })()}
                                                    <span className="relative z-10 text-[10px] sm:text-[11px] font-black tracking-tight mt-0.5">{bcfg.name}</span>
                                                    <span className="relative z-10 text-[8px] sm:text-[9px] font-bold text-neutral-500">
                                                        Legend {bcfg.rates.LEGEND}%
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative z-10 h-px w-full mb-4 sm:mb-5"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
                                />

                                {/* Section: Action Buttons */}
                                <div className="relative z-10 grid grid-cols-5 gap-3 sm:gap-4">
                                    {/* Single pull — smaller, 2 cols */}
                                    <button
                                        onClick={() => { GachaAudio.init(); openBox(1); }}
                                        disabled={points < BOOSTER_CONFIGS[boosterLevel].single}
                                        className="col-span-2 relative flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))" }} />
                                        <span className="relative text-xs sm:text-sm font-bold text-neutral-400 group-hover:text-neutral-200 transition-colors">Buka 1x</span>
                                        <span className="relative flex items-center gap-1 text-amber-400 text-xs font-bold">
                                            <Star className="w-3 h-3 fill-amber-400" />
                                            {BOOSTER_CONFIGS[boosterLevel].single} poin
                                        </span>
                                    </button>

                                    {/* Multi pull — DOMINANT, 3 cols, animated gradient */}
                                    <div className="col-span-3 relative">
                                        {/* Floating discount badge */}
                                        <motion.div
                                            className="absolute -top-3 left-1/2 z-20 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
                                            style={{
                                                transform: "translateX(-50%)",
                                                background: "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.15))",
                                                color: "#4ade80",
                                                border: "1px solid rgba(74,222,128,0.3)",
                                                boxShadow: "0 4px 12px rgba(74,222,128,0.15)",
                                            }}
                                            animate={{ y: [0, -3, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            ✦ Hemat {BOOSTER_CONFIGS[boosterLevel].single * 5 - BOOSTER_CONFIGS[boosterLevel].multi} Poin
                                        </motion.div>

                                        <button
                                            onClick={() => { GachaAudio.init(); openBox(5); }}
                                            disabled={points < BOOSTER_CONFIGS[boosterLevel].multi}
                                            className="gacha-btn-5x w-full relative flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden"
                                            style={{
                                                border: "1px solid rgba(99,102,241,0.3)",
                                                boxShadow: "0 0 20px rgba(99,102,241,0.1), 0 4px 24px rgba(0,0,0,0.3)",
                                            }}
                                        >
                                            {/* Animated gradient background */}
                                            <div className="gacha-bg-pan absolute inset-0 rounded-2xl" />
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                style={{ background: "rgba(255,255,255,0.06)" }} />

                                            <span className="relative z-10 text-sm sm:text-base font-black text-white">Buka 5x</span>
                                            <span className="relative z-10 flex items-center gap-1 text-amber-300 text-xs font-bold">
                                                <Star className="w-3 h-3 fill-amber-300" />
                                                {BOOSTER_CONFIGS[boosterLevel].multi} poin
                                                <span className="text-neutral-500 line-through ml-1 font-normal opacity-70">{BOOSTER_CONFIGS[boosterLevel].single * 5}</span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
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
                            className="fixed inset-0 z-[999] overflow-y-auto"
                            style={{ background: "rgba(3,3,10,0.95)", backdropFilter: "blur(20px)" }}
                        >
                            <div className="flex flex-col items-center min-h-screen w-full px-4 sm:px-8 pt-28 pb-12 md:py-20">
                                <div className="m-auto w-full flex flex-col items-center">
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
                                                onAnimationStart={() => GachaAudio.reveal(res.tier)}
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
                                        {(["LEGEND", "EPIC", "ELITE", "BASIC"] as const).map(tier => {
                                            const cfg = TIER_CONFIG[tier as TierName]
                                            const rate = BOOSTER_CONFIGS[boosterLevel].rates[tier]
                                            return (
                                                <div key={tier} className="flex items-center gap-3">
                                                    <TierBadge tier={tier} size="md" />
                                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${rate}%`,
                                                                background: cfg.gradient,
                                                                boxShadow: `0 0 6px ${cfg.glow}`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: cfg.color }}>
                                                        {rate}%
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div
                                        className="mt-5 px-4 py-3 rounded-xl text-[11px] text-neutral-500 leading-relaxed text-center"
                                        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
                                    >
                                        Harga buka gacha: <strong className="text-amber-400/80">{BOOSTER_CONFIGS[boosterLevel].single} poin</strong> per gacha.<br/>
                                        5x buka gacha mendapat diskon menjadi <strong className="text-amber-400/80">{BOOSTER_CONFIGS[boosterLevel].multi} poin</strong>.<br/>
                                        Item duplikat mendapat refund <strong className="text-green-400/80">5 poin</strong>.
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}