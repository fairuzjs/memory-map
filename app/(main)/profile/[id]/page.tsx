"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    Loader2, MapPin, Calendar, Heart, MessageCircle,
    Pencil, Camera, X, Check, Instagram, Facebook,
    Settings, Image as ImageIcon, BookOpen, Globe,
    Flame, Zap, Medal, Crown, Package
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/cropImage"

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.61a8.18 8.18 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01Z" />
        </svg>
    )
}

function getDecorationClass(name?: string) {
    if (!name) return "";
    const n = name.toLowerCase();
    if (n.includes("kristal")) return "anim-kristal";
    if (n.includes("api")) return "anim-api";
    if (n.includes("neon")) return "anim-neon";
    if (n.includes("emas")) return "anim-emas";
    if (n.includes("pelangi")) return "anim-pelangi";
    return "";
}

export default function UserProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session, update: updateSession } = useSession()

    const BADGE_STYLES: Record<number, any> = {
        7: {
            name: "Baru Panas",
            icon: Flame,
            bgProfile: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.15))",
            borderProfile: "1px solid rgba(249,115,22,0.3)",
            textColor: "#fb923c",
            iconClassProfile: "fill-orange-500 text-orange-400",
            bgModalActive: "linear-gradient(135deg, rgba(234,88,12,0.2), rgba(249,115,22,0.1))",
            borderModalActive: "1px solid rgba(249,115,22,0.4)"
        },
        30: {
            name: "Menyala Terus",
            icon: Zap,
            bgProfile: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))",
            borderProfile: "1px solid rgba(99,102,241,0.3)",
            textColor: "#818cf8",
            iconClassProfile: "fill-indigo-500 text-indigo-400",
            bgModalActive: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))",
            borderModalActive: "1px solid rgba(99,102,241,0.4)"
        },
        60: {
            name: "Anti Kendor",
            icon: Medal,
            bgProfile: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15))",
            borderProfile: "1px solid rgba(16,185,129,0.3)",
            textColor: "#34d399",
            iconClassProfile: "fill-emerald-500 text-emerald-400",
            bgModalActive: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))",
            borderModalActive: "1px solid rgba(16,185,129,0.4)"
        },
        90: {
            name: "GOAT Streak",
            icon: Crown,
            bgProfile: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.15))",
            borderProfile: "1px solid rgba(251,191,36,0.3)",
            textColor: "#fbbf24",
            iconClassProfile: "fill-amber-500 text-amber-400",
            bgModalActive: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))",
            borderModalActive: "1px solid rgba(251,191,36,0.4)"
        }
    }

    const getBadgeConfig = (milestone: number) => {
        return BADGE_STYLES[milestone] || {
            name: `${milestone} Hari`,
            icon: Flame,
            bgProfile: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.15))",
            borderProfile: "1px solid rgba(249,115,22,0.3)",
            textColor: "#fb923c",
            iconClassProfile: "fill-orange-500 text-orange-400",
            bgModalActive: "linear-gradient(135deg, rgba(234,88,12,0.2), rgba(249,115,22,0.1))",
            borderModalActive: "1px solid rgba(249,115,22,0.4)"
        }
    }

    const [user, setUser] = useState<any>(null)
    const [memories, setMemories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Edit modal state
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editBio, setEditBio] = useState("")
    const [editImage, setEditImage] = useState("")
    const [previewImage, setPreviewImage] = useState("")
    const [editPinnedBadge, setEditPinnedBadge] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)

    // Crop state
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isCropping, setIsCropping] = useState(false)
    const [cropImageUrl, setCropImageUrl] = useState("")

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
        setEditPinnedBadge(user.pinnedBadge)
        setIsEditOpen(true)
    }

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setCropImageUrl(url)
        setIsCropping(true)
        if (avatarInputRef.current) avatarInputRef.current.value = ""
    }

    const saveCrop = async () => {
        setIsUploadingPhoto(true)
        setIsCropping(false)
        try {
            const file = await getCroppedImg(cropImageUrl, croppedAreaPixels, rotation)
            if (!file) throw new Error("Gagal crop")
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
                body: JSON.stringify({ name: editName, bio: editBio, image: editImage, pinnedBadge: editPinnedBadge }),
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

    // Activity breakdown
    const memoriesWithPhotos = memories.filter((m: any) => m.photos && m.photos.length > 0)
    const memoriesTextOnly = memories.filter((m: any) => !m.photos || m.photos.length === 0)

    // Map teaser — memories with coordinates
    const mappedMemories = memories.filter((m: any) => m.latitude && m.longitude)
    const avgLat = mappedMemories.length
        ? mappedMemories.reduce((s: number, m: any) => s + m.latitude, 0) / mappedMemories.length
        : null
    const avgLng = mappedMemories.length
        ? mappedMemories.reduce((s: number, m: any) => s + m.longitude, 0) / mappedMemories.length
        : null
    const mapEmbedUrl = avgLat && avgLng
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${avgLng - 0.5}%2C${avgLat - 0.3}%2C${avgLng + 0.5}%2C${avgLat + 0.3}&layer=mapnik&marker=${avgLat}%2C${avgLng}`
        : null

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
                    {/* Base gradient — uses equipped banner or default */}
                    <div className="absolute inset-0" style={{
                        background: user.equippedBanner
                            ? user.equippedBanner.value
                            : "linear-gradient(135deg, #0f0f23 0%, #1a0a2e 40%, #0d1a3a 70%, #0a0f1e 100%)"
                    }} />

                    {/* Vivid blobs — only shown when no custom banner */}
                    {!user.equippedBanner && (
                        <>
                            <div className="absolute top-[-30%] left-[10%] w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)", filter: "blur(48px)" }} />
                            <div className="absolute top-[-20%] right-[10%] w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", filter: "blur(56px)" }} />
                            <div className="absolute bottom-[-10%] left-[40%] w-60 h-60 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
                        </>
                    )}

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
                            <div className="absolute -inset-2 rounded-full animate-pulse" style={{ background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))", filter: "blur(10px)" }} />
                            <div className="absolute -inset-1 rounded-full p-[2px]" style={{ background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
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
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-1.5 flex-wrap justify-center md:justify-start">
                                <h1 
                                    className={`text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight ${user.equippedDecoration ? getDecorationClass(user.equippedDecoration.name) : ""}`}
                                    style={user.equippedDecoration ? (() => { try { return JSON.parse(user.equippedDecoration.value) } catch { return {} } })() : {}}
                                >
                                    {user.name}
                                </h1>
                                {user.pinnedBadge !== null && user.pinnedBadge !== undefined && (() => {
                                    const bConfig = getBadgeConfig(user.pinnedBadge)
                                    const IconInfo = bConfig.icon
                                    return (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                                            style={{
                                                background: bConfig.bgProfile,
                                                border: bConfig.borderProfile,
                                                color: bConfig.textColor
                                            }}>
                                            <IconInfo className={`w-3.5 h-3.5 ${bConfig.iconClassProfile}`} />
                                            <span>{bConfig.name}</span>
                                        </div>
                                    )
                                })()}
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
                                    <Link href="/inventory"
                                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-all relative overflow-hidden group"
                                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
                                        title="Inventori Dekorasi">
                                        <Package className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                                    </Link>
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

            {/* ─────────────── ACTIVITY SUMMARY + MAP TEASER ─────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-5"
            >
                {/* ── Activity Summary (3/5) ── */}
                <div
                    className="lg:col-span-3 rounded-[1.5rem] p-6 flex flex-col gap-5"
                    style={{
                        background: "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                        border: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                            <BookOpen className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h2 className="text-base font-bold text-white tracking-tight">Ringkasan Aktivitas</h2>
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(99,102,241,0.15), transparent)" }} />
                    </div>

                    {/* Stat grid */}
                    {totalMemories === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>
                                <BookOpen className="w-5 h-5" style={{ color: "rgba(99,102,241,0.4)" }} />
                            </div>
                            <p className="text-sm text-neutral-500">
                                {isOwner ? "Kamu belum memiliki kenangan publik." : `${user.name} belum memiliki kenangan publik.`}
                            </p>
                            {isOwner && (
                                <Link href="/memories/create"
                                    className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-4 py-1.5 rounded-full"
                                    style={{ border: "1px solid rgba(99,102,241,0.25)" }}>
                                    Buat kenangan pertama →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                {
                                    label: "Total Publik",
                                    value: totalMemories,
                                    icon: <Globe className="w-4 h-4" />,
                                    color: "#818cf8",
                                    bg: "rgba(99,102,241,0.08)",
                                    border: "rgba(99,102,241,0.15)",
                                },
                                {
                                    label: "Visual",
                                    value: memoriesWithPhotos.length,
                                    icon: <ImageIcon className="w-4 h-4" />,
                                    color: "#60a5fa",
                                    bg: "rgba(59,130,246,0.08)",
                                    border: "rgba(59,130,246,0.15)",
                                },
                                {
                                    label: "Journal",
                                    value: memoriesTextOnly.length,
                                    icon: <BookOpen className="w-4 h-4" />,
                                    color: "#34d399",
                                    bg: "rgba(52,211,153,0.08)",
                                    border: "rgba(52,211,153,0.15)",
                                },
                                {
                                    label: "Di Peta",
                                    value: mappedMemories.length,
                                    icon: <MapPin className="w-4 h-4" />,
                                    color: "#f472b6",
                                    bg: "rgba(244,114,182,0.08)",
                                    border: "rgba(244,114,182,0.15)",
                                },
                            ].map(({ label, value, icon, color, bg, border }) => (
                                <div
                                    key={label}
                                    className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 px-3 text-center"
                                    style={{ background: bg, border: `1px solid ${border}` }}
                                >
                                    <span style={{ color }}>{icon}</span>
                                    <span className="text-2xl font-black" style={{ color }}>{value}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reaction & Comment totals */}
                    {totalMemories > 0 && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            {[
                                { label: "Total Reaksi", value: totalReactions, icon: <Heart className="w-3.5 h-3.5" />, color: "#f472b6" },
                                { label: "Total Komentar", value: totalComments, icon: <MessageCircle className="w-3.5 h-3.5" />, color: "#34d399" },
                            ].map(({ label, value, icon, color }) => (
                                <div key={label}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                                >
                                    <span style={{ color }}>{icon}</span>
                                    <div>
                                        <p className="text-base font-black" style={{ color }}>{value}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Memory Map Teaser (2/5) ── */}
                <div
                    className="lg:col-span-2 rounded-[1.5rem] overflow-hidden flex flex-col"
                    style={{
                        background: "linear-gradient(160deg, rgba(18,18,28,0.95), rgba(10,10,16,0.98))",
                        border: "1px solid rgba(255,255,255,0.07)",
                        minHeight: "260px",
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.2)" }}>
                            <MapPin className="w-4 h-4 text-pink-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base font-bold text-white tracking-tight leading-none">Peta Kenangan</h2>
                            <p className="text-[11px] text-neutral-600 mt-0.5">
                                {mappedMemories.length > 0
                                    ? `${mappedMemories.length} titik kenangan`
                                    : "Belum ada titik kenangan"}
                            </p>
                        </div>
                        {mappedMemories.length > 0 && (
                            <Link
                                href="/map"
                                className="flex items-center gap-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300 transition-colors shrink-0"
                            >
                                Lihat Peta
                                <MapPin className="w-3 h-3" />
                            </Link>
                        )}
                    </div>

                    {/* Map or placeholder */}
                    <div className="flex-1 relative">
                        {mapEmbedUrl ? (
                            <>
                                <iframe
                                    title="Memory locations"
                                    src={mapEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    className="absolute inset-0 w-full h-full grayscale opacity-75"
                                    style={{ minHeight: "200px" }}
                                    loading="lazy"
                                />
                                {/* Dark overlay at bottom */}
                                <div
                                    className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
                                    style={{ background: "linear-gradient(to bottom, transparent, rgba(10,10,16,0.9))" }}
                                />
                                {/* Count badge */}
                                <div
                                    className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                                    style={{ background: "rgba(10,10,16,0.85)", border: "1px solid rgba(244,114,182,0.25)", color: "#f9a8d4" }}
                                >
                                    <MapPin className="w-3 h-3" />
                                    {mappedMemories.length} lokasi
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.12)" }}
                                >
                                    <MapPin className="w-5 h-5" style={{ color: "rgba(244,114,182,0.4)" }} />
                                </div>
                                <p className="text-sm text-neutral-500 leading-relaxed">
                                    {isOwner
                                        ? "Tambahkan lokasi ke kenanganmu agar muncul di sini."
                                        : `${user.name} belum memiliki kenangan dengan lokasi.`
                                    }
                                </p>
                                {isOwner && (
                                    <Link
                                        href="/memories/create"
                                        className="text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
                                    >
                                        Buat kenangan dengan lokasi →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ─────────────── CROP MODAL ─────────────── */}
            <AnimatePresence>
                {isCropping && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Sesuaikan Foto</h2>
                            
                            <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden mb-6">
                                <Cropper
                                    image={cropImageUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={1}
                                    cropShape="round"
                                    onCropChange={setCrop}
                                    onCropComplete={(_: any, croppedPixels: any) => setCroppedAreaPixels(croppedPixels)}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                />
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-semibold text-neutral-400 mb-2 block">Zoom ({zoom.toFixed(1)}x)</label>
                                    <input 
                                        type="range" min={1} max={3} step={0.1} value={zoom} 
                                        onChange={(e) => setZoom(Number(e.target.value))} 
                                        className="w-full accent-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-neutral-400 mb-2 block">Rotasi ({rotation}°)</label>
                                    <input 
                                        type="range" min={0} max={360} step={1} value={rotation} 
                                        onChange={(e) => setRotation(Number(e.target.value))} 
                                        className="w-full accent-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsCropping(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-400 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={saveCrop}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-400 transition flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Simpan Potongan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

                                {/* Pinned Badge Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-orange-500" /> Profil Badge
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditPinnedBadge(null)}
                                            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                                            style={{
                                                background: editPinnedBadge === null ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                                                border: editPinnedBadge === null ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
                                                color: editPinnedBadge === null ? "#fff" : "#9ca3af"
                                            }}
                                        >
                                            Tidak ada
                                        </button>

                                        {user.streakBadges?.map((b: any) => {
                                            const bConfig = getBadgeConfig(b.milestone)
                                            const isSelected = editPinnedBadge === b.milestone
                                            const IconInfo = bConfig.icon
                                            return (
                                                <button
                                                    key={b.milestone}
                                                    type="button"
                                                    onClick={() => setEditPinnedBadge(b.milestone)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                                    style={{
                                                        background: isSelected
                                                            ? bConfig.bgModalActive
                                                            : "rgba(255,255,255,0.02)",
                                                        border: isSelected
                                                            ? bConfig.borderModalActive
                                                            : "1px solid rgba(255,255,255,0.05)",
                                                        color: isSelected ? bConfig.textColor : "#9ca3af"
                                                    }}
                                                >
                                                    <IconInfo className={`w-3.5 h-3.5 ${isSelected ? bConfig.iconClassProfile : "text-neutral-500"}`} />
                                                    {bConfig.name}
                                                </button>
                                            )
                                        })}
                                        {(!user.streakBadges || user.streakBadges.length === 0) && (
                                            <span className="text-xs text-neutral-600 italic py-2">Belum ada badge streak.</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-2">Pilih lencana streak untuk dipamerkan di sebelah namamu.</p>
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