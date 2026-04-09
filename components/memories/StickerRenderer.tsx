"use client"

import { Heart, Star, MapPin } from "lucide-react"

export type StickerConfig = {
    shape: "sticky-note" | "ribbon" | "stamp" | "tag" | "star" | "badge"
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
