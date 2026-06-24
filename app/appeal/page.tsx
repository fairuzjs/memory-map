"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import Link from "next/link"
import { MapPin, ArrowRight, Eye, EyeOff, ArrowLeft, History, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import { motion, Variants } from "framer-motion"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, type: "spring" as const, stiffness: 400, damping: 18 }
    })
}

const inputCls = "h-12 w-full border-[3px] border-black bg-white text-black text-sm placeholder:text-black/30 focus:bg-[#FFFF00]/10 focus:border-black focus:ring-0 transition-all px-4 outline-none font-medium rounded-xl"

function AppealForm() {
    const searchParams = useSearchParams()
    const initialEmail = searchParams?.get("email") || ""

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [step, setStep] = useState<"VERIFY" | "HISTORY" | "SUCCESS">("VERIFY")

    const [email, setEmail] = useState(initialEmail)
    const [password, setPassword] = useState("")
    
    // For SUBMIT
    const [reason, setReason] = useState("")
    
    // For HISTORY
    const [history, setHistory] = useState<any[]>([])

    async function onVerify(e: React.FormEvent) {
        e.preventDefault()
        if (!email || !password) {
            toast.error("Email dan sandi harus diisi")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch("/api/appeal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CHECK", email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Gagal memverifikasi data")
            } else {
                setHistory(data.history || [])
                setStep("HISTORY")
            }
        } catch {
            toast.error("Terjadi kesalahan jaringan")
        } finally {
            setIsLoading(false)
        }
    }

    async function onSubmitAppeal(e: React.FormEvent) {
        e.preventDefault()
        if (reason.length < 10) {
            toast.error("Alasan banding minimal 10 karakter")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch("/api/appeal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SUBMIT", email, password, reason })
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Gagal mengirim banding")
            } else {
                toast.success(data.message)
                setStep("SUCCESS")
            }
        } catch {
            toast.error("Terjadi kesalahan jaringan")
        } finally {
            setIsLoading(false)
        }
    }

    if (step === "SUCCESS") {
        return (
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-200 border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#000]">
                    <span className="text-4xl">🕊️</span>
                </div>
                <div>
                    <h2 className="font-[Outfit] font-black text-2xl text-black tracking-tight mb-2">
                        Banding Terkirim!
                    </h2>
                    <p className="text-black/60 text-sm font-medium">
                        Pengajuan banding Anda telah dikirim ke tim Admin Memory Map untuk diulas. Mohon periksa secara berkala untuk mencoba login kembali.
                    </p>
                </div>
                <Link href="/" className="inline-block mt-4 w-full h-12 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all flex items-center justify-center uppercase tracking-wide rounded-xl">
                    Kembali ke Beranda
                </Link>
            </motion.div>
        )
    }

    if (step === "HISTORY") {
        const hasPending = history.some(h => h.status === "PENDING")

        return (
            <div className="space-y-6">
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-6">
                    <button onClick={() => setStep("VERIFY")} className="inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-black transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Kembali
                    </button>
                </motion.div>

                {history.length > 0 && (
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
                        <h3 className="font-black text-lg uppercase flex items-center gap-2">
                            <History className="w-5 h-5" /> Histori Banding Anda
                        </h3>
                        <div className="space-y-3">
                            {history.map((h, i) => (
                                <div key={i} className="bg-white border-[3px] border-black rounded-xl p-4 shadow-[4px_4px_0_#000]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {h.status === "PENDING" && <Clock className="w-4 h-4 text-yellow-500" />}
                                            {h.status === "APPROVED" && <CheckCircle className="w-4 h-4 text-green-500" />}
                                            {h.status === "REJECTED" && <XCircle className="w-4 h-4 text-red-500" />}
                                            <span className="font-black text-sm uppercase tracking-wide">{h.status}</span>
                                        </div>
                                        <span className="text-xs font-bold text-black/40">
                                            {new Date(h.createdAt).toLocaleDateString("id-ID")}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-black/70 italic">&quot;{h.reason}&quot;</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {!hasPending && (
                    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
                        <h3 className="font-black text-lg uppercase flex items-center gap-2 mb-4 mt-8">
                            <FileText className="w-5 h-5" /> {history.length > 0 ? "Ajukan Banding Baru" : "Formulir Pengajuan"}
                        </h3>
                        <form onSubmit={onSubmitAppeal} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">Alasan Banding</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Jelaskan secara detail kenapa Anda merasa blokir ini adalah kesalahan atau ketidaksengajaan..."
                                    disabled={isLoading}
                                    className="w-full min-h-[120px] resize-none border-[3px] border-black bg-white text-black text-sm placeholder:text-black/30 focus:bg-[#FFFF00]/10 focus:border-black focus:ring-0 transition-all p-4 outline-none font-medium rounded-xl"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full h-12 text-sm font-black text-white bg-black border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide rounded-xl"
                            >
                                {isLoading ? "Mengirim..." : "Kirim Banding"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>
        )
    }

    return (
        <>
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-6">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-black transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Login
                </Link>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                <h2 className="font-[Outfit] font-black text-3xl text-black tracking-tight mb-1.5">
                    Cek / Ajukan Banding
                </h2>
                <p className="text-black/50 text-sm font-medium">
                    Masukkan kredensial akun Anda untuk mengecek status banding sebelumnya atau mengajukan banding baru.
                </p>
            </motion.div>

            <form onSubmit={onVerify} className="space-y-4">
                {/* Email */}
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                    <label className="block text-xs font-black text-black tracking-widest uppercase">Email</label>
                    <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className={inputCls}
                    />
                </motion.div>

                {/* Password */}
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                    <label className="block text-xs font-black text-black tracking-widest uppercase">Sandi</label>
                    <div className="relative">
                        <Input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            placeholder="Sandi akun Anda"
                            disabled={isLoading}
                            className={`${inputCls} pr-11`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/30 hover:text-black transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </motion.div>

                {/* Verify */}
                <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group w-full h-12 text-sm font-black text-white bg-black border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide rounded-xl"
                    >
                        <span className="flex items-center justify-center gap-2">
                            {isLoading ? "Memverifikasi..." : (
                                <>Lanjutkan <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                            )}
                        </span>
                    </button>
                </motion.div>
            </form>
        </>
    )
}

export default function AppealPage() {
    return (
        <div className="min-h-screen bg-[#FFFDF0] flex selection:bg-[#FFFF00] selection:text-black overflow-hidden relative">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
                        backgroundSize: "80px 80px"
                    }}
                />
            </div>

            <div className="w-full flex justify-center p-6 sm:p-12 relative z-10 pt-20 pb-20">
                <div className="w-full max-w-[400px]">
                    {/* Header Logo */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex justify-center items-center gap-3 mb-12">
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] rounded-xl" />
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-black" />
                            </div>
                        </div>
                        <span className="font-black text-[22px] font-[Outfit] text-black tracking-tight">
                            Memory<span className="text-[#d946ef]">Map</span>
                        </span>
                    </motion.div>

                    <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>}>
                        <AppealForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
