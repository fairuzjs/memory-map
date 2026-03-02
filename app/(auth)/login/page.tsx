"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import Link from "next/link"
import { MapPin, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { motion, Variants } from "framer-motion"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    })
}

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    })

    async function onSubmit(data: LoginInput) {
        setIsLoading(true)
        try {
            const result = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
                isAdminLogin: "false",
            })
            if (result?.error) {
                toast.error(result.error !== "CredentialsSignin" ? result.error : "Invalid email or password")
            } else {
                toast.success("Login successful")
                router.push("/dashboard")
                router.refresh()
            }
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

                {/* Center: Headline */}
                <div className="space-y-8">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-300 border border-indigo-500/20 bg-indigo-500/[0.07] mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            12,000+ memories mapped
                        </div>
                        <h1 className="font-[Outfit] font-extrabold text-white leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)" }}>
                            Every place<br />
                            <span
                                style={{
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundImage: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
                                    backgroundClip: "text"
                                }}
                            >
                                tells a story.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-neutral-500 text-base leading-relaxed max-w-xs">
                        Pin your life's most meaningful moments to their exact location on Earth. Private, beautiful, and yours forever.
                    </motion.p>

                    {/* Testimonial card */}
                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
                        className="relative rounded-2xl p-5 border border-white/[0.06] max-w-xs overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                        <div
                            className="absolute top-0 left-0 w-full h-px"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)" }}
                        />
                        <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                            "MemoryMap changed how I remember travel. Every trip now has a permanent, beautiful home."
                        </p>
                        <div className="flex items-center gap-3">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=maya"
                                className="w-8 h-8 rounded-full border border-white/10 bg-neutral-800"
                                alt=""
                            />
                            <div>
                                <p className="text-white text-xs font-semibold">Maya R.</p>
                                <p className="text-neutral-600 text-xs">Explorer · 48 memories</p>
                            </div>
                            <div className="ml-auto flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom: Copyright */}
                <motion.p custom={4} variants={fadeUp} initial="hidden" animate="show"
                    className="text-neutral-700 text-xs">
                    © {new Date().getFullYear()} MemoryMap Inc.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ─────────────────────────────────────────── */}
            <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[400px] py-8 lg:py-0">

                    {/* Back to Home Button */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-white transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>
                    </motion.div>

                    {/* Mobile logo */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
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
                            Welcome back
                        </h2>
                        <p className="text-neutral-500 text-sm">
                            Sign in to continue to your Memory Map.
                        </p>
                    </motion.div>

                    {/* Form */}
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

                        {/* Password */}
                        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="············"
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
                            {errors.password && (
                                <p className="text-xs text-red-400">{errors.password.message}</p>
                            )}
                        </motion.div>

                        {/* Remember me */}
                        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
                            <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border border-white/10 bg-white/[0.04] accent-indigo-500"
                                />
                                <span className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors select-none">
                                    Remember me for 30 days
                                </span>
                            </label>
                        </motion.div>

                        {/* Divider */}
                        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show"
                            className="h-px w-full bg-white/[0.05] my-1" />

                        {/* Submit */}
                        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
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
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </motion.div>
                    </form>

                    {/* Register */}
                    <motion.p custom={7} variants={fadeUp} initial="hidden" animate="show"
                        className="mt-6 text-center text-sm text-neutral-600">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Create one free →
                        </Link>
                    </motion.p>
                </div>
            </div>
        </div>
    )
}