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

