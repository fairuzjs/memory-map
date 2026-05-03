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
    text: string
}> = {
    BASIC: {
        label: "Basic",
        icon: "◆",
        color: "#E5E5E5",
        glow: "#000",
        bg: "#E5E5E5",
        border: "#000",
        text: "#000",
    },
    ELITE: {
        label: "Elite",
        icon: "◈",
        color: "#00FFFF",
        glow: "#000",
        bg: "#00FFFF",
        border: "#000",
        text: "#000",
    },
    EPIC: {
        label: "Epic",
        icon: "✦",
        color: "#FF00FF",
        glow: "#000",
        bg: "#FF00FF",
        border: "#000",
        text: "#FFF",
    },
    LEGEND: {
        label: "Legend",
        icon: "★",
        color: "#FFFF00",
        glow: "#000",
        bg: "#FFFF00",
        border: "#000",
        text: "#000",
    },
    SPECIAL: {
        label: "Special",
        icon: "✧",
        color: "#00FF00",
        glow: "#000",
        bg: "#00FF00",
        border: "#000",
        text: "#000",
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

    return (
        <span
            className="inline-flex items-center gap-1 font-black uppercase tracking-wider border-[2px] border-black"
            style={{
                fontSize: size === "md" ? "11px" : "10px",
                padding: size === "md" ? "3px 8px" : "2px 6px",
                background: cfg.bg,
                color: cfg.text,
                boxShadow: "2px 2px 0 #000"
            }}
        >
            <span style={{ fontSize: size === "md" ? "10px" : "9px" }}>{cfg.icon}</span>
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
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none" style={{ width: 4 }}>
                    {/* Top triangle */}
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: "10px solid transparent",
                        borderRight: "10px solid transparent",
                        borderTop: hasFinished ? `16px solid #FF00FF` : "16px solid black",
                    }} />
                    {/* Vertical line */}
                    <div className="flex-1" style={{
                        width: 4,
                        background: hasFinished ? "#FF00FF" : "black",
                    }} />
                    {/* Bottom triangle */}
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: "10px solid transparent",
                        borderRight: "10px solid transparent",
                        borderBottom: hasFinished ? `16px solid #FF00FF` : "16px solid black",
                    }} />
                </div>

                {/* Edge fade gradients */}
                <div className="absolute inset-y-0 left-0 w-16 sm:w-24 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
                <div className="absolute inset-y-0 right-0 w-16 sm:w-24 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

                {/* Reel track */}
                <div
                    className="overflow-hidden bg-[#E5E5E5] border-[4px] border-black shadow-[8px_8px_0_#000]"
                    style={{ height: itemHeight + 32 }}
                >
                    <motion.div
                        className="flex items-center h-full"
                        style={{ x, gap: itemGap, paddingLeft: 16, paddingRight: 16 }}
                    >
                        {reel.map((reelItem, i) => {
                            const isWinner = reelItem.isResult && hasFinished
                            return (
                                <motion.div
                                    key={i}
                                    className="shrink-0 flex flex-col relative bg-white border-[4px] border-black"
                                    style={{
                                        width: itemWidth,
                                        height: itemHeight,
                                        boxShadow: isWinner ? "8px 8px 0 #FF00FF" : "4px 4px 0 #000",
                                        transition: "box-shadow 0.2s",
                                    }}
                                    animate={isWinner ? {
                                        scale: [1, 1.1, 1.06],
                                        y: -8
                                    } : {}}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                    {/* Tier Badge */}
                                    <div className="absolute top-2 left-2 z-20">
                                        <TierBadge tier={reelItem.tier} />
                                    </div>

                                    {/* Item preview */}
                                    <div className="flex-1 flex items-center justify-center p-2 relative z-10 bg-[#E5E5E5] border-b-[4px] border-black m-1">
                                        <ItemPreview item={reelItem.shopItem} />
                                    </div>

                                    {/* Name */}
                                    <div className="px-2 pb-2 flex flex-col items-center gap-1 relative z-10">
                                        <span className="text-[10px] sm:text-[12px] font-black uppercase text-center line-clamp-1 w-full text-black">
                                            {reelItem.shopItem.name}
                                        </span>
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
                    className="flex justify-center mt-6"
                >
                    <button
                        onClick={skipToEnd}
                        className="px-6 py-2 bg-white border-[3px] border-black text-black font-black uppercase text-[12px] shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
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
                        className="text-center mt-6 flex flex-col items-center"
                    >
                        <p className="text-[16px] font-black uppercase tracking-widest text-black bg-[#FFFF00] border-[2px] border-black px-4 py-1 shadow-[2px_2px_0_#000]">
                            {result.item.name}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {result.isDuplicate && (
                                <span className="text-[12px] font-black uppercase text-black bg-[#FF3300] px-3 py-1 border-[2px] border-black shadow-[2px_2px_0_#000] text-white">
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
            className="w-20 h-24 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] relative flex flex-col shrink-0"
        >
            <div className="flex-1 flex items-center justify-center p-1 min-h-0 bg-[#E5E5E5] border-b-[3px] border-black m-1">
                <ItemPreview item={previewItem} />
            </div>
            <span className="text-[9px] font-black uppercase text-center px-1 pb-1 line-clamp-1 w-full text-black">
                {result.item.name}
            </span>
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
    const [premiumStatus, setPremiumStatus] = useState<{
        isPremium: boolean
        freeGachaPullsRemaining: number
        pityCounter: number
        pityGuarantee: number | null
    } | null>(null)

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
        if (status === "authenticated") {
            loadData()
            // Fetch premium status for free pull + pity info
            fetch("/api/premium/status")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setPremiumStatus({
                            isPremium: data.isPremium,
                            freeGachaPullsRemaining: data.freeGachaPullsRemaining ?? 0,
                            pityCounter: data.pityCounter ?? 0,
                            pityGuarantee: data.limits?.pityGuarantee ?? null,
                        })
                    }
                })
                .catch(() => {})
        }
    }, [status, loadData, router])

    const openBox = async (count: 1 | 5) => {
        const config = BOOSTER_CONFIGS[boosterLevel]
        const cost = count === 5 ? config.multi : config.single

        // Check if user can use free pulls
        const canUseFree = premiumStatus?.isPremium && premiumStatus.freeGachaPullsRemaining > 0 && boosterLevel === 0
        const freePullsToUse = canUseFree ? Math.min(count, premiumStatus!.freeGachaPullsRemaining) : 0
        const paidPulls = count - freePullsToUse
        const actualCost = paidPulls > 0 ? (paidPulls === count ? cost : paidPulls * config.single) : 0

        if (actualCost > 0 && points < actualCost) {
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
                body: JSON.stringify({ count, booster: boosterLevel, useFreePull: canUseFree }),
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
            // Update free pulls remaining & pity counter
            if (premiumStatus?.isPremium) {
                setPremiumStatus(prev => prev ? {
                    ...prev,
                    freeGachaPullsRemaining: data.freeGachaPullsRemaining ?? prev.freeGachaPullsRemaining,
                    pityCounter: data.pityCounter ?? prev.pityCounter,
                } : prev)
            }
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
                Neubrutalist Background
                ══════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, background: "#ffffff", backgroundImage: "linear-gradient(#E5E5E5 2px, transparent 2px), linear-gradient(90deg, #E5E5E5 2px, transparent 2px)", backgroundSize: "32px 32px" }}>
            </div>

            {/* All content sits above the glow orbs */}
            <div className="relative">

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
                                        className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000]"
                                    >
                                        <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-black" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-none uppercase" style={{ textShadow: "2px 2px 0 #00FFFF" }}>Mystery Box</h1>
                                            {/* Mobile Shop Button */}
                                            <Link
                                                href="/shop"
                                                className="sm:hidden flex items-center justify-center w-8 h-8 bg-white border-[2px] border-black text-black font-black shadow-[2px_2px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                                title="Ke Shop"
                                            >
                                                <ShoppingBag className="w-4 h-4" />
                                            </Link>
                                        </div>
                                        <p className="text-[12px] sm:text-[14px] mt-1 font-bold text-black uppercase tracking-wider">
                                            Uji keberuntunganmu dan dapatkan item langka
                                        </p>
                                    </div>
                                </div>

                                {/* Desktop Shop Button */}
                                <Link
                                    href="/shop"
                                    className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border-[3px] border-black text-black font-black uppercase text-[12px] shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Ke Shop
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Stat pills */}
                            <div className="flex items-center gap-3 mt-6 flex-wrap">
                                <span
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFFF00] border-[2px] border-black text-black text-[10px] font-black uppercase shadow-[2px_2px_0_#000]"
                                >
                                    <Star className="w-3 h-3 fill-black text-black" />
                                    {formatPoints(points)} poin
                                </span>
                                <span
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00FFFF] border-[2px] border-black text-black text-[10px] font-black uppercase shadow-[2px_2px_0_#000]"
                                >
                                    <div className="w-2 h-2 bg-black" />
                                    {BOOSTER_CONFIGS[boosterLevel].single} poin / buka
                                </span>
                                {/* Premium: Free Pulls Remaining */}
                                {premiumStatus?.isPremium && premiumStatus.freeGachaPullsRemaining > 0 && boosterLevel === 0 && (
                                    <span
                                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00FF00] border-[2px] border-black text-black text-[10px] font-black uppercase shadow-[2px_2px_0_#000]"
                                    >
                                        <Sparkles className="w-3 h-3 text-black" />
                                        {premiumStatus.freeGachaPullsRemaining} Free Pull
                                    </span>
                                )}
                                {/* Premium: Pity Counter */}
                                {premiumStatus?.isPremium && premiumStatus.pityGuarantee && boosterLevel === 0 && (
                                    <span
                                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF00FF] border-[2px] border-black text-white text-[10px] font-black uppercase shadow-[2px_2px_0_#000]"
                                        title={`Pity: dapatkan Legend dijamin dalam ${premiumStatus.pityCounter} pull`}
                                    >
                                        ★ Pity {premiumStatus.pityCounter}/{premiumStatus.pityGuarantee}
                                    </span>
                                )}
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
                                {/* The Mystery Box itself */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10"
                                >
                                    <div className="relative flex items-center justify-center bg-[#FF00FF] border-[6px] border-black shadow-[12px_12px_0_#000]" style={{ width: 140, height: 140 }}>
                                        <Sparkles className="w-14 h-14 text-white" />
                                    </div>
                                </motion.div>

                                {/* Box shadow on floor */}
                                <motion.div
                                    animate={{ scaleX: [1, 0.8, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="mt-6 pointer-events-none bg-black"
                                    style={{
                                        width: 100,
                                        height: 8,
                                    }}
                                />

                                {/* CTA label */}
                                <motion.p
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="mt-6 px-4 py-1.5 bg-[#FFFF00] border-[2px] border-black shadow-[2px_2px_0_#000] text-[12px] font-black uppercase tracking-widest text-black"
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
                                    <motion.div
                                        animate={{ x: [0, -(shopItems.length * 164)] }}
                                        transition={{ duration: Math.max(24, shopItems.length * 1.8), ease: "linear", repeat: Infinity }}
                                        className="flex gap-4 items-stretch w-max py-4 px-4"
                                    >
                                        {carouselItems.map((item, i) => {
                                            const tier = getTier(item.price, item.name)
                                            return (
                                                <div
                                                    key={i}
                                                    className="w-36 sm:w-40 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex flex-col relative overflow-hidden shrink-0 transition-all duration-300 hover:scale-[1.05] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000]"
                                                >
                                                    {/* Tier Badge */}
                                                    <div className="absolute top-2 left-2 z-20">
                                                        <TierBadge tier={tier} />
                                                    </div>
                                                    {/* Item preview */}
                                                    <div className="h-28 sm:h-32 flex items-center justify-center p-3 relative z-10 bg-[#E5E5E5] border-b-[3px] border-black m-1">
                                                        <ItemPreview item={item} />
                                                    </div>
                                                    {/* Name */}
                                                    <div className="px-2.5 pb-3 flex flex-col items-center gap-1.5 relative z-10 bg-white mt-1">
                                                        <span
                                                            className="text-[10px] text-center font-black uppercase text-black line-clamp-1 w-full"
                                                        >{item.name}</span>
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
                                className="bg-white border-[4px] border-black p-4 sm:p-5 relative overflow-hidden shadow-[8px_8px_0_#000]"
                            >
                                {/* Section: Booster Relic Slots */}
                                <div className="relative z-10 mb-6 sm:mb-8">
                                    <p className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.15em] text-black mb-4 flex items-center gap-2">
                                        <Settings className="w-4 h-4" /> Pilih Booster
                                        <span className="text-[10px] font-bold text-neutral-500 normal-case tracking-normal">(opsional)</span>
                                    </p>
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                        {([1, 2, 3] as const).map(lvl => {
                                            const active = boosterLevel === lvl
                                            const bcfg = BOOSTER_CONFIGS[lvl]
                                            const IconComp = BOOSTER_ICONS[lvl]
                                            const activeColors: Record<number, string> = { 1: "#00FFFF", 2: "#FF00FF", 3: "#FFFF00" }
                                            return (
                                                <button
                                                    key={lvl}
                                                    onClick={() => { GachaAudio.init(); setBoosterLevel(prev => prev === lvl ? 0 : lvl as any); }}
                                                    className="relative flex flex-col items-center justify-center gap-1.5 py-4 sm:py-5 border-[3px] border-black text-black text-[10px] sm:text-xs font-black uppercase transition-all shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                                    style={{
                                                        background: active ? activeColors[lvl] : "#E5E5E5",
                                                    }}
                                                >
                                                    <IconComp className="relative z-10 w-6 h-6 sm:w-8 sm:h-8 mb-1 text-black" />
                                                    <span className="relative z-10 tracking-widest">{bcfg.name}</span>
                                                    {/* Legend rate — highlighted */}
                                                    <span className="relative z-10 text-[10px] sm:text-[11px] font-black tabular-nums bg-white border-[2px] border-black px-2 mt-1">
                                                        ★ {bcfg.rates.LEGEND}%
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Inline Drop Rate Bars */}
                                    <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3">
                                        {(["BASIC", "ELITE", "EPIC", "LEGEND"] as const).map(tier => {
                                            const rate = BOOSTER_CONFIGS[boosterLevel].rates[tier]
                                            const tierColors: Record<string, string> = {
                                                "BASIC": "#4ADE80", // Green
                                                "ELITE": "#00FFFF", // Cyan
                                                "EPIC": "#FF00FF",  // Magenta
                                                "LEGEND": "#FFFF00" // Yellow
                                            }
                                            return (
                                                <div key={tier} className="flex items-center gap-3">
                                                    <div className="border-[2px] border-black px-2 py-0.5 text-[10px] font-black text-black min-w-[50px] text-center"
                                                         style={{ background: tierColors[tier] }}>
                                                        {tier}
                                                    </div>
                                                    <div className="flex-1 h-3 border-[2px] border-black bg-[#E5E5E5] relative overflow-hidden">
                                                        <motion.div
                                                            className="h-full border-r-[2px] border-black"
                                                            initial={false}
                                                            animate={{ width: `${rate}%` }}
                                                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                                            style={{ background: tierColors[tier] }}
                                                        />
                                                    </div>
                                                    <span className="text-[12px] font-black tabular-nums w-8 text-right text-black">
                                                        {rate}%
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative z-10 border-t-[4px] border-black border-dashed w-full mb-6 sm:mb-8" />

                                {/* Section: Action Buttons */}
                                <div className="relative z-10 grid grid-cols-2 gap-4 sm:gap-6">
                                    {/* Single pull */}
                                    {(() => {
                                        const canUseFree = premiumStatus?.isPremium && premiumStatus.freeGachaPullsRemaining > 0 && boosterLevel === 0
                                        const isFree = canUseFree && premiumStatus!.freeGachaPullsRemaining >= 1
                                        const singleCost = BOOSTER_CONFIGS[boosterLevel].single
                                        return (
                                            <button
                                                onClick={() => { GachaAudio.init(); openBox(1); }}
                                                disabled={!isFree && points < singleCost}
                                                className="relative flex flex-col items-center justify-center gap-2 py-5 sm:py-6 bg-[#00FFFF] border-[4px] border-black text-black text-sm font-black uppercase transition-all shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                            >
                                                <span className="relative text-[14px] sm:text-[16px] font-black text-black tracking-widest">Buka 1x</span>
                                                {isFree ? (
                                                    <span className="relative flex items-center gap-1.5 text-black bg-white border-[2px] border-black px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_#000]">
                                                        <Sparkles className="w-3 h-3 text-black" />
                                                        GRATIS
                                                    </span>
                                                ) : (
                                                    <span className="relative flex items-center gap-1.5 text-black bg-white border-[2px] border-black px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_#000]">
                                                        <Star className="w-3 h-3 fill-black text-black" />
                                                        {singleCost} poin
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })()}

                                    {/* Multi pull — Premium */}
                                    {(() => {
                                        const canUseFree = premiumStatus?.isPremium && premiumStatus.freeGachaPullsRemaining > 0 && boosterLevel === 0
                                        const freePulls = canUseFree ? Math.min(5, premiumStatus!.freeGachaPullsRemaining) : 0
                                        const paidPulls = 5 - freePulls
                                        const multiCost = BOOSTER_CONFIGS[boosterLevel].multi
                                        const actualCost = paidPulls > 0 ? (paidPulls === 5 ? multiCost : paidPulls * BOOSTER_CONFIGS[boosterLevel].single) : 0
                                        const allFree = freePulls === 5
                                        return (
                                            <div className="relative">
                                                <button
                                                    onClick={() => { GachaAudio.init(); openBox(5); }}
                                                    disabled={!allFree && points < actualCost}
                                                    className="w-full h-full relative flex flex-col items-center justify-center gap-2 py-5 sm:py-6 bg-[#FF00FF] border-[4px] border-black text-black text-sm font-black uppercase transition-all shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                                >
                                                    <span className="relative z-10 text-[14px] sm:text-[16px] font-black tracking-widest text-white" style={{ textShadow: "2px 2px 0 black" }}>Buka 5x</span>
                                                    {allFree ? (
                                                        <span className="relative z-10 flex items-center gap-1.5 text-black bg-white border-[2px] border-black px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_#000]">
                                                            <Sparkles className="w-3 h-3 text-black" />
                                                            SEMUA GRATIS
                                                        </span>
                                                    ) : freePulls > 0 ? (
                                                        <span className="relative z-10 flex items-center gap-1.5 text-black bg-white border-[2px] border-black px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_#000]">
                                                            <Sparkles className="w-3 h-3 text-black" />
                                                            <span className="text-black">{freePulls} gratis</span> + {actualCost} poin
                                                        </span>
                                                    ) : (
                                                        <span className="relative z-10 flex items-center gap-1.5 text-black bg-white border-[2px] border-black px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_#000]">
                                                            <Star className="w-3 h-3 fill-black text-black" />
                                                            {multiCost} poin
                                                            <span className="text-black line-through">{BOOSTER_CONFIGS[boosterLevel].single * 5}</span>
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        )
                                    })()}
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
                            className="fixed inset-0 z-[990] flex flex-col items-center justify-center overflow-hidden"
                            style={{ background: "rgba(8,8,14,0.95)", backdropFilter: "blur(24px)" }}
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
                                            className="w-full relative flex items-center justify-center bg-[#E5E5E5] border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden"
                                            style={{ height: 189 }}
                                        >
                                            {/* Scanning grid overlay */}
                                            <div 
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    backgroundImage: "linear-gradient(#00000020 2px, transparent 2px), linear-gradient(90deg, #00000020 2px, transparent 2px)",
                                                    backgroundSize: "30px 30px"
                                                }}
                                            />
                                            
                                            {/* Empty item slots wireframes */}
                                            <div className="flex gap-4 sm:gap-6 opacity-30">
                                                {Array.from({length: 7}).map((_, i) => (
                                                    <div key={i} className="hidden sm:block shrink-0 w-[140px] h-[165px] border-[4px] border-black bg-white shadow-[4px_4px_0_#000]" />
                                                ))}
                                            </div>
                                            <div className="flex sm:hidden gap-3 absolute inset-0 items-center justify-center opacity-30">
                                                {Array.from({length: 5}).map((_, i) => (
                                                    <div key={i} className="shrink-0 w-[100px] h-[120px] border-[4px] border-black bg-white shadow-[4px_4px_0_#000]" />
                                                ))}
                                            </div>

                                            {/* Left to right to left scanning laser */}
                                            <motion.div
                                                className="absolute top-0 bottom-0 w-32 md:w-64 z-10"
                                                animate={{ x: ["-100vw", "100vw", "-100vw"] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                style={{
                                                    background: "linear-gradient(90deg, transparent, rgba(255,0,255,0.4), transparent)",
                                                    borderRight: "4px solid #FF00FF"
                                                }}
                                            />

                                            {/* Center indicator wireframe */}
                                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                 <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "16px solid black" }} />
                                                 <div className="flex-1" style={{ width: 4, background: "black" }} />
                                                 <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "16px solid black" }} />
                                            </div>

                                            {/* Status Text overlay */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#FFFF00] border-[3px] border-black px-4 py-1.5 shadow-[4px_4px_0_#000]">
                                                <motion.div
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                                    className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2 text-black"
                                                >
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
                                        className="px-6 py-2 bg-white border-[3px] border-black text-black font-black uppercase text-[12px] shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                    >
                                        Skip Semua
                                    </button>
                                )}
                                <motion.p
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-[12px] font-black uppercase tracking-widest text-white mt-4"
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
                            style={{ background: "#ffffff", backgroundImage: "linear-gradient(#E5E5E5 2px, transparent 2px), linear-gradient(90deg, #E5E5E5 2px, transparent 2px)", backgroundSize: "32px 32px" }}
                        >
                            <div className="flex flex-col min-h-screen w-full px-4 sm:px-8 py-16 md:py-24 relative">
                                <div className="flex-1 min-h-[1rem]" />
                                <div className="w-full flex flex-col items-center">

                                    {/* Header */}
                                    <motion.div
                                        initial={{ y: -30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="text-center mb-12 flex flex-col items-center"
                                    >
                                        <p className="text-[12px] font-black uppercase tracking-widest text-black bg-[#00FFFF] border-[2px] border-black px-4 py-1 shadow-[2px_2px_0_#000] inline-block mb-4 transform -rotate-2">
                                            Hasil Gacha
                                        </p>
                                        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight uppercase" style={{ textShadow: "4px 4px 0 #FF00FF" }}>
                                            ITEM DIDAPATKAN
                                        </h2>
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
                                                    transition={{ delay: i * 0.12, duration: 0.65, type: "spring", bounce: 0.35 }}
                                                    onAnimationStart={() => GachaAudio.reveal(res.tier)}
                                                    className="relative group w-full"
                                                    style={{ perspective: "1000px" }}
                                                >
                                                    <div className="relative flex flex-col bg-white border-[4px] border-black shadow-[8px_8px_0_#000] h-full overflow-hidden"
                                                        style={{
                                                            boxShadow: isLegend ? "8px 8px 0 #FF00FF" : isEpic ? "8px 8px 0 #00FFFF" : "8px 8px 0 #000"
                                                        }}
                                                    >
                                                        {/* Tier + Duplicate badge row */}
                                                        <div className="flex justify-between items-start z-10 p-3 bg-neutral-100 border-b-[4px] border-black">
                                                            <div className="bg-white border-[2px] border-black px-2 py-0.5 text-[10px] font-black text-black">
                                                                {cfg.label}
                                                            </div>
                                                            {res.isDuplicate && (
                                                                <motion.span
                                                                    initial={{ scale: 0, rotate: -15 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    transition={{ delay: i * 0.12 + 0.5, type: "spring", bounce: 0.5 }}
                                                                    className="text-[10px] font-black text-white px-2 py-0.5 bg-[#FF3300] border-[2px] border-black shadow-[2px_2px_0_#000]"
                                                                >
                                                                    Duplikat +{res.refundAmount}
                                                                </motion.span>
                                                            )}
                                                        </div>

                                                        {/* Item preview */}
                                                        <div className="flex items-center justify-center relative z-10 bg-[#E5E5E5] border-b-[4px] border-black p-4" style={{ height: isLegend ? "9rem" : "7rem" }}>
                                                            <motion.div
                                                                animate={isLegend ? { y: [-4, 4, -4], rotate: [-1, 1, -1] } : isEpic ? { y: [-2, 2, -2] } : {}}
                                                                transition={{ duration: isLegend ? 3 : 4, repeat: Infinity, ease: "easeInOut" }}
                                                                className="w-full h-full flex items-center justify-center"
                                                            >
                                                                <ItemPreview item={previewItem} />
                                                            </motion.div>
                                                        </div>

                                                        {/* Item info */}
                                                        <div className="text-center z-10 relative p-4 flex-1 flex flex-col justify-center bg-white">
                                                            <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-1">
                                                                {TYPE_SHORT_LABELS[res.item.type]}
                                                            </p>
                                                            <h3 className="text-[16px] font-black text-black leading-tight mb-2 uppercase">
                                                                {res.item.name}
                                                            </h3>
                                                            <div className="flex items-center justify-center gap-1.5 mt-auto">
                                                                <Star className="w-3.5 h-3.5 fill-black text-black" />
                                                                <span className="text-[12px] font-black text-black">{res.item.price} poin</span>
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
                                        className="w-full max-w-lg mt-12 space-y-4"
                                    >
                                        {/* Summary pill */}
                                        <div className="bg-white border-[4px] border-black p-5 shadow-[8px_8px_0_#000] flex items-center justify-between gap-4 relative">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-black fill-black" />
                                                    <span className="text-[14px] text-black font-bold">
                                                        Biaya: <span className="font-black">{resultMeta.totalCost} poin</span>
                                                    </span>
                                                </div>
                                                {resultMeta.totalRefund > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Repeat2 className="w-4 h-4 text-black" />
                                                        <span className="text-[14px] text-black font-bold">
                                                            Refund: <span className="font-black">+{resultMeta.totalRefund} poin</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0 border-l-[3px] border-black pl-4">
                                                <p className="text-[12px] text-black uppercase tracking-widest font-bold mb-1">Sisa Poin</p>
                                                <p className="text-2xl font-black text-black">{formatPoints(resultMeta.newPoints)}</p>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-4">
                                            <button
                                                onClick={closeResults}
                                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#E5E5E5] border-[3px] border-black text-black text-[12px] sm:text-sm font-black uppercase transition-all shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                            >
                                                <Package className="w-5 h-5" />
                                                Simpan
                                            </button>
                                            <button
                                                onClick={() => {
                                                    closeResults()
                                                    setTimeout(() => openBox(pullCount), 300)
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#00FF00] border-[3px] border-black text-black text-[12px] sm:text-sm font-black uppercase transition-all shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                                            >
                                                <Repeat2 className="w-5 h-5" />
                                                Buka {pullCount}x Lagi
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