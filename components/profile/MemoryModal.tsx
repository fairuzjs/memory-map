import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, MapPin, Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { EMOTION_LABEL, EMOTION_COLOR, EMOTION_BG } from "./ProfileUtils"
import { formatDate } from "@/lib/utils"

interface MemoryModalProps {
    memory: any
    onClose: () => void
    onReact?: () => void
}

export function MemoryModal({ memory, onClose, onReact }: MemoryModalProps) {
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
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85"
            style={{ backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                onClick={e => e.stopPropagation()}
                className="relative flex flex-col sm:flex-row w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden"
                style={{ background: "rgba(12,12,20,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
            >
                {/* Close */}
                <button onClick={onClose}
                    className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 border border-white/10 text-white hover:bg-white/10 transition-all">
                    <X className="w-4 h-4" />
                </button>

                {/* Left: Photo / Visual */}
                <div className="relative sm:w-[55%] aspect-square sm:aspect-auto bg-black flex-shrink-0">
                    {photos.length > 0 ? (
                        <>
                            <img src={photos[photoIdx].url} alt="" className="w-full h-full object-cover" />
                            {/* Photo navigation */}
                            {photos.length > 1 && (
                                <>
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                                        {photos.map((_: any, i: number) => (
                                            <button key={i} onClick={() => setPhotoIdx(i)}
                                                className="w-1.5 h-1.5 rounded-full transition-all"
                                                style={{ background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.35)" }} />
                                        ))}
                                    </div>
                                    <button onClick={() => setPhotoIdx(p => Math.max(0, p - 1))}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all disabled:opacity-0"
                                        disabled={photoIdx === 0}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setPhotoIdx(p => Math.min(photos.length - 1, p + 1))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all disabled:opacity-0"
                                        disabled={photoIdx === photos.length - 1}>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, rgba(8,8,22,1) 0%, ${emotionBg} 100%)` }}>
                            <div className="absolute inset-0 opacity-[0.04]"
                                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                            <div className="text-6xl opacity-30 select-none" style={{ color: emotionColor }}>✦</div>
                        </div>
                    )}
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none"
                        style={{ background: "linear-gradient(to top, rgba(12,12,20,0.9), transparent)" }} />
                </div>

                {/* Right: Info */}
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {/* Emotion badge */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                                style={{ background: emotionBg, color: emotionColor, border: `1px solid ${emotionColor}40` }}>
                                {EMOTION_LABEL[memory.emotion] ?? memory.emotion}
                            </span>
                            <span className="text-[10px] text-neutral-600">
                                {formatDate(memory.date)}
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-white leading-snug mb-1" style={{ fontFamily: "'Syne',sans-serif" }}>
                            {memory.title}
                        </h3>
                        {memory.locationName && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                                    <MapPin className="w-3 h-3" />
                                    <span>{memory.locationName}</span>
                                </div>
                                <Link 
                                    href={`/map?lat=${memory.latitude}&lng=${memory.longitude}&memoryId=${memory.id}`}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
                                >
                                    Lihat di Peta
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Story */}
                    <div className="px-5 py-4 flex-1">
                        <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line line-clamp-[10]">
                            {memory.story}
                        </p>
                    </div>

                    {/* Footer: reactions + link */}
                    <div className="px-5 py-4 flex items-center justify-between"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onReact?.(); }}
                                className="flex items-center gap-1.5 transition-all active:scale-95 hover:opacity-80"
                            >
                                <Heart 
                                    className={`w-4 h-4 transition-colors ${memory.isLikedByMe ? "text-pink-500 fill-pink-500" : "text-neutral-400"}`} 
                                />
                                <span className={`text-sm font-semibold transition-colors ${memory.isLikedByMe ? "text-pink-500" : "text-white"}`}>
                                    {memory._count?.reactions ?? 0}
                                </span>
                            </button>
                            <div className="flex items-center gap-1.5 text-neutral-400">
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-semibold text-white">{memory._count?.comments ?? 0}</span>
                            </div>
                        </div>
                        <Link href={`/memories/${memory.id}`}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>
                            Lihat Detail
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
