import React from "react"
import { BadgeCheck, Calendar, Instagram, Facebook, UserCheck, UserPlus, Package, Settings, Pencil, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { getFrameClass, getDecorationClass } from "./ProfileUtils"
import { getBadgeConfig } from "./BadgeConfigs"
import { formatDate } from "@/lib/utils"
import { PremiumCrown } from "@/components/ui/PremiumCrown"

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.61a8.18 8.18 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01Z" />
        </svg>
    )
}

interface ProfileHeaderProps {
    user: any
    isOwner: boolean
    isAdmin: boolean
    onEdit: () => void
    onFollow: () => void
    onShowPhoto: () => void
    countMemories: number
    countFollowers: number
    countFollowing: number
    onShowFollowers?: () => void
    onShowFollowing?: () => void
}

export function ProfileHeader({ 
    user, isOwner, isAdmin, onEdit, onFollow, onShowPhoto,
    countMemories, countFollowers, countFollowing, onShowFollowers, onShowFollowing
}: ProfileHeaderProps) {
    const avatarSrc = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
    const joinDate = formatDate(user.createdAt)
    const hasSocials = user.instagram || user.tiktok || user.facebook

    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end justify-between -mt-[48px] sm:-mt-[56px] px-6 lg:px-10 pb-8 relative z-10 w-full">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-6 w-full md:w-auto">
                {/* Avatar + Premium Crown — Frame decoration PRESERVED */}
                <div className="relative group shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={onShowPhoto}>
                    {/* Premium Crown on top of avatar */}
                    {user.isPremium && <PremiumCrown size={44} />}
                    {/* Frame glow */}
                    {(() => {
                        const glowCls = user.equippedFrame && getFrameClass(user.equippedFrame.name) ? `${getFrameClass(user.equippedFrame.name)}-glow` : "animate-pulse"
                        return (
                            <div
                                className={`absolute -inset-2 rounded-full ${glowCls}`}
                                style={{
                                    background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))",
                                    filter: "blur(10px)",
                                }}
                            />
                        )
                    })()}
                    {/* Frame border — thicker + hard shadow for Mahkota */}
                    {(() => {
                        const isMahkota = user.equippedFrame?.name?.toLowerCase().includes("mahkota")
                        const frameCls = user.equippedFrame ? getFrameClass(user.equippedFrame.name) : ""
                        return (
                            <div
                                className={`absolute -inset-1 rounded-full ${isMahkota ? 'p-[3px]' : 'p-[2px]'} ${frameCls}`}
                                style={{
                                    background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
                                }}
                            >
                                <div className="w-full h-full rounded-full" style={{ background: "rgba(10,10,16,1)" }} />
                            </div>
                        )
                    })()}
                    <img src={avatarSrc} alt={user.name} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover z-10" style={{ border: "3px solid rgba(10,10,16,1)" }} />
                </div>

                {/* Name & Bio */}
                <div className="text-center md:text-left md:pb-2 max-w-sm">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-0.5 flex-wrap justify-center md:justify-start">
                        <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
                            {/* Name decoration — PRESERVED */}
                            <h1
                                className={`text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight ${user.equippedDecoration ? getDecorationClass(user.equippedDecoration.name) : ""}`}
                                style={user.equippedDecoration ? (() => { try { return JSON.parse(user.equippedDecoration.value) } catch { return {} } })() : {}}
                            >
                                {user.username || user.name}
                            </h1>
                            {user.isVerified && <BadgeCheck className="w-[18px] h-[18px] text-white shrink-0 relative -top-1 fill-[#0095F6]" />}
                        </div>
                        {isAdmin && (
                            <span className="md:hidden inline-block px-3 py-0.5 text-[10px] font-black tracking-widest uppercase bg-[#00FFFF] border-[2px] border-black text-black shadow-[2px_2px_0_#000]">Admin</span>
                        )}
                    </div>
                    {user.username && <h2 className="text-base sm:text-lg font-bold text-neutral-200 mb-1">{user.name}</h2>}
                    {/* Streak badge relocated below name as achievement subtitle */}
                    {user.pinnedBadge !== null && user.pinnedBadge !== undefined && (() => {
                        const bConfig = getBadgeConfig(user.pinnedBadge)
                        const IconInfo = bConfig.icon
                        return (
                            <div className="flex items-center gap-1.5 mb-1 justify-center md:justify-start">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: bConfig.bgProfile, border: bConfig.borderProfile, color: bConfig.textColor }}>
                                    <IconInfo className={`w-3 h-3 ${bConfig.iconClassProfile}`} />
                                    <span>{bConfig.name}</span>
                                </div>
                            </div>
                        )
                    })()}
                    <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-medium">
                        {user.bio || <span className="italic text-neutral-600">Penjelajah ini belum menulis bio.</span>}
                    </p>
                </div>
            </div>

            {/* Actions & Info Bar */}
            <div className="flex flex-col items-center md:items-end gap-5 w-full md:w-auto">
                {/* Stats Bar */}
                <div className="flex items-stretch gap-0 overflow-hidden w-[280px] sm:w-[320px] md:w-[360px] max-w-full mb-1 bg-white border-[3px] border-black shadow-[4px_4px_0_#000]">
                    {[
                        { label: "Kenangan", value: countMemories, icon: MapPin, bg: "#00FFFF" },
                        { label: "Pengikut", value: countFollowers, icon: Users, bg: "#FF00FF", onClick: isOwner ? onShowFollowers : undefined },
                        { label: "Mengikuti", value: countFollowing, icon: UserCheck, bg: "#FFFF00", onClick: isOwner ? onShowFollowing : undefined },
                    ].map(({ label, value, icon: Icon, bg, onClick }, i, arr) => (
                        <div 
                            key={label} 
                            onClick={onClick} 
                            className={`flex-1 flex flex-col items-center justify-center py-3 relative ${onClick ? 'cursor-pointer hover:brightness-95 transition-all' : ''}`}
                            style={{ background: bg }}
                        >
                            {i < arr.length - 1 && <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-black" />}
                            <span className="text-xl sm:text-2xl font-black text-black mb-0.5">{value}</span>
                            <div className="flex items-center gap-1">
                                <Icon className="w-2.5 h-2.5 text-black" />
                                <span className="text-[9px] font-black tracking-widest uppercase text-black">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto justify-center md:justify-end">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-neutral-500">
                        <div className="flex items-center gap-1.5" title="Tanggal Bergabung">
                            <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                            <span className="font-bold">{joinDate}</span>
                        </div>
                        {hasSocials && (
                            <>
                                <span className="w-1.5 h-1.5 bg-neutral-700" />
                                <div className="flex items-center gap-2">
                                    {user.instagram && (
                                        <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center transition-all bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none">
                                            <Instagram className="w-4 h-4 text-black" />
                                        </a>
                                    )}
                                    {user.tiktok && (
                                        <a href={user.tiktok} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center transition-all bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none">
                                            <TikTokIcon className="w-4 h-4 text-black" />
                                        </a>
                                    )}
                                    {user.facebook && (
                                        <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center transition-all bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none">
                                            <Facebook className="w-4 h-4 text-black" />
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {isOwner ? (
                        <div className="flex items-center gap-2">
                            <Link href="/inventory" className="flex items-center justify-center w-10 h-10 bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                                <Package className="w-4 h-4 text-black" />
                            </Link>
                            <Link href="/settings" className="flex items-center justify-center w-10 h-10 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                                <Settings className="w-4 h-4 text-black" />
                            </Link>
                            <div className="relative">
                                <button onClick={onEdit} className="flex items-center gap-1.5 px-5 h-10 bg-[#FFFF00] border-[3px] border-black text-black text-xs font-black uppercase shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit Profil</span>
                                </button>
                                {!user.username && (
                                    <div className="absolute -top-9 -right-2 animate-bounce flex flex-col items-center">
                                        <span className="bg-[#FF0000] text-white text-[10px] font-black px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">Atur username!</span>
                                        <div className="w-0 h-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-[#FF0000]"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button onClick={onFollow} className={`flex items-center gap-1.5 px-6 h-10 border-[3px] border-black text-xs font-black uppercase shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all ${user.isFollowing ? 'bg-white text-black' : 'bg-[#FF00FF] text-white'}`}>
                            {user.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            <span>{user.isFollowing ? "Mengikuti" : "Ikuti"}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
