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
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    })
}

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
            // Replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1500))
            setIsSent(true)
            toast.success("Instructions sent to your email")
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#080810] flex selection:bg-indigo-500/30 overflow-hidden">

            {/* ── Ambient Background ─────────────────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px"
                    }}
                />
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/[0.11] rounded-full blur-[160px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-violet-600/[0.1] rounded-full blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] bg-indigo-500/[0.05] rounded-full blur-[100px]" />
                <div
                    className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
                />
            </div>

            {/* ── Center Panel ─────────────────────────────────────────────── */}
            <div className="w-full flex items-center justify-center p-6 sm:p-12 relative z-10 min-h-screen">
                <div className="w-full max-w-[400px]">

                    {/* Back to Login Button */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-white transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to login
                        </Link>
                    </motion.div>

                    {/* Logo */}
                    <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="show"
                        className="flex items-center justify-center lg:justify-start gap-3 mb-10">
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

                    {/* Heading */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8 text-center lg:text-left">
                        <h2 className="font-[Outfit] font-extrabold text-3xl text-white tracking-tight mb-2">
                            Reset password
                        </h2>
                        <p className="text-neutral-500 text-sm">
                            {isSent
                                ? "We've sent you instructions to reset your password."
                                : "Enter your email address to receive password reset instructions."}
                        </p>
                    </motion.div>

                    {/* Form */}
                    {!isSent ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email */}
                            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                                    Email
                                </label>
                                <Input
                                    {...register("email")}
                                    type="email"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.05] transition-all px-4 outline-none"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-400">{errors.email.message}</p>
                                )}
                            </motion.div>

                            {/* Divider */}
                            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
                                className="h-px w-full bg-white/[0.05] my-1" />

                            {/* Submit */}
                            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: isLoading ? 1 : 1.015 }}
                                    whileTap={{ scale: isLoading ? 1 : 0.985 }}
                                    className="group relative w-full h-11 rounded-full text-sm font-semibold text-white overflow-hidden shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                                >
                                    <span
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
                                    />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send instructions
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            </motion.div>
                        </form>
                    ) : (
                        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="text-center mt-6">
                            <motion.button
                                onClick={() => setIsSent(false)}
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.985 }}
                                className="inline-flex items-center gap-2 text-sm font-medium text-white px-6 py-2.5 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
                            >
                                Try another email
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
