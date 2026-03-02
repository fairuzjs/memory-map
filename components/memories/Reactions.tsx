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
        <div className="flex items-center gap-2 flex-wrap">
            {counts.map((rt) => (
                <button
                    key={rt.type}
                    onClick={() => handleReact(rt.type)}
                    disabled={loading}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                        rt.hasReacted
                            ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                            : "bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                    )}
                >
                    <span>{rt.icon}</span>
                    {rt.count > 0 && <span>{rt.count}</span>}
                </button>
            ))}
            <div className="ml-auto text-sm text-neutral-500">{total} {total === 1 ? 'reaction' : 'reactions'}</div>
        </div>
    )
}
