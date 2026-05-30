"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Loader2, MessagesSquare } from "lucide-react"
import toast from "react-hot-toast"

interface ChatMessage {
    id: string
    content: string
    createdAt: string
    userId: string
    user: {
        id: string
        name: string
        image: string | null
    }
}

interface AlbumChatDrawerProps {
    albumId: string
    currentUserId?: string
}

interface AlbumMember {
    id: string
    name: string
    image: string | null
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "Baru saja"
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

export function AlbumChatDrawer({ albumId, currentUserId }: AlbumChatDrawerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [members, setMembers] = useState<AlbumMember[]>([])

    // Tag user states
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
    const [tagSearchQuery, setTagSearchQuery] = useState("")
    const [selectedTagIndex, setSelectedTagIndex] = useState(0)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const prevMsgCount = useRef(0)

    const fetchMessages = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const res = await fetch(`/api/albums/${albumId}/chat`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                
                if (prevMsgCount.current === 0) {
                    prevMsgCount.current = data.length
                } else if (data.length > prevMsgCount.current) {
                    if (!isOpen) {
                        setUnreadCount(c => c + (data.length - prevMsgCount.current))
                    }
                    prevMsgCount.current = data.length
                }
            }
        } catch (error) {
            console.error("Failed to load chat history", error)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    // Load active album members for tagging and read receipt simulation
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch(`/api/albums/${albumId}`)
                if (res.ok) {
                    const data = await res.json()
                    const owner = data.user ? {
                        id: data.user.id,
                        name: data.user.name,
                        image: data.user.image
                    } : null
                    const collabs = (data.collaborators || [])
                        .filter((c: any) => c.status === "ACCEPTED")
                        .map((c: any) => ({
                            id: c.user.id,
                            name: c.user.name,
                            image: c.user.image
                        }))
                    const allMembers = owner ? [owner, ...collabs] : collabs
                    setMembers(allMembers)
                }
            } catch (error) {
                console.error("Failed to load album members", error)
            }
        }
        fetchMembers()
    }, [albumId])

    // Initial silent load on mount
    useEffect(() => {
        fetchMessages(true)
    }, [albumId])

    // Reset unread count when chat is opened
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0)
            if (messages.length > 0) {
                prevMsgCount.current = messages.length
            }
            setTimeout(() => {
                scrollBottom("instant")
                inputRef.current?.focus()
            }, 150)
        }
    }, [isOpen])

    // Background polling interval (whether open or closed)
    useEffect(() => {
        const timer = setInterval(() => {
            fetchMessages(true)
        }, isOpen ? 4000 : 8000)
        return () => clearInterval(timer)
    }, [isOpen, albumId])

    const scrollBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior })
    }

    useEffect(() => {
        if (messages.length > 0 && isOpen) scrollBottom()
    }, [messages.length, isOpen])

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                const triggerBtn = document.getElementById("album-chat-trigger")
                if (triggerBtn && triggerBtn.contains(e.target as Node)) return
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleOutsideClick)
        return () => document.removeEventListener("mousedown", handleOutsideClick)
    }, [isOpen])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isSending) return

        const cleanInput = input.trim()
        setIsSending(true)
        setInput("")
        setTagDropdownOpen(false)

        try {
            const res = await fetch(`/api/albums/${albumId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: cleanInput })
            })

            if (res.ok) {
                const newMsg = await res.json()
                setMessages(prev => [...prev, newMsg])
            } else {
                toast.error("Gagal mengirim pesan")
                setInput(cleanInput)
            }
        } catch {
            toast.error("Gagal mengirim pesan")
            setInput(cleanInput)
        } finally {
            setIsSending(false)
        }
    }

    const handleChangeInput = (val: string) => {
        setInput(val)
        
        // Look for tag query (e.g. typing @bud)
        const words = val.split(" ")
        const lastWord = words[words.length - 1]
        
        if (lastWord.startsWith("@")) {
            setTagDropdownOpen(true)
            setTagSearchQuery(lastWord.slice(1))
            setSelectedTagIndex(0)
        } else {
            setTagDropdownOpen(false)
        }
    }

    const matchingTagMembers = members.filter(m => 
        m.id !== currentUserId && 
        m.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
    )

    useEffect(() => {
        if (tagDropdownOpen && matchingTagMembers.length === 0) {
            setTagDropdownOpen(false)
        }
    }, [matchingTagMembers, tagDropdownOpen])

    const handleSelectMemberTag = (member: AlbumMember) => {
        const words = input.split(" ")
        words[words.length - 1] = `@${member.name} `
        setInput(words.join(" "))
        setTagDropdownOpen(false)
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (tagDropdownOpen && matchingTagMembers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedTagIndex(prev => (prev + 1) % matchingTagMembers.length)
                return
            }
            if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedTagIndex(prev => (prev - 1 + matchingTagMembers.length) % matchingTagMembers.length)
                return
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault()
                handleSelectMemberTag(matchingTagMembers[selectedTagIndex])
                return
            }
            if (e.key === "Escape") {
                e.preventDefault()
                setTagDropdownOpen(false)
                return
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend(e as any)
        }
    }

    // Read Receipt Simulation: deterministic pseudo-random read indicators per message
    const getMessageReaders = (msg: ChatMessage) => {
        if (!members || members.length <= 1) return []
        
        const senderId = msg.userId
        const createdAt = new Date(msg.createdAt).getTime()
        const now = Date.now()
        const diffSec = (now - createdAt) / 1000

        // Filter out sender
        const potentialReaders = members.filter(m => m.id !== senderId)
        
        const getDeterministicRandom = (str: string, index: number) => {
            let hash = 0
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash)
            }
            const val = Math.sin(hash + index) * 10000
            return val - Math.floor(val)
        }

        return potentialReaders.filter((m, idx) => {
            if (m.id === currentUserId) return true
            if (diffSec > 45) return true
            if (diffSec > 15) return getDeterministicRandom(msg.id, idx) > 0.4
            if (diffSec > 5) return getDeterministicRandom(msg.id, idx) > 0.7
            return getDeterministicRandom(msg.id, idx) > 0.9
        })
    }

    // Highlight tags beautifully inside message content
    const renderMessageContent = (content: string) => {
        const words = content.split(/(\s+)/)
        return words.map((word, i) => {
            if (word.startsWith("@") && word.length > 1) {
                const username = word.slice(1)
                const isMember = members.some(m => m.name.toLowerCase() === username.toLowerCase())
                if (isMember) {
                    return (
                        <span 
                            key={i} 
                            className="px-1.5 py-0.5 rounded-md font-extrabold text-[11px] inline-block mx-0.5 text-white shadow-sm"
                            style={{ backgroundColor: "var(--mm-accent)" }}
                        >
                            {word}
                        </span>
                    )
                }
            }
            return word
        })
    }

    // Group messages by date
    const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((acc, msg) => {
        const date = new Date(msg.createdAt).toLocaleDateString("id-ID", {
            weekday: "long", day: "numeric", month: "long"
        })
        const last = acc[acc.length - 1]
        if (last && last.date === date) {
            last.msgs.push(msg)
        } else {
            acc.push({ date, msgs: [msg] })
        }
        return acc
    }, [])

    return (
        <>
            {/* ── Floating Trigger ────────────────────────────────── */}
            <button
                id="album-chat-trigger"
                onClick={() => setIsOpen(prev => !prev)}
                style={{
                    backgroundColor: isOpen ? "var(--mm-ink)" : "var(--mm-surface)",
                    borderColor: "rgba(0, 0, 0, 0.08)",
                    color: isOpen ? "var(--mm-bg)" : "var(--mm-ink)",
                }}
                className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-40 flex h-[52px] w-[52px] items-center justify-center border rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                title="Obrolan Album"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.span
                            key="close"
                            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X className="h-5 w-5" strokeWidth={2} />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="chat"
                            initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.15 }}
                            className="relative"
                        >
                            <MessageSquare className="h-5 w-5" strokeWidth={2} />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 text-[9px] font-black rounded-full flex items-center justify-center shadow-md text-white"
                                    style={{ backgroundColor: "var(--mm-accent)" }}
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* ── Chat Widget Panel ────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={drawerRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bottom-24 right-5 md:bottom-[104px] md:right-6 z-40 flex flex-col w-[360px] max-w-[calc(100vw-40px)] h-[550px] max-h-[calc(100vh-140px)]"
                        style={{
                            backgroundColor: "var(--mm-surface)",
                            border: "1px solid rgba(0, 0, 0, 0.08)",
                            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)",
                            borderRadius: "24px",
                            overflow: "hidden",
                        }}
                    >
                        {/* ── Header ──────────────────────────────────── */}
                        <div
                            className="flex items-center justify-between px-4 py-3.5 shrink-0"
                            style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)", backgroundColor: "var(--mm-surface)" }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/5"
                                    style={{ backgroundColor: "var(--mm-primary)" }}
                                >
                                    <MessagesSquare className="w-4 h-4" style={{ color: "var(--mm-ink)" }} strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black uppercase tracking-wider" style={{ color: "var(--mm-ink)" }}>
                                        Obrolan Album
                                    </h3>
                                    <p className="text-[10px] font-bold" style={{ color: "var(--mm-ink-muted)" }}>
                                        {messages.length} pesan · live
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 active:scale-95"
                                style={{ color: "var(--mm-ink)" }}
                            >
                                <X className="w-4 h-4" strokeWidth={2} />
                            </button>
                        </div>

                        {/* ── Message Feed ────────────────────────────── */}
                        <div
                            className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
                            style={{
                                backgroundColor: "var(--mm-bg)",
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(0, 0, 0, 0.1) transparent",
                            }}
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 shadow-sm">
                                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--mm-primary)" }} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--mm-ink-muted)" }}>
                                        Memuat pesan...
                                    </span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black/5 shadow-sm">
                                        <MessagesSquare className="w-6 h-6" style={{ color: "var(--mm-ink)" }} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[13px] font-black uppercase tracking-wide" style={{ color: "var(--mm-ink)" }}>
                                            Belum ada obrolan
                                        </p>
                                        <p className="text-[11px] font-bold leading-relaxed" style={{ color: "var(--mm-ink-muted)" }}>
                                            Mulai percakapan bersama anggota album!
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {groupedMessages.map(({ date, msgs }) => (
                                        <div key={date}>
                                            {/* Date separator */}
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-[1px] bg-black/5" />
                                                <span
                                                    className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border border-black/5"
                                                    style={{
                                                        backgroundColor: "var(--mm-surface)",
                                                        color: "var(--mm-ink-muted)",
                                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                                    }}
                                                >
                                                    {date}
                                                </span>
                                                <div className="flex-1 h-[1px] bg-black/5" />
                                            </div>

                                            <div className="space-y-2">
                                                {msgs.map((msg, idx) => {
                                                    const isSelf = msg.userId === currentUserId
                                                    const prevMsg = idx > 0 ? msgs[idx - 1] : null
                                                    const showAvatar = !isSelf && (!prevMsg || prevMsg.userId !== msg.userId)
                                                    const showName = showAvatar
                                                    const readers = getMessageReaders(msg)

                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`flex gap-2 items-end ${isSelf ? "flex-row-reverse" : "flex-row"}`}
                                                        >
                                                            {/* Avatar */}
                                                            {!isSelf && (
                                                                <div className="w-7 shrink-0 self-end">
                                                                    {showAvatar ? (
                                                                        <img
                                                                            src={msg.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`}
                                                                            className="w-7 h-7 rounded-xl object-cover ring-1 ring-black/5 shadow-sm"
                                                                            alt=""
                                                                        />
                                                                    ) : (
                                                                        <div className="w-7" />
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Bubble */}
                                                            <div className={`flex flex-col max-w-[72%] ${isSelf ? "items-end" : "items-start"}`}>
                                                                {showName && (
                                                                    <span
                                                                        className="text-[9px] font-black uppercase tracking-wide mb-1 px-1"
                                                                        style={{ color: "var(--mm-ink-muted)" }}
                                                                    >
                                                                        {msg.user.name}
                                                                    </span>
                                                                )}
                                                                <div
                                                                    className="px-3.5 py-2.5 text-[13px] font-medium leading-relaxed break-words rounded-2xl border border-black/5 shadow-sm"
                                                                    style={isSelf ? {
                                                                        backgroundColor: "var(--mm-primary)",
                                                                        color: "var(--mm-ink)",
                                                                        borderBottomRightRadius: "4px",
                                                                    } : {
                                                                        backgroundColor: "var(--mm-surface)",
                                                                        color: "var(--mm-ink)",
                                                                        borderBottomLeftRadius: "4px",
                                                                    }}
                                                                >
                                                                    {renderMessageContent(msg.content)}
                                                                </div>
                                                                
                                                                {/* Time & Read Receipts */}
                                                                <div className={`flex items-center gap-1.5 mt-1 px-1 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                                                                    <span className="text-[9px] font-bold" style={{ color: "var(--mm-ink-muted)" }}>
                                                                        {formatRelativeTime(msg.createdAt)}
                                                                    </span>
                                                                    {readers.length > 0 && (
                                                                        <div 
                                                                            className="flex -space-x-1 items-center cursor-help"
                                                                            title={`Dibaca oleh: ${readers.map(r => r.name).join(", ")}`}
                                                                        >
                                                                            {readers.slice(0, 3).map(r => (
                                                                                <img
                                                                                    key={r.id}
                                                                                    src={r.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}`}
                                                                                    className="w-3.5 h-3.5 rounded-full ring-1 ring-black/5 object-cover"
                                                                                    alt={r.name}
                                                                                />
                                                                            ))}
                                                                            {readers.length > 3 && (
                                                                                <span className="text-[8px] font-black pl-0.5" style={{ color: "var(--mm-ink-muted)" }}>
                                                                                    +{readers.length - 3}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Tag Autocomplete Dropdown ────────────────── */}
                        {tagDropdownOpen && matchingTagMembers.length > 0 && (
                            <div 
                                className="absolute bottom-[84px] left-4 right-4 z-50 border rounded-xl p-1.5 shadow-xl max-h-[160px] overflow-y-auto"
                                style={{ backgroundColor: "var(--mm-surface)", borderColor: "rgba(0, 0, 0, 0.08)" }}
                            >
                                <p className="text-[8px] font-black uppercase tracking-wider text-neutral-400 px-2 py-1">
                                    Pilih kolaborator untuk ditag:
                                </p>
                                <div className="space-y-0.5">
                                    {matchingTagMembers.map((m, idx) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => handleSelectMemberTag(m)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent font-bold text-xs text-left transition-all hover:bg-black/5"
                                            style={{
                                                backgroundColor: idx === selectedTagIndex ? "var(--mm-primary)" : "transparent",
                                                color: "var(--mm-ink)"
                                            }}
                                        >
                                            <img
                                                src={m.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`}
                                                className="w-5 h-5 rounded-full ring-1 ring-black/5 object-cover"
                                                alt=""
                                            />
                                            <span>{m.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Input Area ──────────────────────────────── */}
                        <form
                            onSubmit={handleSend}
                            className="shrink-0 px-4 py-3"
                            style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", backgroundColor: "var(--mm-surface)" }}
                        >
                            <div
                                className="flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition-all shadow-sm bg-white/50 focus-within:bg-white focus-within:shadow focus-within:ring-2 focus-within:ring-black/5"
                                style={{
                                    borderColor: "rgba(0, 0, 0, 0.08)"
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => handleChangeInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ketik pesan obrolan..."
                                    maxLength={500}
                                    disabled={isSending}
                                    className="flex-1 bg-transparent text-[13px] font-bold focus:outline-none"
                                    style={{ color: "var(--mm-ink)" }}
                                />
                                <button
                                    type="submit"
                                    disabled={isSending || !input.trim()}
                                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: input.trim() && !isSending ? "var(--mm-ink)" : "rgba(0, 0, 0, 0.04)",
                                        color: input.trim() && !isSending ? "var(--mm-bg)" : "rgba(0, 0, 0, 0.3)"
                                    }}
                                >
                                    {isSending
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Send className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                            <p
                                className="text-center text-[9px] font-bold uppercase tracking-widest mt-2"
                                style={{ color: "var(--mm-ink-muted)" }}
                            >
                                Enter untuk kirim · {input.length}/500
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
