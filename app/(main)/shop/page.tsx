"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, ShoppingBag, Sparkles, CheckCircle2, Star, User, Image as ImageIcon, Coins, Grid2x2, Type, Eye, X, Zap, Sticker } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"
import { StickerRenderer, StickerConfig } from "@/components/memories/StickerRenderer"

function getDecorationClass(name?: string) {
    if (!name) return "";
    const n = name.toLowerCase();
    if (n.includes("kristal")) return "anim-kristal";
    if (n.includes("api")) return "anim-api";
    if (n.includes("neon")) return "anim-neon";
    if (n.includes("emas")) return "anim-emas";
    if (n.includes("pelangi")) return "anim-pelangi";
    return "";
}

function formatPoints(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
    }
    if (num >= 1000) {
        return (num / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " rb";
    }
    return num.toLocaleString("id-ID");
}

type ShopItem = {
    id: string
    name: string
    description: string
    price: number
    type: "AVATAR_FRAME" | "PROFILE_BANNER" | "MEMORY_CARD_THEME" | "USERNAME_DECORATION" | "MEMORY_STICKER"
    value: string
    previewColor: string | null
    owned: boolean
    equipped: boolean
}

const TYPE_LABELS: Record<string, string> = {
    AVATAR_FRAME: "Bingkai Avatar",
    PROFILE_BANNER: "Banner Profil",
    MEMORY_CARD_THEME: "Tema Kartu",
    USERNAME_DECORATION: "Dekorasi Nama",
    MEMORY_STICKER: "Stiker Kenangan",
}
const TYPE_ICONS: Record<string, React.FC<any>> = {
    AVATAR_FRAME: User,
    PROFILE_BANNER: ImageIcon,
    MEMORY_CARD_THEME: Grid2x2,
    USERNAME_DECORATION: Type,
    MEMORY_STICKER: Sticker,
}

export default function ShopPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [items, setItems] = useState<ShopItem[]>([])
    const [points, setPoints] = useState(0)
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState<"ALL" | "AVATAR_FRAME" | "PROFILE_BANNER" | "MEMORY_CARD_THEME" | "USERNAME_DECORATION" | "MEMORY_STICKER">("ALL")
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [equipping, setEquipping] = useState<string | null>(null)
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(null)

    const loadShop = useCallback(async () => {
        const res = await fetch("/api/shop")
        if (!res.ok) return
        const data = await res.json()
        setItems(data.items)
        setPoints(data.points)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (status === "unauthenticated") { router.push("/login"); return }
        if (status === "authenticated") loadShop()
    }, [status, loadShop, router])

    const handlePurchase = async (item: ShopItem) => {
        setPurchasing(item.id)
        try {
            const res = await fetch("/api/shop/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error === "Insufficient points" ? "Poin tidak cukup!" : (data.error || "Gagal membeli"))
                return
            }
            setPoints(data.newPoints)
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, owned: true } : i))
            toast.success(`🎉 "${item.name}" berhasil dibeli!`)
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setPurchasing(null)
        }
    }

    const handleEquip = async (item: ShopItem) => {
        setEquipping(item.id)
        try {
            const res = await fetch("/api/inventory/equip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error || "Gagal memakai item"); return }

            const willEquip = data.equipped
            setItems(prev => prev.map(i => {
                if (i.type !== item.type) return i
                if (i.id === item.id) return { ...i, equipped: willEquip }
                return { ...i, equipped: false }
            }))
            toast.success(willEquip ? `✨ "${item.name}" sedang dipakai!` : `"${item.name}" dilepas.`)
        } catch {
            toast.error("Terjadi kesalahan")
        } finally {
            setEquipping(null)
        }
    }

    const filtered = activeType === "ALL" ? items : items.filter(i => i.type === activeType)
    const AVATAR_PREVIEW_SIZE = "w-16 h-16"

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" style={{ fontFamily: "Outfit, sans-serif" }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
            >
                <div>
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">Memory Shop</h1>
                    </div>
                    <p className="text-[13px] sm:text-sm text-neutral-500 ml-13 sm:ml-16 leading-relaxed mt-1 sm:mt-1.5">Tukarkan poin kamu dengan dekorasi profil eksklusif</p>
                </div>

                {/* Topup Banner */}
                <Link
                    href="/topup"
                    className="flex items-center gap-3 mt-5 px-4 py-3 rounded-2xl group transition-all"
                    style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.07), rgba(245,158,11,0.03))",
                        border: "1px solid rgba(251,191,36,0.2)",
                    }}
                >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.1)" }}>
                        <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-300">Topup Memory Point</p>
                        <p className="text-xs text-neutral-500">Butuh lebih banyak poin? Topup sekarang secara instan</p>
                    </div>
                    <div className="text-amber-500/50 group-hover:text-amber-400 transition-colors text-xs font-bold">
                        Topup →
                    </div>
                </Link>

                {/* Type filter tabs */}
                <div className="flex gap-2 mt-5 sm:mt-6 overflow-x-auto pb-2 flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
                    {(["ALL", "AVATAR_FRAME", "PROFILE_BANNER", "MEMORY_CARD_THEME", "USERNAME_DECORATION", "MEMORY_STICKER"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveType(tab)}
                            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                            style={{
                                background: activeType === tab ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                                border: activeType === tab ? "1px solid rgba(99,102,241,0.45)" : "1px solid rgba(255,255,255,0.08)",
                                color: activeType === tab ? "#a5b4fc" : "#6b7280",
                            }}
                        >
                            {tab === "ALL" ? "Semua" : TYPE_LABELS[tab]}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Item Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filtered.map((item, i) => {
                        const TypeIcon = TYPE_ICONS[item.type]
                        const isBuying = purchasing === item.id
                        const isEquipping = equipping === item.id
                        const accent = item.previewColor ?? "#6366f1"

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="rounded-[1.5rem] overflow-hidden flex flex-col"
                                style={{
                                    background: "linear-gradient(160deg, rgba(18,18,28,0.97), rgba(10,10,16,0.99))",
                                    border: item.equipped
                                        ? `1px solid ${accent}55`
                                        : "1px solid rgba(255,255,255,0.07)",
                                    boxShadow: item.equipped ? `0 0 24px ${accent}22` : "none",
                                }}
                            >
                                {/* Preview Area */}
                                <div className="relative h-32 flex items-center justify-center overflow-hidden"
                                    style={{ background: "rgba(0,0,0,0.3)" }}>
                                    {item.type === "AVATAR_FRAME" ? (
                                        /* Avatar frame preview */
                                        <div className="relative">
                                            <div className="absolute -inset-2 rounded-full animate-pulse" style={{ background: item.value, filter: "blur(10px)", opacity: 0.6 }} />
                                            <div className="absolute -inset-1 rounded-full p-[3px]" style={{ background: item.value }}>
                                                <div className="w-full h-full rounded-full" style={{ background: "rgba(8,8,14,1)" }} />
                                            </div>
                                            <div className={`${AVATAR_PREVIEW_SIZE} rounded-full bg-neutral-800 relative z-10 flex items-center justify-center`}>
                                                <User className="w-7 h-7 text-neutral-500" />
                                            </div>
                                        </div>
                                    ) : item.type === "PROFILE_BANNER" ? (
                                        /* Banner preview */
                                        <div className="absolute inset-0" style={{ background: item.value }} />
                                    ) : item.type === "USERNAME_DECORATION" ? (
                                        /* Username Decoration preview */
                                        <div className="absolute inset-0 flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.5)" }}>
                                            <span className={`text-xl font-black rounded px-3 py-1 ${getDecorationClass(item.name)}`} style={(() => { try { return JSON.parse(item.value) } catch { return {} } })()}>
                                                Memories
                                            </span>
                                        </div>
                                    ) : (
                                        /* Card theme preview */
                                        (() => {
                                            if (item.type === "MEMORY_STICKER") {
                                                let cfg: StickerConfig | null = null
                                                try { cfg = JSON.parse(item.value) } catch { }
                                                return (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        {cfg ? (
                                                            <div style={{ transform: `rotate(${cfg.defaultRotation ?? 0}deg)` }}>
                                                                <StickerRenderer config={cfg} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl" style={{ background: accent }} />
                                                        )}
                                                    </div>
                                                )
                                            }
                                            const t = (() => { try { return JSON.parse(item.value) } catch { return null } })()
                                            return (
                                                <div className="absolute inset-0 flex items-center justify-center p-3">
                                                    <div
                                                        className="w-full h-full rounded-lg overflow-hidden flex flex-col"
                                                        style={{
                                                            background: t?.background ?? "#1a1a1a",
                                                            border: t?.border ?? "1px solid #333",
                                                            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                                                        }}
                                                    >
                                                        {/* Mini photo placeholder */}
                                                        <div className="h-12 w-full" style={{ background: "rgba(0,0,0,0.3)", filter: t?.imageFilter }}>
                                                            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(100,100,120,0.3), rgba(60,60,80,0.2))" }} />
                                                        </div>
                                                        {/* Mini content */}
                                                        <div className="p-2 flex-1 flex flex-col gap-1">
                                                            <div className="h-1.5 rounded-full w-3/4" style={{ background: t?.titleColor ?? "#fff", opacity: 0.7 }} />
                                                            <div className="h-1 rounded-full w-full" style={{ background: t?.storyColor ?? "#888", opacity: 0.5 }} />
                                                            <div className="h-1 rounded-full w-2/3" style={{ background: t?.storyColor ?? "#888", opacity: 0.4 }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()
                                    )}
                                    {/* Type badge */}
                                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                                        style={{ background: "rgba(0,0,0,0.65)", color: accent, backdropFilter: "blur(8px)" }}>
                                        <TypeIcon className="w-3 h-3" />
                                        {TYPE_LABELS[item.type]}
                                    </div>
                                    {/* Equipped badge */}
                                    {item.equipped && (
                                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                                            style={{ background: "rgba(0,0,0,0.65)", color: "#4ade80", backdropFilter: "blur(8px)" }}>
                                            <CheckCircle2 className="w-3 h-3" />
                                            Dipakai
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col gap-3">
                                    <div>
                                        <h3 className="font-bold text-white text-sm leading-tight">{item.name}</h3>
                                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.description}</p>
                                    </div>

                                    {/* Price */}
                                    {!item.owned && (
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-black text-amber-400">{formatPoints(item.price)}</span>
                                            <span className="text-xs text-neutral-600">poin</span>
                                        </div>
                                    )}

                                    {/* Action button */}
                                    <div className="mt-auto flex gap-2">
                                        <button
                                            onClick={() => setPreviewItem(item)}
                                            className="px-4 py-2.5 rounded-xl border flex items-center justify-center transition-all hover:bg-white/10 shrink-0 group/preview"
                                            style={{
                                                background: "rgba(255,255,255,0.04)",
                                                border: "1px solid rgba(255,255,255,0.08)"
                                            }}
                                            title="Lihat Preview"
                                        >
                                            <Eye className="w-4 h-4 text-white/80 group-hover/preview:text-white transition-colors" />
                                        </button>
                                        <div className="flex-1">
                                            {!item.owned ? (
                                                <button
                                                    onClick={() => handlePurchase(item)}
                                                    disabled={isBuying || points < item.price}
                                                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                                >
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }} />
                                                    <span className="relative flex items-center gap-1.5 text-white">
                                                        {isBuying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                                                        {isBuying ? "Membeli..." : points < item.price ? "Poin kurang" : "Beli Sekarang"}
                                                    </span>
                                                </button>
                                            ) : item.type === "MEMORY_STICKER" ? (
                                                /* Stiker tidak perlu tombol Pakai — ditempel langsung di halaman kenangan */
                                                <div
                                                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                                                    style={{
                                                        background: "rgba(74,222,128,0.06)",
                                                        border: "1px solid rgba(74,222,128,0.2)",
                                                        color: "#4ade80",
                                                    }}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Dimiliki
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEquip(item)}
                                                    disabled={isEquipping}
                                                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 relative overflow-hidden group"
                                                    style={{
                                                        background: item.equipped
                                                            ? "rgba(74,222,128,0.08)"
                                                            : "rgba(255,255,255,0.04)",
                                                        border: item.equipped
                                                            ? "1px solid rgba(74,222,128,0.3)"
                                                            : "1px solid rgba(255,255,255,0.08)",
                                                        color: item.equipped ? "#4ade80" : "#9ca3af",
                                                    }}
                                                >
                                                    {isEquipping ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : item.equipped ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5" /> Sedang Dipakai</>
                                                    ) : (
                                                        <><Sparkles className="w-3.5 h-3.5" /> Pakai</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingBag className="w-10 h-10 text-neutral-700 mb-3" />
                    <p className="text-neutral-500 text-sm">Belum ada item di kategori ini.</p>
                </div>
            )}

            {/* Realtime Modal Preview */}
            <AnimatePresence>
                {previewItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        onClick={() => setPreviewItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setPreviewItem(null)}
                                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 text-center relative z-10" style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.05), transparent)" }}>
                                <h2 className="text-2xl font-black text-white">{previewItem.name}</h2>
                                <p className="text-sm text-neutral-400 mt-1">{previewItem.description}</p>
                            </div>

                            {/* Big Preview Area */}
                            <div className="relative p-10 flex items-center justify-center min-h-[300px] overflow-hidden bg-neutral-900/50">
                                {previewItem.type === "AVATAR_FRAME" ? (
                                    <div className="relative">
                                        <div className="absolute -inset-4 rounded-full animate-pulse" style={{ background: previewItem.value, filter: "blur(20px)", opacity: 0.5 }} />
                                        <div className="absolute -inset-1.5 rounded-full p-[5px]" style={{ background: previewItem.value }}>
                                            <div className="w-full h-full rounded-full" style={{ background: "rgba(8,8,14,1)" }} />
                                        </div>
                                        <div className="w-32 h-32 rounded-full bg-neutral-800 relative z-10 flex items-center justify-center overflow-hidden">
                                            {session?.user?.image ? (
                                                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-10 h-10 text-neutral-500" />
                                            )}
                                        </div>
                                    </div>
                                ) : previewItem.type === "PROFILE_BANNER" ? (
                                    <div className="absolute inset-0 w-full h-full">
                                        <div className="absolute inset-0 z-0" style={{ background: previewItem.value }} />
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-black/20">
                                            <div className="w-20 h-20 rounded-full mb-3 border-[3px] border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
                                                {session?.user?.image ? (
                                                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : <User className="w-full h-full p-4 bg-neutral-800 text-neutral-400" />}
                                            </div>
                                            <h3 className="text-xl font-bold text-white shadow-black drop-shadow-lg">{session?.user?.name || "Username"}</h3>
                                        </div>
                                    </div>
                                ) : previewItem.type === "USERNAME_DECORATION" ? (
                                    <div className="text-center z-10 p-8 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/5">
                                        <span className={`text-4xl sm:text-5xl font-black rounded px-6 py-2 ${getDecorationClass(previewItem.name)} tracking-tight`} style={(() => { try { return JSON.parse(previewItem.value) } catch { return {} } })()}>
                                            {session?.user?.name || "Username"}
                                        </span>
                                    </div>
                                ) : previewItem.type === "MEMORY_STICKER" ? (
                                    (() => {
                                        let cfg: StickerConfig | null = null
                                        try { cfg = JSON.parse(previewItem.value) } catch { }
                                        return (
                                            <div className="flex flex-col items-center gap-6 z-10">
                                                {cfg ? (
                                                    <div style={{ transform: `rotate(${cfg.defaultRotation ?? 0}deg)`, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.4))" }}>
                                                        <StickerRenderer config={cfg} />
                                                    </div>
                                                ) : (
                                                    <div className="w-24 h-24 rounded-2xl" style={{ background: previewItem.previewColor ?? "#6366f1" }} />
                                                )}
                                                <p className="text-sm text-neutral-400 text-center max-w-[200px]">
                                                    Stiker ini bisa ditempel di atas foto kenangan kamu
                                                </p>
                                            </div>
                                        )
                                    })()
                                ) : (
                                    (() => {
                                        const t = (() => { try { return JSON.parse(previewItem.value) } catch { return null } })()
                                        return (
                                            <div className="w-full mx-auto rounded-[1rem] overflow-hidden flex flex-col z-10"
                                                style={{
                                                    background: t?.background ?? "#1a1a1a",
                                                    border: t?.border ?? "1px solid #333",
                                                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                                                }}
                                            >
                                                <div className="w-full aspect-[4/3]" style={{ background: "rgba(0,0,0,0.3)", filter: t?.imageFilter }}>
                                                    <div className="w-full h-full" style={{ background: "linear-gradient(135deg, rgba(80,80,100,0.5), rgba(40,40,60,0.5))" }} />
                                                </div>
                                                <div className={`flex flex-col gap-2 ${t?.contentPadding ?? "p-4"}`}>
                                                    <div className="h-5 rounded-full w-3/4 mb-1" style={{ background: t?.titleColor ?? "#fff" }} />
                                                    <div className="h-2 rounded-full w-full opacity-60 mt-2" style={{ background: t?.storyColor ?? "#888" }} />
                                                    <div className="h-2 rounded-full w-5/6 opacity-60" style={{ background: t?.storyColor ?? "#888" }} />
                                                    <div className="h-2 rounded-full w-2/3 opacity-60" style={{ background: t?.storyColor ?? "#888" }} />
                                                </div>
                                            </div>
                                        )
                                    })()
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Points Balance */}
            <div
                className="fixed top-24 right-4 sm:top-24 sm:right-8 z-40 flex items-center gap-2 px-1.5 py-1.5 pr-4 rounded-full shadow-lg backdrop-blur-md cursor-default"
                style={{
                    background: "rgba(10,10,15,0.75)",
                    border: "1px solid rgba(251,191,36,0.3)",
                    boxShadow: "0 4px 20px -5px rgba(245,158,11,0.3)"
                }}
            >
                <div className="flex items-center justify-center p-1.5 rounded-full bg-amber-400/10">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex flex-col justify-center">
                    <p className="text-sm font-black text-amber-400 leading-[1]">{formatPoints(points)}</p>
                    <p className="text-[8px] text-amber-500/80 font-black uppercase tracking-widest mt-0.5 leading-[1]">Points</p>
                </div>
            </div>
        </div>
    )
}