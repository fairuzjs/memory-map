"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, ShoppingBag, Sparkles, CheckCircle2, Star,
    User, Image as ImageIcon, Grid2x2, Type, Sticker,
    Package, ChevronRight, Eye, X, Zap, Coins, Music
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"
import { SpotifyIcon } from "@/components/icons/SpotifyIcon"

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
    "PREMIUM_FEATURE",
    "AVATAR_FRAME",
    "PROFILE_BANNER",
    "MEMORY_CARD_THEME",
    "USERNAME_DECORATION",
    "MEMORY_STICKER",
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
    shimmer: string
}> = {
    BASIC: {
        label: "Basic",
        icon: "◆",
        color: "#94a3b8",
        glow: "rgba(148,163,184,0.25)",
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.2)",
        shimmer: "#cbd5e1",
    },
    ELITE: {
        label: "Elite",
        icon: "◈",
        color: "#818cf8",
        glow: "rgba(99,102,241,0.3)",
        bg: "rgba(99,102,241,0.1)",
        border: "rgba(99,102,241,0.25)",
        shimmer: "#a5b4fc",
    },
    EPIC: {
        label: "Epic",
        icon: "✦",
        color: "#f472b6",
        glow: "rgba(236,72,153,0.35)",
        bg: "rgba(236,72,153,0.1)",
        border: "rgba(236,72,153,0.25)",
        shimmer: "#f9a8d4",
    },
    LEGEND: {
        label: "Legend",
        icon: "★",
        color: "#fbbf24",
        glow: "rgba(245,158,11,0.4)",
        bg: "rgba(245,158,11,0.1)",
        border: "rgba(245,158,11,0.3)",
        shimmer: "#fde68a",
    },
    SPECIAL: {
        label: "Special",
        icon: "✧",
        color: "#2dd4bf",
        glow: "rgba(45,212,191,0.4)",
        bg: "rgba(45,212,191,0.1)",
        border: "rgba(45,212,191,0.3)",
        shimmer: "#5eead4",
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
            className="inline-flex items-center gap-0.5 font-black uppercase tracking-wider relative overflow-hidden"
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

            {/* ── Galaxy Dalam overlay: twinkling stars + drifting nebula ── */}
            {isGalaxy && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Nebula blobs spread across full width */}
                    <ellipse cx="480" cy="55" rx="180" ry="55" fill="rgba(180,100,255,0.18)" className="nebula-drift" style={{ filter: "blur(20px)" }} />
                    <ellipse cx="160" cy="95" rx="140" ry="40" fill="rgba(80,120,255,0.15)" className="nebula-drift" style={{ animationDelay: "-6s", filter: "blur(18px)" }} />
                    <ellipse cx="670" cy="110" rx="120" ry="35" fill="rgba(150,60,255,0.12)" className="nebula-drift" style={{ animationDelay: "-10s", filter: "blur(16px)" }} />
                    {/* Stars spread across 800x140 */}
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
                    <circle cx="200" cy="100"r="1.4" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "2.5s", "--r0": "1.1", "--r1": "2.0" } as any} />
                    <circle cx="370" cy="90" r="1.2" fill="white" className="star-twinkle" style={{ "--dur": "1.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
                    <circle cx="500" cy="115"r="1.5" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.7s", "--r0": "1.2", "--r1": "2.2" } as any} />
                    <circle cx="680" cy="95" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "0.9", "--r1": "1.6" } as any} />
                    <circle cx="785" cy="120"r="1.3" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
                </svg>
            )}

            {/* ── Samudra Bintang overlay: aurora waves + dense shimmering stars ── */}
            {isSamudra && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <filter id="blur-aurora"><feGaussianBlur stdDeviation="8" /></filter>
                    </defs>
                    {/* Aurora wave bands spanning full width */}
                    <rect x="-20" y="15" width="840" height="32" rx="16" fill="rgba(120,60,255,0.28)" className="aurora-wave" filter="url(#blur-aurora)"
                        style={{ "--dur": "7s", "--op0": "0.25", "--op1": "0.55" } as any} />
                    <rect x="-20" y="52" width="840" height="22" rx="11" fill="rgba(60,180,255,0.22)" className="aurora-wave" filter="url(#blur-aurora)"
                        style={{ "--dur": "5.5s", "--op0": "0.2", "--op1": "0.5", animationDelay: "-2s" } as any} />
                    <rect x="-20" y="80" width="840" height="24" rx="12" fill="rgba(200,50,255,0.18)" className="aurora-wave" filter="url(#blur-aurora)"
                        style={{ "--dur": "9s", "--op0": "0.15", "--op1": "0.4", animationDelay: "-4s" } as any} />
                    {/* Dense bright stars spread across 800x140 */}
                    {[
                        [20,  10, 1.8, "#fff",    "2.0s"],
                        [80,  5,  1.4, "#aaddff", "1.4s"],
                        [145, 18, 2.0, "#fff",    "2.6s"],
                        [205, 8,  1.2, "#ddbbff", "1.8s"],
                        [260, 22, 1.7, "#fff",    "1.2s"],
                        [320, 12, 1.5, "#aaddff", "2.3s"],
                        [380, 7,  2.1, "#fff",    "0.9s"],
                        [440, 25, 1.3, "#ffccee", "1.7s"],
                        [500, 10, 1.6, "#fff",    "2.1s"],
                        [560, 20, 1.1, "#cceeff", "1.5s"],
                        [620, 6,  1.8, "#fff",    "2.8s"],
                        [680, 15, 1.4, "#ddbbff", "1.1s"],
                        [740, 8,  1.7, "#fff",    "1.9s"],
                        [790, 22, 1.0, "#aaddff", "2.4s"],
                        [50,  90, 1.3, "#fff",    "1.6s"],
                        [130, 105,1.5, "#ffccee", "0.8s"],
                        [220, 95, 1.1, "#fff",    "2.2s"],
                        [310, 110,1.8, "#ccddff", "1.3s"],
                        [400, 100,1.4, "#fff",    "2.7s"],
                        [490, 115,1.2, "#aaddff", "1.0s"],
                        [580, 95, 1.6, "#fff",    "2.5s"],
                        [670, 108,1.3, "#ffccee", "1.8s"],
                        [760, 100,1.0, "#fff",    "1.2s"],
                        [110, 50, 1.4, "#fff",    "2.1s"],
                        [350, 65, 1.2, "#ddbbff", "1.6s"],
                        [600, 55, 1.5, "#fff",    "2.4s"],
                    ].map(([cx, cy, r, fill, dur], i) => (
                        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string}
                            className="star-shimmer" style={{ "--dur": dur } as any} />
                    ))}
                </svg>
            )}

            {/* ── Hutan Digital overlay: equalizer bars ── */}
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

// ─── Decoration Preview ─────────────────────────────────────────────────────────

function DecorationPreview({ item }: { item: ShopItem }) {
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

function StickerPreview({ item }: { item: ShopItem }) {
    let cfg: StickerConfig | null = null
    try { cfg = JSON.parse(item.value) } catch { }
    if (!cfg) return <div className="w-10 h-10 rounded-xl" style={{ background: item.previewColor ?? "#6366f1" }} />
    return (
        <div className="flex items-center justify-center" style={{ transform: `rotate(${cfg.defaultRotation}deg)` }}>
            <StickerRenderer config={cfg} />
        </div>
    )
}
// ─── Premium Feature Preview ────────────────────────────────────────────────────

function PremiumFeaturePreview({ item }: { item: ShopItem }) {
    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-[#1DB954]/20 rounded-xl blur-lg" />
                <div
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, rgba(29,185,84,0.2), rgba(29,185,84,0.05))",
                        border: "1px solid rgba(29,185,84,0.3)",
                    }}
                >
                    <SpotifyIcon className="w-6 h-6 text-[#1DB954]" />
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

            {/* Preview area — fixed height so all cards align */}
            <div
                className="px-4 pt-4 pb-2 cursor-pointer h-32 flex items-center justify-center"
                onClick={() => onPreview(item)}
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
                        {item.type === "AVATAR_FRAME" && (() => {
                            const fc = getFrameClass(item.name)
                            return (
                                <div className="relative">
                                    <div className={`absolute -inset-4 rounded-full ${fc ? `${fc}-glow` : 'animate-pulse'}`} style={{ background: item.value, filter: "blur(20px)", opacity: 0.5 }} />
                                    <div className={`absolute -inset-1.5 rounded-full p-[5px] ${fc}`} style={{ background: item.value }}>
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
                            )
                        })()}
                        {item.type === "PROFILE_BANNER" && <div className="w-full px-4 h-24 sm:h-32"><BannerPreview value={item.value} name={item.name} /></div>}
                        {item.type === "MEMORY_CARD_THEME" && <div className="w-full px-4 h-32 sm:h-40"><CardThemePreview value={item.value} name={item.name} /></div>}
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
                        {item.type === "PREMIUM_FEATURE" && (
                            <div className="flex flex-col items-center gap-3 z-10 py-2">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#1DB954]/30 rounded-full blur-xl animate-pulse" />
                                    <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                                        style={{ background: "linear-gradient(135deg, rgba(29,185,84,0.2), rgba(29,185,84,0.05))", border: "1px solid rgba(29,185,84,0.3)" }}>
                                        <SpotifyIcon className="w-8 h-8 text-[#1DB954]" />
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-500 text-center max-w-[200px]">
                                    {item.description}
                                </p>
                            </div>
                        )}
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
                            {item.type === "PREMIUM_FEATURE" ? "Fitur Premium Aktif" : "Stiker bisa ditempel di foto kenangan"}
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

                {/* Promo / Action Banners */}
                {/* Promo / Action Banners */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mt-6">
                    {/* Topup Banner */}
                    <Link
                        href="/topup"
                        className="flex items-center gap-2.5 sm:gap-3 p-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl group transition-all relative overflow-hidden"
                        style={{
                            background: "linear-gradient(135deg, rgba(251,191,36,0.07), rgba(245,158,11,0.03))",
                            border: "1px solid rgba(251,191,36,0.2)",
                        }}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border" style={{ background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.3)" }}>
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] sm:text-sm font-black text-amber-400 truncate">Topup <span className="hidden sm:inline">Poin</span></p>
                            <p className="hidden sm:block text-xs text-neutral-500 truncate mt-0.5">Tambah poin mu disini</p>
                        </div>
                        <div className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center bg-white/5 text-amber-500/50 group-hover:text-amber-400 group-hover:bg-amber-400/20 transition-all shrink-0">
                            <ChevronRight className="w-1.5 h-1.5 sm:w-2 sm:h-2" style={{ transform: "scale(2.5)" }} />
                        </div>
                    </Link>

                    {/* Mystery Box Banner */}
                    <Link
                        href="/gacha"
                        className="flex items-center gap-2.5 sm:gap-3 p-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl group transition-all relative overflow-hidden"
                        style={{
                            background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.05))",
                            border: "1px solid rgba(139,92,246,0.25)",
                        }}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border" style={{ background: "rgba(139,92,246,0.2)", borderColor: "rgba(139,92,246,0.3)" }}>
                            <span className="text-base sm:text-lg group-hover:rotate-12 transition-transform">🎲</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] sm:text-sm font-black text-purple-400 truncate">Gacha <span className="hidden sm:inline">Box</span></p>
                            <p className="hidden sm:block text-xs text-neutral-500 truncate mt-0.5">Uji keberuntunganmu untuk mendapatkan item langka</p>
                        </div>
                        <div className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center bg-white/5 text-purple-500/50 group-hover:text-purple-400 group-hover:bg-purple-400/20 transition-all shrink-0">
                            <ChevronRight className="w-1.5 h-1.5 sm:w-2 sm:h-2" style={{ transform: "scale(2.5)" }} />
                        </div>
                    </Link>
                </div>
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