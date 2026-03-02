import Link from "next/link"
import { MapPin, Calendar, Heart, MessageCircle } from "lucide-react"

interface MemoryCardProps {
    memory: any
}

const emotionMap: Record<string, { icon: string; bg: string; text: string }> = {
    HAPPY: { icon: "🌟", bg: "bg-yellow-500/10", text: "text-yellow-500" },
    SAD: { icon: "💧", bg: "bg-blue-500/10", text: "text-blue-500" },
    NOSTALGIC: { icon: "🕰️", bg: "bg-amber-600/10", text: "text-amber-500" },
    EXCITED: { icon: "🔥", bg: "bg-orange-500/10", text: "text-orange-500" },
    PEACEFUL: { icon: "🍃", bg: "bg-emerald-500/10", text: "text-emerald-500" },
    GRATEFUL: { icon: "🙏", bg: "bg-teal-500/10", text: "text-teal-500" },
    ROMANTIC: { icon: "❤️", bg: "bg-rose-500/10", text: "text-rose-500" },
    ADVENTUROUS: { icon: "🏕️", bg: "bg-indigo-500/10", text: "text-indigo-500" },
}

export function MemoryCard({ memory }: MemoryCardProps) {
    const emotion = emotionMap[memory.emotion] || emotionMap.HAPPY
    const photo = memory.photos?.[0]

    return (
        <div className="group bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl shadow-neutral-900/50 hover:-translate-y-1">
            {photo && (
                <div className="w-full h-48 overflow-hidden relative">
                    <img src={photo.url} alt={memory.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-80" />
                </div>
            )}

            <div className={`p-5 ${!photo ? "pt-6" : "-mt-6 relative z-10"}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-xl backdrop-blur-md border border-white/10 ${emotion.bg}`}>
                        <span className="text-xl leading-none">{emotion.icon}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-200 line-clamp-1">{memory.title}</span>
                        <div className="flex gap-3 text-xs text-neutral-400 mt-1">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(memory.date).toLocaleDateString()}
                            </div>
                            {memory.locationName && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">{memory.locationName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-neutral-400 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {memory.story}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
                    {/* Author — clickable, sits above the card's absolute link overlay */}
                    <Link
                        href={`/profile/${memory.user.id}`}
                        className="relative z-30 flex items-center gap-2 group/author"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                            alt={memory.user.name}
                            className="w-6 h-6 rounded-full border border-neutral-700 group-hover/author:border-indigo-500 transition-colors object-cover"
                        />
                        <span className="text-xs text-neutral-400 group-hover/author:text-indigo-400 transition-colors">
                            {memory.user.name}
                        </span>
                    </Link>

                    <div className="flex items-center gap-3 text-neutral-500">
                        <div className="flex items-center gap-1 text-xs">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{memory._count?.reactions || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{memory._count?.comments || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            <Link href={`/memories/${memory.id}`} className="absolute inset-0 z-20" aria-label={`View ${memory.title}`} />
        </div>
    )
}
