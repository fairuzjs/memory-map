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
    hidden: { opacity: 0, y: 30 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, type: "spring" as const, stiffness: 400, damping: 18 }
    })
}

const inputCls = "h-12 w-full border-[3px] border-black bg-white text-black text-sm placeholder:text-black/30 focus:bg-[#FFFF00]/10 focus:border-black focus:ring-0 transition-all px-4 outline-none font-medium"

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
                toast.error(result.error !== "CredentialsSignin" ? result.error : "Email atau password tidak valid")
            } else {
                toast.success("Berhasil masuk")
                router.push("/dashboard")
                router.refresh()
            }
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
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px),
                                          linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
                        backgroundSize: "80px 80px"
                    }}
                />
                <div className="absolute top-[15%] right-[8%] w-20 h-20 border-[3px] border-black/[0.05] rotate-12" />
                <div className="absolute bottom-[20%] left-[5%] w-16 h-16 rounded-full border-[3px] border-black/[0.04]" />
                <div className="absolute top-[60%] right-[15%] w-12 h-12 bg-[#00FFFF]/[0.06] border-[3px] border-black/[0.04]" />
            </div>

            {/* ── Left Panel — Branding ──────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-16 border-r-[4px] border-black bg-white">

                {/* Top: Logo */}
                <motion.div
                    custom={0} variants={fadeUp} initial="hidden" animate="show"
                    className="flex items-center gap-3"
                >
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

                {/* Center: Headline */}
                <div className="space-y-8">
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
                        <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] mb-6">
                            <span className="w-2 h-2 bg-[#00FF00] border-2 border-black" />
                            12.000+ kenangan terpetakan
                        </div>
                        <h1 className="font-[Outfit] font-black text-black leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)" }}>
                            Setiap tempat<br />
                            <span className="inline-block bg-[#FFFF00] px-3 -rotate-1 border-[3px] border-black shadow-[3px_3px_0_#000] mt-2">
                                punya cerita.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
                        className="text-black/50 text-base leading-relaxed max-w-xs font-medium">
                        Sematkan momen paling bermakna dalam hidup Anda di lokasi persisnya di Bumi. Pribadi, indah, dan milik Anda selamanya.
                    </motion.p>

                    {/* Testimonial card */}
                    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
                        className="relative p-5 border-[3px] border-black bg-[#FF00FF] shadow-[4px_4px_0_#000] max-w-xs"
                    >
                        <p className="text-white/90 text-sm leading-relaxed mb-4 font-medium">
                            &quot;MemoryMap mengubah cara saya mengingat perjalanan wisata. Setiap cerita sekarang punya tempatnya sendiri secara visual.&quot;
                        </p>
                        <div className="flex items-center gap-3">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=maya"
                                className="w-8 h-8 border-[3px] border-black bg-[#FFFF00]"
                                alt=""
                            />
                            <div>
                                <p className="text-white text-xs font-black">Fairuz.</p>
                                <p className="text-white/70 text-xs font-bold">Developer · 48 kenangan</p>
                            </div>
                            <div className="ml-auto flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-3 h-3 text-[#FFFF00]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom: Copyright */}
                <motion.p custom={4} variants={fadeUp} initial="hidden" animate="show"
                    className="text-black/30 text-xs font-bold">
                    © {new Date().getFullYear()} MemoryMap Inc.
                </motion.p>
            </div>

            {/* ── Right Panel — Form ─────────────────────────────────────── */}
            <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[400px] py-8 lg:py-0">

                    {/* Back to Home Button */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black/50 hover:text-black transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Beranda
                        </Link>
                    </motion.div>

                    {/* Mobile logo */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
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

                    {/* Heading */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
                        <h2 className="font-[Outfit] font-black text-3xl text-black tracking-tight mb-1.5">
                            Selamat Datang
                        </h2>
                        <p className="text-black/50 text-sm font-medium">
                            Masuk ke akun Anda untuk melanjutkan penjelajahan Memory Map.
                        </p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Email */}
                        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                            <label className="block text-xs font-black text-black tracking-widest uppercase">
                                Email
                            </label>
                            <Input
                                {...register("email")}
                                type="email"
                                placeholder="you@example.com"
                                disabled={isLoading}
                                className={inputCls}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-600 font-bold">{errors.email.message}</p>
                            )}
                        </motion.div>

                        {/* Password */}
                        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-black text-black tracking-widest uppercase">
                                    Sandi
                                </label>
                                <Link href="/forgot-password" className="text-xs text-[#FF00FF] hover:text-black transition-colors font-bold">
                                    Lupa sandi?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="············"
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
                            {errors.password && (
                                <p className="text-xs text-red-600 font-bold">{errors.password.message}</p>
                            )}
                        </motion.div>

                        {/* Remember me */}
                        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
                            <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 border-[3px] border-black bg-white accent-[#FFFF00]"
                                />
                                <span className="text-sm text-black/50 group-hover:text-black transition-colors select-none font-medium">
                                    Ingat saya selama 30 hari
                                </span>
                            </label>
                        </motion.div>

                        {/* Divider */}
                        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show"
                            className="h-[3px] w-full bg-black/10 my-1" />

                        {/* Submit */}
                        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full h-12 text-sm font-black text-black bg-[#FFFF00] border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Memasuki...
                                        </>
                                    ) : (
                                        <>
                                            Masuk
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </motion.div>
                    </form>

                    {/* Register */}
                    <motion.p custom={7} variants={fadeUp} initial="hidden" animate="show"
                        className="mt-6 text-center text-sm text-black/40 font-medium">
                        Belum punya akun?{" "}
                        <Link href="/register" className="text-[#FF00FF] hover:text-black font-black transition-colors">
                            Buat akun gratis →
                        </Link>
                    </motion.p>
                </div>
            </div>
        </div>
    )
}