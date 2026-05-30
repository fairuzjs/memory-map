"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
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
    Sparkles,
    Star,
    Waves,
    Users,
    CheckCircle2,
    XCircle,
    Crown,
    Trash2,
    Send,
    X
} from "lucide-react"
import toast from "react-hot-toast"
import { MemoryCard } from "@/components/memories/MemoryCard"
import { MemoryCover } from "@/components/memories/MemoryCover"
import { formatDate } from "@/lib/utils"
import { StickyNotesWall } from "@/components/albums/StickyNotesWall"
import { AlbumChatDrawer } from "@/components/albums/AlbumChatDrawer"

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[500px] w-full items-center justify-center border-[4px] border-black bg-[color-mix(in_srgb,var(--mm-success)_20%,var(--mm-bg))]">
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
    userId: string
    name: string
    description: string | null
    coverImage: string | null
    pendingCoverImage: string | null
    pendingCoverActorId: string | null
    icon: string | null
    createdAt: string
    updatedAt: string
    memories: Memory[]
    collaborators: {
        id: string
        userId: string
        role: "OWNER" | "EDITOR" | "CONTRIBUTOR"
        status: "PENDING" | "ACCEPTED" | "DECLINED"
        user: {
            id: string
            name: string
            image: string | null
        }
    }[]
}

interface UserSuggestion {
    id: string
    name: string
    username?: string | null
    email?: string | null
    image?: string | null
}

interface MemoryParticle {
    id: number
    emoji: string
    x: number
    y: number
}

type ViewMode = "grid" | "timeline" | "map" | "sticky"

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
const STAT_COLORS = ["var(--mm-soft-cyan)", "var(--mm-tertiary)", "var(--mm-success)", "var(--mm-warning)"]
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
    const [pendingRemoveCollaborator, setPendingRemoveCollaborator] = useState<{
        userId: string
        name: string
        isSelf: boolean
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [showMobileNotesSheet, setShowMobileNotesSheet] = useState(false)

    // Shared album states
    const [selectedContributorId, setSelectedContributorId] = useState<string | null>(null)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const [inviteInput, setInviteInput] = useState("")
    const [inviteRole, setInviteRole] = useState<"EDITOR" | "CONTRIBUTOR">("CONTRIBUTOR")
    const [isInviting, setIsInviting] = useState(false)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const autocompleteRef = useRef<HTMLDivElement>(null)

    const fetchAlbum = useCallback(async () => {
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
    }, [id, router])

    useEffect(() => {
        if (!session?.user?.id || !id) return
        fetchAlbum()
    }, [id, session?.user?.id, fetchAlbum])

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
                setUserSuggestions([])
            }
        }
        document.addEventListener("mousedown", handleOutsideClick)
        return () => document.removeEventListener("mousedown", handleOutsideClick)
    }, [])

    const handleInviteInputChange = async (val: string) => {
        setInviteInput(val)
        const query = val.trim()
        if (query.length < 2) {
            setUserSuggestions([])
            return
        }
        setIsSearchingUsers(true)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
            if (res.ok) {
                const data = await res.json()
                setUserSuggestions(data)
            } else {
                setUserSuggestions([])
            }
        } catch {
            setUserSuggestions([])
        } finally {
            setIsSearchingUsers(false)
        }
    }

    const isOwner = album?.userId === session?.user?.id
    const [memoryParticles, setMemoryParticles] = useState<MemoryParticle[]>([])

    const handleMemoryEmojiReaction = (memoryId: string, emoji: string, e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const newParticle: MemoryParticle = {
            id: Date.now() + Math.random(),
            emoji,
            x: rect.left + rect.width / 2 + (Math.random() * 20 - 10),
            y: rect.top - 10
        }
        setMemoryParticles(prev => [...prev, newParticle])
        
        setTimeout(() => {
            setMemoryParticles(prev => prev.filter(p => p.id !== newParticle.id))
        }, 1200)

        toast.success(`Kamu bereaksi ${emoji}!`, { id: `react-${memoryId}`, duration: 800 })
    }
    const acceptedCollaborators = useMemo(() => {
        return album?.collaborators?.filter(c => c.status === "ACCEPTED") || []
    }, [album])

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

    // Filter memories by selected contributor
    const filteredMemories = useMemo(() => {
        if (!album) return []
        if (!selectedContributorId) return album.memories
        return album.memories.filter(m => m.user?.id === selectedContributorId)
    }, [album, selectedContributorId])

    const chronologicalGroups = useMemo(() => {
        if (!album) return []
        const groups: Record<string, Memory[]> = {}
        const sorted = [...filteredMemories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        for (const memory of sorted) {
            const date = new Date(memory.date)
            const key = date.toLocaleString("id-ID", { month: "long", year: "numeric" })
            groups[key] = groups[key] || []
            groups[key].push(memory)
        }
        return Object.entries(groups)
    }, [album, filteredMemories])

    // Contributor colors helper
    const contributorColors = useMemo(() => {
        const colors: Record<string, string> = {}
        if (!album) return colors
        colors[album.userId] = "var(--mm-warning)" // Owner color
        const palette = ["var(--mm-soft-cyan)", "var(--mm-tertiary)", "var(--mm-success)", "var(--mm-accent)", "var(--mm-primary)"]
        acceptedCollaborators.forEach((c, idx) => {
            colors[c.userId] = palette[idx % palette.length]
        })
        return colors
    }, [album, acceptedCollaborators])

    // Invite user api call
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteInput.trim()) return
        setIsInviting(true)
        try {
            const res = await fetch(`/api/albums/${id}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target: inviteInput.trim(), role: inviteRole })
            })
            if (res.ok) {
                toast.success("Undangan kolaborasi berhasil dikirim.")
                setInviteInput("")
                setUserSuggestions([])
                fetchAlbum()
            } else {
                const err = await res.json()
                toast.error(err.error || "Gagal mengirim undangan")
            }
        } catch (err) {
            toast.error("Gagal mengirim undangan")
        } finally {
            setIsInviting(false)
        }
    }

    // Eject or self-remove collaborator
    const handleRemoveCollaborator = (targetId: string) => {
        const isSelf = targetId === session?.user?.id
        const collab = album?.collaborators?.find(c => c.userId === targetId)
        const name = collab?.user?.name || (isSelf ? session?.user?.name || "Saya" : "Kolaborator")

        setPendingRemoveCollaborator({
            userId: targetId,
            name,
            isSelf
        })
    }

    const confirmRemoveCollaborator = async () => {
        if (!pendingRemoveCollaborator) return
        const { userId, isSelf } = pendingRemoveCollaborator

        setIsRemoving(userId)
        try {
            const res = await fetch(`/api/albums/${id}/collaborators/${userId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast.success(isSelf ? "Anda telah keluar dari album." : "Kolaborator berhasil dikeluarkan.")
                setPendingRemoveCollaborator(null)
                if (isSelf) {
                    router.push("/albums")
                } else {
                    fetchAlbum()
                }
            } else {
                toast.error("Gagal memproses tindakan")
            }
        } catch {
            toast.error("Terjadi kesalahan teknis")
        } finally {
            setIsRemoving(null)
        }
    }

    // Cover image request respond
    const handleCoverRespond = async (action: "ACCEPT" | "REJECT") => {
        setIsSaving(true)
        try {
            const res = await fetch(`/api/albums/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action === "ACCEPT" ? { approvePendingCover: true } : { rejectPendingCover: true })
            })
            if (res.ok) {
                toast.success(action === "ACCEPT" ? "Cover baru disetujui." : "Pengajuan cover ditolak.")
                fetchAlbum()
            } else {
                toast.error("Gagal memperbarui cover album")
            }
        } catch (err) {
            toast.error("Terjadi kesalahan teknis")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[520px] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--mm-accent)]" />
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
                    className="inline-flex items-center gap-2 border-[2.5px] border-black bg-white px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] hover:bg-[var(--mm-warning)] active:translate-y-px active:shadow-none"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Link>

                {(album.userId === session?.user?.id || acceptedCollaborators.length > 0) && (
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="inline-flex items-center gap-2 border-[2.5px] border-black bg-white px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] hover:bg-[var(--mm-primary)] active:translate-y-px active:shadow-none"
                    >
                        <Users className="h-4 w-4" />
                        Kolaborator ({acceptedCollaborators.length + 1}/5)
                    </button>
                )}
            </div>

            {/* ── Pending Cover Request Banner (Owner only) ── */}
            {isOwner && album.pendingCoverImage && (
                <div className="flex items-center gap-4 border-[2.5px] border-black bg-[var(--mm-secondary)]/10 p-3.5 rounded-2xl shadow-[3px_3px_0_var(--mm-shadow)] border-dashed">
                    <div className="relative h-16 w-24 shrink-0 border border-black rounded-lg overflow-hidden">
                        <img src={album.pendingCoverImage} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="inline-block mb-1 px-1.5 py-0.5 bg-[var(--mm-secondary)] border border-black text-[8px] font-black uppercase rounded-md">Pending Cover</span>
                        <p className="text-[11px] font-bold text-black/70">Seorang Editor mengajukan cover baru. Silakan review:</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            disabled={isSaving}
                            onClick={() => handleCoverRespond("ACCEPT")}
                            className="py-1.5 px-3 text-[10px] font-black uppercase bg-[var(--mm-success)] border border-black rounded-xl hover:brightness-105 active:translate-y-px shadow-[2px_2px_0_#000] disabled:opacity-50"
                        >
                            Setujui
                        </button>
                        <button
                            disabled={isSaving}
                            onClick={() => handleCoverRespond("REJECT")}
                            className="py-1.5 px-3 text-[10px] font-black uppercase bg-white border border-black rounded-xl hover:bg-neutral-100 active:translate-y-px shadow-[2px_2px_0_#000] disabled:opacity-50"
                        >
                            Tolak
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                HERO — Album Detail (Polaroid Frame)
                ══════════════════════════════════════════════════ */}
            <section className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
                <div className="relative overflow-hidden border-[3px] border-black bg-white rounded-2xl shadow-[6px_6px_0_#000]">
                    {/* Cover area with double border (polaroid feel) */}
                    <div className="relative overflow-hidden border-b-[2.5px] border-black bg-white">
                        <div className="m-3 border-[2.5px] border-black bg-white p-1.5 rounded-xl overflow-hidden">
                            <div className="relative h-[320px] overflow-hidden bg-neutral-100 rounded-lg sm:h-[360px]">
                                {album.coverImage ? (
                                    <img src={album.coverImage} alt={album.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-[linear-gradient(135deg,color-mix(in_srgb,var(--mm-secondary)_33%,transparent),color-mix(in_srgb,var(--mm-warning)_40%,transparent)_50%,color-mix(in_srgb,var(--mm-accent)_33%,transparent))]" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                                {/* Album badge */}
                                <div className="absolute left-4 top-4 flex gap-2 rotate-[-3deg] z-20">
                                    <div className="border-[2px] border-black bg-[var(--mm-warning)] px-3.5 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0_#000] rounded-lg">
                                        Album
                                    </div>
                                    {(album.userId !== session?.user?.id || acceptedCollaborators.length > 0) && (
                                        <div className="border-[2px] border-black bg-[var(--mm-success)] px-3.5 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0_#000] rounded-lg">
                                            Shared
                                        </div>
                                    )}
                                </div>

                                {/* Album info overlay */}
                                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                                    <div
                                        className="flex h-16 w-16 shrink-0 items-center justify-center border-[2.5px] border-black bg-[var(--mm-warning)] text-black shadow-[3px_3px_0_var(--mm-tertiary)] rounded-2xl sm:h-20 sm:w-20"
                                    >
                                        <AlbumGlyph icon={album.icon} className="h-8 w-8 sm:h-10 sm:w-10" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-2xl font-black uppercase leading-none text-white drop-shadow-[2.5px_2.5px_0_rgba(0,0,0,0.95)] sm:text-4xl lg:text-5xl">
                                            {album.name}
                                        </h1>
                                        <p className="mt-2.5 max-w-2xl text-xs font-bold leading-relaxed text-white drop-shadow-[1.5px_1.5px_0_rgba(0,0,0,0.8)] sm:text-sm">
                                            {album.description || "Album ini belum memiliki deskripsi. Isi dengan cerita yang ingin kamu simpan rapi."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Handwritten caption under polaroid frame */}
                        <div className="px-4 py-2.5 text-center border-t-[2.5px] border-black bg-[var(--mm-bg)]">
                            <span className="font-caveat text-sm font-bold text-black/50">
                                {album.memories.length > 0
                                    ? `${album.memories.length} kenangan tersimpan`
                                    : "Mulai isi chapter ini..."
                                }
                            </span>
                        </div>
                    </div>

                    {/* Stats row — scrapbook mini cards */}
                    <div className="grid grid-cols-2 divide-x-[2.5px] divide-y-[2.5px] sm:divide-y-0 sm:grid-cols-4 divide-black bg-white">
                        {statItems.map((stat, i) => (
                            <div
                                key={stat.label}
                                className="p-3.5 sm:p-4 transition-all duration-200 hover:bg-neutral-50/50"
                                style={{ borderTop: `4px solid ${stat.color}` }}
                            >
                                <span className="block text-[10px] font-black uppercase text-black/50 tracking-wider">
                                    {stat.label}
                                </span>
                                <strong className={`mt-1 block font-black uppercase leading-none text-black ${typeof stat.value === "string" ? "text-[11px] sm:text-xs" : "text-2xl sm:text-3xl"}`}>
                                    {stat.value}
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Sticky Notes Wall ───────────────────────── */}
                <div className="hidden lg:block">
                    <StickyNotesWall
                        albumId={id}
                        albumOwnerId={album.userId}
                        currentUserId={session?.user?.id}
                    />
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                CONTENT — Memories in this album
                ══════════════════════════════════════════════════ */}
            <section id="album-content" className="space-y-5">
                <div className="flex flex-col gap-4 border-b-[3px] border-black pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase text-black tracking-wider">Isi Album</h2>
                        <p className="text-xs font-bold text-black/55">Pilih cara terbaik untuk membaca kenanganmu.</p>
                    </div>
                    <div className="flex w-fit border-[2.5px] border-black bg-white rounded-xl overflow-hidden shadow-[3px_3px_0_#000]">
                        {[
                            ["grid", Grid3X3, "Grid", "flex"],
                            ["timeline", Calendar, "Timeline", "flex"],
                            ["map", Map, "Map", "flex"],
                        ].map(([mode, Icon, label, visibility]) => {
                            const LucideIcon = Icon as typeof Grid3X3
                            const isActive = viewMode === mode
                            return (
                                <button
                                    key={mode as string}
                                    onClick={() => setViewMode(mode as ViewMode)}
                                    className={`${visibility} items-center gap-1.5 border-r-[2.5px] border-black px-4 py-2.5 text-xs font-black uppercase last:border-r-0 transition-all ${
                                        isActive 
                                            ? "bg-[var(--mm-soft-cyan)] text-black" 
                                            : "bg-white text-black hover:bg-[var(--mm-warning)]"
                                    }`}
                                >
                                    <LucideIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{label as string}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Contributor Filter Bar */}
                {album.collaborators && album.collaborators.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2.5 p-4 border-[2.5px] border-black bg-[var(--mm-surface)] rounded-2xl shadow-[4px_4px_0_var(--mm-shadow)] mb-4">
                        <button
                            onClick={() => setSelectedContributorId(null)}
                            className={`px-3 py-1.5 border-[2px] border-black text-[11px] font-black uppercase rounded-xl transition-all ${
                                !selectedContributorId 
                                    ? "bg-black text-white shadow-none" 
                                    : "bg-white text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000]"
                            }`}
                        >
                            Semua ({album.memories.length})
                        </button>
                        
                        {/* Owner filter */}
                        <button
                            onClick={() => setSelectedContributorId(album.userId)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[11px] font-black uppercase rounded-xl transition-all ${
                                selectedContributorId === album.userId
                                    ? "bg-black text-white shadow-none"
                                    : "bg-white text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000]"
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: contributorColors[album.userId] }} />
                            Owner ({album.memories.filter(m => m.user?.id === album.userId).length})
                        </button>

                        {/* Collaborator filters */}
                        {acceptedCollaborators.map(c => {
                            const count = album.memories.filter(m => m.user?.id === c.userId).length
                            return (
                                <button
                                    key={c.userId}
                                    onClick={() => setSelectedContributorId(c.userId)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-[11px] font-black uppercase rounded-xl transition-all ${
                                        selectedContributorId === c.userId
                                            ? "bg-black text-white shadow-none"
                                            : "bg-white text-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000]"
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: contributorColors[c.userId] }} />
                                    {c.user.name} ({count})
                                </button>
                            )
                        })}
                    </div>
                )}

                {filteredMemories.length === 0 ? (
                    <div className="border-[3px] border-black bg-white p-12 text-center rounded-2xl shadow-[6px_6px_0_#000]">
                        <ImageIcon className="mx-auto mb-4 h-12 w-12 text-black" />
                        <h3 className="mb-2 text-lg font-black uppercase text-black tracking-wider">Belum ada kenangan</h3>
                        <p className="mb-4 text-xs font-bold text-black/55">Tidak ada memori yang ditemukan untuk kontributor ini.</p>
                        <p className="mx-auto mb-6 font-caveat text-base text-black/40">Chapter ini menanti cerita...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === "grid" && (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-stagger"
                            >
                                {filteredMemories.map(memory => {
                                    const frameColor = contributorColors[memory.user?.id || ""] || "transparent"
                                    return (
                                        <div
                                            key={memory.id}
                                            className="relative transition-all hover:-translate-y-1 rounded-2xl overflow-hidden"
                                            style={{ borderLeft: `4px solid ${frameColor}` }}
                                        >
                                            <MemoryCard memory={memory} isCollaboration={memory.isCollaboration} placements={memory.stickerPlacements || []} />
                                        </div>
                                    )
                                })}
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
                                {chronologicalGroups.map(([month, memories], groupIndex) => {
                                    const activeColor = STAT_COLORS[groupIndex % STAT_COLORS.length]
                                    return (
                                        <div key={month} className="relative border-l-[3px] border-black pl-8 ml-3 sm:ml-4 pb-6 last:pb-0">
                                            {/* Connecting dot */}
                                            <div
                                                className="absolute -left-[9.5px] top-2 h-[16px] w-[16px] rounded-full border-[2.5px] border-black shadow-[1.5px_1.5px_0_#000]"
                                                style={{ backgroundColor: activeColor }}
                                            />
                                            <h3
                                                className="mb-6 w-fit border-[2.5px] border-black px-4.5 py-2 text-xs font-black uppercase text-black rounded-xl shadow-[3px_3px_0_#000]"
                                                style={{ backgroundColor: activeColor }}
                                            >
                                                {month}
                                            </h3>
                                            <div className="space-y-5">
                                                {memories.map(memory => {
                                                    const frameColor = contributorColors[memory.user?.id || ""] || "black"
                                                    return (
                                                        <Link
                                                            key={memory.id}
                                                            href={`/memories/${memory.id}`}
                                                            className="group flex flex-col gap-4 border-[3px] border-black bg-white p-4 rounded-2xl shadow-[5px_5px_0_#000] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] active:translate-y-px active:shadow-none sm:flex-row"
                                                            style={{ borderLeftColor: frameColor, borderLeftWidth: "6px" }}
                                                        >
                                                            {/* Photo container in timeline item */}
                                                            <div className="aspect-video w-full shrink-0 overflow-hidden border-[2.5px] border-black bg-neutral-100 rounded-xl sm:w-44">
                                                                <MemoryCover memory={memory} className="transition-transform duration-500 group-hover:scale-105" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                                    {/* Emotion tag badge */}
                                                                    <span className="border-[2px] border-black bg-[var(--mm-soft-cyan)] px-2 py-0.5 text-[10px] font-black uppercase text-black rounded-lg shadow-[1px_1px_0_#000]">{memory.emotion}</span>
                                                                    {memory.locationName && (
                                                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-black/55">
                                                                            <MapPin className="h-3 w-3" /> {memory.locationName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="line-clamp-1 text-lg font-black uppercase text-black group-hover:text-[var(--mm-accent)] transition-colors">{memory.title}</h4>
                                                                <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-black/60">{memory.story}</p>
                                                                <div className="mt-3 flex items-center justify-between">
                                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-black/45">
                                                                        <Clock className="h-3.5 w-3.5" /> {formatDate(new Date(memory.date))}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <img
                                                                            src={memory.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user?.id}`}
                                                                            className="w-4 h-4 rounded-full border border-black"
                                                                            alt=""
                                                                        />
                                                                        <span className="text-[10px] font-black text-black/60 uppercase">{memory.user?.name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="hidden h-5 w-5 self-center transition-transform group-hover:translate-x-1 sm:block text-black" />
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </motion.div>
                        )}

                        {viewMode === "map" && (
                            <motion.div
                                key="map"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="h-[540px] overflow-hidden border-[3px] border-black rounded-2xl shadow-[6px_6px_0_#000]"
                            >
                                <MapView memories={filteredMemories} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </section>

            {/* ══════════════════════════════════════════════════
                MODAL: Collaborator Settings Panel (Neubrutalism)
                ══════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showSettingsModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettingsModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, y: 15, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 15, opacity: 0 }}
                            className="relative w-full max-w-md bg-white border-[3px] border-black shadow-[6px_6px_0_#000] rounded-2xl overflow-hidden z-10 p-6 space-y-5"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="absolute top-4 right-4 p-1 bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:bg-neutral-100 rounded-lg active:translate-y-px transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div>
                                <h3 className="text-lg font-black uppercase text-black tracking-wide flex items-center gap-2">
                                    <Users className="h-5 w-5 text-black" />
                                    Kolaborator Album
                                </h3>
                                <p className="text-[11px] font-bold text-black/55 mt-1">Mengelola akses dan teman di album bersama ini.</p>
                            </div>

                            {/* Invite Form (Owner/Editor only) */}
                            {(isOwner || album.collaborators?.some(c => c.userId === session?.user?.id && c.role === "EDITOR" && c.status === "ACCEPTED")) && (
                                <form onSubmit={handleInvite} className="p-4 border-[2px] border-black bg-[var(--mm-primary)]/10 rounded-xl space-y-3 shadow-[3px_3px_0_var(--mm-shadow)]">
                                    <h4 className="text-xs font-black uppercase text-black tracking-wider">Undang Kontributor Baru (Maks 5)</h4>
                                    
                                    {acceptedCollaborators.length + 1 >= 5 ? (
                                        <p className="text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-300 p-2 rounded-lg text-center">Batas maksimal kolaborator (5 orang) telah tercapai.</p>
                                    ) : (
                                        <div className="space-y-3.5">
                                            <div className="flex gap-2 relative" ref={autocompleteRef}>
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Username atau Email"
                                                        value={inviteInput}
                                                        onChange={e => handleInviteInputChange(e.target.value)}
                                                        disabled={isInviting}
                                                        className="w-full px-3 py-2 text-xs font-bold border-[2px] border-black bg-white rounded-xl focus:outline-none"
                                                    />
                                                    {/* Autocomplete Dropdown */}
                                                    {userSuggestions.length > 0 && (
                                                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border-[2.5px] border-black rounded-xl shadow-[4px_4px_0_#000] z-[100] max-h-48 overflow-y-auto divide-y-[2px] divide-black custom-scrollbar">
                                                            {userSuggestions.map(user => (
                                                                <button
                                                                    key={user.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setInviteInput(user.username || user.email || user.name)
                                                                        setUserSuggestions([])
                                                                    }}
                                                                    className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-[var(--mm-primary)]/10 transition-colors"
                                                                >
                                                                    <img
                                                                        src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                                                                        className="w-6.5 h-6.5 rounded-full border border-black object-cover"
                                                                        alt=""
                                                                    />
                                                                    <div className="flex-1 min-w-0 flex flex-col">
                                                                        <span className="text-[11px] font-black text-black leading-none truncate">{user.name}</span>
                                                                        <span className="text-[9px] font-bold text-black/50 mt-1 leading-none truncate">
                                                                            {user.username ? `@${user.username}` : user.email}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isInviting || !inviteInput.trim()}
                                                    className="px-3.5 py-2 bg-[var(--mm-warning)] border-[2.5px] border-black text-xs font-black uppercase rounded-xl shadow-[2px_2px_0_#000] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all disabled:opacity-50"
                                                >
                                                    {isInviting ? <Loader2 className="h-4. w-4. animate-spin" /> : <Send className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-black">
                                                <span className="text-[10px] text-black/55 uppercase">Peran:</span>
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value="CONTRIBUTOR"
                                                        checked={inviteRole === "CONTRIBUTOR"}
                                                        onChange={() => setInviteRole("CONTRIBUTOR")}
                                                        className="accent-black"
                                                    />
                                                    Contributor
                                                </label>
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value="EDITOR"
                                                        checked={inviteRole === "EDITOR"}
                                                        onChange={() => setInviteRole("EDITOR")}
                                                        className="accent-black"
                                                    />
                                                    Editor
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Collaborators List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase text-black tracking-wider">Anggota ({acceptedCollaborators.length + 1})</h4>
                                <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                    {/* Owner Row */}
                                    <div className="flex items-center justify-between p-2 border-[2px] border-black bg-white rounded-xl shadow-[2px_2px_0_#000]">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${album.userId}`}
                                                className="w-7 h-7 rounded-full border border-black object-cover"
                                                alt=""
                                            />
                                            <span className="text-xs font-black uppercase text-black">Owner</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase bg-[var(--mm-warning)] px-2 py-0.5 border border-black rounded-md">OWNER</span>
                                    </div>

                                    {/* Collaborators Rows */}
                                    {album.collaborators?.map(c => {
                                        const isTargetSelf = c.userId === session?.user?.id
                                        return (
                                            <div key={c.id} className="flex items-center justify-between p-2 border-[2px] border-black bg-white rounded-xl shadow-[2px_2px_0_#000]">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={c.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`}
                                                        className="w-7 h-7 rounded-full border border-black object-cover"
                                                        alt=""
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase text-black leading-none">{c.user.name}</span>
                                                        <span className="text-[8px] font-bold text-black/50 mt-1 uppercase tracking-wide leading-none">{c.status}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded-md ${c.role === "EDITOR" ? "bg-[var(--mm-primary)]" : "bg-neutral-100"}`}>
                                                        {c.role}
                                                    </span>
                                                    
                                                    {/* Kick/Leave Button */}
                                                    {(isOwner || isTargetSelf) && c.status !== "DECLINED" && (
                                                        <button
                                                            disabled={isRemoving !== null}
                                                            onClick={() => handleRemoveCollaborator(c.userId)}
                                                            className="p-1 border border-black bg-rose-50 rounded-md hover:bg-rose-500 hover:text-white transition-colors active:translate-y-px"
                                                            title={isTargetSelf ? "Keluar dari Album" : "Keluarkan Kolaborator"}
                                                        >
                                                            {isRemoving === c.userId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Live Chat Drawer */}
            <AlbumChatDrawer albumId={id} currentUserId={session?.user?.id} />

            {/* ── MODAL: Confirm Remove Collaborator ── */}
            <AnimatePresence>
                {pendingRemoveCollaborator && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="w-full max-w-md border-[3.5px] border-black bg-[#b3b3b3] shadow-[8px_8px_0_#000] rounded-3xl overflow-hidden"
                        >
                            <div className="border-b-[3.5px] border-black bg-[#c44d58] p-4 text-black">
                                <h3 className="text-sm font-black uppercase tracking-wider">
                                    {pendingRemoveCollaborator.isSelf ? "KELUAR DARI ALBUM?" : "KELUARKAN KOLABORATOR?"}
                                </h3>
                            </div>
                            <div className="space-y-5 p-6 pb-7">
                                <p className="text-sm font-bold leading-relaxed text-neutral-900">
                                    {pendingRemoveCollaborator.isSelf ? (
                                        <>
                                            Apakah Anda yakin ingin keluar dari album kolaborasi ini?
                                        </>
                                    ) : (
                                        <>
                                            Apakah Anda yakin ingin mengeluarkan kolaborator <span className="font-black uppercase text-black">&quot;{pendingRemoveCollaborator.name}&quot;</span> dari album bersama?
                                        </>
                                    )}
                                </p>
                                <div className="border-[3.5px] border-black bg-[#bebdaf] p-4 text-[10.5px] font-black uppercase tracking-wider text-neutral-800 rounded-2xl shadow-[4px_4px_0_#000] leading-relaxed">
                                    {pendingRemoveCollaborator.isSelf ? (
                                        "ANDA PERLU DIUNDANG KEMBALI JIKA INGIN BERGABUNG LAGI KE ALBUM BERSAMA INI."
                                    ) : (
                                        "KOLABORATOR YANG DIKELUARKAN TIDAK AKAN BISA MENAMBAHKAN MEMORY BARU KE ALBUM INI."
                                    )}
                                </div>
                                <div className="border-t-[3.5px] border-black my-5 w-full opacity-100" />
                                <div className="flex justify-end gap-3.5 pt-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPendingRemoveCollaborator(null)}
                                        disabled={isRemoving !== null}
                                        className="border-[3.5px] border-black bg-[#9c9c9c] rounded-[18px] px-6 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-60"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmRemoveCollaborator}
                                        disabled={isRemoving !== null}
                                        className="border-[3.5px] border-black bg-[#c44d58] rounded-[18px] px-6 py-2.5 text-xs font-black uppercase text-black shadow-[4px_4px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-60"
                                    >
                                        {isRemoving !== null ? (
                                            pendingRemoveCollaborator.isSelf ? "Meninggalkan..." : "Mengeluarkan..."
                                        ) : (
                                            pendingRemoveCollaborator.isSelf ? "Keluar" : "Keluarkan"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MOBILE FLOATING BADGE & BOTTOM SHEET: Sticky Notes Wall ── */}
            <div className="fixed bottom-5 left-5 z-40 lg:hidden">
                <motion.button
                    whileHover={{ scale: 1.08, rotate: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMobileNotesSheet(true)}
                    className="relative flex h-[52px] w-[52px] rotate-[-6deg] items-center justify-center border-[2.5px] border-black bg-[#FEF08A] shadow-[3px_3px_0_#000] rounded-2xl transition-all"
                    title="Buka Catatan Tempel"
                >
                    <span className="text-xl">📌</span>
                    {/* Pulsing decoration dot */}
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center border-[1.5px] border-black bg-rose-500 text-[8px] font-black text-white rounded-full">
                        ✨
                    </span>
                </motion.button>
            </div>

            <AnimatePresence>
                {showMobileNotesSheet && (
                    <div className="fixed inset-0 z-[10000] flex items-end justify-center lg:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileNotesSheet(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        
                        {/* Slide-up Container */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full max-h-[85vh] bg-white border-t-[3.5px] border-black rounded-t-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)] z-10 flex flex-col overflow-hidden"
                        >
                            {/* Handle / Drag Indicator */}
                            <div className="py-3 flex justify-center bg-[#FAFAF8] border-b border-black/5">
                                <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
                            </div>

                            {/* Sticky Notes Wall content */}
                            <div className="flex-1 overflow-y-auto p-4 pt-1">
                                <StickyNotesWall
                                    albumId={id}
                                    albumOwnerId={album.userId}
                                    currentUserId={session?.user?.id}
                                />
                            </div>

                            {/* Bottom close bar */}
                            <div className="p-4 border-t-[2.5px] border-black bg-white">
                                <button
                                    onClick={() => setShowMobileNotesSheet(false)}
                                    className="w-full py-2.5 bg-neutral-200 border-[2.5px] border-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                >
                                    Tutup Catatan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Particles */}
            <AnimatePresence>
                {memoryParticles.map(p => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 1, scale: 0.8, x: p.x, y: p.y }}
                        animate={{ opacity: 0, scale: 1.4, y: p.y - 120, x: p.x + (Math.random() * 40 - 20) }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="fixed pointer-events-none z-[9999] text-xl"
                    >
                        {p.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
