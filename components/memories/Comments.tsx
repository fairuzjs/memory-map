"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"
import { formatDate } from "@/lib/utils"
import { ShieldAlert, Lock, ArrowRight } from "lucide-react"

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
        <div className="mt-8 pt-8 border-t border-neutral-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-[Outfit] font-semibold text-white flex items-center gap-2.5">
                    Comments
                    {totalCount > 0 && (
                        <span className="text-sm font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-full px-2.5 py-0.5">
                            {totalCount}
                        </span>
                    )}
                </h3>
                {totalCount > 3 && (
                    <p className="text-xs text-neutral-500">Scroll to see all comments</p>
                )}
            </div>

            {/* ── Comment Form: locked if unverified ── */}
            {!session?.user ? (
                <div
                    className="mb-8 flex items-center gap-4 px-5 py-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <Lock className="w-4 h-4 text-neutral-600 shrink-0" />
                    <p className="text-sm text-neutral-500">
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Masuk</Link> untuk meninggalkan komentar.
                    </p>
                </div>
            ) : (session.user as any).isEmailVerified === false ? (
                <div
                    className="mb-8 rounded-2xl overflow-hidden"
                    style={{ border: "1px solid rgba(245,158,11,0.2)" }}
                >
                    {/* Fake blurred textarea */}
                    <div className="relative">
                        <textarea
                            readOnly
                            placeholder="Tulis komentar..."
                            className="w-full bg-neutral-900/50 p-4 text-sm resize-none h-[80px] text-transparent cursor-not-allowed select-none outline-none"
                            style={{ filter: "blur(3px)", userSelect: "none" }}
                        />
                        {/* Lock overlay */}
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
                            style={{ background: "rgba(10,10,15,0.75)", backdropFilter: "blur(4px)" }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <p className="text-sm font-semibold text-amber-300">Email belum diverifikasi</p>
                            </div>
                            <p className="text-xs text-neutral-500 text-center px-4">
                                Verifikasi email untuk bisa berkomentar
                            </p>
                        </div>
                    </div>
                    {/* CTA footer */}
                    <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ background: "rgba(245,158,11,0.05)", borderTop: "1px solid rgba(245,158,11,0.15)" }}
                    >
                        <p className="text-xs text-neutral-600">Diperlukan untuk menggunakan fitur komentar</p>
                        <Link
                            href="/settings?tab=security"
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            Verifikasi Sekarang <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={(e) => handleSubmit(e)} className="mb-8 flex gap-3">
                    <img src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || 'guest'}`} className="w-10 h-10 rounded-full bg-neutral-800 border-neutral-700 border" alt="" />
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts..."
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[80px]"
                            disabled={submitting}
                        />
                        <div className="mt-2 flex justify-end">
                            <Button type="submit" disabled={submitting || !content.trim()} className="text-sm px-3 py-1.5 h-auto">Post Comment</Button>
                        </div>
                    </div>
                </form>
            )}

            {/* Scrollable comment list — max ~3 comments visible */}
            <div
                className="space-y-6 overflow-y-auto pr-1"
                style={{
                    maxHeight: comments.length > 3 ? "520px" : undefined,
                    scrollbarWidth: "thin",
                    scrollbarColor: "#404040 transparent",
                }}
            >
                {comments.map((comment: any) => (
                    <div key={comment.id} className="group">
                        <div className="flex gap-3">
                            {/* Commenter avatar — links to profile */}
                            <Link href={`/profile/${comment.user.id}`} className="shrink-0">
                                <img
                                    src={comment.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.name}`}
                                    className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 hover:border-indigo-500 transition-colors object-cover"
                                    alt={comment.user.name}
                                />
                            </Link>
                            <div className="flex-1">
                                <div className={`bg-neutral-900/50 border border-neutral-800 rounded-2xl rounded-tl-none p-3 relative ${comment.isOptimistic ? "opacity-50 grayscale-[0.05]" : ""}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <Link
                                            href={`/profile/${comment.user.id}`}
                                            className="font-semibold text-sm text-neutral-200 hover:text-indigo-400 transition-colors"
                                        >
                                            {comment.user.name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            {comment.isOptimistic && <span className="text-[9px] uppercase tracking-widest text-indigo-400 animate-pulse font-bold">Sending...</span>}
                                            <span className="text-[10px] text-neutral-500">{formatDate(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-300 whitespace-pre-wrap">{comment.content}</p>
                                </div>

                                <div className="flex gap-4 mt-1.5 ml-2 text-xs font-medium">
                                    <button onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent("") }} className="text-neutral-500 hover:text-neutral-300">Reply</button>
                                    {session?.user?.id === comment.userId && (
                                        <button onClick={() => handleDelete(comment.id)} className="text-red-500/70 hover:text-red-500">Delete</button>
                                    )}
                                </div>

                                {replyTo === comment.id && (
                                    <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3 flex gap-2">
                                        <img src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg`} className="w-6 h-6 rounded-full" alt="" />
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                placeholder="Write a reply..."
                                            />
                                            <Button type="submit" variant="ghost" disabled={submitting || !replyContent.trim()} className="text-sm px-3 py-1.5 h-auto">Reply</Button>
                                        </div>
                                    </form>
                                )}

                                {/* Replies */}
                                {comment.replies?.length > 0 && (
                                    <div className="mt-3 space-y-3">
                                        {comment.replies.map((reply: any) => (
                                            <div key={reply.id} className="flex gap-2">
                                                {/* Reply author avatar */}
                                                <Link href={`/profile/${reply.user.id}`} className="shrink-0">
                                                    <img
                                                        src={reply.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user.name}`}
                                                        className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 hover:border-indigo-500 transition-colors object-cover"
                                                        alt={reply.user.name}
                                                    />
                                                </Link>
                                                <div className={`flex-1 ${reply.isOptimistic ? "opacity-50" : ""}`}>
                                                    <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl rounded-tl-none px-3 py-2">
                                                        <Link
                                                            href={`/profile/${reply.user.id}`}
                                                            className="font-semibold text-xs text-neutral-300 hover:text-indigo-400 transition-colors mr-2"
                                                        >
                                                            {reply.user.name}
                                                        </Link>
                                                        <span className="text-xs text-neutral-400 italic">
                                                            {reply.isOptimistic ? "Membalas..." : reply.content}
                                                        </span>
                                                        {!reply.isOptimistic && <span className="text-xs text-neutral-400 ml-1">{reply.content}</span>}
                                                    </div>
                                                    {session?.user?.id === reply.userId && (
                                                        <button onClick={() => handleDelete(reply.id, comment.id)} className="text-[10px] text-red-500/70 hover:text-red-500 ml-3 mt-1 font-medium">Delete</button>
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
