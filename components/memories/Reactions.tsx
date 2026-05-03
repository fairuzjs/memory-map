"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

const REACTION_TYPES = [
    { type: "LOVE", icon: "💖", label: "Love" },
    { type: "WOW", icon: "😲", label: "Wow" },
    { type: "SAD", icon: "😢", label: "Sad" },
    { type: "LAUGH", icon: "😂", label: "Laugh" },
]

export function Reactions({ memoryId, initialReactions }: { memoryId: string, initialReactions: any[] }) {
    const { data: session } = useSession()
    const [reactions, setReactions] = useState(initialReactions || [])
    const [loading, setLoading] = useState(false)

    const handleReact = async (type: string) => {
        if (!session) {
            toast.error("Please login to react")
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/memories/${memoryId}/reactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            // Optimistic update
            const userId = session.user?.id
            let newReactions = [...reactions]

            if (data.action === "removed") {
                newReactions = newReactions.filter(r => r.userId !== userId)
            } else if (data.action === "added") {
                newReactions.push(data.reaction)
            } else if (data.action === "updated") {
                const idx = newReactions.findIndex(r => r.userId === userId)
                if (idx !== -1) newReactions[idx] = data.reaction
            }

            setReactions(newReactions)
        } catch (e: any) {
            toast.error(e.message || "Failed to react")
        } finally {
            setLoading(false)
        }
    }

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
                <button
                    key={rt.type}
                    onClick={() => handleReact(rt.type)}
                    disabled={loading}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 border-[3px] border-black font-black text-[14px] uppercase transition-all shadow-[2px_2px_0_#000]",
                        rt.hasReacted
                            ? "bg-[#FF00FF] text-white translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0_#000]"
                            : "bg-[#E5E5E5] text-black hover:bg-[#00FFFF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#000]"
                    )}
                >
                    <span className="text-[16px] leading-none">{rt.icon}</span>
                    {rt.count > 0 && <span>{rt.count}</span>}
                </button>
            ))}
            <div className="ml-auto text-[12px] font-black uppercase text-black bg-[#FFFF00] border-[2px] border-black px-2 py-1 shadow-[2px_2px_0_#000]">
                {total} {total === 1 ? 'reaction' : 'reactions'}
            </div>
        </div>
    )
}
