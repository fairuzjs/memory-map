import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Heart, MessageCircle, Plus, Users, Music, Image as ImageIcon, Pin } from "lucide-react"
import Link from "next/link"
import { EMOTION_COLOR, EMOTION_BG, EMOTION_LABEL } from "./ProfileUtils"
import { MemoryModal } from "./MemoryModal"

export function MemoryGridCell({ memory, onClick, profileId }: { memory: any; onClick: () => void; profileId: string }) {
    let photo = null
    if (memory.photos?.[0]) {
        try {
            const parsed = JSON.parse(memory.photos[0].url)
            photo = parsed.url || memory.photos[0].url
        } catch {
            photo = memory.photos[0].url
        }
    }
    const emotionColor = EMOTION_COLOR[memory.emotion] ?? "#818cf8"
    const emotionBg = EMOTION_BG[memory.emotion] ?? "rgba(99,102,241,0.15)"
    
    const isCollab = memory.userId !== profileId || memory.isCollaboration;
    const hasAudio = !!(memory.audioUrl || memory.spotifyTrackId);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onClick={onClick}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            style={{ background: "#0d0d14", border: `1px solid rgba(255,255,255,0.04)` }}
        >
            {photo ? (
                <img src={photo} alt={memory.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4 text-center transition-transform duration-500 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${emotionBg} 0%, rgba(13,13,20,1) 100%)` }}>
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-xl"
                        style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${emotionColor}40` }}>
                        <Heart className="w-4 h-4" style={{ fill: emotionColor, stroke: emotionColor }} />
                    </div>
                    <p className="text-white text-xs sm:text-sm font-bold leading-normal line-clamp-3 relative z-10"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                        {memory.title}
                    </p>
                    <p className="text-neutral-400 text-[9px] sm:text-[10px] mt-1.5 sm:mt-2 line-clamp-2 relative z-10 font-medium">
                        {memory.story}
                    </p>
                </div>
            )}

            <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
                {hasAudio && (
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border shadow-sm backdrop-blur-sm ${memory.spotifyTrackId ? "bg-[#1DB954]/90 border-[#1DB954]/30" : "bg-fuchsia-600/90 border-fuchsia-400/30"}`} title="Mempunyai musik">
                        <Music className="w-3 h-3 text-white" />
                    </div>
                )}
                {isCollab && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-600/90 backdrop-blur-sm border border-violet-400/30 shadow-sm" title="Kolaborasi">
                        <Users className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] font-bold text-white tracking-wide">Collab</span>
                    </div>
                )}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200"
                style={{ background: "rgba(0,0,0,0.58)", backdropFilter: "blur(2px)" }}>
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5 text-white">
                        <Heart 
                            className={`w-5 h-5 transition-colors ${memory.isLikedByMe ? "text-pink-500 fill-pink-500" : "fill-white"}`} 
                        />
                        <span className={`text-sm font-bold transition-colors ${memory.isLikedByMe ? "text-pink-500" : "text-white"}`}>
                            {memory._count?.reactions ?? 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span className="text-sm font-bold">{memory._count?.comments ?? 0}</span>
                    </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: emotionBg, color: emotionColor, border: `1px solid ${emotionColor}50` }}>
                    {EMOTION_LABEL[memory.emotion] ?? memory.emotion}
                </div>
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                {memory.isPinned && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/80 backdrop-blur-md border border-indigo-300/30 shadow-sm" title="Disematkan">
                        <Pin className="w-3 h-3 text-white fill-white" />
                    </div>
                )}
                {memory.photos?.length > 1 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md opacity-90"
                        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
                        <ImageIcon className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] font-bold text-white">{memory.photos.length}</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export function MemoryGrid({ memories, isOwner, profileId, onReact, onPin }: { memories: any[]; isOwner: boolean; profileId: string; onReact: (id: string) => Promise<void>; onPin?: (id: string) => Promise<void> }) {
    const [selectedMemory, setSelectedMemory] = useState<any | null>(null)

    if (memories.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-black text-white leading-none tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Kenangan
                        </h2>
                        <p className="text-[10px] text-neutral-600 mt-0.5">{memories.length} kenangan tersimpan</p>
                    </div>
                </div>
                {isOwner && (
                    <Link href="/memories/create"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                    </Link>
                )}
            </div>

            {memories.filter(m => m.isPinned).length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Pin className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                        <h3 className="text-sm font-bold text-white">Disematkan</h3>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-1.5">
                        {memories.filter(m => m.isPinned).map((memory) => (
                            <MemoryGridCell
                                key={memory.id}
                                memory={memory}
                                onClick={() => setSelectedMemory(memory)}
                                profileId={profileId}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-1.5">
                {memories.filter(m => !m.isPinned).map((memory) => (
                    <MemoryGridCell
                        key={memory.id}
                        memory={memory}
                        onClick={() => setSelectedMemory(memory)}
                        profileId={profileId}
                    />
                ))}
            </div>

            <AnimatePresence>
                {selectedMemory && (
                    <MemoryModal 
                        memory={memories.find(m => m.id === selectedMemory.id) || selectedMemory} 
                        onClose={() => setSelectedMemory(null)} 
                        onReact={() => onReact(selectedMemory.id)}
                        isOwner={isOwner}
                        onPin={onPin ? () => onPin(selectedMemory.id) : undefined}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}
