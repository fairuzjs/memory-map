import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, MapPin, Heart, MessageCircle, ChevronLeft, ChevronRight, Pin } from "lucide-react"
import Link from "next/link"
import { EMOTION_LABEL, EMOTION_COLOR, EMOTION_BG } from "./ProfileUtils"
import { formatDate } from "@/lib/utils"

interface MemoryModalProps {
    memory: any
    onClose: () => void
    onReact?: () => void
    isOwner?: boolean
    onPin?: () => void
}

export function MemoryModal({ memory, onClose, onReact, isOwner, onPin }: MemoryModalProps) {
    const [photoIdx, setPhotoIdx] = useState(0)
    const photos = (memory.photos ?? []).map((p: any) => {
        try {
            const parsed = JSON.parse(p.url)
            return { ...p, url: parsed.url || p.url }
        } catch {
            return p
        }
    })
    const emotionColor = EMOTION_COLOR[memory.emotion] ?? "#818cf8"
    const emotionBg = EMOTION_BG[memory.emotion] ?? "rgba(99,102,241,0.15)"

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [onClose])

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                onClick={e => e.stopPropagation()}
                className="relative flex flex-col sm:flex-row w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white border-[4px] border-black shadow-[12px_12px_0_#000]"
            >
                {/* Close */}
                <button onClick={onClose}
                    className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center bg-white border-[2px] border-black text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                    <X className="w-4 h-4" />
                </button>

                {/* Left: Photo / Visual */}
                <div className="relative sm:w-[55%] aspect-[4/5] sm:aspect-square bg-[#E5E5E5] flex-shrink-0 border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-black">
                    {photos.length > 0 ? (
                        <>
                            <img src={photos[photoIdx].url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            {/* Photo navigation */}
                            {photos.length > 1 && (
                                <>
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                        {photos.map((_: any, i: number) => (
                                            <button key={i} onClick={() => setPhotoIdx(i)}
                                                className="w-2.5 h-2.5 border-[2px] border-black transition-all"
                                                style={{ background: i === photoIdx ? "#FFFF00" : "#fff" }} />
                                        ))}
                                    </div>
                                    <button onClick={() => setPhotoIdx(p => Math.max(0, p - 1))}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-[2px] border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-0"
                                        disabled={photoIdx === 0}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setPhotoIdx(p => Math.min(photos.length - 1, p + 1))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-[2px] border-black flex items-center justify-center text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-0"
                                        disabled={photoIdx === photos.length - 1}>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#E5E5E5]"
                            style={{
                                backgroundImage: "linear-gradient(#D5D5D5 2px, transparent 2px), linear-gradient(90deg, #D5D5D5 2px, transparent 2px)",
                                backgroundSize: "24px 24px",
                            }}>
                            <div className="text-6xl select-none font-black text-black/10">✦</div>
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="pl-5 pr-5 sm:pr-14 pt-5 pb-4 border-b-[3px] border-dashed border-black">
                        {/* Emotion badge and Pin button */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-white border-[2px] border-black shadow-[2px_2px_0_#000]"
                                    style={{ color: emotionColor }}>
                                    {EMOTION_LABEL[memory.emotion] ?? memory.emotion}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-bold">
                                    {formatDate(memory.date)}
                                </span>
                            </div>
                            {isOwner && onPin && (
                                <button
                                    onClick={onPin}
                                    className={`flex items-center justify-center w-8 h-8 border-[2px] border-black transition-all shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none ${memory.isPinned ? "bg-[#FFFF00] text-black" : "bg-white text-black"}`}
                                    title={memory.isPinned ? "Batal Sematkan" : "Sematkan Kenangan"}
                                >
                                    <Pin className={`w-4 h-4 ${memory.isPinned ? "fill-black" : ""}`} />
                                </button>
                            )}
                        </div>
                        <h3 className="text-lg font-black text-black leading-snug mb-1 uppercase">
                            {memory.title}
                        </h3>
                        {memory.locationName && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-bold">
                                    <MapPin className="w-3 h-3" />
                                    <span>{memory.locationName}</span>
                                </div>
                                <Link 
                                    href={`/map?lat=${memory.latitude}&lng=${memory.longitude}&memoryId=${memory.id}`}
                                    className="text-[10px] font-black uppercase text-black bg-[#00FFFF] border-[2px] border-black px-2 py-0.5 shadow-[1px_1px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                                >
                                    Lihat di Peta
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Story */}
                    <div className="px-5 py-4 flex-1">
                        <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line line-clamp-[10] font-medium">
                            {memory.story}
                        </p>
                    </div>

                    {/* Footer: reactions + link */}
                    <div className="px-5 py-4 flex items-center justify-between border-t-[3px] border-dashed border-black">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onReact?.(); }}
                                className="flex items-center gap-1.5 transition-all active:scale-95 hover:opacity-80"
                            >
                                <Heart 
                                    className={`w-4 h-4 transition-colors ${memory.isLikedByMe ? "text-[#FF00FF] fill-[#FF00FF]" : "text-black"}`} 
                                />
                                <span className={`text-sm font-black transition-colors ${memory.isLikedByMe ? "text-[#FF00FF]" : "text-black"}`}>
                                    {memory._count?.reactions ?? 0}
                                </span>
                            </button>
                            <div className="flex items-center gap-1.5 text-black">
                                <MessageCircle className="w-4 h-4 text-black" />
                                <span className="text-sm font-black text-black">{memory._count?.comments ?? 0}</span>
                            </div>
                        </div>
                        <Link href={`/memories/${memory.id}`}
                            className="flex items-center gap-1.5 text-xs font-black uppercase px-3 py-1.5 bg-[#FFFF00] border-[2px] border-black text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                            Lihat Detail
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
