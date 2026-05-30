"use client"

import { Trash2, ShieldCheck, ShieldAlert } from "lucide-react"
import Image from "next/image"
import { PremiumCrown } from "@/components/ui/PremiumCrown"
import { PremiumBadge } from "@/components/ui/PremiumBadge"

export interface ChatUser {
    id: string
    name: string
    username: string | null
    image: string | null
    role: "USER" | "ADMIN"
    isVerified: boolean
    isPremium: boolean
}

export interface ChatMessage {
    id: string
    content: string
    createdAt: string
    userId: string
    user: ChatUser
}

interface Props {
    message: ChatMessage
    currentUserId?: string
    currentUserRole?: "USER" | "ADMIN"
    onDelete?: (messageId: string) => void
}

function getRelativeTime(dateString: string) {
    const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
    const daysDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const hoursDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60))
    const minutesDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60))
    
    if (Math.abs(minutesDifference) < 60) {
        return Math.abs(minutesDifference) < 1 ? 'Baru saja' : rtf.format(minutesDifference, 'minute')
    } else if (Math.abs(hoursDifference) < 24) {
        return rtf.format(hoursDifference, 'hour')
    } else {
        return rtf.format(daysDifference, 'day')
    }
}

export function GlobalChatMessageItem({ message, currentUserId, currentUserRole, onDelete }: Props) {
    const isMe = currentUserId === message.userId
    const canDelete = isMe || currentUserRole === "ADMIN"

    return (
        <div className={`flex gap-3 w-full group ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
            {/* Avatar */}
            <div className="relative shrink-0 w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-neutral-200">
                {message.user.isPremium && (
                    <div className="absolute -top-3 -right-2 z-10">
                        <PremiumCrown size={24} />
                    </div>
                )}
                {message.user.image ? (
                    <Image src={message.user.image} alt={message.user.name} fill className="object-cover" sizes="40px" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black bg-yellow-300">
                        {message.user.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Bubble Container */}
            <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* User Info */}
                <div className={`flex items-center gap-1 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs font-bold text-black">{message.user.name}</span>
                    {message.user.role === "ADMIN" && (
                        <span title="Admin">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                        </span>
                    )}
                    {message.user.isVerified && (
                        <span title="Verified">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                        </span>
                    )}
                    {message.user.isPremium && (
                        <PremiumBadge size="sm" />
                    )}
                    <span className="text-[10px] font-bold text-neutral-500 ml-1">
                        {getRelativeTime(message.createdAt)}
                    </span>
                </div>

                {/* Chat Bubble (Neubrutalism) */}
                <div className="relative group/bubble">
                    <div 
                        className={`
                            p-3 text-sm font-bold border-[3px] border-black shadow-[3px_3px_0_#000]
                            ${isMe ? 'bg-[#E5E5E5] text-black rounded-l-xl rounded-br-xl' : 'bg-white text-black rounded-r-xl rounded-bl-xl'}
                        `}
                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                    >
                        {message.content}
                    </div>

                    {/* Delete Action */}
                    {canDelete && (
                        <button
                            onClick={() => onDelete?.(message.id)}
                            className={`
                                absolute top-1/2 -translate-y-1/2 p-2 bg-white border-2 border-black 
                                hover:bg-red-500 hover:text-white transition-colors shadow-[2px_2px_0_#000] rounded-full
                                opacity-0 group-hover/bubble:opacity-100 z-10
                                ${isMe ? '-left-12' : '-right-12'}
                            `}
                            title="Hapus pesan"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
