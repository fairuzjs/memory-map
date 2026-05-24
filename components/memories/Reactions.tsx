"use client"

import { useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const REACTION_TYPES = [
    { type: "LOVE", icon: "💖", label: "Love" },
    { type: "WOW", icon: "😲", label: "Wow" },
    { type: "SAD", icon: "😢", label: "Sad" },
    { type: "LAUGH", icon: "😂", label: "Laugh" },
]

export function Reactions({ memoryId, initialReactions }: { memoryId: string, initialReactions: any[] }) {
    const { data: session } = useSession()
    const [reactions, setReactions] = useState(initialReactions || [])
    // Per-button lock: only the button being processed is disabled
    const [pendingType, setPendingType] = useState<string | null>(null)
    // Guard against rapid repeated clicks on the same type (debounce)
    const pendingRef = useRef<string | null>(null)

    const handleReact = useCallback(async (type: string) => {
        const userId = session?.user?.id
        if (!userId) {
            toast.error("Please login to react")
            return
        }

        // Per-button debounce guard: ignore if this type is already in-flight
        if (pendingRef.current === type) return
        pendingRef.current = type
        setPendingType(type)

        // 1. Snapshot previous state for rollback (will be populated synchronously)
        let previousReactions: any[] = []

        // 2. Optimistic update — predict what the server will do
        setReactions(prev => {
            previousReactions = prev
            const existingIdx = prev.findIndex(r => r.userId === userId)
            let optimisticReactions = [...prev]

            if (existingIdx !== -1 && prev[existingIdx].type === type) {
                // Same type clicked → server will remove
                optimisticReactions.splice(existingIdx, 1)
            } else if (existingIdx !== -1) {
                // Different type → server will update
                optimisticReactions[existingIdx] = { ...optimisticReactions[existingIdx], type }
            } else {
                // No existing reaction → server will add
                optimisticReactions.push({ userId, type, id: `temp-${Date.now()}`, memoryId })
            }
            return optimisticReactions
        })

        // 3. Fire the request
        try {
            const res = await fetch(`/api/memories/${memoryId}/reactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            // 4. Reconcile — replace optimistic state with server truth
            setReactions(prev => {
                let reconciled = [...prev]
                if (data.action === "removed") {
                    reconciled = reconciled.filter(r => r.userId !== userId)
                } else if (data.action === "added" && data.reaction) {
                    // Replace temp entry with server data
                    const tempIdx = reconciled.findIndex(r => r.userId === userId && String(r.id).startsWith("temp-"))
                    if (tempIdx !== -1) {
                        reconciled[tempIdx] = data.reaction
                    } else if (!reconciled.some(r => r.id === data.reaction.id)) {
                        reconciled.push(data.reaction)
                    }
                } else if (data.action === "updated" && data.reaction) {
                    const idx = reconciled.findIndex(r => r.userId === userId)
                    if (idx !== -1) reconciled[idx] = data.reaction
                }
                return reconciled
            })
        } catch (e: any) {
            // 5. Rollback on error using the snapshot captured synchronously
            setReactions(previousReactions)
            toast.error(e.message || "Gagal memberikan reaksi")
        } finally {
            pendingRef.current = null
            setPendingType(null)
        }
    }, [session?.user?.id, memoryId])

    // Aggregate counts
    const counts = REACTION_TYPES.map(rt => ({
        ...rt,
        count: reactions.filter(r => r.type === rt.type).length,
        hasReacted: reactions.some(r => r.type === rt.type && r.userId === session?.user?.id)
    }))

    const total = reactions.length

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {counts.map((rt) => (
                <motion.button
                    key={rt.type}
                    whileHover={{ scale: 1.08, rotate: 1.5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReact(rt.type)}
                    disabled={pendingType === rt.type}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 border-[3px] border-black font-black text-[14px] uppercase transition-all shadow-[2px_2px_0_#000]",
                        rt.hasReacted
                            ? "bg-[#FF00FF] text-white translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0_#000]"
                            : "bg-[#E5E5E5] text-black hover:bg-[#00FFFF]"
                    )}
                >
                    <span className="text-[16px] leading-none">{rt.icon}</span>
                    {rt.count > 0 && <span>{rt.count}</span>}
                </motion.button>
            ))}
            <div className="ml-auto text-[12px] font-black uppercase text-black bg-[#FFFF00] border-[2px] border-black px-2 py-1 shadow-[2px_2px_0_#000]">
                {total} {total === 1 ? 'reaction' : 'reactions'}
            </div>
        </div>
    )
}
