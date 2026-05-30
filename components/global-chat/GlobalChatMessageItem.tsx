"use client"

import { memo, useRef, useState, useCallback } from "react"
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion"
import { Trash2, BadgeCheck, ShieldAlert, CornerUpLeft } from "lucide-react"
import { PremiumCrown } from "@/components/ui/PremiumCrown"
import { UserProfilePopup } from "./UserProfilePopup"

export interface ChatUser {
    id: string
    name: string
    username: string | null
    image: string | null
    role: "USER" | "ADMIN"
    isVerified: boolean
    isPremium: boolean
}

export interface ChatReplyPreview {
    id: string
    content: string
    user: {
        id: string
        name: string
    }
}

export interface ChatMessage {
    id: string
    content: string
    createdAt: string
    userId: string
    user: ChatUser
    replyTo?: ChatReplyPreview | null
}

interface Props {
    message: ChatMessage
    currentUserId?: string
    currentUserRole?: "USER" | "ADMIN"
    onDelete?: (messageId: string) => void
    onReply?: (message: ChatMessage) => void
}

function getRelativeTime(dateString: string) {
    const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
    const minutesDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60))
    const hoursDifference   = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60))
    const daysDifference    = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (Math.abs(minutesDifference) < 1)  return 'Baru saja'
    if (Math.abs(minutesDifference) < 60) return rtf.format(minutesDifference, 'minute')
    if (Math.abs(hoursDifference)   < 24) return rtf.format(hoursDifference,   'hour')
    return rtf.format(daysDifference, 'day')
}

const REPLY_THRESHOLD = 60  // px — swipe trigger point
const REPLY_ICON_SHOW = 40  // px — icon appears

export const GlobalChatMessageItem = memo(function GlobalChatMessageItem({
    message, currentUserId, currentUserRole, onDelete, onReply
}: Props) {
    const isMe    = currentUserId === message.userId
    const canDelete = isMe || currentUserRole === "ADMIN"

    const avatarRef = useRef<HTMLButtonElement>(null)
    const [showPopup, setShowPopup] = useState(false)
    const [replyTriggered, setReplyTriggered] = useState(false)

    // Framer Motion values for drag
    const x = useMotionValue(0)
    const controls = useAnimation()

    // Icon opacity: show when drag exceeds REPLY_ICON_SHOW
    // For "me" messages, we swipe left (negative x), for others, swipe right (positive x)
    const dragProgress = isMe
        ? useTransform(x, [-REPLY_THRESHOLD, -REPLY_ICON_SHOW, 0], [1, 0.5, 0])
        : useTransform(x, [0, REPLY_ICON_SHOW, REPLY_THRESHOLD], [0, 0.5, 1])

    const iconScale = useTransform(dragProgress, [0, 0.5, 1], [0.5, 0.8, 1])

    const handleAvatarClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setShowPopup(prev => !prev)
    }, [])

    const handleClosePopup = useCallback(() => {
        setShowPopup(false)
    }, [])

    const handleDragEnd = useCallback(() => {
        const currentX = x.get()
        const dragEnough = isMe
            ? currentX <= -REPLY_THRESHOLD
            : currentX >= REPLY_THRESHOLD

        if (dragEnough && !replyTriggered) {
            setReplyTriggered(true)
            onReply?.(message)
            // Bounce back with spring
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } })
            setTimeout(() => setReplyTriggered(false), 500)
        } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 28 } })
        }
    }, [x, isMe, replyTriggered, onReply, message, controls])

    // Reply icon position
    const replyIconLeft  = isMe ? undefined : "-28px"
    const replyIconRight = isMe ? "-28px"   : undefined

    return (
        <div className={`flex gap-3 w-full group ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-3 relative`}>

            {/* ── Reply Icon (behind bubble) ── */}
            <motion.div
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 pointer-events-none z-0"
                style={{ 
                    left: replyIconLeft, 
                    right: replyIconRight,
                    opacity: dragProgress,
                    scale: iconScale
                }}
            >
                <CornerUpLeft className={`w-5 h-5 text-black/50 ${isMe ? 'scale-x-[-1]' : ''}`} />
            </motion.div>

            {/* ── Avatar (clickable) ── */}
            <div className="relative shrink-0 self-end z-10">
                {message.user.isPremium && (
                    <PremiumCrown size={20} />
                )}
                <button
                    ref={avatarRef}
                    onClick={handleAvatarClick}
                    title={`Lihat profil ${message.user.name}`}
                    className="relative w-9 h-9 rounded-full border-[2px] border-black bg-neutral-200 hover:scale-110 hover:shadow-[2px_2px_0_#000] active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
                >
                    <div className="absolute inset-0 rounded-full overflow-hidden bg-neutral-200">
                        <img
                            src={message.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user.id}`}
                            alt={message.user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    const existing = parent.querySelector('.fallback-avatar');
                                    if (!existing) {
                                        const fallback = document.createElement('div');
                                        fallback.className = "fallback-avatar w-full h-full flex items-center justify-center text-xs font-black bg-[var(--mm-warning)] text-black";
                                        fallback.innerText = message.user.name.charAt(0).toUpperCase();
                                        parent.appendChild(fallback);
                                    }
                                }
                            }}
                        />
                    </div>
                </button>
            </div>

            {/* ── Swipeable Bubble Container ── */}
            <motion.div
                className={`flex flex-col max-w-[72%] z-10 ${isMe ? 'items-end' : 'items-start'}`}
                style={{ x }}
                animate={controls}
                drag="x"
                dragConstraints={
                    isMe
                        ? { left: -REPLY_THRESHOLD * 1.2, right: 0 }
                        : { left: 0, right: REPLY_THRESHOLD * 1.2 }
                }
                dragElastic={0.3}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: "grabbing" }}
            >
                {/* User Info row */}
                <div className={`flex items-center gap-1.5 mb-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-[11px] font-black ${isMe ? 'text-[var(--mm-accent)]' : 'text-black'}`}>
                        {message.user.name}
                    </span>
                    {message.user.role === "ADMIN" && (
                        <span title="Admin">
                            <ShieldAlert className="w-3 h-3 text-red-600 shrink-0" />
                        </span>
                    )}
                    {message.user.isVerified && (
                        <span title="Verified">
                            <BadgeCheck className="w-3.5 h-3.5 text-black shrink-0 fill-[#0095F6]" />
                        </span>
                    )}
                    <span className="text-[10px] font-bold text-neutral-400">
                        {getRelativeTime(message.createdAt)}
                    </span>
                </div>

                {/* Chat Bubble */}
                <div className="relative group/bubble">
                    <div
                        className={`
                            relative px-4 py-2.5 text-[13px] font-semibold leading-relaxed
                            border-[2px] border-black
                            ${isMe
                                ? 'bg-[var(--mm-accent)] text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm shadow-[3px_3px_0_rgba(0,0,0,0.8)]'
                                : 'bg-white text-black rounded-r-2xl rounded-tl-2xl rounded-bl-sm shadow-[3px_3px_0_#000]'
                            }
                        `}
                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                    >
                        {/* ── Reply Preview (jika ini adalah balasan) ── */}
                        {message.replyTo && (
                            <div
                                className={`
                                    flex items-start gap-2 mb-2 pb-2
                                    border-b-[1.5px] ${isMe ? 'border-white/30' : 'border-black/15'}
                                `}
                            >
                                {/* Vertical accent bar */}
                                <div className={`w-[3px] self-stretch rounded-full shrink-0 ${isMe ? 'bg-white/60' : 'bg-[var(--mm-accent)]'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-black uppercase tracking-wide mb-0.5 ${isMe ? 'text-white/70' : 'text-[var(--mm-accent)]'}`}>
                                        {message.replyTo.user.name}
                                    </p>
                                    <p className={`text-[11px] font-semibold leading-snug truncate ${isMe ? 'text-white/60' : 'text-black/50'}`}>
                                        {message.replyTo.content.length > 60
                                            ? message.replyTo.content.slice(0, 60) + '…'
                                            : message.replyTo.content
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {message.content}

                        {/* Bubble tail */}
                        <span
                            aria-hidden
                            className="absolute bottom-0 w-2.5 h-2.5 border-black"
                            style={{
                                ...(isMe
                                    ? {
                                        right: -6,
                                        borderBottom: '2px solid black',
                                        borderRight:  '2px solid black',
                                        background: 'var(--mm-accent)',
                                        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
                                    }
                                    : {
                                        left: -6,
                                        borderBottom: '2px solid black',
                                        borderLeft:   '2px solid black',
                                        background: 'white',
                                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                                    }
                                )
                            }}
                        />
                    </div>

                    {/* Delete Action */}
                    {canDelete && (
                        <button
                            onClick={() => onDelete?.(message.id)}
                            className={`
                                absolute top-1/2 -translate-y-1/2 p-1.5 bg-white border-[2px] border-black rounded-full
                                hover:bg-red-500 hover:text-white transition-colors shadow-[2px_2px_0_#000]
                                opacity-0 group-hover/bubble:opacity-100 z-10
                                ${isMe ? '-left-10' : '-right-10'}
                            `}
                            title="Hapus pesan"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Profile Popup — rendered in fixed position */}
            {showPopup && (
                <UserProfilePopup
                    userId={message.userId}
                    anchorRef={avatarRef}
                    onClose={handleClosePopup}
                />
            )}
        </div>
    )
})
