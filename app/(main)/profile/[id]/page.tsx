"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MemoryCard } from "@/components/memories/MemoryCard"
import {
    Loader2, MapPin, Calendar, Heart, MessageCircle,
    Pencil, Camera, X, Check, Instagram, Facebook,
    Settings, ArrowUpRight, Globe2
} from "lucide-react"
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
                if (!userData) { router.push("/404"); return }
                setUser(userData)
                setMemories(userMemories)
                setLoading(false)
            })
            .catch(() => router.push("/404"))
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
            toast.error("Gagal mengupload foto")
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    const handleSave = async () => {
        if (!editName.trim()) { toast.error("Nama tidak boleh kosong"); return }
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
            toast.success("Profil berhasil diperbarui!")
            setIsEditOpen(false)
        } catch {
            toast.error("Gagal memperbarui profil")
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
    const joinDate = new Date(user.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    const totalReactions = user._count?.reactions || 0
    const totalComments = user._count?.comments || 0
    const totalMemories = memories.length
    const avatarSrc = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
    const hasSocials = user.instagram || user.tiktok || user.facebook
    const isAdmin = user.role === "ADMIN"

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" style={{ fontFamily: "Outfit, sans-serif" }}>

{/* ─────────────── PROFILE CARD ─────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[2rem] overflow-hidden mb-8 relative w-full"
                style={{
                    background: "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(24px)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.05)"
                }}
            >
                {/* ── Cover Banner ── */}
                <div className="relative h-32 sm:h-40 overflow-hidden">
                    {/* Base gradient */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a0a2e 40%, #0d1a3a 70%, #0a0f1e 100%)" }} />
                    
                    {/* Vivid blobs */}
                    <div className="absolute top-[-30%] left-[10%] w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)", filter: "blur(48px)" }} />
                    <div className="absolute top-[-20%] right-[10%] w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", filter: "blur(56px)" }} />
                    <div className="absolute bottom-[-10%] left-[40%] w-60 h-60 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
                    
                    {/* Noise grain texture */}
                    <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />
                    
                    {/* Dot grid overlay */}
                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                    
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 inset-x-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, rgba(10,10,16,0.9))" }} />
                    
                    {/* Admin badge (Desktop only di banner, Mobile pindah ke sebelah nama) */}
                    {isAdmin && (
                        <div className="absolute top-4 right-5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase hidden md:block"
                            style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
                            Admin
                        </div>
                    )}
                </div>

                {/* ── Konten Profil (Horizontal di Desktop, Stack di Mobile) ── */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end justify-between -mt-[48px] sm:-mt-[56px] px-6 lg:px-10 pb-8 relative z-10 w-full">
                    
                    {/* KIRI: Avatar, Nama & Bio */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-6 w-full md:w-auto">
                        
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="absolute -inset-2 rounded-full animate-pulse" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))", filter: "blur(10px)" }} />
                            <div className="absolute -inset-1 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
                                <div className="w-full h-full rounded-full" style={{ background: "rgba(10,10,16,1)" }} />
                            </div>
                            <img
                                src={avatarSrc}
                                alt={user.name}
                                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover z-10"
                                style={{ border: "3px solid rgba(10,10,16,1)" }}
                            />
                            {isOwner && (
                                <button
                                    onClick={openEdit}
                                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 z-20"
                                    style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
                                    title="Ganti Foto"
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Ubah</span>
                                </button>
                            )}
                        </div>

                        {/* Nama & Bio */}
                        <div className="text-center md:text-left md:pb-2 max-w-sm">
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-1.5">
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                                    {user.name}
                                </h1>
                                {isAdmin && (
                                    <span className="md:hidden inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
                                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}>
                                        Admin
                                    </span>
                                )}
                            </div>
                            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-light">
                                {user.bio || <span className="italic text-neutral-600">Penjelajah ini belum menulis bio.</span>}
                            </p>
                        </div>
                    </div>

                    {/* KANAN: Statistik, Info & Tombol */}
                    <div className="flex flex-col items-center md:items-end gap-5 w-full md:w-auto">
                        
                        {/* Stats Row */}
                        <div className="flex items-stretch gap-0 rounded-xl overflow-hidden w-full max-w-sm md:max-w-md"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {[
                                { label: "Kenangan", value: totalMemories, icon: MapPin, color: "#818cf8" },
                                { label: "Reaksi", value: totalReactions, icon: Heart, color: "#f472b6" },
                                { label: "Komentar", value: totalComments, icon: MessageCircle, color: "#34d399" },
                            ].map(({ label, value, icon: Icon, color }, i, arr) => (
                                <div key={label} className="flex-1 flex flex-col items-center justify-center py-2.5 px-3 relative">
                                    {i < arr.length - 1 && <div className="absolute right-0 top-1/4 bottom-1/4 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />}
                                    <span className="text-lg sm:text-xl font-black mb-0.5" style={{ color }}>{value}</span>
                                    <div className="flex items-center gap-1">
                                        <Icon className="w-2.5 h-2.5" style={{ color }} />
                                        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "rgba(115,115,115,1)" }}>{label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Info Bar & Actions Wrapper */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto justify-center md:justify-end">
                            
                            {/* Info & Socials */}
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-neutral-500">
                                <div className="flex items-center gap-1.5" title="Tanggal Bergabung">
                                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>{joinDate}</span> {/* CLASS HIDDEN DIHAPUS DI SINI */}
                                </div>
                                
                                {hasSocials && (
                                    <>
                                        {/* Titik pemisah sekarang akan tampil di mobile juga */}
                                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                                        <div className="flex items-center gap-2">
                                            {user.instagram && (
                                                <a href={user.instagram} target="_blank" rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 bg-white/5 border border-white/10 hover:border-pink-500/50" title="Instagram">
                                                    <Instagram className="w-3.5 h-3.5 text-neutral-400 hover:text-pink-400" />
                                                </a>
                                            )}
                                            {user.tiktok && (
                                                <a href={user.tiktok} target="_blank" rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 bg-white/5 border border-white/10 hover:border-white/50" title="TikTok">
                                                    <TikTokIcon className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                                                </a>
                                            )}
                                            {user.facebook && (
                                                <a href={user.facebook} target="_blank" rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 bg-white/5 border border-white/10 hover:border-blue-500/50" title="Facebook">
                                                    <Facebook className="w-3.5 h-3.5 text-neutral-400 hover:text-blue-400" />
                                                </a>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            {isOwner && (
                                <div className="flex items-center gap-2">
                                    <Link href="/settings"
                                        className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-white transition-all bg-white/5 border border-white/10 hover:bg-white/10"
                                        title="Pengaturan">
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                    <button onClick={openEdit}
                                        className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.03] relative overflow-hidden group"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                        <Pencil className="w-3.5 h-3.5 relative z-10" />
                                        <span className="relative z-10 hidden sm:inline">Edit Profil</span>
                                        <span className="relative z-10 sm:hidden">Edit</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ─────────────── MEMORIES SECTION ─────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-7">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.2)" }}>
                            <MapPin className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Kenangan Publik</h2>
                    </div>
                    {memories.length > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold text-indigo-300"
                            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                            {memories.length}
                        </span>
                    )}
                    <div className="flex-1 h-px"
                        style={{ background: "linear-gradient(to right, rgba(99,102,241,0.2), transparent)" }} />
                </div>

                {/* Grid or Empty State */}
                {memories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {memories.map((memory, i) => (
                            <motion.div
                                key={memory.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <MemoryCard memory={memory} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 rounded-3xl"
                        style={{
                            background: "linear-gradient(160deg, rgba(18,18,28,0.5), rgba(10,10,16,0.7))",
                            border: "1.5px dashed rgba(255,255,255,0.06)"
                        }}
                    >
                        <div className="w-16 h-16 mx-auto mb-5 rounded-3xl flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))",
                                border: "1px solid rgba(99,102,241,0.15)"
                            }}>
                            <MapPin className="w-7 h-7" style={{ color: "rgba(99,102,241,0.45)" }} />
                        </div>
                        <p className="text-base font-semibold text-neutral-400 mb-2">Belum ada kenangan publik</p>
                        {isOwner ? (
                            <>
                                <p className="text-sm text-neutral-600 max-w-xs mx-auto mb-6 leading-relaxed">
                                    Kamu belum berbagi kenangan apapun. Mulai petakan momen pertamamu!
                                </p>
                                <Link
                                    href="/memories/create"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform duration-200"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                >
                                    <MapPin className="w-4 h-4" />
                                    Mulai Petakan
                                </Link>
                            </>
                        ) : (
                            <p className="text-sm text-neutral-600 max-w-xs mx-auto leading-relaxed">
                                {user.name} belum berbagi kenangan apapun. Kunjungi lagi nanti!
                            </p>
                        )}
                    </motion.div>
                )}
            </motion.div>

            {/* ─────────────── EDIT PROFILE MODAL ─────────────── */}
            <AnimatePresence>
                {isEditOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
                        onClick={(e) => e.target === e.currentTarget && setIsEditOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-md rounded-[2rem] overflow-hidden relative"
                            style={{
                                background: "linear-gradient(160deg, rgba(18,18,28,0.98), rgba(10,10,16,0.99))",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)"
                            }}
                        >
                            {/* Top gradient accent */}
                            <div className="h-px w-full"
                                style={{ background: "linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)" }} />

                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-7 pt-6 pb-2">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Profil</h2>
                                    <p className="text-xs text-neutral-600 mt-0.5">Perbarui informasi profil kamu</p>
                                </div>
                                <button
                                    onClick={() => setIsEditOpen(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-7 py-6 space-y-5">
                                {/* Avatar upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 rounded-full p-[2px]"
                                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
                                            <div className="w-full h-full rounded-full" style={{ background: "rgba(10,10,16,1)" }} />
                                        </div>
                                        <img
                                            src={previewImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                            alt="Avatar preview"
                                            className="relative w-24 h-24 rounded-full object-cover z-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={isUploadingPhoto}
                                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1 z-20"
                                            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
                                        >
                                            {isUploadingPhoto
                                                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                : <><Camera className="w-5 h-5 text-white" /><span className="text-[9px] font-bold text-white uppercase tracking-widest">Upload</span></>
                                            }
                                        </button>
                                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                    </div>
                                    <p className="text-[11px] text-neutral-700">Klik pada foto untuk menggantinya</p>
                                </div>

                                {/* Divider */}
                                <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Nama Tampilan</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Siapa namamu?"
                                        className="w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none transition-all"
                                        style={{
                                            background: "rgba(0,0,0,0.4)",
                                            border: editName ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.07)",
                                            boxShadow: editName ? "0 0 0 3px rgba(99,102,241,0.08)" : "none"
                                        }}
                                    />
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">Bio</label>
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value.slice(0, 200))}
                                        placeholder="Ceritakan sedikit tentang dirimu..."
                                        rows={3}
                                        className="w-full rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-neutral-700 focus:outline-none resize-none transition-all leading-relaxed"
                                        style={{
                                            background: "rgba(0,0,0,0.4)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                        }}
                                    />
                                    <div className="flex justify-end mt-1.5">
                                        <span className={`text-[10px] tabular-nums ${editBio.length > 180 ? "text-amber-500" : "text-neutral-700"}`}>
                                            {editBio.length}/200
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center gap-2.5 px-7 pb-7">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-5 py-3 rounded-2xl text-sm font-semibold text-neutral-400 hover:text-white transition-all"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving || isUploadingPhoto}
                                    className="flex-1 py-3 px-5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                >
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                    <span className="relative flex items-center gap-2">
                                        {isSaving
                                            ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                                            : <><Check className="w-4 h-4" />Simpan Perubahan</>
                                        }
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}