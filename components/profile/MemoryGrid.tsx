import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Heart, MessageCircle, Plus, Users, Music, Image as ImageIcon, Pin } from "lucide-react"
import Link from "next/link"
import { EMOTION_COLOR, EMOTION_BG, EMOTION_LABEL } from "./ProfileUtils"
import { MemoryModal } from "./MemoryModal"
import { getMemoryCover } from "@/lib/utils"

export function MemoryGridCell({ memory, onClick, profileId }: { memory: any; onClick: () => void; profileId: string }) {
    const photo = getMemoryCover(memory)
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
            className="relative aspect-square overflow-hidden cursor-pointer group bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl hover:shadow-[6px_6px_0_#000] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all"
        >
            {photo ? (
                <img src={photo} alt={memory.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4 text-center bg-neutral-50"
                    style={{
                        backgroundImage: "linear-gradient(#E8E8E8 1.5px, transparent 1.5px), linear-gradient(90deg, #E8E8E8 1.5px, transparent 1.5px)",
                        backgroundSize: "14px 14px",
                    }}>
                    <div className="w-8 h-8 flex items-center justify-center mb-2 sm:mb-3 bg-white border-[2px] border-black shadow-[2px_2px_0_#000] rounded-lg">
                        <Heart className="w-4 h-4" style={{ fill: emotionColor, stroke: emotionColor }} />
                    </div>
                    <p className="text-black text-xs sm:text-sm font-black leading-normal line-clamp-3 relative z-10 uppercase">
                        {memory.title}
                    </p>
                    <p className="text-neutral-500 text-[9px] sm:text-[10px] mt-1.5 sm:mt-2 line-clamp-2 relative z-10 font-bold">
                        {memory.story}
                    </p>
                </div>
            )}

            <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
                {hasAudio && (
                    <div className={`flex items-center justify-center w-6 h-6 border-[2px] border-black shadow-[1px_1px_0_#000] rounded-lg ${memory.spotifyTrackId ? "bg-[#86efac]" : "bg-[#f5d0fe]"}`} title="Mempunyai musik">
                        <Music className="w-3 h-3 text-black" />
                    </div>
                )}
                {isCollab && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#67e8f9] border-[2px] border-black shadow-[1px_1px_0_#000] rounded-lg" title="Kolaborasi">
                        <Users className="w-2.5 h-2.5 text-black" />
                        <span className="text-[9px] font-black text-black tracking-wide uppercase">Collab</span>
                    </div>
                )}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/60 backdrop-blur-[1px]">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5 text-white">
                        <Heart 
                            className={`w-5 h-5 transition-colors ${memory.isLikedByMe ? "text-[#f5d0fe] fill-[#f5d0fe]" : "fill-white"}`} 
                        />
                        <span className={`text-sm font-black transition-colors ${memory.isLikedByMe ? "text-[#f5d0fe]" : "text-white"}`}>
                            {memory._count?.reactions ?? 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span className="text-sm font-black">{memory._count?.comments ?? 0}</span>
                    </div>
                </div>
                <div className="px-2.5 py-1 text-[10px] font-black uppercase bg-white border-[2px] border-black text-black shadow-[2px_2px_0_#000] rounded-lg">
                    {EMOTION_LABEL[memory.emotion] ?? memory.emotion}
                </div>
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                {memory.isPinned && (
                    <div className="flex items-center justify-center w-6 h-6 bg-[var(--mm-primary)] border-[2px] border-black shadow-[1px_1px_0_#000] rounded-lg" title="Disematkan">
                        <Pin className="w-3 h-3 text-black fill-black" />
                    </div>
                )}
                {memory.photos?.length > 1 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border-[2px] border-black shadow-[1px_1px_0_#000] rounded-lg">
                        <ImageIcon className="w-2.5 h-2.5 text-black" />
                        <span className="text-[9px] font-black text-black">{memory.photos.length}</span>
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
                    <div className="w-9 h-9 flex items-center justify-center bg-[var(--mm-primary)] border-[2.5px] border-black shadow-[2.5px_2.5px_0_#000] rounded-xl">
                        <ImageIcon className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-black text-black leading-none tracking-tight uppercase">
                            Kenangan
                        </h2>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-bold">{memories.length} kenangan tersimpan</p>
                    </div>
                </div>
                {isOwner && (
                    <Link href="/memories/create"
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase text-black bg-[var(--mm-primary)] border-[2.5px] border-black shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all">
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                    </Link>
                )}
            </div>

            {memories.filter(m => m.isPinned).length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Pin className="w-4 h-4 text-black fill-black" />
                        <h3 className="text-sm font-black text-black uppercase">Disematkan</h3>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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

            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
