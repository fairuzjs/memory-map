"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, User, Clock, CheckCircle2, Trash2, MessageCircleReply, Image as ImageIcon, X, Send } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import toast from "react-hot-toast"

export default function AdminFeedbacksPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Reply state 
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState("")
    const [isSubmittingReply, setIsSubmittingReply] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
            return
        }

        if (status === "authenticated" && session.user.role === "ADMIN") {
            fetchFeedbacks()
        }
    }, [status, session, router])

    const fetchFeedbacks = async () => {
        try {
            const res = await fetch("/api/admin/feedbacks")
            if (!res.ok) throw new Error("Failed")
            const data = await res.json()
            setFeedbacks(data)
        } catch {
            toast.error("Gagal mengambil data tiket")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, newStatus: string, replyMessage?: string) => {
        setIsSubmittingReply(true)
        try {
            const bodyData: any = { status: newStatus }
            if (replyMessage !== undefined) {
                bodyData.adminReply = replyMessage
            }

            const res = await fetch(`/api/admin/feedbacks/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            })
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Failed");
            }

            const updatedFeedback = await res.json()

            setFeedbacks(prev => prev.map(f => f.id === id ? { ...updatedFeedback } : f))
            toast.success(replyMessage ? "Balasan terkirim!" : "Status tiket diperbarui")

            if (replyMessage) {
                setReplyingTo(null)
                setReplyText("")
            }
        } catch (error: any) {
            toast.error(error.message || "Gagal memproses permintaan")
        } finally {
            setIsSubmittingReply(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus tiket ini permanen?")) return
        try {
            const res = await fetch(`/api/admin/feedbacks/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")

            setFeedbacks(prev => prev.filter(f => f.id !== id))
            toast.success("Tiket dihapus")
        } catch {
            toast.error("Gagal menghapus")
        }
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-32">
            <div>
                <h1 className="text-3xl font-[Outfit] font-bold text-white tracking-tight">Manajemen Tiket & Bantuan</h1>
                <p className="text-neutral-400 mt-2">Daftar semua saran, kritik, dan keluhan yang dikirim pengguna.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-5xl">
                {feedbacks.length === 0 ? (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <span className="text-neutral-500 mb-2">(Tidak ada data)</span>
                        <p className="text-neutral-400">Belum ada tiket masukan.</p>
                    </div>
                ) : (
                    feedbacks.map((item) => {
                        const isReplied = item.status === "REPLIED"
                        const isRead = item.status === "READ" || isReplied

                        return (
                            <div key={item.id} className={`bg-neutral-900 border ${isRead ? 'border-neutral-800' : 'border-indigo-500/50 shadow-lg'} rounded-2xl p-6 transition-all`}>

                                {/* Header: User Info & Status */}
                                <div className="flex justify-between items-start gap-4 flex-col md:flex-row mb-4">
                                    <div className="flex flex-1 items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                                            {item.user?.image ? (
                                                <img src={item.user.image} alt={item.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-neutral-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-white">{item.user?.name || "Anonymous"}</p>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    item.status === 'READ' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500">{item.user?.email || "Tidak ada email"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 shrink-0">
                                        <Clock className="w-3.5 h-3.5" />
                                        {timeAgo(item.createdAt)}
                                    </div>
                                </div>

                                {/* Body: Message & Image */}
                                <div className="pl-14 space-y-4">
                                    <div className="bg-neutral-950/50 rounded-xl p-4 border border-white/[0.04]">
                                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {item.message}
                                        </p>
                                    </div>

                                    {item.imageUrl && (
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                                <ImageIcon className="w-3.5 h-3.5" /> Lampiran Foto
                                            </p>
                                            <img
                                                src={item.imageUrl}
                                                alt="Lampiran"
                                                className="h-40 rounded-lg border border-neutral-800 object-cover cursor-pointer hover:border-neutral-600 transition-colors"
                                                onClick={() => window.open(item.imageUrl, '_blank')}
                                            />
                                        </div>
                                    )}

                                    {/* Admin Reply Section */}
                                    {isReplied ? (
                                        <div className="mt-6 border-l-2 border-emerald-500 pl-4">
                                            <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                                <MessageCircleReply className="w-3.5 h-3.5" /> Balasan Anda
                                            </p>
                                            <p className="text-sm text-neutral-300 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-4 whitespace-pre-wrap">
                                                {item.adminReply}
                                            </p>
                                        </div>
                                    ) : replyingTo === item.id ? (
                                        <div className="mt-6 bg-neutral-950 border border-indigo-500/30 rounded-xl p-4 relative">
                                            <button
                                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                                className="absolute top-3 right-3 text-neutral-500 hover:text-red-400"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                                                <MessageCircleReply className="w-4 h-4" /> Balas Tiket Ini
                                            </h4>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Tuliskan pesan balasan/solusi untuk pengguna..."
                                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y h-24 mb-3"
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id, "REPLIED", replyText)}
                                                    disabled={isSubmittingReply || !replyText.trim()}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSubmittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                    Kirim Balasan
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-neutral-800">
                                        {!isReplied && (
                                            <button
                                                onClick={() => setReplyingTo(item.id)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <MessageCircleReply className="w-3.5 h-3.5" />
                                                Balas Tiket
                                            </button>
                                        )}

                                        {!isRead && (
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, "READ")}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Tandai Telah Dibaca
                                            </button>
                                        )}

                                        <div className="flex-1" /> {/* Spacer */}

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                            title="Hapus Tiket"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
