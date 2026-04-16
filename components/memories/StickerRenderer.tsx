"use client"

import { Heart, Star, MapPin } from "lucide-react"

export type StickerConfig = {
    shape: "sticky-note" | "ribbon" | "stamp" | "tag" | "star" | "badge" | "postcard" | "book" | "notebook" | "player"
    background: string
    border: string
    textColor: string
    defaultRotation: number
    defaultText: string
    subText?: string | null
    accentBackground?: string
    accentTextColor?: string
    icon?: string | null
    iconColor?: string | null
    iconPosition?: "top-right" | "inline" | null
    editable: boolean
    width: number
    height: number
}

function StickerIcon({ name, color, size = 12 }: { name: string; color?: string; size?: number }) {
    const cls = `shrink-0`
    const style = { width: size, height: size, color: color ?? "currentColor" }
    if (name === "heart") return <Heart className={cls} style={style} fill={color ?? "currentColor"} />
    if (name === "star") return <Star className={cls} style={style} fill={color ?? "currentColor"} />
    if (name === "map-pin") return <MapPin className={cls} style={style} />
    return null
}

function StarShape({ cfg, displayText }: { cfg: StickerConfig; displayText: string }) {
    return (
        <div
            className="flex items-center justify-center relative"
            style={{ width: cfg.width, height: cfg.height }}
        >
            <svg
                viewBox="0 0 100 100"
                width={cfg.width}
                height={cfg.height}
                className="absolute inset-0"
            >
                <polygon
                    points="50,5 63,35 95,35 71,57 80,90 50,70 20,90 29,57 5,35 37,35"
                    fill={cfg.background}
                    stroke={cfg.border !== "none" ? cfg.border : "none"}
                    strokeWidth={cfg.border !== "none" ? "1" : "0"}
                />
            </svg>
            <span
                className="relative z-10 text-[9px] font-black text-center leading-tight px-2"
                style={{ color: cfg.textColor, maxWidth: cfg.width - 24 }}
            >
                {displayText}
            </span>
        </div>
    )
}

function BadgeShape({ cfg, displayText }: { cfg: StickerConfig; displayText: string }) {
    return (
        <div
            className="flex items-center gap-1.5 px-3 rounded-full"
            style={{
                background: cfg.background,
                border: cfg.border,
                width: cfg.width,
                height: cfg.height,
                minWidth: cfg.width,
            }}
        >
            {cfg.icon && cfg.iconPosition === "inline" && (
                <StickerIcon name={cfg.icon} color={cfg.iconColor ?? undefined} size={11} />
            )}
            <span className="text-[11px] font-black tracking-wide truncate" style={{ color: cfg.textColor }}>
                {displayText}
            </span>
        </div>
    )
}

function StampShape({ cfg, memoryDate, customText }: { cfg: StickerConfig; memoryDate?: string; customText?: string | null }) {
    const rawDate = (customText && customText.trim() !== "") ? customText : memoryDate
    let date = rawDate ? new Date(rawDate) : new Date()
    if (isNaN(date.getTime())) {
        date = new Date()
    }
    const month = date.toLocaleDateString("id-ID", { month: "short" }).toUpperCase()
    const day = date.getDate()
    const year = date.getFullYear()

    return (
        <div
            className="flex flex-col items-center justify-center rounded-full overflow-hidden"
            style={{
                width: cfg.width,
                height: cfg.height,
                background: cfg.background,
                border: cfg.border,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
        >
            <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "#888" }}>
                {month}
            </span>
            <span className="text-[22px] font-black leading-none" style={{ color: cfg.textColor }}>
                {day}
            </span>
            <span className="text-[9px] font-bold" style={{ color: "#aaa" }}>
                {year}
            </span>
        </div>
    )
}

// ── Postcard Shape (Perangko Langit) ────────────────────────────────────────
function PostcardShape({ cfg, displayText }: { cfg: StickerConfig; displayText: string }) {
    return (
        <div style={{ width: cfg.width, height: cfg.height, position: "relative" }}>
            {/* Scalloped outer border */}
            <svg viewBox="0 0 140 105" width={cfg.width} height={cfg.height} className="absolute inset-0">
                <defs>
                    <clipPath id="scallop">
                        <path d="
                            M10,0 L20,0 C20,5 25,8 30,5 L30,0 L40,0 C40,5 45,8 50,5 L50,0 L60,0 C60,5 65,8 70,5 L70,0 L80,0 C80,5 85,8 90,5 L90,0 L100,0 C100,5 105,8 110,5 L110,0 L120,0 C120,5 125,8 130,5 L130,0 L140,0
                            L140,10 C135,10 132,15 135,20 L140,20 L140,30 C135,30 132,35 135,40 L140,40 L140,50 C135,50 132,55 135,60 L140,60 L140,70 C135,70 132,75 135,80 L140,80 L140,90 C135,90 132,95 135,100 L140,105
                            L130,105 C130,100 125,97 120,100 L120,105 L110,105 C110,100 105,97 100,100 L100,105 L90,105 C90,100 85,97 80,100 L80,105 L70,105 C70,100 65,97 60,100 L60,105 L50,105 C50,100 45,97 40,100 L40,105 L30,105 C30,100 25,97 20,100 L20,105 L10,105 C10,100 5,97 0,100
                            L0,105 L0,90 C5,90 8,85 5,80 L0,80 L0,70 C5,70 8,65 5,60 L0,60 L0,50 C5,50 8,45 5,40 L0,40 L0,30 C5,30 8,25 5,20 L0,20 L0,10 C5,10 8,5 5,0 L0,0 Z
                        " />
                    </clipPath>
                </defs>
                <rect width="140" height="105" fill="#f0ebe0" clipPath="url(#scallop)" />
                <rect x="10" y="8" width="120" height="89" rx="2" fill={cfg.background} clipPath="url(#scallop)" />
            </svg>
            {/* Sun + Cloud */}
            <div className="absolute" style={{ top: 6, right: 14, zIndex: 2 }}>
                {/* Sun */}
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#f9c74f", position: "relative", zIndex: 2, boxShadow: "0 0 6px rgba(249,199,79,0.5)" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 8, lineHeight: 1 }}>😊</div>
                </div>
                {/* Cloud */}
                <div style={{ position: "absolute", top: 5, right: -6, zIndex: 1 }}>
                    <div style={{ width: 28, height: 14, borderRadius: 10, background: "#9eafc0", position: "relative" }}>
                        <div style={{ position: "absolute", top: -5, left: 6, width: 12, height: 12, borderRadius: "50%", background: "#8899aa" }} />
                        <div style={{ position: "absolute", top: -3, left: 14, width: 10, height: 10, borderRadius: "50%", background: "#95a5b6" }} />
                    </div>
                </div>
            </div>
            {/* Text */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3, paddingTop: 8 }}>
                <span className="text-[12px] font-bold italic text-center leading-tight px-4" style={{ color: cfg.textColor }}>
                    {displayText}
                </span>
            </div>
        </div>
    )
}

// ── Book Shape (Diary Pita Emas) ────────────────────────────────────────────
function BookShape({ cfg, displayText }: { cfg: StickerConfig; displayText: string }) {
    return (
        <div style={{ width: cfg.width, height: cfg.height, position: "relative" }}>
            <svg viewBox="0 0 150 100" width={cfg.width} height={cfg.height}>
                {/* Book cover / border */}
                <rect x="0" y="3" width="150" height="94" rx="4" fill="#c8c8cc" />
                {/* Left page */}
                <rect x="3" y="6" width="72" height="88" rx="2" fill="#e8a4b0" />
                {/* Right page */}
                <rect x="75" y="6" width="72" height="88" rx="2" fill={cfg.background} />
                {/* Spine line */}
                <line x1="75" y1="6" x2="75" y2="94" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                {/* Golden bow decorations */}
                {/* Top bow */}
                <g transform="translate(75, 8)">
                    <ellipse cx="-8" cy="3" rx="7" ry="4" fill="none" stroke="#d4a020" strokeWidth="1.5" />
                    <ellipse cx="8" cy="3" rx="7" ry="4" fill="none" stroke="#d4a020" strokeWidth="1.5" />
                    <circle cx="0" cy="4" r="2" fill="#d4a020" />
                </g>
                {/* Bottom bow */}
                <g transform="translate(75, 88)">
                    <ellipse cx="-8" cy="-3" rx="7" ry="4" fill="none" stroke="#d4a020" strokeWidth="1.5" />
                    <ellipse cx="8" cy="-3" rx="7" ry="4" fill="none" stroke="#d4a020" strokeWidth="1.5" />
                    <circle cx="0" cy="-4" r="2" fill="#d4a020" />
                </g>
                {/* Left bow */}
                <g transform="translate(8, 50)">
                    <ellipse cx="4" cy="-6" rx="4" ry="5" fill="none" stroke="#d4a020" strokeWidth="1.2" />
                    <ellipse cx="4" cy="6" rx="4" ry="5" fill="none" stroke="#d4a020" strokeWidth="1.2" />
                    <circle cx="4" cy="0" r="1.5" fill="#d4a020" />
                </g>
                {/* Right bow */}
                <g transform="translate(140, 50)">
                    <ellipse cx="-4" cy="-6" rx="4" ry="5" fill="none" stroke="#d4a020" strokeWidth="1.2" />
                    <ellipse cx="-4" cy="6" rx="4" ry="5" fill="none" stroke="#d4a020" strokeWidth="1.2" />
                    <circle cx="-4" cy="0" r="1.5" fill="#d4a020" />
                </g>
                {/* Golden frame path */}
                <path d="M30,22 C30,18 38,14 75,14 C112,14 120,18 120,22 L120,78 C120,82 112,86 75,86 C38,86 30,82 30,78 Z" fill="none" stroke="#d4a020" strokeWidth="1.5" />
            </svg>
            {/* Text overlay */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                <span className="text-[11px] font-bold italic text-center leading-tight" style={{ color: cfg.textColor }}>
                    {displayText}
                </span>
            </div>
        </div>
    )
}

// ── Notebook Shape (Jurnal Lavender) ────────────────────────────────────────
function NotebookShape({ cfg, displayText }: { cfg: StickerConfig; displayText: string }) {
    return (
        <div style={{ width: cfg.width, height: cfg.height, position: "relative" }}>
            <svg viewBox="0 0 150 100" width={cfg.width} height={cfg.height}>
                {/* Main body with lavender bg */}
                <rect x="0" y="0" width="150" height="100" rx="8" fill="#d0a8f0" />
                {/* Inner dark border */}
                <rect x="30" y="5" width="115" height="90" rx="5" fill="none" stroke="#2a1840" strokeWidth="2" />
                {/* Cream page area */}
                <rect x="32" y="7" width="111" height="86" rx="4" fill={cfg.background} />
                {/* Spiral spine */}
                {[15, 28, 41, 54, 67, 80].map((y, i) => (
                    <g key={i}>
                        <circle cx="25" cy={y} r="4" fill="#d0a8f0" stroke="#2a1840" strokeWidth="1.5" />
                        <rect x="18" y={y - 1} width="14" height="2" rx="1" fill="#2a1840" />
                    </g>
                ))}
                {/* Bow decoration top-right */}
                <g transform="translate(130, 10)">
                    <path d="M0,8 C-4,4 -6,0 -2,-2 C2,-4 4,0 0,4" fill="none" stroke="#c8b8a0" strokeWidth="1" />
                    <path d="M0,8 C4,4 6,0 2,-2 C-2,-4 -4,0 0,4" fill="none" stroke="#c8b8a0" strokeWidth="1" />
                    <path d="M0,8 C-3,12 -4,16 0,18" fill="none" stroke="#c8b8a0" strokeWidth="1" />
                    <path d="M0,8 C3,12 4,16 0,18" fill="none" stroke="#c8b8a0" strokeWidth="1" />
                </g>
            </svg>
            {/* Text */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2, paddingLeft: 30 }}>
                <span className="text-[11px] font-bold text-center leading-tight" style={{ color: cfg.textColor }}>
                    {displayText}
                </span>
            </div>
        </div>
    )
}

// ── Player Shape (Playlist Senja) ───────────────────────────────────────────
function PlayerShape({ cfg, displayText }: { cfg: StickerConfig; displayText: string }) {
    return (
        <div
            className="relative flex flex-col rounded-[8px]"
            style={{
                width: cfg.width,
                height: cfg.height,
                background: cfg.background,
                border: "1.5px solid #3a3a3a",
                boxShadow: "2px 3px 8px rgba(0,0,0,0.12)",
                overflow: "hidden",
            }}
        >
            {/* Window dots */}
            <div className="flex items-center gap-1 px-2.5 pt-2">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3a3a3a" }} />
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3a3a3a", opacity: 0.5 }} />
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3a3a3a", opacity: 0.5 }} />
            </div>
            {/* Coffee cup decoration */}
            <div className="absolute" style={{ top: 4, right: 4, zIndex: 2 }}>
                <svg viewBox="0 0 24 28" width="22" height="26">
                    {/* Cup body */}
                    <rect x="4" y="6" width="14" height="16" rx="2" fill="#8a7a60" stroke="#5a4a30" strokeWidth="0.8" />
                    {/* Cup band */}
                    <rect x="4" y="14" width="14" height="4" fill="#a09070" />
                    {/* Bow on cup */}
                    <circle cx="11" cy="14" r="2" fill="#c8b098" />
                    <ellipse cx="7" cy="14" rx="3" ry="2" fill="none" stroke="#c8b098" strokeWidth="0.8" />
                    <ellipse cx="15" cy="14" rx="3" ry="2" fill="none" stroke="#c8b098" strokeWidth="0.8" />
                    {/* Whipped cream */}
                    <ellipse cx="11" cy="6" rx="8" ry="4" fill="#f5f0e8" stroke="#d8d0c0" strokeWidth="0.5" />
                    <ellipse cx="9" cy="4" rx="3" ry="2.5" fill="#f5f0e8" />
                    <ellipse cx="13" cy="5" rx="3" ry="2" fill="#f5f0e8" />
                    {/* Straw */}
                    <line x1="14" y1="1" x2="13" y2="8" stroke="#8a7a60" strokeWidth="1.2" />
                </svg>
            </div>
            {/* Spacer / content area */}
            <div className="flex-1" />
            {/* Song title / text */}
            <div className="text-center px-2 mb-1">
                <span className="text-[9px] font-medium" style={{ color: cfg.textColor }}>
                    {displayText}
                </span>
            </div>
            {/* Music controls */}
            <div className="flex items-center justify-center gap-2 pb-2">
                <svg viewBox="0 0 12 12" width="10" height="10" fill={cfg.textColor}>
                    <polygon points="9,1 3,6 9,11" />
                    <rect x="2" y="1" width="1.5" height="10" />
                </svg>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${cfg.textColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 10 10" width="7" height="7" fill={cfg.textColor}>
                        <rect x="2" y="1" width="2" height="8" rx="0.5" />
                        <rect x="6" y="1" width="2" height="8" rx="0.5" />
                    </svg>
                </div>
                <svg viewBox="0 0 12 12" width="10" height="10" fill={cfg.textColor}>
                    <polygon points="3,1 9,6 3,11" />
                    <rect x="8.5" y="1" width="1.5" height="10" />
                </svg>
            </div>
        </div>
    )
}

export function StickerRenderer({
    config,
    memoryDate,
    customText,
}: {
    config: StickerConfig
    memoryDate?: string
    customText?: string | null
}) {
    // Use customText if provided (user-edited), otherwise fall back to defaultText
    const displayText = (customText != null && customText.trim() !== "") ? customText : config.defaultText

    if (config.shape === "stamp") {
        return <StampShape cfg={config} memoryDate={memoryDate} customText={customText} />
    }

    if (config.shape === "star") {
        return <StarShape cfg={config} displayText={displayText} />
    }

    if (config.shape === "badge") {
        return <BadgeShape cfg={config} displayText={displayText} />
    }

    if (config.shape === "postcard") {
        return <PostcardShape cfg={config} displayText={displayText} />
    }

    if (config.shape === "book") {
        return <BookShape cfg={config} displayText={displayText} />
    }

    if (config.shape === "notebook") {
        return <NotebookShape cfg={config} displayText={displayText} />
    }

    if (config.shape === "player") {
        return <PlayerShape cfg={config} displayText={displayText} />
    }

    if (config.shape === "ribbon") {
        return (
            <div className="flex flex-col" style={{ width: config.width }}>
                <div
                    className="flex items-center justify-center gap-1.5 rounded-[6px]"
                    style={{
                        background: config.background,
                        width: config.width,
                        height: config.height,
                    }}
                >
                    {config.icon && config.iconPosition === "inline" && (
                        <StickerIcon name={config.icon} color={config.iconColor ?? undefined} size={11} />
                    )}
                    <span
                        className="text-[11px] font-black tracking-wider uppercase"
                        style={{ color: config.textColor }}
                    >
                        {displayText}
                    </span>
                </div>
                {config.accentBackground && (
                    <div
                        className="flex items-center justify-center mx-auto rounded-b-sm"
                        style={{
                            background: config.accentBackground,
                            width: config.width * 0.52,
                            height: 20,
                        }}
                    >
                        <span className="text-[9px] font-black" style={{ color: config.accentTextColor }}>
                            {new Date(memoryDate ?? Date.now()).getFullYear()}
                        </span>
                    </div>
                )}
            </div>
        )
    }

    if (config.shape === "tag") {
        return (
            <div
                className="flex items-center gap-1.5 px-2.5 rounded-full"
                style={{
                    background: config.background,
                    border: config.border,
                    width: config.width,
                    height: config.height,
                    minWidth: config.width,
                }}
            >
                {config.icon && (
                    <StickerIcon name={config.icon} color={config.iconColor ?? undefined} size={11} />
                )}
                <span className="text-[11px] font-bold truncate" style={{ color: config.textColor }}>
                    {displayText}
                </span>
            </div>
        )
    }

    // sticky-note (default)
    return (
        <div
            className="relative flex flex-col justify-between p-2.5 rounded-[6px]"
            style={{
                width: config.width,
                height: config.height,
                background: config.background,
                border: config.border,
                boxShadow: "2px 3px 8px rgba(0,0,0,0.15)",
            }}
        >
            {config.icon && config.iconPosition === "top-right" && (
                <div className="absolute top-2 right-2">
                    <StickerIcon name={config.icon} color={config.iconColor ?? undefined} size={13} />
                </div>
            )}
            <p className="text-[12px] font-black leading-tight pr-4" style={{ color: config.textColor }}>
                {displayText}
            </p>
            {config.subText && (
                <p className="text-[10px] font-medium leading-tight opacity-75" style={{ color: config.textColor }}>
                    {config.subText}
                </p>
            )}
        </div>
    )
}
