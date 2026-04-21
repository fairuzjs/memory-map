"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    ArrowLeft, Edit, Trash2, Calendar, MapPin, Loader2,
    Globe, Lock, ExternalLink, Images, Sticker
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Reactions } from "@/components/memories/Reactions"
import { Comments } from "@/components/memories/Comments"
import { ReportDialog } from "@/components/ui/ReportDialog"
import { StickerLayer, StickerPlacement } from "@/components/memories/StickerLayer"
import { StickerPanel } from "@/components/memories/StickerPanel"
import { MemoryMusicPlayer } from "@/components/memories/MemoryMusicPlayer"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"
import { formatDate } from "@/lib/utils"

export default function MemoryDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [memory, setMemory] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [lightbox, setLightbox] = useState<string | null>(null)
    const [placements, setPlacements] = useState<StickerPlacement[]>([])
    const [showStickerPanel, setShowStickerPanel] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        fetch(`/api/memories/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Tidak ditemukan")
                return res.json()
            })
            .then(data => {
                if (data.photos) {
                    data.photos = data.photos.map((p: any) => {
                        try {
                            const parsed = JSON.parse(p.url)
                            return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
                        } catch {
                            return p
                        }
                    })
                }
                setMemory(data)
                setLoading(false)
            })
            .catch(() => {
                toast.error("Kenangan tidak ditemukan")
                router.push("/memories")
            })

        fetch(`/api/memories/${id}/stickers`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setPlacements(data) })
            .catch(() => {})
    }, [id, router])

    const { confirmProps, openConfirm } = useConfirm()

    const handleDelete = async () => {
        openConfirm({
            title: "Hapus Kenangan Ini?",
            description: "Tindakan ini tidak dapat dibatalkan. Kenangan, foto, dan semua datanya akan dihapus secara permanen.",
            confirmLabel: "Ya, Hapus",
            cancelLabel: "Batal",
            variant: "danger",
            onConfirm: async () => {
                setIsDeleting(true)
                try {
                    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" })
                    if (!res.ok) throw new Error("Gagal")
                    toast.success("Kenangan berhasil dihapus")
                    router.push("/memories")
                } catch {
                    toast.error("Gagal menghapus")
                    setIsDeleting(false)
                }
            }
        })
    }

    const handleStickerUpdate = useCallback(async (placementId: string, posX: number, posY: number, rotation: number, scale: number) => {
        setPlacements(prev => prev.map(p => p.id === placementId ? { ...p, posX, posY, rotation, scale } : p))
        await fetch(`/api/memories/${id}/stickers`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ placementId, posX, posY, rotation, scale }),
        })
    }, [id])

    const handleStickerDelete = useCallback(async (placementId: string) => {
        setPlacements(prev => prev.filter(p => p.id !== placementId))
        await fetch(`/api/memories/${id}/stickers?placementId=${placementId}`, { method: "DELETE" })
    }, [id])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                    <p className="text-xs tracking-widest uppercase text-neutral-600 animate-pulse">
                        Memuat kenangan...
                    </p>
                </div>
            </div>
        )
    }

    const isOwner = session?.user?.id === memory?.userId || session?.user?.role === "ADMIN"
    const validPhotos = (memory.photos || []).filter((p: any) => p && p.url)
    const heroPhoto = validPhotos[0]
    const galleryPhotos = validPhotos.slice(1)
    const allPhotos = validPhotos
    const formattedDate = formatDate(memory.date)

    const emotionGradient = (() => {
        switch(memory.emotion) {
            case "HAPPY": return "from-amber-500/20 via-orange-500/5 to-yellow-500/20"
            case "SAD": return "from-blue-900/40 via-slate-900 to-indigo-950/60"
            case "ROMANTIC": return "from-rose-500/20 via-pink-500/5 to-fuchsia-500/20"
            case "PEACEFUL": return "from-emerald-500/20 via-teal-500/5 to-cyan-500/20"
            case "EXCITED": return "from-violet-500/20 via-fuchsia-500/5 to-orange-500/20"
            case "NOSTALGIC": return "from-amber-700/20 via-orange-900/10 to-yellow-900/20"
            case "GRATEFUL": return "from-rose-400/20 via-amber-400/5 to-orange-400/20"
            case "ADVENTUROUS": return "from-emerald-600/20 via-cyan-900/10 to-blue-900/20"
            default: return "from-indigo-950 via-neutral-900 to-violet-950"
        }
    })();

    return (
        <div className="w-full pb-24 bg-[#0a0a0f]">

            {/* ─── HERO — Dynamic Layout ──────────────────────────── */}
            <div className={`relative w-full overflow-hidden bg-neutral-900 transition-all duration-500 ${heroPhoto ? "h-[70vh] min-h-[420px] max-h-[680px]" : "py-32 min-h-[45vh] flex flex-col justify-center"}`}>

                {/* Background image */}
                {heroPhoto ? (
                    <>
                        <button
                            onClick={() => setLightbox(heroPhoto.url)}
                            className="absolute inset-0 w-full h-full cursor-zoom-in"
                            aria-label="Lihat foto penuh"
                        >
                            <img
                                src={heroPhoto.url}
                                alt={memory.title}
                                className="w-full h-full object-cover"
                            />
                        </button>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/50 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050508]">
                        {/* Dynamic Background Base */}
                        <div className={`absolute inset-0 bg-gradient-to-br opacity-50 ${emotionGradient}`} />

                        {/* High-tech Map Grid Container */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_90%_90%_at_50%_50%,#000_20%,transparent_100%)]" />

                        {/* Topography Rings / Radar Layout */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-70">
                            {/* Static Rings */}
                            <div className="absolute w-[800px] h-[800px] border border-white/5 rounded-full" />
                            <div className="absolute w-[600px] h-[600px] border border-white/[0.08] rounded-full" />
                            <div className="absolute w-[400px] h-[400px] border border-white/[0.15] rounded-full border-dashed" />
                            <div className="absolute w-[200px] h-[200px] border border-white/[0.2] rounded-full bg-white/[0.01]" />
                            <div className="absolute w-2 h-2 bg-white/50 rounded-full" />
                            
                            {/* Crosshairs */}
                            <div className="absolute w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="absolute h-[1000px] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                        </div>

                        {/* Radar sweep animation */}
                        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 animate-[spin_8s_linear_infinite] rounded-full pointer-events-none [mask-image:radial-gradient(circle_at_center,white_0%,transparent_80%)]">
                            <div 
                                className="absolute top-0 right-1/2 w-[400px] h-[400px] origin-bottom-right" 
                                style={{ background: 'conic-gradient(from 180deg at 100% 100%, transparent 0deg, rgba(255,255,255,0.03) 60deg, rgba(255,255,255,0.2) 90deg, transparent 90deg)' }} 
                            />
                        </div>

                        {/* Bottom fade for content blending */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
                    </div>
                )}

                {/* Sticker Layer */}
                <StickerLayer
                    memoryId={memory.id}
                    memoryDate={memory.date}
                    placements={placements}
                    isOwner={isOwner}
                    onPlacementUpdate={handleStickerUpdate}
                    onPlacementDelete={handleStickerDelete}
                />

                {/* ── Top action bar ── */}
                <div className="absolute top-0 left-0 right-0 px-5 md:px-10 py-5 flex items-center justify-between z-10">
                    <button
                        onClick={() => router.push("/map")}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Kembali
                    </button>

                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setShowStickerPanel(true)}
                                    className="flex items-center gap-1.5 text-white/60 hover:text-amber-300 transition-colors backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm"
                                    title="Tambah Stiker"
                                >
                                    <Sticker className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Stiker</span>
                                    {placements.length > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 flex items-center justify-center">
                                            {placements.length}
                                        </span>
                                    )}
                                </button>
                                <Link href={`/memories/${id}/edit`}>
                                    <button className="flex items-center gap-1.5 text-white/60 hover:text-indigo-300 transition-colors backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-1.5 text-white/60 hover:text-red-400 transition-colors backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isDeleting ? "Menghapus..." : "Hapus"}
                                </button>
                            </>
                        )}
                        {!isOwner && session?.user && (
                            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-1 py-1">
                                <ReportDialog memoryId={memory.id} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Hero content ── */}
                <div className={`z-10 px-5 md:px-12 pb-10 w-full ${heroPhoto ? "absolute bottom-0 left-0 max-w-2xl" : "relative max-w-4xl mx-auto flex flex-col items-center text-center pt-24"}`}>
                    {/* Badges */}
                    <div className={`flex items-center gap-2 mb-4 ${heroPhoto ? "" : "justify-center"}`}>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-full border ${memory.isPublic
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                            : "bg-white/5 border-white/10 text-neutral-400"
                            }`}>
                            {memory.isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            {memory.isPublic ? "Publik" : "Privat"}
                        </span>
                        {allPhotos.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-full border bg-white/5 border-white/10 text-neutral-400">
                                <Images className="w-2.5 h-2.5" />
                                {allPhotos.length} Foto
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className={`font-bold font-[Outfit] text-white leading-[1.08] tracking-tight mb-5 drop-shadow-lg ${heroPhoto ? "text-3xl sm:text-4xl md:text-5xl" : "text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70"}`}>
                        {memory.title}
                    </h1>

                    {/* Meta */}
                    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50 ${heroPhoto ? "" : "justify-center"}`}>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            {formattedDate}
                        </span>
                        {memory.locationName && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                                {memory.locationName}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─────────────────────────────────── */}
            <div className="max-w-[1120px] mx-auto px-4 md:px-8 mt-12">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

                    {/* ── LEFT / STORY COLUMN ── */}
                    <main className="flex-1 min-w-0">

                        {/* Author & Collaborators Strip */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-9">
                            <Link
                                href={`/profile/${memory.user.id}`}
                                className="flex items-center gap-3 group shrink-0"
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                                        alt={memory.user.name}
                                        className="w-10 h-10 rounded-full border border-neutral-700/80 group-hover:border-indigo-500/60 transition-colors object-cover bg-neutral-800"
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[13px] font-semibold text-neutral-200 group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                        {memory.user.name}
                                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </p>
                                    <p className="text-[11px] text-neutral-600 mt-0.5">
                                        {memory.isPublic ? "Dibagikan publik" : "Kenangan privat"} · {formattedDate}
                                    </p>
                                </div>
                            </Link>

                            {memory.collaborators && memory.collaborators.length > 0 && (
                                <>
                                    <div className="w-[1px] h-8 bg-white/10 hidden sm:block mx-1" />
                                    <div className="flex items-center gap-2.5">
                                        <p className="text-[10px] font-semibold text-neutral-500 tracking-widest uppercase shrink-0">
                                            Bersama
                                        </p>
                                        <div className="flex -space-x-2">
                                            {memory.collaborators.map((collab: any) => (
                                                <Link
                                                    key={collab.id}
                                                    href={`/profile/${collab.user.id}`}
                                                    className="relative hover:z-10 transition-transform hover:scale-110"
                                                    title={collab.user.name}
                                                >
                                                    <img
                                                        src={collab.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.user.id}`}
                                                        alt={collab.user.name}
                                                        className="w-8 h-8 rounded-full border-2 border-[#0a0a0f] object-cover bg-neutral-800"
                                                    />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Story / Prose */}
                        <div className="text-neutral-400 leading-[1.9] text-[1.0rem] font-sans mb-12 space-y-5">
                            {memory.story.split("\n").map((para: string, i: number) => (
                                para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                            ))}
                        </div>

                        {/* Music Player — MOBILE ONLY (above gallery) */}
                        {(memory.audioUrl || memory.spotifyTrackId) && isMobile && (
                            <div className="mb-10 lg:hidden">
                                {memory.spotifyTrackId ? (
                                    <iframe
                                        style={{ borderRadius: '12px' }}
                                        src={`https://open.spotify.com/embed/track/${memory.spotifyTrackId}?utm_source=generator&theme=0`}
                                        width="100%"
                                        height="152"
                                        frameBorder="0"
                                        allowFullScreen={false}
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                    ></iframe>
                                ) : (
                                    <MemoryMusicPlayer
                                        audioUrl={memory.audioUrl}
                                        startTime={memory.audioStartTime || 0}
                                        duration={memory.audioDuration || 15}
                                        fileName={memory.audioFileName || "Audio"}
                                        autoPlay={true}
                                    />
                                )}
                            </div>
                        )}

                        {/* Photo Gallery — only secondary photos */}
                        {galleryPhotos.length > 0 && (
                            <div className="mb-12">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-4">
                                    Galeri Foto
                                </p>
                                <div className={`grid gap-2 ${galleryPhotos.length === 1 ? "grid-cols-1" :
                                    galleryPhotos.length === 2 ? "grid-cols-2" :
                                        galleryPhotos.length === 3 ? "grid-cols-3" :
                                            "grid-cols-2 md:grid-cols-3"
                                    }`}>
                                    {galleryPhotos.map((photo: any, idx: number) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setLightbox(photo.url)}
                                            className={`group relative overflow-hidden rounded-xl border border-neutral-800/80 hover:border-indigo-500/40 transition-all ${idx === 0 && galleryPhotos.length >= 4 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                                                }`}
                                        >
                                            <img
                                                src={photo.url}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reactions */}
                        <div className="mb-10 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-3">
                                Reaksi
                            </p>
                            <Reactions memoryId={memory.id} initialReactions={memory.reactions || []} />
                        </div>

                        {/* Comments */}
                        <Comments memoryId={memory.id} initialComments={memory.comments || []} />
                    </main>

                    {/* ── RIGHT / SIDEBAR ── */}
                    <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-3">

                            {/* Music Player — DESKTOP ONLY (sidebar) */}
                            {(memory.audioUrl || memory.spotifyTrackId) && !isMobile && (
                                <div className="hidden lg:block relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0f]">
                                    {memory.spotifyTrackId ? (
                                        <iframe
                                            style={{ borderRadius: '16px' }}
                                            src={`https://open.spotify.com/embed/track/${memory.spotifyTrackId}?utm_source=generator&theme=0`}
                                            width="100%"
                                            height="152"
                                            frameBorder="0"
                                            allowFullScreen={false}
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        ></iframe>
                                    ) : (
                                        <div className="bg-[#13111e]">
                                            <MemoryMusicPlayer
                                                audioUrl={memory.audioUrl}
                                                startTime={memory.audioStartTime || 0}
                                                duration={memory.audioDuration || 15}
                                                fileName={memory.audioFileName || "Audio"}
                                                autoPlay={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Memory Info Card */}
                            <div className="bg-[#13111e] border border-white/[0.07] rounded-2xl p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-5">
                                    Detail Kenangan
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-0.5">Tanggal</p>
                                            <p className="text-[13px] text-neutral-300">{formattedDate}</p>
                                        </div>
                                    </li>
                                    {memory.locationName && (
                                        <li className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-0.5">Lokasi</p>
                                                <p className="text-[13px] text-neutral-300">{memory.locationName}</p>
                                            </div>
                                        </li>
                                    )}
                                    <li className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${memory.isPublic ? "bg-emerald-500/10" : "bg-neutral-700/30"}`}>
                                            {memory.isPublic
                                                ? <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                                : <Lock className="w-3.5 h-3.5 text-neutral-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-0.5">Visibilitas</p>
                                            <p className="text-[13px] text-neutral-300">{memory.isPublic ? "Publik" : "Privat"}</p>
                                        </div>
                                    </li>
                                    {memory.photos?.length > 0 && (
                                        <li className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Images className="w-3.5 h-3.5 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-0.5">Foto</p>
                                                <p className="text-[13px] text-neutral-300">{memory.photos.length} terlampir</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Collaborators moved to top author strip */}

                            {/* Map Preview */}
                            {memory.latitude && memory.longitude && (
                                <div className="bg-[#13111e] border border-white/[0.07] rounded-2xl overflow-hidden">
                                    <div className="px-5 pt-4 pb-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                                            Lokasi pada Peta
                                        </p>
                                    </div>
                                    <iframe
                                        title="Memory location"
                                        width="100%"
                                        height="170"
                                        loading="lazy"
                                        className="grayscale opacity-60 hover:opacity-80 transition-opacity"
                                        src={`https://maps.google.com/maps?q=${memory.latitude},${memory.longitude}&z=13&output=embed&hl=en`}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* ─── LIGHTBOX ─────────────────────────────────────── */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightbox}
                            alt=""
                            className="max-w-full max-h-[90vh] rounded-xl object-contain"
                        />
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-base"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Sticker Panel ─── */}
            {showStickerPanel && (
                <StickerPanel
                    memoryId={memory.id}
                    memoryDate={memory.date}
                    currentCount={placements.length}
                    onStickerAdded={placement => setPlacements(prev => [...prev, placement])}
                    onClose={() => setShowStickerPanel(false)}
                />
            )}

            {/* ─── Confirm Dialog ─── */}
            <ConfirmDialog {...confirmProps} />
        </div>
    )
}