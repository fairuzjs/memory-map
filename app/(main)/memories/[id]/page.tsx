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
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-[#E5E5E5]">
                <div className="flex flex-col items-center gap-4 border-[4px] border-black bg-white p-8 shadow-[8px_8px_0_#000]">
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                    <p className="text-[14px] font-black uppercase text-black">
                        Memuat Kenangan...
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

    const emotionConfig = (() => {
        switch(memory.emotion) {
            case "HAPPY": return { bg: "bg-[#FFFF00]", text: "text-black", border: "border-black" }
            case "SAD": return { bg: "bg-[#00FFFF]", text: "text-black", border: "border-black" }
            case "ROMANTIC": return { bg: "bg-[#FF00FF]", text: "text-white", border: "border-black" }
            case "PEACEFUL": return { bg: "bg-[#00FF00]", text: "text-black", border: "border-black" }
            case "EXCITED": return { bg: "bg-[#FF3300]", text: "text-white", border: "border-black" }
            case "NOSTALGIC": return { bg: "bg-[#E5E5E5]", text: "text-black", border: "border-black" }
            case "GRATEFUL": return { bg: "bg-[#00FF00]", text: "text-black", border: "border-black" }
            case "ADVENTUROUS": return { bg: "bg-[#FFFF00]", text: "text-black", border: "border-black" }
            default: return { bg: "bg-[#E5E5E5]", text: "text-black", border: "border-black" }
        }
    })();

    return (
        <div className="w-full pb-24 bg-white relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            {/* ─── HERO ──────────────────────────── */}
            <div className={`relative w-full overflow-hidden border-b-[4px] border-black transition-all duration-500 z-10 ${heroPhoto ? "h-[70vh] min-h-[420px] max-h-[680px]" : "py-24 sm:py-32 min-h-[45vh] flex flex-col justify-center"}`}>
                
                {/* Background rendering */}
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
                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                    </>
                ) : (
                    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${emotionConfig.bg}`}>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.1)_2px,transparent_2px)] bg-[size:32px_32px]" />
                        {/* Decorative solid shapes */}
                        <div className="absolute top-1/4 right-1/4 w-32 h-32 border-[4px] border-black rounded-full bg-white/20 transform rotate-12" />
                        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 border-[4px] border-black bg-black/10 transform -rotate-6" />
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
                <div className="absolute top-0 left-0 right-0 px-4 md:px-8 py-6 flex items-center justify-between z-20">
                    <button
                        onClick={() => router.push("/map")}
                        className="flex items-center gap-2 text-black bg-white border-[3px] border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>

                    <div className="flex items-center gap-3">
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setShowStickerPanel(true)}
                                    className="flex items-center gap-2 bg-[#FFFF00] text-black border-[3px] border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                                    title="Tambah Stiker"
                                >
                                    <Sticker className="w-4 h-4" />
                                    <span className="hidden sm:inline">Stiker</span>
                                    {placements.length > 0 && (
                                        <span className="w-5 h-5 bg-white border-[2px] border-black text-[10px] flex items-center justify-center">
                                            {placements.length}
                                        </span>
                                    )}
                                </button>
                                <Link href={`/memories/${id}/edit`}>
                                    <button className="flex items-center gap-2 bg-[#00FF00] text-black border-[3px] border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                                        <Edit className="w-4 h-4" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 bg-[#FF3300] text-white border-[3px] border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">{isDeleting ? "Hapus..." : "Hapus"}</span>
                                </button>
                            </>
                        )}
                        {!isOwner && session?.user && (
                            <ReportDialog memoryId={memory.id} />
                        )}
                    </div>
                </div>

                {/* ── Hero content ── */}
                <div className={`z-10 px-5 md:px-12 pb-10 w-full ${heroPhoto ? "absolute bottom-0 left-0 max-w-2xl" : "relative max-w-4xl mx-auto flex flex-col items-center text-center pt-16"}`}>
                    {/* Badges */}
                    <div className={`flex items-center gap-3 mb-6 ${heroPhoto ? "" : "justify-center"}`}>
                        <span className={`inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider px-3 py-1 border-[3px] border-black shadow-[2px_2px_0_#000] ${memory.isPublic
                            ? "bg-[#00FF00] text-black"
                            : "bg-[#E5E5E5] text-black"
                            }`}>
                            {memory.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {memory.isPublic ? "Publik" : "Privat"}
                        </span>
                        {allPhotos.length > 0 && (
                            <span className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider px-3 py-1 border-[3px] border-black bg-[#00FFFF] text-black shadow-[2px_2px_0_#000]">
                                <Images className="w-4 h-4" />
                                {allPhotos.length} Foto
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className={`font-black uppercase tracking-tight mb-6 p-2 ${heroPhoto ? "text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)]" : `text-5xl sm:text-6xl md:text-7xl bg-white text-black border-[4px] border-black shadow-[8px_8px_0_#000] inline-block transform ${memory.title.length > 20 ? "" : "-rotate-1"}`}`}>
                        {memory.title}
                    </h1>

                    {/* Meta */}
                    <div className={`flex flex-wrap items-center gap-4 text-[14px] font-black uppercase ${heroPhoto ? "text-white" : "text-black bg-white p-2 border-[3px] border-black shadow-[4px_4px_0_#000] justify-center inline-flex"}`}>
                        <span className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${heroPhoto ? "text-[#00FFFF]" : "text-black"}`} />
                            {formattedDate}
                        </span>
                        {memory.locationName && (
                            <>
                                <span className="w-1.5 h-1.5 bg-black rounded-full hidden sm:block" />
                                <span className="flex items-center gap-2">
                                    <MapPin className={`w-4 h-4 ${heroPhoto ? "text-[#00FF00]" : "text-black"}`} />
                                    {memory.locationName}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─────────────────────────────────── */}
            <div className="max-w-[1120px] mx-auto px-4 md:px-8 mt-16 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

                    {/* ── LEFT / STORY COLUMN ── */}
                    <main className="flex-1 min-w-0">

                        {/* Author & Collaborators Strip */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-10 bg-[#E5E5E5] p-4 border-[4px] border-black shadow-[6px_6px_0_#000]">
                            <Link
                                href={`/profile/${memory.user.id}`}
                                className="flex items-center gap-4 group shrink-0"
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                                        alt={memory.user.name}
                                        className="w-12 h-12 border-[3px] border-black object-cover bg-white shadow-[2px_2px_0_#000]"
                                    />
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00FF00] border-[2px] border-black" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[16px] font-black uppercase text-black flex items-center gap-2">
                                        {memory.user.name}
                                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#FF00FF]" />
                                    </p>
                                    <p className="text-[12px] font-bold text-black/60 uppercase">
                                        {memory.isPublic ? "Publik" : "Privat"} • {formattedDate}
                                    </p>
                                </div>
                            </Link>

                            {memory.collaborators && memory.collaborators.length > 0 && (
                                <>
                                    <div className="w-[4px] h-10 bg-black hidden sm:block mx-2" />
                                    <div className="flex items-center gap-3">
                                        <p className="text-[12px] font-black text-black bg-white px-2 border-[2px] border-black tracking-widest uppercase shrink-0">
                                            Bersama
                                        </p>
                                        <div className="flex -space-x-3">
                                            {memory.collaborators.map((collab: any) => (
                                                <Link
                                                    key={collab.id}
                                                    href={`/profile/${collab.user.id}`}
                                                    className="relative hover:z-10 transition-transform hover:scale-110 hover:-translate-y-1"
                                                    title={collab.user.name}
                                                >
                                                    <img
                                                        src={collab.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.user.id}`}
                                                        alt={collab.user.name}
                                                        className="w-10 h-10 border-[3px] border-black object-cover bg-white shadow-[2px_2px_0_#000]"
                                                    />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Story / Prose */}
                        <div className="bg-white border-[4px] border-black p-6 sm:p-8 shadow-[8px_8px_0_#000] text-black font-bold text-[16px] leading-[1.8] mb-12 space-y-6">
                            {memory.story.split("\n").map((para: string, i: number) => (
                                para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                            ))}
                        </div>

                        {/* Music Player — MOBILE ONLY (above gallery) */}
                        {(memory.audioUrl || memory.spotifyTrackId) && isMobile && (
                            <div className="mb-12 lg:hidden border-[4px] border-black shadow-[6px_6px_0_#000] bg-[#FF00FF]">
                                {memory.spotifyTrackId ? (
                                    <iframe
                                        style={{ borderRadius: '0' }}
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
                            <div className="mb-16">
                                <h3 className="inline-block px-3 py-1 bg-[#00FFFF] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-6">
                                    Galeri Foto
                                </h3>
                                <div className={`grid gap-4 ${galleryPhotos.length === 1 ? "grid-cols-1" :
                                    galleryPhotos.length === 2 ? "grid-cols-2" :
                                        galleryPhotos.length === 3 ? "grid-cols-3" :
                                            "grid-cols-2 md:grid-cols-3"
                                    }`}>
                                    {galleryPhotos.map((photo: any, idx: number) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setLightbox(photo.url)}
                                            className={`group relative overflow-hidden border-[4px] border-black bg-white shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all ${idx === 0 && galleryPhotos.length >= 4 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                                                }`}
                                        >
                                            <img
                                                src={photo.url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reactions */}
                        <div className="mb-12 bg-white border-[4px] border-black p-6 sm:p-8 shadow-[8px_8px_0_#000]">
                            <h3 className="inline-block px-3 py-1 bg-[#FFFF00] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-6">
                                Reaksi
                            </h3>
                            <Reactions memoryId={memory.id} initialReactions={memory.reactions || []} />
                        </div>

                        {/* Comments */}
                        <div className="bg-white border-[4px] border-black p-6 sm:p-8 shadow-[8px_8px_0_#000] mb-12">
                            <h3 className="inline-block px-3 py-1 bg-[#00FF00] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-6">
                                Komentar
                            </h3>
                            <Comments memoryId={memory.id} initialComments={memory.comments || []} />
                        </div>
                    </main>

                    {/* ── RIGHT / SIDEBAR ── */}
                    <aside className="w-full lg:w-[320px] shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-8">

                            {/* Music Player — DESKTOP ONLY (sidebar) */}
                            {(memory.audioUrl || memory.spotifyTrackId) && !isMobile && (
                                <div className="hidden lg:block relative bg-[#FF00FF] border-[4px] border-black shadow-[8px_8px_0_#000]">
                                    <div className="p-3 border-b-[4px] border-black bg-white">
                                        <p className="text-[12px] font-black text-black uppercase tracking-wider">Soundtrack</p>
                                    </div>
                                    {memory.spotifyTrackId ? (
                                        <iframe
                                            style={{ borderRadius: '0' }}
                                            src={`https://open.spotify.com/embed/track/${memory.spotifyTrackId}?utm_source=generator&theme=0`}
                                            width="100%"
                                            height="152"
                                            frameBorder="0"
                                            allowFullScreen={false}
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        ></iframe>
                                    ) : (
                                        <div className="bg-white">
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
                            <div className="bg-[#E5E5E5] border-[4px] border-black p-6 shadow-[8px_8px_0_#000]">
                                <h3 className="inline-block px-3 py-1 bg-white border-[3px] border-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000] mb-6">
                                    Detail Kenangan
                               </h3>
                                <ul className="space-y-5">
                                    <li className="flex items-start gap-4">
                                        <div className="w-10 h-10 border-[3px] border-black bg-[#00FFFF] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                                            <Calendar className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-black/60 uppercase font-black mb-0.5">Tanggal</p>
                                            <p className="text-[14px] text-black font-bold">{formattedDate}</p>
                                        </div>
                                    </li>
                                    {memory.locationName && (
                                        <li className="flex items-start gap-4">
                                            <div className="w-10 h-10 border-[3px] border-black bg-[#FFFF00] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                                                <MapPin className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-black/60 uppercase font-black mb-0.5">Lokasi</p>
                                                <p className="text-[14px] text-black font-bold">{memory.locationName}</p>
                                            </div>
                                        </li>
                                    )}
                                    <li className="flex items-start gap-4">
                                        <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000] ${memory.isPublic ? "bg-[#00FF00]" : "bg-neutral-400"}`}>
                                            {memory.isPublic
                                                ? <Globe className="w-5 h-5 text-black" />
                                                : <Lock className="w-5 h-5 text-black" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-[12px] text-black/60 uppercase font-black mb-0.5">Visibilitas</p>
                                            <p className="text-[14px] text-black font-bold">{memory.isPublic ? "Publik" : "Privat"}</p>
                                        </div>
                                    </li>
                                    {memory.photos?.length > 0 && (
                                        <li className="flex items-start gap-4">
                                            <div className="w-10 h-10 border-[3px] border-black bg-[#FF00FF] flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                                                <Images className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] text-black/60 uppercase font-black mb-0.5">Foto</p>
                                                <p className="text-[14px] text-black font-bold">{memory.photos.length} terlampir</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Map Preview */}
                            {memory.latitude && memory.longitude && (
                                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden">
                                    <div className="p-3 border-b-[4px] border-black bg-[#FFFF00]">
                                        <p className="text-[14px] font-black uppercase text-black">Lokasi pada Peta</p>
                                    </div>
                                    <iframe
                                        title="Memory location"
                                        width="100%"
                                        height="200"
                                        loading="lazy"
                                        className="grayscale-[50%] hover:grayscale-0 transition-all border-none"
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
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightbox}
                            alt=""
                            className="max-w-full max-h-[90vh] object-contain border-[6px] border-black shadow-[12px_12px_0_#fff]"
                        />
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-4 -right-4 w-12 h-12 bg-[#FF3300] border-[4px] border-black shadow-[4px_4px_0_#fff] flex items-center justify-center text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#fff] transition-all text-xl font-black"
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