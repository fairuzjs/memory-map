"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Star, Package, ShoppingBag,
    ChevronRight, Repeat2,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    Sparkles, Gem, Flame, Zap, Settings
} from "lucide-react"
import { motion, AnimatePresence, useMotionValue, animate as motionAnimate } from "framer-motion"
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

function getBannerClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("galaxy")) return "anim-banner-galaxy"
    if (n.includes("hutan")) return "anim-banner-matrix"
    if (n.includes("samudra")) return "anim-banner-samudra"
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

function BannerPreview({ value, name }: { value: string; name?: string }) {
    const bannerClass = getBannerClass(name)
    const n = name?.toLowerCase() ?? ""
    const isHutan   = n.includes("hutan")
    const isGalaxy  = n.includes("galax")
    const isSamudra = n.includes("samudra")
    const bg = isHutan
        ? "linear-gradient(135deg, #001a0a 0%, #003320 35%, #005233 65%, #007a4d 100%)"
        : value
    return (
        <div
            className={`w-full h-full rounded-lg overflow-hidden relative ${bannerClass}`}
            style={{ background: bg }}
        >
            <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
            {isGalaxy && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="480" cy="55" rx="180" ry="55" fill="rgba(180,100,255,0.18)" className="nebula-drift" style={{ filter: "blur(20px)" }} />
                    <ellipse cx="160" cy="95" rx="140" ry="40" fill="rgba(80,120,255,0.15)" className="nebula-drift" style={{ animationDelay: "-6s", filter: "blur(18px)" }} />
                    <ellipse cx="670" cy="110" rx="120" ry="35" fill="rgba(150,60,255,0.12)" className="nebula-drift" style={{ animationDelay: "-10s", filter: "blur(16px)" }} />
                    <circle cx="30"  cy="12" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "2.1s" } as any} />
                    <circle cx="95"  cy="25" r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "1.7s" } as any} />
                    <circle cx="160" cy="8"  r="1.6" fill="white" className="star-twinkle" style={{ "--dur": "2.8s" } as any} />
                    <circle cx="260" cy="18" r="1.4" fill="white" className="star-twinkle" style={{ "--dur": "2.4s" } as any} />
                    <circle cx="410" cy="10" r="1.7" fill="white" className="star-twinkle" style={{ "--dur": "3.0s" } as any} />
                    <circle cx="530" cy="15" r="1.5" fill="white" className="star-twinkle" style={{ "--dur": "1.6s" } as any} />
                    <circle cx="650" cy="20" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "1.4s" } as any} />
                    <circle cx="710" cy="9"  r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.9s" } as any} />
                    <circle cx="55"  cy="80" r="1.0" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "2.5s" } as any} />
                    <circle cx="500" cy="115" r="1.5" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.7s" } as any} />
                    <circle cx="785" cy="120" r="1.3" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.3s" } as any} />
                </svg>
            )}
            {isSamudra && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><filter id="blur-aurora-gacha"><feGaussianBlur stdDeviation="8" /></filter></defs>
                    <rect x="-20" y="15" width="840" height="32" rx="16" fill="rgba(120,60,255,0.28)" className="aurora-wave" filter="url(#blur-aurora-gacha)"
                        style={{ "--dur": "7s", "--op0": "0.25", "--op1": "0.55" } as any} />
                    <rect x="-20" y="52" width="840" height="22" rx="11" fill="rgba(60,180,255,0.22)" className="aurora-wave" filter="url(#blur-aurora-gacha)"
                        style={{ "--dur": "5.5s", "--op0": "0.2", "--op1": "0.5", animationDelay: "-2s" } as any} />
                    <rect x="-20" y="80" width="840" height="24" rx="12" fill="rgba(200,50,255,0.18)" className="aurora-wave" filter="url(#blur-aurora-gacha)"
                        style={{ "--dur": "9s", "--op0": "0.15", "--op1": "0.4", animationDelay: "-4s" } as any} />
                    {[[20,10,1.8,"#fff","2.0s"],[145,18,2.0,"#fff","2.6s"],[260,22,1.7,"#fff","1.2s"],[380,7,2.1,"#fff","0.9s"],[500,10,1.6,"#fff","2.1s"],[620,6,1.8,"#fff","2.8s"],[740,8,1.7,"#fff","1.9s"],[130,105,1.5,"#ffccee","0.8s"],[310,110,1.8,"#ccddff","1.3s"],[490,115,1.2,"#aaddff","1.0s"],[670,108,1.3,"#ffccee","1.8s"],[350,65,1.2,"#ddbbff","1.6s"],[600,55,1.5,"#fff","2.4s"]].map(([cx,cy,r,fill,dur],i) => (
                        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} className="star-shimmer" style={{ "--dur": dur } as any} />
                    ))}
                </svg>
            )}
            {isHutan && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                    <rect x="18" y="0" width="15" rx="2" fill="#00cc55" opacity="0.75" className="eq-bar eq-bar-1" />
                    <rect x="42" y="0" width="15" rx="2" fill="#00cc55" opacity="0.65" className="eq-bar eq-bar-2" />
                    <rect x="66" y="0" width="15" rx="2" fill="#00bb44" opacity="0.85" className="eq-bar eq-bar-3" />
                    <rect x="90" y="0" width="15" rx="2" fill="#00cc55" opacity="0.70" className="eq-bar eq-bar-4" />
                    <rect x="114" y="0" width="15" rx="2" fill="#00bb44" opacity="0.60" className="eq-bar eq-bar-5" />
                    <rect x="138" y="0" width="15" rx="2" fill="#00aa33" opacity="0.55" className="eq-bar eq-bar-6" />
                </svg>
            )}
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
            return <BannerPreview value={item.value} name={item.name} />
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

// ─── CS:GO Case Opening Reel System ────────────────────────────────────────────

const REEL_TOTAL_ITEMS = 55
const REEL_RESULT_INDEX = 42

// Responsive reel dimensions
function useReelDimensions() {
    const [dims, setDims] = useState({ w: 100, h: 120, gap: 8 })
    useEffect(() => {
        const update = () => {
            if (window.innerWidth >= 640) {
                setDims({ w: 140, h: 165, gap: 10 })
            } else {
                setDims({ w: 100, h: 120, gap: 8 })
            }
        }
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])
    return { itemWidth: dims.w, itemHeight: dims.h, itemGap: dims.gap, itemStride: dims.w + dims.gap }
}

type ReelItem = {
    shopItem: ShopItem
    tier: TierName
    isResult: boolean
}

function generateReel(result: GachaResult, poolItems: ShopItem[]): ReelItem[] {
    const reel: ReelItem[] = []

    const getRandomItem = (): ReelItem => {
        const item = poolItems[Math.floor(Math.random() * poolItems.length)]
        return { shopItem: item, tier: getTier(item.price, item.name), isResult: false }
    }

    const getHighTierTease = (): ReelItem => {
        const highItems = poolItems.filter(i => {
            const t = getTier(i.price, i.name)
            return t === "LEGEND" || t === "EPIC"
        })
        if (highItems.length === 0) return getRandomItem()
        const item = highItems[Math.floor(Math.random() * highItems.length)]
        return { shopItem: item, tier: getTier(item.price, item.name), isResult: false }
    }

    const resultShopItem: ShopItem = {
        id: result.item.id,
        name: result.item.name,
        description: result.item.description,
        price: result.item.price,
        type: result.item.type,
        value: result.item.value,
        previewColor: result.item.previewColor,
        owned: false,
        equipped: false,
    }

    for (let i = 0; i < REEL_TOTAL_ITEMS; i++) {
        if (i === REEL_RESULT_INDEX) {
            reel.push({ shopItem: resultShopItem, tier: result.tier, isResult: true })
        } else if (i === REEL_RESULT_INDEX - 1 || i === REEL_RESULT_INDEX + 1) {
            // Near-miss tease: adjacent high-tier items
            reel.push(getHighTierTease())
        } else if (i === REEL_RESULT_INDEX - 5 || i === REEL_RESULT_INDEX - 9 || i === REEL_RESULT_INDEX - 15) {
            // Scattered teases earlier in the reel for excitement
            reel.push(getHighTierTease())
        } else {
            reel.push(getRandomItem())
        }
    }

    return reel
}

function CaseOpeningReel({
    result,
    poolItems,
    onComplete,
}: {
    result: GachaResult
    poolItems: ShopItem[]
    onComplete: () => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const [hasFinished, setHasFinished] = useState(false)
    const lastTickIndex = useRef(-1)
    const animRef = useRef<ReturnType<typeof motionAnimate> | null>(null)
    const completedRef = useRef(false)
    const { itemWidth, itemHeight, itemGap, itemStride } = useReelDimensions()

    const reel = useMemo(() => generateReel(result, poolItems), [result, poolItems])

    // Calculate exact stop position so result item lands at center
    const getStopPosition = useCallback(() => {
        const containerWidth = containerRef.current?.offsetWidth || 550
        // Add slight random offset for realism (±30% of item width)
        const randomOffset = (Math.random() - 0.5) * itemWidth * 0.3
        return -(REEL_RESULT_INDEX * itemStride) + (containerWidth / 2) - (itemWidth / 2) + randomOffset
    }, [itemWidth, itemStride])

    // Tick sound when items cross center indicator
    useEffect(() => {
        const containerWidth = containerRef.current?.offsetWidth || 550
        const centerOffset = containerWidth / 2
        const unsubscribe = x.on("change", (latest) => {
            const currentIndex = Math.floor((-latest + centerOffset) / itemStride)
            if (currentIndex !== lastTickIndex.current && currentIndex >= 0 && currentIndex < REEL_TOTAL_ITEMS) {
                lastTickIndex.current = currentIndex
                GachaAudio.tick()
            }
        })
        return unsubscribe
    }, [x, itemStride])

    // Start animation on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            const stopX = getStopPosition()
            const overshootX = stopX - 22 // overshoot past target

            // Phase 1: Fast scroll with easeOutExpo deceleration
            animRef.current = motionAnimate(x, overshootX, {
                duration: 4.5,
                ease: [0.05, 0.7, 0.1, 1],
                onComplete: () => {
                    // Phase 2: Bounce back to exact target
                    animRef.current = motionAnimate(x, stopX, {
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        onComplete: () => {
                            if (completedRef.current) return
                            completedRef.current = true
                            setHasFinished(true)
                            GachaAudio.explosion(result.tier)
                            setTimeout(onComplete, 1200)
                        }
                    })
                }
            })
        }, 400)

        return () => {
            clearTimeout(timer)
            if (animRef.current) animRef.current.stop()
        }
    }, [itemStride])

    // Skip/instant finish
    const skipToEnd = useCallback(() => {
        if (completedRef.current) return
        completedRef.current = true
        if (animRef.current) animRef.current.stop()
        const containerWidth = containerRef.current?.offsetWidth || 550
        const stopX = -(REEL_RESULT_INDEX * itemStride) + (containerWidth / 2) - (itemWidth / 2)
        x.set(stopX)
        setHasFinished(true)
        GachaAudio.explosion(result.tier)
        onComplete()
    }, [x, result.tier, onComplete, itemWidth, itemStride])

    const resultCfg = TIER_CONFIG[result.tier]

    return (
        <div className="w-full">
            {/* Reel Container */}
            <div className="relative" ref={containerRef}>
                {/* Center Indicator */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none" style={{ width: 2 }}>
                    {/* Top triangle */}
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: hasFinished ? `12px solid ${resultCfg.color}` : "12px solid #6366f1",
                        filter: hasFinished ? `drop-shadow(0 0 8px ${resultCfg.glow})` : "drop-shadow(0 0 4px rgba(99,102,241,0.6))",
                        transition: "all 0.4s",
                    }} />
                    {/* Vertical line */}
                    <div className="flex-1" style={{
                        width: 2,
                        background: hasFinished ? resultCfg.color : "#6366f1",
                        boxShadow: hasFinished
                            ? `0 0 12px ${resultCfg.glow}, 0 0 24px ${resultCfg.glow}`
                            : "0 0 8px rgba(99,102,241,0.5)",
                        transition: "all 0.4s",
                    }} />
                    {/* Bottom triangle */}
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderBottom: hasFinished ? `12px solid ${resultCfg.color}` : "12px solid #6366f1",
                        filter: hasFinished ? `drop-shadow(0 0 8px ${resultCfg.glow})` : "drop-shadow(0 0 4px rgba(99,102,241,0.6))",
                        transition: "all 0.4s",
                    }} />
                </div>

                {/* Edge fade gradients */}
                <div className="absolute inset-y-0 left-0 w-16 sm:w-24 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, rgb(10,10,15), transparent)" }} />
                <div className="absolute inset-y-0 right-0 w-16 sm:w-24 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(270deg, rgb(10,10,15), transparent)" }} />

                {/* Reel track */}
                <div
                    className="overflow-hidden rounded-2xl"
                    style={{
                        height: itemHeight + 24,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "inset 0 2px 12px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)",
                    }}
                >
                    <motion.div
                        className="flex items-center h-full"
                        style={{ x, gap: itemGap, paddingLeft: 12, paddingRight: 12 }}
                    >
                        {reel.map((reelItem, i) => {
                            const itemCfg = TIER_CONFIG[reelItem.tier]
                            const isHighTier = reelItem.tier === "LEGEND" || reelItem.tier === "EPIC"
                            const isWinner = reelItem.isResult && hasFinished
                            return (
                                <motion.div
                                    key={i}
                                    className="shrink-0 rounded-xl flex flex-col overflow-hidden relative"
                                    style={{
                                        width: itemWidth,
                                        height: itemHeight,
                                        background: isHighTier
                                            ? `linear-gradient(160deg, ${itemCfg.bg}, rgba(14,14,24,0.98))`
                                            : "rgba(255,255,255,0.03)",
                                        border: isWinner
                                            ? `2px solid ${itemCfg.color}`
                                            : `1px solid ${isHighTier ? itemCfg.border : "rgba(255,255,255,0.07)"}`,
                                        boxShadow: isWinner
                                            ? `0 0 24px ${itemCfg.glow}, 0 0 48px ${itemCfg.glow}`
                                            : isHighTier ? `0 0 8px ${itemCfg.glow}` : "none",
                                        transition: "border 0.4s, box-shadow 0.6s",
                                    }}
                                    animate={isWinner ? {
                                        scale: [1, 1.1, 1.06],
                                    } : {}}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                    {/* Top accent */}
                                    <div className="absolute top-0 left-0 right-0"
                                        style={{
                                            height: isHighTier ? "2px" : "1.5px",
                                            background: itemCfg.gradient,
                                            boxShadow: isHighTier ? `0 0 6px ${itemCfg.glow}` : "none",
                                        }}
                                    />

                                    {/* Winner glow overlay */}
                                    {isWinner && (
                                        <motion.div
                                            className="absolute inset-0 rounded-xl pointer-events-none z-20"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.3, 0.15] }}
                                            transition={{ duration: 0.8 }}
                                            style={{
                                                background: `radial-gradient(ellipse at 50% 50%, ${itemCfg.glow}, transparent 70%)`,
                                            }}
                                        />
                                    )}

                                    {/* Item preview */}
                                    <div className="flex-1 flex items-center justify-center p-1.5 min-h-0 relative z-10">
                                        <ItemPreview item={reelItem.shopItem} />
                                    </div>

                                    {/* Name + tier badge */}
                                    <div className="px-1.5 pb-1.5 sm:pb-2 flex flex-col items-center gap-0.5 relative z-10">
                                        <span
                                            className="text-[8px] sm:text-[10px] font-bold text-center line-clamp-1 w-full"
                                            style={{ color: isHighTier ? itemCfg.color : "#6b7280" }}
                                        >
                                            {reelItem.shopItem.name}
                                        </span>
                                        <TierBadge tier={reelItem.tier} size="sm" />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </div>

            {/* Skip button */}
            {!hasFinished && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="flex justify-center mt-4"
                >
                    <button
                        onClick={skipToEnd}
                        className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#6b7280",
                        }}
                    >
                        Skip
                    </button>
                </motion.div>
            )}

            {/* Winner reveal text */}
            <AnimatePresence>
                {hasFinished && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="text-center mt-4"
                    >
                        <p className="text-xs font-black uppercase tracking-wider" style={{ color: resultCfg.color }}>
                            {result.item.name}
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                            <TierBadge tier={result.tier} size="md" />
                            {result.isDuplicate && (
                                <span className="text-[9px] font-bold text-amber-400 px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                                    Duplikat +{result.refundAmount}
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function MiniCollectedCard({ result }: { result: GachaResult }) {
    const cfg = TIER_CONFIG[result.tier]
    const previewItem: ShopItem = {
        id: result.item.id,
        name: result.item.name,
        description: result.item.description,
        price: result.item.price,
        type: result.item.type,
        value: result.item.value,
        previewColor: result.item.previewColor,
        owned: false,
        equipped: false,
    }
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-16 h-20 rounded-lg relative overflow-hidden flex flex-col shrink-0"
            style={{
                background: `linear-gradient(160deg, ${cfg.bg}, rgba(14,14,24,0.98))`,
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 0 12px ${cfg.glow}`,
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cfg.gradient }} />
            <div className="flex-1 flex items-center justify-center p-1 min-h-0">
                <ItemPreview item={previewItem} />
            </div>
            <span className="text-[7px] font-bold text-center px-1 pb-1 line-clamp-1 w-full"
                style={{ color: cfg.color }}>{result.item.name}</span>
        </motion.div>
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
    const [currentReelIndex, setCurrentReelIndex] = useState(0)
    const [collectedResults, setCollectedResults] = useState<GachaResult[]>([])
    const [resultMeta, setResultMeta] = useState<{ totalCost: number; totalRefund: number; newPoints: number } | null>(null)
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
        setCurrentReelIndex(0)
        setCollectedResults([])
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
            // Reel animation handles the rest — no setTimeout needed

        } catch (error) {
            toast.error("Terjadi kesalahan sistem")
            setPhase("idle")
        }
    }

    const closeResults = () => {
        setPhase("idle")
        setResults([])
        setCollectedResults([])
        setCurrentReelIndex(0)
        setResultMeta(null)
    }

    const handleReelComplete = useCallback((index: number) => {
        const res = results[index]
        if (!res) return

        setCollectedResults(prev => [...prev, res])

        if (index + 1 < results.length) {
            // Brief pause to admire result, then next reel
            setTimeout(() => {
                setCurrentReelIndex(index + 1)
            }, 1000)
        } else {
            // All reels done → reveal phase
            setTimeout(() => {
                setPhase("reveal")
                if (resultMeta) setPoints(resultMeta.newPoints)
            }, 1500)
        }
    }, [results, resultMeta])

    const handleSkipAnimation = useCallback(() => {
        setCollectedResults([...results])
        setPhase("reveal")
        if (resultMeta) setPoints(resultMeta.newPoints)
    }, [results, resultMeta])

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
                        background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
                        filter: "blur(100px)",
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
                        background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
                        filter: "blur(100px)",
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
                        background: "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)",
                        filter: "blur(100px)",
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
                        background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)",
                        filter: "blur(100px)",
                    }}
                />

                {/* ── Floating star particles ── */}
                {[
                    { x: "12%",  y: "18%", s: 1.5, d: 6,   delay: 0    },
                    { x: "87%",  y: "12%", s: 2,   d: 8,   delay: 1.2  },
                    { x: "35%",  y: "72%", s: 1,   d: 10,  delay: 0.7  },
                    { x: "65%",  y: "55%", s: 2.5, d: 7,   delay: 2    },
                    { x: "20%",  y: "45%", s: 1.5, d: 9,   delay: 0.3  },
                    { x: "78%",  y: "80%", s: 1,   d: 11,  delay: 1.6  },
                    { x: "50%",  y: "25%", s: 2,   d: 5,   delay: 0.9  },
                    { x: "90%",  y: "42%", s: 1.5, d: 8,   delay: 1.4  },
                    { x: "8%",   y: "62%", s: 1,   d: 12,  delay: 0.5  },
                    { x: "58%",  y: "88%", s: 2,   d: 7,   delay: 2.3  },
                    { x: "42%",  y: "10%", s: 1,   d: 9,   delay: 1.8  },
                    { x: "25%",  y: "92%", s: 1.5, d: 6,   delay: 0.2  },
                ].map(({ x, y, s, d, delay }, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full pointer-events-none"
                        animate={{
                            y: [0, -12, 0],
                            opacity: [0.15, 0.5, 0.15],
                        }}
                        transition={{
                            duration: d,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay,
                        }}
                        style={{
                            left: x,
                            top: y,
                            width: s * 2,
                            height: s * 2,
                            background: i % 3 === 0
                                ? "rgba(139,92,246,0.6)"
                                : i % 3 === 1
                                ? "rgba(99,102,241,0.5)"
                                : "rgba(251,191,36,0.4)",
                            boxShadow: `0 0 ${s * 3}px currentColor`,
                        }}
                    />
                ))}
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
                                    {/* Animated icon with glow ring */}
                                    <div className="relative shrink-0">
                                        <motion.div
                                            className="absolute inset-0 rounded-xl sm:rounded-2xl"
                                            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            style={{ background: "rgba(139,92,246,0.2)", filter: "blur(8px)" }}
                                        />
                                        <div
                                            className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center"
                                            style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
                                        >
                                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                                        </div>
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
                                        <p className="text-[13px] mt-1 font-medium" style={{ color: "#6b7280" }}>
                                            Uji keberuntunganmu dan dapatkan item langka
                                        </p>
                                    </div>
                                </div>

                                {/* Desktop Shop Button */}
                                <Link
                                    href="/shop"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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

                            {/* Stat pills */}
                            <div className="flex items-center gap-3 mt-4 flex-wrap">
                                <motion.span
                                    animate={{ boxShadow: ["0 0 0px rgba(251,191,36,0)", "0 0 10px rgba(251,191,36,0.2)", "0 0 0px rgba(251,191,36,0)"] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
                                    style={{
                                        background: "rgba(251,191,36,0.1)",
                                        border: "1px solid rgba(251,191,36,0.25)",
                                        color: "#fbbf24",
                                    }}
                                >
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {formatPoints(points)} poin
                                </motion.span>
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
                                HERO — Mystery Box Center Stage
                                ════════════════════════════════════════════════════════ */}
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col items-center justify-center pt-2 pb-8 sm:pb-10 relative"
                            >
                                {/* Dynamic glow behind the box — reacts to booster */}
                                {(() => {
                                    const glowColors: Record<number, string> = {
                                        0: "rgba(99,102,241,0.18)",
                                        1: "rgba(99,102,241,0.28)",
                                        2: "rgba(52,211,153,0.28)",
                                        3: "rgba(232,121,249,0.32)",
                                    }
                                    return (
                                        <motion.div
                                            className="absolute rounded-full pointer-events-none"
                                            animate={{
                                                scale: [1, 1.15, 1],
                                                opacity: [0.6, 1, 0.6],
                                            }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            style={{
                                                width: 280,
                                                height: 280,
                                                background: `radial-gradient(circle, ${glowColors[boosterLevel]} 0%, transparent 70%)`,
                                                filter: "blur(24px)",
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                            }}
                                        />
                                    )
                                })()}

                                {/* Orbital ring */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                    className="absolute pointer-events-none"
                                    style={{
                                        width: 200,
                                        height: 200,
                                        borderRadius: "50%",
                                        border: "1px dashed rgba(139,92,246,0.2)",
                                    }}
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                                    className="absolute pointer-events-none"
                                    style={{
                                        width: 155,
                                        height: 155,
                                        borderRadius: "50%",
                                        border: "1px dashed rgba(99,102,241,0.15)",
                                    }}
                                />

                                {/* Particle dots */}
                                {[
                                    { angle: 0,   r: 100, size: 3, delay: 0 },
                                    { angle: 72,  r: 100, size: 2, delay: 0.4 },
                                    { angle: 144, r: 100, size: 4, delay: 0.8 },
                                    { angle: 216, r: 100, size: 2, delay: 1.2 },
                                    { angle: 288, r: 100, size: 3, delay: 1.6 },
                                ].map(({ angle, r, size, delay }, idx) => {
                                    const rad = (angle * Math.PI) / 180
                                    const x = Math.cos(rad) * r
                                    const y = Math.sin(rad) * r
                                    const particleColors: Record<number, string> = {
                                        0: "#818cf8",
                                        1: "#818cf8",
                                        2: "#34d399",
                                        3: "#e879f9",
                                    }
                                    return (
                                        <motion.div
                                            key={idx}
                                            className="absolute rounded-full pointer-events-none"
                                            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay }}
                                            style={{
                                                width: size,
                                                height: size,
                                                background: particleColors[boosterLevel],
                                                boxShadow: `0 0 6px ${particleColors[boosterLevel]}`,
                                                left: `calc(50% + ${x}px)`,
                                                top: `calc(50% + ${y}px)`,
                                                transform: "translate(-50%, -50%)",
                                            }}
                                        />
                                    )
                                })}

                                {/* The Mystery Box itself */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10"
                                    style={{ perspective: "600px" }}
                                >
                                    <motion.div
                                        animate={{ rotateY: [0, 8, 0, -8, 0] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        {/* Box face */}
                                        {(() => {
                                            const boxColors: Record<number, { border: string; topAccent: string; innerGlow: string; star: string }> = {
                                                0: { border: "rgba(99,102,241,0.35)", topAccent: "linear-gradient(135deg,#818cf8,#6366f1)", innerGlow: "rgba(99,102,241,0.08)", star: "#818cf8" },
                                                1: { border: "rgba(99,102,241,0.5)",  topAccent: "linear-gradient(135deg,#818cf8,#6366f1,#a5b4fc)", innerGlow: "rgba(99,102,241,0.12)", star: "#a5b4fc" },
                                                2: { border: "rgba(52,211,153,0.5)",  topAccent: "linear-gradient(135deg,#34d399,#10b981,#6ee7b7)", innerGlow: "rgba(52,211,153,0.12)", star: "#34d399" },
                                                3: { border: "rgba(232,121,249,0.5)", topAccent: "linear-gradient(135deg,#e879f9,#a855f7,#f0abfc)", innerGlow: "rgba(232,121,249,0.12)", star: "#e879f9" },
                                            }
                                            const bc = boxColors[boosterLevel]
                                            return (
                                                <div
                                                    className="relative flex items-center justify-center"
                                                    style={{
                                                        width: 120,
                                                        height: 120,
                                                        borderRadius: "24px",
                                                        background: `linear-gradient(160deg, rgba(20,20,32,0.98), rgba(10,10,18,0.99))`,
                                                        border: `1.5px solid ${bc.border}`,
                                                        boxShadow: `0 0 40px -8px ${bc.border}, 0 20px 60px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)`,
                                                        transition: "border-color 0.5s, box-shadow 0.5s",
                                                    }}
                                                >
                                                    {/* Top accent bar */}
                                                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[24px]" style={{ background: bc.topAccent }} />

                                                    {/* Inner bg glow */}
                                                    <div className="absolute inset-0 rounded-[24px]" style={{ background: `radial-gradient(circle at 50% 30%, ${bc.innerGlow}, transparent 65%)` }} />

                                                    {/* Question mark / star icon */}
                                                    <motion.div
                                                        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                        className="relative z-10 flex flex-col items-center gap-1"
                                                    >
                                                        <Sparkles
                                                            className="w-10 h-10"
                                                            style={{
                                                                color: bc.star,
                                                                filter: `drop-shadow(0 0 8px ${bc.star})`,
                                                                transition: "color 0.5s, filter 0.5s",
                                                            }}
                                                        />
                                                    </motion.div>

                                                    {/* Corner sparkles */}
                                                    {[
                                                        { top: 10, left: 10 },
                                                        { top: 10, right: 10 },
                                                        { bottom: 10, left: 10 },
                                                        { bottom: 10, right: 10 },
                                                    ].map((pos, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            className="absolute w-1 h-1 rounded-full"
                                                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                                                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                                                            style={{ ...pos, background: bc.star, boxShadow: `0 0 4px ${bc.star}` }}
                                                        />
                                                    ))}
                                                </div>
                                            )
                                        })()}
                                    </motion.div>
                                </motion.div>

                                {/* Box shadow on floor */}
                                <motion.div
                                    animate={{ scaleX: [1, 0.8, 1], opacity: [0.25, 0.15, 0.25] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="mt-3 rounded-full pointer-events-none"
                                    style={{
                                        width: 90,
                                        height: 10,
                                        background: "radial-gradient(ellipse, rgba(99,102,241,0.4) 0%, transparent 70%)",
                                        filter: "blur(6px)",
                                    }}
                                />

                                {/* CTA label */}
                                <motion.p
                                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600"
                                >
                                    Buka untuk dapatkan hadiah
                                </motion.p>
                            </motion.div>

                            {/* ════════════════════════════════════════════════════════
                                Borderless Carousel Preview — Infinite Void Flow
                                ════════════════════════════════════════════════════════ */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="py-6 sm:py-8 mb-6 sm:mb-8 overflow-hidden relative"
                            >
                                <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
                                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-neutral-700" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Preview Hadiah Utama</p>
                                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-neutral-700" />
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
                                        animate={{ x: [0, -(shopItems.length * 164)] }}
                                        transition={{ duration: Math.max(24, shopItems.length * 1.8), ease: "linear", repeat: Infinity }}
                                        className="flex gap-4 items-stretch w-max py-3"
                                    >
                                        {carouselItems.map((item, i) => {
                                            const tier = getTier(item.price, item.name)
                                            const cfg = TIER_CONFIG[tier]
                                            const isHighTier = tier === "LEGEND" || tier === "EPIC"
                                            return (
                                                <div
                                                    key={i}
                                                    className="w-36 sm:w-40 rounded-2xl flex flex-col relative overflow-hidden shrink-0 transition-all duration-300 hover:scale-[1.05] hover:-translate-y-1"
                                                    style={{
                                                        background: isHighTier
                                                            ? `linear-gradient(160deg, ${cfg.bg}, rgba(10,10,16,0.95))`
                                                            : "rgba(255,255,255,0.025)",
                                                        border: `1px solid ${isHighTier ? cfg.border : "rgba(255,255,255,0.07)"}`,
                                                        backdropFilter: "blur(8px)",
                                                        boxShadow: isHighTier ? `0 4px 24px -6px ${cfg.glow}` : "none",
                                                    }}
                                                >
                                                    {/* Top gradient accent — thicker for high tiers */}
                                                    <div
                                                        className="absolute top-0 left-0 right-0 z-10"
                                                        style={{
                                                            height: isHighTier ? "2px" : "1.5px",
                                                            background: cfg.gradient,
                                                            boxShadow: isHighTier ? `0 0 8px ${cfg.glow}` : "none",
                                                        }}
                                                    />
                                                    {/* Ambient inner glow for high tiers */}
                                                    {isHighTier && (
                                                        <div
                                                            className="absolute inset-0 pointer-events-none"
                                                            style={{
                                                                background: `radial-gradient(ellipse at 50% 0%, ${cfg.bg} 0%, transparent 70%)`,
                                                            }}
                                                        />
                                                    )}
                                                    {/* Item preview */}
                                                    <div className="h-28 sm:h-32 flex items-center justify-center p-3 relative z-10">
                                                        <ItemPreview item={item} />
                                                    </div>
                                                    {/* Name + tier badge */}
                                                    <div className="px-2.5 pb-3 flex flex-col items-center gap-1.5 relative z-10">
                                                        <span
                                                            className="text-[9px] sm:text-[10px] text-center font-bold line-clamp-1 w-full"
                                                            style={{ color: isHighTier ? cfg.color : "#6b7280" }}
                                                        >{item.name}</span>
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
                                        <span className="text-[9px] font-medium text-neutral-700 normal-case tracking-normal">(opsional)</span>
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {([1, 2, 3] as const).map(lvl => {
                                            const active = boosterLevel === lvl
                                            const bcfg = BOOSTER_CONFIGS[lvl]
                                            const relic = BOOSTER_RELIC_STYLES[lvl]
                                            const iconColor = BOOSTER_ICON_COLORS[lvl]
                                            const IconComp = BOOSTER_ICONS[lvl]
                                            return (
                                                <button
                                                    key={lvl}
                                                    onClick={() => { GachaAudio.init(); setBoosterLevel(prev => prev === lvl ? 0 : lvl as any); }}
                                                    className="relative flex flex-col items-center justify-center gap-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: active
                                                            ? relic.bgActive
                                                            : "rgba(255,255,255,0.025)",
                                                        border: active
                                                            ? `1.5px solid ${relic.borderColor}`
                                                            : "1px solid rgba(255,255,255,0.06)",
                                                        boxShadow: active
                                                            ? `0 0 24px ${relic.glowColor}, inset 0 0 20px ${relic.glowColor}`
                                                            : "none",
                                                        color: active ? "#fff" : "#6b7280",
                                                    }}
                                                >
                                                    {/* Top colored accent stripe */}
                                                    <div
                                                        className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300"
                                                        style={{
                                                            background: relic.borderColor.replace("0.5)", "1)"),
                                                            opacity: active ? 1 : 0.3,
                                                        }}
                                                    />
                                                    {/* Active glow ring pulse */}
                                                    {active && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none"
                                                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                            style={{
                                                                border: `1px solid ${relic.borderColor}`,
                                                                boxShadow: `0 0 16px ${relic.glowColor}`,
                                                            }}
                                                        />
                                                    )}
                                                    <IconComp
                                                        className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 mb-0.5"
                                                        style={{ color: active ? iconColor.active : iconColor.inactive }}
                                                    />
                                                    <span className="relative z-10 text-[10px] sm:text-[11px] font-black tracking-tight">{bcfg.name}</span>
                                                    {/* Legend rate — highlighted */}
                                                    <span
                                                        className="relative z-10 text-[9px] sm:text-[10px] font-black tabular-nums pb-0.5"
                                                        style={{ color: active ? "#fbbf24" : "#6b7280" }}
                                                    >
                                                        ★ {bcfg.rates.LEGEND}%
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Inline Drop Rate Bars */}
                                    <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2">
                                        {(["BASIC", "ELITE", "EPIC", "LEGEND"] as const).map(tier => {
                                            const tcfg = TIER_CONFIG[tier]
                                            const rate = BOOSTER_CONFIGS[boosterLevel].rates[tier]
                                            return (
                                                <div key={tier} className="flex items-center gap-2.5">
                                                    <TierBadge tier={tier} size="sm" />
                                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            initial={false}
                                                            animate={{ width: `${rate}%` }}
                                                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                                            style={{
                                                                background: tcfg.gradient,
                                                                boxShadow: `0 0 8px ${tcfg.glow}`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold tabular-nums w-7 text-right" style={{ color: tcfg.color }}>
                                                        {rate}%
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative z-10 h-px w-full mb-4 sm:mb-5"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
                                />

                                {/* Section: Action Buttons */}
                                <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4">
                                    {/* Single pull */}
                                    <button
                                        onClick={() => { GachaAudio.init(); openBox(1); }}
                                        disabled={points < BOOSTER_CONFIGS[boosterLevel].single}
                                        className="relative flex flex-col items-center justify-center gap-1.5 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))" }} />
                                        <span className="relative text-sm sm:text-base font-bold text-neutral-400 group-hover:text-neutral-200 transition-colors">Buka 1x</span>
                                        <span className="relative flex items-center gap-1 text-amber-400 text-xs font-bold">
                                            <Star className="w-3 h-3 fill-amber-400" />
                                            {BOOSTER_CONFIGS[boosterLevel].single} poin
                                        </span>
                                    </button>

                                    {/* Multi pull — Premium */}
                                    <div className="relative">
                                        <button
                                            onClick={() => { GachaAudio.init(); openBox(5); }}
                                            disabled={points < BOOSTER_CONFIGS[boosterLevel].multi}
                                            className="gacha-btn-5x w-full h-full relative flex flex-col items-center justify-center gap-1.5 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
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
                                            <span className="relative z-10 flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                                                <Star className="w-3 h-3 fill-amber-300" />
                                                {BOOSTER_CONFIGS[boosterLevel].multi} poin
                                                <span className="text-neutral-500 line-through font-normal opacity-70">{BOOSTER_CONFIGS[boosterLevel].single * 5}</span>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── SPINNING PHASE — CS:GO Case Opening Reel ── */}
                    {phase === "spinning" && (
                        <motion.div
                            key="spinning"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] py-12 relative"
                        >
                            {/* Ambient reel glow */}
                            <motion.div
                                className="absolute rounded-full pointer-events-none"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    width: 500,
                                    height: 300,
                                    background: "radial-gradient(ellipse, rgba(99,102,241,0.25), transparent 70%)",
                                    filter: "blur(50px)",
                                }}
                            />

                            {/* Pull progress (5x pulls) */}
                            {pullCount > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 text-center relative z-10"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">
                                        Pull {Math.min(currentReelIndex + 1, pullCount)} / {pullCount}
                                    </p>
                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                        {Array.from({ length: pullCount }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    background: i < collectedResults.length
                                                        ? TIER_CONFIG[results[i]?.tier ?? "BASIC"].color
                                                        : i === currentReelIndex && results.length > 0
                                                        ? "#6366f1"
                                                        : "rgba(255,255,255,0.1)",
                                                    boxShadow: i === currentReelIndex && results.length > 0
                                                        ? "0 0 8px rgba(99,102,241,0.6)"
                                                        : i < collectedResults.length
                                                        ? `0 0 6px ${TIER_CONFIG[results[i]?.tier ?? "BASIC"].glow}`
                                                        : "none",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* The Reel */}
                            <div className="relative z-10 w-full max-w-2xl sm:max-w-4xl mx-auto px-0 sm:px-4">
                                <AnimatePresence mode="wait">
                                    {results.length > 0 && currentReelIndex < results.length ? (
                                        <motion.div
                                            key="actual-reel"
                                            initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="w-full"
                                        >
                                            <CaseOpeningReel
                                                key={currentReelIndex}
                                                result={results[currentReelIndex]}
                                                poolItems={shopItems}
                                                onComplete={() => handleReelComplete(currentReelIndex)}
                                            />
                                        </motion.div>
                                    ) : (
                                        /* Holographic Scanning Track Loading State */
                                        <motion.div
                                            key="scanning-track"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                                            transition={{ duration: 0.4 }}
                                            className="w-full relative rounded-2xl overflow-hidden flex items-center justify-center"
                                            style={{
                                                height: 189, // Fits desktop height (165 + 24)
                                                background: "rgba(10,10,18,0.4)",
                                                border: "1px dashed rgba(99,102,241,0.2)",
                                                boxShadow: "inset 0 0 20px rgba(99,102,241,0.05)"
                                            }}
                                        >
                                            {/* Scanning grid overlay */}
                                            <div 
                                                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                                style={{
                                                    backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                                                    backgroundSize: '20px 20px'
                                                }}
                                            />
                                            
                                            {/* Empty item slots wireframes */}
                                            <div className="flex gap-4 sm:gap-6 opacity-30">
                                                {Array.from({length: 7}).map((_, i) => (
                                                    <div key={i} className="hidden sm:block shrink-0 w-[140px] h-[165px] rounded-xl"
                                                        style={{ border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.02)" }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex sm:hidden gap-3 absolute inset-0 items-center justify-center opacity-30">
                                                {Array.from({length: 5}).map((_, i) => (
                                                    <div key={i} className="shrink-0 w-[100px] h-[120px] rounded-xl"
                                                        style={{ border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.02)" }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Left to right to left scanning laser */}
                                            <motion.div
                                                className="absolute top-0 bottom-0 w-32 md:w-64 z-10"
                                                animate={{ x: ["-100vw", "100vw", "-100vw"] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                style={{
                                                    background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)",
                                                    borderRight: "1.5px solid rgba(139,92,246,0.8)",
                                                    filter: "drop-shadow(0 0 12px rgba(139,92,246,0.8))"
                                                }}
                                            />

                                            {/* Center indicator wireframe */}
                                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40">
                                                 <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "12px solid rgba(99,102,241,0.5)" }} />
                                                 <div className="flex-1" style={{ width: 1.5, background: "rgba(99,102,241,0.3)" }} />
                                                 <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "12px solid rgba(99,102,241,0.5)" }} />
                                            </div>

                                            {/* Status Text overlay */}
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-neutral-950/80 px-4 py-1 rounded-full backdrop-blur-sm border border-indigo-500/20">
                                                <motion.div
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                                    className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2"
                                                    style={{ color: "#818cf8", textShadow: "0 0 8px rgba(99,102,241,0.5)" }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ boxShadow: "0 0 8px #818cf8" }} />
                                                    DECRYPTING...
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Collected results (for multi-pull) */}
                            {collectedResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative z-10 mt-8"
                                >
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-600 text-center mb-3">
                                        Hasil Terkumpul
                                    </p>
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        {collectedResults.map((res, i) => (
                                            <MiniCollectedCard key={i} result={res} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Skip all + status */}
                            <div className="relative z-10 mt-6 flex flex-col items-center gap-3">
                                {results.length > 0 && pullCount > 1 && collectedResults.length < results.length && (
                                    <button
                                        onClick={handleSkipAnimation}
                                        className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            color: "#6b7280",
                                        }}
                                    >
                                        Skip Semua
                                    </button>
                                )}
                                <motion.p
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                                    style={{ color: "#4b5563" }}
                                >
                                    {results.length === 0 ? "Membuka box..." : "Menggulir keberuntungan..."}
                                </motion.p>
                            </div>
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
                            style={{ background: "rgba(3,3,10,0.97)", backdropFilter: "blur(24px)" }}
                        >
                            {/* Ambient full-screen glow — driven by best tier */}
                            {(() => {
                                const bestTier = results.reduce<TierName>((best, r) => {
                                    const order: TierName[] = ["BASIC","ELITE","EPIC","LEGEND"]
                                    return order.indexOf(r.tier) > order.indexOf(best) ? r.tier : best
                                }, "BASIC")
                                const bestCfg = TIER_CONFIG[bestTier]
                                return (
                                    <motion.div
                                        className="fixed inset-0 pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 1 }}
                                        style={{
                                            background: `radial-gradient(ellipse at 50% 20%, ${bestCfg.bg} 0%, transparent 60%)`,
                                        }}
                                    />
                                )
                            })()}

                            <div className="flex flex-col min-h-screen w-full px-4 sm:px-8 py-16 md:py-24">
                                <div className="flex-1 min-h-[1rem]" />
                                <div className="w-full flex flex-col items-center">

                                    {/* Header */}
                                    <motion.div
                                        initial={{ y: -30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="text-center mb-10"
                                    >
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-2">
                                            Hasil Gacha
                                        </p>
                                        <h2
                                            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                                            style={{ textShadow: "0 0 40px rgba(139,92,246,0.4)" }}
                                        >
                                            ITEM DIDAPATKAN
                                        </h2>
                                        <div className="h-0.5 w-24 mx-auto mt-3 rounded-full"
                                            style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, #6366f1, transparent)" }} />
                                    </motion.div>

                                    {/* Result Cards Grid */}
                                    <div className={`grid gap-4 sm:gap-5 w-full mx-auto ${
                                        results.length === 1
                                            ? 'grid-cols-1 max-w-[220px]'
                                            : results.length <= 3
                                            ? `grid-cols-${results.length} max-w-2xl`
                                            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-5xl'
                                    }`}>
                                        {results.map((res, i) => {
                                            const cfg = TIER_CONFIG[res.tier]
                                            const isLegend = res.tier === "LEGEND"
                                            const isEpic   = res.tier === "EPIC"

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
                                                    initial={{ opacity: 0, y: 60, scale: 0.75, rotateY: 90 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                                                    transition={{
                                                        delay: i * 0.12,
                                                        duration: 0.65,
                                                        type: "spring",
                                                        bounce: 0.35,
                                                    }}
                                                    onAnimationStart={() => GachaAudio.reveal(res.tier)}
                                                    className="relative group w-full"
                                                    style={{ perspective: "1000px" }}
                                                >
                                                    {/* Outer glow — always on for LEGEND, hover for others */}
                                                    <motion.div
                                                        className="absolute inset-0 rounded-2xl pointer-events-none"
                                                        initial={{ opacity: isLegend ? 0.5 : 0 }}
                                                        animate={isLegend ? { opacity: [0.4, 0.7, 0.4] } : {}}
                                                        transition={{ duration: 2.5, repeat: Infinity }}
                                                        style={{
                                                            background: cfg.glow,
                                                            filter: "blur(18px)",
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                                                        style={{ background: cfg.glow, filter: "blur(20px)" }}
                                                    />

                                                    <div
                                                        className="relative flex flex-col rounded-2xl overflow-hidden h-full"
                                                        style={{
                                                            background: isLegend
                                                                ? `linear-gradient(160deg, ${cfg.bg}, rgba(10,10,18,0.99))`
                                                                : "linear-gradient(160deg, rgba(18,18,28,0.98), rgba(10,10,16,0.99))",
                                                            border: `${isLegend || isEpic ? "1.5px" : "1px"} solid ${cfg.border}`,
                                                            boxShadow: isLegend
                                                                ? `0 0 32px -4px ${cfg.glow}, 0 16px 48px -8px rgba(0,0,0,0.8)`
                                                                : `0 0 16px -4px ${cfg.glow}, 0 8px 32px -8px rgba(0,0,0,0.7)`,
                                                        }}
                                                    >
                                                        {/* Top gradient accent */}
                                                        <div
                                                            className="absolute top-0 left-0 right-0 z-10"
                                                            style={{
                                                                height: isLegend ? "2.5px" : "1.5px",
                                                                background: cfg.gradient,
                                                                boxShadow: isLegend ? `0 0 12px ${cfg.glow}` : "none",
                                                            }}
                                                        />

                                                        {/* LEGEND shimmer sweep */}
                                                        {isLegend && (
                                                            <motion.div
                                                                className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
                                                                animate={{ x: ["-100%", "200%"] }}
                                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                                                                style={{
                                                                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                                                                }}
                                                            />
                                                        )}

                                                        {/* Tier + Duplicate badge row */}
                                                        <div className="flex justify-between items-start z-10 px-3 pt-3">
                                                            <TierBadge tier={res.tier} size="md" />
                                                            {res.isDuplicate && (
                                                                <motion.span
                                                                    initial={{ scale: 0, rotate: -15 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    transition={{ delay: i * 0.12 + 0.5, type: "spring", bounce: 0.5 }}
                                                                    className="text-[9px] font-bold text-amber-400 px-2 py-0.5 rounded-full"
                                                                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
                                                                >
                                                                    Duplikat +{res.refundAmount}
                                                                </motion.span>
                                                            )}
                                                        </div>

                                                        {/* Item preview */}
                                                        <div
                                                            className="flex items-center justify-center relative z-10 mx-3 my-2 rounded-xl overflow-hidden"
                                                            style={{
                                                                height: isLegend ? "9rem" : "7rem",
                                                                background: `radial-gradient(ellipse at 50% 50%, ${cfg.bg}, rgba(255,255,255,0.01))`,
                                                            }}
                                                        >
                                                            <motion.div
                                                                animate={isLegend
                                                                    ? { y: [-4, 4, -4], rotate: [-1, 1, -1] }
                                                                    : isEpic ? { y: [-2, 2, -2] } : {}
                                                                }
                                                                transition={{ duration: isLegend ? 3 : 4, repeat: Infinity, ease: "easeInOut" }}
                                                                className="w-full h-full flex items-center justify-center"
                                                            >
                                                                <ItemPreview item={previewItem} />
                                                            </motion.div>
                                                        </div>

                                                        {/* Item info */}
                                                        <div className="text-center z-10 relative px-3 pb-4">
                                                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold mb-0.5"
                                                                style={{ color: cfg.color }}>
                                                                {TYPE_SHORT_LABELS[res.item.type]}
                                                            </p>
                                                            <h3 className="text-sm sm:text-[15px] font-black text-white leading-tight mb-2">
                                                                {res.item.name}
                                                            </h3>
                                                            <div className="flex items-center justify-center gap-1 text-amber-400/70">
                                                                <Star className="w-2.5 h-2.5 fill-amber-400/70" />
                                                                <span className="text-[10px] font-bold">{res.item.price} poin</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>

                                    {/* Summary + Actions */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: results.length * 0.12 + 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="w-full max-w-lg mt-10 space-y-3"
                                    >
                                        {/* Summary pill */}
                                        <div
                                            className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.07)",
                                                backdropFilter: "blur(12px)",
                                            }}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <span className="text-[11px] text-neutral-500">
                                                        Biaya: <span className="text-amber-400 font-bold">{resultMeta.totalCost} poin</span>
                                                    </span>
                                                </div>
                                                {resultMeta.totalRefund > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Repeat2 className="w-3 h-3 text-green-400" />
                                                        <span className="text-[11px] text-neutral-500">
                                                            Refund: <span className="text-green-400 font-bold">+{resultMeta.totalRefund} poin</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold mb-0.5">Sisa Poin</p>
                                                <p className="text-xl font-black text-amber-400">{formatPoints(resultMeta.newPoints)}</p>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={closeResults}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                                style={{
                                                    background: "rgba(255,255,255,0.04)",
                                                    border: "1px solid rgba(255,255,255,0.09)",
                                                    color: "#9ca3af",
                                                }}
                                            >
                                                <Package className="w-4 h-4" />
                                                Simpan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    closeResults()
                                                    setTimeout(() => openBox(pullCount), 300)
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                                                style={{
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                    boxShadow: "0 0 24px rgba(99,102,241,0.3), 0 8px 24px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                                <span className="relative flex items-center gap-2 text-white font-black">
                                                    <Repeat2 className="w-4 h-4" />
                                                    Buka {pullCount}x Lagi
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                                <div className="flex-1 min-h-[1rem]" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}