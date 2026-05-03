"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import Link from "next/link"
import { MapPin, ArrowRight, ArrowLeft } from "lucide-react"
import { motion, Variants } from "framer-motion"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, type: "spring" as const, stiffness: 400, damping: 18 }
    })
}

const inputCls = "h-12 w-full border-[3px] border-black bg-white text-black text-sm placeholder:text-black/30 focus:bg-[#FFFF00]/10 focus:border-black focus:ring-0 transition-all px-4 outline-none font-medium"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    async function onSubmit(data: ForgotPasswordInput) {
        setIsLoading(true)
        try {
            const res = await fetch("/api/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error("Gagal mengirim email")
            setIsSent(true)
            toast.success("Instruksi telah dikirim ke email Anda")
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FFFDF0] flex selection:bg-[#FFFF00] selection:text-black overflow-hidden">

            {/* ── Neubrutalism Background ───────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
                    backgroundSize: "80px 80px"
                }} />
                <div className="absolute top-[20%] right-[12%] w-16 h-16 border-[3px] border-black/[0.05] rotate-12" />
                <div className="absolute bottom-[30%] left-[8%] w-12 h-12 rounded-full border-[3px] border-black/[0.04]" />
            </div>

            {/* ── Center Panel ─────────────────────────────────────────── */}
            <div className="w-full flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-screen">
                <div className="w-full max-w-[400px]">

                    {/* Back to Login Button */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-black transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Kembali ke masuk
                        </Link>
                    </motion.div>

                    {/* Logo */}
                    <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="show"
                        className="flex items-center justify-center lg:justify-start gap-3 mb-10">
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

                    {/* Heading */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8 text-center lg:text-left">
                        <h2 className="font-[Outfit] font-black text-3xl text-black tracking-tight mb-2">
                            Reset Kata Sandi
                        </h2>
                        <p className="text-black/50 text-sm font-medium">
                            {isSent
                                ? "Kami telah mengirimkan instruksi untuk mereset kata sandi Anda ke email."
                                : "Masukkan alamat email Anda untuk menerima instruksi reset kata sandi."}
                        </p>
                    </motion.div>

                    {/* Form */}
                    {!isSent ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">Email</label>
                                <Input {...register("email")} type="email" placeholder="you@example.com" disabled={isLoading} className={inputCls} />
                                {errors.email && <p className="text-xs text-red-600 font-bold">{errors.email.message}</p>}
                            </motion.div>

                            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="h-[3px] w-full bg-black/10 my-1" />

                            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
                                <button type="submit" disabled={isLoading}
                                    className="group w-full h-12 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide">
                                    <span className="flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Mengirim...
                                            </>
                                        ) : (
                                            <>
                                                Kirim Instruksi
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </motion.div>
                        </form>
                    ) : (
                        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="text-center mt-6">
                            <button onClick={() => setIsSent(false)}
                                className="inline-flex items-center gap-2 text-sm font-black text-black px-6 py-3 border-[3px] border-black bg-white shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#00FFFF] transition-all">
                                Coba email lain
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
