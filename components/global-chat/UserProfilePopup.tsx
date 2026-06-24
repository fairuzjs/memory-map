"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, UserPlus, UserCheck, ExternalLink,
    Loader2, Instagram, Facebook, ShieldAlert, BadgeCheck
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { PremiumCrown } from "@/components/ui/PremiumCrown"

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.61a8.18 8.18 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01Z" />
        </svg>
    )
}

interface UserProfilePopupProps {
    userId: string
    isGuest?: boolean
    guestName?: string
    anchorRef: React.RefObject<HTMLElement | null>
    onClose: () => void
}

interface PopupUser {
    id: string
    name: string
    username: string | null
    image: string | null
    bio: string | null
    role: "USER" | "ADMIN"
    isVerified: boolean
    isPremium: boolean
    isFollowing: boolean
    createdAt: string
    instagram: string | null
    tiktok: string | null
    facebook: string | null
    _count: {
        memories: number
        followers: number
        following: number
    }
}

export function UserProfilePopup({ userId, isGuest, guestName, anchorRef, onClose }: UserProfilePopupProps) {
    const { data: session } = useSession()
    const currentUserId = session?.user?.id
    const isOwnProfile = currentUserId === userId

    const popupRef = useRef<HTMLDivElement>(null)
    const [user, setUser] = useState<PopupUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

    // Fetch user data
    useEffect(() => {
        if (isGuest) {
            setUser({
                id: userId,
                name: guestName || "Tamu",
                username: "guest",
                image: null,
                bio: "Pengunjung tanpa akun",
                role: "USER",
                isVerified: false,
                isPremium: false,
                isFollowing: false,
                createdAt: new Date().toISOString(),
                instagram: null,
                tiktok: null,
                facebook: null,
                _count: {
                    memories: 0,
                    followers: 0,
                    following: 0,
                }
            })
            setLoading(false)
            return
        }

        setLoading(true)
        fetch(`/api/users/${userId}`)
            .then(r => r.json())
            .then(data => {
                setUser(data)
                setIsFollowing(data.isFollowing ?? false)
                setLoading(false)
            })
            .catch(() => {
                toast.error("Gagal memuat profil")
                onClose()
            })
    }, [userId, isGuest, guestName, onClose])

    // Smart positioning relative to anchor
    useEffect(() => {
        if (!anchorRef.current) return
        const rect = anchorRef.current.getBoundingClientRect()
        const POPUP_WIDTH = 300
        const POPUP_HEIGHT = 380

        let left = rect.right + 12
        let top = rect.top

        // Adjust if overflows viewport right
        if (left + POPUP_WIDTH > window.innerWidth - 16) {
            left = rect.left - POPUP_WIDTH - 12
        }
        // Adjust if overflows viewport bottom
        if (top + POPUP_HEIGHT > window.innerHeight - 16) {
            top = window.innerHeight - POPUP_HEIGHT - 16
        }
        // Never go above viewport
        if (top < 16) top = 16

        setPosition({ top, left })
    }, [anchorRef])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(e.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target as Node)
            ) {
                onClose()
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [onClose, anchorRef])

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [onClose])

    const handleFollow = useCallback(async () => {
        if (!currentUserId) {
            toast.error("Login terlebih dahulu")
            return
        }
        const prev = isFollowing
        setIsFollowing(!prev)
        if (user) {
            setUser(u => u ? ({
                ...u,
                _count: {
                    ...u._count,
                    followers: u._count.followers + (!prev ? 1 : -1)
                }
            }) : u)
        }
        setFollowLoading(true)
        try {
            const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" })
            if (!res.ok) throw new Error()
            const data = await res.json()
            setIsFollowing(data.followed)
            toast.success(data.followed ? `Mulai mengikuti ${user?.name}` : `Berhenti mengikuti ${user?.name}`)
        } catch {
            setIsFollowing(prev)
            if (user) {
                setUser(u => u ? ({
                    ...u,
                    _count: {
                        ...u._count,
                        followers: u._count.followers + (prev ? 1 : -1)
                    }
                }) : u)
            }
            toast.error("Gagal melakukan aksi")
        } finally {
            setFollowLoading(false)
        }
    }, [currentUserId, isFollowing, user, userId])

    const avatarSrc = user?.image || (user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : "")
    const hasSocials = user?.instagram || user?.tiktok || user?.facebook

    return (
        <AnimatePresence>
            {position && (
                <motion.div
                    ref={popupRef}
                    initial={{ opacity: 0, scale: 0.88, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.88, y: -8 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="fixed z-[200] w-[300px] rounded-2xl border-[3px] border-black bg-white shadow-[6px_6px_0_#000] overflow-hidden"
                    style={{ top: position.top, left: position.left }}
                >
                    {/* ── Close button ── */}
                    <button
                        onClick={onClose}
                        className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-xl border-[2px] border-black bg-white shadow-[2px_2px_0_#000] hover:bg-red-500 hover:text-white transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    {loading ? (
                        /* ── Skeleton ── */
                        <div className="p-5 flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-neutral-200 animate-pulse border-[3px] border-black" />
                            <div className="w-32 h-4 rounded bg-neutral-200 animate-pulse" />
                            <div className="w-24 h-3 rounded bg-neutral-100 animate-pulse" />
                            <div className="w-full h-10 rounded-xl bg-neutral-100 animate-pulse" />
                            <div className="w-full h-10 rounded-xl bg-neutral-100 animate-pulse" />
                        </div>
                    ) : user ? (
                        <>
                            {/* ── Header Gradient Banner ── */}
                            <div
                                className="h-[72px] w-full relative"
                                style={{
                                    background: user.isPremium
                                        ? "linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)"
                                        : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%)"
                                }}
                            >
                                {/* Decorative dots */}
                                <div className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                                        backgroundSize: "16px 16px"
                                    }}
                                />
                                {user.role === "ADMIN" && (
                                    <span className="absolute top-2 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border-[2px] border-black bg-red-500 text-white text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_#000]">
                                        <ShieldAlert className="w-3 h-3" /> ADMIN
                                    </span>
                                )}
                            </div>

                            {/* ── Avatar overlapping banner ── */}
                            <div className="flex flex-col items-center -mt-10 px-4 pb-4">
                                {/* Crown sits above the avatar, centered — rendered BEFORE avatar div so z-index stacks correctly */}
                                {user.isPremium && (
                                    <div className="relative z-20 flex justify-center mb-[-8px]">
                                        <PremiumCrown size={30} />
                                    </div>
                                )}
                                <div className="relative mb-2">
                                    <div className="relative w-20 h-20 rounded-full border-[3px] border-black shadow-[3px_3px_0_#000] bg-neutral-200 overflow-hidden">
                                        <img
                                            src={avatarSrc}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Online indicator — decorative */}
                                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-[2px] border-black" />
                                </div>

                                {/* ── Name + badges ── */}
                                <div className="text-center mb-0.5">
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                        <span className="text-[15px] font-black text-black leading-tight">
                                            {user.name}
                                        </span>
                                        {user.isVerified && (
                                            <BadgeCheck className="w-4 h-4 text-black shrink-0 fill-[#0095F6]" />
                                        )}
                                    </div>
                                    {user.username && (
                                        <p className="text-[12px] font-bold text-neutral-500 mt-0.5">
                                            @{user.username}
                                        </p>
                                    )}
                                </div>

                                {/* ── Stats Bar ── */}
                                {!isGuest && (
                                    <div className="w-full flex items-stretch gap-0 overflow-hidden border-[2.5px] border-black shadow-[3px_3px_0_#000] rounded-xl mt-3 mb-3">
                                        {[
                                            { label: "Kenangan", value: user._count?.memories ?? 0, bg: "var(--mm-secondary)" },
                                            { label: "Pengikut",  value: user._count?.followers ?? 0, bg: "var(--mm-accent)" },
                                            { label: "Mengikuti", value: user._count?.following ?? 0, bg: "var(--mm-primary)" },
                                        ].map(({ label, value, bg }, i, arr) => (
                                            <div
                                                key={label}
                                                className="flex-1 flex flex-col items-center justify-center py-2.5 relative"
                                                style={{ background: bg }}
                                            >
                                                {i < arr.length - 1 && (
                                                    <div className="absolute right-0 top-0 bottom-0 w-[2.5px] bg-black" />
                                                )}
                                                <span className="text-[15px] font-black text-black">{value}</span>
                                                <span className="text-[8px] font-black tracking-widest uppercase text-black/70">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Social Links ── */}
                                {hasSocials && (
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        {user.instagram && (
                                            <a
                                                href={user.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 flex items-center justify-center rounded-xl border-[2px] border-black bg-white shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                            >
                                                <Instagram className="w-4 h-4 text-black" />
                                            </a>
                                        )}
                                        {user.tiktok && (
                                            <a
                                                href={user.tiktok}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 flex items-center justify-center rounded-xl border-[2px] border-black bg-white shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                            >
                                                <TikTokIcon className="w-4 h-4 text-black" />
                                            </a>
                                        )}
                                        {user.facebook && (
                                            <a
                                                href={user.facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 flex items-center justify-center rounded-xl border-[2px] border-black bg-white shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all"
                                            >
                                                <Facebook className="w-4 h-4 text-black" />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* ── Action Buttons ── */}
                                {!isGuest && (
                                    <div className="w-full flex gap-2 mt-2">
                                        {!isOwnProfile && currentUserId && (
                                            <button
                                                onClick={handleFollow}
                                                disabled={followLoading}
                                                className={`
                                                    flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl
                                                    border-[2.5px] border-black text-[12px] font-black uppercase
                                                    shadow-[3px_3px_0_#000] transition-all
                                                    hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000]
                                                    active:translate-y-px active:shadow-none
                                                    disabled:opacity-60 disabled:pointer-events-none
                                                    ${isFollowing
                                                        ? "bg-white text-black"
                                                        : "bg-[var(--mm-accent)] text-white"
                                                    }
                                                `}
                                            >
                                                {followLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : isFollowing ? (
                                                    <><UserCheck className="w-4 h-4" /> Mengikuti</>
                                                ) : (
                                                    <><UserPlus className="w-4 h-4" /> Ikuti</>
                                                )}
                                            </button>
                                        )}

                                        <Link
                                            href={`/profile/${user.id}`}
                                            onClick={onClose}
                                            className={`
                                                flex items-center justify-center gap-1.5 h-10 rounded-xl px-3
                                                border-[2.5px] border-black text-[12px] font-black uppercase text-black
                                                bg-[var(--mm-warning)] shadow-[3px_3px_0_#000] transition-all
                                                hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000]
                                                active:translate-y-px active:shadow-none
                                                ${!isOwnProfile && currentUserId ? "" : "flex-1"}
                                            `}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            {(!isOwnProfile && currentUserId) ? "" : "Lihat Profil"}
                                            {(!isOwnProfile && currentUserId) && <span className="hidden sm:inline">Profil</span>}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
