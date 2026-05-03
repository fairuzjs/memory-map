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
import { TermsModal } from "@/components/ui/TermsModal"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, type: "spring" as const, stiffness: 400, damping: 18 }
    })
}

const perks = [
    { icon: Globe, title: "Tandai di mana saja di Bumi", desc: "Simpan kenangan pada peta dunia interaktif dengan koordinat yang tepat.", color: "bg-[#FFFF00]" },
    { icon: BookOpen, title: "Jurnal yang kaya", desc: "Lampirkan foto, cerita, dan perasaan di setiap lokasi.", color: "bg-[#00FFFF]" },
    { icon: Lock, title: "Privasi secara bawaan", desc: "Kenangan Anda dienkripsi dan hanya dapat dilihat oleh Anda.", color: "bg-[#00FF00]" },
]

const inputCls = "h-12 w-full border-[3px] border-black bg-white text-black text-sm placeholder:text-black/30 focus:bg-[#FFFF00]/10 focus:border-black focus:ring-0 transition-all px-4 outline-none font-medium"

export default function RegisterPage() {
    const router = useRouter()
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState("")
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [verifying, setVerifying] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [resending, setResending] = useState(false)
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const passwordValue = watch("password") || ""

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

    async function onSubmit(data: RegisterInput) {
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/send-register-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            const json = await res.json()
            if (!res.ok) {
                if (res.status === 429) { startCooldown(json.cooldown); toast.error(json.error) }
                else toast.error(json.error || "Gagal mengirim kode")
                return
            }
            toast.success("Kode OTP dikirim ke email Anda!")
            setSubmittedEmail(data.email.toLowerCase().trim())
            setOtp(["", "", "", "", "", ""])
            startCooldown(60)
            setShowOtpModal(true)
            setTimeout(() => otpRefs.current[0]?.focus(), 500)
        } catch { toast.error("Terjadi kesalahan. Coba lagi.") }
        finally { setIsLoading(false) }
    }

    const handleResend = async () => {
        if (cooldown > 0 || resending) return
        setResending(true)
        try {
            const data = getValues()
            const res = await fetch("/api/auth/send-register-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            const json = await res.json()
            if (!res.ok) { if (res.status === 429) startCooldown(json.cooldown); toast.error(json.error || "Gagal mengirim ulang kode"); return }
            toast.success("Kode OTP baru telah dikirim!")
            startCooldown(60)
            setOtp(["", "", "", "", "", ""])
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } catch { toast.error("Terjadi kesalahan.") }
        finally { setResending(false) }
    }

    const handleVerify = async () => {
        const code = otp.join("")
        if (code.length < 6) { toast.error("Masukkan 6 digit kode verifikasi"); return }
        setVerifying(true)
        try {
            const res = await fetch("/api/register", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: submittedEmail, code }),
            })
            const json = await res.json()
            if (!res.ok) { toast.error(json.error || "Kode salah atau sudah kadaluwarsa"); return }
            toast.success("🎉 Akun berhasil dibuat! Silakan masuk.")
            if (cooldownRef.current) clearInterval(cooldownRef.current)
            setShowOtpModal(false)
            router.push("/login")
        } catch { toast.error("Terjadi kesalahan. Coba lagi.") }
        finally { setVerifying(false) }
    }

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
        <div className="min-h-screen bg-[#FFFDF0] flex selection:bg-[#FFFF00] selection:text-black overflow-hidden">

            {/* ── Neubrutalism Background ───────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
                    backgroundSize: "80px 80px"
                }} />
                <div className="absolute top-[10%] left-[5%] w-20 h-20 border-[3px] border-black/[0.05] rotate-45" />
                <div className="absolute bottom-[25%] right-[8%] w-14 h-14 rounded-full border-[3px] border-black/[0.04]" />
            </div>

            {/* ── Left Panel — Branding ───────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-16 border-r-[4px] border-black bg-white">
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000]" />
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-black" />
                        </div>
                    </div>
                    <span className="font-black text-[22px] font-[Outfit] text-black tracking-tight">
                        Memory<span className="text-[#FF00FF]">Map</span>
                    </span>
                </motion.div>

                <div className="space-y-8">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] mb-6">
                            <span className="w-2 h-2 bg-black" />
                            Gratis selamanya · Tanpa kartu kredit
                        </div>
                        <h1 className="font-[Outfit] font-black text-black leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)" }}>
                            Bergabung Untuk<br />
                            <span className="inline-block bg-[#FFFF00] px-3 -rotate-1 border-[3px] border-black shadow-[3px_3px_0_#000] mt-2">
                                Menyematkan Kenangan Anda.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-black/50 text-base leading-relaxed max-w-xs font-medium">
                        Bergabunglah dengan ribuan penjelajah yang menggunakan MemoryMap untuk menghidupkan kembali momen paling berharga anda dengan indah.
                    </motion.p>

                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
                        {perks.map(({ icon: Icon, title, desc, color }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className={`w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 border-[3px] border-black ${color} shadow-[2px_2px_0_#000]`}>
                                    <Icon className="w-3.5 h-3.5 text-black" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-black text-sm font-black">{title}</p>
                                    <p className="text-black/40 text-xs leading-relaxed mt-0.5 font-medium">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3 pt-2">
                        <div className="flex -space-x-2">
                            {["alice", "bob", "carol", "dave", "eve"].map(seed => (
                                <img key={seed} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                                    className="w-7 h-7 border-[3px] border-black bg-[#FFFF00]" alt="" />
                            ))}
                        </div>
                        <p className="text-black/40 text-xs font-medium">
                            <span className="text-black font-black">12.000+</span> penjelajah di seluruh dunia
                        </p>
                    </motion.div>
                </div>

                <motion.p custom={5} variants={fadeUp} initial="hidden" animate="show" className="text-black/30 text-xs font-bold">
                    © {new Date().getFullYear()} MemoryMap Inc.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ──────────────────────────────────── */}
            <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
                <div className="w-full max-w-[420px] py-8 lg:py-0">

                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-black transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Beranda
                        </Link>
                    </motion.div>

                    {/* Mobile logo */}
                    <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="show"
                        className="flex lg:hidden items-center gap-3 mb-10">
                        <div className="relative w-9 h-9">
                            <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-black shadow-[2px_2px_0_#000]" />
                            <div className="relative w-9 h-9 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        <span className="font-black text-xl font-[Outfit] text-black tracking-tight">
                            Memory<span className="text-[#FF00FF]">Map</span>
                        </span>
                    </motion.div>

                    <motion.div key="step-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                            <h2 className="font-[Outfit] font-black text-3xl text-black tracking-tight mb-1.5">
                                Buat akun
                            </h2>
                            <p className="text-black/50 text-sm font-medium">
                                Gratis selamanya. Tanpa kartu kredit.
                            </p>
                        </motion.div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">Nama Lengkap</label>
                                <Input {...register("name")} type="text" placeholder="Nama Anda" disabled={isLoading} className={inputCls} />
                                {errors.name && <p className="text-xs text-red-600 font-bold">{errors.name.message}</p>}
                            </motion.div>

                            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">Email</label>
                                <Input {...register("email")} type="email" placeholder="you@example.com" disabled={isLoading} className={inputCls} />
                                {errors.email && <p className="text-xs text-red-600 font-bold">{errors.email.message}</p>}
                            </motion.div>

                            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">Sandi</label>
                                <div className="relative">
                                    <Input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Min. 8 karakter" disabled={isLoading} className={`${inputCls} pr-11`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/30 hover:text-black transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="pt-1 pb-1 space-y-1.5">
                                    {[
                                        { ok: passwordValue.length >= 8, label: "Minimal 8 karakter" },
                                        { ok: /\d/.test(passwordValue), label: "Minimal 1 angka" },
                                    ].map(r => (
                                        <div key={r.label} className="flex items-center gap-2 text-xs">
                                            {r.ok ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <X className="w-3.5 h-3.5 text-black/20" />}
                                            <span className={r.ok ? "text-[#00AA00] font-bold" : "text-black/40 font-medium"}>{r.label}</span>
                                        </div>
                                    ))}
                                </div>
                                {errors.password && <p className="text-xs text-red-600 font-bold">{errors.password.message}</p>}
                            </motion.div>

                            <motion.div custom={4.5} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">Konfirmasi Sandi</label>
                                <div className="relative">
                                    <Input {...register("confirmPassword")} type={showConfirmPassword ? "text" : "password"} placeholder="Ulangi sandi Anda" disabled={isLoading} className={`${inputCls} pr-11`} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/30 hover:text-black transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-600 font-bold">{errors.confirmPassword.message}</p>}
                            </motion.div>

                            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
                                <p className="text-xs text-black/40 leading-relaxed font-medium">
                                    Dengan membuat akun, Anda menyetujui{" "}
                                    <button type="button" onClick={() => setModalType("terms")} className="text-[#FF00FF] hover:text-black transition-colors font-black">Syarat Layanan</button>
                                    {" "}dan{" "}
                                    <button type="button" onClick={() => setModalType("privacy")} className="text-[#FF00FF] hover:text-black transition-colors font-black">Kebijakan Privasi</button> kami.
                                </p>
                            </motion.div>

                            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" className="h-[3px] w-full bg-black/10 my-1" />

                            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
                                <button type="submit" disabled={isLoading || cooldown > 0}
                                    className="group w-full h-12 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide">
                                    <span className="flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <><Loader2 className="animate-spin w-4 h-4" /> Mengirim kode...</>
                                        ) : cooldown > 0 ? (
                                            <><Timer className="w-4 h-4" /> Tunggu {cooldown}s</>
                                        ) : (
                                            <><Mail className="w-4 h-4" /> Kirim Kode Verifikasi<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                                        )}
                                    </span>
                                </button>
                            </motion.div>
                        </form>

                        <motion.p custom={8} variants={fadeUp} initial="hidden" animate="show"
                            className="mt-6 text-center text-sm text-black/40 font-medium">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="text-[#FF00FF] hover:text-black font-black transition-colors">
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowOtpModal(false)} className="absolute inset-0 bg-black/50" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -1 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 400 }}
                            className="relative w-full max-w-[440px] bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-8 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative z-10 text-center mb-8">
                                <div className="w-16 h-16 flex items-center justify-center mb-6 mx-auto bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000]">
                                    <Mail className="w-7 h-7 text-black" />
                                </div>
                                <h2 className="text-2xl font-black text-black font-[Outfit] tracking-tight mb-2">
                                    Verifikasi Email Kamu
                                </h2>
                                <p className="text-black/50 text-sm leading-relaxed font-medium">
                                    Kami mengirimkan kode 6 digit ke<br />
                                    <strong className="text-[#FF00FF] font-black">{submittedEmail}</strong>
                                </p>
                            </div>

                            {/* OTP Inputs */}
                            <div className="relative z-10 flex items-center justify-center gap-2.5 mb-8" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`reg-otp-${i}`}
                                        ref={el => { otpRefs.current[i] = el }}
                                        type="text" inputMode="numeric" maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpInput(i, e.target.value)}
                                        onKeyDown={e => handleOtpKey(i, e)}
                                        className={`w-12 h-16 text-center text-2xl font-black text-black transition-all focus:outline-none border-[3px] border-black ${digit ? "bg-[#FFFF00] shadow-[3px_3px_0_#000]" : "bg-[#FFFDF0]"}`}
                                    />
                                ))}
                            </div>

                            {/* Progress dots */}
                            <div className="flex items-center justify-center gap-1.5 mb-8">
                                {otp.map((d, i) => (
                                    <div key={i} className={`w-2 h-2 border-2 border-black transition-all duration-300 ${d ? "bg-[#00FF00] shadow-[1px_1px_0_#000]" : "bg-white"}`} />
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4 relative z-10">
                                <button onClick={handleVerify} disabled={verifying || otp.join("").length < 6}
                                    className="w-full h-12 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase">
                                    {verifying
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</>
                                        : <><ShieldCheck className="w-4 h-4" /> Konfirmasi & Buat Akun</>
                                    }
                                </button>

                                <div className="text-center">
                                    <button onClick={handleResend} disabled={cooldown > 0 || resending}
                                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF00FF] hover:text-black transition-colors disabled:opacity-40">
                                        {resending
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...</>
                                            : cooldown > 0
                                                ? <><Timer className="w-3.5 h-3.5" /> Kirim ulang dalam {cooldown}s</>
                                                : <><RefreshCw className="w-3.5 h-3.5" /> Kirim ulang kode</>
                                        }
                                    </button>
                                </div>

                                <button onClick={() => setShowOtpModal(false)}
                                    className="w-full text-xs text-black/30 hover:text-black font-bold transition-colors pt-2">
                                    Ganti email pendaftaran
                                </button>
                            </div>

                            {/* Security note */}
                            <div className="mt-6 flex items-start gap-2.5 px-4 py-3 text-[10px] text-black/40 leading-relaxed bg-[#FFFDF0] border-[3px] border-black font-medium">
                                <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-black/30" />
                                <span>Akun langsung terverifikasi setelah kode valid. Keamanan Anda adalah prioritas kami.</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TermsModal isOpen={modalType !== null} onClose={() => setModalType(null)} type={modalType || "terms"} />
        </div>
    )
}