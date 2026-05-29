"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AnimatePresence, motion, useAnimation } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    Camera,
    Check,
    Clock,
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
    RotateCcw,
    Search,
    Sparkles,
    Star,
    Trash2,
    Waves,
    X,
} from "lucide-react"
import toast from "react-hot-toast"
import { formatDate } from "@/lib/utils"
import { MemoryCover } from "@/components/memories/MemoryCover"

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

// ── Decorative emoji stickers for scrapbook accents ──────
const DECO_STICKERS: string[] = []

// ── Scrapbook rotation classes ──────────────────────────
const ROTATIONS = ["scrap-rotate-1", "scrap-rotate-2", "scrap-rotate-3", "scrap-rotate-4", "scrap-rotate-5", "scrap-rotate-6"]

// ── Accent colors (warm pastel palette) ─────────────────
const CARD_ACCENTS = ["var(--mm-soft-cyan)", "var(--mm-warning)", "var(--mm-tertiary)", "var(--mm-success)", "var(--mm-accent)", "var(--mm-primary)"]

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
    emotion?: string
    coverImage?: string | null
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

function cardAccent(index: number) {
    return CARD_ACCENTS[index % CARD_ACCENTS.length]
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

/* ═══════════════════════════════════════════════════════════
   ALBUM COVER — Polaroid style
   ═══════════════════════════════════════════════════════════ */
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
        <div className={`relative overflow-hidden border-[2.5px] border-black ${compact ? "h-24 w-24 shrink-0 rounded-xl" : "aspect-square w-full rounded-2xl"}`}>
            {album.coverImage ? (
                <img src={album.coverImage} alt={album.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            ) : (
                <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 50%, transparent), color-mix(in srgb, var(--mm-warning) 40%, transparent) 48%, color-mix(in srgb, var(--mm-tertiary) 33%, transparent))`,
                    }}
                >
                    <AlbumGlyph icon={album.icon} className="h-14 w-14 text-black/70" />
                </div>
            )}
            {!compact && (
                <div className="absolute left-2.5 top-2.5 border-[2px] border-black bg-[var(--mm-warning)] px-2.5 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0_#000] rounded-lg">
                    {album._count.memories} memory
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════
   INTERACTIVE POLAROIDS — Interactive side-by-side preview in hero
   ═══════════════════════════════════════════════════════════ */
function InteractivePolaroids({ albumsList }: { albumsList: Album[] }) {
    const list = albumsList.slice(0, 3)
    const [slots, setSlots] = useState([0, 1, 2])

    if (list.length === 0) return null

    // 3 slots spaced side-by-side horizontally, centered beautifully
    const slotStyles = [
        { left: "55px", top: "45px", rotate: -8, zIndex: 10, scale: 0.95 },
        { left: "125px", top: "20px", rotate: 3, zIndex: 30, scale: 1.05 },
        { left: "195px", top: "35px", rotate: -5, zIndex: 20, scale: 0.98 }
    ]

    // 2 slots centered beautifully
    const slotStyles2 = [
        { left: "90px", top: "35px", rotate: -6, zIndex: 10, scale: 1.0 },
        { left: "160px", top: "25px", rotate: 4, zIndex: 20, scale: 1.02 }
    ]

    // 1 slot centered exactly at 125px
    const slotStyles1 = [
        { left: "125px", top: "30px", rotate: -2, zIndex: 10, scale: 1.05 }
    ]

    const getStyle = (itemIndex: number) => {
        const slotIndex = slots[itemIndex] ?? itemIndex
        if (list.length === 1) return slotStyles1[0]
        if (list.length === 2) {
            return slotStyles2[slotIndex % 2] || slotStyles2[0]
        }
        return slotStyles[slotIndex % 3] || slotStyles[0]
    }

    const handlePolaroidClick = (clickedIndex: number) => {
        if (list.length <= 1) return

        const currentSlot = slots[clickedIndex]

        if (list.length === 3) {
            if (currentSlot === 1) {
                // Cycle all slots
                setSlots(prev => prev.map(s => (s + 1) % 3))
            } else {
                // Swap the clicked item with the item in the center (slot 1)
                setSlots(prev => {
                    const centerItemIndex = prev.indexOf(1)
                    const next = [...prev]
                    next[clickedIndex] = 1
                    next[centerItemIndex] = currentSlot
                    return next
                })
            }
        } else if (list.length === 2) {
            // Swap 0 and 1
            setSlots(prev => [prev[1], prev[0]])
        }
    }

    return (
        <div className="relative h-[260px] w-full max-w-[360px]">
            {list.map((album, i) => {
                const styleConfig = getStyle(i)
                return (
                    <motion.div
                        key={album.id}
                        layout
                        onClick={() => handlePolaroidClick(i)}
                        className="absolute polaroid-frame-sm cursor-pointer select-none"
                        style={{ originX: 0.5, originY: 0.5 }}
                        animate={{
                            left: styleConfig.left,
                            top: styleConfig.top,
                            rotate: styleConfig.rotate,
                            zIndex: styleConfig.zIndex,
                            scale: styleConfig.scale,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 25
                        }}
                        whileHover={{
                            scale: styleConfig.scale * 1.05,
                            y: -6,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="aspect-square w-[96px] sm:w-[104px] overflow-hidden bg-[#e5e5e5] border border-black/10 rounded-sm">
                            {album.coverImage ? (
                                <img src={album.coverImage} alt="" className="h-full w-full object-cover pointer-events-none" loading="lazy" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br" style={{ backgroundImage: "linear-gradient(135deg, color-mix(in srgb, var(--mm-secondary) 25%, transparent), color-mix(in srgb, var(--mm-accent) 20%, transparent))" }}>
                                    <AlbumGlyph icon={album.icon} className="h-6 w-6 text-black/50" />
                                </div>
                            )}
                        </div>
                        <span className="mt-1.5 block max-w-[96px] sm:max-w-[104px] truncate text-center font-caveat text-[10px] sm:text-[11px] text-black/60 font-bold">
                            {album.name}
                        </span>
                    </motion.div>
                )
            })}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AlbumsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const isDraggingRef = useRef(false)
    const controls0 = useAnimation()
    const controls1 = useAnimation()
    const controls2 = useAnimation()
    const mobileControls = useMemo(() => [controls0, controls1, controls2], [controls0, controls1, controls2])

    const resetMobilePolaroids = () => {
        mobileControls.forEach(control => {
            control.start({
                x: 0,
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 25 }
            })
        })
    }
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

    // ── Computed stats ────────────────────────────────────────
    const latestUpdate = useMemo(() => {
        if (albums.length === 0) return "-"
        const sorted = [...albums].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        return formatDate(new Date(sorted[0].updatedAt))
    }, [albums])

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

        // 1. Snapshot for rollback
        const prevAlbums = [...albums]

        // 2. Optimistic Update: close modal + update memory counts + toast immediately
        setAlbums(prev => prev.map(a => {
            if (a.id === organizingAlbum.id) {
                return {
                    ...a,
                    _count: {
                        ...a._count,
                        memories: selectedMemoryIds.length
                    }
                }
            }
            return a
        }))
        toast.success("Pengelompokan kenangan berhasil disimpan")
        const currentOrganizingAlbum = organizingAlbum
        setOrganizingAlbum(null)

        // 3. Fetch in background
        ;(async () => {
            try {
                const albumRes = await fetch(`/api/albums/${currentOrganizingAlbum.id}`)
                if (!albumRes.ok) throw new Error("Gagal menyimpan relasi album")
                const albumData = await albumRes.json() as AlbumDetailResponse
                const initialIds = (albumData.memories || []).map(m => m.id)
                const added = selectedMemoryIds.filter(id => !initialIds.includes(id))
                const removed = initialIds.filter((id: string) => !selectedMemoryIds.includes(id))

                await Promise.all(added.map(async (memoryId) => {
                    const currentRes = await fetch(`/api/memories/${memoryId}/albums`)
                    const currentIds = currentRes.ok ? await currentRes.json() as string[] : []
                    const postRes = await fetch(`/api/memories/${memoryId}/albums`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ albumIds: [...new Set([...currentIds, currentOrganizingAlbum.id])] }),
                    })
                    if (!postRes.ok) throw new Error()
                }))

                await Promise.all(removed.map(async (memoryId) => {
                    const currentRes = await fetch(`/api/memories/${memoryId}/albums`)
                    const currentIds = currentRes.ok ? await currentRes.json() as string[] : []
                    const postRes = await fetch(`/api/memories/${memoryId}/albums`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ albumIds: currentIds.filter((id: string) => id !== currentOrganizingAlbum.id) }),
                    })
                    if (!postRes.ok) throw new Error()
                }))

                fetchAlbums()
            } catch (error: unknown) {
                setAlbums(prevAlbums)
                toast.error("Gagal menyinkronkan pengelompokan kenangan ke server. Silakan coba lagi.")
            } finally {
                setIsSaving(false)
            }
        })()
    }

    /* ═══════════════════════════════════════════════════════════
       RENDER: Album Context Menu
       ═══════════════════════════════════════════════════════════ */
    const renderAlbumMenu = (album: Album, cardIndex?: number) => {
        const isOpen = activeMenuId === album.id
        const isSystem = album.isSystemAlbum || album.name === SYSTEM_ALBUM_NAME
        return (
            <div className="absolute right-3 top-3 z-[20]" ref={isOpen ? menuRef : null}>
                <button
                    {...(cardIndex === 0 ? { "data-tutorial": "album-menu-btn" } : {})}
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setActiveMenuId(isOpen ? null : album.id)
                    }}
                    className="flex h-9 w-9 items-center justify-center border-[2px] border-black bg-white text-black shadow-[3px_3px_0_#000] rounded-xl transition-all hover:-translate-y-0.5 hover:bg-[var(--mm-warning)]"
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
                            className="absolute right-0 mt-2 w-52 border-[2.5px] border-black bg-white rounded-xl py-1 text-left shadow-[5px_5px_0_#000] overflow-hidden"
                        >
                            {!isSystem && (
                                <button onClick={() => openEditModal(album)} className="flex w-full items-center gap-2 border-b-2 border-dashed border-black/20 px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[var(--mm-soft-cyan)]">
                                    <Pencil className="h-4 w-4" /> Edit Album
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setChangingCoverAlbum(album)
                                    setAlbumCover(album.coverImage)
                                    setActiveMenuId(null)
                                }}
                                className="flex w-full items-center gap-2 border-b-2 border-dashed border-black/20 px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[var(--mm-warning)]"
                            >
                                <ImagePlus className="h-4 w-4" /> Ganti Cover
                            </button>
                            {!isSystem && (
                                <button onClick={() => openOrganizeModal(album)} className="flex w-full items-center gap-2 border-b-2 border-dashed border-black/20 px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[var(--mm-success)]">
                                    <Layers3 className="h-4 w-4" /> Kelola Memory
                                </button>
                            )}
                            {!isSystem && (
                                <button onClick={() => handleDeleteAlbum(album)} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-black uppercase text-rose-600 hover:bg-rose-500 hover:text-white">
                                    <Trash2 className="h-4 w-4" /> Hapus Album
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    /* ═══════════════════════════════════════════════════════════
       RENDER: Album Card — Journal / Scrapbook style
       ═══════════════════════════════════════════════════════════ */
    const renderAlbumCard = (album: Album, index: number, compact = false) => {
        const accent = cardAccent(index)
        const rotation = ROTATIONS[index % ROTATIONS.length]
        const decoEmoji = DECO_STICKERS[index % DECO_STICKERS.length]
        const showDeco = false

        if (compact) {
            // ── Compact card for timeline view
            return (
                <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative flex gap-4 border-[3px] border-black bg-white rounded-2xl p-4 shadow-[5px_5px_0_#000] transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#000] overflow-hidden"
                    style={{ borderLeftColor: accent, borderLeftWidth: "5px" }}
                >
                    {renderAlbumMenu(album, index)}
                    <Link href={`/albums/${album.id}`} className="flex flex-1 gap-4">
                        <AlbumCover album={album} accent={accent} compact />
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <h3 className="line-clamp-1 text-base font-black uppercase text-black transition-colors group-hover:text-[#d946ef]">
                                {album.name}
                            </h3>
                            <p className="mb-2 mt-1 line-clamp-2 text-xs font-bold leading-relaxed text-black/60">
                                {album.description || "Koleksi kenangan yang siap kamu buka lagi kapan saja."}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-black/50">
                                <span>{album._count.memories} memory</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {formatDate(new Date(album.updatedAt))}
                                </span>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            )
        }

        // ── Full card for grid view — Journal / Polaroid style
        return (
            <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`group relative scrap-lift ${rotation} border-[3px] border-black bg-white rounded-2xl shadow-[5px_5px_0_#000] hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#000] transition-all overflow-hidden`}
                style={{ "--binding-color": accent } as React.CSSProperties}
            >
                {/* Binding edge */}
                <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ background: `repeating-linear-gradient(to bottom, ${accent} 0px, ${accent} 8px, #000 8px, #000 10px)` }} />

                {renderAlbumMenu(album, index)}

                <Link href={`/albums/${album.id}`} className="block">
                    {/* Cover with inner white frame (polaroid feel) */}
                    <div className="m-3 ml-4 mb-0 border-[2.5px] border-black bg-white p-1.5 pb-0 rounded-xl overflow-hidden">
                        <AlbumCover album={album} accent={accent} />
                    </div>

                    {/* Card body */}
                    <div className="p-4 pl-5">
                        <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-black text-black shadow-[2px_2px_0_#000] rounded-md"
                                    style={{ backgroundColor: accent }}
                                >
                                    <AlbumGlyph icon={album.icon} className="h-4 w-4" />
                                </div>
                                <h3 className="line-clamp-1 text-sm font-black uppercase text-black transition-colors group-hover:text-[#d946ef]">
                                    {album.name}
                                </h3>
                            </div>
                        </div>

                        <p className="mb-3 line-clamp-2 text-[11px] font-bold leading-relaxed text-black/55">
                            {album.description || "Koleksi kenangan yang siap kamu buka lagi kapan saja."}
                        </p>

                        <div className="flex items-center justify-between border-t-2 border-dashed border-black/20 pt-2.5 text-[10px] font-black uppercase text-black/45">
                            <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(new Date(album.updatedAt))}
                            </span>
                            <span className="flex items-center gap-1 text-black transition-colors group-hover:text-fuchsia-500">
                                Buka <ArrowUpRight className="h-3 w-3" />
                            </span>
                        </div>
                    </div>
                </Link>
            </motion.div>
        )
    }

    /* ═══════════════════════════════════════════════════════════
       RENDER: Page
       ═══════════════════════════════════════════════════════════ */
    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 pb-32 sm:px-6 lg:px-8">

            {/* ── ════════════════════════════════════════════════════
                HERO — Scrapbook Creative Desk
                ══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden border-[3px] border-black bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-[6px_6px_0_#000] rounded-2xl sm:p-0">
                {/* Dot paper overlay */}
                <div className="pointer-events-none absolute inset-0 dot-paper-light opacity-60" />

                <div className="relative grid items-stretch lg:grid-cols-[1fr_380px]">
                    {/* ── Left: Text + CTA + Stats ──────────────────── */}
                    <div className="p-6 sm:p-8 lg:p-10">
                        {/* Handwritten accent label */}
                        <span className="mb-3 inline-block font-caveat text-lg text-black/50">
                            Koleksi ceritamu di sini...
                        </span>

                        <h1 className="mb-3 text-3xl font-black uppercase leading-none tracking-tight text-black sm:text-4xl lg:text-5xl" style={{ fontFamily: "'Syne',sans-serif" }}>
                            Album Kenangan
                        </h1>
                        <p className="max-w-md text-sm font-bold leading-7 text-black/70">
                            Kumpulkan cerita hidupmu dalam tema yang kamu buat sendiri.
                            Setiap album adalah satu chapter perjalanan hidupmu.
                        </p>

                        {/* CTA row */}
                        <div className="mt-6 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-stretch w-full">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                data-tutorial="create-album-btn"
                                onClick={() => {
                                    resetForm()
                                    setShowCreateModal(true)
                                }}
                                className="flex w-full min-[520px]:w-auto shrink-0 items-center justify-center gap-2 border-[2.5px] border-black bg-[var(--mm-primary)] px-5 py-3 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] active:translate-y-px active:shadow-none transition-all"
                            >
                                <Plus className="h-4 w-4" /> Buat Album
                            </motion.button>
                            <form
                                ref={searchRef}
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    setSearchOpen(false)
                                    fetchAlbums()
                                }}
                                className="relative z-[30] flex w-full min-[520px]:w-auto min-w-[220px] max-w-none min-[520px]:max-w-md flex-1 items-center border-[2.5px] border-black bg-white shadow-[3px_3px_0_#000] rounded-xl overflow-hidden"
                            >
                                <Search className="ml-3 h-4 w-4 text-black" />
                                <input
                                    value={search}
                                    onChange={e => {
                                        setSearch(e.target.value)
                                        setSearchOpen(true)
                                    }}
                                    onFocus={() => setSearchOpen(true)}
                                    placeholder="Cari album..."
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
                                        className="mr-2 flex h-7 w-7 items-center justify-center border-[1.5px] border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-[var(--mm-primary)] rounded-lg transition-all"
                                        aria-label="Bersihkan pencarian"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                {searchOpen && search.trim() && (
                                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[35] border-[2.5px] border-black bg-white shadow-[4px_4px_0_#000] rounded-xl overflow-hidden">
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
                                                    className="flex w-full items-center gap-3 border-b-[2px] border-dashed border-black/20 px-3 py-2 text-left last:border-b-0 hover:bg-[color-mix(in_srgb,var(--mm-primary)_10%,transparent)]"
                                                >
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border-[1.5px] border-black bg-[var(--mm-secondary)] rounded-md text-black">
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

                        {/* ── Stats row — horizontal scroll on mobile, grid on sm+ ──────── */}
                        <div className="mt-6 flex justify-center sm:justify-start gap-2.5 overflow-x-auto pb-2 px-1 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0 custom-scrollbar">
                            {[
                                { label: "Album", value: customAlbums.length, color: "var(--mm-soft-cyan)" },
                                { label: "Memory", value: totalMemoriesCount, color: "var(--mm-tertiary)" },
                            ].map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className={`shrink-0 min-w-[95px] sm:min-w-0 border-[2.5px] border-black bg-white px-3.5 py-2 shadow-[3px_3px_0_#000] sm:p-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] active:translate-y-px active:shadow-none transition-all duration-200 ${ROTATIONS[i % ROTATIONS.length]}`}
                                    style={{ borderTopColor: stat.color, borderTopWidth: "5px" }}
                                >
                                    <span className="mb-0.5 block text-[9px] font-black uppercase text-black/50 sm:mb-1 sm:text-[10px]">
                                        {stat.label}
                                    </span>
                                    <strong className="block text-lg font-black uppercase leading-tight text-black sm:text-xl">
                                        {stat.value}
                                    </strong>
                                </div>
                            ))}

                            {/* 3rd Stat Card: System Album / Belum Rapi (Clickable Link) */}
                            {systemAlbum ? (
                                <Link
                                    href={`/albums/${systemAlbum.id}`}
                                    className={`group block shrink-0 min-w-[105px] border-[2.5px] border-black bg-white px-3.5 py-2 shadow-[3px_3px_0_#000] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] active:translate-y-px active:shadow-none hover:bg-neutral-50 sm:min-w-0 sm:p-3.5 ${ROTATIONS[2 % ROTATIONS.length]}`}
                                    style={{ borderTopColor: "var(--mm-warning)", borderTopWidth: "5px" }}
                                >
                                    <span className="mb-0.5 flex items-center justify-between gap-1.5 text-[9px] font-black uppercase text-black/50 sm:mb-1 sm:text-[10px]">
                                        <span>Belum Rapi</span>
                                        <span className="text-[7px] bg-[var(--mm-accent)] text-black px-1.5 py-0.5 rounded-md border-[1.5px] border-black shadow-[1px_1px_0_#000] sm:text-[8px] sm:px-1.5">Sistem</span>
                                    </span>
                                    <strong className="block text-lg font-black uppercase leading-tight text-black group-hover:text-fuchsia-500 sm:text-xl">
                                        {systemAlbum._count.memories}
                                    </strong>
                                </Link>
                            ) : (
                                <div
                                    className={`shrink-0 min-w-[95px] sm:min-w-0 border-[2.5px] border-black bg-white px-3.5 py-2 shadow-[3px_3px_0_#000] rounded-xl sm:min-w-0 sm:p-3.5 ${ROTATIONS[2 % ROTATIONS.length]}`}
                                    style={{ borderTopColor: "var(--mm-warning)", borderTopWidth: "5px" }}
                                >
                                    <span className="mb-0.5 block text-[9px] font-black uppercase text-black/50 sm:mb-1 sm:text-[10px]">
                                        Belum Rapi
                                    </span>
                                    <strong className="block text-lg font-black uppercase leading-tight text-black sm:text-xl">
                                        0
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Polaroid Stack (Desktop only) ──────── */}
                    <div className="relative hidden border-l-[3px] border-black lg:block">
                        {/* Background texture */}
                        <div className="absolute inset-0 bg-orange-100/50 dot-paper-light opacity-50" />

                        <div className="relative flex h-full min-h-[340px] items-center justify-center p-6">
                            {/* Polaroid stack arranged side-by-side & interactive */}
                            <div className="relative h-[260px] w-[360px]">
                                <InteractivePolaroids albumsList={customAlbums.length ? customAlbums : albums} />
                                {albums.length === 0 && (
                                    <div className="polaroid-frame absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] rotate-[-3deg] rounded-md">
                                        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-cyan-100 to-fuchsia-100">
                                            <Sparkles className="h-10 w-10 text-black/30" />
                                        </div>
                                        <span className="mt-1.5 block text-center font-caveat text-xs text-black/50">
                                            Album pertamamu
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Sticky note decoration */}
                            <div className="sticky-note absolute bottom-6 right-4 rotate-[2deg] rounded-md">
                                <span className="text-sm font-bold text-black">chapter hidupmu</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Mobile visual: centered draggable polaroid row ────────── */}
                    <div className="flex flex-col items-center justify-center border-t-[2.5px] border-black bg-orange-50/50 p-6 lg:hidden w-full overflow-hidden">
                        <span className="mb-3.5 font-caveat text-sm text-black/55 select-none">
                            Sentuh dan geser polaroid di bawah!
                        </span>
                        <div className="flex justify-start min-[410px]:justify-center items-center gap-4 w-full overflow-x-auto pb-4 px-4 custom-scrollbar" style={{ touchAction: "none" }}>
                            {(customAlbums.slice(0, 3).length ? customAlbums.slice(0, 3) : albums.slice(0, 2)).map((album, i) => (
                                <motion.div
                                    key={album.id}
                                    animate={mobileControls[i]}
                                    drag
                                    dragConstraints={{ left: -60, right: 60, top: -40, bottom: 40 }}
                                    dragElastic={0.3}
                                    dragTransition={{ bounceStiffness: 400, bounceDamping: 20 }}
                                    onDragStart={() => { isDraggingRef.current = true }}
                                    onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false }, 100) }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`polaroid-frame-sm shrink-0 cursor-grab active:cursor-grabbing select-none rounded-md ${ROTATIONS[i % ROTATIONS.length]}`}
                                    style={{ width: "110px", touchAction: "none" }}
                                    onClick={() => {
                                        if (!isDraggingRef.current) {
                                            router.push(`/albums/${album.id}`)
                                        }
                                    }}
                                >
                                    <div className="aspect-square overflow-hidden bg-neutral-100 border border-black/10 rounded-sm pointer-events-none">
                                        {album.coverImage ? (
                                            <img src={album.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-100 to-fuchsia-100">
                                                <AlbumGlyph icon={album.icon} className="h-6 w-6 text-black/40" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="mt-1.5 block max-w-[110px] truncate text-center font-caveat text-[11px] text-black/60 font-bold pointer-events-none">
                                        {album.name}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        {albums.length > 0 && (
                            <button
                                onClick={resetMobilePolaroids}
                                className="mt-4 flex items-center gap-1.5 border-[2px] border-black bg-white rounded-xl px-3.5 py-1.5 text-[10px] font-black uppercase shadow-[2.5px_2.5px_0_#000] active:translate-y-px active:shadow-none hover:bg-yellow-200 transition-all"
                            >
                                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.8} /> Reset
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                FILTER BAR
                ══════════════════════════════════════════════════════ */}
            <section className="flex flex-col gap-4 border-b-[3px] border-black pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
                    {[
                        ["semua", "Semua", "var(--mm-secondary)"],
                        ["terbaru", "Terbaru", "var(--mm-soft-cyan)"],
                        ["az", "A-Z", "var(--mm-success)"],
                        ["paling_banyak", "Paling Banyak", "var(--mm-tertiary)"],
                        ["favorit", "Favorit", "var(--mm-warning)"],
                    ].map(([key, label, activeColor]) => (
                        <button
                            key={key}
                            onClick={() => setSort(key)}
                            className={`shrink-0 border-[2.5px] border-black rounded-xl px-4 py-2.5 text-xs font-black uppercase shadow-[3px_3px_0_#000] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none ${
                                sort === key ? "text-black" : "bg-white text-black hover:bg-neutral-50"
                            }`}
                            style={sort === key ? { backgroundColor: activeColor } : undefined}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex border-[2.5px] border-black bg-white rounded-xl overflow-hidden shadow-[3px_3px_0_#000]">
                        {[
                            ["grid", Grid3X3, "Grid"],
                            ["timeline", CalendarDays, "Timeline"],
                            ["map", Map, "Map"],
                        ].map(([mode, Icon, label]) => {
                            const LucideIcon = Icon as typeof Grid3X3
                            const isActive = viewMode === mode
                            return (
                                <button
                                    key={mode as string}
                                    onClick={() => setViewMode(mode as ViewMode)}
                                    className={`flex items-center gap-1.5 border-r-[2.5px] border-black px-4 py-2.5 text-xs font-black uppercase last:border-r-0 transition-colors duration-200 ${
                                        isActive ? "bg-[var(--mm-soft-cyan)] text-black" : "bg-white text-black/60 hover:bg-[color-mix(in_srgb,var(--mm-primary)_10%,transparent)] hover:text-black"
                                    }`}
                                >
                                    <LucideIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{label as string}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                ALBUM CONTENT
                ══════════════════════════════════════════════════════ */}
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-black" />
                    <p className="text-sm font-black uppercase tracking-widest text-black">Memuat album...</p>
                </div>
            ) : customAlbums.length === 0 ? (
                /* ── Empty State ──────────────────────────────────── */
                <div className="border-[4px] border-black bg-white p-12 text-center shadow-[8px_8px_0_#000]">
                    <div className="dot-paper-light pointer-events-none absolute inset-0 opacity-30" />
                    <FolderHeart className="mx-auto mb-5 h-14 w-14 text-black" />
                    <h2 className="mb-2 text-2xl font-black uppercase text-black">Album Pertamamu</h2>
                    <p className="mx-auto mb-4 max-w-md text-sm font-bold text-black/60">
                        Buat album untuk mengelompokkan momen pantai, perjalanan, kuliah, konser, atau cerita lain yang ingin kamu simpan rapi.
                    </p>
                    <p className="mx-auto mb-7 font-caveat text-lg text-black/40">
                        Mulai chapter pertama cerita hidupmu
                    </p>
                    <motion.button 
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)} 
                        className="border-[3px] border-black bg-[var(--mm-success)] px-6 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_#000] hover:-translate-y-0.5 hover:shadow-[5.5px_5.5px_0_#000] transition-all"
                    >
                        Buat Album Pertama
                    </motion.button>
                </div>
            ) : (
                <div className="space-y-7">
                    {/* ── Grid View ───────────────────────────────── */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {customAlbums.map((album, index) => renderAlbumCard(album, index))}
                        </div>
                    )}

                    {/* ── Timeline View ───────────────────────────── */}
                    {viewMode === "timeline" && (
                        <div className="mx-auto max-w-4xl space-y-10">
                            {groupedAlbums.map(([month, group], groupIndex) => {
                                const groupAccent = cardAccent(groupIndex)
                                return (
                                    <div key={month} className="relative border-l-[3px] border-black pl-6 ml-4">
                                        <div
                                            className="absolute -left-[10.5px] top-1 h-[18px] w-[18px] border-[2.5px] border-black rounded-full shadow-[1.5px_1.5px_0_#000] transition-colors duration-200"
                                            style={{ backgroundColor: groupAccent }}
                                        />
                                        <h3
                                            className="mb-5 w-fit border-[2.5px] border-black rounded-xl px-4.5 py-2 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]"
                                            style={{ backgroundColor: groupAccent }}
                                        >
                                            {month}
                                        </h3>
                                        <div className="space-y-5">
                                            {group.map((album, index) => renderAlbumCard(album, index, true))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* ── Map View ────────────────────────────────── */}
                    {viewMode === "map" && (
                        <div className="relative min-h-[560px] overflow-hidden border-[4px] border-black bg-[#F5ECD7] p-6 shadow-[8px_8px_0_#000]">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
                            {/* Map label */}
                            <div className="relative mb-5 inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000]">
                                Peta Album
                            </div>
                            <div className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {customAlbums.map((album, index) => (
                                    <div key={album.id} className={index % 2 ? "md:translate-y-10" : ""}>
                                        {renderAlbumCard(album, index, true)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── All organized notice ───────────────────── */}
                    {!showSystemAlbum && customAlbums.length > 0 && (
                        <div className="flex items-center gap-2 border-[2px] border-dashed border-[color-mix(in_srgb,var(--mm-success)_60%,black)] bg-[color-mix(in_srgb,var(--mm-success)_10%,transparent)] px-4 py-3 text-xs font-black uppercase text-black">
                            <Check className="h-4 w-4" />
                            Semua kenangan sudah dikelompokkan ke album custom.
                        </div>
                    )}
                </div>
            )}

            {/* ── ════════════════════════════════════════════════════
                MODAL: Delete Album
                ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {pendingDeleteAlbum && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="w-full max-w-md border-[3px] border-black bg-white shadow-[8px_8px_0_#000] rounded-2xl overflow-hidden"
                        >
                            <div className="border-b-[2.5px] border-black bg-rose-400 p-4 text-black">
                                <h3 className="text-sm font-black uppercase tracking-wider">Hapus Album Kenangan?</h3>
                            </div>
                            <div className="space-y-4 p-5">
                                <p className="text-sm font-bold leading-relaxed text-black/80">
                                    Album <span className="font-black uppercase text-black">&quot;{pendingDeleteAlbum.name}&quot;</span> akan dihapus dari daftar album.
                                    Kenangan di dalamnya tidak ikut terhapus.
                                </p>
                                <div className="border-[2px] border-black bg-amber-50 p-3 text-xs font-black uppercase tracking-wide text-black/70 rounded-xl shadow-[2px_2px_0_#000]">
                                    Memory yang tidak punya album custom lain akan kembali ke album sistem Belum Dikelompokkan.
                                </div>
                                <div className="flex justify-end gap-3 border-t-[2.5px] border-black pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setPendingDeleteAlbum(null)}
                                        disabled={isSaving}
                                        className="border-[2.5px] border-black bg-neutral-200 rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all disabled:opacity-60"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDeleteAlbum}
                                        disabled={isSaving}
                                        className="border-[2.5px] border-black bg-rose-400 rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all disabled:opacity-60"
                                    >
                                        {isSaving ? "Menghapus..." : "Hapus Album"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════
                MODAL: Create / Edit Album (70% clean / 30% scrapbook)
                ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {(showCreateModal || editingAlbum) && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="relative w-full max-w-4xl border-[3px] border-black bg-white shadow-[8px_8px_0_#000] rounded-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b-[2.5px] border-black bg-white p-4">
                                <h3 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-black">
                                    <FolderHeart className="h-4 w-4 sm:h-5 sm:w-5" /> {editingAlbum ? "Edit Album" : "Buat Album Baru"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setEditingAlbum(null); resetForm() }}
                                    className="flex h-8 w-8 items-center justify-center border-[2px] border-black bg-white text-black shadow-[2.5px_2.5px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0_#000] active:translate-y-px active:shadow-none hover:bg-[var(--mm-warning)] transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveAlbum} className="grid gap-6 p-6 lg:grid-cols-[1.1fr_280px_1fr]">
                                <div className="space-y-4">
                                    <label data-tutorial="album-input-name" className="block text-xs font-black uppercase text-black">
                                        Nama Album
                                        <input value={albumName} onChange={e => setAlbumName(e.target.value)} className="mt-2 w-full border-[2.5px] border-black bg-neutral-50 p-3 text-sm font-bold text-black placeholder:text-black/30 outline-none rounded-xl focus:bg-[var(--mm-warning)] focus:ring-0 transition-all duration-200" placeholder="Liburan Pantai 2026" />
                                    </label>
                                    <label className="block text-xs font-black uppercase text-black">
                                        Deskripsi
                                        <textarea value={albumDesc} onChange={e => setAlbumDesc(e.target.value)} maxLength={120} className="mt-2 min-h-[110px] w-full resize-none border-[2.5px] border-black bg-neutral-50 p-3 text-sm font-bold text-black placeholder:text-black/30 outline-none rounded-xl focus:bg-[var(--mm-warning)] focus:ring-0 transition-all duration-200" placeholder="Album untuk menyimpan momen selama perjalanan..." />
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-black uppercase text-black">Cover Album</p>
                                    <button
                                        data-tutorial="album-cover-upload"
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative flex h-48 w-full flex-col items-center justify-center gap-2.5 overflow-hidden border-[2.5px] border-dashed border-black bg-neutral-50 text-xs font-black uppercase text-black rounded-xl hover:bg-neutral-100 hover:border-solid transition-all duration-200"
                                    >
                                        {albumCover ? (
                                            <img src={albumCover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        ) : isUploading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-black" />
                                                <span className="text-[10px] text-black/50">Mengunggah...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-black/60 group-hover:text-black transition-colors duration-200">
                                                <ImageIcon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
                                                <span>Upload Cover</span>
                                            </div>
                                        )}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    {albumCover && (
                                        <button
                                            type="button"
                                            onClick={() => setAlbumCover(null)}
                                            className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors duration-200"
                                        >
                                            Hapus Cover
                                        </button>
                                    )}
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
                                                    className={`flex h-11 items-center justify-center border-[2px] border-black rounded-xl transition-all duration-200 ${
                                                        albumIcon === id
                                                            ? "bg-[var(--mm-success)] text-black shadow-[2px_2px_0_#000] -translate-y-0.5"
                                                            : "bg-white text-black hover:bg-neutral-50 hover:shadow-[2px_2px_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                                                    }`}
                                                >
                                                    <AlbumGlyph icon={id} className="h-5 w-5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 border-t-[2.5px] border-black pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowCreateModal(false); setEditingAlbum(null); resetForm() }}
                                            className="border-[2.5px] border-black bg-neutral-200 rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            data-tutorial="album-btn-save"
                                            type="submit"
                                            disabled={isSaving}
                                            className="border-[2.5px] border-black bg-[var(--mm-success)] rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all disabled:opacity-60"
                                        >
                                            {isSaving ? "Menyimpan..." : editingAlbum ? "Simpan" : "Buat Album"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════
                MODAL: Change Cover (with Polaroid preview)
                ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {changingCoverAlbum && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="w-full max-w-md border-[3px] border-black bg-white shadow-[8px_8px_0_#000] rounded-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b-[2.5px] border-black bg-[var(--mm-warning)] p-4">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">Ganti Cover</h3>
                                <button
                                    type="button"
                                    onClick={() => { setChangingCoverAlbum(null); resetForm() }}
                                    className="flex h-8 w-8 items-center justify-center border-[2px] border-black bg-white text-black shadow-[2.5px_2.5px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0_#000] active:translate-y-px active:shadow-none hover:bg-neutral-50 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-5 p-5">
                                {/* Polaroid frame preview */}
                                <div className="mx-auto w-fit polaroid-frame rotate-[-2deg] rounded-md shadow-md">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative flex h-52 w-full min-w-[200px] items-center justify-center overflow-hidden bg-[#E5E5E5] text-xs font-black uppercase text-black rounded-lg"
                                    >
                                        {albumCover ? (
                                            <img src={albumCover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        ) : isUploading ? (
                                            <span className="flex items-center gap-1.5 text-[10px] text-black/50"><Loader2 className="h-4 w-4 animate-spin text-black" /> Uploading...</span>
                                        ) : (
                                            <span className="text-[10px] text-black/60 group-hover:text-black transition-colors">Pilih File Cover</span>
                                        )}
                                    </button>
                                    <span className="mt-1.5 block text-center font-caveat text-sm text-black/60 font-bold">
                                        {changingCoverAlbum.name}
                                    </span>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                <div className="flex justify-end gap-3 border-t-[2.5px] border-black pt-4">
                                    <button
                                        onClick={() => { setChangingCoverAlbum(null); resetForm() }}
                                        className="border-[2.5px] border-black bg-neutral-200 rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSaveCoverUpdate}
                                        disabled={isSaving}
                                        className="border-[2.5px] border-black bg-[var(--mm-success)] rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════
                MODAL: Organize Memories
                ══════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {organizingAlbum && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/75 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="flex max-h-[86vh] w-full max-w-3xl flex-col border-[3px] border-black bg-white shadow-[8px_8px_0_#000] rounded-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b-[2.5px] border-black bg-[var(--mm-success)] p-4">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">Kelola Memory di &quot;{organizingAlbum.name}&quot;</h3>
                                <button
                                    type="button"
                                    onClick={() => setOrganizingAlbum(null)}
                                    className="flex h-8 w-8 items-center justify-center border-[2px] border-black bg-white text-black shadow-[2.5px_2.5px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0_#000] active:translate-y-px active:shadow-none hover:bg-neutral-50 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                {memoriesLoading ? (
                                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-black" /></div>
                                ) : (
                                    <div data-tutorial="album-memory-list" className="grid gap-3 sm:grid-cols-2">
                                        {allMemories.map(memory => {
                                            const selected = selectedMemoryIds.includes(memory.id)
                                            return (
                                                <button
                                                    key={memory.id}
                                                    type="button"
                                                    onClick={() => setSelectedMemoryIds(prev => selected ? prev.filter(id => id !== memory.id) : [...prev, memory.id])}
                                                    className={`flex items-center gap-3 border-[2px] border-black p-2 text-left shadow-[2px_2px_0_#000] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none ${
                                                        selected ? "bg-[color-mix(in_srgb,var(--mm-success)_20%,transparent)]" : "bg-white"
                                                    }`}
                                                >
                                                    <div className="flex h-12 aspect-video shrink-0 items-center justify-center overflow-hidden border-2 border-black bg-[#E5E5E5] rounded-lg">
                                                        <MemoryCover memory={memory} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-black uppercase text-black">{memory.title}</p>
                                                        <p className="text-[10px] font-bold uppercase text-black/50">{formatDate(new Date(memory.date))}</p>
                                                    </div>
                                                    <div className={`flex h-6 w-6 items-center justify-center border-2 border-black rounded-md transition-colors ${selected ? "bg-black text-[var(--mm-success)]" : "bg-white"}`}>
                                                        {selected && <Check className="h-4 w-4" />}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 border-t-[2.5px] border-black bg-white p-4">
                                <button
                                    onClick={() => setOrganizingAlbum(null)}
                                    className="border-[2.5px] border-black bg-neutral-200 rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    data-tutorial="album-btn-save-organize"
                                    onClick={handleSaveOrganize}
                                    disabled={isSaving}
                                    className="border-[2.5px] border-black bg-[var(--mm-success)] rounded-xl px-5 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                >
                                    Simpan Pengelompokan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
