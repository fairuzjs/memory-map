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
import { Shield, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { motion, Variants } from "framer-motion"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    })
}

export default function AdminLoginPage() {
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
                isAdminLogin: "true",
            })
            if (result?.error) {
                toast.error(result.error !== "CredentialsSignin" ? result.error : "Akses Ditolak: Invalid credentials")
            } else {
                toast.success("Admin Login successful")
                router.push("/admin")
                router.refresh()
            }
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#080810] flex selection:bg-rose-500/30 overflow-hidden">

            {/* ── Ambient Background ─────────────────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(225,29,72,0.6) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(225,29,72,0.6) 1px, transparent 1px)`,
                        backgroundSize: "60px 60px"
                    }}
                />
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-600/[0.08] rounded-full blur-[160px]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/[0.08] rounded-full blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] bg-rose-500/[0.05] rounded-full blur-[100px]" />
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
                    style={{ background: "linear-gradient(to bottom, transparent, rgba(225,29,72,0.3), transparent)" }}
                />

                {/* Top: Logo */}
                <motion.div
                    custom={0} variants={fadeUp} initial="hidden" animate="show"
                    className="flex items-center gap-3"
                >
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 bg-rose-600 rounded-xl rotate-[-12deg] shadow-lg shadow-rose-500/30" />
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <span className="font-extrabold text-[22px] font-[Outfit] text-white tracking-tight">
                        Memory<span className="text-rose-400">Map</span> <span className="opacity-50">Admin</span>
                    </span>
                </motion.div>

                {/* Center: Headline */}
                <div className="space-y-8">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-rose-300 border border-rose-500/20 bg-rose-500/[0.07] mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                            Restricted Access Zone
                        </div>
                        <h1 className="font-[Outfit] font-extrabold text-white leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)" }}>
                            Keep the<br />
                            <span
                                style={{
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundImage: "linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #e11d48 100%)",
                                    backgroundClip: "text"
                                }}
                            >
                                community safe.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-neutral-500 text-base leading-relaxed max-w-xs">
                        Administer the MemoryMap ecosystem. Review user reports, moderate content, and maintain a protected environment.
                    </motion.p>
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
                            Back to Application
                        </Link>
                    </motion.div>

                    {/* Mobile logo */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
                        className="flex lg:hidden items-center gap-3 mb-10">
                        <div className="relative w-9 h-9">
                            <div className="absolute inset-0 bg-rose-600 rounded-xl rotate-[-12deg] shadow-lg shadow-rose-500/30" />
                            <div className="relative w-9 h-9 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <span className="font-extrabold text-xl font-[Outfit] text-white tracking-tight">
                            Admin<span className="text-rose-400">Panel</span>
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <h2 className="font-[Outfit] font-extrabold text-3xl text-white tracking-tight mb-1.5 flex items-center gap-2">
                            Admin Access
                        </h2>
                        <p className="text-neutral-500 text-sm">
                            Please authenticate with an administrator account to proceed.
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
                                placeholder="admin@example.com"
                                disabled={isLoading}
                                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 focus:bg-white/[0.05] transition-all px-4 outline-none"
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
                            </div>
                            <div className="relative">
                                <Input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="············"
                                    disabled={isLoading}
                                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm placeholder:text-neutral-700 focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 focus:bg-white/[0.05] transition-all px-4 pr-11 outline-none"
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
                                className="group relative w-full h-11 rounded-full text-sm font-semibold text-white overflow-hidden shadow-xl shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)" }}
                            >
                                <span
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)" }}
                                />
                                <span className="relative flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Secure Login
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </motion.div>
                    </form>

                    <motion.p custom={7} variants={fadeUp} initial="hidden" animate="show"
                        className="mt-6 text-center text-sm text-neutral-600">
                        Not an administrator?{" "}
                        <Link href="/login" className="text-neutral-400 hover:text-white font-semibold transition-colors">
                            Return to User Login →
                        </Link>
                    </motion.p>
                </div>
            </div>
        </div>
    )
}
