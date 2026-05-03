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
    { id: "suggestion", label: "Saran", icon: Lightbulb, color: "text-black", bg: "bg-[#FFFF00]" },
    { id: "bug", label: "Bug", icon: Bug, color: "text-white", bg: "bg-[#FF3300]" },
    { id: "question", label: "Pertanyaan", icon: HelpCircle, color: "text-black", bg: "bg-[#00FFFF]" },
    { id: "other", label: "Lainnya", icon: Star, color: "text-white", bg: "bg-[#FF00FF]" },
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
                text: "Menunggu", color: "text-black", bg: "bg-[#FFFF00]", Icon: Clock
            }
            case "READ": return {
                text: "Dibaca", color: "text-black", bg: "bg-[#00FFFF]", Icon: CheckCircle2
            }
            case "REPLIED": return {
                text: "Dibalas", color: "text-black", bg: "bg-[#00FF00]", Icon: MessageCircleReply
            }
            default: return {
                text: "Menunggu", color: "text-black", bg: "bg-[#E5E5E5]", Icon: Clock
            }
        }
    }

    const getReportStatusConfig = (status: string) => {
        switch (status) {
            case "PENDING": return {
                text: "Menunggu", color: "text-black", bg: "bg-[#FFFF00]", Icon: Clock
            }
            case "REVIEWED": return {
                text: "Ditinjau", color: "text-black", bg: "bg-[#00FFFF]", Icon: History
            }
            case "RESOLVED": return {
                text: "Selesai", color: "text-black", bg: "bg-[#00FF00]", Icon: CheckCircle2
            }
            case "DISMISSED": return {
                text: "Ditolak", color: "text-white", bg: "bg-[#FF3300]", Icon: X
            }
            default: return {
                text: "Menunggu", color: "text-black", bg: "bg-[#E5E5E5]", Icon: Clock
            }
        }
    }

    const selectedCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0]
    const pendingCount = tickets.filter(t => t.status === "PENDING").length
    const repliedCount = tickets.filter(t => t.status === "REPLIED").length

    return (
        <div className="min-h-screen bg-white relative pb-32">

            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000010 1px, transparent 1px), linear-gradient(90deg, #00000010 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Hero Header ── */}
                <div className="mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E5E5E5] border-[3px] border-black shadow-[4px_4px_0_#000] mb-6">
                        <span className="w-2 h-2 border-[2px] border-black bg-[#FF00FF]" />
                        <span className="text-[12px] font-black text-black uppercase tracking-widest">Support Center</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tight uppercase drop-shadow-[0_4px_0_rgba(0,0,0,1)] mb-6">
                        Pusat Bantuan & <span className="text-[#8b5cf6]">Masukan</span>
                    </h1>
                    <p className="text-[16px] font-bold text-black/70 max-w-lg leading-relaxed bg-white inline-block border-[2px] border-black p-3 shadow-[4px_4px_0_#000]">
                        Sampaikan saran, laporkan bug, atau ajukan pertanyaan. Tim kami siap merespon setiap masukan darimu.
                    </p>

                    {/* Stats row */}
                    {tickets.length > 0 && (
                        <div className="flex flex-row items-center gap-2 sm:gap-4 mt-6 sm:mt-8 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                            {[
                                { label: "Total", value: tickets.length, bg: "bg-[#818cf8]", text: "text-black" },
                                { label: "Menunggu", value: pendingCount, bg: "bg-[#f59e0b]", text: "text-black" },
                                { label: "Dibalas", value: repliedCount, bg: "bg-[#34d399]", text: "text-black" },
                            ].map((stat) => (
                                <div key={stat.label} className={`flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 border-[2px] sm:border-[3px] border-black shadow-[2px_2px_0_#000] sm:shadow-[4px_4px_0_#000] bg-white shrink-0`}>
                                    <span className={`text-[14px] sm:text-[18px] font-black ${stat.text}`}>{stat.value}</span>
                                    <span className="text-[10px] sm:text-[12px] font-bold text-black uppercase tracking-wider">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Tab Navigation ── */}
                <div className="mb-8 flex flex-row overflow-x-auto gap-2 sm:gap-4 pb-2 sm:pb-0 scrollbar-hide">
                    {[
                        { id: "create" as Tab, label: "Buat Tiket", bg: "bg-[#FF00FF]" },
                        { id: "history" as Tab, label: "Riwayat", count: tickets.length, bg: "bg-[#00FFFF]" },
                        { id: "reports" as Tab, label: "Laporan", count: reports.length, bg: "bg-[#FFFF00]" },
                    ].map(({ id, label, count, bg }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center shrink-0 gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 border-[2px] sm:border-[3px] border-black text-[12px] sm:text-[14px] font-black uppercase transition-all shadow-[2px_2px_0_#000] sm:shadow-[4px_4px_0_#000] ${
                                activeTab === id
                                    ? `${bg} text-black translate-x-[-1px] sm:translate-x-[-2px] translate-y-[-1px] sm:translate-y-[-2px] shadow-[3px_3px_0_#000] sm:shadow-[6px_6px_0_#000]`
                                    : "bg-[#E5E5E5] text-black hover:translate-x-[-1px] sm:hover:translate-x-[-2px] hover:translate-y-[-1px] sm:hover:translate-y-[-2px] hover:shadow-[3px_3px_0_#000] sm:hover:shadow-[6px_6px_0_#000]"
                            }`}
                        >
                            <span>{label}</span>
                            {count !== undefined && count > 0 && (
                                <span className="px-1.5 py-0.5 sm:px-2 border-[2px] border-black bg-white text-black text-[10px] sm:text-[12px]">
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>

                        {/* ── CREATE TAB ── */}
                        {activeTab === "create" && (
                            <motion.div
                                key="create"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <div className="bg-white border-[4px] border-black shadow-[12px_12px_0_#000]">
                                    <div className="p-6 sm:p-10">
                                        {/* Section title */}
                                        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center border-[3px] border-black bg-[#FF00FF] shadow-[2px_2px_0_#000]">
                                                    <MessageSquareText className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-[20px] font-black uppercase text-black">Tulis Pesan Baru</h2>
                                                    <p className="text-[12px] font-bold text-black/60 uppercase">Isi form di bawah ini dengan detail</p>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border-[2px] border-black bg-[#E5E5E5] shadow-[2px_2px_0_#000]">
                                                <span className="text-[10px] font-bold text-black uppercase">Response time</span>
                                                <span className="text-[12px] font-black text-[#FF3300]">&lt; 24 jam</span>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-8">
                                            {/* Category Picker */}
                                            <div>
                                                <label className="block text-[14px] font-black text-black mb-4 uppercase tracking-widest bg-[#FFFF00] border-[2px] border-black inline-block px-2 py-1 shadow-[2px_2px_0_#000]">
                                                    Kategori Masukan
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {CATEGORIES.map(({ id, label, icon: CatIcon, color, bg }) => (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            onClick={() => setCategory(id)}
                                                            className={`flex flex-col items-center gap-3 p-4 border-[3px] border-black transition-all shadow-[4px_4px_0_#000] ${
                                                                category === id 
                                                                    ? `${bg} translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0_#000]`
                                                                    : "bg-white hover:bg-[#E5E5E5] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]"
                                                            }`}
                                                        >
                                                            <div className="w-10 h-10 border-[2px] border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#000]">
                                                                <CatIcon className={`w-5 h-5 ${category === id ? "text-black" : "text-black/70"}`} />
                                                            </div>
                                                            <span className={`text-[14px] font-black uppercase ${category === id ? color : "text-black"}`}>
                                                                {label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Textarea */}
                                            <div>
                                                <label className="block text-[14px] font-black text-black mb-4 uppercase tracking-widest bg-[#00FFFF] border-[2px] border-black inline-block px-2 py-1 shadow-[2px_2px_0_#000]">
                                                    Pesan
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        placeholder={`Ceritakan ${selectedCat.label.toLowerCase()} kamu secara detail...`}
                                                        className="w-full bg-white border-[4px] border-black p-5 text-[14px] font-bold text-black placeholder:text-black/50 outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0_#000] shadow-[6px_6px_0_#000] resize-none h-48 transition-all"
                                                        required
                                                    />
                                                    {/* Char count */}
                                                    <div className="absolute bottom-4 right-5 flex items-center gap-2">
                                                        <div className="text-[12px] font-black text-black bg-[#E5E5E5] border-[2px] border-black px-2 shadow-[2px_2px_0_#000]">
                                                            {message.length}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Image Upload */}
                                            <div>
                                                <label className="block text-[14px] font-black text-black mb-4 uppercase tracking-widest bg-[#E5E5E5] border-[2px] border-black inline-block px-2 py-1 shadow-[2px_2px_0_#000]">
                                                    Lampiran Foto <span className="normal-case font-normal">(opsional)</span>
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
                                                            className="relative border-[4px] border-black shadow-[6px_6px_0_#000] bg-white group overflow-hidden"
                                                        >
                                                            <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                                                                <button type="button" onClick={removeImage}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] border-[3px] border-black text-white text-[14px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                                                                    <X className="w-4 h-4" /> Hapus
                                                                </button>
                                                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-[#FFFF00] border-[3px] border-black text-black text-[14px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                                                                    <ImageIcon className="w-4 h-4" /> Ganti
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button
                                                            key="upload"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full py-12 flex flex-col items-center justify-center gap-4 bg-[#E5E5E5] border-[4px] border-black border-dashed hover:border-solid hover:bg-[#00FF00] transition-all hover:shadow-[8px_8px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                                                        >
                                                            <div className="w-16 h-16 border-[3px] border-black bg-white flex items-center justify-center shadow-[4px_4px_0_#000]">
                                                                <ImageIcon className="w-8 h-8 text-black" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[16px] font-black uppercase text-black">
                                                                    Klik untuk upload foto
                                                                </p>
                                                                <p className="text-[12px] font-bold text-black/60 mt-1 uppercase">JPG, PNG, WebP · Maks 5MB</p>
                                                            </div>
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !message.trim()}
                                                className="w-full py-4 bg-[#6366f1] text-white border-[4px] border-black text-[18px] font-black uppercase shadow-[8px_8px_0_#000] flex items-center justify-center gap-3 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? (
                                                    <><Loader2 className="w-6 h-6 animate-spin" /> Mengirim...</>
                                                ) : (
                                                    <><Send className="w-6 h-6" /> Kirim Tiket</>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Info note */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-center text-[12px] font-bold text-black bg-[#E5E5E5] border-[2px] border-black inline-block mt-6 px-4 py-2 shadow-[2px_2px_0_#000] mx-auto w-fit block"
                                >
                                    Tiket bersifat pribadi dan hanya dapat dilihat oleh kamu dan admin
                                </motion.p>
                            </motion.div>
                        )}

                        {/* ── HISTORY TAB ── */}
                        {activeTab === "history" && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="bg-[#FFFF00] border-[3px] border-black px-4 py-2 shadow-[4px_4px_0_#000]">
                                        <h2 className="text-[20px] font-black uppercase text-black">Riwayat Tiket</h2>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-28 gap-4">
                                        <div className="w-16 h-16 border-[4px] border-black bg-[#00FFFF] shadow-[4px_4px_0_#000] flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-black animate-spin" />
                                        </div>
                                        <span className="text-[14px] font-black uppercase text-black">Memuat tiket...</span>
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] py-20 px-8 text-center">
                                        <div className="w-20 h-20 border-[4px] border-black bg-[#FF00FF] shadow-[4px_4px_0_#000] mx-auto mb-6 flex items-center justify-center">
                                            <Inbox className="w-10 h-10 text-white" />
                                        </div>
                                        <p className="text-[24px] font-black uppercase text-black">Belum ada tiket</p>
                                        <p className="text-[14px] font-bold text-black/60 mt-2 max-w-sm mx-auto leading-relaxed">
                                            Kamu belum pernah mengirim tiket. Mulai dengan membuat tiket pertamamu!
                                        </p>
                                        <button
                                            onClick={() => setActiveTab("create")}
                                            className="mt-8 inline-flex items-center gap-2 px-6 py-3 border-[3px] border-black bg-[#00FF00] text-[14px] font-black uppercase shadow-[4px_4px_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Buat Tiket
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {tickets.map((ticket, i) => {
                                            const status = getStatusConfig(ticket.status)
                                            const StatusIcon = status.Icon
                                            const isExpanded = expandedTicket === ticket.id

                                            return (
                                                <div
                                                    key={ticket.id}
                                                    className={`bg-white border-[4px] border-black transition-all cursor-pointer ${isExpanded ? "shadow-[8px_8px_0_#000] translate-x-[-2px] translate-y-[-2px]" : "shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"}`}
                                                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                                >
                                                    {/* Ticket Header */}
                                                    <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                                        <div className="flex flex-wrap items-center gap-4 flex-1">
                                                            {/* Status badge */}
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 border-[2px] border-black ${status.bg} ${status.color} shrink-0 shadow-[2px_2px_0_#000]`}>
                                                                <StatusIcon className="w-4 h-4" />
                                                                <span className="text-[12px] font-black uppercase">{status.text}</span>
                                                            </div>
                                                            {/* Ticket ID + time */}
                                                            <div>
                                                                <span className="text-[14px] font-black uppercase text-black bg-[#E5E5E5] px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0_#000] mr-3">
                                                                    #{ticket.id.slice(-6).toUpperCase()}
                                                                </span>
                                                                <span className="text-[12px] font-bold text-black/60 uppercase">{timeAgo(ticket.createdAt)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Right: expand chevron */}
                                                        <div className="flex items-center gap-3">
                                                            {ticket.adminReply && (
                                                                <span className="text-[10px] font-black uppercase bg-[#00FF00] border-[2px] border-black text-black px-2 py-1 shadow-[2px_2px_0_#000]">
                                                                    Ada balasan
                                                                </span>
                                                            )}
                                                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                                                <ChevronRight className="w-6 h-6 text-black" />
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {/* Message preview (collapsed) */}
                                                    {!isExpanded && (
                                                        <div className="px-5 pb-5">
                                                            <p className="text-[14px] font-bold text-black/80 line-clamp-2 leading-relaxed">
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
                                                                transition={{ duration: 0.2 }}
                                                                style={{ overflow: "hidden" }}
                                                            >
                                                                <div className="mx-5 mb-5 p-5 bg-[#E5E5E5] border-[3px] border-black shadow-[4px_4px_0_#000]">
                                                                    <p className="text-[14px] font-bold text-black whitespace-pre-wrap leading-relaxed">
                                                                        {ticket.message}
                                                                    </p>
                                                                    {ticket.imageUrl && (
                                                                        <div className="mt-4">
                                                                            <img
                                                                                src={ticket.imageUrl}
                                                                                alt="Lampiran"
                                                                                className="max-h-64 border-[3px] border-black shadow-[4px_4px_0_#000] object-cover cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                                                                                onClick={(e) => { e.stopPropagation(); window.open(ticket.imageUrl, "_blank") }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Admin Reply */}
                                                                {ticket.adminReply && (
                                                                    <div className="mx-5 mb-5 p-5 bg-[#00FF00] border-[3px] border-black shadow-[4px_4px_0_#000]">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <div className="w-8 h-8 border-[2px] border-black bg-white flex items-center justify-center text-[14px] font-black text-black shadow-[2px_2px_0_#000]">
                                                                                A
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-[14px] font-black uppercase text-black">Admin</span>
                                                                                <span className="text-[10px] font-bold text-black/70 ml-2 uppercase">membalas tiketmu</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[14px] font-bold text-black whitespace-pre-wrap leading-relaxed">
                                                                            {ticket.adminReply}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
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
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="bg-[#00FFFF] border-[3px] border-black px-4 py-2 shadow-[4px_4px_0_#000]">
                                        <h2 className="text-[20px] font-black uppercase text-black">Laporan Memory</h2>
                                    </div>
                                </div>

                                {isLoadingReports ? (
                                    <div className="flex flex-col items-center justify-center py-28 gap-4">
                                        <div className="w-16 h-16 border-[4px] border-black bg-[#FF00FF] shadow-[4px_4px_0_#000] flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                        <span className="text-[14px] font-black uppercase text-black">Memuat laporan...</span>
                                    </div>
                                ) : reports.length === 0 ? (
                                    <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] py-20 px-8 text-center">
                                        <div className="w-20 h-20 border-[4px] border-black bg-[#FF3300] shadow-[4px_4px_0_#000] mx-auto mb-6 flex items-center justify-center">
                                            <Flag className="w-10 h-10 text-white" />
                                        </div>
                                        <p className="text-[24px] font-black uppercase text-black">Belum ada laporan</p>
                                        <p className="text-[14px] font-bold text-black/60 mt-2 max-w-sm mx-auto leading-relaxed">
                                            Kamu belum pernah melaporkan memory.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {reports.map((report, i) => {
                                            const status = getReportStatusConfig(report.status)
                                            const StatusIcon = status.Icon
                                            const isExpanded = expandedReport === report.id

                                            return (
                                                <div
                                                    key={report.id}
                                                    className={`bg-white border-[4px] border-black transition-all cursor-pointer ${isExpanded ? "shadow-[8px_8px_0_#000] translate-x-[-2px] translate-y-[-2px]" : "shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"}`}
                                                    onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                                                >
                                                    <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                                        <div className="flex flex-wrap items-center gap-4 flex-1">
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 border-[2px] border-black ${status.bg} ${status.color} shrink-0 shadow-[2px_2px_0_#000]`}>
                                                                <StatusIcon className="w-4 h-4" />
                                                                <span className="text-[12px] font-black uppercase">{status.text}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[14px] font-black uppercase text-black bg-[#E5E5E5] px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0_#000] mr-3 inline-block mb-1">
                                                                    Memory: {report.memory?.title || "Dihapus"}
                                                                </span>
                                                                <p className="text-[12px] font-bold text-black/60 uppercase">{timeAgo(report.createdAt)} &bull; Alasan: {report.reason}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                                                <ChevronRight className="w-6 h-6 text-black" />
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {!isExpanded && report.details && (
                                                        <div className="px-5 pb-5">
                                                            <p className="text-[14px] font-bold text-black/80 line-clamp-1 leading-relaxed">
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
                                                                transition={{ duration: 0.2 }}
                                                                style={{ overflow: "hidden" }}
                                                            >
                                                                <div className="mx-5 mb-5 p-5 bg-[#E5E5E5] border-[3px] border-black shadow-[4px_4px_0_#000]">
                                                                    <p className="text-[14px] font-bold text-black whitespace-pre-wrap leading-relaxed">
                                                                        {report.details ? report.details : "Tidak ada detail tambahan"}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
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