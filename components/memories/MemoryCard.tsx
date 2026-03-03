import Link from "next/link"
import { MapPin, Calendar, Heart, MessageCircle } from "lucide-react"

interface MemoryCardProps {
    memory: any
}

const emotionMap: Record<string, { icon: string; bg: string; border: string }> = {
    HAPPY:       { icon: "🌟", bg: "bg-yellow-500/10",  border: "border-yellow-500/20"  },
    SAD:         { icon: "💧", bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
    NOSTALGIC:   { icon: "🕰️", bg: "bg-amber-600/10",  border: "border-amber-500/20"   },
    EXCITED:     { icon: "🔥", bg: "bg-orange-500/10",  border: "border-orange-500/20"  },
    PEACEFUL:    { icon: "🍃", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    GRATEFUL:    { icon: "🙏", bg: "bg-teal-500/10",    border: "border-teal-500/20"    },
    ROMANTIC:    { icon: "❤️", bg: "bg-rose-500/10",   border: "border-rose-500/20"    },
    ADVENTUROUS: { icon: "🏕️", bg: "bg-indigo-500/10", border: "border-indigo-500/20"  },
}

export function MemoryCard({ memory }: MemoryCardProps) {
    const emotion = emotionMap[memory.emotion] ?? emotionMap.HAPPY
    const photos  = memory.photos ?? []
    const hasPhoto = photos.length > 0

    return (
        // ─── Outer wrapper: relative + overflow-hidden clips everything inside ───
        <div className="group relative flex flex-col h-full bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl shadow-neutral-900/50 hover:-translate-y-1">

            {/* ── Photo area — only rendered when memory has photos ───────────── */}
            {hasPhoto && (
                <div className="relative w-full h-48 shrink-0 overflow-hidden">
                    <img
                        src={photos[0].url}
                        alt={memory.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/20 to-transparent" />
                </div>
            )}

            {/* ── Content area — grows to fill remaining height ────────────────── */}
            <div className="relative flex flex-col flex-1 p-5">

                {/* Emotion + Title row — emotion badge stays INSIDE the card */}
                <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border ${emotion.bg} ${emotion.border}`}>
                        <span className="text-lg leading-none">{emotion.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-100 line-clamp-1 leading-snug">
                            {memory.title}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1">
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

                {/* Story — flex-1 lets this fill space, keeping footer pinned to bottom */}
                <p className="flex-1 text-neutral-400 text-[13px] line-clamp-3 leading-relaxed mb-4">
                    {memory.story}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3.5 border-t border-neutral-800/60">
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
                        <span className="text-[11px] text-neutral-500 group-hover/author:text-indigo-400 transition-colors">
                            {memory.user.name}
                        </span>
                    </Link>

                    <div className="flex items-center gap-3 text-neutral-600">
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

            {/* Full-card clickable overlay — sits above content but below author link */}
            <Link
                href={`/memories/${memory.id}`}
                className="absolute inset-0 z-20"
                aria-label={`View ${memory.title}`}
            />
        </div>
    )
}