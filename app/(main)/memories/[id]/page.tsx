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
    const heroPhoto = memory.photos?.[0]
    const galleryPhotos = memory.photos?.slice(1) || []
    const allPhotos = memory.photos || []
    const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    })

    return (
        <div className="w-full pb-24 bg-[#0a0a0f]">

            {/* ─── HERO — Single Photo ──────────────────────────── */}
            <div className="relative w-full h-[70vh] min-h-[420px] max-h-[680px] overflow-hidden bg-neutral-900">

                {/* Background image */}
                {heroPhoto ? (
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
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-neutral-900 to-violet-950" />
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/50 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

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
                        onClick={() => router.back()}
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

                {/* ── Hero content — bottom left ── */}
                <div className="absolute bottom-0 left-0 px-5 md:px-12 pb-10 z-10 max-w-2xl">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
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
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-[Outfit] text-white leading-[1.08] tracking-tight mb-5 drop-shadow-lg">
                        {memory.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50">
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

                        {/* Author strip — slim & inline */}
                        <Link
                            href={`/profile/${memory.user.id}`}
                            className="flex items-center gap-3 mb-9 group w-fit"
                        >
                            <div className="relative shrink-0">
                                <img
                                    src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                                    alt={memory.user.name}
                                    className="w-10 h-10 rounded-full border border-neutral-700/80 group-hover:border-indigo-500/60 transition-colors object-cover bg-neutral-800"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-neutral-200 group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                    {memory.user.name}
                                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </p>
                                <p className="text-[11px] text-neutral-600 mt-0.5">
                                    {memory.isPublic ? "Dibagikan publik" : "Kenangan privat"} · {formattedDate}
                                </p>
                            </div>
                        </Link>

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

                            {/* Collaborators Card */}
                            {memory.collaborators && memory.collaborators.length > 0 && (
                                <div className="bg-[#13111e] border border-white/[0.07] rounded-2xl p-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 mb-4">
                                        Bersama ({memory.collaborators.length})
                                    </p>
                                    <div className="space-y-3">
                                        {memory.collaborators.map((collab: any) => (
                                            <Link
                                                key={collab.id}
                                                href={`/profile/${collab.user.id}`}
                                                className="flex items-center gap-3 group"
                                            >
                                                <img
                                                    src={collab.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.user.id}`}
                                                    alt={collab.user.name}
                                                    className="w-8 h-8 rounded-full border border-neutral-700/80 group-hover:border-violet-500/60 transition-colors object-cover bg-neutral-800 shrink-0"
                                                />
                                                <p className="text-[13px] text-neutral-400 group-hover:text-violet-400 transition-colors truncate">
                                                    {collab.user.name}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

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