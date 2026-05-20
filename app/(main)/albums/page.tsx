"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    Camera,
    Check,
    Coffee,
    FolderHeart,
    Grid3X3,
    GraduationCap,
    Heart,
    Image as ImageIcon,
    ImagePlus,
    Inbox,
    Layers3,
    Loader2,
    Map,
    Mountain,
    MoreVertical,
    Music2,
    Palmtree,
    Pencil,
    Plane,
    Plus,
    Search,
    Sparkles,
    Star,
    Trash2,
    Waves,
    X,
} from "lucide-react"
import toast from "react-hot-toast"
import { formatDate } from "@/lib/utils"

const SYSTEM_ALBUM_NAME = "Belum Dikelompokkan"
const ICON_OPTIONS: Array<{ id: string; label: string; Icon: LucideIcon }> = [
    { id: "waves", label: "Laut", Icon: Waves },
    { id: "heart", label: "Cinta", Icon: Heart },
    { id: "plane", label: "Liburan", Icon: Plane },
    { id: "coffee", label: "Nongkrong", Icon: Coffee },
    { id: "graduation", label: "Kuliah", Icon: GraduationCap },
    { id: "mountain", label: "Pendakian", Icon: Mountain },
    { id: "camera", label: "Foto", Icon: Camera },
    { id: "star", label: "Favorit", Icon: Star },
    { id: "palm", label: "Tropis", Icon: Palmtree },
    { id: "music", label: "Musik", Icon: Music2 },
]
const PRESET_ICONS = ICON_OPTIONS.map(option => option.id)

interface Album {
    id: string
    name: string
    description: string | null
    coverImage: string | null
    icon: string | null
    createdAt: string
    updatedAt: string
    isSystemAlbum?: boolean
    _count: { memories: number }
}

type ViewMode = "grid" | "timeline" | "map"

interface MemoryOption {
    id: string
    title: string
    date: string
    photos?: Array<{ url?: string }>
}

interface MemoriesResponse {
    data?: MemoryOption[]
    pagination?: { total?: number }
}

interface AlbumDetailResponse {
    memories?: Array<{ id: string }>
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

function albumAccent(index: number) {
    return ["#00FFFF", "#FFFF00", "#FF00FF", "#00FF00"][index % 4]
}

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

function AlbumGlyph({ icon, className = "h-7 w-7" }: { icon?: string | null; className?: string }) {
    const normalized = normalizeIconId(icon)
    const Icon = normalized === "book"
        ? BookOpen
        : normalized === "inbox"
            ? Inbox
            : ICON_OPTIONS.find(option => option.id === normalized)?.Icon || BookOpen
    return <Icon className={className} strokeWidth={2.8} />
}

function AlbumCover({
    album,
    accent,
    compact = false,
}: {
    album: Album
    accent: string
    compact?: boolean
}) {
    return (
        <div className={`relative overflow-hidden border-[3px] border-black bg-[#E5E5E5] ${compact ? "h-24 w-32" : "h-44 w-full"}`}>
            {album.coverImage ? (
                <img src={album.coverImage} alt={album.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(0,255,255,.55), rgba(255,255,0,.45) 48%, rgba(255,0,255,.48))",
                    }}
                >
                    <AlbumGlyph icon={album.icon} className="h-16 w-16 text-black" />
                </div>
            )}
            {!compact && (
                <>
                    <div className="absolute left-3 top-3 rotate-[-10deg] border-[2px] border-black bg-[#FFFF00] px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0_#000]">
                        {album._count.memories} memory
                    </div>
                    <div
                        className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center border-[3px] border-black bg-white text-black shadow-[3px_3px_0_#000]"
                        style={{ boxShadow: `3px 3px 0 ${accent}, 5px 5px 0 #000` }}
                    >
                        <AlbumGlyph icon={album.icon} className="h-6 w-6" />
                    </div>
                </>
            )}
        </div>
    )
}

export default function AlbumsPage() {
    const { data: session } = useSession()
    const [albums, setAlbums] = useState<Album[]>([])
    const [totalMemoriesCount, setTotalMemoriesCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState("semua")
    const [search, setSearch] = useState("")
    const [searchOpen, setSearchOpen] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
    const [pendingDeleteAlbum, setPendingDeleteAlbum] = useState<Album | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
    const [changingCoverAlbum, setChangingCoverAlbum] = useState<Album | null>(null)
    const [organizingAlbum, setOrganizingAlbum] = useState<Album | null>(null)

    const [albumName, setAlbumName] = useState("")
    const [albumDesc, setAlbumDesc] = useState("")
    const [albumIcon, setAlbumIcon] = useState(PRESET_ICONS[0])
    const [albumCover, setAlbumCover] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const [allMemories, setAllMemories] = useState<MemoryOption[]>([])
    const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([])
    const [memoriesLoading, setMemoriesLoading] = useState(false)

    const menuRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const searchRef = useRef<HTMLFormElement>(null)

    const systemAlbum = albums.find(a => a.isSystemAlbum || a.name === SYSTEM_ALBUM_NAME)
    const customAlbums = albums.filter(a => !a.isSystemAlbum && a.name !== SYSTEM_ALBUM_NAME)
    const showSystemAlbum = !!systemAlbum && systemAlbum._count.memories > 0

    const groupedAlbums = useMemo(() => {
        const groups: Record<string, Album[]> = {}
        for (const album of customAlbums) {
            const key = new Date(album.createdAt).toLocaleString("id-ID", { month: "long", year: "numeric" })
            groups[key] = groups[key] || []
            groups[key].push(album)
        }
        return Object.entries(groups)
    }, [customAlbums])

    const searchSuggestions = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return []
        return albums
            .filter(album =>
                album.name.toLowerCase().includes(query) ||
                (album.description || "").toLowerCase().includes(query)
            )
            .slice(0, 6)
    }, [albums, search])

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setActiveMenuId(null)
            }
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false)
            }
        }
        document.addEventListener("mousedown", handleOutsideClick)
        return () => document.removeEventListener("mousedown", handleOutsideClick)
    }, [])

    const fetchAlbums = async (queryOverride = search) => {
        setLoading(true)
        try {
            const apiSort = sort === "paling_banyak" ? "banyak" : sort
            const res = await fetch(`/api/albums?sort=${apiSort}&search=${encodeURIComponent(queryOverride)}`)
            if (!res.ok) throw new Error("Gagal mengambil data album")
            const data: Album[] = await res.json()
            setAlbums(data)

            const memoryRes = await fetch("/api/memories?mine=true")
            if (memoryRes.ok) {
                const memoryData = await memoryRes.json() as MemoriesResponse | MemoryOption[]
                const count = Array.isArray(memoryData)
                    ? memoryData.length
                    : (memoryData.pagination?.total ?? memoryData.data?.length ?? 0)
                setTotalMemoriesCount(count)
            }
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Terjadi kesalahan"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user?.id) fetchAlbums()
    }, [session?.user?.id, sort])

    const resetForm = () => {
        setAlbumName("")
        setAlbumDesc("")
        setAlbumIcon(PRESET_ICONS[0])
        setAlbumCover(null)
    }

    const openEditModal = (album: Album) => {
        setEditingAlbum(album)
        setAlbumName(album.name)
        setAlbumDesc(album.description || "")
        setAlbumCover(album.coverImage)
        setAlbumIcon(normalizeIconId(album.icon))
        setActiveMenuId(null)
    }

    const handleSaveAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!albumName.trim()) {
            toast.error("Nama album wajib diisi")
            return
        }

        setIsSaving(true)
        try {
            const payload = {
                name: albumName.trim(),
                description: albumDesc.trim() || null,
                icon: albumIcon,
                coverImage: albumCover,
            }
            const url = editingAlbum ? `/api/albums/${editingAlbum.id}` : "/api/albums"
            const res = await fetch(url, {
                method: editingAlbum ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Gagal menyimpan album")
            }
            toast.success(editingAlbum ? "Album berhasil diperbarui" : "Album berhasil dibuat")
            setShowCreateModal(false)
            setEditingAlbum(null)
            resetForm()
            fetchAlbums()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal menyimpan album"))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAlbum = async (album: Album) => {
        if (album.isSystemAlbum || album.name === SYSTEM_ALBUM_NAME) {
            toast.error("Album sistem tidak dapat dihapus")
            return
        }
        setPendingDeleteAlbum(album)
        setActiveMenuId(null)
    }

    const confirmDeleteAlbum = async () => {
        if (!pendingDeleteAlbum) return
        setIsSaving(true)
        try {
            const res = await fetch(`/api/albums/${pendingDeleteAlbum.id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Gagal menghapus album")
            toast.success("Album berhasil dihapus")
            setPendingDeleteAlbum(null)
            fetchAlbums()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal menghapus album"))
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const formData = new FormData()
        formData.append("file", e.target.files[0])
        formData.append("isPublic", "true")

        setIsUploading(true)
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error("Upload cover gagal")
            const data = await res.json() as { url?: string }
            if (!data.url) throw new Error("Upload tidak mengembalikan URL cover")
            setAlbumCover(data.url)
            toast.success("Cover berhasil diupload")
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal mengupload cover"))
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleSaveCoverUpdate = async () => {
        if (!changingCoverAlbum) return
        setIsSaving(true)
        try {
            const res = await fetch(`/api/albums/${changingCoverAlbum.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ coverImage: albumCover }),
            })
            if (!res.ok) throw new Error("Gagal memperbarui cover")
            toast.success("Cover album berhasil diperbarui")
            setChangingCoverAlbum(null)
            resetForm()
            fetchAlbums()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal memperbarui cover"))
        } finally {
            setIsSaving(false)
        }
    }

    const openOrganizeModal = async (album: Album) => {
        setOrganizingAlbum(album)
        setMemoriesLoading(true)
        setActiveMenuId(null)
        try {
            const [memoriesRes, albumRes] = await Promise.all([
                fetch("/api/memories?mine=true"),
                fetch(`/api/albums/${album.id}`),
            ])
            if (!memoriesRes.ok || !albumRes.ok) throw new Error("Gagal memuat data kenangan")

            const memoryData = await memoriesRes.json() as MemoriesResponse | MemoryOption[]
            const memories = Array.isArray(memoryData) ? memoryData : (memoryData.data || [])
            const albumData = await albumRes.json() as AlbumDetailResponse
            setAllMemories(memories)
            setSelectedMemoryIds((albumData.memories || []).map(m => m.id))
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal memuat kenangan"))
            setOrganizingAlbum(null)
        } finally {
            setMemoriesLoading(false)
        }
    }

    const handleSaveOrganize = async () => {
        if (!organizingAlbum) return
        setIsSaving(true)
        try {
            const albumRes = await fetch(`/api/albums/${organizingAlbum.id}`)
            if (!albumRes.ok) throw new Error("Gagal menyimpan relasi album")
            const albumData = await albumRes.json() as AlbumDetailResponse
            const initialIds = (albumData.memories || []).map(m => m.id)
            const added = selectedMemoryIds.filter(id => !initialIds.includes(id))
            const removed = initialIds.filter((id: string) => !selectedMemoryIds.includes(id))

            for (const memoryId of added) {
                const currentRes = await fetch(`/api/memories/${memoryId}/albums`)
                const currentIds = currentRes.ok ? await currentRes.json() as string[] : []
                await fetch(`/api/memories/${memoryId}/albums`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ albumIds: [...new Set([...currentIds, organizingAlbum.id])] }),
                })
            }

            for (const memoryId of removed) {
                const currentRes = await fetch(`/api/memories/${memoryId}/albums`)
                const currentIds = currentRes.ok ? await currentRes.json() as string[] : []
                await fetch(`/api/memories/${memoryId}/albums`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ albumIds: currentIds.filter((id: string) => id !== organizingAlbum.id) }),
                })
            }

            toast.success("Pengelompokan kenangan berhasil disimpan")
            setOrganizingAlbum(null)
            fetchAlbums()
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal mengatur kenangan"))
        } finally {
            setIsSaving(false)
        }
    }

    const renderAlbumMenu = (album: Album) => {
        const isOpen = activeMenuId === album.id
        const isSystem = album.isSystemAlbum || album.name === SYSTEM_ALBUM_NAME
        return (
            <div className="absolute right-3 top-3 z-20" ref={isOpen ? menuRef : null}>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuId(isOpen ? null : album.id)
                    }}
                    className="flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white text-black shadow-[3px_3px_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFFF00]"
                    aria-label="Album menu"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.96 }}
                            className="absolute right-0 mt-2 w-52 border-[3px] border-black bg-white py-1 text-left shadow-[5px_5px_0_#000]"
                        >
                            {!isSystem && (
                                <button onClick={() => openEditModal(album)} className="flex w-full items-center gap-2 border-b-2 border-dashed border-black px-4 py-2 text-xs font-black uppercase text-black hover:bg-[#00FFFF]">
                                    <Pencil className="h-4 w-4" /> Edit Album
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setChangingCoverAlbum(album)
                                    setAlbumCover(album.coverImage)
                                    setActiveMenuId(null)
                                }}
                                className="flex w-full items-center gap-2 border-b-2 border-dashed border-black px-4 py-2 text-xs font-black uppercase text-black hover:bg-[#FFFF00]"
                            >
                                <ImagePlus className="h-4 w-4" /> Ganti Cover
                            </button>
                            {!isSystem && (
                                <button onClick={() => openOrganizeModal(album)} className="flex w-full items-center gap-2 border-b-2 border-dashed border-black px-4 py-2 text-xs font-black uppercase text-black hover:bg-[#00FF00]">
                                    <Layers3 className="h-4 w-4" /> Kelola Memory
                                </button>
                            )}
                            {!isSystem && (
                                <button onClick={() => handleDeleteAlbum(album)} className="flex w-full items-center gap-2 px-4 py-2 text-xs font-black uppercase text-red-600 hover:bg-red-500 hover:text-white">
                                    <Trash2 className="h-4 w-4" /> Hapus Album
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    const renderAlbumCard = (album: Album, index: number, compact = false) => {
        const accent = albumAccent(index)
        return (
            <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group relative bg-[#FFFDF0] transition-all hover:-translate-x-1 hover:-translate-y-1 ${compact ? "flex gap-4 border-[3px] border-black p-3 shadow-[5px_5px_0_#000]" : "border-[4px] border-black shadow-[7px_7px_0_#000] hover:shadow-[10px_10px_0_#000]"}`}
                style={{ boxShadow: compact ? `5px 5px 0 ${accent}, 7px 7px 0 #000` : undefined }}
            >
                {renderAlbumMenu(album)}
                <Link href={`/albums/${album.id}`} className={compact ? "flex flex-1 gap-4" : "block"}>
                    <AlbumCover album={album} accent={accent} compact={compact} />
                    <div className={compact ? "flex min-w-0 flex-1 flex-col justify-center" : "p-4"}>
                        <div className="mb-2 flex items-start justify-between gap-3">
                            <h3 className="line-clamp-1 text-base font-black uppercase text-black transition-colors group-hover:text-[#FF00FF]">
                                {album.name}
                            </h3>
                            <Star className={`mt-0.5 h-5 w-5 shrink-0 ${index % 3 === 0 ? "fill-[#FFFF00]" : ""}`} />
                        </div>
                        <p className="mb-3 line-clamp-2 text-xs font-bold leading-relaxed text-black/60">
                            {album.description || "Koleksi kenangan yang siap kamu buka lagi kapan saja."}
                        </p>
                        <div className="flex items-center justify-between border-t-2 border-dashed border-black pt-3 text-[10px] font-black uppercase text-black/55">
                            <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Update {formatDate(new Date(album.updatedAt))}
                            </span>
                            <span className="flex items-center gap-1 text-black">
                                Buka <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                        </div>
                    </div>
                </Link>
            </motion.div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 pb-32 sm:px-6 lg:px-8">
            <section className="relative z-50 border-[4px] border-black bg-[#00DDEB] p-6 shadow-[9px_9px_0_#000] sm:p-8">
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.14]" style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }} />
                <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_420px]">
                    <div>
                        <h1 className="mb-4 text-4xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl">
                            Album Kenangan
                        </h1>
                        <p className="max-w-md text-sm font-black leading-7 text-black">
                            Kumpulkan cerita hidupmu dalam tema yang kamu buat sendiri.
                        </p>
                        <div className="mt-7 flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-stretch">
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowCreateModal(true)
                                }}
                                className="flex shrink-0 items-center justify-center gap-2 border-[3px] border-black bg-[#FFFF00] px-5 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000]"
                            >
                                <Plus className="h-4 w-4" /> Buat Album
                            </button>
                            <form
                                ref={searchRef}
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    setSearchOpen(false)
                                    fetchAlbums()
                                }}
                                className="relative z-[70] flex min-w-[240px] max-w-md flex-1 items-center border-[3px] border-black bg-white shadow-[4px_4px_0_#000]"
                            >
                                <Search className="ml-3 h-4 w-4 text-black" />
                                <input
                                    value={search}
                                    onChange={e => {
                                        setSearch(e.target.value)
                                        setSearchOpen(true)
                                    }}
                                    onFocus={() => setSearchOpen(true)}
                                    placeholder="Cari album"
                                    className="w-full bg-transparent px-3 py-3 pr-10 text-xs font-bold text-black outline-none placeholder:text-black/40"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("")
                                            setSearchOpen(false)
                                            fetchAlbums("")
                                        }}
                                        className="mr-2 flex h-7 w-7 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-[#FFFF00]"
                                        aria-label="Bersihkan pencarian"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                {searchOpen && search.trim() && (
                                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] border-[3px] border-black bg-white shadow-[5px_5px_0_#000]">
                                        {searchSuggestions.length > 0 ? (
                                            searchSuggestions.map(album => (
                                                <button
                                                    key={album.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearch(album.name)
                                                        setSearchOpen(false)
                                                        fetchAlbums(album.name)
                                                    }}
                                                    className="flex w-full items-center gap-3 border-b-2 border-dashed border-black px-3 py-2 text-left last:border-b-0 hover:bg-[#FFFF00]"
                                                >
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#00FFFF] text-black">
                                                        <AlbumGlyph icon={album.icon} className="h-4 w-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-xs font-black uppercase text-black">{album.name}</span>
                                                        <span className="block text-[10px] font-bold uppercase text-black/50">{album._count.memories} memory</span>
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-3 text-xs font-black uppercase text-black/50">
                                                Tidak ada album yang cocok
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="hidden lg:grid lg:grid-cols-[140px_1fr] lg:items-center lg:gap-6">
                        <div className="grid gap-3">
                            <div className="border-[4px] border-black bg-white px-5 py-4 text-center shadow-[5px_5px_0_#000]">
                                <strong className="block text-2xl font-black text-black">{albums.length}</strong>
                                <span className="text-[10px] font-black uppercase text-black">Album</span>
                            </div>
                            <div className="border-[4px] border-black bg-white px-5 py-4 text-center shadow-[5px_5px_0_#000]">
                                <strong className="block text-2xl font-black text-[#FF00FF]">{totalMemoriesCount}</strong>
                                <span className="text-[10px] font-black uppercase text-black">Memory</span>
                            </div>
                        </div>
                        <div className="relative min-h-[220px]">
                            <div className="absolute inset-x-0 top-4 rotate-[5deg] border-[4px] border-black bg-[#C9C7BE] p-5 shadow-[8px_8px_0_#FF00FF]">
                                <div className="grid grid-cols-2 gap-4">
                                    {(customAlbums.slice(0, 2).length ? customAlbums.slice(0, 2) : albums.slice(0, 2)).map((album, index) => (
                                        <div key={album.id} className="relative h-28 rotate-[-3deg] border-[3px] border-black bg-white p-2 shadow-[3px_3px_0_#000]">
                                            {album.coverImage ? (
                                                <img src={album.coverImage} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-[#FFFF00] text-black">
                                                    <AlbumGlyph icon={album.icon} className="h-10 w-10" />
                                                </div>
                                            )}
                                            <span className="absolute -bottom-2 left-2 border-2 border-black bg-white px-2 text-[9px] font-black uppercase">{index === 0 ? "cover" : "trip"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 border-[3px] border-black bg-[#FFFF00] p-3 shadow-[4px_4px_0_#000]">
                                <Sparkles className="h-8 w-8 text-black" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-4 border-b-[3px] border-black pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                        ["semua", "Semua"],
                        ["terbaru", "Terbaru"],
                        ["az", "A-Z"],
                        ["paling_banyak", "Paling Banyak"],
                        ["favorit", "Favorit"],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setSort(key)}
                            className={`shrink-0 border-[3px] border-black px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#000] transition-all ${sort === key ? "bg-[#FFFF00] text-black" : "bg-white text-black hover:bg-[#FFFDF0]"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex border-[3px] border-black bg-white shadow-[3px_3px_0_#000]">
                        {[
                            ["grid", Grid3X3],
                            ["timeline", CalendarDays],
                            ["map", Map],
                        ].map(([mode, Icon]) => {
                            const LucideIcon = Icon as typeof Grid3X3
                            return (
                                <button
                                    key={mode as string}
                                    onClick={() => setViewMode(mode as ViewMode)}
                                    className={`flex items-center gap-2 border-r-[2px] border-black px-4 py-2 text-xs font-black uppercase last:border-r-0 ${viewMode === mode ? "bg-[#00DDEB]" : "bg-white hover:bg-[#FFFF00]"}`}
                                >
                                    <LucideIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{mode as string}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-[#FF00FF]" />
                    <p className="text-sm font-black uppercase tracking-widest text-black">Memuat album...</p>
                </div>
            ) : customAlbums.length === 0 && !showSystemAlbum ? (
                <div className="border-[4px] border-black bg-white p-12 text-center shadow-[8px_8px_0_#000]">
                    <FolderHeart className="mx-auto mb-5 h-14 w-14 text-black" />
                    <h2 className="mb-2 text-2xl font-black uppercase text-black">Album Pertamamu</h2>
                    <p className="mx-auto mb-7 max-w-md text-sm font-bold text-black/60">
                        Buat album untuk mengelompokkan momen pantai, perjalanan, kuliah, konser, atau cerita lain yang ingin kamu simpan rapi.
                    </p>
                    <button onClick={() => setShowCreateModal(true)} className="border-[3px] border-black bg-[#00FF00] px-6 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_#000]">
                        Buat Album Pertama
                    </button>
                </div>
            ) : (
                <div className="space-y-7">
                    {showSystemAlbum && systemAlbum && (
                        <div className="relative border-[4px] border-black bg-[#111] p-5 text-white shadow-[8px_8px_0_#000]">
                            {renderAlbumMenu(systemAlbum)}
                            <Link href={`/albums/${systemAlbum.id}`} className="grid gap-5 sm:grid-cols-[160px_1fr_auto] sm:items-center">
                                <AlbumCover album={systemAlbum} accent="#00FF00" compact />
                                <div>
                                    <span className="mb-2 inline-block border-[2px] border-black bg-[#00FF00] px-2 py-1 text-[9px] font-black uppercase text-black shadow-[2px_2px_0_#000]">
                                        Sistem
                                    </span>
                                    <h2 className="text-2xl font-black uppercase text-[#00FF00]">{systemAlbum.name}</h2>
                                    <p className="mt-2 max-w-xl text-xs font-bold leading-relaxed text-white/60">
                                        Memory yang belum dimasukkan ke album custom akan masuk ke sini otomatis.
                                    </p>
                                </div>
                                <div className="border-[3px] border-black bg-white px-5 py-3 text-center text-black shadow-[4px_4px_0_#00FF00]">
                                    <strong className="block text-2xl font-black">{systemAlbum._count.memories}</strong>
                                    <span className="text-[10px] font-black uppercase">belum rapi</span>
                                </div>
                            </Link>
                        </div>
                    )}

                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {customAlbums.map((album, index) => renderAlbumCard(album, index))}
                        </div>
                    )}

                    {viewMode === "timeline" && (
                        <div className="mx-auto max-w-4xl space-y-8">
                            {groupedAlbums.map(([month, group]) => (
                                <div key={month} className="relative border-l-[4px] border-black pl-6">
                                    <div className="absolute -left-[11px] top-1 h-5 w-5 border-[3px] border-black bg-[#FF00FF]" />
                                    <h3 className="mb-4 w-fit border-[3px] border-black bg-[#FFFF00] px-4 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">
                                        {month}
                                    </h3>
                                    <div className="space-y-4">
                                        {group.map((album, index) => renderAlbumCard(album, index, true))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === "map" && (
                        <div className="relative min-h-[560px] overflow-hidden border-[4px] border-black bg-[#DFF7E8] p-6 shadow-[8px_8px_0_#000]">
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
                            <div className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {customAlbums.map((album, index) => (
                                    <div key={album.id} className={index % 2 ? "md:translate-y-10" : ""}>
                                        {renderAlbumCard(album, index, true)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!showSystemAlbum && customAlbums.length > 0 && (
                        <div className="flex items-center gap-2 border-[2px] border-dashed border-[#00AA00] bg-[#00FF00]/10 px-4 py-3 text-xs font-black uppercase text-black">
                            <Check className="h-4 w-4" />
                            Semua kenangan sudah dikelompokkan ke album custom.
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {pendingDeleteAlbum && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="w-full max-w-md border-[4px] border-black bg-[#FFFDF0] shadow-[10px_10px_0_#000]"
                        >
                            <div className="border-b-[4px] border-black bg-[#FF00FF] p-4 text-white">
                                <h3 className="text-base font-black uppercase">Hapus Album Kenangan?</h3>
                            </div>
                            <div className="space-y-4 p-5">
                                <p className="text-sm font-bold leading-relaxed text-black">
                                    Album <span className="font-black uppercase">&quot;{pendingDeleteAlbum.name}&quot;</span> akan dihapus dari daftar album.
                                    Kenangan di dalamnya tidak ikut terhapus.
                                </p>
                                <div className="border-[3px] border-black bg-white p-3 text-xs font-black uppercase text-black/60">
                                    Memory yang tidak punya album custom lain akan kembali ke album sistem Belum Dikelompokkan.
                                </div>
                                <div className="flex justify-end gap-3 border-t-[3px] border-black pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setPendingDeleteAlbum(null)}
                                        disabled={isSaving}
                                        className="border-[3px] border-black bg-white px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:bg-[#E5E5E5] disabled:opacity-60"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDeleteAlbum}
                                        disabled={isSaving}
                                        className="border-[3px] border-black bg-red-500 px-5 py-2 text-xs font-black uppercase text-white shadow-[3px_3px_0_#000] hover:bg-black disabled:opacity-60"
                                    >
                                        {isSaving ? "Menghapus..." : "Hapus Album"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(showCreateModal || editingAlbum) && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="w-full max-w-4xl border-[4px] border-black bg-[#FFFDF0] shadow-[10px_10px_0_#000]"
                        >
                            <div className="flex items-center justify-between border-b-[4px] border-black bg-white p-4">
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase text-black">
                                    <FolderHeart className="h-5 w-5" /> {editingAlbum ? "Edit Album" : "Buat Album Baru"}
                                </h3>
                                <button onClick={() => { setShowCreateModal(false); setEditingAlbum(null); resetForm() }} className="border-[2px] border-black bg-white p-1 shadow-[2px_2px_0_#000] hover:bg-[#FFFF00]">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveAlbum} className="grid gap-6 p-6 lg:grid-cols-[1.1fr_280px_1fr]">
                                <div className="space-y-4">
                                    <label className="block text-xs font-black uppercase text-black">
                                        Nama Album
                                        <input value={albumName} onChange={e => setAlbumName(e.target.value)} className="mt-2 w-full border-[3px] border-black bg-white p-3 text-sm font-bold outline-none focus:bg-[#FFFF00]" placeholder="Liburan Pantai 2026" />
                                    </label>
                                    <label className="block text-xs font-black uppercase text-black">
                                        Deskripsi
                                        <textarea value={albumDesc} onChange={e => setAlbumDesc(e.target.value)} maxLength={120} className="mt-2 min-h-28 w-full resize-none border-[3px] border-black bg-white p-3 text-sm font-bold outline-none focus:bg-[#FFFF00]" placeholder="Album untuk menyimpan momen selama perjalanan..." />
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-black uppercase text-black">Cover Album</p>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center gap-2 border-[3px] border-dashed border-black bg-white text-xs font-black uppercase text-black hover:bg-[#E5E5E5]">
                                        {albumCover ? <img src={albumCover} alt="" className="h-full w-full object-cover" /> : isUploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <><ImageIcon className="h-7 w-7" /> Upload Cover</>}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    {albumCover && <button type="button" onClick={() => setAlbumCover(null)} className="text-xs font-black uppercase text-red-600">Hapus Cover</button>}
                                </div>

                                <div className="flex flex-col justify-between gap-5">
                                    <div>
                                        <p className="mb-3 text-xs font-black uppercase text-black">Icon / Tema</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {ICON_OPTIONS.map(({ id, label }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    aria-label={label}
                                                    title={label}
                                                    onClick={() => setAlbumIcon(id)}
                                                    className={`flex h-11 items-center justify-center border-[2px] border-black bg-white text-black ${albumIcon === id ? "shadow-[3px_3px_0_#000] ring-2 ring-[#00FF00]" : "hover:bg-[#FFFF00]"}`}
                                                >
                                                    <AlbumGlyph icon={id} className="h-5 w-5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 border-t-[3px] border-black pt-4">
                                        <button type="button" onClick={() => { setShowCreateModal(false); setEditingAlbum(null); resetForm() }} className="border-[3px] border-black bg-white px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">Batal</button>
                                        <button type="submit" disabled={isSaving} className="border-[3px] border-black bg-[#00FF00] px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] disabled:opacity-60">
                                            {isSaving ? "Menyimpan..." : editingAlbum ? "Simpan" : "Buat Album"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {changingCoverAlbum && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md border-[4px] border-black bg-[#FFFDF0] shadow-[8px_8px_0_#000]">
                            <div className="flex items-center justify-between border-b-[4px] border-black bg-[#FFFF00] p-4">
                                <h3 className="text-sm font-black uppercase text-black">Ganti Cover</h3>
                                <button onClick={() => { setChangingCoverAlbum(null); resetForm() }} className="border-2 border-black bg-white p-1"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="space-y-4 p-5">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-52 w-full items-center justify-center border-[3px] border-dashed border-black bg-white text-xs font-black uppercase text-black">
                                    {albumCover ? <img src={albumCover} alt="" className="h-full w-full object-cover" /> : isUploading ? "Uploading..." : "Pilih File Cover"}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setChangingCoverAlbum(null); resetForm() }} className="border-[3px] border-black bg-white px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">Batal</button>
                                    <button onClick={handleSaveCoverUpdate} disabled={isSaving} className="border-[3px] border-black bg-[#00FF00] px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">Simpan</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {organizingAlbum && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex max-h-[86vh] w-full max-w-3xl flex-col border-[4px] border-black bg-[#FFFDF0] shadow-[8px_8px_0_#000]">
                            <div className="flex items-center justify-between border-b-[4px] border-black bg-[#00FF00] p-4">
                                <h3 className="text-sm font-black uppercase text-black">Kelola Memory di &quot;{organizingAlbum.name}&quot;</h3>
                                <button onClick={() => setOrganizingAlbum(null)} className="border-2 border-black bg-white p-1"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                {memoriesLoading ? (
                                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {allMemories.map(memory => {
                                            const selected = selectedMemoryIds.includes(memory.id)
                                            const photo = memory.photos?.[0]?.url
                                            return (
                                                <button key={memory.id} type="button" onClick={() => setSelectedMemoryIds(prev => selected ? prev.filter(id => id !== memory.id) : [...prev, memory.id])} className={`flex items-center gap-3 border-[2px] border-black p-2 text-left shadow-[2px_2px_0_#000] ${selected ? "bg-[#00FF00]/25" : "bg-white"}`}>
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border-2 border-black bg-[#E5E5E5]">
                                                        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-black uppercase text-black">{memory.title}</p>
                                                        <p className="text-[10px] font-bold uppercase text-black/50">{formatDate(new Date(memory.date))}</p>
                                                    </div>
                                                    <div className={`flex h-6 w-6 items-center justify-center border-2 border-black ${selected ? "bg-black text-[#00FF00]" : "bg-white"}`}>{selected && <Check className="h-4 w-4" />}</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 border-t-[4px] border-black bg-white p-4">
                                <button onClick={() => setOrganizingAlbum(null)} className="border-[3px] border-black bg-white px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">Batal</button>
                                <button onClick={handleSaveOrganize} disabled={isSaving} className="border-[3px] border-black bg-[#00FF00] px-5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">Simpan Pengelompokan</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
