"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Share2, Camera, Link as LinkIcon, QrCode, X, UserCheck, UserPlus } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

// Components
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileStats } from "@/components/profile/ProfileStats"
import { ProfilePassport } from "@/components/profile/ProfilePassport"
import { ProfileMapTeaser } from "@/components/profile/ProfileMapTeaser"
import { MemoryGrid } from "@/components/profile/MemoryGrid"
import { EditProfileModal } from "@/components/profile/EditProfileModal"
import { FollowsModal } from "@/components/profile/FollowsModal"
import { GalaxyBanner, SamudraBanner, HutanBanner, PremiumRoyalBanner } from "@/components/profile/ProfileBanners"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"

// Utils
import { getBannerClass } from "@/components/profile/ProfileUtils"

export default function UserProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session, update: updateSession } = useSession()

    const [user, setUser] = useState<any>(null)
    const [memories, setMemories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
    const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false)
    const [followsModalType, setFollowsModalType] = useState<"followers" | "following">("followers")

    useEffect(() => {
        setLoading(true)
        Promise.all([
            fetch(`/api/users/${id}`).then(res => res.ok ? res.json() : null),
            fetch(`/api/memories?userId=${id}&public=true`).then(res => res.ok ? res.json() : [])
        ])
            .then(([userData, userMemories]) => {
                if (!userData) { router.push("/404"); return }
                setUser(userData)
                setMemories(userMemories)
                setLoading(false)
            })
            .catch(() => {
                toast.error("Gagal memuat profil")
                router.push("/404")
            })
    }, [id, router])

    const handleFollow = async () => {
        if (!session?.user?.id) {
            toast.error("Silakan login terlebih dahulu")
            return
        }
        
        // Optimistic Update
        const previousUser = { ...user }
        const willFollow = !user.isFollowing
        
        setUser((prev: any) => ({
            ...prev,
            isFollowing: willFollow,
            _count: { 
                ...prev._count, 
                followers: (prev._count?.followers || 0) + (willFollow ? 1 : -1) 
            }
        }))

        try {
            const res = await fetch(`/api/users/${id}/follow`, { method: "POST" })
            if (!res.ok) throw new Error()
            const data = await res.json()
            
            // Sync with actual server response just in case
            setUser((prev: any) => ({
                ...prev,
                isFollowing: data.followed,
            }))
            
            toast.success(data.followed ? `Mulai mengikuti ${user.name}` : `Berhenti mengikuti ${user.name}`)
        } catch (error) {
            // Rollback
            setUser(previousUser)
            toast.error("Gagal melakukan aksi ikuti. Silakan coba lagi.")
        }
    }

    const handleFollowsAction = async (targetId: string, action: "unfollow" | "remove_follower") => {
        try {
            const res = await fetch(`/api/users/${id}/follows`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetId, action })
            })
            if (res.ok) {
                setUser((prev: any) => ({
                    ...prev,
                    _count: {
                        ...prev._count,
                        followers: action === "remove_follower" ? Math.max(0, prev._count.followers - 1) : prev._count.followers,
                        following: action === "unfollow" ? Math.max(0, prev._count.following - 1) : prev._count.following,
                    }
                }))
                toast.success(action === "unfollow" ? "Berhenti mengikuti" : "Pengikut dihapus")
            }
        } catch { toast.error("Gagal melakukan aksi") }
    }

    const handleSaveProfile = async (data: any) => {
        const res = await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Gagal memperbarui profil")
        }
        const updated = await res.json()
        setUser((prev: any) => ({ ...prev, ...updated }))
        await updateSession()
        toast.success("Profil diperbarui!")
    }

    const copyProfileLink = () => {
        const link = user?.username ? `${window.location.origin}/u/${user.username}` : window.location.href
        navigator.clipboard.writeText(link)
        toast.success("Tautan disalin ke papan klip")
    }

    const handleReact = async (memoryId: string, type: string = "LOVE") => {
        if (!session?.user?.id) {
            toast.error("Silakan login terlebih dahulu")
            return
        }
        
        // Optimistic Update
        const previousMemories = [...memories]
        setMemories(prev => prev.map(m => {
            if (m.id !== memoryId) return m
            // This is a simplified check, ideally we'd know if user already liked it
            // For now, let's just toggle the count optimistically
            const isAdding = !m.isLikedByMe // assuming we add this flag
            return {
                ...m,
                isLikedByMe: isAdding,
                _count: {
                    ...m._count,
                    reactions: (m._count?.reactions || 0) + (isAdding ? 1 : -1)
                }
            }
        }))

        try {
            const res = await fetch(`/api/memories/${memoryId}/reactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            })
            if (!res.ok) throw new Error()
            const data = await res.json()
            
            // Sync with actual state
            setMemories(prev => prev.map(m => {
                if (m.id !== memoryId) return m
                return {
                    ...m,
                    isLikedByMe: data.action === "added" || data.action === "updated",
                    // The count might be updated by others, so we might need a refetch or partial update
                }
            }))
        } catch (error) {
            setMemories(previousMemories)
            toast.error("Gagal memberikan reaksi")
        }
    }

    const handlePin = async (memoryId: string) => {
        try {
            const memory = memories.find((m: any) => m.id === memoryId)
            if (!memory) return

            const isPinning = !memory.isPinned
            if (isPinning) {
                const pinnedCount = memories.filter((m: any) => m.isPinned).length
                if (pinnedCount >= 3) {
                    toast.error("Maksimal 3 kenangan yang bisa disematkan")
                    return
                }
            }

            const previousMemories = [...memories]
            setMemories((prev: any[]) => prev.map(m => m.id === memoryId ? { ...m, isPinned: isPinning } : m))

            const res = await fetch(`/api/memories/${memoryId}/pin`, { method: "POST" })
            const data = await res.json()

            if (!res.ok) {
                setMemories(previousMemories)
                toast.error(data.error || "Gagal menyematkan kenangan")
                return
            }

            toast.success(data.message)
        } catch (error) {
            toast.error("Terjadi kesalahan")
        }
    }

    if (loading) return <ProfileSkeleton />

    const isOwner = session?.user?.id === id
    const isAdmin = user.role === "ADMIN"
    const mappedMemories = memories.filter((m: any) => m.latitude && m.longitude)
    const memoriesWithPhotos = memories.filter((m: any) => m.photos && m.photos.length > 0)

    const passportStats = {
        totalMemories: memories.length,
        memoriesWithPhotos: memoriesWithPhotos.length,
        memoriesTextOnly: memories.length - memoriesWithPhotos.length,
        mappedMemories: mappedMemories.length,
        totalReactions: user._count?.reactions || 0,
        totalComments: user._count?.comments || 0,
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-outfit" style={{ fontFamily: "Outfit, sans-serif" }}>
            
            {/* ─────────────── PROFILE CARD ─────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden mb-8 relative w-full bg-[#0a0a10] border-[4px] border-black shadow-[8px_8px_0_#000]"
            >
                {/* Banner Section — PRESERVED for equipped banners */}
                <div className="relative h-32 sm:h-40 overflow-hidden">
                    {(() => {
                        const bn = user.equippedBanner?.name?.toLowerCase() ?? ""
                        const isHutan = bn.includes("hutan")
                        const isGalaxy = bn.includes("galax")
                        const isSamudra = bn.includes("samudra")
                        const isKerajaan = bn.includes("kerajaan")
                        const bg = user.equippedBanner ? (isHutan ? "linear-gradient(135deg, #001a0a 0%, #007a4d 100%)" : user.equippedBanner.value) : "linear-gradient(135deg, #0f0f23 0%, #0a0f1e 100%)"
                        return (
                            <div className={`absolute inset-0 ${getBannerClass(user.equippedBanner?.name)}`} style={{ background: bg }}>
                                {isGalaxy && <GalaxyBanner />}
                                {isSamudra && <SamudraBanner />}
                                {isHutan && <HutanBanner />}
                                {isKerajaan && <PremiumRoyalBanner />}
                            </div>
                        )
                    })()}
                    
                    {!user.equippedBanner && (
                        <div className="absolute inset-0">
                            <div className="absolute top-[-30%] left-[10%] w-72 h-72 rounded-full bg-indigo-500/10 blur-[60px]" />
                            <div className="absolute top-[-20%] right-[10%] w-80 h-80 rounded-full bg-purple-500/10 blur-[70px]" />
                        </div>
                    )}
                    <div className="absolute inset-0 opacity-[0.05] bg-dot-pattern" />
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0a0a10] to-transparent" />
                </div>

                <ProfileHeader 
                    user={user} 
                    isOwner={isOwner} 
                    isAdmin={isAdmin}
                    onEdit={() => setIsEditOpen(true)} 
                    onFollow={handleFollow} 
                    onShowPhoto={() => setIsPhotoModalOpen(true)}
                    countMemories={memories.length} 
                    countFollowers={user._count?.followers || 0} 
                    countFollowing={user._count?.following || 0}
                    onShowFollowers={() => { setFollowsModalType("followers"); setIsFollowsModalOpen(true) }}
                    onShowFollowing={() => { setFollowsModalType("following"); setIsFollowsModalOpen(true) }}
                />
            </motion.div>

            {/* ─────────────── PASSPORT & MAP ─────────────── */}
            <div className="space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <ProfilePassport user={user} isOwner={isOwner} stats={passportStats} />
                    </div>
                    <div className="lg:col-span-2">
                        <ProfileMapTeaser mappedMemories={mappedMemories} isOwner={isOwner} userName={user.name} />
                    </div>
                </div>

                <MemoryGrid 
                    memories={memories} 
                    isOwner={isOwner} 
                    profileId={id as string} 
                    onReact={handleReact}
                    onPin={handlePin}
                />
            </div>

            {/* ─────────────── MODALS ─────────────── */}
            <EditProfileModal 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                user={user} 
                onSave={handleSaveProfile} 
            />

            <FollowsModal 
                isOpen={isFollowsModalOpen} 
                onClose={() => setIsFollowsModalOpen(false)} 
                type={followsModalType} 
                userId={id as string} 
                isOwner={isOwner} 
                onAction={handleFollowsAction} 
            />

            {/* Photo Preview Modal */}
            <AnimatePresence>
                {isPhotoModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 bg-black/90"
                        onClick={() => setIsPhotoModalOpen(false)}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover mb-12 border-[4px] border-black shadow-[8px_8px_0_#000]"
                        />
                        <div className="flex flex-wrap justify-center gap-4" onClick={e => e.stopPropagation()}>
                            {isOwner ? (
                                <button onClick={() => { setIsPhotoModalOpen(false); setIsEditOpen(true) }} className="flex items-center gap-2 px-6 py-3 bg-[#FFFF00] border-[3px] border-black text-black font-black uppercase text-sm shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                                    <Camera className="w-4 h-4" />
                                    <span>Ubah Foto</span>
                                </button>
                            ) : (
                                <button onClick={() => { handleFollow() }} className={`flex items-center gap-2 px-6 py-3 border-[3px] border-black font-black uppercase text-sm shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all ${user.isFollowing ? 'bg-white text-black' : 'bg-[#FF00FF] text-white'}`}>
                                    {user.isFollowing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                    <span>{user.isFollowing ? "Mengikuti" : "Ikuti"}</span>
                                </button>
                            )}
                            <button onClick={copyProfileLink} className="flex items-center gap-2 px-6 py-3 bg-white border-[3px] border-black text-black font-black uppercase text-sm shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                                <LinkIcon className="w-4 h-4" />
                                <span>Salin Tautan</span>
                            </button>
                        </div>
                        <button className="absolute top-6 right-6 p-2 w-10 h-10 flex items-center justify-center bg-white border-[3px] border-black text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all" onClick={() => setIsPhotoModalOpen(false)}><X className="w-5 h-5" /></button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}