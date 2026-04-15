"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
    MessageSquareText, Image as ImageIcon, X, Send,
    Loader2, Sparkles, History, ChevronRight,
    Lightbulb, Bug, HelpCircle, Star, Clock, CheckCircle2,
    MessageCircleReply, ArrowUpRight, TicketCheck, Inbox, Flag
} from "lucide-react"
import { timeAgo } from "@/lib/utils"
import toast from "react-hot-toast"

type Tab = "create" | "history" | "reports"

const CATEGORIES = [
    { id: "suggestion", label: "Saran", icon: Lightbulb, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
    { id: "bug", label: "Bug", icon: Bug, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
    { id: "question", label: "Pertanyaan", icon: HelpCircle, color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
    { id: "other", label: "Lainnya", icon: Star, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)" },
]

export default function FeedbacksPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState<Tab>("create")
    const [message, setMessage] = useState("")
    const [category, setCategory] = useState("suggestion")
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [reports, setReports] = useState<any[]>([])
    const [isLoadingReports, setIsLoadingReports] = useState(true)
    const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
    const [expandedReport, setExpandedReport] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { fetchTickets(); fetchReports() }, [])

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/reports")
            if (res.ok) {
                const data = await res.json()
                setReports(data)
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error)
        } finally {
            setIsLoadingReports(false)
        }
    }

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
            if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran gambar maksimal 5MB"); return }
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImage(null); setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("message", message)
            formData.append("category", category)
            if (image) formData.append("image", image)

            const res = await fetch("/api/feedbacks", { method: "POST", body: formData })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || "Gagal mengirim tiket")
            }
            toast.success("Tiket berhasil dikirim!")
            setMessage(""); removeImage()
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
            case "PENDING": return {
                text: "Menunggu", color: "text-amber-400", bg: "bg-amber-400/10",
                dot: "bg-amber-400", borderColor: "rgba(251,191,36,0.25)",
                Icon: Clock, glow: "rgba(251,191,36,0.15)"
            }
            case "READ": return {
                text: "Dibaca", color: "text-sky-400", bg: "bg-sky-400/10",
                dot: "bg-sky-400", borderColor: "rgba(56,189,248,0.25)",
                Icon: CheckCircle2, glow: "rgba(56,189,248,0.15)"
            }
            case "REPLIED": return {
                text: "Dibalas", color: "text-emerald-400", bg: "bg-emerald-400/10",
                dot: "bg-emerald-400", borderColor: "rgba(52,211,153,0.25)",
                Icon: MessageCircleReply, glow: "rgba(52,211,153,0.15)"
            }
            default: return {
                text: "Menunggu", color: "text-neutral-400", bg: "bg-neutral-800",
                dot: "bg-neutral-500", borderColor: "rgba(115,115,115,0.2)",
                Icon: Clock, glow: "rgba(115,115,115,0.1)"
            }
        }
    }

    const getReportStatusConfig = (status: string) => {
        switch (status) {
            case "PENDING": return {
                text: "Menunggu", color: "text-amber-400", bg: "bg-amber-400/10",
                borderColor: "rgba(251,191,36,0.25)", Icon: Clock
            }
            case "REVIEWED": return {
                text: "Ditinjau", color: "text-sky-400", bg: "bg-sky-400/10",
                borderColor: "rgba(56,189,248,0.25)", Icon: History
            }
            case "RESOLVED": return {
                text: "Selesai", color: "text-emerald-400", bg: "bg-emerald-400/10",
                borderColor: "rgba(52,211,153,0.25)", Icon: CheckCircle2
            }
            case "DISMISSED": return {
                text: "Ditolak", color: "text-red-400", bg: "bg-red-400/10",
                borderColor: "rgba(248,113,113,0.25)", Icon: X
            }
            default: return {
                text: "Menunggu", color: "text-neutral-400", bg: "bg-neutral-800",
                borderColor: "rgba(115,115,115,0.2)", Icon: Clock
            }
        }
    }

    const selectedCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0]
    const pendingCount = tickets.filter(t => t.status === "PENDING").length
    const repliedCount = tickets.filter(t => t.status === "REPLIED").length

    return (
        <div className="min-h-screen" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
                <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)" }} />
                <div className="absolute bottom-[0%] left-[20%] w-[500px] h-[500px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%)" }} />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                        backgroundSize: "64px 64px"
                    }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-32">

                {/* ── Hero Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-10"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                        style={{
                            background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.2)",
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-[11px] font-semibold text-indigo-400 tracking-widest uppercase">Support Center</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                        Pusat Bantuan &{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #818cf8, #c084fc)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>Masukan</span>
                    </h1>
                    <p className="text-sm text-neutral-400 max-w-md leading-relaxed">
                        Sampaikan saran, laporkan bug, atau ajukan pertanyaan. Tim kami siap merespon setiap masukan darimu.
                    </p>

                    {/* Stats row */}
                    {tickets.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-3 mt-5"
                        >
                            {[
                                { label: "Total Tiket", value: tickets.length, color: "#818cf8" },
                                { label: "Menunggu", value: pendingCount, color: "#f59e0b" },
                                { label: "Dibalas", value: repliedCount, color: "#34d399" },
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <span className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</span>
                                    <span className="text-[11px] text-neutral-600">{stat.label}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                {/* ── Tab Navigation ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="inline-flex items-center p-1 rounded-2xl gap-1"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                        }}>
                        {[
                            { id: "create" as Tab, label: "Buat Tiket" },
                            { id: "history" as Tab, label: "Riwayat Tiket", count: tickets.length },
                            { id: "reports" as Tab, label: "Laporan", count: reports.length },
                        ].map(({ id, label, count }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                                style={{
                                    color: activeTab === id ? "#fff" : "rgba(115,115,115,1)",
                                }}
                            >
                                {activeTab === id && (
                                    <motion.div
                                        layoutId="tab-bg"
                                        className="absolute inset-0 rounded-xl"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                <span className="relative flex items-center gap-2">
                                    {label}
                                    {count !== undefined && count > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                            style={{
                                                background: activeTab === id ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.15)",
                                                color: activeTab === id ? "#fff" : "#a5b4fc"
                                            }}>
                                            {count}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── Tab Content ── */}
                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>

                        {/* ── CREATE TAB ── */}
                        {activeTab === "create" && (
                            <motion.div
                                key="create"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <div className="rounded-3xl overflow-hidden"
                                    style={{
                                        background: "linear-gradient(160deg, rgba(20,20,30,0.9), rgba(10,10,15,0.95))",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        backdropFilter: "blur(24px)",
                                    }}>
                                    {/* Top accent line */}
                                    <div className="h-px"
                                        style={{ background: "linear-gradient(90deg, transparent 0%, #6366f1 30%, #8b5cf6 60%, transparent 100%)" }} />

                                    <div className="p-6 sm:p-8">
                                        {/* Section title */}
                                        <div className="flex items-center justify-between mb-7">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.2)" }}>
                                                    <MessageSquareText className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-bold text-white">Tulis Pesan Baru</h2>
                                                    <p className="text-[11px] text-neutral-600 mt-0.5">Isi form di bawah ini dengan detail</p>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}>
                                                <span className="text-[10px] text-indigo-400/70">Response time</span>
                                                <span className="text-[10px] font-bold text-indigo-400">&lt; 24 jam</span>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-5">

                                            {/* Category Picker */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-3 tracking-wide uppercase">
                                                    Kategori Masukan
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {CATEGORIES.map(({ id, label, icon: CatIcon, color, bg, border }) => (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            onClick={() => setCategory(id)}
                                                            className="relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl transition-all duration-200"
                                                            style={{
                                                                background: category === id ? bg : "rgba(255,255,255,0.02)",
                                                                border: `1px solid ${category === id ? border : "rgba(255,255,255,0.06)"}`,
                                                                transform: category === id ? "scale(1.02)" : "scale(1)",
                                                            }}
                                                        >
                                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                                                style={{ background: category === id ? bg : "rgba(255,255,255,0.04)" }}>
                                                                <CatIcon className="w-4 h-4" style={{ color: category === id ? color : "rgba(115,115,115,1)" }} />
                                                            </div>
                                                            <span className="text-xs font-semibold"
                                                                style={{ color: category === id ? color : "rgba(115,115,115,1)" }}>
                                                                {label}
                                                            </span>
                                                            {category === id && (
                                                                <motion.div
                                                                    layoutId="cat-indicator"
                                                                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                                                                    style={{ background: color }}
                                                                    transition={{ type: "spring", bounce: 0.3 }}
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

                                            {/* Textarea */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-3 tracking-wide uppercase">
                                                    Pesan
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        placeholder={`Ceritakan ${selectedCat.label.toLowerCase()} kamu secara detail...`}
                                                        className="w-full rounded-2xl px-5 py-4 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none resize-none h-44 transition-all duration-200"
                                                        style={{
                                                            background: "rgba(0,0,0,0.4)",
                                                            border: `1px solid ${message ? selectedCat.border : "rgba(255,255,255,0.07)"}`,
                                                            boxShadow: message ? `0 0 0 3px ${selectedCat.bg}` : "none",
                                                            lineHeight: "1.8",
                                                        }}
                                                        required
                                                    />
                                                    {/* Char count */}
                                                    <div className="absolute bottom-3.5 right-4 flex items-center gap-2">
                                                        <div className="text-[10px] text-neutral-700 tabular-nums">
                                                            {message.length}
                                                        </div>
                                                        {message.length > 0 && (
                                                            <div className="w-1 h-1 rounded-full"
                                                                style={{ background: message.length > 10 ? selectedCat.color : "rgba(115,115,115,0.5)" }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Image Upload */}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-500 mb-3 tracking-wide uppercase">
                                                    Lampiran Foto <span className="normal-case font-normal text-neutral-700">(opsional)</span>
                                                </label>
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
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="relative rounded-2xl overflow-hidden group"
                                                            style={{ border: "1px solid rgba(99,102,241,0.25)" }}
                                                        >
                                                            <img src={imagePreview} alt="Preview" className="w-full h-44 object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                                                                <button type="button" onClick={removeImage}
                                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/90 text-white rounded-xl text-xs font-semibold hover:bg-red-400 transition-colors">
                                                                    <X className="w-3.5 h-3.5" /> Hapus
                                                                </button>
                                                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                                                                    style={{ background: "rgba(255,255,255,0.15)" }}>
                                                                    <ImageIcon className="w-3.5 h-3.5" /> Ganti
                                                                </button>
                                                            </div>
                                                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-white/70"
                                                                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                                                                <ImageIcon className="w-3 h-3" />
                                                                Foto terlampir
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button
                                                            key="upload"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full py-8 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200 group"
                                                            style={{
                                                                background: "rgba(255,255,255,0.015)",
                                                                border: "1.5px dashed rgba(255,255,255,0.08)",
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"
                                                                e.currentTarget.style.background = "rgba(99,102,241,0.04)"
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                                                                e.currentTarget.style.background = "rgba(255,255,255,0.015)"
                                                            }}
                                                        >
                                                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200"
                                                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                                                <ImageIcon className="w-5 h-5 text-neutral-600 group-hover:text-indigo-400 transition-colors duration-200" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs font-semibold text-neutral-500 group-hover:text-neutral-300 transition-colors duration-200">
                                                                    Klik untuk upload foto
                                                                </p>
                                                                <p className="text-[10px] text-neutral-700 mt-1">JPG, PNG, WebP · Maks 5MB</p>
                                                            </div>
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !message.trim()}
                                                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group"
                                                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                                            >
                                                {/* Hover shine */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{ background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)" }} />
                                                {/* Glow */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }} />
                                                <span className="relative flex items-center gap-2.5">
                                                    {isSubmitting ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" />Mengirim tiket...</>
                                                    ) : (
                                                        <><Send className="w-4 h-4" />Kirim Tiket<ArrowUpRight className="w-3.5 h-3.5 opacity-70" /></>
                                                    )}
                                                </span>
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Info note */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-center text-[11px] text-neutral-700 mt-4"
                                >
                                    Tiket bersifat pribadi dan hanya dapat dilihat oleh kamu dan admin
                                </motion.p>
                            </motion.div>
                        )}

                        {/* ── HISTORY TAB ── */}
                        {activeTab === "history" && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-base font-bold text-white">Riwayat Tiket</h2>
                                        <p className="text-xs text-neutral-600 mt-0.5">Semua tiket yang pernah kamu kirim</p>
                                    </div>
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold text-indigo-300"
                                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                                        {tickets.length} tiket
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-28 gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
                                                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                            </div>
                                        </div>
                                        <span className="text-xs text-neutral-600">Memuat tiket kamu...</span>
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-3xl py-20 px-8 text-center"
                                        style={{
                                            background: "linear-gradient(160deg, rgba(20,20,30,0.6), rgba(10,10,15,0.8))",
                                            border: "1.5px dashed rgba(255,255,255,0.06)"
                                        }}
                                    >
                                        <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))",
                                                border: "1px solid rgba(99,102,241,0.15)"
                                            }}>
                                            <Inbox className="w-7 h-7" style={{ color: "rgba(99,102,241,0.5)" }} />
                                        </div>
                                        <p className="text-base font-semibold text-neutral-400">Belum ada tiket</p>
                                        <p className="text-xs text-neutral-600 mt-2 max-w-xs mx-auto leading-relaxed">
                                            Kamu belum pernah mengirim tiket. Mulai dengan membuat tiket pertamamu!
                                        </p>
                                        <button
                                            onClick={() => setActiveTab("create")}
                                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Buat Tiket Sekarang
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-3">
                                        {tickets.map((ticket, i) => {
                                            const status = getStatusConfig(ticket.status)
                                            const StatusIcon = status.Icon
                                            const isExpanded = expandedTicket === ticket.id

                                            return (
                                                <motion.div
                                                    key={ticket.id}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                                    className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200"
                                                    style={{
                                                        background: "linear-gradient(160deg, rgba(18,18,25,0.9), rgba(10,10,15,0.95))",
                                                        border: `1px solid ${isExpanded ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)"}`,
                                                        backdropFilter: "blur(16px)",
                                                        boxShadow: isExpanded ? "0 0 0 1px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.3)" : "none"
                                                    }}
                                                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                                >
                                                    {/* Status indicator line */}
                                                    <div className="h-0.5"
                                                        style={{
                                                            background: ticket.status === "REPLIED"
                                                                ? "linear-gradient(90deg, transparent, #34d399, transparent)"
                                                                : ticket.status === "READ"
                                                                    ? "linear-gradient(90deg, transparent, #38bdf8, transparent)"
                                                                    : "transparent"
                                                        }} />

                                                    {/* Ticket Header */}
                                                    <div className="px-5 py-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            {/* Status badge */}
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${status.bg} ${status.color} shrink-0`}
                                                                style={{ border: `1px solid ${status.borderColor}` }}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {status.text}
                                                            </div>
                                                            {/* Ticket ID + time */}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-mono font-bold text-neutral-600 tracking-widest">
                                                                        #{ticket.id.slice(-6).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-neutral-600 mt-0.5">{timeAgo(ticket.createdAt)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Right: expand chevron */}
                                                        <div className="flex items-center gap-2">
                                                            {ticket.adminReply && (
                                                                <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full"
                                                                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.15)" }}>
                                                                    Ada balasan
                                                                </span>
                                                            )}
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {/* Message preview (collapsed) */}
                                                    {!isExpanded && (
                                                        <div className="px-5 pb-4">
                                                            <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                                                                {ticket.message}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Expanded content */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                                                style={{ overflow: "hidden" }}
                                                            >
                                                                <div className="mx-4 mb-4 rounded-2xl p-4"
                                                                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                                                    <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                                                        {ticket.message}
                                                                    </p>
                                                                    {ticket.imageUrl && (
                                                                        <div className="mt-3">
                                                                            <img
                                                                                src={ticket.imageUrl}
                                                                                alt="Lampiran"
                                                                                className="h-36 rounded-xl object-cover cursor-pointer transition-all hover:opacity-90 hover:scale-[1.01]"
                                                                                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                                                                onClick={(e) => { e.stopPropagation(); window.open(ticket.imageUrl, "_blank") }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Admin Reply */}
                                                                {ticket.adminReply && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: 0.1 }}
                                                                        className="mx-4 mb-4 rounded-2xl p-4"
                                                                        style={{
                                                                            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))",
                                                                            border: "1px solid rgba(99,102,241,0.15)"
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-2.5 mb-3">
                                                                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-indigo-300"
                                                                                style={{
                                                                                    background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))",
                                                                                    border: "1px solid rgba(99,102,241,0.2)"
                                                                                }}>A</div>
                                                                            <div>
                                                                                <span className="text-xs font-bold text-indigo-400">Admin</span>
                                                                                <span className="text-[10px] text-neutral-600 ml-2">membalas tiketmu</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed pl-8">
                                                                            {ticket.adminReply}
                                                                        </p>
                                                                    </motion.div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── REPORTS TAB ── */}
                        {activeTab === "reports" && (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-base font-bold text-white">Laporan Memory</h2>
                                        <p className="text-xs text-neutral-600 mt-0.5">Riwayat laporan memory yang kamu buat</p>
                                    </div>
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold text-indigo-300"
                                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                                        {reports.length} laporan
                                    </span>
                                </div>

                                {isLoadingReports ? (
                                    <div className="flex flex-col items-center justify-center py-28 gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
                                                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                            </div>
                                        </div>
                                        <span className="text-xs text-neutral-600">Memuat laporan...</span>
                                    </div>
                                ) : reports.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-3xl py-20 px-8 text-center"
                                        style={{
                                            background: "linear-gradient(160deg, rgba(20,20,30,0.6), rgba(10,10,15,0.8))",
                                            border: "1.5px dashed rgba(255,255,255,0.06)"
                                        }}
                                    >
                                        <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))",
                                                border: "1px solid rgba(99,102,241,0.15)"
                                            }}>
                                            <Flag className="w-7 h-7" style={{ color: "rgba(99,102,241,0.5)" }} />
                                        </div>
                                        <p className="text-base font-semibold text-neutral-400">Belum ada laporan</p>
                                        <p className="text-xs text-neutral-600 mt-2 max-w-xs mx-auto leading-relaxed">
                                            Kamu belum pernah melaporkan memory.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-3">
                                        {reports.map((report, i) => {
                                            const status = getReportStatusConfig(report.status)
                                            const StatusIcon = status.Icon
                                            const isExpanded = expandedReport === report.id

                                            return (
                                                <motion.div
                                                    key={report.id}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                                    className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200"
                                                    style={{
                                                        background: "linear-gradient(160deg, rgba(18,18,25,0.9), rgba(10,10,15,0.95))",
                                                        border: `1px solid ${isExpanded ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)"}`,
                                                        backdropFilter: "blur(16px)",
                                                        boxShadow: isExpanded ? "0 0 0 1px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.3)" : "none"
                                                    }}
                                                    onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                                                >
                                                    <div className="px-5 py-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${status.bg} ${status.color} shrink-0`}
                                                                style={{ border: `1px solid ${status.borderColor}` }}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {status.text}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-white truncate">
                                                                        Memory: {report.memory?.title || "Memory Dihapus"}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-neutral-500 mt-0.5">{timeAgo(report.createdAt)} &bull; Alasan: {report.reason}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {!isExpanded && report.details && (
                                                        <div className="px-5 pb-4">
                                                            <p className="text-sm text-neutral-500 line-clamp-1 leading-relaxed">
                                                                {report.details}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                                                style={{ overflow: "hidden" }}
                                                            >
                                                                <div className="mx-4 mb-4 rounded-2xl p-4"
                                                                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                                                    <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                                                        {report.details ? report.details : "Tidak ada detail tambahan"}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
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