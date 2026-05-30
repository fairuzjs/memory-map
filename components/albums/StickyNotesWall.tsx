"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pin, Trash2, Loader2, Sparkles, Send } from "lucide-react"
import toast from "react-hot-toast"

interface StickyNote {
    id: string
    content: string
    color: string
    rotation: number
    createdAt: string
    userId: string
    user: {
        id: string
        name: string
        image: string | null
    }
}

interface StickyNotesWallProps {
    albumId: string
    albumOwnerId: string
    currentUserId?: string
}

// Premium pastel palette — harmonious & clean
const NOTE_STYLES: Record<string, {
    bg: string
    border: string
    headerBg: string
    tape: string
    pinColor: string
}> = {
    yellow: {
        bg: "bg-[#FFFBEB]",
        border: "border-[#F59E0B]",
        headerBg: "bg-[#FEF3C7]",
        tape: "bg-[#FDE68A]/80",
        pinColor: "#D97706"
    },
    pink: {
        bg: "bg-[#FFF0F6]",
        border: "border-[#EC4899]",
        headerBg: "bg-[#FCE7F3]",
        tape: "bg-[#FBCFE8]/80",
        pinColor: "#DB2777"
    },
    cyan: {
        bg: "bg-[#F0FDFA]",
        border: "border-[#14B8A6]",
        headerBg: "bg-[#CCFBF1]",
        tape: "bg-[#99F6E4]/80",
        pinColor: "#0D9488"
    },
    orange: {
        bg: "bg-[#FFF7ED]",
        border: "border-[#F97316]",
        headerBg: "bg-[#FFEDD5]",
        tape: "bg-[#FED7AA]/80",
        pinColor: "#EA580C"
    }
}

// Stable rotation values per index to avoid re-render flicker
const ROTATIONS = [-2.5, 1.8, -1.2, 2.2, -1.8, 1.4, -2.1, 1.6, -0.9, 2.4]


export function StickyNotesWall({ albumId, albumOwnerId, currentUserId }: StickyNotesWallProps) {
    const [notes, setNotes] = useState<StickyNote[]>([])
    const [loading, setLoading] = useState(true)
    const [input, setInput] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isFocused, setIsFocused] = useState(false)

    const fetchNotes = useCallback(async () => {
        try {
            const res = await fetch(`/api/albums/${albumId}/sticky-notes`)
            if (res.ok) {
                const data = await res.json()
                setNotes(data)
            }
        } catch (error) {
            console.error("Failed to load notes", error)
        } finally {
            setLoading(false)
        }
    }, [albumId])

    useEffect(() => {
        fetchNotes()
    }, [fetchNotes])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isSubmitting) return

        if (notes.length >= 10) {
            toast.error("Batas maksimal 10 catatan tempel telah tercapai.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/albums/${albumId}/sticky-notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: input.trim() })
            })

            if (res.ok) {
                const newNote = await res.json()
                setNotes(prev => [...prev, newNote])
                setInput("")
                toast.success("Catatan ditempel! 📌")
            } else {
                const err = await res.json()
                toast.error(err.error || "Gagal menempelkan catatan")
            }
        } catch {
            toast.error("Terjadi kesalahan teknis")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (noteId: string) => {
        if (deletingId) return
        setDeletingId(noteId)
        try {
            const res = await fetch(`/api/albums/${albumId}/sticky-notes/${noteId}`, {
                method: "DELETE"
            })

            if (res.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId))
                toast.success("Catatan dibuang.")
            } else {
                toast.error("Gagal menghapus catatan")
            }
        } catch {
            toast.error("Terjadi kesalahan teknis")
        } finally {
            setDeletingId(null)
        }
    }

    const maxNotesReached = notes.length >= 10
    const fillPercent = Math.round((notes.length / 10) * 100)

    return (
        <div className="relative flex flex-col rounded-2xl overflow-hidden border-[3px] border-black shadow-[6px_6px_0_#000] bg-white">

            {/* ── Corkboard Header ─────────────────────────── */}
            <div className="relative flex items-center justify-between px-4 py-3 bg-[#1C1C1E] border-b-[3px] border-black">
                {/* Decorative pin dots */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF5F57] border border-black/30" />
                    <span className="w-2 h-2 rounded-full bg-[#FEBC2E] border border-black/30" />
                    <span className="w-2 h-2 rounded-full bg-[#28C840] border border-black/30" />
                </div>

                <div className="flex items-center gap-2 mx-auto">
                    <Sparkles className="w-3.5 h-3.5 text-[#FEBC2E]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white">
                        Sticky Notes Wall
                    </h3>
                </div>

                {/* Counter badge */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-2 py-0.5">
                        <span className="text-[9px] font-black text-white/70 uppercase">{notes.length}</span>
                        <span className="text-[9px] text-white/30">/</span>
                        <span className="text-[9px] font-black text-white/40">10</span>
                    </div>
                </div>
            </div>

            {/* ── Progress bar ────────────────────────────── */}
            <div className="h-1 bg-black/5">
                <div
                    className="h-full bg-[var(--mm-warning)] transition-all duration-500"
                    style={{ width: `${fillPercent}%` }}
                />
            </div>

            {/* ── Corkboard texture area (notes) ───────────── */}
            <div
                className="relative flex-1 overflow-y-auto"
                style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(0,0,0,0.03) 27px, rgba(0,0,0,0.03) 28px), #FAFAF8",
                    minHeight: "280px",
                    maxHeight: "420px"
                }}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="relative">
                            <Loader2 className="w-7 h-7 text-black/40 animate-spin" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/30">
                            Memuat catatan...
                        </span>
                    </div>
                ) : notes.length === 0 ? (
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
                        <div className="relative">
                            {/* Decorative empty post-it */}
                            <div className="w-16 h-16 bg-[#FEF08A] border-[2.5px] border-black rounded-sm shadow-[3px_3px_0_#000] rotate-[-4deg] flex items-center justify-center">
                                <Pin className="w-6 h-6 text-black/30" />
                            </div>
                            <div className="absolute -top-2 -right-3 w-12 h-12 bg-[#FBCFE8] border-[2.5px] border-black rounded-sm shadow-[2px_2px_0_#000] rotate-[6deg] -z-10" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-caveat text-lg font-bold text-black/40 leading-none">
                                Dinding masih kosong...
                            </p>
                            <p className="text-[10px] font-bold text-black/30 uppercase tracking-wide leading-relaxed">
                                Jadilah yang pertama menempel!
                            </p>
                        </div>
                    </div>
                ) : (
                    /* ── Notes masonry grid ── */
                    <div className="p-4 columns-2 gap-3 space-y-0">
                        <AnimatePresence>
                            {notes.map((note, idx) => {
                                const styles = NOTE_STYLES[note.color] || NOTE_STYLES.yellow
                                const rot = ROTATIONS[idx % ROTATIONS.length]
                                const isAuthor = note.userId === currentUserId
                                const isAlbumOwner = albumOwnerId === currentUserId
                                const canDelete = isAlbumOwner || isAuthor

                                return (
                                    <motion.div
                                        key={note.id}
                                        initial={{ scale: 0.85, opacity: 0, y: 12 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.85, opacity: 0, y: -8 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                        className="break-inside-avoid mb-3"
                                    >
                                        <div
                                            className={`
                                                relative group p-3 pt-5 rounded-sm
                                                border-[2.5px] ${styles.border} ${styles.bg}
                                                shadow-[3px_4px_0_rgba(0,0,0,0.18)]
                                                transition-all duration-200
                                                hover:shadow-[5px_7px_0_rgba(0,0,0,0.22)]
                                                hover:-translate-y-1
                                            `}
                                            style={{ transform: `rotate(${rot}deg)` }}
                                        >
                                            {/* Tape strip at top */}
                                            <div
                                                className={`absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-5 ${styles.tape} rounded-sm border border-black/15 backdrop-blur-sm`}
                                                style={{ transform: "translateX(-50%) rotate(-0.5deg)" }}
                                            />

                                            {/* Pin dot */}
                                            <div
                                                className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-[1.5px] border-black/40 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                                                style={{ backgroundColor: styles.pinColor }}
                                            />

                                            {/* Note content */}
                                            <p className="font-caveat text-[15px] font-bold leading-snug text-black/85 whitespace-pre-wrap break-words min-h-[40px]">
                                                {note.content}
                                            </p>

                                            {/* Footer */}
                                            <div className={`mt-2.5 pt-2 border-t border-black/10 ${styles.headerBg} -mx-3 px-3 pb-1 rounded-b-sm`}>
                                                {/* Author row */}
                                                <div className="flex items-center justify-between gap-1 mb-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <img
                                                            src={note.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.userId}`}
                                                            className="w-4 h-4 rounded-full border border-black/20 object-cover shrink-0"
                                                            alt=""
                                                        />
                                                        <span className="truncate text-[9px] font-black uppercase tracking-wide text-black/50">
                                                            {note.user.name}
                                                        </span>
                                                    </div>

                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(note.id)}
                                                            disabled={deletingId === note.id}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded border border-black/20 bg-white/60 hover:bg-rose-500 hover:border-rose-600 hover:text-white transition-all text-black/40 shrink-0"
                                                            title="Buang Catatan"
                                                        >
                                                            {deletingId === note.id ? (
                                                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-2.5 h-2.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Input Form ───────────────────────────────── */}
            <div className="border-t-[2.5px] border-black bg-white px-4 py-3">
                {maxNotesReached ? (
                    <div className="flex items-center gap-2 bg-rose-50 border-[2px] border-rose-200 rounded-xl px-3 py-2.5 text-center">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-wide leading-relaxed text-center w-full">
                            🚫 Dinding penuh! Hapus catatan lama dulu.
                        </span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div
                            className={`relative bg-[#FFFBEB] rounded-xl border-[2.5px] transition-all duration-200 ${
                                isFocused
                                    ? "border-black shadow-[3px_3px_0_#000]"
                                    : "border-black/30 shadow-none"
                            }`}
                        >
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Tulis pesan hangat di sini..."
                                maxLength={100}
                                disabled={isSubmitting}
                                rows={2}
                                className="w-full bg-transparent px-3 pt-2.5 pb-6 text-[12px] font-caveat font-bold text-black/80 placeholder:text-black/25 focus:outline-none resize-none"
                            />
                            <span className={`absolute bottom-2 right-2.5 text-[9px] font-black uppercase transition-colors ${
                                input.length >= 90 ? "text-rose-500" : "text-black/25"
                            }`}>
                                {input.length}/100
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !input.trim()}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#1C1C1E] hover:bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-xl border-[2.5px] border-black shadow-[3px_3px_0_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-px active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Menempelkan...
                                </>
                            ) : (
                                <>
                                    <Pin className="w-3.5 h-3.5" />
                                    Tempel Post-It
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
