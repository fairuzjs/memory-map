import React from "react"
import { motion } from "framer-motion"
import { BookOpen, Globe, ImageIcon, Heart, MessageCircle, MapPin } from "lucide-react"
import Link from "next/link"

interface ProfilePassportProps {
    user: any
    isOwner: boolean
    stats: {
        totalMemories: number
        memoriesWithPhotos: number
        memoriesTextOnly: number
        mappedMemories: number
        totalReactions: number
        totalComments: number
    }
}

export function ProfilePassport({ user, isOwner, stats }: ProfilePassportProps) {
    const stamps = [
        { id: "total", label: "Total Kenangan", value: stats.totalMemories, icon: Globe, color: "#818cf8", border: "rgba(99,102,241,0.4)", bg: "rgba(99,102,241,0.06)", rotate: "-3deg" },
        { id: "visual", label: "Foto", value: stats.memoriesWithPhotos, icon: ImageIcon, color: "#60a5fa", border: "rgba(59,130,246,0.4)", bg: "rgba(59,130,246,0.06)", rotate: "2deg" },
        { id: "journal", label: "Jurnal", value: stats.memoriesTextOnly, icon: BookOpen, color: "#34d399", border: "rgba(52,211,153,0.4)", bg: "rgba(52,211,153,0.06)", rotate: "-1deg" },
        { id: "map", label: "Titik Kenangan", value: stats.mappedMemories, icon: MapPin, color: "#f472b6", border: "rgba(244,114,182,0.4)", bg: "rgba(244,114,182,0.06)", rotate: "4deg" },
    ]

    return (
        <div className="rounded-[1.5rem] p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden h-full"
            style={{ background: "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">Cap Paspor Kenangan</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/20 to-transparent" />
            </div>

            {stats.totalMemories === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center relative z-10">
                    <Globe className="w-12 h-12 text-neutral-800 mb-4" />
                    <p className="text-sm text-neutral-400 max-w-[300px]">
                        {isOwner ? "Buku paspormu masih kosong. Mulailah membuat kenangan!" : `${user.name} belum membagikan lembar paspornya.`}
                    </p>
                    {isOwner && (
                        <Link href="/memories/create" className="mt-5 text-xs font-bold text-indigo-400 border border-indigo-500/30 px-5 py-2 rounded-xl hover:bg-indigo-500/10 transition-all">
                            Tambah Cap Pertama
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 relative z-10 mt-2">
                        {stamps.map((stamp, idx) => {
                            const Icon = stamp.icon;
                            return (
                                <motion.div
                                    key={stamp.id}
                                    initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
                                    animate={{ opacity: 1, scale: 1, rotate: stamp.rotate }}
                                    transition={{ delay: 0.2 + (idx * 0.1), type: "spring", stiffness: 150, damping: 15 }}
                                    whileHover={{ scale: 1.05, rotate: 0 }}
                                    className="relative flex flex-col items-center justify-center p-4 rounded-full aspect-square max-w-[120px] mx-auto group cursor-default"
                                    style={{ background: stamp.bg, border: `2px dashed ${stamp.border}`, boxShadow: `0 0 20px ${stamp.bg}` }}
                                >
                                    <Icon className="w-5 h-5 mb-1.5 opacity-80 z-10" style={{ color: stamp.color }} />
                                    <span className="text-3xl font-black tracking-tighter leading-none z-10" style={{ color: stamp.color }}>{stamp.value}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-center mt-2 opacity-80 z-10" style={{ color: stamp.color }}>{stamp.label}</span>
                                </motion.div>
                            )
                        })}
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                            <span className="text-xs font-bold text-white">{stats.totalReactions} <span className="text-neutral-500 font-medium ml-1">Suka</span></span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-bold text-white">{stats.totalComments} <span className="text-neutral-500 font-medium ml-1">Komentar</span></span>
                        </div>
                    </motion.div>
                </>
            )}

            <div className="absolute right-[-5%] bottom-[-15%] opacity-[0.02] pointer-events-none -rotate-12">
                <Globe className="w-64 h-64 text-white" />
            </div>
        </div>
    )
}
