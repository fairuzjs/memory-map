"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    Instagram, Facebook, Settings, Loader2, Check, AlertCircle,
    Camera, User, FileText, Share2, ArrowLeft, Mail, AtSign, Link as LinkIcon,
    Sparkles, Shield, Globe, ExternalLink, ShieldCheck, ShieldAlert, Timer, KeyRound, RefreshCw, X
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/cropImage"

// ─── TikTok SVG icon ──────────────────────────────────────────────────────────
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
        gradient: "from-pink-500 via-rose-500 to-orange-400",
        border: "border-pink-500/20",
        bg: "bg-pink-500/10",
        text: "text-pink-400",
        ring: "focus:ring-pink-500/20 focus:border-pink-500/30",
        glow: "shadow-pink-500/10",
    },
    {
        key: "tiktok" as const,
        label: "TikTok",
        placeholder: "https://tiktok.com/@username",
        icon: TikTokIcon,
        gradient: "from-neutral-100 to-slate-300",
        border: "border-neutral-500/20",
        bg: "bg-neutral-500/10",
        text: "text-neutral-300",
        ring: "focus:ring-neutral-500/20 focus:border-neutral-500/30",
        glow: "shadow-neutral-500/10",
    },
    {
        key: "facebook" as const,
        label: "Facebook",
        placeholder: "https://facebook.com/username",
        icon: Facebook,
        gradient: "from-blue-500 to-indigo-500",
        border: "border-blue-500/20",
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        ring: "focus:ring-blue-500/20 focus:border-blue-500/30",
        glow: "shadow-blue-500/10",
    },
] as const

type SocialKey = "instagram" | "tiktok" | "facebook"

// ─── Predefined avatars ───────────────────────────────────────────────────────
const PREDEFINED_AVATARS = [
    "https://api.dicebear.com/7.x/notionists/svg?seed=Stefan&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Buster&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Jack&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Julia&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Mimi&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Bella&backgroundColor=c0aede",
]

// ─── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
    { id: "profile", label: "Profil", icon: User, desc: "Foto & info dasar" },
    { id: "social", label: "Sosial", icon: Globe, desc: "Link media sosial" },
    { id: "security", label: "Keamanan", icon: Shield, desc: "Email & verifikasi" },
] as const

type TabId = typeof TABS[number]["id"]

// ─── Reusable Field Wrapper ───────────────────────────────────────────────────
function FieldGroup({ label, icon: Icon, hint, children }: {
    label: string
    icon?: any
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
                {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
                {label}
            </label>
            {children}
            {hint && <p className="text-[11px] text-neutral-600 leading-relaxed">{hint}</p>}
        </div>
    )
}

const inputClass = "w-full bg-[#0d0d18] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/40 text-sm transition-all"

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const avatarInputRef = useRef<HTMLInputElement>(null)

    const [tab, setTab] = useState<TabId>(() => {
        // Will be corrected by useEffect after mount (searchParams not reliable in useState init)
        return "profile"
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    // Sync tab from URL query param on mount
    useEffect(() => {
        const paramTab = searchParams.get("tab")
        const validTabs = TABS.map(t => t.id)
        if (paramTab && validTabs.includes(paramTab as TabId)) {
            setTab(paramTab as TabId)
        }
    }, [searchParams])

    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [usernameError, setUsernameError] = useState("")
    const [bio, setBio] = useState("")
    const [image, setImage] = useState("")
    const [previewImage, setPreviewImage] = useState("")
    const [isVerified, setIsVerified] = useState(false)
    const [isEmailVerified, setIsEmailVerified] = useState(false)
    const [userEmail, setUserEmail] = useState("")

    // ── Email Verification Modal State ────────────────────────
    const [showVerifyModal, setShowVerifyModal] = useState(false)
    const [verifyStep, setVerifyStep] = useState<1 | 2>(1)
    const [targetEmail, setTargetEmail] = useState("")
    const [targetEmailError, setTargetEmailError] = useState("")
    const [otp, setOtp] = useState(["" ,"", "", "", "", ""])
    const [sendingOtp, setSendingOtp] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isCropping, setIsCropping] = useState(false)
    const [cropImageUrl, setCropImageUrl] = useState("")

    const [socials, setSocials] = useState<Record<SocialKey, string>>({
        instagram: "", tiktok: "", facebook: "",
    })

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login")
    }, [status, router])

    useEffect(() => {
        if (!session?.user?.id) return
        fetch(`/api/users/${session.user.id}`)
            .then(r => r.json())
            .then(data => {
                setName(data.name || "")
                setUsername(data.username || "")
                setBio(data.bio || "")
                setImage(data.image || "")
                setPreviewImage(data.image || "")
                setIsVerified(data.isVerified ?? false)
                setIsEmailVerified(data.isEmailVerified ?? false)
                setUserEmail(data.email || session?.user?.email || "")
                setSocials({
                    instagram: data.instagram || "",
                    tiktok: data.tiktok || "",
                    facebook: data.facebook || "",
                })
                setLoading(false)
            })
    }, [session?.user?.id])

    // ── OTP Cooldown timer ───────────────────────────────────
    const startCooldown = (seconds = 60) => {
        setCooldown(seconds)
        if (cooldownRef.current) clearInterval(cooldownRef.current)
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current!)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    // ── Send OTP handler ─────────────────────────────────────
    const handleSendOtp = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!targetEmail.trim() || !emailRegex.test(targetEmail.trim())) {
            setTargetEmailError("Masukkan alamat email yang valid")
            return
        }
        setTargetEmailError("")
        setSendingOtp(true)
        try {
            const res = await fetch("/api/auth/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: targetEmail.trim() }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (res.status === 429) {
                    startCooldown(data.cooldown)
                    toast.error(data.error)
                } else {
                    toast.error(data.error || "Gagal mengirim kode")
                }
                return
            }
            toast.success("Kode OTP berhasil dikirim ke email Anda!")
            startCooldown(60)
            setVerifyStep(2)
            setOtp(["", "", "", "", "", ""])
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
        } catch {
            toast.error("Gagal mengirim kode. Coba lagi.")
        } finally {
            setSendingOtp(false)
        }
    }

    // ── Verify OTP handler ───────────────────────────────────
    const handleVerifyOtp = async () => {
        const code = otp.join("")
        if (code.length < 6) {
            toast.error("Masukkan 6 digit kode verifikasi")
            return
        }
        setVerifyingOtp(true)
        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: targetEmail.trim(), code }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Kode salah atau sudah kadaluwarsa")
                return
            }
            setIsEmailVerified(true)
            setUserEmail(targetEmail.trim())
            setShowVerifyModal(false)
            setVerifyStep(1)
            setOtp(["", "", "", "", "", ""])
            if (cooldownRef.current) clearInterval(cooldownRef.current)
            setCooldown(0)
            
            // Sync status to session
            await update({ isEmailVerified: true })
            
            toast.success("🎉 Email berhasil diverifikasi!")
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.")
        } finally {
            setVerifyingOtp(false)
        }
    }

    // ── OTP input per-box handler ────────────────────────────
    const handleOtpInput = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1)
        const newOtp = [...otp]
        newOtp[index] = digit
        setOtp(newOtp)
        if (digit && index < 5) {
            otpInputRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        if (pasted.length === 6) {
            setOtp(pasted.split(""))
            otpInputRefs.current[5]?.focus()
        }
    }

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setCropImageUrl(url)
        setIsCropping(true)
        if (avatarInputRef.current) avatarInputRef.current.value = ""
    }

    const saveCrop = async () => {
        setUploadingPhoto(true)
        setIsCropping(false)
        try {
            const file = await getCroppedImg(cropImageUrl, croppedAreaPixels, rotation)
            if (!file) throw new Error("Gagal crop")
            const form = new FormData()
            form.append("file", file)
            form.append("isPublic", "true")
            const res = await fetch("/api/upload", { method: "POST", body: form })
            if (!res.ok) throw new Error()
            const { url } = await res.json()
            setImage(url)
            setPreviewImage(url)
            toast.success("Foto disesuaikan dan diunggah!")
        } catch {
            toast.error("Gagal mengupload foto")
        } finally {
            setUploadingPhoto(false)
        }
    }

    const validateUsername = (val: string) => {
        if (val === "") { setUsernameError(""); return }
        if (!/^[a-z0-9_.]{3,30}$/.test(val.toLowerCase())) {
            setUsernameError("Hanya huruf kecil, angka, underscore, dan titik (3-30 karakter)")
        } else {
            setUsernameError("")
        }
    }

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Nama tidak boleh kosong")
        if (usernameError) return toast.error("Perbaiki username terlebih dahulu")
        setSaving(true)
        try {
            const res = await fetch(`/api/users/${session?.user?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, bio, image, ...socials, username: username || null }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed")
            }
            await update({ name, image })
            toast.success("Pengaturan berhasil disimpan!")
        } catch (e: any) {
            toast.error(e.message || "Gagal menyimpan pengaturan")
        } finally {
            setSaving(false)
        }
    }

    if (loading || status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                        <div className="relative w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                    </div>
                    <p className="text-sm text-neutral-500">Memuat pengaturan...</p>
                </div>
            </div>
        )
    }

    const avatarSrc = previewImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.id}`

    return (
        <div className="min-h-screen w-full font-[Outfit]" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* ─────────────── CROP MODAL ─────────────── */}
            <AnimatePresence>
                {isCropping && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        style={{ background: "rgba(4,4,12,0.90)", backdropFilter: "blur(12px)" }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg shadow-2xl overflow-hidden"
                            style={{
                                background: "rgba(12,12,22,0.95)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "1.5rem",
                            }}
                        >
                            {/* Modal header */}
                            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                                        <Camera className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Sesuaikan Foto</h2>
                                        <p className="text-xs text-neutral-500">Geser dan zoom untuk mendapatkan hasil terbaik</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="relative w-full h-64 rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.6)" }}>
                                    <Cropper
                                        image={cropImageUrl}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={1}
                                        cropShape="round"
                                        onCropChange={setCrop}
                                        onCropComplete={(_: any, croppedPixels: any) => setCroppedAreaPixels(croppedPixels)}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Zoom</label>
                                            <span className="text-xs text-indigo-400 font-mono">{zoom.toFixed(1)}×</span>
                                        </div>
                                        <input
                                            type="range" min={1} max={3} step={0.1} value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                                            style={{ background: `linear-gradient(to right, #6366f1 ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Rotasi</label>
                                            <span className="text-xs text-indigo-400 font-mono">{rotation}°</span>
                                        </div>
                                        <input
                                            type="range" min={0} max={360} step={1} value={rotation}
                                            onChange={(e) => setRotation(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                                            style={{ background: `linear-gradient(to right, #6366f1 ${(rotation / 360) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => setIsCropping(false)}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-neutral-400 transition-all"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={saveCrop}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
                                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                    >
                                        <Check className="w-4 h-4" /> Simpan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ───────── IMMERSIVE HEADER ───────── */}
            <div className="relative overflow-hidden">
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
                    {/* Back link */}
                    <Link
                        href={`/profile/${session?.user?.id}`}
                        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors group mb-8"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Kembali ke Profil
                    </Link>

                    {/* Page header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* Icon badge */}
                            <div
                                className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                    boxShadow: "0 0 30px rgba(99,102,241,0.1)",
                                }}
                            >
                                <Settings className="w-6 h-6 text-indigo-400" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#0a0a10] animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Pengaturan Akun</h1>
                                <p className="text-sm text-neutral-500 mt-0.5">Kelola profil dan tautan media sosialmu</p>
                            </div>
                        </div>

                        {/* Avatar preview pill */}
                        <div
                            className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl shrink-0"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <img src={avatarSrc} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                            <div>
                                <p className="text-sm font-semibold text-white leading-none">{name || "Nama Belum Diisi"}</p>
                                <p className="text-[11px] text-neutral-500 mt-0.5">{username ? `@${username}` : session?.user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ───────── CONTENT ───────── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">

                {/* Tab bar */}
                <div
                    className="flex gap-1 mb-8 p-1 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className="relative flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium transition-all"
                        >
                            {tab === t.id && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
                                        border: "1px solid rgba(99,102,241,0.2)",
                                    }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <t.icon className={`relative w-4 h-4 transition-colors ${tab === t.id ? "text-indigo-400" : "text-neutral-600"}`} />
                            <span className={`relative transition-colors ${tab === t.id ? "text-indigo-300" : "text-neutral-500 hover:text-neutral-400"}`}>
                                {t.label}
                            </span>
                            <span className={`relative text-[10px] hidden sm:block transition-colors ${tab === t.id ? "text-indigo-500" : "text-neutral-700"}`}>
                                · {t.desc}
                            </span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── Profile Tab ─────────────────────────── */}
                    {tab === "profile" && (
                        <motion.div
                            key="profile-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-5"
                        >
                            {/* Avatar Card */}
                            <div
                                className="rounded-3xl overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                {/* Card header */}
                                <div className="px-6 pt-5 pb-4 flex items-center gap-2 border-b border-white/[0.04]">
                                    <Camera className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Foto Profil</span>
                                </div>

                                <div className="p-6">
                                    {/* Current avatar + upload */}
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="relative group shrink-0">
                                            <div
                                                className="absolute -inset-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity blur-sm"
                                                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                            />
                                            <div className="relative w-20 h-20 rounded-full overflow-hidden" style={{ border: "2px solid rgba(10,10,16,1)" }}>
                                                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                                                {uploadingPhoto && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingPhoto}
                                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                                            >
                                                <Camera className="w-5 h-5 text-white" />
                                            </button>
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingPhoto}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-400 transition-all hover:text-indigo-300 hover:bg-indigo-500/10 active:scale-95"
                                                style={{ border: "1px solid rgba(99,102,241,0.2)" }}
                                            >
                                                <Camera className="w-3.5 h-3.5" />
                                                {uploadingPhoto ? "Mengunggah..." : "Unggah Foto Baru"}
                                            </button>
                                            <p className="text-xs text-neutral-600 mt-2">JPG, PNG, GIF · Maks. 5MB · Otomatis dipotong menjadi lingkaran</p>
                                        </div>
                                    </div>

                                    {/* Predefined Avatars */}
                                    <div className="pt-5 border-t border-white/[0.05]">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Avatar Instan</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {PREDEFINED_AVATARS.map((url, idx) => {
                                                const isSelected = previewImage === url
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => { setImage(url); setPreviewImage(url) }}
                                                        className="relative rounded-full overflow-hidden w-12 h-12 transition-all hover:scale-110 active:scale-95 shrink-0"
                                                        style={{
                                                            border: isSelected ? "2px solid #6366f1" : "2px solid rgba(255,255,255,0.08)",
                                                            boxShadow: isSelected ? "0 0 0 3px rgba(99,102,241,0.25), 0 0 15px rgba(99,102,241,0.2)" : "none",
                                                        }}
                                                        title={`Avatar ${idx + 1}`}
                                                    >
                                                        <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                                                        {isSelected && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/30">
                                                                <Check className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <p className="text-[11px] text-neutral-700 mt-3">Pilih ikon karakter secara instan tanpa perlu mengunggah foto.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Info Card */}
                            <div
                                className="rounded-3xl overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <div className="px-6 pt-5 pb-4 flex items-center gap-2 border-b border-white/[0.04]">
                                    <User className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Informasi Dasar</span>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Email (read-only) */}
                                    <FieldGroup label="Email" icon={Mail} hint="Untuk mengganti atau memverifikasi email, buka tab Keamanan.">
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={userEmail}
                                                readOnly
                                                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed focus:outline-none text-sm pr-28"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {isEmailVerified
                                                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full"><ShieldCheck className="w-3 h-3" />Terverifikasi</span>
                                                    : <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full"><ShieldAlert className="w-3 h-3" />Belum Diverifikasi</span>
                                                }
                                            </div>
                                        </div>
                                    </FieldGroup>

                                    {/* Name */}
                                    <FieldGroup label="Nama Tampilan">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Nama kamu"
                                            className={inputClass}
                                        />
                                    </FieldGroup>

                                    {/* Username */}
                                    <FieldGroup
                                        label="Username"
                                        icon={AtSign}
                                        hint="Hanya huruf kecil, angka, underscore, dan titik. 3–30 karakter. Digunakan sebagai URL profil pendek."
                                    >
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 text-sm select-none font-mono">@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => {
                                                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")
                                                    setUsername(v)
                                                    validateUsername(v)
                                                }}
                                                placeholder="namauser"
                                                maxLength={30}
                                                className={`${inputClass} pl-9 font-mono ${usernameError ? "border-red-500/30 focus:ring-red-500/20 focus:border-red-500/30" : ""}`}
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {usernameError && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                    className="text-xs text-red-400 flex items-center gap-1.5"
                                                >
                                                    <AlertCircle className="w-3 h-3 shrink-0" /> {usernameError}
                                                </motion.p>
                                            )}
                                            {username && !usernameError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                                                    style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                    <span className="text-xs text-indigo-300 font-mono">
                                                        {typeof window !== "undefined" ? window.location.origin : "https://memorymap.app"}/u/<strong>{username}</strong>
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </FieldGroup>

                                    {/* Bio */}
                                    <FieldGroup label="Bio" icon={FileText}>
                                        <div className="relative">
                                            <textarea
                                                value={bio}
                                                onChange={e => setBio(e.target.value)}
                                                placeholder="Ceritakan sedikit tentang dirimu..."
                                                rows={3}
                                                maxLength={200}
                                                className={`${inputClass} resize-none`}
                                            />
                                            <span
                                                className="absolute bottom-3 right-3 text-[11px] font-mono"
                                                style={{ color: bio.length > 180 ? "#f87171" : bio.length > 150 ? "#fb923c" : "rgba(255,255,255,0.2)" }}
                                            >
                                                {bio.length}/200
                                            </span>
                                        </div>
                                    </FieldGroup>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Social Tab ───────────────────────────── */}
                    {tab === "social" && (
                        <motion.div
                            key="social-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                        >
                            <div
                                className="rounded-3xl overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                {/* Card header */}
                                <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Share2 className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Media Sosial</span>
                                    </div>
                                    <p className="text-sm text-neutral-500">Links yang kamu tambahkan akan ditampilkan secara publik di profilmu.</p>
                                </div>

                                <div className="p-6 space-y-5">
                                    {SOCIALS.map(s => (
                                        <div
                                            key={s.key}
                                            className="rounded-2xl p-4 transition-all"
                                            style={{
                                                background: socials[s.key] ? "rgba(255,255,255,0.03)" : "transparent",
                                                border: socials[s.key] ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
                                            }}
                                        >
                                            {/* Platform Label */}
                                            <label className="flex items-center gap-3 mb-3 cursor-default">
                                                <div
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}
                                                    style={{ border: `1px solid ${s.border.replace("border-", "").replace("/20", "")}` }}
                                                >
                                                    <s.icon className={`w-4 h-4 ${s.text}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-300">{s.label}</p>
                                                    <p className="text-[11px] text-neutral-600">{s.placeholder}</p>
                                                </div>
                                                {socials[s.key] && (
                                                    <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-[10px] font-bold text-emerald-400">Terhubung</span>
                                                    </div>
                                                )}
                                            </label>

                                            {/* Input */}
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    value={socials[s.key]}
                                                    onChange={e => setSocials(prev => ({ ...prev, [s.key]: e.target.value }))}
                                                    placeholder={s.placeholder}
                                                    className={`${inputClass} ${s.ring} ${socials[s.key] ? 'pr-28' : ''}`}
                                                />
                                                {socials[s.key] && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                        <button
                                                            onClick={() => {
                                                                const url = socials[s.key]
                                                                if (!url.startsWith("http")) return toast.error("Link harus diawali https://")
                                                                const w = 500, h = 700
                                                                const left = (window.screen.width / 2) - (w / 2)
                                                                const top = (window.screen.height / 2) - (h / 2)
                                                                window.open(url, "VerifyLink", `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no`)
                                                            }}
                                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/25 transition-all active:scale-95"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            Cek URL
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs text-neutral-600"
                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                                    >
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-700" />
                                        <span>Tempel URL lengkap termasuk <code className="text-neutral-500 font-mono">https://</code> untuk setiap link yang ingin kamu tambahkan.</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Security Tab ─────────────────────────── */}
                    {tab === "security" && (
                        <motion.div
                            key="security-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-5"
                        >
                            {/* Email Verification Card */}
                            <div
                                className="rounded-3xl overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <div className="px-6 pt-5 pb-4 flex items-center gap-2 border-b border-white/[0.04]">
                                    <KeyRound className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Verifikasi Email</span>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Status banner */}
                                    <div
                                        className="flex items-center gap-4 p-4 rounded-2xl"
                                        style={{
                                            background: isEmailVerified ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
                                            border: isEmailVerified ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(245,158,11,0.2)"
                                        }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: isEmailVerified ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}
                                        >
                                            {isEmailVerified
                                                ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                : <ShieldAlert className="w-5 h-5 text-amber-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold" style={{ color: isEmailVerified ? "#34d399" : "#fbbf24" }}>
                                                {isEmailVerified ? "Email Sudah Terverifikasi" : "Email Belum Diverifikasi"}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-0.5 truncate">{userEmail}</p>
                                        </div>
                                        {isEmailVerified && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-[11px] font-bold text-emerald-400">Aktif</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {!isEmailVerified && (
                                        <div
                                            className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs text-neutral-500"
                                            style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}
                                        >
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                                            <span>Akun dengan email tidak terverifikasi <strong className="text-neutral-400">tidak dapat membuat memory atau berkomentar</strong>. Verifikasi email kamu sekarang untuk mengakses seluruh fitur.</span>
                                        </div>
                                    )}

                                    {/* Action button */}
                                    <button
                                        id="btn-open-verify-modal"
                                        onClick={() => {
                                            setTargetEmail(userEmail)
                                            setVerifyStep(1)
                                            setOtp(["", "", "", "", "", ""])
                                            setCooldown(0)
                                            setShowVerifyModal(true)
                                        }}
                                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-lg"
                                        style={{
                                            background: isEmailVerified
                                                ? "linear-gradient(135deg, rgba(16,185,129,0.8), rgba(5,150,105,0.8))"
                                                : "linear-gradient(135deg, #f59e0b, #d97706)",
                                            boxShadow: isEmailVerified ? "0 10px 25px -10px rgba(16,185,129,0.3)" : "0 10px 25px -10px rgba(245,158,11,0.4)"
                                        }}
                                    >
                                        {isEmailVerified
                                            ? <><RefreshCw className="w-4 h-4" /> Ganti Email</>  
                                            : <><ShieldCheck className="w-4 h-4" /> Verifikasi Sekarang</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Save Button ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                    <p className="text-sm text-neutral-500 hidden sm:block">Perubahan disimpan ke akun dan akan langsung terlihat di profil.</p>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploadingPhoto}
                        className="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:brightness-110 active:scale-95 shrink-0 shadow-lg shadow-indigo-900/20"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    >
                        {saving
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            : <>Simpan Perubahan</>
                        }
                    </button>
                 </motion.div>
            </div>

            {/* ─────────────── VERIFICATION MODAL ─────────────── */}
            <AnimatePresence>
                {showVerifyModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                        style={{ background: "rgba(4,4,12,0.92)", backdropFilter: "blur(16px)" }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowVerifyModal(false) }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
                            transition={{ type: "spring", bounce: 0.22, duration: 0.38 }}
                            className="w-full max-w-md shadow-2xl overflow-hidden"
                            style={{ background: "rgba(10,10,20,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.75rem" }}
                        >
                            {/* Modal Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                                        <KeyRound className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white">Verifikasi Email</h2>
                                        <p className="text-xs text-neutral-500">Langkah {verifyStep} dari 2</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowVerifyModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Step indicators */}
                            <div className="px-6 pt-5 flex items-center gap-2">
                                {[1, 2].map(s => (
                                    <div key={s} className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all"
                                            style={{
                                                background: verifyStep >= s ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)",
                                                color: verifyStep >= s ? "#fff" : "#525252",
                                                border: verifyStep >= s ? "none" : "1px solid rgba(255,255,255,0.08)"
                                            }}
                                        >{s}</div>
                                        {s < 2 && <div className="w-8 h-px" style={{ background: verifyStep > 1 ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.06)" }} />}
                                    </div>
                                ))}
                                <span className="ml-2 text-xs text-neutral-600">
                                    {verifyStep === 1 ? "Masukkan Email" : "Masukkan Kode OTP"}
                                </span>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* ── STEP 1: Email input ── */}
                                {verifyStep === 1 && (
                                    <>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Masukkan alamat email aktif yang ingin kamu verifikasi. Kode OTP 6 digit akan dikirimkan ke email tersebut.
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Alamat Email
                                            </label>
                                            <input
                                                id="input-verify-email"
                                                type="email"
                                                value={targetEmail}
                                                onChange={e => { setTargetEmail(e.target.value); setTargetEmailError("") }}
                                                onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                                                placeholder="email@contoh.com"
                                                className={`${inputClass} ${targetEmailError ? "border-red-500/30 focus:ring-red-500/20" : ""}`}
                                            />
                                            {targetEmailError && (
                                                <p className="text-xs text-red-400 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3 h-3 shrink-0" />{targetEmailError}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            id="btn-send-otp"
                                            onClick={handleSendOtp}
                                            disabled={sendingOtp || cooldown > 0}
                                            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                        >
                                            {sendingOtp
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                                                : cooldown > 0
                                                    ? <><Timer className="w-4 h-4" /> Tunggu {cooldown}s</>
                                                    : <><Mail className="w-4 h-4" /> Kirim Kode OTP</>
                                            }
                                        </button>
                                    </>
                                )}

                                {/* ── STEP 2: OTP input ── */}
                                {verifyStep === 2 && (
                                    <>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Kode OTP telah dikirim ke <strong className="text-indigo-300">{targetEmail}</strong>. Periksa inbox dan masukkan 6 digit kode di bawah.
                                        </p>

                                        {/* OTP boxes */}
                                        <div className="flex items-center justify-center gap-2.5" onPaste={handleOtpPaste}>
                                            {otp.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    id={`otp-input-${i}`}
                                                    ref={el => { otpInputRefs.current[i] = el }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={e => handleOtpInput(i, e.target.value)}
                                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                                    className="w-11 h-14 text-center text-xl font-black text-white rounded-xl transition-all focus:outline-none"
                                                    style={{
                                                        background: digit ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                                                        border: digit ? "2px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                                                        boxShadow: digit ? "0 0 12px rgba(99,102,241,0.2)" : "none"
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Resend + back */}
                                        <div className="flex items-center justify-between text-xs">
                                            <button
                                                onClick={() => setVerifyStep(1)}
                                                className="text-neutral-500 hover:text-neutral-300 transition-colors"
                                            >
                                                ← Ganti email
                                            </button>
                                            <button
                                                id="btn-resend-otp"
                                                onClick={handleSendOtp}
                                                disabled={cooldown > 0 || sendingOtp}
                                                className="flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-40"
                                                style={{ color: cooldown > 0 ? "#525252" : "#818cf8" }}
                                            >
                                                {cooldown > 0
                                                    ? <><Timer className="w-3.5 h-3.5" /> Kirim ulang ({cooldown}s)</>
                                                    : <><RefreshCw className="w-3.5 h-3.5" /> Kirim ulang kode</>
                                                }
                                            </button>
                                        </div>

                                        <button
                                            id="btn-verify-otp"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyingOtp || otp.join("").length < 6}
                                            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                        >
                                            {verifyingOtp
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</>
                                                : <><ShieldCheck className="w-4 h-4" /> Verifikasi Email</>
                                            }
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
