export function getDecorationClass(name?: string) {
    if (!name) return "";
    const n = name.toLowerCase();
    if (n.includes("kristal")) return "anim-kristal";
    if (n.includes("api")) return "anim-api";
    if (n.includes("neon")) return "anim-neon";
    if (n.includes("emas")) return "anim-emas";
    if (n.includes("pelangi")) return "anim-pelangi";
    if (n.includes("glitch")) return "anim-glitch";
    if (n.includes("quasar")) return "anim-quasar";
    if (n.includes("celestial")) return "anim-celestial";
    if (n.includes("supernova")) return "anim-supernova";
    if (n.includes("rune")) return "anim-rune";
    return "";
}

export function getFrameClass(name?: string) {
    if (!name) return "";
    const n = name.toLowerCase();
    if (n.includes("mahkota")) return "anim-frame-mahkota";
    if (n.includes("orbit")) return "anim-frame-orbit";
    if (n.includes("fraktur")) return "anim-frame-fraktur";
    if (n.includes("singularitas")) return "anim-frame-singularitas";
    if (n.includes("cakra")) return "anim-frame-cakra";
    if (n.includes("eternum")) return "anim-frame-eternum";
    return "";
}

export function getBannerClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("kerajaan")) return "anim-banner-kerajaan"
    if (n.includes("galaxy")) return "anim-banner-galaxy"
    if (n.includes("hutan")) return "anim-banner-matrix"
    if (n.includes("samudra")) return "anim-banner-samudra"
    return ""
}

export const EMOTION_LABEL: Record<string, string> = {
    HAPPY: "Happy", SAD: "Sad", NOSTALGIC: "Nostalgia", EXCITED: "Excited",
    PEACEFUL: "Peaceful", GRATEFUL: "Grateful", ROMANTIC: "Romantic", ADVENTUROUS: "Adventure",
}

export const EMOTION_COLOR: Record<string, string> = {
    HAPPY: "#fbbf24", SAD: "#60a5fa", NOSTALGIC: "#c084fc", EXCITED: "#fb923c",
    PEACEFUL: "#34d399", GRATEFUL: "#f472b6", ROMANTIC: "#f43f5e", ADVENTUROUS: "#38bdf8",
}

export const EMOTION_BG: Record<string, string> = {
    HAPPY: "rgba(251,191,36,0.15)", SAD: "rgba(96,165,250,0.15)", NOSTALGIC: "rgba(192,132,252,0.15)",
    EXCITED: "rgba(251,146,60,0.15)", PEACEFUL: "rgba(52,211,153,0.15)", GRATEFUL: "rgba(244,114,182,0.15)",
    ROMANTIC: "rgba(244,63,94,0.15)", ADVENTUROUS: "rgba(56,189,248,0.15)",
}
