"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
    BookOpen,
    Camera,
    Check,
    Coffee,
    FolderHeart,
    GraduationCap,
    Heart,
    ImagePlus,
    Info,
    Loader2,
    Mountain,
    Music2,
    Palmtree,
    Plane,
    Plus,
    Star,
    Waves,
    X,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface AlbumSelectionModalProps {
    memoryId: string
    memoryPhotos?: string[] // list of URLs uploaded for the memory
    onClose: () => void
}

interface Album {
    id: string
    name: string
    description: string | null
    coverImage: string | null
    icon: string | null
    _count: {
        memories: number
    }
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback
}

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
    }
    if (!icon) return "waves"
    if (ICON_OPTIONS.some(option => option.id === icon)) return icon
    return legacyMap[icon] || "waves"
}

function AlbumGlyph({ icon, className = "h-5 w-5" }: { icon?: string | null; className?: string }) {
    const normalized = normalizeIconId(icon)
    const Icon = ICON_OPTIONS.find(option => option.id === normalized)?.Icon || BookOpen
    return <Icon className={className} strokeWidth={2.8} />
}

export function AlbumSelectionModal({ memoryId, memoryPhotos = [], onClose }: AlbumSelectionModalProps) {
    const router = useRouter()
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // Form states for creating a new album
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newAlbumName, setNewAlbumName] = useState("")
    const [newAlbumDesc, setNewAlbumDesc] = useState("")
    const [newAlbumIcon, setNewAlbumIcon] = useState("waves")
    const [newAlbumCover, setNewAlbumCover] = useState<string | null>(null)
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch existing albums
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const res = await fetch("/api/albums?sort=az")
                if (!res.ok) throw new Error("Gagal mengambil daftar album")
                const data = await res.json() as Album[]
                setAlbums(data)

                // Leave choices empty so the backend can place the memory in the default system album.
            } catch (error: unknown) {
                toast.error(getErrorMessage(error, "Gagal memuat album"))
            } finally {
                setLoading(false)
            }
        }
        fetchAlbums()
    }, [])

    const toggleAlbumSelection = (albumId: string) => {
        setSelectedAlbumIds(prev =>
            prev.includes(albumId)
                ? prev.filter(id => id !== albumId)
                : [...prev, albumId]
        )
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const file = e.target.files[0]

        setIsUploadingCover(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("isPublic", "true")

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            if (!res.ok) throw new Error("Upload cover gagal")
            const data = await res.json() as { url?: string }
            if (!data.url) throw new Error("Upload tidak mengembalikan URL cover")
            setNewAlbumCover(data.url)
            toast.success("Cover berhasil diupload!")
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal mengupload cover"))
        } finally {
            setIsUploadingCover(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAlbumName.trim()) {
            toast.error("Nama album wajib diisi!")
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch("/api/albums", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newAlbumName.trim(),
                    description: newAlbumDesc.trim() || null,
                    icon: newAlbumIcon,
                    coverImage: newAlbumCover,
                })
            })

            if (!res.ok) {
                const err = await res.json() as { error?: string }
                throw new Error(err.error || "Gagal membuat album baru")
            }

            const createdAlbum = await res.json() as Album
            toast.success(`Album "${createdAlbum.name}" berhasil dibuat!`)

            // Refresh album list and auto-select the newly created album
            setAlbums(prev => [createdAlbum, ...prev])
            setSelectedAlbumIds(prev => [...prev, createdAlbum.id])

            // Reset form
            setNewAlbumName("")
            setNewAlbumDesc("")
            setNewAlbumCover(null)
            setShowCreateForm(false)
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Gagal membuat album baru"))
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAssociations = async () => {
        setIsSaving(true)

        // 1. Optimistic — close modal + navigate + toast immediately
        toast.success("Kenangan berhasil dikelompokkan!")
        router.push("/albums")
        onClose()

        // 2. Fetch in background
        try {
            const res = await fetch(`/api/memories/${memoryId}/albums`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    albumIds: selectedAlbumIds
                })
            })

            if (!res.ok) throw new Error("Gagal mengelompokkan kenangan")
        } catch (error: unknown) {
            // Show error after the fact — user already navigated
            toast.error(getErrorMessage(error, "Gagal mengaitkan album. Silakan coba lagi dari halaman album."))
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 overflow-y-auto">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#FFFDF0] border-[3px] border-black shadow-[6px_6px_0_#000] w-full max-w-2xl overflow-hidden flex flex-col my-8 rounded-3xl"
            >
                {/* Header */}
                <div className="bg-[#00FFFF] border-b-[3px] border-black p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center rounded-xl">
                            <BookOpen className="h-5 w-5 text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-black uppercase tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                PILIH ALBUM KENANGAN
                            </h2>
                            <p className="text-xs font-bold text-black/60 uppercase mt-0.5">
                                KELOMPOKKAN KENANGAN BARUMU KE DALAM ALBUM
                            </p>
                        </div>
                    </div>
                    {/* Bypass option if they just want default */}
                    <button
                        onClick={handleSaveAssociations}
                        disabled={isSaving}
                        className="px-3 py-1.5 text-xs font-black bg-white hover:bg-black hover:text-white border-[2.5px] border-black shadow-[2px_2px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all"
                    >
                        LEWATI / TANPA ALBUM
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 text-[#FF00FF] animate-spin mb-3" />
                            <span className="text-sm font-black text-black uppercase">Memuat daftar album...</span>
                        </div>
                    ) : !showCreateForm ? (
                        <>
                            {/* Alert/Info */}
                            <div className="bg-[#FFFF00] border-[3px] border-black p-4 flex gap-3 shadow-[3px_3px_0_#000] rounded-2xl">
                                <Info className="w-5 h-5 shrink-0 text-black" />
                                <div className="text-xs font-bold text-black leading-relaxed">
                                    Pilih satu atau lebih album untuk mengelompokkan kenangan ini. Jika tidak memilih album custom, kenangan akan masuk ke album default <span className="uppercase underline">&quot;Belum Dikelompokkan&quot;</span>.
                                </div>
                            </div>

                            {/* Album List Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {albums.map((album) => {
                                    const isSelected = selectedAlbumIds.includes(album.id)
                                    // Default placeholder colors based on coverImage existence
                                    return (
                                        <button
                                            key={album.id}
                                            type="button"
                                            onClick={() => toggleAlbumSelection(album.id)}
                                            className={`
                                                flex items-center gap-3 p-3 text-left border-[3px] border-black transition-all group relative overflow-hidden rounded-2xl
                                                ${isSelected
                                                    ? "bg-[#00FF00] shadow-[4px_4px_0_#000] -translate-y-0.5"
                                                    : "bg-white hover:bg-[#FFF] hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0_#000] active:translate-y-px active:shadow-none shadow-[3px_3px_0_#000]"
                                                }
                                            `}
                                        >
                                            {/* Cover / Icon Preview */}
                                            <div className="w-12 h-12 bg-[#FF00FF] border-[2.5px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center shrink-0 overflow-hidden relative rounded-xl">
                                                {album.coverImage ? (
                                                    <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <AlbumGlyph icon={album.icon} className="h-6 w-6 text-black" />
                                                )}
                                            </div>

                                            {/* Text details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-black uppercase truncate group-hover:text-black">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <AlbumGlyph icon={album.icon} className="h-3.5 w-3.5" />
                                                        {album.name}
                                                    </span>
                                                </h3>
                                                <p className="text-[10px] font-bold text-black/60 uppercase mt-0.5">
                                                    {album._count.memories} Kenangan
                                                </p>
                                            </div>

                                            {/* Check indicator */}
                                            <div className={`
                                                w-6 h-6 border-[2.5px] border-black flex items-center justify-center shrink-0 rounded-md
                                                ${isSelected ? "bg-black text-[#00FF00]" : "bg-white"}
                                            `}>
                                                {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                                            </div>
                                        </button>
                                    )
                                })}

                                {/* "+ Buat Album Baru" Option */}
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(true)}
                                    className="flex items-center justify-center gap-2 p-3 text-center bg-[#FF00FF] hover:bg-black text-white hover:text-white border-[3px] border-black shadow-[3px_3px_0_#000] rounded-2xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all font-black uppercase text-sm"
                                >
                                    <Plus className="w-5 h-5 text-white" />
                                    BUAT ALBUM BARU
                                </button>
                            </div>
                        </>
                    ) : (
                        /* CREATE NEW ALBUM FORM PANEL */
                        <form onSubmit={handleCreateAlbum} className="space-y-4">
                            <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_#000] space-y-4 rounded-2xl">
                                <div className="flex justify-between items-center border-b-[3px] border-black pb-2 mb-2 bg-[#FF00FF]/10 -mx-5 -mt-5 p-4 rounded-t-2xl">
                                    <h3 className="text-sm font-black text-black uppercase flex items-center gap-2">
                                        <FolderHeart className="w-5 h-5" />
                                        Buat Album Baru
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="w-7 h-7 flex items-center justify-center bg-white border-[2px] border-black hover:bg-red-500 hover:text-white shadow-[1px_1px_0_#000] rounded-lg transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Album Name */}
                                <div>
                                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Nama Album</label>
                                    <input
                                        type="text"
                                        value={newAlbumName}
                                        onChange={e => setNewAlbumName(e.target.value)}
                                        placeholder="contoh: Liburan Pantai 2026"
                                        className="w-full bg-[#E5E5E5] border-[3px] border-black p-3 text-sm focus:bg-[#FFFF00] outline-none transition-all placeholder:text-neutral-400 text-black font-bold rounded-xl"
                                        required
                                    />
                                </div>

                                {/* Album Description */}
                                <div>
                                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Deskripsi Album</label>
                                    <textarea
                                        value={newAlbumDesc}
                                        onChange={e => setNewAlbumDesc(e.target.value)}
                                        placeholder="Tulis ringkasan cerita album ini..."
                                        className="w-full min-h-[80px] bg-[#E5E5E5] border-[3px] border-black p-3 text-sm focus:bg-[#FFFF00] outline-none resize-none transition-all placeholder:text-neutral-400 text-black font-bold rounded-xl"
                                    />
                                </div>

                                {/* Icon Selector */}
                                <div>
                                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Tema / Icon Album</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {ICON_OPTIONS.map(({ id, label }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                aria-label={label}
                                                title={label}
                                                onClick={() => {
                                                    setNewAlbumIcon(id)
                                                }}
                                                className={`
                                                    w-9 h-9 flex items-center justify-center text-lg border-[2px] border-black transition-all rounded-xl
                                                    ${newAlbumIcon === id
                                                        ? "bg-[#FFFF00] shadow-[2px_2px_0_#000] -translate-y-0.5"
                                                        : "bg-[#E5E5E5] hover:bg-white"
                                                    }
                                                `}
                                            >
                                                <AlbumGlyph icon={id} className="h-5 w-5 text-black" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Manual Cover Selector */}
                                <div>
                                    <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">Cover Album (Manual)</label>
                                    <div className="space-y-3">
                                        {/* Option A: Choose from current memory photos */}
                                        {memoryPhotos.length > 0 && (
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] font-black text-black/60 uppercase">Pilih dari foto kenangan baru:</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {memoryPhotos.map((photoUrl, idx) => {
                                                        const isSelected = newAlbumCover === photoUrl
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setNewAlbumCover(photoUrl)}
                                                                className={`
                                                                    w-16 h-16 border-[2px] border-black relative overflow-hidden transition-all shrink-0 rounded-xl
                                                                    ${isSelected
                                                                        ? "ring-4 ring-[#00FF00] shadow-[2px_2px_0_#000] -translate-y-0.5"
                                                                        : "opacity-75 hover:opacity-100"
                                                                    }
                                                                `}
                                                            >
                                                                <img src={photoUrl} alt="Memory Photo" className="w-full h-full object-cover" />
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
                                                                        <Check className="w-6 h-6 text-[#00FF00]" strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Option B: Upload new cover image */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingCover}
                                                className="flex items-center gap-2 px-3 py-2 text-xs font-black bg-white hover:bg-[#E5E5E5] border-[2.5px] border-black shadow-[2px_2px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all disabled:opacity-50 uppercase"
                                            >
                                                {isUploadingCover ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        UPLOADING...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImagePlus className="w-3.5 h-3.5" />
                                                        UPLOAD FILE COVER
                                                    </>
                                                )}
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            {newAlbumCover && (
                                                <button
                                                    type="button"
                                                    onClick={() => setNewAlbumCover(null)}
                                                    className="text-xs font-bold text-red-500 hover:underline uppercase flex items-center gap-1"
                                                >
                                                    HAPUS COVER
                                                </button>
                                            )}
                                        </div>

                                        {/* Live Preview of cover */}
                                        {newAlbumCover && (
                                            <div className="w-full h-32 border-[2.5px] border-black relative overflow-hidden bg-black/5 rounded-xl">
                                                <img src={newAlbumCover} alt="Cover Preview" className="w-full h-full object-cover" />
                                                <div className="absolute bottom-2 left-2 bg-[#FFFF00] border-[2px] border-black px-2 py-0.5 text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0_#000] rounded-md">
                                                    PREVIEW COVER
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-5 py-2 text-xs font-black bg-white border-[3px] border-black shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all uppercase"
                                >
                                    KEMBALI
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-6 py-2 text-xs font-black bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all uppercase disabled:opacity-50"
                                >
                                    {isSaving ? "MENYIMPAN..." : "SIMPAN ALBUM BARU"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Actions */}
                {!showCreateForm && (
                    <div className="bg-[#FFF] border-t-[3px] border-black p-5 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleSaveAssociations}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-black bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] rounded-xl hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000] active:translate-y-px active:shadow-none transition-all uppercase disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    MENYIMPAN...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" strokeWidth={3} />
                                    SIMPAN KE ALBUM
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
