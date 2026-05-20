"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Calendar,
    Camera,
    Clock,
    Coffee,
    GraduationCap,
    Grid3X3,
    Heart,
    Image as ImageIcon,
    Inbox,
    Loader2,
    Map,
    MapPin,
    Mountain,
    Music2,
    Palmtree,
    Plane,
    Route,
    Sparkles,
    Star,
    Waves,
} from "lucide-react"
import toast from "react-hot-toast"
import { MemoryCard } from "@/components/memories/MemoryCard"
import { MemoryCover } from "@/components/memories/MemoryCover"
import { formatDate } from "@/lib/utils"

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[500px] w-full items-center justify-center border-[4px] border-black bg-[#DFF7E8]">
            <span className="text-xs font-black uppercase tracking-widest text-black">Memuat peta album...</span>
        </div>
    ),
})

interface MemoryPhoto {
    id: string
    url: string
}

interface StickerPlacement {
    id: string
    posX: number
    posY: number
    rotation: number
    scale: number
    customText?: string | null
    item: { id: string; name: string; value: string; previewColor: string | null }
}

interface Memory {
    id: string
    title: string
    story: string
    date: string
    emotion: string
    isPublic: boolean
    latitude: number
    longitude: number
    locationName: string | null
    isCollaboration: boolean
    photos: MemoryPhoto[]
    stickerPlacements: StickerPlacement[]
    user?: {
        id: string
        name: string | null
        image: string | null
    }
    _count?: {
        reactions: number
        comments: number
    }
}

interface AlbumDetail {
    id: string
    name: string
    description: string | null
    coverImage: string | null
    icon: string | null
    createdAt: string
    updatedAt: string
    memories: Memory[]
}

type ViewMode = "grid" | "timeline" | "map"

const ICON_OPTIONS: Array<{ id: string; Icon: LucideIcon }> = [
    { id: "waves", Icon: Waves },
    { id: "heart", Icon: Heart },
    { id: "plane", Icon: Plane },
    { id: "coffee", Icon: Coffee },
    { id: "graduation", Icon: GraduationCap },
    { id: "mountain", Icon: Mountain },
    { id: "camera", Icon: Camera },
    { id: "star", Icon: Star },
    { id: "palm", Icon: Palmtree },
    { id: "music", Icon: Music2 },
]

// ── Accent colors ──────────────────────────────────────────
const STAT_COLORS = ["#00DDEB", "#FF6B9D", "#06D6A0", "#FFD166"]
const ROTATIONS = ["scrap-rotate-1", "scrap-rotate-2", "scrap-rotate-3", "scrap-rotate-4"]

function normalizeIconId(icon?: string | null) {
    const legacyMap: Record<string, string> = {
        "\u{1F30A}": "waves",
        "\u2764\uFE0F": "heart",
        "\u2708\uFE0F": "plane",
        "\u2615": "coffee",
        "\u{1F393}": "graduation",
        "\u26F0\uFE0F": "mountain",
        "\u{1F4F7}": "camera",
        "\u2B50": "star",
        "\u{1F334}": "palm",
        "\u{1F3B5}": "music",
        "\u{1F4DA}": "book",
        "\u{1F4E5}": "inbox",
    }
    if (!icon) return "book"
    if (ICON_OPTIONS.some(option => option.id === icon)) return icon
    return legacyMap[icon] || "book"
}

function AlbumGlyph({ icon, className = "h-8 w-8" }: { icon?: string | null; className?: string }) {
    const normalized = normalizeIconId(icon)
    const Icon = normalized === "book"
        ? BookOpen
        : normalized === "inbox"
            ? Inbox
            : ICON_OPTIONS.find(option => option.id === normalized)?.Icon || BookOpen
    return <Icon className={className} strokeWidth={2.8} />
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}



export default function AlbumDetailPage() {
    const { id } = useParams() as { id: string }
    const router = useRouter()
    const { data: session } = useSession()

    const [album, setAlbum] = useState<AlbumDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    useEffect(() => {
        if (!session?.user?.id || !id) return

        const fetchAlbum = async () => {
            try {
                const res = await fetch(`/api/albums/${id}`)
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Album tidak ditemukan")
                    throw new Error("Gagal mengambil detail album")
                }
                setAlbum(await res.json())
            } catch (error: unknown) {
                toast.error(getErrorMessage(error, "Terjadi kesalahan"))
                router.push("/albums")
            } finally {
                setLoading(false)
            }
        }

        fetchAlbum()
    }, [id, router, session?.user?.id])

    const stats = useMemo(() => {
        if (!album) return { memories: 0, photos: 0, places: 0, latest: "-" }
        const photos = album.memories.reduce((sum, memory) => sum + (memory.photos?.length || 0), 0)
        const places = new Set(album.memories.map(memory => memory.locationName?.trim()).filter(Boolean)).size
        const latestMemory = [...album.memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        return {
            memories: album.memories.length,
            photos,
            places,
            latest: latestMemory ? formatDate(new Date(latestMemory.date)) : formatDate(new Date(album.updatedAt)),
        }
    }, [album])

    const chronologicalGroups = useMemo(() => {
        if (!album) return []
        const groups: Record<string, Memory[]> = {}
        const sorted = [...album.memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        for (const memory of sorted) {
            const date = new Date(memory.date)
            const key = date.toLocaleString("id-ID", { month: "long", year: "numeric" })
            groups[key] = groups[key] || []
            groups[key].push(memory)
        }
        return Object.entries(groups)
    }, [album])

    const recentPhotos = useMemo(() => {
        if (!album) return []
        return [...album.memories]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6)
    }, [album])

    if (loading) {
        return (
            <div className="flex min-h-[520px] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF00FF]" />
                <p className="text-sm font-black uppercase tracking-widest text-black">Memuat album...</p>
            </div>
        )
    }

    if (!album) return null

    const statItems = [
        { label: "Memory", value: stats.memories, emoji: "", color: STAT_COLORS[0] },
        { label: "Foto", value: stats.photos, emoji: "", color: STAT_COLORS[1] },
        { label: "Kota", value: stats.places, emoji: "", color: STAT_COLORS[2] },
        { label: "Update", value: stats.latest, emoji: "", color: STAT_COLORS[3] },
    ]

    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 pb-32 sm:px-6 lg:px-8">
            {/* ── Back nav ────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <Link
                    href="/albums"
                    className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFFF00]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Link>
            </div>

            {/* ══════════════════════════════════════════════════
                HERO — Album Detail (Polaroid Frame)
                ══════════════════════════════════════════════════ */}
            <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <div className="relative overflow-hidden border-[4px] border-black bg-white shadow-[9px_9px_0_#000]">
                    {/* Cover area with double border (polaroid feel) */}
                    <div className="relative overflow-hidden border-b-[4px] border-black">
                        <div className="m-2 border-[3px] border-black bg-white p-1.5">
                            <div className="relative h-[320px] overflow-hidden bg-[#E5E5E5] sm:h-[360px]">
                                {album.coverImage ? (
                                    <img src={album.coverImage} alt={album.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-[linear-gradient(135deg,#00FFFF55,#FFFF0066_50%,#FF00FF55)]" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                {/* Album badge */}
                                <div className="absolute left-4 top-4 rotate-[-5deg] border-[3px] border-black bg-[#FFFF00] px-4 py-1.5 text-[10px] font-black uppercase text-black shadow-[3px_3px_0_#000]">
                                    Album
                                </div>

                                {/* Album info overlay */}
                                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                                    <div
                                        className="flex h-16 w-16 shrink-0 items-center justify-center border-[4px] border-black bg-[#FFFF00] text-black shadow-[4px_4px_0_#FF00FF] sm:h-20 sm:w-20"
                                    >
                                        <AlbumGlyph icon={album.icon} className="h-8 w-8 sm:h-10 sm:w-10" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-2xl font-black uppercase leading-none text-white drop-shadow-[3px_3px_0_rgba(0,0,0,.85)] sm:text-4xl lg:text-5xl">
                                            {album.name}
                                        </h1>
                                        <p className="mt-2 max-w-2xl text-xs font-bold leading-6 text-white/85 drop-shadow-[2px_2px_0_rgba(0,0,0,.7)] sm:text-sm">
                                            {album.description || "Album ini belum memiliki deskripsi. Isi dengan cerita yang ingin kamu simpan rapi."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Handwritten caption under polaroid frame */}
                        <div className="px-4 py-2 text-center">
                            <span className="font-caveat text-sm text-black/40">
                                {album.memories.length > 0
                                    ? `${album.memories.length} kenangan tersimpan`
                                    : "Mulai isi chapter ini..."
                                }
                            </span>
                        </div>
                    </div>

                    {/* Stats row — scrapbook mini cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4">
                        {statItems.map((stat, i) => (
                            <div
                                key={stat.label}
                                className="border-r-[3px] border-black p-3.5 last:border-r-0 sm:p-4"
                                style={{ borderTopColor: stat.color, borderTopWidth: "4px" }}
                            >
                                <span className="block text-[10px] font-black uppercase text-black/50">
                                    {stat.label}
                                </span>
                                <strong className={`mt-1 block font-black uppercase leading-tight text-black ${typeof stat.value === "string" ? "text-[11px]" : "text-2xl sm:text-3xl"}`}>
                                    {stat.value}
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Aside: Album Summary ────────────────────── */}
                <aside className="space-y-5 border-[4px] border-black bg-[#FFFDF0] p-5 shadow-[8px_8px_0_#000]">
                    <div className="dot-paper-light pointer-events-none absolute inset-0 opacity-20" />

                    <div className="relative flex items-center gap-2 border-b-[3px] border-black pb-3">
                        <Route className="h-5 w-5 text-black" />
                        <h2 className="text-sm font-black uppercase text-black">Ringkasan Album</h2>
                    </div>

                    {/* Mini map preview */}
                    <div className="relative h-36 overflow-hidden border-[3px] border-black bg-[#DFF7E8]">
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
                        {album.memories.slice(0, 5).map((memory, index) => (
                            <div
                                key={memory.id}
                                className="absolute flex h-8 w-8 items-center justify-center border-[3px] border-black bg-[#FFFF00] shadow-[2px_2px_0_#000]"
                                style={{
                                    left: `${14 + (index * 17) % 70}%`,
                                    top: `${18 + (index * 23) % 56}%`,
                                }}
                            >
                                <MapPin className="h-4 w-4 text-black" />
                            </div>
                        ))}
                        {album.memories.length === 0 && (
                            <div className="flex h-full items-center justify-center">
                                <span className="text-xs font-bold text-black/30">Belum ada lokasi</span>
                            </div>
                        )}
                    </div>

                    {/* Recent photos */}
                    <div className="relative">
                        <h3 className="mb-3 text-xs font-black uppercase text-black">Memory Terbaru</h3>
                        {recentPhotos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {recentPhotos.map((memory, i) => (
                                    <Link
                                        key={memory.id}
                                        href={`/memories/${memory.id}`}
                                        className={`aspect-square overflow-hidden border-[3px] border-black bg-white shadow-[2px_2px_0_#000] transition-transform hover:scale-105 ${ROTATIONS[i % ROTATIONS.length]}`}
                                    >
                                        <MemoryCover memory={memory} />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-28 items-center justify-center border-[3px] border-dashed border-black bg-white text-xs font-black uppercase text-black/50">
                                Belum ada foto
                            </div>
                        )}
                    </div>

                    <Link href="#album-content" className="relative flex items-center justify-center gap-2 border-[3px] border-black bg-[#FFFF00] px-4 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000]">
                        Lihat Semua Memory <ArrowRight className="h-4 w-4" />
                    </Link>
                </aside>
            </section>

            {/* ══════════════════════════════════════════════════
                CONTENT — Memories in this album
                ══════════════════════════════════════════════════ */}
            <section id="album-content" className="space-y-5">
                <div className="flex flex-col gap-4 border-b-[4px] border-black pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase text-black">Isi Album</h2>
                        <p className="text-xs font-bold text-black/55">Pilih cara terbaik untuk membaca kenanganmu.</p>
                    </div>
                    <div className="flex w-fit border-[3px] border-black bg-white shadow-[3px_3px_0_#000]">
                        {[
                            ["grid", Grid3X3, "Grid"],
                            ["timeline", Calendar, "Timeline"],
                            ["map", Map, "Map"],
                        ].map(([mode, Icon, label]) => {
                            const LucideIcon = Icon as typeof Grid3X3
                            return (
                                <button
                                    key={mode as string}
                                    onClick={() => setViewMode(mode as ViewMode)}
                                    className={`flex items-center gap-1.5 border-r-[2px] border-black px-3.5 py-2 text-xs font-black uppercase last:border-r-0 ${viewMode === mode ? "bg-[#00DDEB]" : "bg-white hover:bg-[#FFFF00]"}`}
                                >
                                    <LucideIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{label as string}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {album.memories.length === 0 ? (
                    <div className="border-[4px] border-black bg-white p-12 text-center shadow-[7px_7px_0_#000]">
                        <ImageIcon className="mx-auto mb-4 h-12 w-12 text-black" />
                        <h3 className="mb-2 text-lg font-black uppercase text-black">Album ini masih kosong</h3>
                        <p className="mb-4 text-xs font-bold text-black/55">Tambahkan memory dari halaman album untuk mulai mengisi koleksi ini.</p>
                        <p className="mx-auto mb-6 font-caveat text-base text-black/40">Mulai isi chapter ini dengan kenanganmu</p>
                        <Link href="/albums" className="inline-flex border-[3px] border-black bg-[#00FF00] px-5 py-3 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">
                            Kelola Memory
                        </Link>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === "grid" && (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            >
                                {album.memories.map(memory => (
                                    <MemoryCard key={memory.id} memory={memory} isCollaboration={memory.isCollaboration} placements={memory.stickerPlacements || []} />
                                ))}
                            </motion.div>
                        )}

                        {viewMode === "timeline" && (
                            <motion.div
                                key="timeline"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="mx-auto max-w-4xl space-y-8"
                            >
                                {chronologicalGroups.map(([month, memories], groupIndex) => (
                                    <div key={month} className="relative border-l-[4px] border-black pl-7">
                                        <div
                                            className="absolute -left-[12px] top-2 h-5 w-5 border-[3px] border-black"
                                            style={{ backgroundColor: STAT_COLORS[groupIndex % STAT_COLORS.length] }}
                                        />
                                        <h3
                                            className="mb-4 w-fit border-[3px] border-black px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]"
                                            style={{ backgroundColor: STAT_COLORS[groupIndex % STAT_COLORS.length] }}
                                        >
                                            {month}
                                        </h3>
                                        <div className="space-y-4">
                                            {memories.map(memory => {
                                                return (
                                                    <Link
                                                        key={memory.id}
                                                        href={`/memories/${memory.id}`}
                                                        className="group flex flex-col gap-4 border-[3px] border-black bg-white p-4 shadow-[5px_5px_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] sm:flex-row"
                                                    >
                                                        <div className="aspect-video w-full shrink-0 overflow-hidden border-[3px] border-black bg-[#E5E5E5] sm:w-44">
                                                            <MemoryCover memory={memory} className="transition-transform duration-500 group-hover:scale-105" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                                <span className="border-2 border-black bg-[#00FFFF] px-2 py-0.5 text-[10px] font-black uppercase text-black">{memory.emotion}</span>
                                                                {memory.locationName && (
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-black/55">
                                                                        <MapPin className="h-3 w-3" /> {memory.locationName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="line-clamp-1 text-lg font-black uppercase text-black group-hover:text-[#FF00FF]">{memory.title}</h4>
                                                            <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-black/60">{memory.story}</p>
                                                            <span className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase text-black/45">
                                                                <Clock className="h-3.5 w-3.5" /> {formatDate(new Date(memory.date))}
                                                            </span>
                                                        </div>
                                                        <ArrowRight className="hidden h-5 w-5 self-center transition-transform group-hover:translate-x-1 sm:block" />
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {viewMode === "map" && (
                            <motion.div
                                key="map"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="h-[540px] overflow-hidden border-[4px] border-black shadow-[8px_8px_0_#000]"
                            >
                                <MapView memories={album.memories} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </section>
        </div>
    )
}
