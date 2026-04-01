"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    ArrowLeft, Edit, Trash2, Calendar, MapPin, Loader2,
    Globe, Lock, ExternalLink, Images
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Reactions } from "@/components/memories/Reactions"
import { Comments } from "@/components/memories/Comments"
import { ReportDialog } from "@/components/ui/ReportDialog"

export default function MemoryDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [memory, setMemory] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [lightbox, setLightbox] = useState<string | null>(null)

    useEffect(() => {
        fetch(`/api/memories/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Tidak ditemukan")
                return res.json()
            })
            .then(data => {
                // Parse photo URLs if they are JSON strings
                if (data.photos) {
                    data.photos = data.photos.map((p: any) => {
                        try {
                            const parsed = JSON.parse(p.url)
                            return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
                        } catch {
                            // Legacy raw string fallback
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
    }, [id, router])

    const handleDelete = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus kenangan ini?")) return
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

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-neutral-500 animate-pulse">Memuat kenangan...</p>
                </div>
            </div>
        )
    }

    const isOwner = session?.user?.id === memory?.userId || session?.user?.role === "ADMIN"
    const heroPhoto = memory.photos?.[0]
    const galleryPhotos = memory.photos?.slice(1) || []
    const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    })

    return (
        <div className="w-full pb-20">

            {/* ─── HERO SECTION ─────────────────────────────────── */}
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

                {/* Gradient overlay — bottom heavy for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                {/* Top bar — back button + action buttons */}
                <div className="absolute top-0 left-0 right-0 px-5 md:px-10 py-5 flex items-center justify-between z-10">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group backdrop-blur-sm bg-black/20 border border-white/10 rounded-full px-4 py-2 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                        Kembali
                    </button>

                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <>
                                <Link href={`/memories/${id}/edit`}>
                                    <button className="flex items-center gap-2 text-white/70 hover:text-indigo-300 transition-colors backdrop-blur-sm bg-black/20 border border-white/10 rounded-full px-4 py-2 text-sm font-medium">
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 text-white/70 hover:text-red-400 transition-colors backdrop-blur-sm bg-black/20 border border-white/10 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isDeleting ? "Menghapus..." : "Hapus"}
                                </button>
                            </>
                        )}
                        {!isOwner && session?.user && (
                            <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-full px-1 py-1">
                                <ReportDialog memoryId={memory.id} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Hero content — bottom left */}
                <div className="absolute bottom-0 left-0 right-0 px-5 md:px-14 pb-10 z-10">
                    {/* Tags / visibility badge */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${memory.isPublic
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-neutral-700/40 border-neutral-600/40 text-neutral-400"
                            }`}>
                            {memory.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {memory.isPublic ? "Publik" : "Privat"}
                        </span>
                        {galleryPhotos.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border bg-black/30 border-white/10 text-neutral-300">
                                <Images className="w-3 h-3" />
                                {galleryPhotos.length + 1} Foto
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-[Outfit] text-white leading-tight tracking-tight max-w-4xl drop-shadow-2xl mb-5">
                        {memory.title}
                    </h1>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60 font-medium">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            {formattedDate}
                        </span>
                        {memory.locationName && (
                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-violet-400" />
                                {memory.locationName}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10">
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

                    {/* ── LEFT / STORY COLUMN (2/3) ── */}
                    <main className="flex-1 min-w-0">

                        {/* Author Card */}
                        <Link
                            href={`/profile/${memory.user.id}`}
                            className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/60 hover:border-indigo-500/40 hover:bg-neutral-900/80 transition-all group w-fit"
                        >
                            <div className="relative shrink-0">
                                <img
                                    src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                                    alt={memory.user.name}
                                    className="w-12 h-12 rounded-full border-2 border-neutral-700 group-hover:border-indigo-500 transition-colors object-cover bg-neutral-800"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-900" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-100 group-hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-sm">
                                    {memory.user.name}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {memory.isPublic ? "Dibagikan publik" : "Kenangan privat"} · {formattedDate}
                                </p>
                            </div>
                        </Link>

                        {/* Story / Prose */}
                        <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed space-y-5 text-[1.0625rem] font-sans mb-10
                            prose-p:text-neutral-300 prose-p:leading-[1.85] prose-p:text-[1.0625rem]">
                            {memory.story.split("\n").map((para: string, i: number) => (
                                para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                            ))}
                        </div>

                        {/* Reactions Bar */}
                        <div className="mb-10 bg-neutral-900/60 border border-neutral-800/60 rounded-2xl px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">Reaksi</p>
                            <Reactions memoryId={memory.id} initialReactions={memory.reactions || []} />
                        </div>

                        {/* Photo Gallery */}
                        {galleryPhotos.length > 0 && (
                            <div className="mb-10">
                                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">Galeri</p>
                                <div className={`grid gap-3 ${galleryPhotos.length === 1 ? "grid-cols-1" :
                                    galleryPhotos.length === 2 ? "grid-cols-2" :
                                        galleryPhotos.length === 3 ? "grid-cols-3" :
                                            "grid-cols-2 md:grid-cols-3"
                                    }`}>
                                    {galleryPhotos.map((photo: any, idx: number) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setLightbox(photo.url)}
                                            className={`group relative overflow-hidden rounded-2xl border border-neutral-800 hover:border-indigo-500/50 transition-all ${idx === 0 && galleryPhotos.length >= 4 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                                                }`}
                                        >
                                            <img
                                                src={photo.url}
                                                alt=""
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <Comments memoryId={memory.id} initialComments={memory.comments || []} />
                    </main>

                    {/* ── RIGHT / SIDEBAR (1/3) ── */}
                    <aside className="w-full lg:w-72 xl:w-80 shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-4">

                            {/* Memory Info Card */}
                            <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">Detail Kenangan</p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Tanggal</p>
                                            <p className="text-sm text-neutral-200 font-medium">{formattedDate}</p>
                                        </div>
                                    </li>
                                    {memory.locationName && (
                                        <li className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Lokasi</p>
                                                <p className="text-sm text-neutral-200 font-medium">{memory.locationName}</p>
                                            </div>
                                        </li>
                                    )}
                                    <li className="flex items-start gap-3">
                                        {memory.isPublic
                                            ? <Globe className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                            : <Lock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                                        }
                                        <div>
                                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Visibilitas</p>
                                            <p className="text-sm text-neutral-200 font-medium">{memory.isPublic ? "Publik" : "Privat"}</p>
                                        </div>
                                    </li>
                                    {memory.photos?.length > 0 && (
                                        <li className="flex items-start gap-3">
                                            <Images className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Foto</p>
                                                <p className="text-sm text-neutral-200 font-medium">{memory.photos.length} terlampir</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Collaborators Card — hanya tampil jika ada kolaborator yang accepted */}
                            {memory.collaborators && memory.collaborators.length > 0 && (
                                <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-5">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
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
                                                    className="w-9 h-9 rounded-full border border-neutral-700 group-hover:border-violet-500 transition-colors object-cover bg-neutral-800 shrink-0"
                                                />
                                                <p className="text-sm font-medium text-neutral-300 group-hover:text-violet-400 transition-colors truncate">
                                                    {collab.user.name}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Map Preview — if lat/lng exist */}
                            {memory.latitude && memory.longitude && (
                                <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-2xl overflow-hidden">
                                    <div className="px-5 pt-4 pb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Lokasi pada Peta</p>
                                    </div>
                                    <iframe
                                        title="Memory location"
                                        width="100%"
                                        height="180"
                                        loading="lazy"
                                        className="grayscale opacity-80"
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
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightbox}
                            alt=""
                            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
                        />
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-lg font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
