"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, User, Clock, CheckCircle2, Trash2,
    MessageCircleReply, Image as ImageIcon, X, Send,
    Lightbulb, Bug, HelpCircle, Star, MessageSquare,
    Inbox, ChevronRight, ChevronDown
} from "lucide-react"
import { timeAgo } from "@/lib/utils"
import toast from "react-hot-toast"

type CategoryFilter = "ALL" | "SUGGESTION" | "BUG" | "QUESTION" | "OTHER"

const CATEGORY_CONFIG: Record<string, {
    label: string; color: string; bg: string; border: string; Icon: React.ElementType<{ className?: string }>
}> = {
    SUGGESTION: { label: "Saran",      color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/25",  Icon: Lightbulb  },
    BUG:        { label: "Bug",         color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/25",    Icon: Bug        },
    QUESTION:   { label: "Pertanyaan", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/25", Icon: HelpCircle },
    OTHER:      { label: "Lainnya",    color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/25", Icon: Star       },
}

const FILTER_TABS: { id: CategoryFilter; label: string }[] = [
    { id: "ALL",        label: "Semua"      },
    { id: "SUGGESTION", label: "Saran"      },
    { id: "BUG",        label: "Bug"        },
    { id: "QUESTION",   label: "Pertanyaan" },
    { id: "OTHER",      label: "Lainnya"    },
]

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
    PENDING: { label: "Pending", dot: "bg-amber-400",   text: "text-amber-400"  },
    READ:    { label: "Dibaca",  dot: "bg-blue-400",    text: "text-blue-400"   },
    REPLIED: { label: "Dibalas", dot: "bg-emerald-400", text: "text-emerald-400"},
}

export default function AdminFeedbacksPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [feedbacks, setFeedbacks]           = useState<any[]>([])
    const [loading, setLoading]               = useState(true)
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
    const [selectedId, setSelectedId]         = useState<string | null>(null)   // desktop
    const [expandedId, setExpandedId]         = useState<string | null>(null)   // mobile accordion
    const [replyingTo, setReplyingTo]         = useState<string | null>(null)
    const [replyText, setReplyText]           = useState("")
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard"); return
        }
        if (status === "authenticated" && session.user.role === "ADMIN") fetchFeedbacks()
    }, [status, session, router])

    const fetchFeedbacks = async () => {
        try {
            const res = await fetch("/api/admin/feedbacks")
            if (!res.ok) throw new Error("Failed")
            setFeedbacks(await res.json())
        } catch { toast.error("Gagal mengambil data tiket") }
        finally  { setLoading(false) }
    }

    const handleUpdateStatus = async (id: string, newStatus: string, replyMessage?: string) => {
        setIsSubmittingReply(true)
        try {
            const body: any = { status: newStatus }
            if (replyMessage !== undefined) body.adminReply = replyMessage
            const res = await fetch(`/api/admin/feedbacks/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Failed") }
            const updated = await res.json()
            setFeedbacks(prev => prev.map(f => f.id === id ? updated : f))
            toast.success(replyMessage ? "Balasan terkirim!" : "Status diperbarui")
            if (replyMessage) { setReplyingTo(null); setReplyText("") }
        } catch (e: any) { toast.error(e.message || "Gagal") }
        finally { setIsSubmittingReply(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus tiket ini permanen?")) return
        try {
            const res = await fetch(`/api/admin/feedbacks/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")
            setFeedbacks(prev => prev.filter(f => f.id !== id))
            if (selectedId === id) setSelectedId(null)
            if (expandedId === id) setExpandedId(null)
            toast.success("Tiket dihapus")
        } catch { toast.error("Gagal menghapus") }
    }

    const filtered = categoryFilter === "ALL"
        ? feedbacks
        : feedbacks.filter(f => (f.category ?? "SUGGESTION") === categoryFilter)

    const countFor = (cat: CategoryFilter) =>
        cat === "ALL" ? feedbacks.length : feedbacks.filter(f => (f.category ?? "SUGGESTION") === cat).length

    const selectedItem = filtered.find(f => f.id === selectedId) ?? null

    const stats = {
        total:   feedbacks.length,
        pending: feedbacks.filter(f => f.status === "PENDING").length,
        replied: feedbacks.filter(f => f.status === "REPLIED").length,
    }

    const toggleMobileExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null)
            setReplyingTo(null)
            setReplyText("")
        } else {
            setExpandedId(id)
            setReplyingTo(null)
            setReplyText("")
        }
    }

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-sm text-neutral-600">Memuat tiket...</p>
            </div>
        </div>
    )

    // ── Reusable detail content (used in both desktop pane & mobile accordion) ──
    const DetailContent = ({ item }: { item: any }) => {
        const isReplied = item.status === "REPLIED"
        const isRead    = item.status === "READ" || isReplied
        const cat       = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
        const CatIcon   = cat.Icon
        const st        = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING

        return (
            <div className="space-y-4">
                {/* User info row (only shown in mobile accordion, hidden on desktop pane header) */}
                <div className="flex items-center justify-between gap-3 lg:hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${cat.color} ${cat.bg} ${cat.border}`}>
                            <CatIcon className="w-2.5 h-2.5" />{cat.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                            item.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : item.status === "READ"  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                    </div>
                    <span className="text-[11px] text-neutral-600 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(item.createdAt)}
                    </span>
                </div>

                {/* Message */}
                <div className="rounded-xl bg-neutral-950/60 border border-white/[0.04] p-4">
                    <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{item.message}</p>
                </div>

                {/* Image attachment */}
                {item.imageUrl && (
                    <div>
                        <p className="text-[11px] font-semibold text-neutral-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <ImageIcon className="w-3.5 h-3.5" /> Lampiran
                        </p>
                        <img
                            src={item.imageUrl} alt="Lampiran"
                            className="h-44 w-full object-cover rounded-xl border border-white/[0.05] cursor-pointer hover:border-white/[0.12] transition-colors"
                            onClick={() => window.open(item.imageUrl, "_blank")}
                        />
                    </div>
                )}

                {/* Admin reply — already replied */}
                {isReplied && (
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-emerald-500/10 flex items-center gap-2">
                            <MessageCircleReply className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Balasan Admin</span>
                        </div>
                        <p className="px-4 py-3 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{item.adminReply}</p>
                    </div>
                )}

                {/* Reply compose */}
                {!isReplied && replyingTo === item.id && (
                    <div className="rounded-xl border border-indigo-500/25 bg-neutral-950/70 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-indigo-500/15 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageCircleReply className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Tulis Balasan</span>
                            </div>
                            <button
                                onClick={() => { setReplyingTo(null); setReplyText("") }}
                                className="p-1 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Tuliskan balasan atau solusi untuk pengguna..."
                                className="w-full bg-neutral-900/80 border border-white/[0.06] rounded-xl px-3.5 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/30 resize-none h-28 transition-all"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleUpdateStatus(item.id, "REPLIED", replyText)}
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors"
                                >
                                    {isSubmittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Kirim Balasan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer actions */}
                <div className="flex items-center gap-2 pt-1">
                    {!isReplied && (
                        <button
                            onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                replyingTo === item.id
                                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/35"
                                    : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20"
                            }`}
                        >
                            <MessageCircleReply className="w-3.5 h-3.5" />
                            {replyingTo === item.id ? "Tutup" : "Balas Tiket"}
                        </button>
                    )}
                    {!isRead && (
                        <button
                            onClick={() => handleUpdateStatus(item.id, "READ")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-white/[0.05] transition-all"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tandai Dibaca
                        </button>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold tracking-widest text-neutral-600 uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-2xl lg:text-[28px] font-[Outfit] font-bold text-white tracking-tight leading-tight">
                        Manajemen Tiket & Bantuan
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">Saran, kritik, dan keluhan yang dikirim pengguna.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/[0.06] text-center">
                        <p className="text-lg font-bold text-white leading-none">{stats.total}</p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">Total</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/15 text-center">
                        <p className="text-lg font-bold text-amber-400 leading-none">{stats.pending}</p>
                        <p className="text-[10px] text-amber-500/70 mt-0.5">Pending</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15 text-center">
                        <p className="text-lg font-bold text-emerald-400 leading-none">{stats.replied}</p>
                        <p className="text-[10px] text-emerald-500/70 mt-0.5">Dibalas</p>
                    </div>
                </div>
            </div>

            {/* ── Category Filter ── */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTER_TABS.map(({ id, label }) => {
                    const cfg    = id !== "ALL" ? CATEGORY_CONFIG[id] : null
                    const isActive = categoryFilter === id
                    const Icon   = cfg?.Icon
                    return (
                        <button
                            key={id}
                            onClick={() => { setCategoryFilter(id); setSelectedId(null); setExpandedId(null) }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border ${
                                isActive
                                    ? cfg ? `${cfg.color} ${cfg.bg} ${cfg.border}` : "text-white bg-indigo-500/15 border-indigo-500/35"
                                    : "text-neutral-500 bg-neutral-900/50 border-white/[0.05] hover:text-neutral-300 hover:border-white/[0.1]"
                            }`}
                        >
                            {Icon && <Icon className="w-3 h-3" />}
                            {label}
                            <span className={`ml-0.5 min-w-[18px] text-center px-1 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/10" : "bg-neutral-800 text-neutral-500"}`}>
                                {countFor(id)}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border border-white/[0.04] rounded-2xl bg-neutral-900/30">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 border border-white/[0.05] flex items-center justify-center mb-4">
                        <Inbox className="w-7 h-7 text-neutral-600" />
                    </div>
                    <p className="text-neutral-300 font-medium">Tidak ada tiket</p>
                    <p className="text-neutral-600 text-sm mt-1">
                        {categoryFilter === "ALL" ? "Belum ada tiket masuk." : `Tidak ada tiket kategori "${CATEGORY_CONFIG[categoryFilter]?.label}".`}
                    </p>
                </div>
            ) : (
                <>
                    {/* ══════════════════════════════════════════
                        MOBILE — Accordion list (< lg)
                    ══════════════════════════════════════════ */}
                    <div className="lg:hidden space-y-2">
                        {filtered.map((item) => {
                            const cat       = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
                            const CatIcon   = cat.Icon
                            const st        = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING
                            const isOpen    = expandedId === item.id
                            const isUnread  = item.status === "PENDING"

                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                                        isOpen
                                            ? "border-indigo-500/25 bg-neutral-900/70"
                                            : "border-white/[0.05] bg-neutral-900/50"
                                    }`}
                                >
                                    {/* Accordion trigger */}
                                    <button
                                        onClick={() => toggleMobileExpand(item.id)}
                                        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                                    >
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-xl overflow-hidden bg-neutral-800 border border-white/[0.06] shrink-0">
                                            {item.user?.image
                                                ? <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center"><User className="w-3.5 h-3.5 text-neutral-500" /></div>
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                                                    <p className="text-sm font-semibold text-neutral-200 truncate">{item.user?.name || "Anonymous"}</p>
                                                </div>
                                                <span className="text-[10px] text-neutral-600 shrink-0">{timeAgo(item.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${cat.color} ${cat.bg} ${cat.border}`}>
                                                    <CatIcon className="w-2.5 h-2.5" />{cat.label}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${st.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronDown className={`w-4 h-4 shrink-0 text-neutral-600 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-400" : ""}`} />
                                    </button>

                                    {/* Accordion body */}
                                    {isOpen && (
                                        <div className="px-4 pb-4 border-t border-white/[0.05] pt-4">
                                            <DetailContent item={item} />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* ══════════════════════════════════════════
                        DESKTOP — Two-pane inbox (≥ lg)
                    ══════════════════════════════════════════ */}
                    <div className="hidden lg:grid grid-cols-[340px_1fr] gap-4 items-start">

                        {/* Left — ticket list */}
                        <div className="space-y-1.5">
                            {filtered.map((item) => {
                                const cat     = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
                                const CatIcon = cat.Icon
                                const st      = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING
                                const isActive = selectedId === item.id
                                const isUnread = item.status === "PENDING"

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { setSelectedId(item.id); setReplyingTo(null); setReplyText("") }}
                                        className={`w-full text-left rounded-2xl px-4 py-3.5 border transition-all duration-150 group ${
                                            isActive
                                                ? "bg-indigo-500/10 border-indigo-500/30"
                                                : "bg-neutral-900/50 border-white/[0.05] hover:bg-neutral-800/50 hover:border-white/[0.1]"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-neutral-800 border border-white/[0.06] shrink-0 mt-0.5">
                                                {item.user?.image
                                                    ? <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><User className="w-3.5 h-3.5 text-neutral-500" /></div>
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                                                        <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-neutral-200"}`}>
                                                            {item.user?.name || "Anonymous"}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] text-neutral-600 shrink-0">{timeAgo(item.createdAt)}</span>
                                                </div>
                                                <p className="text-xs text-neutral-500 truncate mb-2">{item.message}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${cat.color} ${cat.bg} ${cat.border}`}>
                                                        <CatIcon className="w-2.5 h-2.5" />{cat.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${st.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-3.5 h-3.5 mt-1 shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-neutral-700 group-hover:text-neutral-500"}`} />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Right — detail pane */}
                        {selectedItem ? (() => {
                            const item    = selectedItem
                            const cat     = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
                            const CatIcon = cat.Icon
                            const st      = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING

                            return (
                                <div className="bg-neutral-900/50 border border-white/[0.06] rounded-2xl overflow-hidden sticky top-6">
                                    {/* Pane header */}
                                    <div className="px-6 py-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 border border-white/[0.06] shrink-0">
                                                {item.user?.image
                                                    ? <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-neutral-500" /></div>
                                                }
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-white text-sm">{item.user?.name || "Anonymous"}</p>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${cat.color} ${cat.bg} ${cat.border}`}>
                                                        <CatIcon className="w-2.5 h-2.5" />{cat.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                        item.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                        : item.status === "READ"  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-600 mt-0.5">{item.user?.email || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 shrink-0 mt-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {timeAgo(item.createdAt)}
                                        </div>
                                    </div>

                                    {/* Pane body */}
                                    <div className="px-6 py-5">
                                        <DetailContent item={item} />
                                    </div>
                                </div>
                            )
                        })() : (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.07] rounded-2xl bg-neutral-900/20">
                                <div className="w-14 h-14 rounded-2xl bg-neutral-800/50 border border-white/[0.05] flex items-center justify-center mb-4">
                                    <MessageSquare className="w-6 h-6 text-neutral-700" />
                                </div>
                                <p className="text-sm text-neutral-600 font-medium">Pilih tiket untuk melihat detail</p>
                                <p className="text-xs text-neutral-700 mt-1">Klik salah satu tiket di sebelah kiri</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}