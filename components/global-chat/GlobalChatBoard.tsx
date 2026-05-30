"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { GlobalChatMessageItem, ChatMessage } from "./GlobalChatMessageItem"
import { GlobalChatInput } from "./GlobalChatInput"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { MessageSquareText } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function GlobalChatBoard() {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id
    const currentUserRole = (session?.user as any)?.role || "USER"

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)
    const { confirmProps, openConfirm } = useConfirm()
    
    // Auto scroll logic
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [])

    const fetchMessages = useCallback(async (isPolling = false) => {
        try {
            const res = await fetch("/api/global-chat")
            if (!res.ok) throw new Error("Gagal mengambil pesan")
            
            const data = await res.json()
            setMessages(data.messages)
            
            if (!isPolling) {
                setTimeout(scrollToBottom, 100)
            }
        } catch (error) {
            if (!isPolling) toast.error("Gagal memuat obrolan")
        } finally {
            if (!isPolling) setIsLoading(false)
        }
    }, [scrollToBottom])

    useEffect(() => {
        if (!currentUserId) {
            setIsLoading(false)
            return
        }

        fetchMessages()

        // ──────────────────────────────────────────────
        // 1. Supabase Realtime — instant delivery (best-effort)
        // ──────────────────────────────────────────────
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
                                setTimeout(scrollToBottom, 100)
                            }
                        }
                    } catch (e) {
                        console.error("[GlobalChat] Error fetching new message:", e)
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

        // ──────────────────────────────────────────────
        // 2. Polling — SELALU aktif sebagai safety net
        //    Hanya update state jika ada perubahan nyata
        // ──────────────────────────────────────────────
        const pollingInterval = setInterval(async () => {
            try {
                const res = await fetch("/api/global-chat")
                if (!res.ok) return
                const data = await res.json()
                const incoming = data.messages as ChatMessage[]

                setMessages(prev => {
                    const prevLastId = prev.length > 0 ? prev[prev.length - 1].id : null
                    const newLastId = incoming.length > 0 ? incoming[incoming.length - 1].id : null

                    // Hanya update jika ada perubahan (jumlah berbeda atau pesan terakhir berbeda)
                    if (prev.length !== incoming.length || prevLastId !== newLastId) {
                        // Ada pesan baru → auto-scroll
                        if (incoming.length > prev.length) {
                            setTimeout(scrollToBottom, 100)
                        }
                        return incoming
                    }
                    return prev // Tidak ada perubahan, skip re-render
                })
            } catch {
                // Silently fail untuk polling
            }
        }, 3000)

        return () => {
            clearInterval(pollingInterval)
            supabase.removeChannel(channel)
        }
    }, [currentUserId, fetchMessages, scrollToBottom])

    const handleSend = async (content: string) => {
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
    }

    const handleDelete = (messageId: string) => {
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
    }

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
