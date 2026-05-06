import Link from "next/link"
import { MapPin, Calendar, Heart, MessageCircle, Users, Music } from "lucide-react"
import { StickerRenderer, StickerConfig } from "./StickerRenderer"
import { formatDate } from "@/lib/utils"

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
    HAPPY: { icon: "🌟", bg: "bg-[#FFFF00]", border: "border-black" },
    SAD: { icon: "💧", bg: "bg-[#00FFFF]", border: "border-black" },
    NOSTALGIC: { icon: "🕰️", bg: "bg-[#FF9900]", border: "border-black" },
    EXCITED: { icon: "🔥", bg: "bg-[#FF00FF]", border: "border-black" },
    PEACEFUL: { icon: "🍃", bg: "bg-[#00FF00]", border: "border-black" },
    GRATEFUL: { icon: "🙏", bg: "bg-[#E5E5E5]", border: "border-black" },
    ROMANTIC: { icon: "❤️", bg: "bg-[#FF3366]", border: "border-black" },
    ADVENTUROUS: { icon: "🏕️", bg: "bg-[#9900FF]", border: "border-black" },
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
            className="group relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px]"
            style={{
                background: theme?.background ?? "#FFFDF0",
                border: theme?.border ?? "3px solid #000",
                borderRadius: theme?.radius ?? "0px",
                boxShadow: theme?.shadow ?? "6px 6px 0 #000",
            }}
        >
            {/* ── Photo area ───────────────────────────────────────────────────── */}
            {hasPhoto && (
                <div
                    className="relative w-full h-48 shrink-0 overflow-hidden border-b-[3px] border-black"
                    style={{ borderRadius: theme ? `${theme.radius} ${theme.radius} 0 0` : "0px" }}
                >
                    <img
                        src={photos[0].url}
                        alt={memory.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

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
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000]">
                            <Users className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-black text-white tracking-wider uppercase">Collab</span>
                        </div>
                    )}

                    {/* Music badge */}
                    {(memory.audioUrl || memory.spotifyTrackId) && (
                        <div 
                            className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000] ${
                                memory.spotifyTrackId 
                                    ? "bg-[#1DB954]" 
                                    : "bg-[#00FFFF]"
                            }`} 
                            title={memory.spotifyTrackId ? "Mempunyai lagu Spotify" : "Memiliki musik"}
                        >
                            <Music className="w-3 h-3 text-black" />
                        </div>
                    )}
                </div>
            )}

            {/* ── Content area ─────────────────────────────────────────────────── */}
            <div className={`relative flex flex-col flex-1 ${theme?.contentPadding ?? "p-5"}`}>

                {/* Collab badge — jika tidak ada foto, tampil di sini */}
                {collab && !hasPhoto && (
                    <div className="flex justify-end mb-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000]">
                            <Users className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-black text-white tracking-wider uppercase">Collab</span>
                        </div>
                    </div>
                )}

                {/* Emotion + Title row */}
                <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 w-10 h-10 flex items-center justify-center border-[2px] shadow-[2px_2px_0_#000] ${emotion.bg} ${emotion.border}`}>
                        <span className="text-xl leading-none">{emotion.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p
                            className="text-[15px] font-black line-clamp-1 leading-snug uppercase tracking-tight"
                            style={{ color: theme?.titleColor ?? "#000" }}
                        >
                            {memory.title}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-bold mt-1" style={{ color: theme?.storyColor ?? "#555" }}>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 shrink-0 text-black" />
                                {formatDate(memory.date)}
                            </span>
                            {memory.locationName && (
                                <Link
                                    href={`/map?lat=${memory.latitude}&lng=${memory.longitude}&memoryId=${memory.id}`}
                                    className="flex items-center gap-1 min-w-0 group/loc relative z-30 hover:text-[#FF00FF] transition-colors"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <MapPin className="w-3 h-3 shrink-0 group-hover/loc:animate-bounce text-black" />
                                    <span className="truncate max-w-[90px]">{memory.locationName}</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Story */}
                <p
                    className="flex-1 text-[13px] font-medium line-clamp-3 leading-relaxed mb-4"
                    style={{ color: theme?.storyColor ?? "#333" }}
                >
                    {memory.story}
                </p>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3.5 border-t-[3px] border-black ${theme?.footerBorder ?? ""}`}>
                    <Link
                        href={`/profile/${memory.user.id}`}
                        className="relative z-30 flex items-center gap-2 group/author"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                            alt={memory.user.name}
                            className="w-7 h-7 border-[2px] border-black group-hover/author:border-[#FF00FF] transition-colors object-cover"
                        />
                        <span className={`text-[12px] font-black uppercase transition-colors group-hover/author:text-[#FF00FF] ${theme?.footerTextColor ?? "text-black"}`}>
                            {memory.user.name}
                        </span>
                    </Link>

                    <div className={`flex items-center gap-3 font-black ${theme?.footerTextColor ?? "text-black"}`}>
                        <span className="flex items-center gap-1 text-[12px]">
                            <Heart className="w-4 h-4 text-black" />
                            {memory._count?.reactions ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-[12px]">
                            <MessageCircle className="w-4 h-4 text-black" />
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