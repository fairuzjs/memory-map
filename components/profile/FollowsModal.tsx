import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Loader2, UserRound, ChevronRight, UserCheck, BadgeCheck } from "lucide-react"
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
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-md bg-[#FFFDF0] border-[3px] border-black overflow-hidden shadow-[6px_6px_0_#000] rounded-3xl"
                    >
                        <div className="flex items-center justify-between px-6 py-5 border-b-[3px] border-black bg-[#F5F2EB]">
                            <h2 className="text-lg font-black text-black uppercase">
                                {type === "followers" ? "Pengikut" : "Diikuti"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center bg-white border-[2px] border-black rounded-xl shadow-[2px_2px_0_#000] hover:bg-[#f5d0fe] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all"
                            >
                                <X className="w-5 h-5 text-black" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama..."
                                    className="w-full bg-white border-[2.5px] border-black py-2.5 pl-10 pr-4 text-sm text-black font-bold focus:outline-none focus:bg-[#fef08a] focus:shadow-[2px_2px_0_#000] rounded-xl shadow-[1px_1px_0_#000] transition-all placeholder:text-neutral-400/60"
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto px-2 pb-4 scrollbar-hide">
                            {loading && list.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-6 h-6 text-black animate-spin" />
                                    <span className="text-xs text-neutral-500 font-bold">Memuat daftar...</span>
                                </div>
                            ) : list.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                    <UserRound className="w-10 h-10 text-neutral-300 mb-3" />
                                    <p className="text-sm text-neutral-500 font-bold">Tidak ada hasil ditemukan</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {list.map((targetUser) => (
                                        <motion.div 
                                            layout
                                            key={targetUser.id} 
                                            initial={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="group flex items-center justify-between p-3.5 mx-2 my-1.5 bg-white border-[2.5px] border-black rounded-2xl shadow-[2.5px_2.5px_0_#000] hover:shadow-[4px_4px_0_#000] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all"
                                        >
                                            <Link href={`/profile/${targetUser.id}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                                                <img 
                                                    src={targetUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`} 
                                                    alt={targetUser.name} 
                                                    className="w-10 h-10 rounded-xl object-cover border-[2px] border-black shrink-0"
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-black text-black truncate">
                                                            {targetUser.username || targetUser.name}
                                                        </span>
                                                        {targetUser.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-black shrink-0 fill-[#00FFFF]" />}
                                                    </div>
                                                    {targetUser.username && <span className="text-[11px] text-neutral-500 font-bold truncate">{targetUser.name}</span>}
                                                </div>
                                            </Link>
 
                                            {isOwner && (
                                                <button
                                                    onClick={() => handleInternalAction(targetUser)}
                                                    className="px-3.5 py-2 text-[10px] font-black uppercase bg-[#fecaca] text-[#991b1b] border-[2px] border-black rounded-xl shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-0 active:shadow-none transition-all shrink-0"
                                                >
                                                    {type === "following" ? "Unfollow" : "Hapus"}
                                                </button>
                                            )}
                                            {!isOwner && (
                                                <ChevronRight className="w-4 h-4 text-black shrink-0" />
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
