"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Instagram, Facebook, Settings, Loader2, Check, AlertCircle,
    Camera, User, FileText, Share2, ArrowLeft, Mail
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

// ─── TikTok SVG icon (not in lucide) ─────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.61a8.18 8.18 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01Z" />
        </svg>
    )
}

// ─── Social platform config ───────────────────────────────────────────────────
const SOCIALS = [
    {
        key: "instagram" as const,
        label: "Instagram",
        placeholder: "https://instagram.com/username",
        icon: Instagram,
        color: "from-pink-500 to-rose-500",
        border: "border-pink-500/30",
        bg: "bg-pink-500/10",
        text: "text-pink-400",
        ring: "focus:ring-pink-500/30",
    },
    {
        key: "tiktok" as const,
        label: "TikTok",
        placeholder: "https://tiktok.com/@username",
        icon: TikTokIcon,
        color: "from-neutral-100 to-neutral-300",
        border: "border-neutral-500/30",
        bg: "bg-neutral-500/10",
        text: "text-neutral-300",
        ring: "focus:ring-neutral-500/30",
    },
    {
        key: "facebook" as const,
        label: "Facebook",
        placeholder: "https://facebook.com/username",
        icon: Facebook,
        color: "from-blue-500 to-indigo-500",
        border: "border-blue-500/30",
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        ring: "focus:ring-blue-500/30",
    },
] as const

type SocialKey = "instagram" | "tiktok" | "facebook"

// ─── Predefined avatars ───────────────────────────────────────────────────────
const PREDEFINED_AVATARS = [
    // 4 Laki-laki (Gaya Abstrak Karakter - mirip "Beam")
    "https://api.dicebear.com/7.x/notionists/svg?seed=Stefan&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Buster&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Jack&backgroundColor=b6e3f4",
    
    // 4 Perempuan (Gaya Abstrak Karakter - mirip "Beam")
    "https://api.dicebear.com/7.x/notionists/svg?seed=Julia&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Mimi&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Bella&backgroundColor=c0aede",
];

// ─── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "social", label: "Social Links", icon: Share2 },
] as const

type TabId = typeof TABS[number]["id"]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const avatarInputRef = useRef<HTMLInputElement>(null)

    const [tab, setTab] = useState<TabId>("profile")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    // Profile fields
    const [name, setName] = useState("")
    const [bio, setBio] = useState("")
    const [image, setImage] = useState("")
    const [previewImage, setPreviewImage] = useState("")

    // Social fields
    const [socials, setSocials] = useState<Record<SocialKey, string>>({
        instagram: "",
        tiktok: "",
        facebook: "",
    })

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login")
    }, [status, router])

    // Load current data
    useEffect(() => {
        if (!session?.user?.id) return
        fetch(`/api/users/${session.user.id}`)
            .then(r => r.json())
            .then(data => {
                setName(data.name || "")
                setBio(data.bio || "")
                setImage(data.image || "")
                setPreviewImage(data.image || "")
                setSocials({
                    instagram: data.instagram || "",
                    tiktok: data.tiktok || "",
                    facebook: data.facebook || "",
                })
                setLoading(false)
            })
    }, [session?.user?.id])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingPhoto(true)
        try {
            const form = new FormData()
            form.append("file", file)
            form.append("isPublic", "true")
            const res = await fetch("/api/upload", { method: "POST", body: form })
            if (!res.ok) throw new Error()
            const { url } = await res.json()
            setImage(url)
            setPreviewImage(url)
            toast.success("Photo updated!")
        } catch {
            toast.error("Failed to upload photo")
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Name cannot be empty")
        setSaving(true)
        try {
            const res = await fetch(`/api/users/${session?.user?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, bio, image, ...socials }),
            })
            if (!res.ok) throw new Error()
            await update({ name, image })
            toast.success("Settings saved!")
        } catch {
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    if (loading || status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            </div>
        )
    }

    const avatarSrc = previewImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.id}`

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
            {/* Back */}
            <Link
                href={`/profile/${session?.user?.id}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors group mb-8"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Profile
            </Link>

            {/* Page header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold font-[Outfit] text-white">Settings</h1>
                    <p className="text-sm text-neutral-500">Manage your profile and social links</p>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-8 p-1 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id
                                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                                : "text-neutral-500 hover:text-neutral-300"
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Profile Tab ───────────────────────────── */}
            {tab === "profile" && (
                <motion.div
                    key="profile-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Avatar */}
                    <div
                        className="relative rounded-2xl border border-white/[0.06] p-6 space-y-6"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                        <div>
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">Profile Photo</p>
                            <div className="flex items-center gap-5">
                                <div className="relative group shrink-0">
                                    <img
                                        src={avatarSrc}
                                        alt="Avatar"
                                        className="w-20 h-20 rounded-full border-2 border-neutral-700 object-cover bg-neutral-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        {uploadingPhoto
                                            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            : <Camera className="w-5 h-5 text-white" />
                                        }
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        {uploadingPhoto ? "Uploading..." : "Upload photo"}
                                    </button>
                                    <p className="text-xs text-neutral-600 mt-1">JPG, PNG, GIF up to 5MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Predefined Avatars */}
                        <div className="pt-5 border-t border-white/[0.06]">
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Or Choose an Avatar</p>
                            <div className="flex flex-wrap gap-2.5">
                                {PREDEFINED_AVATARS.map((url, idx) => {
                                    const isSelected = previewImage === url;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setImage(url);
                                                setPreviewImage(url);
                                            }}
                                            className="relative rounded-full overflow-hidden w-12 h-12 border transition-all hover:scale-110 active:scale-95 bg-neutral-800 shrink-0"
                                            style={{
                                                borderColor: isSelected ? "rgba(99,102,241,1)" : "rgba(255,255,255,0.08)",
                                                boxShadow: isSelected ? "0 0 0 3px rgba(99,102,241,0.2)" : "none",
                                            }}
                                            title={`Avatar ${idx + 1}`}
                                        >
                                            <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-neutral-600 mt-2">Pilih ikon karakter secara instan tanpa perlu unggah foto.</p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="rounded-2xl border border-white/[0.06] p-6 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Basic Info</p>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={session?.user?.email || ""}
                                readOnly
                                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none text-sm transition-all"
                            />
                            <p className="text-[10px] text-neutral-600 mt-1">Alamat email yang terdaftar (tidak dapat diubah).</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your display name"
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-sm transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Tell the world about yourself..."
                                rows={3}
                                maxLength={200}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 text-sm transition-all resize-none"
                            />
                            <p className="text-xs text-neutral-700 mt-1 text-right">{bio.length}/200</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Social Links Tab ──────────────────────── */}
            {tab === "social" && (
                <motion.div
                    key="social-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/[0.06] p-6 space-y-5"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Share2 className="w-4 h-4 text-neutral-500" />
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Social Media Links</p>
                    </div>
                    <p className="text-sm text-neutral-600">Links you add here will be displayed publicly on your profile.</p>

                    {SOCIALS.map(s => (
                        <div key={s.key}>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.bg} border ${s.border}`}>
                                    <s.icon className={`w-4 h-4 ${s.text}`} />
                                </div>
                                {s.label}
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={socials[s.key]}
                                    onChange={e => setSocials(prev => ({ ...prev, [s.key]: e.target.value }))}
                                    placeholder={s.placeholder}
                                    className={`w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 ${s.ring} focus:border-transparent text-sm transition-all`}
                                />
                                {socials[s.key] && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-start gap-2 pt-2 text-xs text-neutral-600 border-t border-white/[0.04]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Paste the full URL including https://</span>
                    </div>
                </motion.div>
            )}

            {/* Save button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || uploadingPhoto}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-all hover:brightness-110 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                    {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        : <><Check className="w-4 h-4" /> Save Changes</>
                    }
                </button>
            </div>
        </div>
    )
}
