"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, MessageCircle, Heart, Loader2, X, Users, CheckCircle2, XCircle, UserPlus, Crown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ConfirmDialog, useConfirm } from "@/components/ui/ConfirmDialog"

const timeAgo = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d lalu`
    if (hours > 0) return `${hours}j lalu`
    if (minutes > 0) return `${minutes}m lalu`
    return 'Baru saja'
}

interface Notification {
    id: string
    type: "COMMENT" | "REACTION" | "REPLY" | "COLLABORATION_INVITE" | "FOLLOW" | "PREMIUM_ACTIVATED"
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
        if (isOpen) document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
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

    const handleCollaborationRespond = async (e: React.MouseEvent, notifId: string, memoryId: string, action: "ACCEPTED" | "DECLINED") => {
        e.stopPropagation()
        e.preventDefault()
        setRespondingId(notifId)
        try {
            const res = await fetch(`/api/memories/${memoryId}/collaborators/respond`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })

            if (res.ok || res.status === 409) {
                await fetch("/api/notifications", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: notifId })
                })
                setNotifications(prev => prev.filter(n => n.id !== notifId))
                setUnreadCount(prev => Math.max(0, prev - 1))
                return
            }
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
                    className={`flex items-center justify-center w-10 h-10 border-[3px] transition-all relative ${
                        isOpen 
                        ? "bg-[#FFFF00] border-black shadow-[3px_3px_0_#000] text-black" 
                        : "bg-white border-transparent hover:border-black text-black hover:bg-[#FFFF00]"
                    }`}
                    title="Notifications"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-none bg-[#FF00FF] border-[2px] border-black text-[10px] font-black text-white shadow-[2px_2px_0_#000]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed left-1/2 -translate-x-1/2 top-[88px] w-[calc(100vw-32px)] max-w-[400px] sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-full sm:mt-4 sm:w-80 md:w-96 z-[200] bg-white border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b-[4px] border-black flex items-center justify-between bg-[#FFFF00] relative z-20">
                                <h3 className="text-sm font-black text-black flex items-center gap-2 uppercase tracking-wide">
                                    <Bell className="w-4 h-4" />
                                    Notifikasi
                                </h3>
                                <div className="flex gap-3">
                                    {notifications.length > 0 && (
                                        <button onClick={deleteAllNotifications} className="text-[11px] font-black text-black hover:text-[#FF00FF] hover:underline uppercase transition-colors">
                                            Hapus Semua
                                        </button>
                                    )}
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[11px] font-black text-black hover:text-[#00FFFF] hover:underline uppercase transition-colors">
                                            Tandai Dibaca
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar relative z-10 bg-[#FFFDF0]">
                                {loading && notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <Loader2 className="w-8 h-8 text-black animate-spin" />
                                        <span className="text-xs font-bold text-black/60 uppercase">Memeriksa notifikasi...</span>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                                        <div className="w-16 h-16 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mb-2">
                                            <Bell className="w-8 h-8 text-black" />
                                        </div>
                                        <p className="text-base font-black text-black uppercase">Belum ada notifikasi</p>
                                        <p className="text-xs font-bold text-black/60 leading-relaxed">
                                            Interaksi pada kenangan Anda akan muncul di sini.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((n) => (
                                            <div key={n.id} className={`p-4 transition-all hover:bg-white relative group border-b-[3px] border-black last:border-b-0 ${!n.isRead ? "bg-[#00FFFF]/20" : ""}`}>
                                                {!n.isRead && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#00FFFF] border-r-[2px] border-black z-20" />
                                                )}

                                                <div className="flex gap-3 relative z-0">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={n.actor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor.id}`}
                                                            className="w-12 h-12 border-[3px] border-black bg-white"
                                                            alt=""
                                                        />
                                                        <div className={`absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center border-[2px] border-black shadow-[2px_2px_0_#000] ${
                                                            n.type === "PREMIUM_ACTIVATED" ? "bg-[#FFD700]" :
                                                            n.type === "REACTION" ? "bg-[#FF00FF]" :
                                                            n.type === "COLLABORATION_INVITE" ? "bg-[#00FFFF]" :
                                                            n.type === "FOLLOW" ? "bg-[#00FF00]" :
                                                            "bg-[#FFFF00]"
                                                        }`}>
                                                            {n.type === "REACTION" ? (
                                                                <Heart className="w-3 h-3 text-white fill-white" />
                                                            ) : n.type === "COLLABORATION_INVITE" ? (
                                                                <Users className="w-3 h-3 text-black" />
                                                            ) : n.type === "FOLLOW" ? (
                                                                <UserPlus className="w-3 h-3 text-black" />
                                                            ) : n.type === "PREMIUM_ACTIVATED" ? (
                                                                <Crown className="w-3 h-3 text-black" />
                                                            ) : (
                                                                <MessageCircle className="w-3 h-3 text-black fill-black" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0 pl-1">
                                                        <p className="text-sm text-black/80 font-medium leading-snug">
                                                            <span className="font-black text-black text-[15px]">{n.actor.name}</span>
                                                            {" "}
                                                            {n.type === "REACTION" ? "menyukai" :
                                                                n.type === "COMMENT" ? "mengomentari" :
                                                                n.type === "REPLY" ? "membalas komentar Anda di" :
                                                                n.type === "FOLLOW" ? "mulai mengikuti Anda" :
                                                                n.type === "PREMIUM_ACTIVATED" ? "" :
                                                                "mengundang Anda berkolaborasi di"}
                                                            {n.type !== "FOLLOW" && n.type !== "PREMIUM_ACTIVATED" && (
                                                                <>
                                                                    {" "}
                                                                    <span className="font-black text-[#FF00FF]">
                                                                        &quot;{n.memory?.title || "sebuah kenangan"}&quot;
                                                                    </span>
                                                                </>
                                                            )}
                                                            {n.type === "PREMIUM_ACTIVATED" && (
                                                                <span className="font-black text-[#b8860b]">Premium kamu sudah aktif! 🎉 Klaim hadiah eksklusifmu sekarang.</span>
                                                            )}
                                                        </p>
                                                        <p className="text-[11px] font-black text-black/50 mt-1.5 uppercase">
                                                            {timeAgo(n.createdAt)}
                                                        </p>

                                                        {/* Actions */}
                                                        {n.type === "COLLABORATION_INVITE" && n.memoryId && (
                                                            <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    disabled={respondingId === n.id}
                                                                    onClick={(e) => handleCollaborationRespond(e, n.id, n.memoryId!, "ACCEPTED")}
                                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black bg-[#00FF00] border-[2px] border-black text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all disabled:opacity-50 uppercase"
                                                                >
                                                                    {respondingId === n.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                                    Terima
                                                                </button>
                                                                <button
                                                                    disabled={respondingId === n.id}
                                                                    onClick={(e) => handleCollaborationRespond(e, n.id, n.memoryId!, "DECLINED")}
                                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black bg-white border-[2px] border-black text-black shadow-[2px_2px_0_#000] hover:bg-[#FF00FF] hover:text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all disabled:opacity-50 uppercase"
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                    Tolak
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Premium claim action */}
                                                        {n.type === "PREMIUM_ACTIVATED" && (
                                                            <div className="mt-3" onClick={e => e.stopPropagation()}>
                                                                <Link
                                                                    href="/premium/payment"
                                                                    onClick={() => {
                                                                        if (!n.isRead) markAsRead(n.id)
                                                                        setIsOpen(false)
                                                                    }}
                                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black bg-[#FFD700] border-[2px] border-black text-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all uppercase"
                                                                >
                                                                    <Crown className="w-3 h-3" />
                                                                    Klaim Hadiah
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Delete */}
                                                    {n.type !== "COLLABORATION_INVITE" && n.type !== "PREMIUM_ACTIVATED" && (
                                                        <button
                                                            onClick={(e) => deleteNotification(e, n.id)}
                                                            className="shrink-0 self-center p-2 border-[2px] border-transparent hover:border-black bg-white hover:bg-[#FF00FF] text-black hover:text-white hover:shadow-[2px_2px_0_#000] transition-all opacity-0 group-hover:opacity-100 relative z-30"
                                                            title="Delete"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Link Wrapper */}
                                                {n.type !== "COLLABORATION_INVITE" && n.type !== "PREMIUM_ACTIVATED" && (
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <ConfirmDialog {...confirmProps} />
        </>
    )
}
