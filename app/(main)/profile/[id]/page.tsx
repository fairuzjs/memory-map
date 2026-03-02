"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MemoryCard } from "@/components/memories/MemoryCard"
import { Loader2, MapPin, Calendar, Heart, MessageCircle, Pencil, Camera, X, Check, Instagram, Facebook, Settings, ExternalLink } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.61a8.18 8.18 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01Z" />
        </svg>
    )
}

export default function UserProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session, update: updateSession } = useSession()

    const [user, setUser] = useState<any>(null)
    const [memories, setMemories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Edit modal state
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editBio, setEditBio] = useState("")
    const [editImage, setEditImage] = useState("")
    const [previewImage, setPreviewImage] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        Promise.all([
            fetch(`/api/users/${id}`).then(res => res.ok ? res.json() : null),
            fetch(`/api/memories?userId=${id}&public=true`).then(res => res.ok ? res.json() : [])
        ])
            .then(([userData, userMemories]) => {
                if (!userData) {
                    router.push("/404")
                    return
                }
                setUser(userData)
                setMemories(userMemories)
                setLoading(false)
            })
            .catch(() => {
                router.push("/404")
            })
    }, [id, router])

    const openEdit = () => {
        setEditName(user.name || "")
        setEditBio(user.bio || "")
        setEditImage(user.image || "")
        setPreviewImage(user.image || "")
        setIsEditOpen(true)
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploadingPhoto(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error("Upload failed")
            const { url } = await res.json()
            setEditImage(url)
            setPreviewImage(url)
        } catch {
            toast.error("Failed to upload photo")
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    const handleSave = async () => {
        if (!editName.trim()) {
            toast.error("Name cannot be empty")
            return
        }
        setIsSaving(true)
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, bio: editBio, image: editImage }),
            })
            if (!res.ok) throw new Error("Failed")
            const updated = await res.json()
            setUser((prev: any) => ({ ...prev, ...updated }))
            await updateSession()
            toast.success("Profile updated!")
            setIsEditOpen(false)
        } catch {
            toast.error("Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    const isOwner = session?.user?.id === id
    const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })
    const totalReactions = user._count?.reactions || 0
    const totalComments = user._count?.comments || 0
    const totalMemories = memories.length
    const avatarSrc = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Elegant Profile Header Card */}
            <div className="bg-neutral-900/40 backdrop-blur-xl rounded-[2.5rem] border border-neutral-800/80 shadow-2xl overflow-hidden mb-12">
                {/* Dynamic Cover Mesh - Gradient height diperkecil */}
                <div className="h-24 sm:h-32 w-full relative bg-gradient-to-br from-indigo-950 via-neutral-900 to-violet-950 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-violet-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                </div>

                {/* Reduced bottom padding */}
                <div className="px-6 sm:px-10 pb-8 relative">
                    {/* Avatar & Actions Row */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4 relative z-10">
                        <div className="relative group shrink-0 inline-block">
                            {/* Avatar Wrapper with glow */}
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-colors" />
                            {/* Smaller Avatar Size */}
                            <img
                                src={avatarSrc}
                                alt={user.name}
                                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] sm:border-8 border-neutral-900 bg-neutral-800 object-cover relative z-10"
                            />
                            {isOwner && (
                                <button
                                    onClick={openEdit}
                                    className="absolute inset-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                                >
                                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </button>
                            )}
                        </div>

                        {isOwner && (
                            <div className="flex items-center gap-3 pt-4 sm:pt-0 sm:mb-2">
                                <Link
                                    href="/settings"
                                    className="p-2.5 sm:p-3 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-neutral-600 transition-all text-neutral-400 hover:text-white backdrop-blur-sm"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={openEdit}
                                    className="flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-900 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm sm:text-base"
                                >
                                    <Pencil className="w-4 h-4" /> Edit Profile
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Info Matrix */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Bio & Links section (takes 2 columns) */}
                        <div className="lg:col-span-2 space-y-3 text-center sm:text-left">
                            <h1 className="text-3xl sm:text-4xl font-black font-[Outfit] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                                {user.name}
                            </h1>
                            <p className="text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
                                {user.bio || "This explorer is currently wandering off the grid and hasn't left a bio yet."}
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                                    <Calendar className="w-4 h-4 text-neutral-600" />
                                    Joined {joinDate}
                                </div>
                                <span className="hidden sm:inline w-1 h-1 rounded-full bg-neutral-700" />
                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    {totalMemories} Locations Explored
                                </div>
                            </div>

                            {/* Social Badges */}
                            {(user.instagram || user.tiktok || user.facebook) && (
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3 border-t border-neutral-800/50 mt-3">
                                    {user.instagram && (
                                        <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/40 hover:bg-pink-500/10 border border-neutral-700/50 hover:border-pink-500/30 text-neutral-300 hover:text-pink-400 transition-all group">
                                            <Instagram className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Instagram</span>
                                        </a>
                                    )}
                                    {user.tiktok && (
                                        <a href={user.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/40 hover:bg-neutral-500/10 border border-neutral-700/50 hover:border-neutral-500/30 text-neutral-300 hover:text-white transition-all group">
                                            <TikTokIcon className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">TikTok</span>
                                        </a>
                                    )}
                                    {user.facebook && (
                                        <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/40 hover:bg-blue-500/10 border border-neutral-700/50 hover:border-blue-500/30 text-neutral-300 hover:text-blue-400 transition-all group">
                                            <Facebook className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">Facebook</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Interactive Stats Panel - Made more compact */}
                        <div className="flex gap-3 sm:gap-4 justify-center lg:justify-end items-center">
                            <div className="bg-neutral-800/30 border border-neutral-800/60 rounded-[1.5rem] p-4 sm:p-5 text-center w-full sm:w-28 backdrop-blur-sm hover:bg-neutral-800/50 transition-colors">
                                <div className="w-10 h-10 mx-auto bg-rose-500/10 rounded-xl flex items-center justify-center mb-2">
                                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                                </div>
                                <div className="text-2xl font-black text-white font-[Outfit]">{totalReactions}</div>
                                <div className="text-[10px] text-neutral-500 mt-0.5 font-bold tracking-wider uppercase">Reactions</div>
                            </div>
                            <div className="bg-neutral-800/30 border border-neutral-800/60 rounded-[1.5rem] p-4 sm:p-5 text-center w-full sm:w-28 backdrop-blur-sm hover:bg-neutral-800/50 transition-colors">
                                <div className="w-10 h-10 mx-auto bg-blue-500/10 rounded-xl flex items-center justify-center mb-2">
                                    <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                                </div>
                                <div className="text-2xl font-black text-white font-[Outfit]">{totalComments}</div>
                                <div className="text-[10px] text-neutral-500 mt-0.5 font-bold tracking-wider uppercase">Comments</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8 border-b border-neutral-800/50 pb-4">
                <h2 className="text-2xl font-bold font-[Outfit] text-white flex items-center gap-3">
                    Public Memories
                    <span className="block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold">
                        {memories.length}
                    </span>
                </h2>
            </div>

            {memories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memories.map((memory) => (
                        <MemoryCard key={memory.id} memory={memory} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-neutral-900/20 rounded-[2.5rem] border border-neutral-800/50 border-dashed backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto bg-neutral-800/50 rounded-3xl flex items-center justify-center mb-6 border border-neutral-700/50">
                        <MapPin className="w-10 h-10 text-neutral-500" />
                    </div>
                    <p className="text-white font-semibold text-xl font-[Outfit] mb-2">No public memories yet</p>
                    {isOwner ? (
                        <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-6">
                            You haven't shared any memories publicly. Share your first global experience on the map with the world.
                        </p>
                    ) : (
                        <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                            {user.name} hasn't shared anything publicly yet. Check back later!
                        </p>
                    )}
                    {isOwner && (
                        <Link href="/memories/create" className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                            <MapPin className="w-4 h-4" /> Start Mapping
                        </Link>
                    )}
                </div>
            )}

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={(e) => e.target === e.currentTarget && setIsEditOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="bg-[#111] border border-neutral-800 rounded-[2rem] shadow-2xl shadow-indigo-500/10 w-full max-w-md overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 opacity-50 pointer-events-none" />

                            <div className="flex items-center justify-between p-6 pb-2 relative z-10">
                                <h2 className="text-2xl font-bold font-[Outfit] text-white">Edit Profile</h2>
                                <button onClick={() => setIsEditOpen(false)} className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-7 relative z-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img
                                            src={previewImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                            alt="Avatar preview"
                                            className="w-28 h-28 rounded-full border-4 border-neutral-800 object-cover bg-neutral-900 shadow-xl relative z-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={isUploadingPhoto}
                                            className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center z-20"
                                        >
                                            {isUploadingPhoto ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <>
                                                    <Camera className="w-6 h-6 text-white mb-1" />
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upload</span>
                                                </>
                                            )}
                                        </button>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-300 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="What should we call you?"
                                        className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-5 py-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-300 mb-2">Bio / About Me</label>
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        placeholder="Tell other explorers a bit about yourself..."
                                        rows={4}
                                        className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-5 py-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-base resize-none leading-relaxed"
                                    />
                                    <p className="text-xs text-neutral-500 mt-2 text-right font-medium">{editBio.length}/200</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-6 pt-0 relative z-10 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-6 py-4 rounded-2xl border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving || isUploadingPhoto}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                >
                                    {isSaving ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...</>
                                    ) : (
                                        <><Check className="w-5 h-5" /> Confirm Update</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}