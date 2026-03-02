"use client"

import L from "leaflet"

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

export function createEmotionIcon(emotion: string) {
    const iconChar = emotionIcons[emotion] || emotionIcons.HAPPY
    const color = emotionColors[emotion] || emotionColors.HAPPY

    return L.divIcon({
        className: "custom-div-icon",
        html: `
      <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);">
        <span style="font-size: 16px;">${iconChar}</span>
      </div>
      <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid ${color}; margin: -2px auto 0;"></div>
    `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
    })
}

// Basic default icon setup for generic markers (like location picker)
export const setupLeafletDefaultIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })
}
