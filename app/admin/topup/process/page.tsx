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
            <div className="flex h-[60vh] items-center justify-center font-[Outfit]">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10 font-[Outfit]">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Link href="/admin/topup" className="p-1 rounded-lg bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] transition-all text-black">
                        <ArrowLeft className="w-4 h-4 font-black" />
                    </Link>
                    <div className="w-6 h-6 rounded-md bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-black" />
                    </div>
                    <span className="text-[11px] font-black tracking-widest text-black uppercase">Admin Panel</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-black tracking-tight uppercase">Proses Topup</h1>
                <p className="text-black font-bold text-sm mt-1">Tambah poin langsung ke akun user</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Cari User */}
                    <div
                        className="rounded-2xl p-6 bg-white border-[3px] border-black shadow-[6px_6px_0_#000]"
                    >
                        <p className="text-sm font-black tracking-widest text-black uppercase mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] text-black text-xs font-black flex items-center justify-center">1</span>
                            Cari User
                        </p>

                        <div className="relative">
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all bg-white border-[3px] border-black shadow-[4px_4px_0_#000] focus-within:translate-y-[2px] focus-within:shadow-[2px_2px_0_#000]">
                                <Search className="w-5 h-5 text-black shrink-0 font-black" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); if (selectedUser) setSelectedUser(null) }}
                                    placeholder="Cari berdasarkan nama atau email..."
                                    className="flex-1 bg-transparent text-sm font-bold text-black placeholder-neutral-500 outline-none"
                                />
                                {searching && <Loader2 className="w-5 h-5 animate-spin text-black shrink-0" />}
                            </div>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {showDropdown && searchResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full mt-2 left-0 right-0 z-30 rounded-xl overflow-hidden bg-[#FFFDF0] border-[3px] border-black shadow-[8px_8px_0_#000]"
                                    >
                                        {searchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-300 transition-colors text-left border-b-[2px] border-black last:border-b-0"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-cyan-100 overflow-hidden border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 flex items-center justify-center">
                                                    {user.image
                                                        ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                        : <User className="w-5 h-5 text-black" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-black uppercase truncate">{user.name}</p>
                                                    <p className="text-xs font-bold text-neutral-700 truncate">{user.email}</p>
                                                </div>
                                                <span className="text-xs font-black text-black bg-cyan-300 px-2 py-1 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 uppercase">
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
                                    className="mt-4 rounded-xl p-4 flex items-center gap-3 bg-cyan-100 border-[3px] border-black shadow-[4px_4px_0_#000]"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 flex items-center justify-center">
                                        {selectedUser.image
                                            ? <img src={selectedUser.image} alt="" className="w-full h-full object-cover" />
                                            : <User className="w-6 h-6 text-black" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-black uppercase">{selectedUser.name}</p>
                                        <p className="text-xs font-bold text-neutral-700">{selectedUser.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Poin saat ini</p>
                                        <p className="text-sm font-black text-black bg-yellow-300 px-2 py-0.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0_#000] inline-block">{selectedUser.points.toLocaleString("id-ID")}</p>
                                    </div>
                                    <button onClick={resetForm} className="ml-2 w-8 h-8 rounded-lg bg-rose-400 border-[2px] border-black shadow-[2px_2px_0_#000] flex items-center justify-center hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] transition-all text-black font-black">✕</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step 2: Pilih Nominal */}
                    <div
                        className={`rounded-2xl p-6 bg-white border-[3px] border-black shadow-[6px_6px_0_#000] transition-all ${!selectedUser ? "opacity-50 grayscale pointer-events-none" : ""}`}
                    >
                        <p className="text-sm font-black tracking-widest text-black uppercase mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] text-black text-xs font-black flex items-center justify-center">2</span>
                            Pilih Nominal
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPUP_OPTIONS.map(opt => {
                                const isSelected = selectedAmount === opt.amount
                                return (
                                    <button
                                        key={opt.amount}
                                        onClick={() => setSelectedAmount(opt.amount)}
                                        className={`flex flex-col text-left p-4 rounded-xl transition-all border-[3px] border-black ${
                                            isSelected
                                                ? "bg-cyan-300 shadow-[2px_2px_0_#000] translate-y-[2px]"
                                                : "bg-white shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000]"
                                        }`}
                                    >
                                        <span className="text-[11px] text-black font-black uppercase tracking-wider mb-1 bg-yellow-300 px-2 py-0.5 rounded border-[2px] border-black self-start">{opt.label}</span>
                                        <div className="flex items-center gap-1 mb-1 mt-1">
                                            <Star className="w-4 h-4 text-black fill-black" />
                                            <span className="text-xl font-black text-black">
                                                {opt.amount >= 1000 ? `${opt.amount / 1000}k` : opt.amount}
                                            </span>
                                            <span className="text-[10px] font-black uppercase text-black">pts</span>
                                        </div>
                                        <p className="text-sm font-black text-black bg-white px-2 py-0.5 rounded border-[2px] border-black inline-block shadow-[2px_2px_0_#000]">{formatRupiah(opt.price)}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Step 3: Konfirmasi */}
                    <div
                        className={`rounded-2xl p-6 bg-white border-[3px] border-black shadow-[6px_6px_0_#000] transition-all ${(!selectedUser || !selectedAmount) ? "opacity-50 grayscale pointer-events-none" : ""}`}
                    >
                        <p className="text-sm font-black tracking-widest text-black uppercase mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-yellow-300 border-[2px] border-black shadow-[2px_2px_0_#000] text-black text-xs font-black flex items-center justify-center">3</span>
                            Konfirmasi & Proses
                        </p>

                        {selectedUser && selectedAmount && (
                            <div
                                className="rounded-xl p-5 mb-5 bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0_#000]"
                            >
                                <div className="flex justify-between text-sm mb-3 items-center">
                                    <span className="font-bold text-black uppercase">User</span>
                                    <span className="font-black text-black bg-white px-2 py-1 rounded border-[2px] border-black shadow-[2px_2px_0_#000]">{selectedUser.name}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-3 items-center">
                                    <span className="font-bold text-black uppercase">Poin ditambahkan</span>
                                    <span className="font-black text-black bg-cyan-300 px-2 py-1 rounded border-[2px] border-black shadow-[2px_2px_0_#000]">+{selectedAmount.toLocaleString("id-ID")} poin</span>
                                </div>
                                <div className="flex justify-between text-sm items-center pt-3 border-t-[3px] border-black border-dashed">
                                    <span className="font-bold text-black uppercase">Total poin setelah</span>
                                    <span className="text-lg font-black text-black bg-white px-2 py-1 rounded border-[2px] border-black shadow-[2px_2px_0_#000]">
                                        {(selectedUser.points + selectedAmount).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleProcess}
                            disabled={!selectedUser || !selectedAmount || processing}
                            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-green-300 text-black border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] disabled:opacity-50 disabled:shadow-none disabled:translate-y-[4px]"
                        >
                            {processing
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                                : <><Zap className="w-5 h-5" /> Tambahkan Poin Sekarang</>
                            }
                        </button>
                    </div>
                </div>

                {/* History Panel */}
                <div className="space-y-6">
                    <div
                        className="rounded-2xl p-6 bg-[#FFFDF0] border-[3px] border-black shadow-[6px_6px_0_#000]"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <History className="w-5 h-5 text-black font-black" />
                            <p className="text-base font-black text-black uppercase tracking-wide">Riwayat Sesi Ini</p>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-10 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_#000]">
                                <Coins className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                                <p className="text-sm font-bold text-neutral-500 uppercase">Belum ada topup</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {history.map((entry, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white border-[3px] border-black shadow-[4px_4px_0_#000]"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-green-300 border-[2px] border-black flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-black" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-black uppercase truncate">{entry.userName}</p>
                                                <p className="text-[10px] font-bold text-neutral-600">{entry.time}</p>
                                            </div>
                                            <span className="text-sm font-black text-black bg-yellow-300 px-2 py-1 rounded border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0 uppercase">
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
                        className="rounded-2xl p-5 bg-cyan-100 border-[3px] border-black shadow-[6px_6px_0_#000]"
                    >
                        <p className="text-sm font-black text-black uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span className="text-xl">💡</span> Tips Admin
                        </p>
                        <p className="text-sm font-bold text-neutral-800 leading-relaxed">
                            Gunakan halaman <Link href="/admin/topup" className="text-black bg-white px-1 border-[2px] border-black rounded shadow-[2px_2px_0_#000] hover:bg-yellow-300 transition-colors uppercase font-black text-[11px] mx-1">Pesanan Topup</Link> untuk melihat daftar pesanan dari user dan meng-approve satu per satu dengan verifikasi pembayaran.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
