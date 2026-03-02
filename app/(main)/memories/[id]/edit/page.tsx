"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memorySchema, type MemoryInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { EmotionPicker } from "@/components/memories/EmotionPicker"
import { PhotoUploader } from "@/components/memories/PhotoUploader"
import { Loader2 } from "lucide-react"

export default function EditMemoryPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors }
    } = useForm<MemoryInput>({
        resolver: zodResolver(memorySchema),
    })

    useEffect(() => {
        fetch(`/api/memories/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Not found")
                return res.json()
            })
            .then(data => {
                if (session?.user?.id && data.userId !== session.user.id) {
                    toast.error("Unauthorized")
                    return router.push("/memories")
                }

                reset({
                    title: data.title,
                    story: data.story,
                    emotion: data.emotion,
                    isPublic: data.isPublic,
                    date: new Date(data.date).toISOString().split("T")[0],
                    latitude: data.latitude,
                    longitude: data.longitude,
                    photos: data.photos?.map((p: any) => p.url) || [],
                    tags: data.tags?.map((t: any) => t.name) || [],
                })
                setLoading(false)
            })
            .catch(() => {
                toast.error("Memory not found")
                router.push("/memories")
            })
    }, [id, router, session, reset])

    async function onSubmit(data: MemoryInput) {
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/memories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) throw new Error("Update failed")

            toast.success("Memory updated!")
            router.push(`/memories/${id}`)
        } catch {
            toast.error("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 w-full">
            <h1 className="text-3xl font-bold font-[Outfit] mb-2">Edit Memory</h1>
            <p className="text-neutral-400 mb-8">Update the details of your memory.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">The Story</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                            <Input {...register("title")} disabled={isSubmitting} />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Story</label>
                            <textarea
                                {...register("story")}
                                className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                disabled={isSubmitting}
                            />
                            {errors.story && <p className="text-red-500 text-sm mt-1">{errors.story.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Date</label>
                            <Input type="date" {...register("date")} disabled={isSubmitting} />
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">How did you feel?</h2>
                    <Controller
                        control={control}
                        name="emotion"
                        render={({ field }) => <EmotionPicker value={field.value} onChange={field.onChange} />}
                    />
                </div>

                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">Add or Remove Photos</h2>
                    <Controller
                        control={control}
                        name="photos"
                        render={({ field }) => <PhotoUploader photos={field.value || []} onChange={field.onChange} />}
                    />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
