import React from "react"
import { BadgeCheck, Calendar, Instagram, Facebook, UserCheck, UserPlus, Package, Settings, Pencil, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { getFrameClass, getDecorationClass } from "./ProfileUtils"
import { getBadgeConfig } from "./BadgeConfigs"

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
    const joinDate = new Date(user.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    const hasSocials = user.instagram || user.tiktok || user.facebook

    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end justify-between -mt-[48px] sm:-mt-[56px] px-6 lg:px-10 pb-8 relative z-10 w-full">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-6 w-full md:w-auto">
                {/* Avatar */}
                <div className="relative group shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95" onClick={onShowPhoto}>
                    <div className={`absolute -inset-2 rounded-full ${user.equippedFrame && getFrameClass(user.equippedFrame.name) ? `${getFrameClass(user.equippedFrame.name)}-glow` : 'animate-pulse'}`} style={{ background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))", filter: "blur(10px)" }} />
                    <div className={`absolute -inset-1 rounded-full p-[2px] ${user.equippedFrame ? getFrameClass(user.equippedFrame.name) : ''}`} style={{ background: user.equippedFrame ? user.equippedFrame.value : "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
                        <div className="w-full h-full rounded-full" style={{ background: "rgba(10,10,16,1)" }} />
                    </div>
                    <img src={avatarSrc} alt={user.name} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover z-10" style={{ border: "3px solid rgba(10,10,16,1)" }} />
                </div>

                {/* Name & Bio */}
                <div className="text-center md:text-left md:pb-2 max-w-sm">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-0.5 flex-wrap justify-center md:justify-start">
                        <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
                            <h1
                                className={`text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight ${user.equippedDecoration ? getDecorationClass(user.equippedDecoration.name) : ""}`}
                                style={user.equippedDecoration ? (() => { try { return JSON.parse(user.equippedDecoration.value) } catch { return {} } })() : {}}
                            >
                                {user.username || user.name}
                            </h1>
                            {user.isVerified && <BadgeCheck className="w-[18px] h-[18px] text-white shrink-0 relative -top-1 fill-[#0095F6]" />}
                        </div>
                        {user.pinnedBadge !== null && user.pinnedBadge !== undefined && (() => {
                            const bConfig = getBadgeConfig(user.pinnedBadge)
                            const IconInfo = bConfig.icon
                            return (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0" style={{ background: bConfig.bgProfile, border: bConfig.borderProfile, color: bConfig.textColor }}>
                                    <IconInfo className={`w-3.5 h-3.5 ${bConfig.iconClassProfile}`} />
                                    <span>{bConfig.name}</span>
                                </div>
                            )
                        })()}
                        {isAdmin && (
                            <span className="md:hidden inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}>Admin</span>
                        )}
                    </div>
                    {user.username && <h2 className="text-base sm:text-lg font-medium text-neutral-200 mb-1">{user.name}</h2>}
                    <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-light">
                        {user.bio || <span className="italic text-neutral-600">Penjelajah ini belum menulis bio.</span>}
                    </p>
                </div>
            </div>

            {/* Actions & Info Bar */}
            <div className="flex flex-col items-center md:items-end gap-5 w-full md:w-auto">
                {/* Stats Bar Integrated */}
                <div className="flex items-stretch gap-0 rounded-2xl overflow-hidden w-[280px] sm:w-[320px] md:w-[360px] max-w-full mb-1 bg-white/[0.03] border border-white/[0.06] backdrop-blur-md transition-all hover:bg-white/[0.05]">
                    {[
                        { label: "Kenangan", value: countMemories, icon: MapPin, color: "#818cf8" },
                        { label: "Pengikut", value: countFollowers, icon: Users, color: "#f472b6", onClick: isOwner ? onShowFollowers : undefined },
                        { label: "Mengikuti", value: countFollowing, icon: UserCheck, color: "#34d399", onClick: isOwner ? onShowFollowing : undefined },
                    ].map(({ label, value, icon: Icon, color, onClick }, i, arr) => (
                        <div 
                            key={label} 
                            onClick={onClick} 
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 relative ${onClick ? 'cursor-pointer hover:bg-white/5 transition-all' : ''}`}
                        >
                            {i < arr.length - 1 && <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-white/10" />}
                            <span className="text-xl sm:text-2xl font-black mb-0.5" style={{ color, textShadow: `0 0 10px ${color}40` }}>{value}</span>
                            <div className="flex items-center gap-1 opacity-60">
                                <Icon className="w-2.5 h-2.5" style={{ color }} />
                                <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-300">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto justify-center md:justify-end">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-neutral-500">
                        <div className="flex items-center gap-1.5" title="Tanggal Bergabung">
                            <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                            <span>{joinDate}</span>
                        </div>
                        {hasSocials && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                                <div className="flex items-center gap-2">
                                    {user.instagram && (
                                        <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 bg-white/5 border border-white/10 hover:border-pink-500/50">
                                            <Instagram className="w-3.5 h-3.5 text-neutral-400 hover:text-pink-400" />
                                        </a>
                                    )}
                                    {user.tiktok && (
                                        <a href={user.tiktok} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 bg-white/5 border border-white/10">
                                            <TikTokIcon className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                                        </a>
                                    )}
                                    {user.facebook && (
                                        <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 bg-white/5 border border-white/10 hover:border-blue-500/50">
                                            <Facebook className="w-3.5 h-3.5 text-neutral-400 hover:text-blue-400" />
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {isOwner ? (
                        <div className="flex items-center gap-2">
                            <Link href="/inventory" className="flex items-center justify-center w-9 h-9 rounded-lg transition-all bg-indigo-500/10 border border-indigo-500/20 group">
                                <Package className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                            </Link>
                            <Link href="/settings" className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-white transition-all bg-white/5 border border-white/10">
                                <Settings className="w-4 h-4" />
                            </Link>
                            <div className="relative">
                                <button onClick={onEdit} className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold text-white transition-all bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-105">
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit Profil</span>
                                </button>
                                {!user.username && (
                                    <div className="absolute -top-9 -right-2 animate-bounce flex flex-col items-center">
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg">Atur username!</span>
                                        <div className="w-0 h-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-red-500"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button onClick={onFollow} className={`flex items-center gap-1.5 px-6 h-9 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 ${user.isFollowing ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-tr from-indigo-600 to-purple-600'}`}>
                            {user.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            <span>{user.isFollowing ? "Mengikuti" : "Ikuti"}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
