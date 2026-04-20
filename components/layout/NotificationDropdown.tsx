"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, MessageCircle, Heart, Loader2, X, Users, CheckCircle2, XCircle, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"

const timeAgo = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
}

interface Notification {
    id: string
    type: "COMMENT" | "REACTION" | "REPLY" | "COLLABORATION_INVITE" | "FOLLOW"
    isRead: boolean
    createdAt: string
    memoryId: string | null
    actor: {
        id: string
        name: string
        image: string | null
    }
    memory: {
        id: string
        title: string
    } | null
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [respondingId, setRespondingId] = useState<string | null>(null)
    const { confirmProps, openConfirm } = useConfirm()
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
            }
        } catch (error) {
            console.error("Failed to fetch notifications")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const markAsRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error("Failed to mark as read")
        }
    }

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllAsRead: true })
            })
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark all as read")
        }
    }

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        e.preventDefault()
        try {
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            })
            setNotifications(prev => {
                const updated = prev.filter(n => n.id !== id)
                setUnreadCount(updated.filter(n => !n.isRead).length)
                return updated
            })
        } catch (error) {
            console.error("Failed to delete notification")
        }
    }

    const deleteAllNotifications = async () => {
        openConfirm({
            title: "Hapus Semua Notifikasi?",
            description: "Seluruh riwayat notifikasi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.",
            confirmLabel: "Hapus Semua",
            cancelLabel: "Batal",
            variant: "warning",
            onConfirm: async () => {
                await fetch("/api/notifications", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deleteAll: true })
                })
                setNotifications([])
                setUnreadCount(0)
            }
        })
    }

    // Handle accept / decline collaboration invite
    const handleCollaborationRespond = async (
        e: React.MouseEvent,
        notifId: string,
        memoryId: string,
        action: "ACCEPTED" | "DECLINED"
    ) => {
        e.stopPropagation()
        e.preventDefault()
        setRespondingId(notifId)
        try {
            const res = await fetch(`/api/memories/${memoryId}/collaborators/respond`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })

            // 200 OK → berhasil respond
            // 409 → sudah pernah dijawab sebelumnya
            // Keduanya: hapus notifikasi dari DB & UI
            if (res.ok || res.status === 409) {
                // Hapus notifikasi dari database (bukan hanya mark as read)
                await fetch("/api/notifications", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: notifId })
                })
                setNotifications(prev => prev.filter(n => n.id !== notifId))
                setUnreadCount(prev => Math.max(0, prev - 1))
                return
            }

            const errData = await res.json().catch(() => ({}))
            console.error("Respond API error:", res.status, errData)
        } catch (err) {
            console.error("Failed to respond to collaboration invite", err)
        } finally {
            setRespondingId(null)
        }
    }



    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    if (!isOpen) fetchNotifications()
                }}
                className={`flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.05] border transition-all relative ${isOpen ? "border-indigo-500/50 bg-white/[0.08]" : "border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.08]"
                    }`}
                title="Notifications"
            >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? "text-indigo-400" : "text-neutral-400"}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#080810]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed left-1/2 -translate-x-1/2 top-[88px] w-[calc(100vw-32px)] max-w-[400px] sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-full sm:mt-3 sm:w-80 md:w-96 z-[200] bg-[#11111a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] relative z-20">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-indigo-400" />
                                    Notifications
                                </h3>
                                <div className="flex gap-3">
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={deleteAllNotifications}
                                            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                                        >
                                            Delete all
                                        </button>
                                    )}
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            Mark read
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar relative z-10">
                                {loading && notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                        <span className="text-xs text-neutral-500">Checking for updates...</span>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-1">
                                            <Bell className="w-6 h-6 text-neutral-600" />
                                        </div>
                                        <p className="text-sm font-medium text-neutral-400">No notifications yet</p>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            Interactions with your memories will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.04]">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-4 transition-all hover:bg-white/5 relative group ${!n.isRead ? "bg-indigo-500/[0.02]" : ""}`}
                                            >
                                                {!n.isRead && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full z-20" />
                                                )}

                                                <div className="flex gap-3 relative z-0">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={n.actor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor.id}`}
                                                            className="w-10 h-10 rounded-full border border-white/10"
                                                            alt=""
                                                        />
                                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#11111a] ${n.type === "REACTION" ? "bg-rose-500" :
                                                            n.type === "COLLABORATION_INVITE" ? "bg-violet-500" :
                                                                n.type === "FOLLOW" ? "bg-emerald-500" :
                                                                "bg-indigo-500"
                                                            }`}>
                                                            {n.type === "REACTION" ? (
                                                                <Heart className="w-2.5 h-2.5 text-white fill-white" />
                                                            ) : n.type === "COLLABORATION_INVITE" ? (
                                                                <Users className="w-2.5 h-2.5 text-white" />
                                                            ) : n.type === "FOLLOW" ? (
                                                                <UserPlus className="w-2.5 h-2.5 text-white" />
                                                            ) : (
                                                                <MessageCircle className="w-2.5 h-2.5 text-white" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-neutral-300 leading-snug">
                                                            <span className="font-bold text-white">{n.actor.name}</span>
                                                            {" "}
                                                            {n.type === "REACTION" ? "reacted to" :
                                                                n.type === "COMMENT" ? "commented on" :
                                                                    n.type === "REPLY" ? "replied to your comment in" :
                                                                        n.type === "FOLLOW" ? "started following you" :
                                                                            "invited you to collaborate on"}
                                                            {n.type !== "FOLLOW" && (
                                                                <>
                                                                    {" "}
                                                                    <span className="font-semibold text-indigo-400">
                                                                        &quot;{n.memory?.title || "a memory"}&quot;
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                                                            {timeAgo(n.createdAt)}
                                                        </p>

                                                        {/* Accept / Decline buttons for collaboration invites */}
                                                        {n.type === "COLLABORATION_INVITE" && n.memoryId && (
                                                            <div className="flex items-center gap-2 mt-2.5" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    disabled={respondingId === n.id}
                                                                    onClick={(e) => handleCollaborationRespond(e, n.id, n.memoryId!, "ACCEPTED")}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
                                                                >
                                                                    {respondingId === n.id ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                    )}
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    disabled={respondingId === n.id}
                                                                    onClick={(e) => handleCollaborationRespond(e, n.id, n.memoryId!, "DECLINED")}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/30 transition-all disabled:opacity-50"
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Delete button — hide for collaboration invites karena ada tombol sendiri */}
                                                    {n.type !== "COLLABORATION_INVITE" && (
                                                        <button
                                                            onClick={(e) => deleteNotification(e, n.id)}
                                                            className="shrink-0 self-center p-1.5 rounded-lg border border-transparent text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 relative z-30"
                                                            title="Delete"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Clickable link — only for non-collaboration notifications */}
                                                {n.type !== "COLLABORATION_INVITE" && (
                                                    <Link
                                                        href={n.type === "FOLLOW" ? `/profile/${n.actor.id}` : (n.memory ? `/memories/${n.memory.id}` : "/map")}
                                                        onClick={() => {
                                                            if (!n.isRead) markAsRead(n.id)
                                                            setIsOpen(false)
                                                        }}
                                                        className="absolute inset-0 z-10"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-white/[0.06] bg-white/[0.01] text-center relative z-20">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
        <ConfirmDialog {...confirmProps} />
        </>
    )
}
