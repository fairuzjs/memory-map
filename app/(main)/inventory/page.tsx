"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Package, CheckCircle2, Sparkles,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    ShoppingBag, ChevronRight, Eye, X, Star
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"
import { SpotifyIcon } from "@/components/icons/SpotifyIcon"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ItemType = "AVATAR_FRAME" | "PROFILE_BANNER" | "MEMORY_CARD_THEME" | "USERNAME_DECORATION" | "MEMORY_STICKER" | "PREMIUM_FEATURE"

type InventoryItem = {
    id: string          // inventory record id
    isEquipped: boolean
    item: {
        id: string
        name: string
        description: string
        price: number
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
    PREMIUM_FEATURE:    "Fitur Premium",
}

const TYPE_SHORT_LABELS: Record<ItemType, string> = {
    AVATAR_FRAME:       "Bingkai Avatar",
    PROFILE_BANNER:     "Banner Profil",
    MEMORY_CARD_THEME:  "Tema Kartu",
    USERNAME_DECORATION:"Dekorasi Nama",
    MEMORY_STICKER:     "Stiker",
    PREMIUM_FEATURE:    "Premium",
}

const TYPE_ICONS: Record<ItemType, React.FC<any>> = {
    AVATAR_FRAME:       User,
    PROFILE_BANNER:     ImageIcon,
    MEMORY_CARD_THEME:  Grid2x2,
    USERNAME_DECORATION:Type,
    MEMORY_STICKER:     Sticker,
    PREMIUM_FEATURE:    SpotifyIcon,
}

const TYPE_COLORS: Record<ItemType, { bg: string; border: string; text: string; accent: string; pill: string; pillText: string }> = {
    AVATAR_FRAME:       { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.2)",  text: "#818cf8", accent: "#6366f1", pill: "rgba(99,102,241,0.18)", pillText: "#a5b4fc" },
    PROFILE_BANNER:     { bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.2)", text: "#f472b6", accent: "#ec4899", pill: "rgba(244,114,182,0.18)", pillText: "#f9a8d4" },
    MEMORY_CARD_THEME:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  text: "#34d399", accent: "#10b981", pill: "rgba(52,211,153,0.18)", pillText: "#6ee7b7" },
    USERNAME_DECORATION:{ bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)",  text: "#fbbf24", accent: "#f59e0b", pill: "rgba(251,191,36,0.18)", pillText: "#fcd34d" },
    MEMORY_STICKER:     { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  text: "#a78bfa", accent: "#8b5cf6", pill: "rgba(139,92,246,0.18)", pillText: "#c4b5fd" },
    PREMIUM_FEATURE:    { bg: "rgba(29,185,84,0.1)",   border: "rgba(29,185,84,0.2)",   text: "#1DB954", accent: "#1DB954", pill: "rgba(29,185,84,0.18)",  pillText: "#4ade80" },
}

const ALL_TYPES: ItemType[] = [
    "AVATAR_FRAME",
    "PROFILE_BANNER",
    "MEMORY_CARD_THEME",
    "USERNAME_DECORATION",
    "MEMORY_STICKER",
    "PREMIUM_FEATURE",
]

const NON_EQUIPPABLE: ItemType[] = ["MEMORY_STICKER", "PREMIUM_FEATURE"]

// ─── Tier System ───────────────────────────────────────────────────────────────

type TierName = "BASIC" | "ELITE" | "EPIC" | "LEGEND" | "SPECIAL"

const TIER_CONFIG: Record<TierName, {
    label: string
    icon: string
    color: string
    glow: string
    bg: string
    border: string
}> = {
    BASIC: {
        label: "Basic",
        icon: "◆",
        color: "#94a3b8",
        glow: "rgba(148,163,184,0.25)",
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.2)",
    },
    ELITE: {
        label: "Elite",
        icon: "◈",
        color: "#818cf8",
        glow: "rgba(99,102,241,0.3)",
        bg: "rgba(99,102,241,0.1)",
        border: "rgba(99,102,241,0.25)",
    },
    EPIC: {
        label: "Epic",
        icon: "✦",
        color: "#f472b6",
        glow: "rgba(236,72,153,0.35)",
        bg: "rgba(236,72,153,0.1)",
        border: "rgba(236,72,153,0.25)",
    },
    LEGEND: {
        label: "Legend",
        icon: "★",
        color: "#fbbf24",
        glow: "rgba(245,158,11,0.4)",
        bg: "rgba(245,158,11,0.1)",
        border: "rgba(245,158,11,0.3)",
    },
    SPECIAL: {
        label: "Special",
        icon: "✧",
        color: "#2dd4bf",
        glow: "rgba(45,212,191,0.4)",
        bg: "rgba(45,212,191,0.1)",
        border: "rgba(45,212,191,0.3)",
    },
}

const SPECIAL_ITEM_NAMES = new Set(["Cuddlysun", "Shape Coquette", "Grape Blossom", "Soft Bubble Tea"])

function getTier(price: number, name?: string): TierName {
    if (name && SPECIAL_ITEM_NAMES.has(name)) return "SPECIAL"
    if (price <= 100) return "BASIC"
    if (price <= 175) return "ELITE"
    if (price <= 275) return "EPIC"
    return "LEGEND"
}

function TierBadge({ price, size = "sm", name }: { price: number; size?: "sm" | "md"; name?: string }) {
    const tier = getTier(price, name)
    const cfg = TIER_CONFIG[tier]
    const isLegend = tier === "LEGEND"
    const isSpecial = tier === "SPECIAL"

    return (
        <span
            className="inline-flex items-center gap-0.5 font-black uppercase tracking-wider"
            style={{
                fontSize: size === "md" ? "10px" : "9px",
                padding: size === "md" ? "3px 8px" : "2px 6px",
                borderRadius: "6px",
                background: isSpecial
                    ? "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(20,184,166,0.08))"
                    : isLegend
                        ? "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))"
                        : cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                boxShadow: (isLegend || isSpecial) ? `0 0 8px -2px ${cfg.glow}` : "none",
            }}
        >
            <span style={{ fontSize: size === "md" ? "9px" : "8px" }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    )
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

// ─── Card Theme Preview ─────────────────────────────────────────────────────────

function CardThemePreview({ value, name }: { value: string; name?: string }) {
    let theme: any = null
    try { theme = JSON.parse(value) } catch { }
    const cc = getCardThemeClass(name)
    return (
        <div
            className={`relative w-full h-full rounded-xl overflow-hidden flex flex-col justify-end ${cc}`}
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
            className={`w-full h-full rounded-xl overflow-hidden relative ${bannerClass}`}
            style={{ background: bg }}
        >
            <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            {isGalaxy && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="480" cy="55" rx="180" ry="55" fill="rgba(180,100,255,0.18)" className="nebula-drift" style={{ filter: "blur(20px)" }} />
                    <ellipse cx="160" cy="95" rx="140" ry="40" fill="rgba(80,120,255,0.15)" className="nebula-drift" style={{ animationDelay: "-6s", filter: "blur(18px)" }} />
                    <ellipse cx="670" cy="110" rx="120" ry="35" fill="rgba(150,60,255,0.12)" className="nebula-drift" style={{ animationDelay: "-10s", filter: "blur(16px)" }} />
                    <circle cx="30"  cy="12" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "2.1s", "--r0": "1.5", "--r1": "2.5" } as any} />
                    <circle cx="95"  cy="25" r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "1.7s", "--r0": "1.0", "--r1": "2.0" } as any} />
                    <circle cx="160" cy="8"  r="1.6" fill="white" className="star-twinkle" style={{ "--dur": "2.8s", "--r0": "1.2", "--r1": "2.2" } as any} />
                    <circle cx="230" cy="40" r="1.1" fill="#aad4ff" className="star-twinkle" style={{ "--dur": "1.5s", "--r0": "0.9", "--r1": "1.6" } as any} />
                    <circle cx="290" cy="18" r="1.4" fill="white" className="star-twinkle" style={{ "--dur": "2.4s", "--r0": "1.1", "--r1": "2.0" } as any} />
                    <circle cx="350" cy="55" r="1.0" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "1.9s", "--r0": "0.8", "--r1": "1.5" } as any} />
                    <circle cx="410" cy="10" r="1.7" fill="white" className="star-twinkle" style={{ "--dur": "3.0s", "--r0": "1.3", "--r1": "2.3" } as any} />
                    <circle cx="470" cy="30" r="1.2" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.2s", "--r0": "1.0", "--r1": "1.8" } as any} />
                    <circle cx="530" cy="15" r="1.5" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "1.2", "--r1": "2.1" } as any} />
                    <circle cx="590" cy="48" r="1.0" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.6s", "--r0": "0.8", "--r1": "1.5" } as any} />
                    <circle cx="650" cy="20" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "1.4s", "--r0": "1.4", "--r1": "2.4" } as any} />
                    <circle cx="710" cy="9"  r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.9s", "--r0": "1.0", "--r1": "1.9" } as any} />
                    <circle cx="770" cy="35" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "2.0s", "--r0": "0.9", "--r1": "1.6" } as any} />
                    <circle cx="55"  cy="80" r="1.0" fill="white" className="star-twinkle" style={{ "--dur": "1.8s", "--r0": "0.8", "--r1": "1.4" } as any} />
                    <circle cx="200" cy="100" r="1.4" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "2.5s", "--r0": "1.1", "--r1": "2.0" } as any} />
                    <circle cx="370" cy="90" r="1.2" fill="white" className="star-twinkle" style={{ "--dur": "1.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
                    <circle cx="500" cy="115" r="1.5" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.7s", "--r0": "1.2", "--r1": "2.2" } as any} />
                    <circle cx="680" cy="95" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "0.9", "--r1": "1.6" } as any} />
                    <circle cx="785" cy="120" r="1.3" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
                </svg>
            )}
            {isSamudra && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <defs><filter id="blur-aurora-inv"><feGaussianBlur stdDeviation="8" /></filter></defs>
                    <rect x="-20" y="15" width="840" height="32" rx="16" fill="rgba(120,60,255,0.28)" className="aurora-wave" filter="url(#blur-aurora-inv)"
                        style={{ "--dur": "7s", "--op0": "0.25", "--op1": "0.55" } as any} />
                    <rect x="-20" y="52" width="840" height="22" rx="11" fill="rgba(60,180,255,0.22)" className="aurora-wave" filter="url(#blur-aurora-inv)"
                        style={{ "--dur": "5.5s", "--op0": "0.2", "--op1": "0.5", animationDelay: "-2s" } as any} />
                    <rect x="-20" y="80" width="840" height="24" rx="12" fill="rgba(200,50,255,0.18)" className="aurora-wave" filter="url(#blur-aurora-inv)"
                        style={{ "--dur": "9s", "--op0": "0.15", "--op1": "0.4", animationDelay: "-4s" } as any} />
                    {[[20,10,1.8,"#fff","2.0s"],[80,5,1.4,"#aaddff","1.4s"],[145,18,2.0,"#fff","2.6s"],[205,8,1.2,"#ddbbff","1.8s"],[260,22,1.7,"#fff","1.2s"],[320,12,1.5,"#aaddff","2.3s"],[380,7,2.1,"#fff","0.9s"],[440,25,1.3,"#ffccee","1.7s"],[500,10,1.6,"#fff","2.1s"],[560,20,1.1,"#cceeff","1.5s"],[620,6,1.8,"#fff","2.8s"],[680,15,1.4,"#ddbbff","1.1s"],[740,8,1.7,"#fff","1.9s"],[790,22,1.0,"#aaddff","2.4s"],[50,90,1.3,"#fff","1.6s"],[130,105,1.5,"#ffccee","0.8s"],[220,95,1.1,"#fff","2.2s"],[310,110,1.8,"#ccddff","1.3s"],[400,100,1.4,"#fff","2.7s"],[490,115,1.2,"#aaddff","1.0s"],[580,95,1.6,"#fff","2.5s"],[670,108,1.3,"#ffccee","1.8s"],[760,100,1.0,"#fff","1.2s"],[110,50,1.4,"#fff","2.1s"],[350,65,1.2,"#ddbbff","1.6s"],[600,55,1.5,"#fff","2.4s"]].map(([cx,cy,r,fill,dur],i) => (
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

// ─── Frame Preview ──────────────────────────────────────────────────────────────

function FramePreview({ value, name }: { value: string; name?: string }) {
    const fc = getFrameClass(name)
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
                {fc && (
                    <div className={`absolute -inset-3 rounded-full ${fc}-glow`}
                        style={{ background: value, filter: "blur(14px)", opacity: 0.4 }} />
                )}
                <div className={`absolute -inset-1 rounded-full p-[2px] ${fc}`} style={{ background: value }}>
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
        <div className="flex items-center justify-center">
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
        <div className="flex items-center justify-center" style={{ transform: `rotate(${cfg.defaultRotation}deg)` }}>
            <StickerRenderer config={cfg} />
        </div>
    )
}

// ─── Premium Feature Preview ───────────────────────────────────────────────────

function PremiumFeaturePreview({ item }: { item: InventoryItem["item"] }) {
    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-[#1DB954]/20 rounded-2xl blur-lg" />
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                        background: "linear-gradient(135deg, rgba(29,185,84,0.2), rgba(29,185,84,0.05))",
                        border: "1px solid rgba(29,185,84,0.3)"
                    }}>
                    <SpotifyIcon className="w-8 h-8 text-[#1DB954]" />
                </div>
            </div>
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
            className="relative flex flex-col rounded-2xl overflow-hidden group inventory-card"
            style={{
                background: isEquipped
                    ? `linear-gradient(160deg, ${color.bg}, rgba(10,10,16,0.9))`
                    : "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                border: isEquipped
                    ? `1px solid ${color.border}`
                    : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isEquipped ? `0 0 20px -5px ${color.accent}30` : "none",
                transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
            }}
        >
            {/* Equipped badge — compact, type-colored */}
            {isEquipped && (
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

            {/* Preview area — fixed height so all cards align */}
            <div
                className="px-4 pt-4 pb-2 cursor-pointer h-32 flex items-center justify-center"
                onClick={() => onPreview(entry)}
            >
                <div className="w-full h-full flex items-center justify-center">
                    {item.type === "AVATAR_FRAME"        && <FramePreview value={item.value} name={item.name} />}
                    {item.type === "PROFILE_BANNER"      && <BannerPreview value={item.value} name={item.name} />}
                    {item.type === "MEMORY_CARD_THEME"   && <CardThemePreview value={item.value} name={item.name} />}
                    {item.type === "USERNAME_DECORATION" && <DecorationPreview item={item} />}
                    {item.type === "MEMORY_STICKER"      && <StickerPreview item={item} />}
                    {item.type === "PREMIUM_FEATURE"     && <PremiumFeaturePreview item={item} />}
                </div>
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
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-bold text-white leading-tight flex-1 min-w-0 truncate">{item.name}</p>
                        <TierBadge price={item.price} size="sm" name={item.name} />
                    </div>
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
                                    ? `${color.accent}14`
                                    : "rgba(255,255,255,0.04)",
                                border: isEquipped
                                    ? `1px solid ${color.accent}40`
                                    : "1px solid rgba(255,255,255,0.08)",
                                color: isEquipped ? color.text : "#9ca3af",
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
                                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Dipakai</>
                                        : <><Star className="w-3.5 h-3.5" /> Pakai</>
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
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: color.text }}>
                                    {TYPE_LABELS[item.type]}
                                </p>
                                <TierBadge price={item.price} size="md" name={item.name} />
                            </div>
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
                        {item.type === "AVATAR_FRAME"        && <div className="scale-150"><FramePreview value={item.value} name={item.name} /></div>}
                        {item.type === "PROFILE_BANNER"      && <div className="w-full px-4 h-24 sm:h-32"><BannerPreview value={item.value} name={item.name} /></div>}
                        {item.type === "MEMORY_CARD_THEME"   && <div className="w-full px-4 h-32 sm:h-40"><CardThemePreview value={item.value} name={item.name} /></div>}
                        {item.type === "USERNAME_DECORATION" && <DecorationPreview item={item} />}
                        {item.type === "MEMORY_STICKER"      && <StickerPreview item={item} />}
                        {item.type === "PREMIUM_FEATURE"     && <PremiumFeaturePreview item={item} />}
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
                            {item.type === "PREMIUM_FEATURE" ? "Fitur Premium Aktif" : "Stiker bisa ditempel langsung di kenangan"}
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

    const equippedItems = filtered.filter(e => e.isEquipped)
    const collectionItems = filtered.filter(e => !e.isEquipped)

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

            {/* ── Hover lift style ── */}
            <style jsx global>{`
                .inventory-card {
                    transform: translateY(0);
                }
                .inventory-card:hover {
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
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">Inventori</h1>
                                {/* Mobile Shop Button */}
                                <Link
                                    href="/shop"
                                    className="sm:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-95"
                                    style={{
                                        background: "rgba(251,191,36,0.1)",
                                        border: "1px solid rgba(251,191,36,0.2)",
                                        color: "#fbbf24",
                                    }}
                                    title="Ke Memory Shop"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <p className="text-[13px] text-neutral-500 mt-1">
                                Koleksi dekorasi profil kamu
                            </p>
                        </div>
                    </div>

                    {/* Desktop Shop Button */}
                    <Link
                        href="/shop"
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
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
                        {inventory.length} item dimiliki
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
                        {equippedCount} sedang dipakai
                    </span>
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
                >
                    {/* Sedang Dipakai Section */}
                    {equippedItems.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 mb-8">
                                <SectionDivider
                                    label="Sedang Dipakai"
                                    count={equippedItems.length}
                                    color="#4ade80"
                                />
                                <AnimatePresence mode="popLayout">
                                    {equippedItems.map(entry => (
                                        <InventoryCard
                                            key={entry.id}
                                            entry={entry}
                                            onEquip={handleEquip}
                                            onPreview={setPreviewEntry}
                                            equipping={equipping}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </>
                    )}

                    {/* Koleksi Lainnya Section */}
                    {collectionItems.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
                            <SectionDivider
                                label="Koleksi Lainnya"
                                count={collectionItems.length}
                                color="#818cf8"
                            />
                            <AnimatePresence mode="popLayout">
                                {collectionItems.map(entry => (
                                    <InventoryCard
                                        key={entry.id}
                                        entry={entry}
                                        onEquip={handleEquip}
                                        onPreview={setPreviewEntry}
                                        equipping={equipping}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
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
