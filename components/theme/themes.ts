// ═══════════════════════════════════════════════════════════════════════
// Theme Definitions — Memory Map Neobrutalism Theme System
// ═══════════════════════════════════════════════════════════════════════

export interface ThemeConfig {
    id: string
    name: string
    emoji: string
    description: string
    /** Preview colors for the theme picker UI */
    preview: {
        bg: string
        primary: string
        secondary: string
        accent: string
    }
}

export const THEMES: ThemeConfig[] = [
    {
        id: "classic",
        name: "Classic",
        emoji: "🗺️",
        description: "Warna asli Memory Map",
        preview: {
            bg: "#FFFDF0",
            primary: "#FFFF00",
            secondary: "#00FFFF",
            accent: "#FF00FF",
        },
    },
    {
        id: "candy",
        name: "Candy Pop",
        emoji: "🍬",
        description: "Manis, pink, dan playful",
        preview: {
            bg: "#FFF0F6",
            primary: "#FF007F",
            secondary: "#BA55D3",
            accent: "#FF0055",
        },
    },
    {
        id: "ocean",
        name: "Ocean Blue",
        emoji: "🌊",
        description: "Benderang dan segar seperti lautan",
        preview: {
            bg: "#F0F9FF",
            primary: "#00E5FF",
            secondary: "#00B0FF",
            accent: "#0055FF",
        },
    },
    {
        id: "matcha",
        name: "Matcha Green",
        emoji: "🍵",
        description: "Hijau neon segar dan alami",
        preview: {
            bg: "#F7FEE7",
            primary: "#A3E635",
            secondary: "#6EE7B7",
            accent: "#15803D",
        },
    },
    {
        id: "sunset",
        name: "Sunset Orange",
        emoji: "🌅",
        description: "Hangat berkilau seperti matahari terbenam",
        preview: {
            bg: "#FFF7ED",
            primary: "#F97316",
            secondary: "#FACC15",
            accent: "#EF4444",
        },
    },
    {
        id: "buttermilk",
        name: "Buttermilk",
        emoji: "🍼",
        description: "Manis, lembut, energi, kalem dan hangat",
        preview: {
            bg: "#FAFAFA",
            primary: "#FFD633",
            secondary: "#FFEB9A",
            accent: "#B4982A",
        },
    },
]

export const DEFAULT_THEME = "classic"

export const THEME_STORAGE_KEY = "mm-theme"
