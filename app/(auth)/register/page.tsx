"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import Link from "next/link"
import {
    MapPin, ArrowRight, Eye, EyeOff, Globe, Lock, BookOpen,
    Check, X, ArrowLeft, Mail, Timer, RefreshCw, ShieldCheck, Loader2
} from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    })
}

const perks = [
    {
        icon: Globe,
        title: "Tandai di mana saja di Bumi",
        desc: "Simpan kenangan pada peta dunia interaktif dengan koordinat yang tepat."
    },
    {
        icon: BookOpen,
        title: "Jurnal yang kaya",
        desc: "Lampirkan foto, cerita, dan perasaan di setiap lokasi."
    },
    {
        icon: Lock,
        title: "Privasi secara bawaan",
        desc: "Kenangan Anda dienkripsi dan hanya dapat dilihat oleh Anda."
    },
]

const inputCls = "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.05] transition-all px-4 outline-none"

export default function RegisterPage() {
    const router = useRouter()
    const [showOtpModal, setShowOtpModal] = useState(false)

    // Form state
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // OTP state
    const [submittedEmail, setSubmittedEmail] = useState("")
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [verifying, setVerifying] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [resending, setResending] = useState(false)
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    const {
        register,
        handleSubmit,
        watch,
        getValues,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const passwordValue = watch("password") || ""

    // ── Cooldown timer ────────────────────────────────────────────
    const startCooldown = (seconds = 60) => {
        setCooldown(seconds)
        if (cooldownRef.current) clearInterval(cooldownRef.current)
        cooldownRef.current = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
                return prev - 1
            })
        }, 1000)
    }

    // ── Send OTP (Open Modal) ─────────────────────────────────────
    async function onSubmit(data: RegisterInput) {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/send-register-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            const json = await res.json()
            if (!res.ok) {
                if (res.status === 429) {
                    startCooldown(json.cooldown)
                    toast.error(json.error)
                } else {
                    toast.error(json.error || "Gagal mengirim kode")
                }
                return
            }
            toast.success("Kode OTP dikirim ke email Anda!")
            setSubmittedEmail(data.email.toLowerCase().trim())
            setOtp(["", "", "", "", "", ""])
            startCooldown(60)
            setShowOtpModal(true)
            setTimeout(() => otpRefs.current[0]?.focus(), 500)
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.")
        } finally {
            setIsLoading(false)
        }
    }

    // ── Resend OTP ────────────────────────────────────────────────
    const handleResend = async () => {
        if (cooldown > 0 || resending) return
        setResending(true)
        try {
            const data = getValues()
            const res = await fetch("/api/auth/send-register-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            const json = await res.json()
            if (!res.ok) {
                if (res.status === 429) startCooldown(json.cooldown)
                toast.error(json.error || "Gagal mengirim ulang kode")
                return
            }
            toast.success("Kode OTP baru telah dikirim!")
            startCooldown(60)
            setOtp(["", "", "", "", "", ""])
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch {
            toast.error("Terjadi kesalahan.")
        } finally {
            setResending(false)
        }
    }

    // ── Verify OTP & create account ──────────────────────────────
    const handleVerify = async () => {
        const code = otp.join("")
        if (code.length < 6) { toast.error("Masukkan 6 digit kode verifikasi"); return }
        setVerifying(true)
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: submittedEmail, code }),
            })
            const json = await res.json()
            if (!res.ok) {
                toast.error(json.error || "Kode salah atau sudah kadaluwarsa")
                return
            }
            toast.success("🎉 Akun berhasil dibuat! Silakan masuk.")
            if (cooldownRef.current) clearInterval(cooldownRef.current)
            setShowOtpModal(false)
            router.push("/login")
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.")
        } finally {
            setVerifying(false)
        }
    }

    // ── OTP box handlers ──────────────────────────────────────────
    const handleOtpInput = (i: number, val: string) => {
        const digit = val.replace(/\D/g, "").slice(-1)
        const next = [...otp]; next[i] = digit; setOtp(next)
        if (digit && i < 5) otpRefs.current[i + 1]?.focus()
    }
    const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
        if (e.key === "Enter" && otp.join("").length === 6) handleVerify()
    }
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
        if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus() }
    }

    return (
        <div className="min-h-screen bg-[#080810] flex selection:bg-indigo-500/30 overflow-hidden">

            {/* ── Ambient Background ──────────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px"
                    }}
                />
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/[0.11] rounded-full blur-[160px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/[0.1] rounded-full blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] bg-purple-500/[0.05] rounded-full blur-[100px]" />
            </div>

            {/* ── Left Panel — Branding ───────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-16 border-r border-white/[0.05]">
                <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2/3"
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.3), transparent)" }}
                />
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-12deg] shadow-lg shadow-indigo-500/30" />
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
                        Memory<span className="text-indigo-400">Map</span>
                    </span>
                </motion.div>

                <div className="space-y-8">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-300 border border-indigo-500/20 bg-indigo-500/[0.07] mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Gratis selamanya · Tanpa kartu kredit
                        </div>
                        <h1 className="font-[Outfit] font-extrabold text-white leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)" }}>
                            Mulai<br />
                            <span style={{
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                backgroundImage: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
                                backgroundClip: "text"
                            }}>
                                atlas kenangan Anda.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-neutral-500 text-base leading-relaxed max-w-xs">
                        Bergabunglah dengan ribuan penjelajah yang menggunakan MemoryMap untuk menghidupkan kembali momen paling berharga anda dengan indah.
                    </motion.p>

                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
                        {perks.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.07]"
                                    style={{ background: "rgba(99,102,241,0.1)" }}>
                                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-semibold">{title}</p>
                                    <p className="text-neutral-600 text-xs leading-relaxed mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3 pt-2">
                        <div className="flex -space-x-2">
                            {["alice", "bob", "carol", "dave", "eve"].map(seed => (
                                <img key={seed} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                                    className="w-7 h-7 rounded-full border-2 border-[#080810] bg-neutral-800" alt="" />
                            ))}
                        </div>
                        <p className="text-neutral-600 text-xs">
                            <span className="text-neutral-300 font-semibold">12.000+</span> penjelajah di seluruh dunia
                        </p>
                    </motion.div>
                </div>

                <motion.p custom={5} variants={fadeUp} initial="hidden" animate="show" className="text-neutral-700 text-xs">
                    © {new Date().getFullYear()} MemoryMap Inc.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ──────────────────────────────────── */}
            <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
                <div className="w-full max-w-[420px] py-8 lg:py-0">

                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-white transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Beranda
                        </Link>
                    </motion.div>

                    {/* Mobile logo */}
                    <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="show"
                        className="flex lg:hidden items-center gap-3 mb-10">
                        <div className="relative w-9 h-9">
                            <div className="absolute inset-0 bg-indigo-600 rounded-xl rotate-[-12deg] shadow-lg shadow-indigo-500/30" />
                            <div className="relative w-9 h-9 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <span className="font-extrabold text-xl font-[Outfit] text-white tracking-tight">
                            Memory<span className="text-indigo-400">Map</span>
                        </span>
                    </motion.div>

                    <motion.div
                        key="step-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                            <h2 className="font-[Outfit] font-extrabold text-3xl text-white tracking-tight mb-1.5">
                                Buat akun
                            </h2>
                            <p className="text-neutral-500 text-sm">
                                Gratis selamanya. Tanpa kartu kredit.
                            </p>
                        </motion.div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Name */}
                            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">Nama Lengkap</label>
                                <Input {...register("name")} type="text" placeholder="Nama Anda"
                                    disabled={isLoading} className={inputCls} />
                                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                            </motion.div>

                            {/* Email */}
                            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">Email</label>
                                <Input {...register("email")} type="email" placeholder="you@example.com"
                                    disabled={isLoading} className={inputCls} />
                                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                            </motion.div>

                            {/* Password */}
                            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">Sandi</label>
                                <div className="relative">
                                    <Input {...register("password")} type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 karakter" disabled={isLoading}
                                        className={`${inputCls} pr-11`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-700 hover:text-neutral-300 transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="pt-1 pb-1 space-y-1.5">
                                    {[
                                        { ok: passwordValue.length >= 8, label: "Minimal 8 karakter" },
                                        { ok: /\d/.test(passwordValue), label: "Minimal 1 angka" },
                                    ].map(r => (
                                        <div key={r.label} className="flex items-center gap-2 text-xs">
                                            {r.ok ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-neutral-600" />}
                                            <span className={r.ok ? "text-emerald-400" : "text-neutral-500"}>{r.label}</span>
                                        </div>
                                    ))}
                                </div>
                                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                            </motion.div>

                            {/* Confirm Password */}
                            <motion.div custom={4.5} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">Konfirmasi Sandi</label>
                                <div className="relative">
                                    <Input {...register("confirmPassword")} type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Ulangi sandi Anda" disabled={isLoading}
                                        className={`${inputCls} pr-11`} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-700 hover:text-neutral-300 transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                            </motion.div>

                            {/* Terms */}
                            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
                                <p className="text-xs text-neutral-600 leading-relaxed">
                                    Dengan membuat akun, Anda menyetujui{" "}
                                    <Link href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Syarat Layanan</Link>
                                    {" "}dan{" "}
                                    <Link href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Kebijakan Privasi</Link> kami.
                                </p>
                            </motion.div>

                            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show"
                                className="h-px w-full bg-white/[0.05] my-1" />

                            {/* Submit */}
                            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                                <motion.button
                                    type="submit"
                                    disabled={isLoading || cooldown > 0}
                                    whileHover={{ scale: isLoading ? 1 : 1.015 }}
                                    whileTap={{ scale: isLoading ? 1 : 0.985 }}
                                    className="group relative w-full h-11 rounded-full text-sm font-semibold text-white overflow-hidden shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                                >
                                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }} />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin w-4 h-4" /> Mengirim kode...</>
                                        ) : cooldown > 0 ? (
                                            <><Timer className="w-4 h-4" /> Tunggu {cooldown}s</>
                                        ) : (
                                            <><Mail className="w-4 h-4" /> Kirim Kode Verifikasi<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                                        )}
                                    </span>
                                </motion.button>
                            </motion.div>
                        </form>

                        <motion.p custom={8} variants={fadeUp} initial="hidden" animate="show"
                            className="mt-6 text-center text-sm text-neutral-600">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Masuk →
                            </Link>
                        </motion.p>
                    </motion.div>
                </div>
            </div>

            {/* ── OTP Verification Popup ────────────────────────────── */}
            <AnimatePresence>
                {showOtpModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowOtpModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-[440px] bg-[#0d0d18]/80 border border-white/[0.08] backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            {/* Glowing background accent */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 blur-[80px] pointer-events-none" />

                            {/* Header */}
                            <div className="relative z-10 text-center mb-8">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                                        border: "1px solid rgba(99,102,241,0.3)",
                                        boxShadow: "0 0 30px rgba(99,102,241,0.15)"
                                    }}
                                >
                                    <Mail className="w-7 h-7 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-black text-white font-[Outfit] tracking-tight mb-2">
                                    Verifikasi Email Kamu
                                </h2>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Kami mengirimkan kode 6 digit ke<br />
                                    <strong className="text-indigo-300">{submittedEmail}</strong>
                                </p>
                            </div>

                            {/* OTP Inputs */}
                            <div className="relative z-10 flex items-center justify-center gap-2.5 mb-8" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`reg-otp-${i}`}
                                        ref={el => { otpRefs.current[i] = el }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpInput(i, e.target.value)}
                                        onKeyDown={e => handleOtpKey(i, e)}
                                        className="w-12 h-16 text-center text-2xl font-black text-white rounded-2xl transition-all focus:outline-none"
                                        style={{
                                            background: digit ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                                            border: digit ? "2px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                                            boxShadow: digit ? "0 0 20px rgba(99,102,241,0.2)" : "none"
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Progress dots */}
                            <div className="flex items-center justify-center gap-1.5 mb-8">
                                {otp.map((d, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                                        style={{
                                            background: d ? "#6366f1" : "rgba(255,255,255,0.1)",
                                            transform: d ? "scale(1.2)" : "scale(1)"
                                        }} />
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4 relative z-10">
                                <motion.button
                                    onClick={handleVerify}
                                    disabled={verifying || otp.join("").length < 6}
                                    whileHover={{ scale: verifying ? 1 : 1.01 }}
                                    whileTap={{ scale: verifying ? 1 : 0.98 }}
                                    className="w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                                >
                                    {verifying
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</>
                                        : <><ShieldCheck className="w-4 h-4" /> Konfirmasi & Buat Akun</>
                                    }
                                </motion.button>

                                <div className="text-center">
                                    <button
                                        onClick={handleResend}
                                        disabled={cooldown > 0 || resending}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-40"
                                    >
                                        {resending
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...</>
                                            : cooldown > 0
                                                ? <><Timer className="w-3.5 h-3.5" /> Kirim ulang dalam {cooldown}s</>
                                                : <><RefreshCw className="w-3.5 h-3.5" /> Kirim ulang kode</>
                                        }
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowOtpModal(false)}
                                    className="w-full text-xs text-neutral-600 hover:text-neutral-400 transition-colors pt-2"
                                >
                                    Ganti email pendaftaran
                                </button>
                            </div>

                            {/* Security note */}
                            <div
                                className="mt-6 flex items-start gap-2.5 px-4 py-3 rounded-xl text-[10px] text-neutral-500 leading-relaxed"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-indigo-500/50" />
                                <span>Akun langsung terverifikasi setelah kode valid. Keamanan Anda adalah prioritas kami.</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}