"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
    MessageSquareText, Image as ImageIcon, X, Send,
    Clock, CheckCircle2, MessageCircleReply, Loader2, Sparkles, History
} from "lucide-react"
import { timeAgo } from "@/lib/utils"
import toast from "react-hot-toast"

type Tab = "create" | "history"

export default function FeedbacksPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState<Tab>("create")
    const [message, setMessage] = useState("")
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        try {
            const res = await fetch("/api/feedbacks")
            if (res.ok) {
                const data = await res.json()
                setTickets(data)
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran gambar maksimal 5MB")
                return
            }
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImage(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("message", message)
            if (image) formData.append("image", image)

            const res = await fetch("/api/feedbacks", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || "Gagal mengirim tiket")
            }

            toast.success("Tiket berhasil dikirim!")
            setMessage("")
            removeImage()
            fetchTickets()
            setActiveTab("history")
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan saat mengirim tiket.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "PENDING":
                return { text: "Menunggu", color: "text-amber-400", bg: "bg-amber-400/10", dot: "bg-amber-400", borderColor: "rgba(251,191,36,0.2)" }
            case "READ":
                return { text: "Dibaca Admin", color: "text-sky-400", bg: "bg-sky-400/10", dot: "bg-sky-400", borderColor: "rgba(56,189,248,0.2)" }
            case "REPLIED":
                return { text: "Dibalas", color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400", borderColor: "rgba(52,211,153,0.2)" }
            default:
                return { text: "Menunggu", color: "text-neutral-400", bg: "bg-neutral-800", dot: "bg-neutral-500", borderColor: "rgba(115,115,115,0.2)" }
        }
    }

    return (
        <div className="min-h-screen">
            {/* Ambient bg glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[5%] w-[700px] h-[700px] rounded-full opacity-[0.035]"
                    style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
                <div className="absolute bottom-[0%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.025]"
                    style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-32">

                {/* ── Page Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            <MessageSquareText className="w-[18px] h-[18px] text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                                Pusat Bantuan & Masukan
                            </h1>
                            <p className="text-xs text-neutral-500 mt-0.5">Sampaikan saran, kritik, atau pertanyaan kepada tim kami</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Tab Switcher Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="flex items-center justify-between mb-5"
                >
                    {/* Buat Tiket — left */}
                    <button
                        onClick={() => setActiveTab("create")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                            background: activeTab === "create"
                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                : "rgba(255,255,255,0.04)",
                            border: "1px solid " + (activeTab === "create" ? "transparent" : "rgba(255,255,255,0.08)"),
                            color: activeTab === "create" ? "#fff" : "rgba(163,163,163,1)",
                            boxShadow: activeTab === "create" ? "0 4px 20px rgba(99,102,241,0.3)" : "none"
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Buat Tiket
                    </button>

                    {/* Riwayat Tiket — right */}
                    <button
                        onClick={() => setActiveTab("history")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                            background: activeTab === "history"
                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                : "rgba(255,255,255,0.04)",
                            border: "1px solid " + (activeTab === "history" ? "transparent" : "rgba(255,255,255,0.08)"),
                            color: activeTab === "history" ? "#fff" : "rgba(163,163,163,1)",
                            boxShadow: activeTab === "history" ? "0 4px 20px rgba(99,102,241,0.3)" : "none"
                        }}
                    >
                        <History className="w-3.5 h-3.5" />
                        Riwayat Tiket
                        {tickets.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    background: activeTab === "history" ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.2)",
                                    color: activeTab === "history" ? "#fff" : "#a5b4fc"
                                }}>
                                {tickets.length}
                            </span>
                        )}
                    </button>
                </motion.div>

                {/* ── Separator ── */}
                <div className="mb-6 h-px"
                    style={{ background: "linear-gradient(to right, transparent, rgba(99,102,241,0.2), rgba(139,92,246,0.15), transparent)" }} />

                {/* ── Tab Content ── */}
                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>

                        {/* CREATE TICKET */}
                        {activeTab === "create" && (
                            <motion.div
                                key="create"
                                initial={{ opacity: 0, x: -24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 24 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                <div className="rounded-2xl overflow-hidden"
                                    style={{
                                        background: "linear-gradient(145deg, rgba(99,102,241,0.05), rgba(10,10,10,0.7))",
                                        border: "1px solid rgba(99,102,241,0.14)",
                                        backdropFilter: "blur(20px)"
                                    }}>
                                    <div className="h-[2px]"
                                        style={{ background: "linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)" }} />

                                    <div className="p-6 sm:p-8">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-1 h-4 rounded-full"
                                                style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" }} />
                                            <h2 className="text-sm font-semibold text-neutral-300 tracking-wide">Tulis Pesan</h2>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            {/* Textarea */}
                                            <div className="relative">
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Tuliskan pesan Anda secara detail — saran, kritik, atau pertanyaan..."
                                                    className="w-full rounded-xl px-4 py-3.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none resize-none h-40 transition-all"
                                                    style={{
                                                        background: "rgba(0,0,0,0.45)",
                                                        border: "1px solid rgba(255,255,255,0.07)",
                                                        boxShadow: message ? "0 0 0 2px rgba(99,102,241,0.22)" : "none",
                                                        lineHeight: "1.7"
                                                    }}
                                                    required
                                                />
                                                <div className="absolute bottom-3 right-3.5 text-[10px] text-neutral-700 tabular-nums select-none">
                                                    {message.length} karakter
                                                </div>
                                            </div>

                                            {/* Image Upload */}
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    className="hidden"
                                                    ref={fileInputRef}
                                                    onChange={handleImageChange}
                                                />
                                                <AnimatePresence mode="popLayout">
                                                    {imagePreview ? (
                                                        <motion.div
                                                            key="preview"
                                                            initial={{ opacity: 0, scale: 0.96 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.96 }}
                                                            className="relative rounded-xl overflow-hidden group"
                                                            style={{ border: "1px solid rgba(99,102,241,0.2)" }}
                                                        >
                                                            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                                                            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                <button type="button" onClick={removeImage}
                                                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-400 transition-colors shadow-lg">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded text-[10px] text-white/60"
                                                                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                                                                Foto dilampirkan · hover untuk hapus
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button
                                                            key="upload"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full py-5 rounded-xl flex flex-col items-center justify-center gap-2.5 transition-all group"
                                                            style={{
                                                                background: "rgba(0,0,0,0.25)",
                                                                border: "1.5px dashed rgba(255,255,255,0.07)",
                                                            }}
                                                            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
                                                            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                                                        >
                                                            <div className="w-9 h-9 rounded-xl bg-neutral-800/80 group-hover:bg-indigo-500/15 flex items-center justify-center transition-colors">
                                                                <ImageIcon className="w-[18px] h-[18px] text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors font-medium">Lampirkan Foto</p>
                                                                <p className="text-[10px] text-neutral-700 mt-0.5">Opsional · JPG, PNG, WebP · maks 5MB</p>
                                                            </div>
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Submit */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !message.trim()}
                                                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                                                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                            >
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                                <span className="relative flex items-center gap-2">
                                                    {isSubmitting
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <><Send className="w-4 h-4" />Kirim Tiket</>
                                                    }
                                                </span>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === "history" && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 rounded-full"
                                            style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)" }} />
                                        <h2 className="text-sm font-semibold text-neutral-300 tracking-wide">Tiket Saya</h2>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-300"
                                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.18)" }}>
                                        {tickets.length} tiket
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                        <span className="text-xs text-neutral-600">Memuat tiket...</span>
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="rounded-2xl py-16 text-center"
                                        style={{
                                            background: "rgba(10,10,10,0.5)",
                                            border: "1.5px dashed rgba(255,255,255,0.06)"
                                        }}>
                                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                                            <MessageSquareText className="w-6 h-6" style={{ color: "rgba(99,102,241,0.5)" }} />
                                        </div>
                                        <p className="text-sm text-neutral-500 font-medium">Belum ada tiket masukan</p>
                                        <p className="text-xs text-neutral-700 mt-1">Kirim tiket pertamamu lewat tab "Buat Tiket"</p>
                                        <button
                                            onClick={() => setActiveTab("create")}
                                            className="mt-5 px-4 py-2 rounded-lg text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                                            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
                                            Buat Tiket Sekarang →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tickets.map((ticket, i) => {
                                            const status = getStatusConfig(ticket.status)
                                            return (
                                                <motion.div
                                                    key={ticket.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.06 }}
                                                    className="rounded-2xl overflow-hidden"
                                                    style={{
                                                        background: "rgba(12,12,12,0.75)",
                                                        border: "1px solid rgba(255,255,255,0.06)",
                                                        backdropFilter: "blur(12px)"
                                                    }}
                                                >
                                                    {/* Ticket top bar */}
                                                    <div className="px-5 pt-4 pb-3 flex items-center justify-between"
                                                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color} ${status.bg}`}
                                                                style={{ border: `1px solid ${status.borderColor}` }}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                                                                {status.text}
                                                            </div>
                                                            <span className="text-xs text-neutral-600">{timeAgo(ticket.createdAt)}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-neutral-700 tracking-widest">
                                                            #{ticket.id.slice(-6).toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Message */}
                                                    <div className="px-5 py-4">
                                                        <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                                            {ticket.message}
                                                        </p>
                                                        {ticket.imageUrl && (
                                                            <div className="mt-3">
                                                                <img
                                                                    src={ticket.imageUrl}
                                                                    alt="Lampiran"
                                                                    className="h-28 rounded-xl object-cover cursor-pointer transition-all hover:opacity-80 hover:scale-[1.01]"
                                                                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                                                                    onClick={() => window.open(ticket.imageUrl, '_blank')}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Admin reply */}
                                                    {ticket.adminReply && (
                                                        <div className="mx-4 mb-4 rounded-xl p-4"
                                                            style={{
                                                                background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))",
                                                                border: "1px solid rgba(99,102,241,0.12)"
                                                            }}>
                                                            <div className="flex items-center gap-2 mb-2.5">
                                                                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-indigo-300"
                                                                    style={{ background: "rgba(99,102,241,0.25)" }}>A</div>
                                                                <span className="text-xs font-semibold text-indigo-400 tracking-wide">Balasan Admin</span>
                                                            </div>
                                                            <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed pl-7">
                                                                {ticket.adminReply}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

            </div>
        </div>
    )
}