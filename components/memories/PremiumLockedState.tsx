"use client"

import { useState } from "react"
import { Lock, Sparkles, Star, Loader2, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import Link from "next/link"

interface PremiumLockedStateProps {
    featureName: string
    price: number
    userPoints: number
    onUnlocked: () => void
}

export function PremiumLockedState({ featureName, price, userPoints, onUnlocked }: PremiumLockedStateProps) {
    const [isPurchasing, setIsPurchasing] = useState(false)
    const canAfford = userPoints >= price

    const handleQuickPurchase = async () => {
        if (!canAfford) return
        setIsPurchasing(true)
        try {
            // First find the shop item for spotify_integration
            const shopRes = await fetch("/api/shop")
            if (!shopRes.ok) throw new Error("Gagal memuat data toko")
            const shopData = await shopRes.json()
            const spotifyItem = shopData.items?.find(
                (item: any) => item.type === "PREMIUM_FEATURE" && item.value === "spotify_integration"
            )
            if (!spotifyItem) throw new Error("Item tidak ditemukan")
            if (spotifyItem.owned) {
                // Already owned, just unlock
                onUnlocked()
                return
            }

            // Purchase it
            const purchaseRes = await fetch("/api/shop/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: spotifyItem.id }),
            })
            const purchaseData = await purchaseRes.json()
            if (!purchaseRes.ok) {
                if (purchaseData.error === "Insufficient points") {
                    toast.error("Poin tidak cukup! Silakan top up terlebih dahulu.")
                } else if (purchaseData.error === "Item already owned") {
                    onUnlocked()
                    return
                } else {
                    throw new Error(purchaseData.error || "Gagal membeli")
                }
                return
            }

            toast.success("🎉 Fitur Spotify berhasil dibuka!")
            onUnlocked()
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setIsPurchasing(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col items-center justify-center text-center py-6 px-4 overflow-hidden"
        >
            {/* Blur/glow background effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1DB954]/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#1DB954]/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Lock icon with pulse */}
            <div className="relative mb-4">
                <div className="absolute inset-0 bg-[#1DB954]/20 rounded-2xl blur-xl animate-pulse" />
                <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, rgba(29,185,84,0.15), rgba(29,185,84,0.05))",
                        border: "1px solid rgba(29,185,84,0.25)",
                        boxShadow: "0 4px 20px rgba(29,185,84,0.15)",
                    }}
                >
                    <Lock className="w-6 h-6 text-[#1DB954]" />
                </div>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-white mb-1 relative z-10">
                Fitur Premium
            </h3>
            <p className="text-xs text-neutral-400 max-w-[220px] leading-relaxed mb-4 relative z-10">
                Buka akses {featureName} untuk menambahkan lagu langsung dari Spotify ke kenangan Anda.
            </p>

            {/* Price tag */}
            <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 relative z-10"
                style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                }}
            >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-black text-amber-400">{price.toLocaleString("id-ID")}</span>
                <span className="text-[10px] text-amber-500/70">poin</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 w-full max-w-[220px] relative z-10">
                {canAfford ? (
                    <button
                        onClick={handleQuickPurchase}
                        disabled={isPurchasing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 relative overflow-hidden group"
                        style={{
                            background: "linear-gradient(135deg, #1DB954, #1ed760)",
                            boxShadow: "0 4px 16px rgba(29,185,84,0.3)",
                        }}
                    >
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "linear-gradient(135deg, #1ed760, #2ddf6c)" }}
                        />
                        <span className="relative flex items-center gap-2 text-white">
                            {isPurchasing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {isPurchasing ? "Membuka..." : "Buka Sekarang"}
                        </span>
                    </button>
                ) : (
                    <>
                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed"
                            style={{
                                background: "rgba(29,185,84,0.15)",
                                border: "1px solid rgba(29,185,84,0.2)",
                                color: "#1DB954",
                            }}
                        >
                            <Lock className="w-4 h-4" />
                            Poin Tidak Cukup
                        </button>
                        <Link
                            href="/topup"
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all hover:bg-amber-500/15"
                            style={{
                                background: "rgba(251,191,36,0.08)",
                                border: "1px solid rgba(251,191,36,0.2)",
                                color: "#fbbf24",
                            }}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Top Up Poin
                        </Link>
                    </>
                )}
            </div>

            {/* Current points info */}
            <p className="text-[10px] text-neutral-600 mt-3 relative z-10">
                Poin Anda saat ini: <span className="text-amber-500 font-bold">{userPoints.toLocaleString("id-ID")}</span>
            </p>
        </motion.div>
    )
}
