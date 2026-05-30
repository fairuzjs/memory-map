import Link from "next/link"
import Image from "next/image"
import { MapPin, Calendar, Heart, MessageCircle, Users, Music } from "lucide-react"
import { StickerRenderer, StickerConfig } from "./StickerRenderer"
import { formatDate, getMemoryCover } from "@/lib/utils"

interface MemoryCardProps {
    memory: any
    isCollaboration?: boolean
    placements?: Array<{
        id: string
        posX: number
        posY: number
        rotation: number
        scale: number
        customText?: string | null
        item: { id: string; name: string; value: string; previewColor: string | null }
    }>
}

type CardTheme = {
    border: string
    background: string
    shadow: string
    imageFilter: string
    radius: string
    contentPadding: string
    titleColor: string
    storyColor: string
    footerBorder: string
    footerTextColor: string
}

const emotionMap: Record<string, { icon: string; bg: string; text: string }> = {
    HAPPY:       { icon: "🌟", bg: "bg-amber-100",  text: "text-amber-700"  },
    SAD:         { icon: "💧", bg: "bg-sky-100",    text: "text-sky-700"    },
    NOSTALGIC:   { icon: "🕰️", bg: "bg-orange-100", text: "text-orange-700" },
    EXCITED:     { icon: "🔥", bg: "bg-rose-100",   text: "text-rose-700"   },
    PEACEFUL:    { icon: "🍃", bg: "bg-emerald-100",text: "text-emerald-700"},
    GRATEFUL:    { icon: "🙏", bg: "bg-neutral-100", text: "text-neutral-600"},
    ROMANTIC:    { icon: "❤️", bg: "bg-pink-100",   text: "text-pink-700"   },
    ADVENTUROUS: { icon: "🏕️", bg: "bg-violet-100", text: "text-violet-700" },
}

function parseTheme(rawValue: string | null | undefined): CardTheme | null {
    if (!rawValue) return null
    try { return JSON.parse(rawValue) } catch { return null }
}

function isDarkTheme(theme: CardTheme | null) {
    if (!theme) return false
    const bg = theme.background.toLowerCase()
    return (
        bg.includes("#0a") ||
        bg.includes("#1a") ||
        bg.includes("#03") ||
        bg.includes("#05") ||
        bg.includes("#12") ||
        bg.includes("#15") ||
        bg.includes("rgba(10,10,20") ||
        bg.includes("rgba(5,5,15") ||
        theme.titleColor.toLowerCase().startsWith("#d") ||
        theme.titleColor.toLowerCase().startsWith("#e") ||
        theme.titleColor.toLowerCase().startsWith("#f") ||
        theme.titleColor.toLowerCase().startsWith("#9")
    )
}

export function MemoryCard({ memory, isCollaboration, placements = [] }: MemoryCardProps) {
    const collab = isCollaboration ?? memory.isCollaboration ?? false
    const emotion = emotionMap[memory.emotion] ?? emotionMap.HAPPY

    // Parse equipped card theme from user inventories (may come from API)
    const rawThemeValue = memory.user?.inventories?.[0]?.item?.value ?? null
    const theme = parseTheme(rawThemeValue)

    // Safely parse photos that might be stringified JSON from the database
    const photos = (memory.photos ?? []).map((p: any) => {
        try {
            const parsed = JSON.parse(p.url)
            return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
        } catch {
            return p // legacy fallback
        }
    })

    const hasPhoto = photos.length > 0
    const coverUrl = getMemoryCover(memory)

    return (
        <div
            className="group relative flex flex-col h-full overflow-hidden transition-all duration-300 rounded-2xl"
            style={{
                background: theme?.background ?? "#FFFFFF",
                border: theme?.border ?? "1.5px solid rgba(0,0,0,0.08)",
                borderRadius: theme?.radius ?? "16px",
                boxShadow: theme?.shadow ?? "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            {/* ── Photo area ─────────────────────────────────────── */}
            {coverUrl && (
                <div
                    className="relative w-full h-48 shrink-0 overflow-hidden"
                    style={{ borderRadius: theme ? `${theme.radius} ${theme.radius} 0 0` : "16px 16px 0 0" }}
                >
                    <Image
                        src={coverUrl}
                        alt={memory.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />

                    {/* Sticker placements */}
                    {placements.map(p => {
                        let cfg: StickerConfig | null = null
                        try { cfg = JSON.parse(p.item.value) } catch { return null }
                        if (!cfg) return null
                        return (
                            <div
                                key={p.id}
                                className="absolute pointer-events-none select-none"
                                style={{
                                    left: `${p.posX}%`,
                                    top: `${p.posY}%`,
                                    transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
                                    transformOrigin: "center",
                                    zIndex: 10,
                                    filter: "drop-shadow(1px 2px 4px rgba(0,0,0,0.35))",
                                }}
                            >
                                <StickerRenderer
                                    config={cfg}
                                    memoryDate={memory.date}
                                    customText={p.customText}
                                />
                            </div>
                        )
                    })}

                    {/* Collab badge */}
                    {collab && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-[#FF00FF]/90 backdrop-blur-sm rounded-full">
                            <Users className="w-3 h-3 text-white" />
                            <span className="text-[9px] font-black text-white tracking-wider uppercase">Collab</span>
                        </div>
                    )}

                    {/* Music badge */}
                    {(memory.audioUrl || memory.spotifyTrackId) && (
                        <div
                            className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm ${
                                memory.spotifyTrackId
                                    ? "bg-[#1DB954]/90"
                                    : "bg-black/60"
                            }`}
                            title={memory.spotifyTrackId ? "Mempunyai lagu Spotify" : "Memiliki musik"}
                        >
                            <Music className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>
            )}

            {/* ── Content area ──────────────────────────────────── */}
            <div className={`relative flex flex-col flex-1 ${theme?.contentPadding ?? "p-4"}`}>

                {/* Collab badge — jika tidak ada foto */}
                {collab && !coverUrl && (
                    <div className="flex justify-end mb-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FF00FF]/15 border border-[#FF00FF]/30 rounded-full">
                            <Users className="w-3 h-3 text-[#FF00FF]" />
                            <span className="text-[9px] font-black text-[#FF00FF] tracking-wider uppercase">Collab</span>
                        </div>
                    </div>
                )}

                {/* Emotion chip + Title */}
                <div className="flex items-start gap-2.5 mb-2.5">
                    <div className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl ${emotion.bg}`}>
                        <span className="text-lg leading-none">{emotion.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <p
                            className="text-[13px] font-black line-clamp-1 leading-snug uppercase tracking-tight"
                            style={{ color: theme?.titleColor ?? "#111" }}
                        >
                            {memory.title}
                        </p>
                        <div
                            className="flex items-center gap-2.5 text-[10px] font-semibold mt-0.5 flex-wrap"
                            style={{ color: theme?.storyColor ?? "#888" }}
                        >
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {formatDate(memory.date)}
                            </span>
                            {memory.locationName && (
                                <Link
                                    href={`/map?lat=${memory.latitude}&lng=${memory.longitude}&memoryId=${memory.id}`}
                                    className="flex items-center gap-1 min-w-0 relative z-30 hover:text-[#FF00FF] transition-colors"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[80px]">{memory.locationName}</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Story */}
                <p
                    className="flex-1 text-[12px] font-medium line-clamp-2 leading-relaxed mb-3"
                    style={{ color: theme?.storyColor ?? "#555" }}
                >
                    {memory.story}
                </p>

                {/* Footer */}
                <div
                    className="flex items-center justify-between pt-3 mt-auto"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
                >
                    <Link
                        href={`/profile/${memory.user.id}`}
                        className="relative z-30 flex items-center gap-2 group/author"
                        onClick={e => e.stopPropagation()}
                    >
                        <Image
                            src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                            alt={memory.user.name}
                            width={24}
                            height={24}
                            className="rounded-full object-cover ring-1 ring-black/10 group-hover/author:ring-[#FF00FF]/50 transition-all"
                            unoptimized={!memory.user.image || memory.user.image.startsWith("https://api.dicebear.com")}
                        />
                        <span className={`text-[11px] font-black uppercase transition-colors group-hover/author:text-[#FF00FF] ${theme ? (isDarkTheme(theme) ? "text-white" : "text-black/70") : "text-black/70"}`}>
                            {memory.user.name}
                        </span>
                    </Link>

                    <div className={`flex items-center gap-2.5 ${theme?.footerTextColor ?? "text-black/40"}`}>
                        <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <Heart className="w-3.5 h-3.5" />
                            {memory._count?.reactions ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {memory._count?.comments ?? 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Full-card clickable overlay */}
            <Link
                href={`/memories/${memory.id}`}
                className="absolute inset-0 z-20"
                aria-label={`View ${memory.title}`}
            />
        </div>
    )
}