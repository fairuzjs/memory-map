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
    MEMORY_CARD_THEME:  "Tema Kartu",
    USERNAME_DECORATION:"Dekorasi Nama",
    MEMORY_STICKER:     "Stiker",
    PREMIUM_FEATURE:    "Fitur Premium",
}

const TYPE_SHORT_LABELS: Record<ItemType, string> = {
    AVATAR_FRAME:       "Bingkai",
    PROFILE_BANNER:     "Banner",
    MEMORY_CARD_THEME:  "Kartu",
    USERNAME_DECORATION:"Nama",
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

const TYPE_COLORS: Record<ItemType, { bg: string; text: string }> = {
    AVATAR_FRAME:       { bg: "#FFFF00", text: "#000" }, // Yellow
    PROFILE_BANNER:     { bg: "#FF00FF", text: "#FFF" }, // Pink
    MEMORY_CARD_THEME:  { bg: "#00FFFF", text: "#000" }, // Cyan
    USERNAME_DECORATION:{ bg: "#FF9900", text: "#000" }, // Orange
    MEMORY_STICKER:     { bg: "#00FF00", text: "#000" }, // Green
    PREMIUM_FEATURE:    { bg: "#1DB954", text: "#FFF" }, // Spotify Green
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

type TierName = "BASIC" | "ELITE" | "EPIC" | "LEGEND" | "SPECIAL" | "PREMIUM"

const TIER_CONFIG: Record<TierName, {
    label: string
    icon: string
    bg: string
    text: string
}> = {
    BASIC:   { label: "Basic",   icon: "◆", bg: "#E5E5E5", text: "#000" },
    ELITE:   { label: "Elite",   icon: "◈", bg: "#00FFFF", text: "#000" },
    EPIC:    { label: "Epic",    icon: "✦", bg: "#FF00FF", text: "#FFF" },
    LEGEND:  { label: "Legend",  icon: "★", bg: "#FFFF00", text: "#000" },
    SPECIAL: { label: "Special", icon: "✧", bg: "#00FF00", text: "#000" },
    PREMIUM: { label: "Premium", icon: "👑", bg: "#FFD700", text: "#000" },
}

const SPECIAL_ITEM_NAMES = new Set(["Cuddlysun", "Shape Coquette", "Grape Blossom", "Soft Bubble Tea"])
const PREMIUM_ITEM_NAMES = new Set(["Mahkota Royale", "Langit Kerajaan"])

function getTier(price: number, name?: string): TierName {
    if (name && PREMIUM_ITEM_NAMES.has(name)) return "PREMIUM"
    if (name && SPECIAL_ITEM_NAMES.has(name)) return "SPECIAL"
    if (price <= 100) return "BASIC"
    if (price <= 175) return "ELITE"
    if (price <= 275) return "EPIC"
    return "LEGEND"
}

function TierBadge({ price, size = "sm", name }: { price: number; size?: "sm" | "md"; name?: string }) {
    const tier = getTier(price, name)
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

function getDecorationClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("kristal")) return "anim-kristal"
    if (n.includes("api")) return "anim-api"
    if (n.includes("neon")) return "anim-neon"
    if (n.includes("emas")) return "anim-emas"
    if (n.includes("pelangi")) return "anim-pelangi"
    if (n.includes("glitch")) return "anim-glitch"
    if (n.includes("quasar")) return "anim-quasar"
    if (n.includes("celestial")) return "anim-celestial"
    if (n.includes("supernova")) return "anim-supernova"
    if (n.includes("rune")) return "anim-rune"
    return ""
}

function getFrameClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("mahkota")) return "anim-frame-mahkota"
    if (n.includes("orbit")) return "anim-frame-orbit"
    if (n.includes("fraktur")) return "anim-frame-fraktur"
    if (n.includes("singularitas")) return "anim-frame-singularitas"
    if (n.includes("cakra")) return "anim-frame-cakra"
    if (n.includes("eternum")) return "anim-frame-eternum"
    return ""
}

function getBannerClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("kerajaan")) return "anim-banner-kerajaan"
    if (n.includes("galaxy")) return "anim-banner-galaxy"
    if (n.includes("hutan")) return "anim-banner-matrix"
    if (n.includes("samudra")) return "anim-banner-samudra"
    return ""
}

function getCardThemeClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("perkamen")) return "anim-card-perkamen"
    if (n.includes("neon")) return "anim-card-neon"
    if (n.includes("mistik")) return "anim-card-mistik"
    if (n.includes("void")) return "anim-card-void"
    if (n.includes("eter")) return "anim-card-eter"
    return ""
}

// ─── Previews ─────────────────────────────────────────────────────────────────

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

function BannerPreview({ value, name }: { value: string; name?: string }) {
    const bannerClass = getBannerClass(name)
    const n = name?.toLowerCase() ?? ""
    const isHutan   = n.includes("hutan")
    const isGalaxy  = n.includes("galax")
    const isSamudra = n.includes("samudra")
    const isKerajaan= n.includes("kerajaan")
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
            {isKerajaan && (
                <>
                    <div className="absolute inset-0" style={{
                        backgroundImage: "linear-gradient(rgba(255,215,0,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(255,215,0,0.08) 2px, transparent 2px)",
                        backgroundSize: "16px 16px",
                    }} />
                    <div className="absolute top-[18%] left-0 right-0 h-[4px] neoban-stripe-pulse" style={{ background: "#ffd700", boxShadow: "0 2px 0 #000" }} />
                    <div className="absolute bottom-[22%] left-0 right-0 h-[3px] neoban-stripe-pulse" style={{ background: "#b8860b", boxShadow: "0 1px 0 #000", animationDelay: "1s" }} />
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center neoban-crown-pulse" style={{
                        background: "#ffd700", border: "2px solid #000", boxShadow: "2px 2px 0 #000",
                    }}>
                        <span className="text-sm select-none">👑</span>
                    </div>
                    <div className="absolute top-[15%] left-[10%] w-5 h-5 neoban-float-a" style={{ background: "#ffd700", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }} />
                    <div className="absolute top-[12%] right-[12%] w-4 h-4 neoban-spin-slow" style={{ background: "#b8860b", border: "2px solid #000", boxShadow: "2px 2px 0 #000" }} />
                    <div className="absolute top-[68%] left-[50%] -translate-x-1/2 px-1.5 py-px neoban-stamp-glow" style={{ background: "#000", border: "1px solid #ffd700" }}>
                        <span className="text-[5px] font-black tracking-[0.15em] uppercase" style={{ color: "#ffd700" }}>★ PREMIUM ★</span>
                    </div>
                    <div className="absolute top-[10%] left-[35%] text-[8px] font-black select-none neoban-twinkle" style={{ color: "#ffd700", textShadow: "1px 1px 0 #000" }}>✦</div>
                    <div className="absolute bottom-[30%] right-[20%] text-[7px] font-black select-none neoban-twinkle" style={{ color: "#fff5cc", textShadow: "1px 1px 0 #000", animationDelay: "1.2s" }}>✦</div>
                </>
            )}
        </div>
    )
}

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

function DecorationPreview({ item }: { item: InventoryItem["item"] | { name: string, value: string } }) {
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

function StickerPreview({ item }: { item: InventoryItem["item"] | { value: string, previewColor?: string | null } }) {
    let cfg: StickerConfig | null = null
    try { cfg = JSON.parse(item.value) } catch { }
    if (!cfg) return <div className="w-10 h-10 rounded-xl" style={{ background: item.previewColor ?? "#6366f1" }} />
    return (
        <div className="flex items-center justify-center" style={{ transform: `rotate(${cfg.defaultRotation}deg)` }}>
            <StickerRenderer config={cfg} />
        </div>
    )
}

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
        <div className="flex items-center gap-3 w-full col-span-full mt-4 mb-2">
            <span className="text-[14px] font-black uppercase tracking-[0.1em] shrink-0 px-3 py-1 border-[3px] border-black bg-white shadow-[2px_2px_0_#000]">
                {label}
            </span>
            <div className="flex-1 h-[4px] bg-black" />
            <span className="text-[12px] font-black px-3 py-1 shrink-0 border-[3px] border-black bg-[#00FFFF] shadow-[2px_2px_0_#000]">
                {count} ITEM
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
    const colorInfo = TYPE_COLORS[item.type]
    const isNonEquip = NON_EQUIPPABLE.includes(item.type)
    const isEquipping = equipping === item.id

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex flex-col bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all group overflow-hidden"
        >
            {/* Equipped badge */}
            {isEquipped && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#00FF00] border-[2px] border-black shadow-[2px_2px_0_#000]">
                    <CheckCircle2 className="w-3 h-3" />
                    DIPAKAI
                </div>
            )}

            {/* Preview area */}
            <div
                className="p-3 cursor-pointer h-32 flex items-center justify-center border-b-[3px] border-black bg-neutral-100"
                onClick={() => onPreview(entry)}
            >
                <div className="w-full h-full flex items-center justify-center relative">
                    {item.type === "AVATAR_FRAME"        && <FramePreview value={item.value} name={item.name} />}
                    {item.type === "PROFILE_BANNER"      && <BannerPreview value={item.value} name={item.name} />}
                    {item.type === "MEMORY_CARD_THEME"   && <CardThemePreview value={item.value} name={item.name} />}
                    {item.type === "USERNAME_DECORATION" && <DecorationPreview item={item} />}
                    {item.type === "MEMORY_STICKER"      && <StickerPreview item={item} />}
                    {item.type === "PREMIUM_FEATURE"     && <PremiumFeaturePreview item={item} />}
                </div>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-3 flex-1 bg-white">
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase border-[2px] border-black"
                            style={{ background: colorInfo.bg, color: colorInfo.text }}
                        >
                            {(() => {
                                const Icon = TYPE_ICONS[item.type]
                                return <Icon className="w-2.5 h-2.5" />
                            })()}
                            {TYPE_SHORT_LABELS[item.type]}
                        </span>
                        <TierBadge price={item.price} size="sm" name={item.name} />
                    </div>
                    <p className="text-[13px] font-black text-black leading-tight line-clamp-1">{item.name}</p>
                    <p className="text-[10px] font-bold text-black/60 mt-1 leading-snug line-clamp-2">{item.description}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t-[3px] border-black">
                    <button
                        onClick={() => onPreview(entry)}
                        className="w-10 h-10 flex items-center justify-center shrink-0 bg-white border-[3px] border-black shadow-[2px_2px_0_#000] hover:bg-[#FFFF00] transition-colors"
                        title="Lihat preview"
                    >
                        <Eye className="w-5 h-5 text-black" />
                    </button>

                    <div className="flex-1">
                        {isNonEquip ? (
                            <div className="w-full h-10 flex items-center justify-center gap-1.5 bg-[#00FF00] border-[3px] border-black text-[12px] font-black uppercase shadow-[2px_2px_0_#000]">
                                <CheckCircle2 className="w-4 h-4" />
                                Dimiliki
                            </div>
                        ) : (
                            <button
                                onClick={() => onEquip(inventoryId, item.id)}
                                disabled={isEquipping}
                                className={`w-full h-10 flex items-center justify-center gap-1.5 border-[3px] border-black text-[12px] font-black uppercase transition-all disabled:opacity-50 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] ${
                                    isEquipped 
                                    ? "bg-[#FF00FF] text-white shadow-[2px_2px_0_#000]" 
                                    : "bg-white text-black shadow-[2px_2px_0_#000] hover:bg-[#FFFF00]"
                                }`}
                            >
                                {isEquipping
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : isEquipped
                                        ? <><CheckCircle2 className="w-4 h-4" /> Dipakai</>
                                        : <><Sparkles className="w-4 h-4" /> Pakai</>
                                }
                            </button>
                        )}
                    </div>
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
    const colorInfo = TYPE_COLORS[item.type]
    const isNonEquip = NON_EQUIPPABLE.includes(item.type)
    const isEquipping = equipping === item.id
    const TypeIcon = TYPE_ICONS[item.type]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ ease: "backOut", duration: 0.3 }}
                className="w-full max-w-sm bg-[#FFFDF0] border-[4px] border-black shadow-[12px_12px_0_#000] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b-[4px] border-black bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]"
                            style={{ background: colorInfo.bg }}>
                            <TypeIcon className="w-5 h-5" style={{ color: colorInfo.text }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5">
                                    {TYPE_LABELS[item.type]}
                                </p>
                                <TierBadge price={item.price} size="md" name={item.name} />
                            </div>
                            <p className="text-[16px] font-black text-black leading-tight uppercase">{item.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#FF00FF] hover:text-white transition-colors shadow-[2px_2px_0_#000]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview */}
                <div className="p-5 border-b-[4px] border-black bg-neutral-100 flex items-center justify-center overflow-hidden min-h-[160px]">
                    {item.type === "AVATAR_FRAME" && (() => {
                        const fc = getFrameClass(item.name)
                        return (
                            <div className="relative scale-150">
                                {fc && (
                                    <div className={`absolute -inset-3 rounded-full ${fc}-glow`}
                                        style={{ background: item.value, filter: "blur(14px)", opacity: 0.4 }} />
                                )}
                                <div className={`absolute -inset-1 rounded-full p-[2px] ${fc}`} style={{ background: item.value }}>
                                    <div className="w-full h-full rounded-full" style={{ background: "rgba(14,14,24,1)" }} />
                                </div>
                                <div className="w-16 h-16 rounded-full relative z-10 flex items-center justify-center overflow-hidden"
                                    style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <User className="w-8 h-8 text-neutral-600" />
                                </div>
                            </div>
                        )
                    })()}
                    {item.type === "PROFILE_BANNER" && <div className="w-full px-4 h-24 sm:h-32"><BannerPreview value={item.value} name={item.name} /></div>}
                    {item.type === "MEMORY_CARD_THEME" && <div className="w-full max-w-[200px] h-32 sm:h-40"><CardThemePreview value={item.value} name={item.name} /></div>}
                    {item.type === "USERNAME_DECORATION" && (
                        <div className="text-center z-10 w-full">
                            <span className={`text-3xl font-black ${getDecorationClass(item.name)} tracking-tight`} style={(() => { try { return JSON.parse(item.value) } catch { return {} } })()}>
                                {"Username"}
                            </span>
                        </div>
                    )}
                    {item.type === "MEMORY_STICKER" && (() => {
                        let cfg: StickerConfig | null = null
                        try { cfg = JSON.parse(item.value) } catch { }
                        return (
                            <div className="flex flex-col items-center gap-4 z-10">
                                {cfg ? (
                                    <div style={{ transform: `rotate(${cfg.defaultRotation ?? 0}deg)` }}>
                                        <StickerRenderer config={cfg} />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl" style={{ background: item.previewColor ?? "#6366f1" }} />
                                )}
                            </div>
                        )
                    })()}
                    {item.type === "PREMIUM_FEATURE" && (
                        <div className="flex flex-col items-center z-10 py-2">
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
                    )}
                </div>

                {/* Description */}
                <div className="p-5 bg-white">
                    <p className="text-[13px] font-bold text-black/70 leading-relaxed">{item.description}</p>
                </div>

                {/* Action */}
                <div className="p-5 pt-0 bg-white">
                    {isNonEquip ? (
                        <div className="w-full flex items-center justify-center gap-2 py-3 bg-[#00FF00] border-[4px] border-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000]">
                            <CheckCircle2 className="w-5 h-5" />
                            {item.type === "PREMIUM_FEATURE" ? "Fitur Premium Aktif" : "Sudah Dimiliki"}
                        </div>
                    ) : (
                        <button
                            onClick={() => onEquip(inventoryId, item.id)}
                            disabled={isEquipping}
                            className={`w-full flex items-center justify-center gap-2 py-3 border-[4px] border-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000] transition-all disabled:opacity-50 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] ${
                                isEquipped
                                ? "bg-[#FF00FF] text-white"
                                : "bg-[#FFFF00] text-black hover:bg-[#00FFFF]"
                            }`}
                        >
                            {isEquipping
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : isEquipped
                                    ? <><CheckCircle2 className="w-5 h-5" /> Sedang Dipakai</>
                                    : <><Sparkles className="w-5 h-5" /> Pakai Sekarang</>
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

            toast.success(willEquip ? `✨ "${equippedItem?.name}" sedang dipakai!` : `"${equippedItem?.name}" dilepas.`, {
                style: { border: "3px solid black", borderRadius: 0, background: "#FFFF00", color: "#000", fontWeight: 900 }
            })
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
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-black" />
                    <span className="text-black font-black uppercase tracking-widest text-sm bg-[#00FFFF] border-[2px] border-black px-4 py-1 shadow-[2px_2px_0_#000]">Memuat Inventori...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 bg-white border-[4px] border-black p-4 shadow-[8px_8px_0_#000] flex-1">
                        <div className="w-14 h-14 bg-[#00FFFF] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0_#000]">
                            <Package className="w-7 h-7 text-black" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-widest leading-none">Inventori</h1>
                            </div>
                            <p className="text-[13px] font-bold text-black/60 uppercase">
                                Koleksi dekorasi profil kamu
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-between">
                        <Link
                            href="/shop"
                            className="flex items-center gap-2 px-5 py-3 bg-[#FFFF00] border-[4px] border-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all shrink-0"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Ke Memory Shop
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Stat pills */}
                <div className="flex items-center gap-3 mt-6 flex-wrap">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black text-[12px] font-black uppercase shadow-[2px_2px_0_#000]">
                        <span className="w-2.5 h-2.5 bg-[#00FFFF] border-[2px] border-black block" />
                        {inventory.length} Item Dimiliki
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black text-[12px] font-black uppercase shadow-[2px_2px_0_#000]">
                        <span className="w-2.5 h-2.5 bg-[#00FF00] border-[2px] border-black block" />
                        {equippedCount} Sedang Dipakai
                    </span>
                </div>
            </motion.div>

            {/* ── Filter Tabs ── */}
            <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex items-center gap-3 min-w-max">
                    <button
                        onClick={() => setActiveType("ALL")}
                        className={`flex items-center gap-2 px-5 py-3 border-[3px] border-black text-[12px] font-black uppercase transition-all shadow-[4px_4px_0_#000] ${
                            activeType === "ALL" 
                            ? "bg-[#00FFFF] text-black translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0_#000]" 
                            : "bg-white text-black hover:bg-neutral-100"
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        Semua
                        <span className="ml-1 px-2 py-0.5 bg-black text-white text-[10px]">{inventory.length}</span>
                    </button>

                    {ALL_TYPES.map(type => {
                        const Icon = TYPE_ICONS[type]
                        const count = countByType(type)
                        if (count === 0) return null
                        const isActive = activeType === type
                        return (
                            <button
                                key={type}
                                onClick={() => setActiveType(type)}
                                className={`flex items-center gap-2 px-5 py-3 border-[3px] border-black text-[12px] font-black uppercase transition-all shadow-[4px_4px_0_#000] ${
                                    isActive 
                                    ? "bg-[#00FFFF] text-black translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0_#000]" 
                                    : "bg-white text-black hover:bg-neutral-100"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {TYPE_LABELS[type]}
                                <span className="ml-1 px-2 py-0.5 bg-black text-white text-[10px]">{count}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Content ── */}
            {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border-[4px] border-black shadow-[8px_8px_0_#000]">
                    <div className="w-20 h-20 bg-[#E5E5E5] border-[4px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000]">
                        <Package className="w-10 h-10 text-black" />
                    </div>
                    <p className="text-[20px] font-black text-black uppercase tracking-wider mb-2">Inventori Kosong</p>
                    <p className="text-[14px] font-bold text-black/60 max-w-sm mb-6 uppercase">
                        Beli dekorasi dari Memory Shop menggunakan poin streak kamu.
                    </p>
                    <Link
                        href="/shop"
                        className="px-6 py-3 bg-[#FFFF00] border-[3px] border-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all flex items-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Buka Memory Shop
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center bg-white border-[4px] border-black shadow-[8px_8px_0_#000]"
                >
                    <p className="text-[14px] font-black text-black uppercase mb-4">Belum ada item {TYPE_LABELS[activeType as ItemType]} di inventori.</p>
                    <button
                        onClick={() => setActiveType("ALL")}
                        className="px-4 py-2 bg-[#00FFFF] border-[2px] border-black text-[12px] font-black uppercase shadow-[2px_2px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000] transition-all"
                    >
                        Lihat semua
                    </button>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Sedang Dipakai Section */}
                    {equippedItems.length > 0 && (
                        <div className="mb-12">
                            <SectionDivider label="Sedang Dipakai" count={equippedItems.length} color="#000" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
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
                        </div>
                    )}

                    {/* Koleksi Lainnya Section */}
                    {collectionItems.length > 0 && (
                        <div className="mb-8">
                            <SectionDivider label="Koleksi Lainnya" count={collectionItems.length} color="#000" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
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
