import Link from "next/link"
import { MapPin, Calendar, Heart, MessageCircle, Users, Music } from "lucide-react"
import { StickerRenderer, StickerConfig } from "./StickerRenderer"

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

const emotionMap: Record<string, { icon: string; bg: string; border: string }> = {
    HAPPY: { icon: "🌟", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    SAD: { icon: "💧", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    NOSTALGIC: { icon: "🕰️", bg: "bg-amber-600/10", border: "border-amber-500/20" },
    EXCITED: { icon: "🔥", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    PEACEFUL: { icon: "🍃", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    GRATEFUL: { icon: "🙏", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    ROMANTIC: { icon: "❤️", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    ADVENTUROUS: { icon: "🏕️", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
}

function parseTheme(rawValue: string | null | undefined): CardTheme | null {
    if (!rawValue) return null
    try { return JSON.parse(rawValue) } catch { return null }
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

    return (
        <div
            className="group relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
                background: theme?.background ?? "rgba(23,23,28,0.5)",
                border: theme?.border ?? "1px solid rgb(38,38,44)",
                borderRadius: theme?.radius ?? "16px",
                boxShadow: theme?.shadow ?? "0 20px 40px rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
            }}
        >
            {/* ── Photo area ───────────────────────────────────────────────────── */}
            {hasPhoto && (
                <div
                    className="relative w-full h-48 shrink-0 overflow-hidden"
                    style={{ borderRadius: theme ? `${theme.radius} ${theme.radius} 0 0` : "16px 16px 0 0" }}
                >
                    <img
                        src={photos[0].url}
                        alt={memory.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

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

                    {/* Collab badge — di atas foto */}
                    {collab && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-600/90 backdrop-blur-sm border border-violet-400/30 shadow-lg">
                            <Users className="w-3 h-3 text-white" />
                            <span className="text-[11px] font-bold text-white tracking-wide">Collab</span>
                        </div>
                    )}

                    {/* Music badge */}
                    {(memory.audioUrl || memory.spotifyTrackId) && (
                        <div 
                            className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm border shadow-lg ${
                                memory.spotifyTrackId 
                                    ? "bg-[#1DB954]/85 border-[#1DB954]/30" 
                                    : "bg-fuchsia-600/85 border-fuchsia-400/30"
                            }`} 
                            title={memory.spotifyTrackId ? "Mempunyai lagu Spotify" : "Memiliki musik"}
                        >
                            <Music className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>
            )}

            {/* ── Content area ─────────────────────────────────────────────────── */}
            <div className={`relative flex flex-col flex-1 ${theme?.contentPadding ?? "p-5"}`}>

                {/* Collab badge — jika tidak ada foto, tampil di sini */}
                {collab && !hasPhoto && (
                    <div className="flex justify-end mb-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-600/20 border border-violet-500/30">
                            <Users className="w-3 h-3 text-violet-400" />
                            <span className="text-[11px] font-bold text-violet-400 tracking-wide">Collab</span>
                        </div>
                    </div>
                )}

                {/* Emotion + Title row */}
                <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border ${emotion.bg} ${emotion.border}`}>
                        <span className="text-lg leading-none">{emotion.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <p
                            className="text-sm font-semibold line-clamp-1 leading-snug"
                            style={{ color: theme?.titleColor ?? "#f5f5f5" }}
                        >
                            {memory.title}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] mt-1" style={{ color: theme?.storyColor ?? "#737373" }}>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {new Date(memory.date).toLocaleDateString()}
                            </span>
                            {memory.locationName && (
                                <span className="flex items-center gap-1 min-w-0">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[90px]">{memory.locationName}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Story */}
                <p
                    className="flex-1 text-[13px] line-clamp-3 leading-relaxed mb-4"
                    style={{ color: theme?.storyColor ?? "#a3a3a3" }}
                >
                    {memory.story}
                </p>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3.5 ${theme?.footerBorder ?? "border-t border-neutral-800/60"}`}>
                    <Link
                        href={`/profile/${memory.user.id}`}
                        className="relative z-30 flex items-center gap-2 group/author"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                            alt={memory.user.name}
                            className="w-6 h-6 rounded-full border border-neutral-700 group-hover/author:border-indigo-500 transition-colors object-cover"
                        />
                        <span className={`text-[11px] group-hover/author:text-indigo-400 transition-colors ${theme?.footerTextColor ?? "text-neutral-500"}`}>
                            {memory.user.name}
                        </span>
                    </Link>

                    <div className={`flex items-center gap-3 ${theme?.footerTextColor ?? "text-neutral-600"}`}>
                        <span className="flex items-center gap-1 text-[11px]">
                            <Heart className="w-3.5 h-3.5" />
                            {memory._count?.reactions ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
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