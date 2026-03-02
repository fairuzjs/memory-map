"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Plus, Loader2 } from "lucide-react"
import { MemoryCard } from "@/components/memories/MemoryCard"
import { motion } from "framer-motion"

export default function MemoriesPage() {
    const { data: session, status } = useSession()
    const [memories, setMemories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") return

        fetch("/api/memories")
            .then(res => res.json())
            .then(data => {
                // filter user's own memories
                const myMemories = data.filter((m: any) => m.userId === session?.user?.id)
                setMemories(myMemories)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [session, status])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-[Outfit]">My Memories</h1>
                    <p className="text-neutral-400 mt-1">Look back at your journey.</p>
                </div>
                <Link
                    href="/memories/create"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Memory</span>
                </Link>
            </div>

            {memories.length === 0 ? (
                <div className="border border-neutral-800 rounded-2xl p-12 bg-neutral-900/50 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 transform -rotate-12">
                        <span className="text-3xl rotate-12">🌟</span>
                    </div>
                    <h2 className="text-xl text-neutral-300 font-[Outfit]">No memories yet</h2>
                    <p className="text-neutral-500 mt-2 max-w-sm">Every great journey starts with a single step. Start documenting your life today.</p>
                    <Link
                        href="/memories/create"
                        className="mt-6 font-medium text-indigo-400 hover:text-indigo-300"
                    >
                        Create your first memory →
                    </Link>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative"
                >
                    {memories.map((memory, i) => (
                        <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative isolate"
                        >
                            <MemoryCard memory={memory} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
