"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, Coins, Star, Search, User, CheckCircle2,
    Zap, ArrowLeft, History
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

const TOPUP_OPTIONS = [
    { amount: 500, price: 5000, label: "Starter" },
    { amount: 1000, price: 10000, label: "Basic" },
    { amount: 2500, price: 25000, label: "Popular" },
    { amount: 5000, price: 50000, label: "Pro" },
    { amount: 10000, price: 100000, label: "Elite" },
    { amount: 25000, price: 250000, label: "Legendary" },
]

type UserResult = {
    id: string
    name: string
    email: string
    image: string | null
    points: number
}

type HistoryEntry = {
    userName: string
    amount: number
    time: string
}

function formatRupiah(n: number) {
    return "Rp " + n.toLocaleString("id-ID")
}

export default function AdminTopupProcessPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [query, setQuery] = useState("")
    const [searchResults, setSearchResults] = useState<UserResult[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [processing, setProcessing] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (status === "unauthenticated" || (session?.user && session.user.role !== "ADMIN")) {
            router.push("/dashboard")
        }
    }, [status, session, router])

    // Debounced search
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(`/api/admin/topup?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setSearchResults(Array.isArray(data) ? data : [])
                setShowDropdown(true)
            } finally {
                setSearching(false)
            }
        }, 400)
    }, [query])

    const handleSelectUser = (user: UserResult) => {
        setSelectedUser(user)
        setQuery(user.name)
        setShowDropdown(false)
        setSelectedAmount(null)
    }

    const handleProcess = async () => {
        if (!selectedUser || !selectedAmount) return
        setProcessing(true)
        try {
            const res = await fetch("/api/admin/topup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailOrName: selectedUser.email, amount: selectedAmount }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Gagal memproses topup")
                return
            }

            const opt = TOPUP_OPTIONS.find(o => o.amount === selectedAmount)!
            toast.success(`✅ ${selectedUser.name} mendapat ${selectedAmount.toLocaleString("id-ID")} poin!`)

            // Update user points in the form
            setSelectedUser(prev => prev ? { ...prev, points: data.user.points } : null)

            // Add to local history
            setHistory(prev => [
                { userName: selectedUser.name, amount: selectedAmount, time: new Date().toLocaleTimeString("id-ID") },
                ...prev.slice(0, 9)
            ])

            setSelectedAmount(null)
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setProcessing(false)
        }
    }

    const resetForm = () => {
        setQuery("")
        setSelectedUser(null)
        setSelectedAmount(null)
        setSearchResults([])
    }

    if (status === "loading") {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6" style={{ fontFamily: "Outfit, sans-serif" }}>
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Link href="/admin/topup" className="text-neutral-600 hover:text-neutral-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold tracking-widest text-neutral-600 uppercase">Admin Panel</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Proses Topup</h1>
                <p className="text-neutral-500 text-sm mt-1">Tambah poin langsung ke akun user</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Panel */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Step 1: Cari User */}
                    <div
                        className="rounded-2xl p-5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <p className="text-xs font-bold tracking-widest text-neutral-600 uppercase mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">1</span>
                            Cari User
                        </p>

                        <div className="relative">
                            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <Search className="w-4 h-4 text-neutral-500 shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); if (selectedUser) setSelectedUser(null) }}
                                    placeholder="Cari berdasarkan nama atau email..."
                                    className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 outline-none"
                                />
                                {searching && <Loader2 className="w-4 h-4 animate-spin text-neutral-500 shrink-0" />}
                            </div>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {showDropdown && searchResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full mt-2 left-0 right-0 z-30 rounded-xl overflow-hidden shadow-2xl"
                                        style={{ background: "#0f0f16", border: "1px solid rgba(255,255,255,0.1)" }}
                                    >
                                        {searchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {user.image
                                                        ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                        : <User className="w-4 h-4 text-neutral-500" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                                                </div>
                                                <span className="text-xs text-amber-400 font-bold shrink-0">
                                                    {user.points.toLocaleString("id-ID")} pts
                                                </span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Selected User Preview */}
                        <AnimatePresence>
                            {selectedUser && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 rounded-xl p-3 flex items-center gap-3"
                                    style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center border border-white/[0.08]">
                                        {selectedUser.image
                                            ? <img src={selectedUser.image} alt="" className="w-full h-full object-cover" />
                                            : <User className="w-5 h-5 text-neutral-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">{selectedUser.name}</p>
                                        <p className="text-xs text-neutral-500">{selectedUser.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-neutral-500">Poin saat ini</p>
                                        <p className="text-sm font-black text-amber-400">{selectedUser.points.toLocaleString("id-ID")}</p>
                                    </div>
                                    <button onClick={resetForm} className="text-neutral-600 hover:text-neutral-300 transition-colors">✕</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step 2: Pilih Nominal */}
                    <div
                        className={`rounded-2xl p-5 transition-all ${!selectedUser ? "opacity-40 pointer-events-none" : ""}`}
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <p className="text-xs font-bold tracking-widest text-neutral-600 uppercase mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">2</span>
                            Pilih Nominal
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {TOPUP_OPTIONS.map(opt => {
                                const isSelected = selectedAmount === opt.amount
                                return (
                                    <button
                                        key={opt.amount}
                                        onClick={() => setSelectedAmount(opt.amount)}
                                        className="flex flex-col text-left p-3.5 rounded-xl transition-all"
                                        style={{
                                            background: isSelected ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.03)",
                                            border: isSelected ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.07)",
                                        }}
                                    >
                                        <span className="text-[10px] text-neutral-600 font-bold uppercase mb-1">{opt.label}</span>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-base font-black text-white">
                                                {opt.amount >= 1000 ? `${opt.amount / 1000}k` : opt.amount}
                                            </span>
                                            <span className="text-[10px] text-neutral-500">pts</span>
                                        </div>
                                        <p className="text-xs font-bold text-amber-400">{formatRupiah(opt.price)}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Step 3: Konfirmasi */}
                    <div
                        className={`rounded-2xl p-5 transition-all ${(!selectedUser || !selectedAmount) ? "opacity-40 pointer-events-none" : ""}`}
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <p className="text-xs font-bold tracking-widest text-neutral-600 uppercase mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">3</span>
                            Konfirmasi & Proses
                        </p>

                        {selectedUser && selectedAmount && (
                            <div
                                className="rounded-xl p-4 mb-4"
                                style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}
                            >
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-neutral-500">User</span>
                                    <span className="font-bold text-white">{selectedUser.name}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-neutral-500">Poin ditambahkan</span>
                                    <span className="font-black text-amber-400">+{selectedAmount.toLocaleString("id-ID")} poin</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Total poin setelah</span>
                                    <span className="font-bold text-white">
                                        {(selectedUser.points + selectedAmount).toLocaleString("id-ID")} poin
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleProcess}
                            disabled={!selectedUser || !selectedAmount || processing}
                            className="w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#1a1000" }}
                        >
                            {processing
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                                : <><Zap className="w-4 h-4" /> Tambahkan Poin Sekarang</>
                            }
                        </button>
                    </div>
                </div>

                {/* History Panel */}
                <div className="space-y-4">
                    <div
                        className="rounded-2xl p-5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-4 h-4 text-neutral-500" />
                            <p className="text-sm font-bold text-neutral-300">Riwayat Sesi Ini</p>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-8">
                                <Coins className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                                <p className="text-xs text-neutral-600">Belum ada topup yang diproses</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {history.map((entry, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 p-2.5 rounded-xl"
                                            style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.1)" }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{entry.userName}</p>
                                                <p className="text-[10px] text-neutral-500">{entry.time}</p>
                                            </div>
                                            <span className="text-xs font-black text-emerald-400 shrink-0">
                                                +{entry.amount >= 1000 ? `${entry.amount / 1000}k` : entry.amount}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Quick tip */}
                    <div
                        className="rounded-2xl p-4"
                        style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)" }}
                    >
                        <p className="text-xs font-bold text-indigo-400 mb-2">💡 Tips Admin</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            Gunakan halaman <Link href="/admin/topup" className="text-indigo-400 hover:underline">Pesanan Topup</Link> untuk melihat daftar pesanan dari user dan meng-approve satu per satu dengan verifikasi pembayaran.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
