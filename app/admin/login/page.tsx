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
import { Shield, ArrowRight, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
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
        <div className="min-h-screen bg-[#FFFDF0] flex selection:bg-rose-400/30 overflow-hidden font-[Outfit]">

            {/* ── Ambient Background (Subtle Grid) ───────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px),
                                          linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: "40px 40px"
                    }}
                />
            </div>

            {/* ── Left Panel — Branding ──────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-16 border-r-[4px] border-black bg-cyan-300">
                {/* Top: Logo */}
                <motion.div
                    custom={0} variants={fadeUp} initial="hidden" animate="show"
                    className="flex items-center gap-3"
                >
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 bg-yellow-300 border-[3px] border-black rounded-xl rotate-[-6deg] shadow-[4px_4px_0_#000]" />
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-black" />
                        </div>
                    </div>
                    <span className="font-black text-2xl tracking-tight text-black">
                        ADMIN<span className="text-white drop-shadow-[2px_2px_0_#000]">PANEL</span>
                    </span>
                </motion.div>

                {/* Center: Headline */}
                <div className="space-y-8 z-10">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black text-black border-[3px] border-black bg-rose-400 shadow-[4px_4px_0_#000] mb-8 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse border border-black" />
                            Restricted Access
                        </div>
                        <h1 className="font-black text-black leading-tight uppercase" style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", textShadow: "4px 4px 0px #fff" }}>
                            Secure<br />
                            <span className="text-rose-500 drop-shadow-[3px_3px_0_#000]">
                                Control.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-black font-bold text-lg leading-relaxed max-w-sm bg-white p-4 border-[3px] border-black shadow-[6px_6px_0_#000] rounded-xl rotate-1">
                        Administer the MemoryMap ecosystem. Review user reports, moderate content, and maintain a protected environment.
                    </motion.p>
                </div>

                {/* Bottom: Copyright */}
                <motion.p custom={4} variants={fadeUp} initial="hidden" animate="show"
                    className="text-black font-bold text-sm">
                    © {new Date().getFullYear()} MemoryMap Inc.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ─────────────────────────────────────────── */}
            <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[400px] py-8 lg:py-0">

                    {/* Back to Home Button */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] text-sm font-black text-black hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000] hover:bg-yellow-100 transition-all uppercase rounded-xl">
                            <ArrowLeft className="w-4 h-4" />
                            Aplikasi
                        </Link>
                    </motion.div>

                    {/* Mobile logo */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
                        className="flex lg:hidden items-center gap-3 mb-10">
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 bg-yellow-300 border-[2px] border-black rounded-xl rotate-[-6deg] shadow-[3px_3px_0_#000]" />
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-black" />
                            </div>
                        </div>
                        <span className="font-black text-2xl tracking-tight text-black">
                            ADMIN<span className="text-cyan-500 drop-shadow-[2px_2px_0_#000]">PANEL</span>
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <h2 className="font-black text-3xl text-black tracking-tight mb-2 uppercase">
                            Admin Login
                        </h2>
                        <p className="text-neutral-800 font-bold text-sm">
                            Please authenticate with an administrator account to proceed.
                        </p>
                    </motion.div>

                    {/* Form Container */}
                    <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_#000] rounded-2xl p-6 relative">
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-300 border-[3px] border-black rounded-full flex items-center justify-center rotate-12 shadow-[2px_2px_0_#000]">
                            <span className="text-black text-xs font-black">!</span>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                            {/* Email */}
                            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-2">
                                <label className="block text-sm font-black text-black uppercase tracking-wide">
                                    Email
                                </label>
                                <Input
                                    {...register("email")}
                                    type="email"
                                    placeholder="admin@example.com"
                                    disabled={isLoading}
                                    className="h-12 w-full rounded-xl border-[3px] border-black bg-[#FFFDF0] text-black font-bold placeholder:text-neutral-400 focus:border-black focus:ring-0 shadow-[4px_4px_0_#000] focus:shadow-[2px_2px_0_#000] focus:translate-y-[2px] focus:translate-x-[2px] transition-all px-4 outline-none"
                                />
                                {errors.email && (
                                    <p className="text-xs font-bold text-rose-500 bg-rose-100 border-2 border-black inline-block px-2 py-1 rounded-md mt-2">{errors.email.message}</p>
                                )}
                            </motion.div>

                            {/* Password */}
                            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-2">
                                <label className="block text-sm font-black text-black uppercase tracking-wide">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        {...register("password")}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="············"
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-xl border-[3px] border-black bg-[#FFFDF0] text-black font-bold placeholder:text-neutral-400 focus:border-black focus:ring-0 shadow-[4px_4px_0_#000] focus:shadow-[2px_2px_0_#000] focus:translate-y-[2px] focus:translate-x-[2px] transition-all px-4 pr-12 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-black hover:bg-yellow-200 border-2 border-transparent hover:border-black rounded-lg transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs font-bold text-rose-500 bg-rose-100 border-2 border-black inline-block px-2 py-1 rounded-md mt-2">{errors.password.message}</p>
                                )}
                            </motion.div>

                            {/* Submit */}
                            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" className="pt-2">
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ y: -2, x: -2, boxShadow: "8px 8px 0px #000" }}
                                    whileTap={{ y: 2, x: 2, boxShadow: "0px 0px 0px #000" }}
                                    className="w-full h-12 rounded-xl border-[3px] border-black bg-rose-400 text-black font-black uppercase tracking-wide shadow-[6px_6px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            Secure Login
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </form>
                    </div>

                    <motion.p custom={7} variants={fadeUp} initial="hidden" animate="show"
                        className="mt-8 text-center text-sm font-bold text-neutral-800 bg-white border-[3px] border-black p-3 rounded-xl shadow-[4px_4px_0_#000]">
                        Not an administrator?{" "}
                        <Link href="/login" className="text-rose-500 hover:text-rose-600 underline underline-offset-4 decoration-2 decoration-black">
                            Return to User Login
                        </Link>
                    </motion.p>
                </div>
            </div>
        </div>
    )
}
