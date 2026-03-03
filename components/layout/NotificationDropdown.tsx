"use client"

import { useState, useEffect } from "react"
import { Bell, MessageCircle, Heart, Loader2, CheckCircle2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

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
    type: "COMMENT" | "REACTION" | "REPLY"
    isRead: boolean
    createdAt: string
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
        // Optional: polling or websocket
        const interval = setInterval(fetchNotifications, 60000) // update every minute
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
        if (!confirm("Are you sure you want to delete all notifications?")) return
        try {
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deleteAll: true })
            })
            setNotifications([])
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to delete all notifications")
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    if (!isOpen) fetchNotifications()
                }}
                className={`flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] border transition-all relative ${isOpen ? "border-indigo-500/50 bg-white/[0.08]" : "border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.08]"
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
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed inset-x-4 top-[80px] sm:absolute sm:inset-auto sm:right-0 sm:mt-3 sm:w-96 z-50 bg-[#11111a] border border-white/[0.08] rounded-[1.5rem] shadow-2xl overflow-hidden"
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

                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar relative z-10">
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
                                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#11111a] ${n.type === "REACTION" ? "bg-rose-500" : "bg-indigo-500"
                                                            }`}>
                                                            {n.type === "REACTION" ? (
                                                                <Heart className="w-2.5 h-2.5 text-white fill-white" />
                                                            ) : (
                                                                <MessageCircle className="w-2.5 h-2.5 text-white" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-neutral-300 leading-snug">
                                                            <span className="font-bold text-white">{n.actor.name}</span>
                                                            {" "}
                                                            {n.type === "REACTION" ? "reacted to" : n.type === "COMMENT" ? "commented on" : "replied to your comment in"}
                                                            {" "}
                                                            <span className="font-semibold text-indigo-400">"{n.memory?.title || "your memory"}"</span>
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                                                            {timeAgo(n.createdAt)}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={(e) => deleteNotification(e, n.id)}
                                                        className="shrink-0 self-center p-1.5 rounded-lg border border-transparent text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 relative z-30"
                                                        title="Delete"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <Link
                                                    href={n.memory ? `/map?id=${n.memory.id}` : "/map"}
                                                    onClick={() => {
                                                        if (!n.isRead) markAsRead(n.id)
                                                        setIsOpen(false)
                                                    }}
                                                    className="absolute inset-0 z-10"
                                                />
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
    )
}
