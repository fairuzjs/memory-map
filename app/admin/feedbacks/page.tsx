"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, User, Clock, CheckCircle2, Trash2,
    MessageCircleReply, Image as ImageIcon, X, Send,
    Lightbulb, Bug, HelpCircle, Star, MessageSquare,
    Inbox, ChevronRight, ChevronDown, Filter, Search, AlertCircle
} from "lucide-react"
import Image from "next/image"
import { timeAgo } from "@/lib/utils"
import toast from "react-hot-toast"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"
import { captureError, captureAPIError, captureInteraction, capturePerformance } from "@/lib/monitoring"

type CategoryFilter = "ALL" | "SUGGESTION" | "BUG" | "QUESTION" | "OTHER"

const CATEGORY_CONFIG: Record<string, {
    label: string; color: string; bg: string; border: string; Icon: React.ElementType<{ className?: string }>
}> = {
    SUGGESTION: { label: "Saran",      color: "text-black",  bg: "bg-yellow-300",  border: "border-black",  Icon: Lightbulb  },
    BUG:        { label: "Bug",         color: "text-black",    bg: "bg-rose-400",    border: "border-black",    Icon: Bug        },
    QUESTION:   { label: "Pertanyaan", color: "text-black", bg: "bg-cyan-300", border: "border-black", Icon: HelpCircle },
    OTHER:      { label: "Lainnya",    color: "text-black", bg: "bg-fuchsia-400", border: "border-black", Icon: Star       },
}

const FILTER_TABS: { id: CategoryFilter; label: string }[] = [
    { id: "ALL",        label: "Semua"      },
    { id: "SUGGESTION", label: "Saran"      },
    { id: "BUG",        label: "Bug"        },
    { id: "QUESTION",   label: "Pertanyaan" },
    { id: "OTHER",      label: "Lainnya"    },
]

const STATUS_MAP: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
    PENDING: { label: "Pending", dot: "bg-black",   text: "text-black", bg: "bg-yellow-300", border: "border-black" },
    READ:    { label: "Dibaca",  dot: "bg-black",    text: "text-black", bg: "bg-cyan-300", border: "border-black"  },
    REPLIED: { label: "Dibalas", dot: "bg-white", text: "text-white", bg: "bg-black", border: "border-black"},
}

export default function AdminFeedbacksPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [feedbacks, setFeedbacks]           = useState<any[]>([])
    const [loading, setLoading]               = useState(true)
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")
    const [statusFilter, setStatusFilter]     = useState("ALL")
    const [searchQuery, setSearchQuery]       = useState("")
    const [page, setPage]                     = useState(1)
    const [total, setTotal]                   = useState(0)
    const [selectedId, setSelectedId]         = useState<string | null>(null)   // desktop
    const [expandedId, setExpandedId]         = useState<string | null>(null)   // mobile accordion
    const [replyingTo, setReplyingTo]         = useState<string | null>(null)
    const [replyText, setReplyText]           = useState("")
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)
    const { confirmProps, openConfirm } = useConfirm()
    const [fetchError, setFetchError] = useState(false)

    const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0 })
    const [catStats, setCatStats] = useState({ suggestion: 0, bug: 0, question: 0, other: 0 })

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        }
    }, [status, session, router])

    const fetchFeedbacks = useCallback(async (q = "", p = 1, cat = "ALL", st = "ALL", signal?: AbortSignal) => {
        setLoading(true)
        setFetchError(false)
        const startTime = performance.now()
        try {
            const params = new URLSearchParams({
                page: String(p),
                limit: "10",
                search: q,
            })
            if (cat !== "ALL") params.set("category", cat)
            if (st !== "ALL") params.set("status", st)

            const res = await fetch(`/api/admin/feedbacks?${params}`, { signal })
            if (res.ok) {
                const data = await res.json()
                const returned = data.feedbacks ?? []
                setFeedbacks(returned)
                setTotal(data.total ?? 0)

                setStats({
                    total: data.total ?? 0,
                    pending: data.pendingCount ?? 0,
                    replied: data.repliedCount ?? 0,
                })

                setCatStats({
                    suggestion: data.suggestionCount ?? 0,
                    bug: data.bugCount ?? 0,
                    question: data.questionCount ?? 0,
                    other: data.otherCount ?? 0,
                })

                // Auto-select feedback on desktop if none selected
                if (returned.length > 0) {
                    if (!selectedId || !returned.some((f: any) => f.id === selectedId)) {
                        setSelectedId(returned[0].id)
                    }
                } else {
                    setSelectedId(null)
                }

                const latency = performance.now() - startTime
                if (latency > 1000) {
                    capturePerformance("admin_feedbacks_fetch_slow", latency, { q, p, cat, st })
                }
            } else {
                captureAPIError("/api/admin/feedbacks", res.status, res.statusText, { q, p, cat, st })
                setFetchError(true)
                toast.error("Gagal mengambil data tiket")
            }
        } catch (err: any) {
            if (err.name === "AbortError") return
            captureError(err, { context: "fetchFeedbacks", q, p, cat, st })
            setFetchError(true)
            toast.error("Gagal mengambil data tiket")
        } finally {
            if (!signal?.aborted) {
                setLoading(false)
            }
        }
    }, [selectedId])

    // AbortController integration for search & filters
    useEffect(() => {
        if (status !== "authenticated" || session?.user?.role !== "ADMIN") return

        const controller = new AbortController()

        const runFetch = () => {
            fetchFeedbacks(searchQuery, page, categoryFilter, statusFilter, controller.signal)
        }

        let debounceTimer: NodeJS.Timeout
        if (searchQuery) {
            debounceTimer = setTimeout(runFetch, 400)
        } else {
            runFetch()
        }

        return () => {
            controller.abort()
            if (debounceTimer) clearTimeout(debounceTimer)
        }
    }, [status, session, searchQuery, page, categoryFilter, statusFilter, fetchFeedbacks])

    const handleSearchChange = (val: string) => {
        setSearchQuery(val)
        setPage(1)
    }

    const handleUpdateStatus = async (id: string, newStatus: string, replyMessage?: string) => {
        captureInteraction("admin_feedback_update_status_start", { id, newStatus, hasReply: !!replyMessage })
        setIsSubmittingReply(true)
        
        const originalFeedbacks = [...feedbacks]
        const originalStats = { ...stats }
        const originalCatStats = { ...catStats }
        
        // Optimistic UI updates
        setFeedbacks(prev => prev.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    status: newStatus,
                    adminReply: replyMessage !== undefined ? replyMessage : f.adminReply
                }
            }
            return f
        }))
        
        if (newStatus === "REPLIED") {
            setStats(prev => ({
                ...prev,
                pending: Math.max(0, prev.pending - 1),
                replied: prev.replied + 1
            }))
        } else if (newStatus === "READ") {
            setStats(prev => ({
                ...prev,
                pending: Math.max(0, prev.pending - 1)
            }))
        }
        
        toast.success(replyMessage ? "Mengirim balasan..." : "Memperbarui status...", { id: `feedback-${id}` })

        try {
            const body: any = { status: newStatus }
            if (replyMessage !== undefined) body.adminReply = replyMessage
            const res = await fetch(`/api/admin/feedbacks/${id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const d = await res.json().catch(() => null)
                captureAPIError(`/api/admin/feedbacks/${id}`, res.status, res.statusText, { newStatus })
                throw new Error(d?.error || "Gagal memperbarui")
            }
            const updated = await res.json()
            setFeedbacks(prev => prev.map(f => f.id === id ? updated : f))
            toast.success(replyMessage ? "✅ Balasan terkirim!" : "✅ Status diperbarui", { id: `feedback-${id}` })
            if (replyMessage) { setReplyingTo(null); setReplyText("") }
            captureInteraction("admin_feedback_update_status_success", { id, newStatus })
        } catch (e: any) {
            setFeedbacks(originalFeedbacks)
            setStats(originalStats)
            setCatStats(originalCatStats)
            captureError(e, { context: "handleUpdateStatus_rollback", id, newStatus })
            captureInteraction("admin_rollback_event", { action: "admin_feedback_update_status", targetId: id, error: e.message })
            toast.error(e.message || "Gagal memperbarui status. Dikembalikan ke awal.", { id: `feedback-${id}` })
        } finally {
            setIsSubmittingReply(false)
        }
    }

    const handleDelete = async (id: string) => {
        openConfirm({
            title: "Hapus Tiket Ini?",
            description: "Tiket feedback ini akan dihapus secara permanen beserta semua balasan di dalamnya.",
            confirmLabel: "Hapus Tiket",
            cancelLabel: "Batal",
            variant: "danger",
            onConfirm: async () => {
                captureInteraction("admin_feedback_delete_start", { id })
                const originalFeedbacks = [...feedbacks]
                const originalStats = { ...stats }
                const originalCatStats = { ...catStats }

                setFeedbacks(prev => prev.filter(f => f.id !== id))
                if (selectedId === id) setSelectedId(null)
                if (expandedId === id) setExpandedId(null)
                toast.success("Menghapus tiket...", { id: `delete-feedback-${id}` })

                try {
                    const res = await fetch(`/api/admin/feedbacks/${id}`, { method: "DELETE" })
                    if (!res.ok) {
                        captureAPIError(`/api/admin/feedbacks/${id}`, res.status, res.statusText)
                        throw new Error("Gagal menghapus")
                    }
                    toast.success("✅ Tiket berhasil dihapus", { id: `delete-feedback-${id}` })
                    fetchFeedbacks(searchQuery, page, categoryFilter, statusFilter)
                    captureInteraction("admin_feedback_delete_success", { id })
                } catch (e: any) {
                    setFeedbacks(originalFeedbacks)
                    if (originalFeedbacks.some(f => f.id === id)) {
                        setSelectedId(id)
                    }
                    setStats(originalStats)
                    setCatStats(originalCatStats)
                    captureError(e, { context: "handleDelete_rollback", id })
                    captureInteraction("admin_rollback_event", { action: "admin_feedback_delete", targetId: id, error: e.message })
                    toast.error(e.message || "Gagal menghapus tiket. Dikembalikan.", { id: `delete-feedback-${id}` })
                }
            }
        })
    }

    const countFor = (cat: CategoryFilter) => {
        if (cat === "ALL") return stats.total
        if (cat === "SUGGESTION") return catStats.suggestion
        if (cat === "BUG") return catStats.bug
        if (cat === "QUESTION") return catStats.question
        if (cat === "OTHER") return catStats.other
        return 0
    }

    const selectedItem = feedbacks.find(f => f.id === selectedId) ?? null
    const totalPages = Math.ceil(total / 10)

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

    // Neubrutalist Feedback Skeleton
    const FeedbackItemSkeleton = () => (
        <div className="w-full rounded-2xl px-4 py-4 border-[3px] border-black shadow-[4px_4px_0_#000] bg-white animate-pulse space-y-3">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-200 border-[2px] border-black shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded border border-neutral-300 w-1/3" />
                    <div className="h-3 bg-neutral-200 rounded border border-neutral-300 w-2/3" />
                </div>
            </div>
            <div className="flex gap-2">
                <div className="w-16 h-5 rounded-md bg-neutral-200 border border-neutral-300" />
                <div className="w-16 h-5 rounded-md bg-neutral-200 border border-neutral-300" />
            </div>
        </div>
    )

    // ── Reusable detail content ──
    const DetailContent = ({ item }: { item: any }) => {
        const isReplied = item.status === "REPLIED"
        const isRead    = item.status === "READ" || isReplied
        const cat       = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
        const CatIcon   = cat.Icon
        const st        = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING

        return (
            <div className="space-y-4 font-[Outfit]">
                {/* User info row */}
                <div className="flex items-center justify-between gap-3 lg:hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black ${cat.bg} text-black`}>
                            <CatIcon className="w-2.5 h-2.5" />{cat.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black ${st.bg} ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full border border-black ${st.dot}`} />{st.label}
                        </span>
                    </div>
                    <span className="text-[11px] font-bold text-black shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(item.createdAt)}
                    </span>
                </div>

                {/* Message */}
                <div className="rounded-xl bg-white border-[3px] border-black p-4 shadow-[4px_4px_0_#000]">
                    <p className="text-sm font-bold text-black leading-relaxed whitespace-pre-wrap">{item.message}</p>
                </div>

                {/* Image attachment */}
                {item.imageUrl && (
                    <div>
                        <p className="text-[11px] font-black text-black mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <ImageIcon className="w-3.5 h-3.5" /> Lampiran
                        </p>
                        <div className="relative h-44 w-full rounded-xl border-[3px] border-black shadow-[4px_4px_0_#000] overflow-hidden cursor-pointer hover:shadow-[6px_6px_0_#000] hover:scale-[1.01] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] transition-all">
                            <Image
                                src={item.imageUrl}
                                alt="Lampiran"
                                fill
                                className="object-cover"
                                onClick={() => window.open(item.imageUrl, "_blank")}
                            />
                        </div>
                    </div>
                )}

                {/* Admin reply — already replied */}
                {isReplied && (
                    <div className="rounded-xl border-[3px] border-black bg-cyan-100 overflow-hidden shadow-[4px_4px_0_#000]">
                        <div className="px-4 py-2.5 border-b-[3px] border-black bg-cyan-300 flex items-center gap-2">
                            <MessageCircleReply className="w-4 h-4 text-black" />
                            <span className="text-xs font-black text-black uppercase tracking-widest">Balasan Admin</span>
                        </div>
                        <p className="px-4 py-3 text-sm font-bold text-black leading-relaxed whitespace-pre-wrap">{item.adminReply}</p>
                    </div>
                )}

                {/* Reply compose */}
                {!isReplied && replyingTo === item.id && (
                    <div className="rounded-xl border-[3px] border-black bg-yellow-100 overflow-hidden shadow-[4px_4px_0_#000]">
                        <div className="px-4 py-2.5 border-b-[3px] border-black bg-yellow-300 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageCircleReply className="w-4 h-4 text-black" />
                                <span className="text-xs font-black text-black uppercase tracking-widest">Tulis Balasan</span>
                            </div>
                            <button
                                onClick={() => { setReplyingTo(null); setReplyText("") }}
                                className="p-1 rounded-lg border-[2px] border-transparent hover:border-black hover:bg-rose-400 transition-colors text-black"
                            >
                                <X className="w-4 h-4 font-black" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Tuliskan balasan atau solusi untuk pengguna..."
                                className="w-full bg-white border-[3px] border-black rounded-xl px-3.5 py-3 text-sm font-bold text-black placeholder:text-neutral-500 shadow-[2px_2px_0_#000] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0_#000] resize-none h-28 transition-all"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => handleUpdateStatus(item.id, "REPLIED", replyText)}
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-300 border-[2px] border-black shadow-[3px_3px_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-black uppercase rounded-xl transition-all"
                                >
                                    {isSubmittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Kirim Balasan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer actions */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {!isReplied && (
                        <button
                            onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-[2px] border-black shadow-[3px_3px_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_#000] transition-all ${
                                replyingTo === item.id
                                    ? "bg-rose-400 text-black"
                                    : "bg-cyan-300 text-black"
                            }`}
                        >
                            <MessageCircleReply className="w-3.5 h-3.5" />
                            {replyingTo === item.id ? "Batal" : "Balas"}
                        </button>
                    )}
                    {!isRead && (
                        <button
                            onClick={() => handleUpdateStatus(item.id, "READ")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_#000] transition-all"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tandai Dibaca
                        </button>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-rose-400 text-black border-[2px] border-black shadow-[3px_3px_0_#000] active:translate-y-[1px] active:shadow-[2px_2px_0_#000] transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="space-y-6 pb-10 font-[Outfit]">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-md bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-black uppercase">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight uppercase">
                        Manajemen Tiket
                    </h1>
                    <p className="text-black font-bold text-sm mt-1">Saran, kritik, dan keluhan yang dikirim pengguna.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-white border-[3px] border-black shadow-[4px_4px_0_#000] text-center">
                        <p className="text-lg font-black text-black leading-none">{stats.total}</p>
                        <p className="text-[10px] font-bold text-black uppercase mt-0.5">Total</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000] text-center">
                        <p className="text-lg font-black text-black leading-none">{stats.pending}</p>
                        <p className="text-[10px] font-bold text-black uppercase mt-0.5">Pending</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-cyan-300 border-[3px] border-black shadow-[4px_4px_0_#000] text-center">
                        <p className="text-lg font-black text-black leading-none">{stats.replied}</p>
                        <p className="text-[10px] font-bold text-black uppercase mt-0.5">Dibalas</p>
                    </div>
                </div>
            </div>

            {/* Controls: Search & Dropdown Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-black font-black" />
                    <input
                        type="text"
                        placeholder="CARI PESAN, NAMA, EMAIL ATAU USERNAME..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] rounded-2xl text-sm font-black text-black placeholder:text-neutral-500 focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#000] transition-all"
                    />
                </div>
                {/* Status Dropdown */}
                <div className="relative inline-block shrink-0">
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                        className="appearance-none pl-4 pr-10 py-3.5 bg-white border-[3px] border-black rounded-2xl text-xs font-black uppercase tracking-wide cursor-pointer focus:outline-none transition-all shadow-[4px_4px_0_#000] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#000] min-w-[140px]"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="READ">Dibaca</option>
                        <option value="REPLIED">Dibalas</option>
                    </select>
                    <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black pointer-events-none" />
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
                            onClick={() => { setCategoryFilter(id); setPage(1); setSelectedId(null); setExpandedId(null) }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-150 border-[2px] border-black ${
                                isActive
                                    ? cfg ? `${cfg.bg} shadow-[3px_3px_0_#000] translate-x-[1px]` : "bg-black text-white shadow-[3px_3px_0_#000] translate-x-[1px]"
                                    : "bg-white text-black hover:bg-neutral-100 hover:translate-y-[-2px] hover:shadow-[3px_3px_0_#000]"
                            }`}
                        >
                            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? "" : "text-black"}`} />}
                            {label}
                            <span className={`ml-1 min-w-[20px] text-center px-1 py-0.5 rounded-full text-[10px] font-black border border-black ${isActive ? "bg-white text-black" : "bg-neutral-200 text-black"}`}>
                                {countFor(id)}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Error Retry State */}
            {fetchError && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0_#000] space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-black flex items-center justify-center text-rose-500">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-base font-black text-black uppercase">Koneksi Bermasalah</p>
                        <p className="text-xs font-bold text-neutral-600 mt-1">Gagal mengambil tiket feedbacks</p>
                    </div>
                    <button
                        onClick={() => fetchFeedbacks(searchQuery, page, categoryFilter, statusFilter)}
                        className="px-4 py-2 bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* ── Empty state ── */}
            {!loading && feedbacks.length === 0 && !fetchError && (
                <div className="flex flex-col items-center justify-center py-24 border-[3px] border-black rounded-2xl bg-white shadow-[8px_8px_0_#000]">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mb-4 rotate-3">
                        <Inbox className="w-8 h-8 text-black" />
                    </div>
                    <p className="text-black font-black uppercase tracking-wide text-xl">Tidak ada tiket</p>
                    <p className="text-black font-bold text-sm mt-1">
                        {categoryFilter === "ALL" ? "Belum ada tiket masuk." : `Tidak ada tiket kategori "${CATEGORY_CONFIG[categoryFilter]?.label}".`}
                    </p>
                </div>
            )}

            {(feedbacks.length > 0 || loading) && !fetchError && (
                <>
                    {/* ══════════════════════════════════════════
                        MOBILE — Accordion list (< lg)
                    ══════════════════════════════════════════ */}
                    <div className="lg:hidden space-y-4">
                        {loading && (
                            <>
                                <FeedbackItemSkeleton />
                                <FeedbackItemSkeleton />
                                <FeedbackItemSkeleton />
                            </>
                        )}
                        
                        {!loading && feedbacks.map((item) => {
                            const cat       = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
                            const CatIcon   = cat.Icon
                            const st        = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING
                            const isOpen    = expandedId === item.id
                            const isUnread  = item.status === "PENDING"

                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl border-[3px] border-black overflow-hidden transition-all duration-200 shadow-[4px_4px_0_#000] ${
                                        isOpen ? "bg-yellow-50" : "bg-white"
                                    }`}
                                >
                                    {/* Accordion trigger */}
                                    <button
                                        onClick={() => toggleMobileExpand(item.id)}
                                        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 relative">
                                            {item.user?.image ? (
                                                <Image src={item.user.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-cyan-100"><User className="w-5 h-5 text-black" /></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {isUnread && <span className="w-2 h-2 rounded-full border border-black bg-rose-400 shrink-0" />}
                                                    <p className="text-sm font-black text-black truncate uppercase">{item.user?.name || "Anonymous"}</p>
                                                </div>
                                                <span className="text-[10px] font-bold text-black shrink-0">{timeAgo(item.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black border-[2px] border-black ${cat.bg} text-black uppercase tracking-wider`}>
                                                    <CatIcon className="w-3 h-3" />{cat.label}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-black border-[2px] border-black rounded-md px-1.5 py-0.5 ${st.bg} ${st.text} uppercase tracking-wider`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full border border-black ${st.dot}`} />{st.label}
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronDown className={`w-5 h-5 shrink-0 text-black transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* Accordion body */}
                                    {isOpen && (
                                        <div className="px-4 pb-4 border-t-[3px] border-black pt-4 bg-[#FFFDF0]">
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
                    <div className="hidden lg:grid grid-cols-[360px_1fr] gap-6 items-start">

                        {/* Left — ticket list */}
                        <div className="space-y-3">
                            {loading && (
                                <>
                                    <FeedbackItemSkeleton />
                                    <FeedbackItemSkeleton />
                                    <FeedbackItemSkeleton />
                                    <FeedbackItemSkeleton />
                                </>
                            )}
                            
                            {!loading && feedbacks.map((item) => {
                                const cat     = CATEGORY_CONFIG[item.category ?? "SUGGESTION"] ?? CATEGORY_CONFIG.SUGGESTION
                                const CatIcon = cat.Icon
                                const st      = STATUS_MAP[item.status] ?? STATUS_MAP.PENDING
                                const isActive = selectedId === item.id
                                const isUnread = item.status === "PENDING"

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { setSelectedId(item.id); setReplyingTo(null); setReplyText("") }}
                                        className={`w-full text-left rounded-2xl px-4 py-4 border-[3px] border-black shadow-[4px_4px_0_#000] transition-all duration-150 group ${
                                            isActive
                                                ? "bg-yellow-200 translate-x-2"
                                                : "bg-white hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-[1px]"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 mt-0.5 relative">
                                                {item.user?.image ? (
                                                    <Image src={item.user.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-cyan-100"><User className="w-5 h-5 text-black" /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {isUnread && <span className="w-2 h-2 rounded-full border border-black bg-rose-400 shrink-0 animate-pulse" />}
                                                        <p className="text-sm font-black text-black truncate uppercase">
                                                            {item.user?.name || "Anonymous"}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-black shrink-0">{timeAgo(item.createdAt)}</span>
                                                </div>
                                                <p className="text-xs font-bold text-neutral-700 truncate mb-2">{item.message}</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black border-[2px] border-black ${cat.bg} text-black uppercase tracking-wider`}>
                                                        <CatIcon className="w-3 h-3" />{cat.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black border-[2px] border-black rounded-md px-1.5 py-0.5 ${st.bg} ${st.text} uppercase tracking-wider`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full border border-black ${st.dot}`} />{st.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 mt-1 shrink-0 text-black group-hover:translate-x-1 transition-transform" />
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
                                <div className="bg-white border-[3px] border-black rounded-2xl overflow-hidden sticky top-6 shadow-[8px_8px_0_#000]">
                                    {/* Pane header */}
                                    <div className="px-6 py-5 border-b-[3px] border-black bg-[#FFFDF0] flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border-[2px] border-black shadow-[3px_3px_0_#000] shrink-0 relative">
                                                {item.user?.image ? (
                                                    <Image src={item.user.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-cyan-100"><User className="w-6 h-6 text-black" /></div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="font-black text-black text-lg uppercase">{item.user?.name || "Anonymous"}</p>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black ${cat.bg} text-black`}>
                                                        <CatIcon className="w-2.5 h-2.5" />{cat.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border-[2px] border-black ${st.bg} ${st.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full border border-black ${st.dot}`} />{st.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-neutral-600">{item.user?.email || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-black shrink-0 mt-1 bg-yellow-200 px-2 py-1 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            <Clock className="w-4 h-4" />
                                            {timeAgo(item.createdAt)}
                                        </div>
                                    </div>

                                    {/* Pane body */}
                                    <div className="px-6 py-5 bg-[#FFFDF0]">
                                        <DetailContent item={item} />
                                    </div>
                                </div>
                            )
                        })() : (
                            <div className="flex flex-col items-center justify-center py-24 border-[3px] border-black rounded-2xl bg-white shadow-[8px_8px_0_#000]">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-300 border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mb-4 -rotate-3">
                                    <MessageSquare className="w-8 h-8 text-black" />
                                </div>
                                <p className="text-xl font-black text-black uppercase tracking-wide">Pilih tiket</p>
                                <p className="text-sm font-bold text-neutral-700 mt-1">Klik salah satu tiket di sebelah kiri</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-[1px_1px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        ← Sebelumnya
                    </button>
                    <span className="text-sm font-black text-black bg-yellow-300 px-3 py-1.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0_#000]">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-white text-black border-[2px] border-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:translate-y-[2px] disabled:shadow-[1px_1px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-all"
                    >
                        Berikutnya →
                    </button>
                </div>
            )}
        </div>
        <ConfirmDialog {...confirmProps} />
        </>
    )
}