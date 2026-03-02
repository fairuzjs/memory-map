"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Loader2, User } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Reactions } from "@/components/memories/Reactions"
import { Comments } from "@/components/memories/Comments"
import { ReportDialog } from "@/components/ui/ReportDialog"

export default function MemoryDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [memory, setMemory] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetch(`/api/memories/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Not found")
                return res.json()
            })
            .then(data => {
                setMemory(data)
                setLoading(false)
            })
            .catch(() => {
                toast.error("Memory not found")
                router.push("/memories")
            })
    }, [id, router])

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this memory?")) return
        setIsDeleting(true)

        try {
            const res = await fetch(`/api/memories/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed")

            toast.success("Memory deleted")
            router.push("/memories")
        } catch {
            toast.error("Failed to delete")
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    const isOwner = session?.user?.id === memory?.userId || session?.user?.role === "ADMIN"

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 w-full">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            <article className="bg-neutral-900/50 rounded-3xl border border-neutral-800 overflow-hidden backdrop-blur-xl">
                {memory.photos?.length > 0 && (
                    <div className="w-full h-64 sm:h-96" style={{ background: `url(${memory.photos[0].url}) center/cover no-repeat` }} />
                )}

                <div className="p-6 md:p-10">
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold font-[Outfit] text-white leading-tight">
                                {memory.title}
                            </h1>

                            <div className="flex items-center gap-4 mt-4 text-sm text-neutral-400 font-medium border-l-[3px] border-indigo-500 pl-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(memory.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                {memory.locationName && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {memory.locationName}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isOwner && (
                            <div className="flex items-center gap-2">
                                <Link href={`/memories/${id}/edit`}>
                                    <Button variant="outline" className="gap-2 text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/20">
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="gap-2 text-red-400 border-red-900/50 hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        )}
                        {!isOwner && session?.user && (
                            <div className="flex items-center gap-2">
                                <ReportDialog memoryId={memory.id} />
                            </div>
                        )}
                    </div>

                    {/* Author — clickable to profile */}
                    <Link
                        href={`/profile/${memory.user.id}`}
                        className="flex items-center gap-3 mb-10 pb-6 border-b border-neutral-800/50 group w-fit"
                    >
                        <div className="relative">
                            <img
                                src={memory.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memory.user.id}`}
                                alt={memory.user.name}
                                className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-800 group-hover:border-indigo-500 transition-colors object-cover"
                            />
                        </div>
                        <div>
                            <p className="font-medium text-neutral-200 group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                                {memory.user.name}
                                <User className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                            </p>
                            <p className="text-xs text-neutral-500">{memory.isPublic ? "Publicly Shared" : "Private Memory"}</p>
                        </div>
                    </Link>

                    <div className="prose prose-invert max-w-none font-sans text-neutral-300 leading-relaxed space-y-4 text-lg mb-8">
                        {memory.story.split("\n").map((para: string, i: number) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>

                    <div className="mb-12 border-t border-b border-neutral-800/50 py-4 mt-8">
                        <Reactions memoryId={memory.id} initialReactions={memory.reactions || []} />
                    </div>

                    {memory.photos?.length > 1 && (
                        <div className="mb-12 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {memory.photos.slice(1).map((photo: any) => (
                                <img key={photo.id} src={photo.url} alt="" className="w-full aspect-square object-cover rounded-2xl border border-neutral-800" />
                            ))}
                        </div>
                    )}

                    <Comments memoryId={memory.id} initialComments={memory.comments || []} />
                </div>
            </article>
        </div>
    )
}
