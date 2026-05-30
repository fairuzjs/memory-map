"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { GlobalChatMessageItem, ChatMessage } from "./GlobalChatMessageItem"
import { GlobalChatInput } from "./GlobalChatInput"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { MessageSquare, ChevronDown, Globe } from "lucide-react"

// ── Date divider helper ──────────────────────────────────────────────────────

function formatDateLabel(dateString: string): string {
    const date = new Date(dateString)
    const now  = new Date()
    const isToday     = date.toDateString() === now.toDateString()
    const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString()
    if (isToday)     return "Hari ini"
    if (isYesterday) return "Kemarin"
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function DateDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 my-4 px-2">
            <div className="flex-1 h-px bg-black/15" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 px-3 py-1 rounded-full border border-black/15 bg-white/60 backdrop-blur-sm">
                {label}
            </span>
            <div className="flex-1 h-px bg-black/15" />
        </div>
    )
}

export function GlobalChatBoard() {
    const { data: session } = useSession()
    const currentUserId   = session?.user?.id
    const currentUserRole = (session?.user as any)?.role || "USER"

    const [messages, setMessages]           = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading]         = useState(true)
    const [nextCursor, setNextCursor]       = useState<string | null>(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [showScrollBtn, setShowScrollBtn] = useState(false)
    const [replyingTo, setReplyingTo]       = useState<ChatMessage | null>(null)

    const scrollRef        = useRef<HTMLDivElement>(null)
    const lastMessageIdRef = useRef<string | null>(null)
    const { confirmProps, openConfirm } = useConfirm()

    // ── Smart auto-scroll ──────────────────────────────────────────────────
    const isNearBottom = useCallback(() => {
        if (!scrollRef.current) return true
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        return scrollHeight - scrollTop - clientHeight < 150
    }, [])

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [])

    // Show/hide scroll-to-bottom FAB
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200)
    }, [])

    // ── Sync lastMessageIdRef ──────────────────────────────────────────────
    useEffect(() => {
        if (messages.length > 0) {
            lastMessageIdRef.current = messages[messages.length - 1].id
        }
    }, [messages])

    // ── Initial fetch ──────────────────────────────────────────────────────
    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch("/api/global-chat")
            if (!res.ok) throw new Error("Gagal mengambil pesan")
            const data = await res.json()
            setMessages(data.messages)
            setNextCursor(data.nextCursor)
            setTimeout(scrollToBottom, 100)
        } catch {
            toast.error("Gagal memuat obrolan")
        } finally {
            setIsLoading(false)
        }
    }, [scrollToBottom])

    // ── Load older messages ────────────────────────────────────────────────
    const loadOlderMessages = useCallback(async () => {
        if (!nextCursor || isLoadingMore) return
        setIsLoadingMore(true)

        const scrollEl = scrollRef.current
        const prevScrollHeight = scrollEl?.scrollHeight ?? 0

        try {
            const res = await fetch(`/api/global-chat?cursor=${nextCursor}`)
            if (!res.ok) throw new Error("Gagal memuat pesan lama")
            const data = await res.json()

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id))
                const unique = (data.messages as ChatMessage[]).filter(m => !existingIds.has(m.id))
                if (unique.length === 0) return prev
                return [...unique, ...prev]
            })
            setNextCursor(data.nextCursor)

            requestAnimationFrame(() => {
                if (scrollEl) {
                    scrollEl.scrollTop += scrollEl.scrollHeight - prevScrollHeight
                }
            })
        } catch {
            toast.error("Gagal memuat pesan lama")
        } finally {
            setIsLoadingMore(false)
        }
    }, [nextCursor, isLoadingMore])

    // ── Realtime + Polling + Full Sync ─────────────────────────────────────
    useEffect(() => {
        if (!currentUserId) {
            setIsLoading(false)
            return
        }

        fetchMessages()

        // 1. Supabase Realtime — instant delivery
        const channel = supabase
            .channel('global-chat')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'global_chat_messages' },
                async (payload) => {
                    if (payload.new.isDeleted) return
                    try {
                        const res = await fetch(`/api/global-chat?singleId=${payload.new.id}`)
                        if (res.ok) {
                            const data = await res.json()
                            if (data.message) {
                                setMessages(prev => {
                                    if (prev.find(m => m.id === data.message.id)) return prev
                                    return [...prev, data.message]
                                })
                                if (isNearBottom()) setTimeout(scrollToBottom, 100)
                            }
                        }
                    } catch (e) {
                        console.error("[GlobalChat] Realtime INSERT error:", e)
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'global_chat_messages' },
                (payload) => {
                    if (payload.new.isDeleted) {
                        setMessages(prev => prev.filter(m => m.id !== payload.new.id))
                    }
                }
            )
            .subscribe()

        // 2. Incremental polling (10s)
        const pollingInterval = setInterval(async () => {
            const lastId = lastMessageIdRef.current
            if (!lastId) return
            try {
                const res = await fetch(`/api/global-chat?after=${lastId}`)
                if (!res.ok) return
                const data = await res.json()
                const newMsgs = data.messages as ChatMessage[]
                if (newMsgs.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id))
                        const unique = newMsgs.filter(m => !existingIds.has(m.id))
                        if (unique.length === 0) return prev
                        return [...prev, ...unique]
                    })
                    if (isNearBottom()) setTimeout(scrollToBottom, 100)
                }
            } catch { /* Silently fail */ }
        }, 10000)

        // 3. Full sync (60s)
        const fullSyncInterval = setInterval(async () => {
            try {
                const res = await fetch("/api/global-chat")
                if (!res.ok) return
                const data = await res.json()
                const latest = data.messages as ChatMessage[]
                setMessages(prev => {
                    if (latest.length === 0 && prev.length === 0) return prev
                    const latestIds = new Set(latest.map(m => m.id))
                    const oldestLatestTime = latest.length > 0
                        ? new Date(latest[0].createdAt).getTime()
                        : Infinity
                    const olderMessages = prev.filter(m =>
                        !latestIds.has(m.id) &&
                        new Date(m.createdAt).getTime() < oldestLatestTime
                    )
                    const merged = [...olderMessages, ...latest]
                    if (merged.length === prev.length &&
                        merged[0]?.id === prev[0]?.id &&
                        merged[merged.length - 1]?.id === prev[prev.length - 1]?.id) {
                        return prev
                    }
                    return merged
                })
            } catch { /* Silently fail */ }
        }, 60000)

        return () => {
            clearInterval(pollingInterval)
            clearInterval(fullSyncInterval)
            supabase.removeChannel(channel)
        }
    }, [currentUserId, fetchMessages, scrollToBottom, isNearBottom])

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleReply = useCallback((message: ChatMessage) => {
        setReplyingTo(message)
    }, [])

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null)
    }, [])

    const handleSend = useCallback(async (content: string, replyToId?: string) => {
        const res = await fetch("/api/global-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, ...(replyToId ? { replyToId } : {}) })
        })
        if (!res.ok) {
            const error = await res.json()
            toast.error(error.error || "Gagal mengirim pesan")
            throw new Error(error.error)
        }
        const newMessage = await res.json()
        setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
        })
        setReplyingTo(null)
        setTimeout(scrollToBottom, 100)
    }, [scrollToBottom])

    const handleDelete = useCallback((messageId: string) => {
        openConfirm({
            title: "Hapus Pesan",
            description: "Pesan yang dihapus tidak bisa dikembalikan. Lanjutkan?",
            confirmLabel: "Hapus",
            variant: "danger",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/global-chat/${messageId}`, { method: "DELETE" })
                    if (!res.ok) {
                        const error = await res.json()
                        throw new Error(error.error || "Gagal menghapus pesan")
                    }
                    toast.success("Pesan berhasil dihapus")
                    setMessages(prev => prev.filter(m => m.id !== messageId))
                } catch (error: any) {
                    toast.error(error.message)
                }
            }
        })
    }, [openConfirm])

    // ── Not logged in state ────────────────────────────────────────────────
    if (!currentUserId) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl border-[3px] border-black bg-white py-20 text-center shadow-[4px_4px_0_#000]"
            >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-[var(--mm-warning)] shadow-[4px_4px_0_#000]">
                    <span className="text-2xl">🔒</span>
                </div>
                <h2 className="mb-2 text-[18px] font-black uppercase text-black">Akses Terbatas</h2>
                <p className="text-[14px] font-bold text-black/60">Anda harus login untuk mengakses Global Chat.</p>
            </motion.div>
        )
    }

    // ── Build messages with date separators ────────────────────────────────
    const messagesWithDividers: Array<ChatMessage | { _type: "divider"; label: string; _key: string }> = []
    let lastDateLabel = ""
    for (const msg of messages) {
        const label = formatDateLabel(msg.createdAt)
        if (label !== lastDateLabel) {
            messagesWithDividers.push({ _type: "divider", label, _key: `divider-${msg.id}` })
            lastDateLabel = label
        }
        messagesWithDividers.push(msg)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col rounded-2xl border-[3px] border-black shadow-[6px_6px_0_#000] relative overflow-hidden"
            style={{ height: 600 }}
        >
            <ConfirmDialog {...confirmProps} />

            {/* ── Chat Header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black shrink-0 bg-[var(--mm-primary)] shadow-[0_3px_0_#000]">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border-[2.5px] border-black bg-white shadow-[2px_2px_0_#000]">
                        <Globe className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-black uppercase tracking-wide leading-none">
                            Global Chat
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {/* Pulsing live indicator */}
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-50" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
                            </span>
                            <span className="text-[10px] font-black text-black uppercase tracking-widest">
                                Live
                            </span>
                            <span className="text-[10px] text-black/50 font-black">·</span>
                            <span className="text-[10px] text-black/60 font-bold">
                                {messages.length} pesan
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center h-8 w-8 rounded-xl border-[2px] border-black bg-white shadow-[2px_2px_0_#000]">
                    <MessageSquare className="w-4 h-4 text-black" />
                </div>
            </div>

            {/* ── Chat Area ─────────────────────────────────────────── */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 md:p-5 relative bg-[var(--mm-bg)]"
                style={{
                    scrollBehavior: 'smooth',
                    backgroundImage: "radial-gradient(circle at 20px 20px, rgba(0,0,0,0.05) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            >
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-3">
                        <div className="w-12 h-12 border-4 border-black border-t-[var(--mm-success)] rounded-full animate-spin shadow-[2px_2px_0_#000]" />
                        <p className="text-[13px] font-black uppercase text-black/50 tracking-wider">Memuat obrolan…</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <div className="text-5xl mb-3">💬</div>
                        <p className="font-black text-[18px] uppercase text-black">Belum ada obrolan.</p>
                        <p className="text-sm font-bold text-black/60 mt-1">Jadilah yang pertama menyapa!</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto pb-2">
                        {/* Load More button */}
                        {nextCursor && (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={loadOlderMessages}
                                    disabled={isLoadingMore}
                                    className="px-5 py-2 text-[11px] font-black uppercase border-[2px] border-black bg-white hover:bg-[var(--mm-warning)] shadow-[2px_2px_0_#000] hover:shadow-[3px_3px_0_#000] rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50"
                                >
                                    {isLoadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Memuat...
                                        </span>
                                    ) : (
                                        "⬆ Muat Pesan Lama"
                                    )}
                                </button>
                            </div>
                        )}

                        {messagesWithDividers.map(item => {
                            if ("_type" in item && item._type === "divider") {
                                return <DateDivider key={item._key} label={item.label} />
                            }
                            const msg = item as ChatMessage
                            return (
                                <GlobalChatMessageItem
                                    key={msg.id}
                                    message={msg}
                                    currentUserId={currentUserId}
                                    currentUserRole={currentUserRole}
                                    onDelete={handleDelete}
                                    onReply={handleReply}
                                />
                            )
                        })}
                    </div>
                )}

                {/* ── Scroll to bottom FAB ── */}
                {showScrollBtn && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 right-4 flex items-center justify-center w-9 h-9 bg-white border-[2.5px] border-black rounded-full shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-y-px active:shadow-none transition-all"
                        title="Ke pesan terbaru"
                    >
                        <ChevronDown className="w-4 h-4 text-black" />
                    </button>
                )}
            </div>

            {/* ── Input ─────────────────────────────────────────────── */}
            <GlobalChatInput
                onSend={handleSend}
                isDisabled={isLoading}
                replyTo={replyingTo}
                onCancelReply={handleCancelReply}
            />
        </motion.div>
    )
}
