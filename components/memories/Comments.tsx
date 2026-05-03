"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import Link from "next/link"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"
import { formatDate } from "@/lib/utils"
import { ShieldAlert, Lock, ArrowRight, BadgeCheck } from "lucide-react"
import { PremiumBadge } from "@/components/ui/PremiumBadge"
import { isPremiumActive } from "@/lib/premium-config"

export function Comments({ memoryId, initialComments }: { memoryId: string, initialComments: any[] }) {
    const { data: session } = useSession()
    const [comments, setComments] = useState(initialComments || [])
    const [content, setContent] = useState("")
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault()
        if (!session?.user) return toast.error("Please login to comment")

        const text = parentId ? replyContent : content
        if (!text.trim()) return

        const tempId = `temp-${Date.now()}`
        const optimisticComment = {
            id: tempId,
            content: text,
            createdAt: new Date().toISOString(),
            userId: session.user.id,
            user: {
                id: session.user.id,
                name: session.user.name,
                image: session.user.image,
                isVerified: (session.user as any)?.isVerified || false,
                premiumExpiresAt: (session.user as any)?.premiumExpiresAt || null,
            },
            isOptimistic: true, // Flag for UI styling
            replies: []
        }

        // 1. Optimistic Update
        const previousComments = [...comments]
        if (parentId) {
            setComments(comments.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [...(c.replies || []), optimisticComment] }
                }
                return c
            }))
            setReplyTo(null)
            setReplyContent("")
        } else {
            setComments([...comments, optimisticComment])
            setContent("")
        }

        setSubmitting(true)
        try {
            const res = await fetch(`/api/memories/${memoryId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text, parentId })
            })
            const data = await res.json()
            if (!res.ok) {
                const errCode = data.error
                if (errCode === "EMAIL_NOT_VERIFIED") {
                    throw new Error("Verifikasi email kamu dulu sebelum berkomentar.")
                }
                throw new Error(errCode || "Failed to post comment")
            }

            // 2. Sync with server data (replace optimistic with real data)
            setComments(prev => {
                if (parentId) {
                    return prev.map(c => {
                        if (c.id === parentId) {
                            return {
                                ...c,
                                replies: c.replies.map((r: any) => r.id === tempId ? data : r)
                            }
                        }
                        return c
                    })
                }
                return prev.map(c => c.id === tempId ? { ...data, replies: [] } : c)
            })
        } catch (e: any) {
            // 3. Rollback on failure
            setComments(previousComments)
            toast.error(e.message || "Failed to post comment")
            if (parentId) setReplyContent(text)
            else setContent(text)
        } finally {
            setSubmitting(false)
        }
    }

    const { confirmProps, openConfirm } = useConfirm()

    const handleDelete = async (commentId: string, parentId: string | null = null) => {
        openConfirm({
            title: "Hapus Komentar?",
            description: "Komentar ini akan dihapus secara permanen dan tidak dapat dikembalikan.",
            confirmLabel: "Hapus",
            cancelLabel: "Batal",
            variant: "danger",
            onConfirm: async () => {
                const res = await fetch(`/api/memories/${memoryId}/comments/${commentId}`, { method: "DELETE" })
                if (!res.ok) throw new Error("Failed to delete")

                if (parentId) {
                    setComments(comments.map((c: any) => {
                        if (c.id === parentId) {
                            return { ...c, replies: c.replies.filter((r: any) => r.id !== commentId) }
                        }
                        return c
                    }))
                } else {
                    setComments(comments.filter((c: any) => c.id !== commentId))
                }
                toast.success("Comment deleted")
            }
        })
    }

    const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)

    return (
        <>
        <div className="w-full">
            {totalCount > 0 && (
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-[12px] font-black text-black bg-[#E5E5E5] px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000] uppercase tracking-wider">
                        {totalCount} Total Komentar
                    </p>
                    {totalCount > 3 && (
                        <p className="text-[10px] font-bold text-black/60 uppercase">Scroll untuk melihat semua</p>
                    )}
                </div>
            )}

            {/* ── Comment Form: locked if unverified ── */}
            {!session?.user ? (
                <div className="mb-8 flex items-center gap-4 p-5 bg-[#E5E5E5] border-[4px] border-black shadow-[6px_6px_0_#000]">
                    <div className="w-10 h-10 bg-white border-[2px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
                        <Lock className="w-5 h-5 text-black" />
                    </div>
                    <p className="text-[14px] font-bold text-black">
                        <Link href="/login" className="bg-[#FFFF00] text-black font-black uppercase px-2 py-0.5 border border-black shadow-[2px_2px_0_#000] mr-2 hover:bg-[#00FF00] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all">Masuk</Link> untuk meninggalkan komentar.
                    </p>
                </div>
            ) : (session?.user as any)?.isEmailVerified === false ? (
                <div className="mb-8 bg-[#E5E5E5] border-[4px] border-black shadow-[6px_6px_0_#000] overflow-hidden">
                    {/* Fake blurred textarea */}
                    <div className="relative">
                        <textarea
                            readOnly
                            placeholder="Tulis komentar..."
                            className="w-full bg-white p-4 text-[14px] font-bold resize-none h-[80px] text-transparent cursor-not-allowed select-none outline-none"
                            style={{ filter: "blur(4px)", userSelect: "none" }}
                        />
                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#FFFF00] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                                    <ShieldAlert className="w-4 h-4 text-black" />
                                </div>
                                <p className="text-[14px] font-black uppercase text-white drop-shadow-[2px_2px_0_#000]">Email belum diverifikasi</p>
                            </div>
                        </div>
                    </div>
                    {/* CTA footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border-t-[4px] border-black gap-3">
                        <p className="text-[12px] font-bold text-black/80">Diperlukan untuk menggunakan fitur komentar</p>
                        <Link
                            href="/settings?tab=security"
                            className="flex items-center gap-2 px-4 py-2 bg-[#FF00FF] border-[3px] border-black text-white text-[12px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                        >
                            Verifikasi Sekarang <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={(e) => handleSubmit(e)} className="mb-10 flex gap-4">
                    <img src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || 'guest'}`} className="w-12 h-12 border-[3px] border-black bg-white object-cover shadow-[2px_2px_0_#000] shrink-0" alt="" />
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Tulis pendapatmu..."
                            className="w-full bg-white border-[4px] border-black shadow-[6px_6px_0_#000] focus:shadow-[8px_8px_0_#000] focus:translate-x-[-2px] focus:translate-y-[-2px] p-4 text-[14px] font-bold text-black placeholder:text-black/50 outline-none resize-none min-h-[100px] transition-all"
                            disabled={submitting}
                        />
                        <div className="mt-4 flex justify-end">
                            <button type="submit" disabled={submitting || !content.trim()} className="bg-[#00FF00] border-[3px] border-black text-black px-6 py-2.5 text-[14px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? "Memposting..." : "Post Komentar"}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Scrollable comment list */}
            <div
                className="space-y-6 overflow-y-auto pr-2"
                style={{
                    maxHeight: comments.length > 3 ? "560px" : undefined,
                    scrollbarWidth: "thin",
                    scrollbarColor: "#000 #E5E5E5",
                }}
            >
                {comments.map((comment: any) => (
                    <div key={comment.id} className="group">
                        <div className="flex gap-4">
                            {/* Commenter avatar */}
                            <Link href={`/profile/${comment.user.id}`} className="shrink-0 pt-1">
                                <img
                                    src={comment.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.name}`}
                                    className="w-10 h-10 border-[3px] border-black bg-white object-cover shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all"
                                    alt={comment.user.name}
                                />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className={`bg-white border-[3px] border-black shadow-[4px_4px_0_#000] p-4 relative ${comment.isOptimistic ? "opacity-50 grayscale-[0.5]" : ""}`}>
                                    <div className="flex justify-between items-start mb-2 gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/profile/${comment.user.id}`}
                                                className="font-black text-[14px] uppercase text-black hover:text-[#FF00FF] transition-colors"
                                            >
                                                {comment.user.name}
                                            </Link>
                                            {comment.user.isVerified && <BadgeCheck className="w-4 h-4 text-black shrink-0 fill-[#00FFFF]" />}
                                            {isPremiumActive(comment.user.premiumExpiresAt) && <PremiumBadge size="sm" />}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {comment.isOptimistic && <span className="text-[10px] uppercase font-black bg-[#FFFF00] border border-black px-1 shadow-[1px_1px_0_#000] animate-pulse">Mengirim...</span>}
                                            <span className="text-[10px] font-bold text-black/60 uppercase">{formatDate(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[14px] font-bold text-black whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                </div>

                                <div className="flex gap-4 mt-3 ml-2 text-[12px] font-black uppercase">
                                    <button onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent("") }} className="text-black/60 hover:text-black hover:underline decoration-[2px] underline-offset-4 transition-all">Balas</button>
                                    {session?.user?.id === comment.userId && (
                                        <button onClick={() => handleDelete(comment.id)} className="text-[#FF3300] hover:translate-y-[-1px] transition-transform">Hapus</button>
                                    )}
                                </div>

                                {replyTo === comment.id && (
                                    <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 flex gap-3">
                                        <img src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg`} className="w-8 h-8 border-[2px] border-black bg-white shadow-[2px_2px_0_#000] shrink-0" alt="" />
                                        <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                className="flex-1 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] px-3 py-2 text-[14px] font-bold text-black placeholder:text-black/50 outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0_#000] transition-all"
                                                placeholder="Tulis balasan..."
                                            />
                                            <button type="submit" disabled={submitting || !replyContent.trim()} className="bg-[#00FFFF] border-[3px] border-black text-black px-4 py-2 text-[12px] font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 shrink-0">
                                                Balas
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Replies */}
                                {comment.replies?.length > 0 && (
                                    <div className="mt-4 space-y-4 border-l-[4px] border-black pl-4 ml-2">
                                        {comment.replies.map((reply: any) => (
                                            <div key={reply.id} className="flex gap-3">
                                                {/* Reply author avatar */}
                                                <Link href={`/profile/${reply.user.id}`} className="shrink-0 pt-1">
                                                    <img
                                                        src={reply.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user.name}`}
                                                        className="w-8 h-8 border-[2px] border-black bg-white object-cover shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all"
                                                        alt={reply.user.name}
                                                    />
                                                </Link>
                                                <div className={`flex-1 min-w-0 ${reply.isOptimistic ? "opacity-50" : ""}`}>
                                                    <div className="bg-[#E5E5E5] border-[3px] border-black shadow-[4px_4px_0_#000] px-4 py-3">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <Link
                                                                href={`/profile/${reply.user.id}`}
                                                                className="font-black text-[12px] uppercase text-black hover:text-[#FF00FF] transition-colors"
                                                            >
                                                                {reply.user.name}
                                                            </Link>
                                                            {reply.user.isVerified && <BadgeCheck className="w-3 h-3 text-black shrink-0 fill-[#00FFFF]" />}
                                                            {isPremiumActive(reply.user.premiumExpiresAt) && <PremiumBadge size="sm" />}
                                                        </div>
                                                        <p className="text-[13px] font-bold text-black/80 leading-relaxed">
                                                            {reply.isOptimistic ? <span className="italic">Membalas...</span> : reply.content}
                                                        </p>
                                                    </div>
                                                    {session?.user?.id === reply.userId && (
                                                        <button onClick={() => handleDelete(reply.id, comment.id)} className="text-[10px] font-black uppercase text-[#FF3300] hover:translate-y-[-1px] transition-transform mt-2 ml-1">Hapus</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <ConfirmDialog {...confirmProps} />
        </>
    )
}
