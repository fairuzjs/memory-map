"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import Link from "next/link"
import { MapPin, ArrowRight, Eye, EyeOff, Globe, Lock, BookOpen, Check, X, ArrowLeft } from "lucide-react"
import { motion, Variants } from "framer-motion"

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
        title: "Pin anywhere on Earth",
        desc: "Drop memories on an interactive world map with exact coordinates."
    },
    {
        icon: BookOpen,
        title: "Rich journaling",
        desc: "Attach photos, stories, and emotions to every location."
    },
    {
        icon: Lock,
        title: "Private by default",
        desc: "Your memories are encrypted and only visible to you."
    },
]

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const passwordValue = watch("password") || ""

    async function onSubmit(data: RegisterInput) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.error || "Registration failed")
                return
            }

            toast.success("Account created! Please sign in.")
            router.push("/login")
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
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/[0.11] rounded-full blur-[160px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/[0.1] rounded-full blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] bg-purple-500/[0.05] rounded-full blur-[100px]" />
                <div
                    className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
                />
            </div>

            {/* ── Left Panel — Branding ──────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-16 border-r border-white/[0.05]">
                {/* Vertical accent line */}
                <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2/3"
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.3), transparent)" }}
                />

                {/* Top: Logo */}
                <motion.div
                    custom={0} variants={fadeUp} initial="hidden" animate="show"
                    className="flex items-center gap-3"
                >
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

                {/* Center: Headline + Perks */}
                <div className="space-y-8">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-300 border border-indigo-500/20 bg-indigo-500/[0.07] mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Free forever · No credit card
                        </div>
                        <h1 className="font-[Outfit] font-extrabold text-white leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)" }}>
                            Start your<br />
                            <span
                                style={{
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundImage: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
                                    backgroundClip: "text"
                                }}
                            >
                                memory atlas.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-neutral-500 text-base leading-relaxed max-w-xs">
                        Join thousands of explorers who use MemoryMap to keep their most precious moments alive — beautifully.
                    </motion.p>

                    {/* Perks list */}
                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-3">
                        {perks.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.07]"
                                    style={{ background: "rgba(99,102,241,0.1)" }}>
                                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold">{title}</p>
                                    <p className="text-neutral-600 text-xs leading-relaxed mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Social proof avatars */}
                    <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
                        className="flex items-center gap-3 pt-2">
                        <div className="flex -space-x-2">
                            {["alice", "bob", "carol", "dave", "eve"].map(seed => (
                                <img
                                    key={seed}
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                                    className="w-7 h-7 rounded-full border-2 border-[#080810] bg-neutral-800"
                                    alt=""
                                />
                            ))}
                        </div>
                        <p className="text-neutral-600 text-xs">
                            <span className="text-neutral-300 font-semibold">12,000+</span> explorers worldwide
                        </p>
                    </motion.div>
                </div>

                {/* Bottom: Copyright */}
                <motion.p custom={5} variants={fadeUp} initial="hidden" animate="show"
                    className="text-neutral-700 text-xs">
                    © {new Date().getFullYear()} MemoryMap Inc.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ─────────────────────────────────────────── */}
            <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
                <div className="w-full max-w-[400px] py-8 lg:py-0">

                    {/* Back to Home Button */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-white transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
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

                    {/* Heading */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <h2 className="font-[Outfit] font-extrabold text-3xl text-white tracking-tight mb-1.5">
                            Create account
                        </h2>
                        <p className="text-neutral-500 text-sm">
                            Free forever. No credit card required.
                        </p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Full Name */}
                        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                            <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                                Full Name
                            </label>
                            <Input
                                {...register("name")}
                                type="text"
                                placeholder="Your name"
                                disabled={isLoading}
                                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.05] transition-all px-4 outline-none"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-400">{errors.name.message}</p>
                            )}
                        </motion.div>

                        {/* Email */}
                        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
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

                        {/* Password */}
                        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                            <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    disabled={isLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.05] transition-all px-4 pr-11 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-700 hover:text-neutral-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            <div className="pt-1 pb-2 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs">
                                    {passwordValue.length >= 8 ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <X className="w-3.5 h-3.5 text-neutral-600" />
                                    )}
                                    <span className={passwordValue.length >= 8 ? "text-emerald-400" : "text-neutral-500"}>
                                        At least 8 characters
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {/\d/.test(passwordValue) ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <X className="w-3.5 h-3.5 text-neutral-600" />
                                    )}
                                    <span className={/\d/.test(passwordValue) ? "text-emerald-400" : "text-neutral-500"}>
                                        At least 1 number
                                    </span>
                                </div>
                            </div>

                            {errors.password && (
                                <p className="text-xs text-red-400">{errors.password.message}</p>
                            )}
                        </motion.div>

                        {/* Confirm Password */}
                        <motion.div custom={4.5} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                            <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Input
                                    {...register("confirmPassword")}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Repeat your password"
                                    disabled={isLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.05] transition-all px-4 pr-11 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-700 hover:text-neutral-300 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                            )}
                        </motion.div>

                        {/* Terms */}
                        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
                            <p className="text-xs text-neutral-600 leading-relaxed">
                                By creating an account you agree to our{" "}
                                <Link href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>.
                            </p>
                        </motion.div>

                        {/* Divider */}
                        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show"
                            className="h-px w-full bg-white/[0.05] my-1" />

                        {/* Submit */}
                        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
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
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            Create free account
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </motion.div>
                    </form>

                    {/* Login link */}
                    <motion.p custom={8} variants={fadeUp} initial="hidden" animate="show"
                        className="mt-6 text-center text-sm text-neutral-600">
                        Already have an account?{" "}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Sign in →
                        </Link>
                    </motion.p>
                </div>
            </div>
        </div>
    )
}