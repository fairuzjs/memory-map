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

export function GlobalChatBoard() {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id
    const currentUserRole = (session?.user as any)?.role || "USER"

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [nextCursor, setNextCursor] = useState<string | null>(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const lastMessageIdRef = useRef<string | null>(null)
    const { confirmProps, openConfirm } = useConfirm()

    // ── Smart auto-scroll: hanya scroll jika user dekat bawah ──
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

    // ── Sinkronisasi lastMessageIdRef ──
    useEffect(() => {
        if (messages.length > 0) {
            lastMessageIdRef.current = messages[messages.length - 1].id
        }
    }, [messages])

    // ── Initial fetch: muat batch terbaru ──
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

    // ── Load More: muat pesan lama via cursor pagination ──
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

            // Pertahankan posisi scroll setelah prepend
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

    // ── Main effect: Realtime + Incremental Polling + Full Sync ──
    useEffect(() => {
        if (!currentUserId) {
            setIsLoading(false)
            return
        }

        fetchMessages()

        // ─── 1. Supabase Realtime — instant delivery (best-effort) ───
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
            .subscribe((status) => {
                console.log("[GlobalChat] Realtime status:", status)
            })

        // ─── 2. Incremental polling (10s) — hanya ambil pesan baru ───
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
            } catch {
                // Silently fail
            }
        }, 10000)

        // ─── 3. Full sync (60s) — sinkronisasi delete/update ───
        const fullSyncInterval = setInterval(async () => {
            try {
                const res = await fetch("/api/global-chat")
                if (!res.ok) return
                const data = await res.json()
                const latest = data.messages as ChatMessage[]

                setMessages(prev => {
                    if (latest.length === 0 && prev.length === 0) return prev

                    // Pertahankan pesan lama dari "Load More" yang bukan bagian batch terbaru
                    const latestIds = new Set(latest.map(m => m.id))
                    const oldestLatestTime = latest.length > 0
                        ? new Date(latest[0].createdAt).getTime()
                        : Infinity
                    const olderMessages = prev.filter(m =>
                        !latestIds.has(m.id) &&
                        new Date(m.createdAt).getTime() < oldestLatestTime
                    )

                    const merged = [...olderMessages, ...latest]

                    // Skip re-render jika tidak ada perubahan
                    if (merged.length === prev.length &&
                        merged[0]?.id === prev[0]?.id &&
                        merged[merged.length - 1]?.id === prev[prev.length - 1]?.id) {
                        return prev
                    }
                    return merged
                })
            } catch {
                // Silently fail
            }
        }, 60000)

        return () => {
            clearInterval(pollingInterval)
            clearInterval(fullSyncInterval)
            supabase.removeChannel(channel)
        }
    }, [currentUserId, fetchMessages, scrollToBottom, isNearBottom])

    // ── Stabilized callbacks ──
    const handleSend = useCallback(async (content: string) => {
        const res = await fetch("/api/global-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content })
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
                    // Realtime UPDATE akan otomatis menghapus di klien lain.
                    // Kita juga bisa hapus instan dari UI ini:
                    setMessages(prev => prev.filter(m => m.id !== messageId))
                } catch (error: any) {
                    toast.error(error.message)
                }
            }
        })
    }, [openConfirm])

    if (!currentUserId) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-2xl border-[3px] border-black bg-white py-20 text-center shadow-[4px_4px_0_#000]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-black bg-[var(--mm-warning)] shadow-[4px_4px_0_#000]">
                    <span className="text-2xl">🔒</span>
                </div>
                <h2 className="mb-2 text-[18px] font-black uppercase text-black">Akses Terbatas</h2>
                <p className="text-[14px] font-bold text-black/60">Anda harus login untuk mengakses Global Chat.</p>
            </motion.div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[600px] rounded-2xl border-[3px] border-black bg-[var(--mm-bg)] shadow-[4px_4px_0_#000] relative overflow-hidden">
            <ConfirmDialog {...confirmProps} />
            
            {/* Chat Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 relative bg-[url('/img/pattern.svg')] bg-repeat"
                style={{ scrollBehavior: 'smooth' }}
            >
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-12 h-12 border-4 border-black border-t-[var(--mm-success)] rounded-full animate-spin shadow-[2px_2px_0_#000]" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <div className="text-4xl mb-2">💬</div>
                        <p className="font-black text-[18px] uppercase text-black">Belum ada obrolan.</p>
                        <p className="text-sm font-bold text-black/60">Jadilah yang pertama menyapa!</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto pb-4">
                        {/* Load More — Muat pesan lama */}
                        {nextCursor && (
                            <div className="flex justify-center mb-4">
                                <button
                                    onClick={loadOlderMessages}
                                    disabled={isLoadingMore}
                                    className="px-4 py-2 text-xs font-black uppercase border-2 border-black bg-white hover:bg-yellow-300 shadow-[2px_2px_0_#000] rounded-lg transition-colors disabled:opacity-50"
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

                        {messages.map(msg => (
                            <GlobalChatMessageItem
                                key={msg.id}
                                message={msg}
                                currentUserId={currentUserId}
                                currentUserRole={currentUserRole}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Input */}
            <GlobalChatInput onSend={handleSend} isDisabled={isLoading} />
        </motion.div>
    )
}
