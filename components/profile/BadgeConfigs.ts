import { Flame, Zap, Medal, Crown } from "lucide-react"

export const BADGE_STYLES: Record<number, any> = {
    7: {
        name: "Baru Panas",
        icon: Flame,
        bgProfile: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.15))",
        borderProfile: "1px solid rgba(249,115,22,0.3)",
        textColor: "#fb923c",
        iconClassProfile: "fill-orange-500 text-orange-400",
        bgModalActive: "linear-gradient(135deg, rgba(234,88,12,0.2), rgba(249,115,22,0.1))",
        borderModalActive: "1px solid rgba(249,115,22,0.4)"
    },
    30: {
        name: "Menyala Terus",
        icon: Zap,
        bgProfile: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))",
        borderProfile: "1px solid rgba(99,102,241,0.3)",
        textColor: "#818cf8",
        iconClassProfile: "fill-indigo-500 text-indigo-400",
        bgModalActive: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))",
        borderModalActive: "1px solid rgba(99,102,241,0.4)"
    },
    60: {
        name: "Anti Kendor",
        icon: Medal,
        bgProfile: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))",
        borderProfile: "1px solid rgba(16,185,129,0.3)",
        textColor: "#34d399",
        iconClassProfile: "fill-emerald-500 text-emerald-400",
        bgModalActive: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))",
        borderModalActive: "1px solid rgba(16,185,129,0.4)"
    },
    90: {
        name: "GOAT Streak",
        icon: Crown,
        bgProfile: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.15))",
        borderProfile: "1px solid rgba(251,191,36,0.3)",
        textColor: "#fbbf24",
        iconClassProfile: "fill-amber-500 text-amber-400",
        bgModalActive: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))",
        borderModalActive: "1px solid rgba(251,191,36,0.4)"
    }
}

export const getBadgeConfig = (milestone: number) => {
    return BADGE_STYLES[milestone] || {
        name: `${milestone} Hari`,
        icon: Flame,
        bgProfile: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.15))",
        borderProfile: "1px solid rgba(249,115,22,0.3)",
        textColor: "#fb923c",
        iconClassProfile: "fill-orange-500 text-orange-400",
        bgModalActive: "linear-gradient(135deg, rgba(234,88,12,0.2), rgba(249,115,22,0.1))",
        borderModalActive: "1px solid rgba(249,115,22,0.4)"
    }
}
