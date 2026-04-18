"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    Loader2, MapPin, Calendar, Heart, MessageCircle,
    Pencil, Camera, X, Check, Instagram, Facebook,
    Settings, Image as ImageIcon, BookOpen, Globe,
    Flame, Zap, Medal, Crown, Package,
    UserPlus, Link as LinkIcon, QrCode, Share2,
    Users, UserCheck, Search
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
    // Epic
    if (n.includes("glitch")) return "anim-glitch";
    if (n.includes("quasar")) return "anim-quasar";
    // Legend
    if (n.includes("celestial")) return "anim-celestial";
    if (n.includes("supernova")) return "anim-supernova";
    if (n.includes("rune")) return "anim-rune";
    return "";
}

function getFrameClass(name?: string) {
    if (!name) return "";
    const n = name.toLowerCase();
    // Epic
    if (n.includes("orbit")) return "anim-frame-orbit";
    if (n.includes("fraktur")) return "anim-frame-fraktur";
    // Legend
    if (n.includes("singularitas")) return "anim-frame-singularitas";
    if (n.includes("cakra")) return "anim-frame-cakra";
    if (n.includes("eternum")) return "anim-frame-eternum";
    return "";
}

// ── Profile View ──────────────────────────────
function getBannerClass(name?: string) {
    if (!name) return ""
    const n = name.toLowerCase()
    if (n.includes("galaxy")) return "anim-banner-galaxy"
    if (n.includes("hutan")) return "anim-banner-matrix"
    if (n.includes("samudra")) return "anim-banner-samudra"
    return ""
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

    // Photo Modal states
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)

    // Follows Modal states
    const [isFollowsModalOpen, setIsFollowsModalOpen] = useState(false)
    const [followsModalType, setFollowsModalType] = useState<"followers" | "following">("followers")
    const [followsList, setFollowsList] = useState<any[]>([])
    const [isFollowsLoading, setIsFollowsLoading] = useState(false)
    const [followsSearch, setFollowsSearch] = useState("")

    useEffect(() => {
        if (!isFollowsModalOpen) return;
        const fetchFollows = async () => {
            setIsFollowsLoading(true)
            try {
                const res = await fetch(`/api/users/${id}/follows?type=${followsModalType}&search=${followsSearch}`)
                if(res.ok) setFollowsList(await res.json())
            } finally {
                setIsFollowsLoading(false)
            }
        }
        
        const delay = setTimeout(fetchFollows, 300)
        return () => clearTimeout(delay)
    }, [isFollowsModalOpen, followsModalType, followsSearch, id])

    const handleFollowsAction = async (targetId: string, action: "unfollow" | "remove_follower") => {
        try {
            const res = await fetch(`/api/users/${id}/follows`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetId, action })
            })
            if (res.ok) {
                setFollowsList(prev => prev.filter(u => u.id !== targetId))
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
        } catch (error) {
            toast.error("Terjadi kesalahan")
        }
    }

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Tautan disalin ke papan klip")
    }

    const handleFollow = async () => {
        if (!session?.user?.id) {
            toast.error("Silakan login terlebih dahulu")
            return
        }
        try {
            const res = await fetch(`/api/users/${id}/follow`, { method: "POST" })
            if (!res.ok) throw new Error()
            const data = await res.json()
            
            setUser((prev: any) => ({
                ...prev,
                isFollowing: data.followed,
                _count: {
                    ...prev._count,
                    followers: (prev._count?.followers || 0) + (data.followed ? 1 : -1)
                }
            }))
            
            if (data.followed) {
                toast.success(`Berhasil mengikuti ${user.name}`)
            } else {
                toast.success(`Batal mengikuti ${user.name}`)
            }
        } catch {
            toast.error("Gagal melakukan aksi")
        }
    }

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
            formData.append("isPublic", "true")
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
                    {(() => {
                        const bn = user.equippedBanner?.name?.toLowerCase() ?? ""
                        const isHutan   = bn.includes("hutan")
                        const isGalaxy  = bn.includes("galax")
                        const isSamudra = bn.includes("samudra")
                        const bg = user.equippedBanner
                            ? (isHutan
                                ? "linear-gradient(135deg, #001a0a 0%, #003320 35%, #005233 65%, #007a4d 100%)"
                                : user.equippedBanner.value)
                            : "linear-gradient(135deg, #0f0f23 0%, #1a0a2e 40%, #0d1a3a 70%, #0a0f1e 100%)"
                        return (
                            <>
                                <div className={`absolute inset-0 ${getBannerClass(user.equippedBanner?.name)}`} style={{ background: bg }} />

                                {/* Galaxy Dalam — nebula blobs + twinkling stars */}
                                {isGalaxy && (
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                        <ellipse cx="480" cy="55" rx="180" ry="55" fill="rgba(180,100,255,0.18)" className="nebula-drift" style={{ filter: "blur(20px)" }} />
                                        <ellipse cx="160" cy="95" rx="140" ry="40" fill="rgba(80,120,255,0.15)" className="nebula-drift" style={{ animationDelay: "-6s", filter: "blur(18px)" }} />
                                        <ellipse cx="670" cy="110" rx="120" ry="35" fill="rgba(150,60,255,0.12)" className="nebula-drift" style={{ animationDelay: "-10s", filter: "blur(16px)" }} />
                                        <circle cx="30"  cy="12" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "2.1s", "--r0": "1.5", "--r1": "2.5" } as any} />
                                        <circle cx="95"  cy="25" r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "1.7s", "--r0": "1.0", "--r1": "2.0" } as any} />
                                        <circle cx="160" cy="8"  r="1.6" fill="white" className="star-twinkle" style={{ "--dur": "2.8s", "--r0": "1.2", "--r1": "2.2" } as any} />
                                        <circle cx="230" cy="40" r="1.1" fill="#aad4ff" className="star-twinkle" style={{ "--dur": "1.5s", "--r0": "0.9", "--r1": "1.6" } as any} />
                                        <circle cx="290" cy="18" r="1.4" fill="white" className="star-twinkle" style={{ "--dur": "2.4s", "--r0": "1.1", "--r1": "2.0" } as any} />
                                        <circle cx="350" cy="55" r="1.0" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "1.9s", "--r0": "0.8", "--r1": "1.5" } as any} />
                                        <circle cx="410" cy="10" r="1.7" fill="white" className="star-twinkle" style={{ "--dur": "3.0s", "--r0": "1.3", "--r1": "2.3" } as any} />
                                        <circle cx="470" cy="30" r="1.2" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.2s", "--r0": "1.0", "--r1": "1.8" } as any} />
                                        <circle cx="530" cy="15" r="1.5" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "1.2", "--r1": "2.1" } as any} />
                                        <circle cx="590" cy="48" r="1.0" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.6s", "--r0": "0.8", "--r1": "1.5" } as any} />
                                        <circle cx="650" cy="20" r="1.8" fill="white" className="star-twinkle" style={{ "--dur": "1.4s", "--r0": "1.4", "--r1": "2.4" } as any} />
                                        <circle cx="710" cy="9"  r="1.3" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.9s", "--r0": "1.0", "--r1": "1.9" } as any} />
                                        <circle cx="770" cy="35" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "2.0s", "--r0": "0.9", "--r1": "1.6" } as any} />
                                        <circle cx="55"  cy="80" r="1.0" fill="white" className="star-twinkle" style={{ "--dur": "1.8s", "--r0": "0.8", "--r1": "1.4" } as any} />
                                        <circle cx="200" cy="100" r="1.4" fill="#ffddaa" className="star-twinkle" style={{ "--dur": "2.5s", "--r0": "1.1", "--r1": "2.0" } as any} />
                                        <circle cx="370" cy="90" r="1.2" fill="white" className="star-twinkle" style={{ "--dur": "1.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
                                        <circle cx="500" cy="115" r="1.5" fill="#c4aaff" className="star-twinkle" style={{ "--dur": "2.7s", "--r0": "1.2", "--r1": "2.2" } as any} />
                                        <circle cx="680" cy="95" r="1.1" fill="white" className="star-twinkle" style={{ "--dur": "1.6s", "--r0": "0.9", "--r1": "1.6" } as any} />
                                        <circle cx="785" cy="120" r="1.3" fill="#aaddff" className="star-twinkle" style={{ "--dur": "2.3s", "--r0": "1.0", "--r1": "1.8" } as any} />
                                    </svg>
                                )}

                                {/* Samudra Bintang — aurora waves + dense shimmering stars */}
                                {isSamudra && (
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs><filter id="blur-aurora-profile"><feGaussianBlur stdDeviation="8" /></filter></defs>
                                        <rect x="-20" y="15" width="840" height="32" rx="16" fill="rgba(120,60,255,0.28)" className="aurora-wave" filter="url(#blur-aurora-profile)"
                                            style={{ "--dur": "7s", "--op0": "0.25", "--op1": "0.55" } as any} />
                                        <rect x="-20" y="52" width="840" height="22" rx="11" fill="rgba(60,180,255,0.22)" className="aurora-wave" filter="url(#blur-aurora-profile)"
                                            style={{ "--dur": "5.5s", "--op0": "0.2", "--op1": "0.5", animationDelay: "-2s" } as any} />
                                        <rect x="-20" y="80" width="840" height="24" rx="12" fill="rgba(200,50,255,0.18)" className="aurora-wave" filter="url(#blur-aurora-profile)"
                                            style={{ "--dur": "9s", "--op0": "0.15", "--op1": "0.4", animationDelay: "-4s" } as any} />
                                        {[[20,10,1.8,"#fff","2.0s"],[80,5,1.4,"#aaddff","1.4s"],[145,18,2.0,"#fff","2.6s"],[205,8,1.2,"#ddbbff","1.8s"],[260,22,1.7,"#fff","1.2s"],[320,12,1.5,"#aaddff","2.3s"],[380,7,2.1,"#fff","0.9s"],[440,25,1.3,"#ffccee","1.7s"],[500,10,1.6,"#fff","2.1s"],[560,20,1.1,"#cceeff","1.5s"],[620,6,1.8,"#fff","2.8s"],[680,15,1.4,"#ddbbff","1.1s"],[740,8,1.7,"#fff","1.9s"],[790,22,1.0,"#aaddff","2.4s"],[50,90,1.3,"#fff","1.6s"],[130,105,1.5,"#ffccee","0.8s"],[220,95,1.1,"#fff","2.2s"],[310,110,1.8,"#ccddff","1.3s"],[400,100,1.4,"#fff","2.7s"],[490,115,1.2,"#aaddff","1.0s"],[580,95,1.6,"#fff","2.5s"],[670,108,1.3,"#ffccee","1.8s"],[760,100,1.0,"#fff","1.2s"],[110,50,1.4,"#fff","2.1s"],[350,65,1.2,"#ddbbff","1.6s"],[600,55,1.5,"#fff","2.4s"]].map(([cx,cy,r,fill,dur],i) => (
                                            <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} className="star-shimmer" style={{ "--dur": dur } as any} />
                                        ))}
                                    </svg>
                                )}

                                {/* Hutan Digital — equalizer bars */}
                                {isHutan && (
                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="18" y="0" width="15" rx="2" fill="#00cc55" opacity="0.75" className="eq-bar eq-bar-1" />
                                        <rect x="42" y="0" width="15" rx="2" fill="#00cc55" opacity="0.65" className="eq-bar eq-bar-2" />
                                        <rect x="66" y="0" width="15" rx="2" fill="#00bb44" opacity="0.85" className="eq-bar eq-bar-3" />
                                        <rect x="90" y="0" width="15" rx="2" fill="#00cc55" opacity="0.70" className="eq-bar eq-bar-4" />
                                        <rect x="114" y="0" width="15" rx="2" fill="#00bb44" opacity="0.60" className="eq-bar eq-bar-5" />
                                        <rect x="138" y="0" width="15" rx="2" fill="#00aa33" opacity="0.55" className="eq-bar eq-bar-6" />
                                    </svg>
                                )}
                            </>
                        )
                    })()}
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
                        <div 
                            className="relative group shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            onClick={() => setIsPhotoModalOpen(true)}
                        >
                            <div className={`absolute -inset-2 rounded-full ${user.equippedFrame && getFrameClass(user.equippedFrame.name) ? `${getFrameClass(user.equippedFrame.name)}-glow` : 'animate-pulse'}`} style={{ background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))", filter: "blur(10px)" }} />
                            <div className={`absolute -inset-1 rounded-full p-[2px] ${user.equippedFrame ? getFrameClass(user.equippedFrame.name) : ''}`} style={{ background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
                                <div className="w-full h-full rounded-full" style={{ background: "rgba(10,10,16,1)" }} />
                            </div>
                            <img
                                src={avatarSrc}
                                alt={user.name}
                                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover z-10"
                                style={{ border: "3px solid rgba(10,10,16,1)" }}
                            />
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
                                { label: "Pengikut", value: user._count?.followers || 0, icon: Users, color: "#f472b6", onClick: isOwner ? () => { setFollowsModalType("followers"); setIsFollowsModalOpen(true); } : undefined },
                                { label: "Mengikuti", value: user._count?.following || 0, icon: UserCheck, color: "#34d399", onClick: isOwner ? () => { setFollowsModalType("following"); setIsFollowsModalOpen(true); } : undefined },
                            ].map(({ label, value, icon: Icon, color, onClick }, i, arr) => (
                                <div key={label} onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 relative ${onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}>
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
                            {isOwner ? (
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
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleFollow}
                                        className="flex items-center gap-1.5 px-6 h-9 rounded-lg text-xs sm:text-sm font-bold text-white transition-all hover:scale-[1.03] relative overflow-hidden group"
                                        style={{ background: user.isFollowing ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: user.isFollowing ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
                                        {!user.isFollowing && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />}
                                        {user.isFollowing ? <UserCheck className="w-4 h-4 relative z-10" /> : <UserPlus className="w-4 h-4 relative z-10" />}
                                        <span className="relative z-10">{user.isFollowing ? "Mengikuti" : "Ikuti"}</span>
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

            {/* ─────────────── PHOTO PREVIEW MODAL ─────────────── */}
            <AnimatePresence>
                {isPhotoModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-sm"
                        onClick={() => setIsPhotoModalOpen(false)}
                    >
                        {/* Avatar Full Preview */}
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={avatarSrc}
                            alt="Profile"
                            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover mb-12 shadow-[0_0_80px_rgba(255,255,255,0.05)] border-2 border-white/5"
                        />

                        {/* Bottom Actions */}
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 20, opacity: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-5 sm:gap-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                className="flex flex-col items-center gap-3 group"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(isOwner) {
                                        setIsPhotoModalOpen(false);
                                        openEdit();
                                    } else {
                                        handleFollow();
                                    }
                                }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all hover:scale-110">
                                    {isOwner 
                                        ? <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> 
                                        : (user.isFollowing ? <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />)
                                    }
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-white/80">
                                    {isOwner ? "Ubah Foto" : (user.isFollowing ? "Mengikuti" : "Ikuti")}
                                </span>
                            </button>

                            <button 
                                className="flex flex-col items-center gap-3 group" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.share) {
                                        navigator.share({ title: user.name, url: window.location.href }).catch(() => {});
                                    } else {
                                        copyProfileLink()
                                    }
                                }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all hover:scale-110">
                                    <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-white/80">Bagikan profil</span>
                            </button>

                            <button 
                                className="flex flex-col items-center gap-3 group" 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    copyProfileLink(); 
                                }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all hover:scale-110">
                                    <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-white/80">Salin tautan</span>
                            </button>

                            <button 
                                className="flex flex-col items-center gap-3 group"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast("QR Code feature coming soon!", { icon: "📱" })
                                }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all hover:scale-110">
                                    <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-white/80">Kode QR</span>
                            </button>
                        </motion.div>
                        
                        <button 
                            className="absolute top-6 left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setIsPhotoModalOpen(false); }}
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
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

            {/* ─────────────── FOLLOWS MODAL ─────────────── */}
            <AnimatePresence>
                {isFollowsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setIsFollowsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-sm rounded-[1.5rem] bg-[#11111a] border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/5">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    {followsModalType === "followers" ? <Users className="w-4 h-4 text-pink-400" /> : <UserCheck className="w-4 h-4 text-emerald-400" />}
                                    {followsModalType === "followers" ? "Pengikut" : "Mengikuti"}
                                </h3>
                                <button onClick={() => setIsFollowsModalOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-4 pb-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        value={followsSearch}
                                        onChange={(e) => setFollowsSearch(e.target.value)}
                                        placeholder="Cari pengguna..." 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                    {followsSearch && (
                                        <button onClick={() => setFollowsSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                {isFollowsLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>
                                ) : followsList.length === 0 ? (
                                    <div className="text-center py-10 text-neutral-500 text-sm">Tidak ada user ditemukan.</div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {followsList.map((u) => (
                                            <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                                <Link href={`/profile/${u.id}`} onClick={() => setIsFollowsModalOpen(false)} className="flex-1 flex items-center gap-3 min-w-0">
                                                    <img src={u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-10 h-10 rounded-full object-cover bg-neutral-900 border border-white/10" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-bold text-white truncate">
                                                                {u.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-neutral-500 truncate block">{u.bio || "Tidak ada bio"}</span>
                                                    </div>
                                                </Link>
                                                {isOwner && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleFollowsAction(u.id, followsModalType === "followers" ? "remove_follower" : "unfollow")
                                                        }}
                                                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all opacity-0 md:group-hover:opacity-100"
                                                    >
                                                        {followsModalType === "followers" ? "Hapus" : "Mengikuti"}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}