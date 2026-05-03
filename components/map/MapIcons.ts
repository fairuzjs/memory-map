"use client"

// Emotion configs map
export const emotionIcons: Record<string, string> = {
    HAPPY: "🌟",
    SAD: "💧",
    NOSTALGIC: "🕰️",
    EXCITED: "🔥",
    PEACEFUL: "🍃",
    GRATEFUL: "🙏",
    ROMANTIC: "❤️",
    ADVENTUROUS: "🏕️",
}

export const emotionColors: Record<string, string> = {
    HAPPY: "#eab308", // yellow-500
    SAD: "#3b82f6", // blue-500
    NOSTALGIC: "#d97706", // amber-600
    EXCITED: "#f97316", // orange-500
    PEACEFUL: "#10b981", // emerald-500
    GRATEFUL: "#14b8a6", // teal-500
    ROMANTIC: "#f43f5e", // rose-500
    ADVENTUROUS: "#6366f1", // indigo-500
}

export function getEmotionConfig(emotion: string) {
    const iconChar = emotionIcons[emotion] || emotionIcons.HAPPY
    const color = emotionColors[emotion] || emotionColors.HAPPY
    return { iconChar, color }
}

// ── Premium Map Marker Styles ────────────────────────────────────────
export interface PremiumMarkerStyle {
    id: string
    name: string
    icon: string                  // display emoji/icon
    gradient: [string, string]    // CSS gradient stops
    borderColor: string
    glowColor: string
    animation: string             // CSS class name for animation
    shape: "circle" | "diamond" | "hexagon" | "star" | "shield"
}

export const PREMIUM_MARKER_STYLES: PremiumMarkerStyle[] = [
    {
        id: "royal-gold",
        name: "Royal Gold",
        icon: "👑",
        gradient: ["#fbbf24", "#b45309"],
        borderColor: "#fde68a",
        glowColor: "rgba(251,191,36,0.6)",
        animation: "premium-marker-pulse",
        shape: "circle",
    },
    {
        id: "aurora-crystal",
        name: "Aurora Crystal",
        icon: "💎",
        gradient: ["#818cf8", "#c084fc"],
        borderColor: "#c4b5fd",
        glowColor: "rgba(139,92,246,0.6)",
        animation: "premium-marker-shimmer",
        shape: "diamond",
    },
    {
        id: "emerald-flame",
        name: "Emerald Flame",
        icon: "🔮",
        gradient: ["#34d399", "#059669"],
        borderColor: "#6ee7b7",
        glowColor: "rgba(52,211,153,0.6)",
        animation: "premium-marker-glow",
        shape: "hexagon",
    },
    {
        id: "cosmic-rose",
        name: "Cosmic Rose",
        icon: "🌸",
        gradient: ["#fb7185", "#be123c"],
        borderColor: "#fda4af",
        glowColor: "rgba(251,113,133,0.6)",
        animation: "premium-marker-float",
        shape: "star",
    },
    {
        id: "nebula-blue",
        name: "Nebula Blue",
        icon: "⚡",
        gradient: ["#38bdf8", "#1d4ed8"],
        borderColor: "#7dd3fc",
        glowColor: "rgba(56,189,248,0.6)",
        animation: "premium-marker-rotate",
        shape: "shield",
    },
]

export function getPremiumMarkerStyle(styleId: string): PremiumMarkerStyle {
    return PREMIUM_MARKER_STYLES.find(s => s.id === styleId) || PREMIUM_MARKER_STYLES[0]
}
