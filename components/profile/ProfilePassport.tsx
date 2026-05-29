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
        { id: "total", label: "Total Kenangan", value: stats.totalMemories, icon: Globe, bg: "var(--mm-secondary)", rotate: "-3deg" },
        { id: "visual", label: "Foto", value: stats.memoriesWithPhotos, icon: ImageIcon, bg: "var(--mm-primary)", rotate: "2deg" },
        { id: "journal", label: "Jurnal", value: stats.memoriesTextOnly, icon: BookOpen, bg: "var(--mm-lime)", rotate: "-1deg" },
        { id: "map", label: "Titik Kenangan", value: stats.mappedMemories, icon: MapPin, bg: "var(--mm-accent)", rotate: "4deg" },
    ]

    return (
        <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_#000] rounded-2xl p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden h-full">
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-[var(--mm-secondary)] border-[2.5px] border-black shadow-[2.5px_2.5px_0_#000] rounded-xl">
                    <BookOpen className="w-4 h-4 text-black" />
                </div>
                <h2 className="text-lg font-black text-black tracking-tight uppercase">Cap Paspor Kenangan</h2>
                <div className="flex-1 border-t-[3px] border-dashed border-black" />
            </div>

            {stats.totalMemories === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center relative z-10">
                    <Globe className="w-12 h-12 text-neutral-300 mb-4" />
                    <p className="text-sm text-neutral-500 font-bold max-w-[300px]">
                        {isOwner ? "Buku paspormu masih kosong. Mulailah membuat kenangan!" : `${user.name} belum membagikan lembar paspornya.`}
                    </p>
                    {isOwner && (
                        <Link href="/memories/create" className="mt-5 text-xs font-black uppercase text-black bg-[var(--mm-primary)] border-[2.5px] border-black rounded-xl px-5 py-2.5 shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] active:translate-y-px active:shadow-none transition-all">
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
                                    className="relative flex flex-col items-center justify-center p-4 aspect-square max-w-[120px] mx-auto group cursor-default border-[2.5px] border-black shadow-[3px_3px_0_#000] rounded-2xl"
                                    style={{ background: stamp.bg }}
                                >
                                    <Icon className="w-5 h-5 mb-1.5 z-10 text-black" />
                                    <span className="text-3xl font-black tracking-tighter leading-none z-10 text-black">{stamp.value}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-center mt-2 z-10 text-black">{stamp.label}</span>
                                </motion.div>
                            )
                        })}
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--mm-accent)] border-[2px] border-black shadow-[2.5px_2.5px_0_#000] rounded-xl">
                            <Heart className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-black text-white">{stats.totalReactions} <span className="text-white/70 font-bold ml-1">Suka</span></span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--mm-lime)] border-[2px] border-black shadow-[2.5px_2.5px_0_#000] rounded-xl">
                            <MessageCircle className="w-3.5 h-3.5 text-black" />
                            <span className="text-xs font-black text-black">{stats.totalComments} <span className="text-black/70 font-bold ml-1">Komentar</span></span>
                        </div>
                    </motion.div>
                </>
            )}

            <div className="absolute right-[-5%] bottom-[-15%] opacity-[0.04] pointer-events-none -rotate-12">
                <Globe className="w-64 h-64 text-black" />
            </div>
        </div>
    )
}
