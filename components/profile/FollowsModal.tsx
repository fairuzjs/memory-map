import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Loader2, UserRound, ChevronRight, UserCheck } from "lucide-react"
import Link from "next/link"

interface FollowsModalProps {
    isOpen: boolean
    onClose: () => void
    type: "followers" | "following"
    userId: string
    isOwner: boolean
    onAction: (targetId: string, action: "unfollow" | "remove_follower") => Promise<void>
}

export function FollowsModal({ isOpen, onClose, type, userId, isOwner, onAction }: FollowsModalProps) {
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (!isOpen) return
        const fetchFollows = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/users/${userId}/follows?type=${type}&search=${search}`)
                if (res.ok) setList(await res.json())
            } finally {
                setLoading(false)
            }
        }
        const delay = setTimeout(fetchFollows, 300)
        return () => clearTimeout(delay)
    }, [isOpen, type, search, userId])

    const handleInternalAction = async (userToRemove: any) => {
        const action = type === "following" ? "unfollow" : "remove_follower"
        
        // Optimistic Update: Remove from list immediately
        const previousList = [...list]
        setList(prev => prev.filter(u => u.id !== userToRemove.id))
        
        try {
            await onAction(userToRemove.id, action)
        } catch (error) {
            // Rollback on error
            setList(previousList)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-md bg-neutral-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white capitalize">
                                {type === "followers" ? "Pengikut" : "Diikuti"}
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto px-2 pb-4 scrollbar-hide">
                            {loading && list.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                    <span className="text-xs text-neutral-600">Memuat daftar...</span>
                                </div>
                            ) : list.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                    <UserRound className="w-10 h-10 text-neutral-800 mb-3" />
                                    <p className="text-sm text-neutral-500">Tidak ada hasil ditemukan</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {list.map((targetUser) => (
                                        <motion.div 
                                            layout
                                            key={targetUser.id} 
                                            initial={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all"
                                        >
                                            <Link href={`/profile/${targetUser.id}`} onClick={onClose} className="flex items-center gap-3 flex-1">
                                                <img 
                                                    src={targetUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`} 
                                                    alt={targetUser.name} 
                                                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                                                        {targetUser.username || targetUser.name}
                                                    </span>
                                                    {targetUser.username && <span className="text-[11px] text-neutral-500">{targetUser.name}</span>}
                                                </div>
                                            </Link>

                                            {isOwner && (
                                                <button
                                                    onClick={() => handleInternalAction(targetUser)}
                                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                                                >
                                                    {type === "following" ? "Unfollow" : "Hapus"}
                                                </button>
                                            )}
                                            {!isOwner && (
                                                <ChevronRight className="w-4 h-4 text-neutral-800" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
