"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memorySchema, type MemoryInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { EmotionPicker } from "@/components/memories/EmotionPicker"
import { PhotoUploader } from "@/components/memories/PhotoUploader"
import { motion } from "framer-motion"

import dynamic from "next/dynamic"

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-neutral-900 animate-pulse rounded-2xl border border-neutral-800" />
})

export default function CreateMemoryPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors }
    } = useForm<MemoryInput>({
        resolver: zodResolver(memorySchema),
        defaultValues: {
            emotion: "HAPPY",
            isPublic: true,
            photos: [],
            tags: [],
            latitude: -2.5489,
            longitude: 118.0149,
            locationName: "Indonesia",
            date: new Date().toISOString().split("T")[0]
        }
    })

    // Helper inside onSubmit or use map coordinates directly provided by LocationPicker
    async function onSubmit(data: MemoryInput) {
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/memories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) throw new Error("Failed to create memory")

            toast.success("Memory created successfully!")
            router.push("/memories")
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold font-[Outfit] mb-2">Preserve a Memory</h1>
                <p className="text-neutral-400 mb-8">What special moment would you like to keep?</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                        <h2 className="text-xl font-medium font-[Outfit] mb-4">The Story</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                                <Input {...register("title")} placeholder="A Walk to Remember" disabled={isSubmitting} />
                                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Story</label>
                                <textarea
                                    {...register("story")}
                                    className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Tell us what happened..."
                                    disabled={isSubmitting}
                                />
                                {errors.story && <p className="text-red-500 text-sm mt-1">{errors.story.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Date</label>
                                <Input type="date" {...register("date")} disabled={isSubmitting} />
                                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                        <h2 className="text-xl font-medium font-[Outfit] mb-4">Where did it happen?</h2>
                        <Controller
                            control={control}
                            name="latitude"
                            render={({ field: latField }) => (
                                <Controller
                                    control={control}
                                    name="longitude"
                                    render={({ field: lngField }) => (
                                        <Controller
                                            control={control}
                                            name="locationName"
                                            render={({ field: nameField }) => (
                                                <LocationPicker
                                                    latitude={latField.value}
                                                    longitude={lngField.value}
                                                    locationName={nameField.value || ""}
                                                    onChange={(lat, lng, name) => {
                                                        latField.onChange(lat)
                                                        lngField.onChange(lng)
                                                        nameField.onChange(name)
                                                    }}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            )}
                        />
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
                        <h2 className="text-xl font-medium font-[Outfit] mb-4">Add Photos</h2>
                        <Controller
                            control={control}
                            name="photos"
                            render={({ field }) => <PhotoUploader photos={field.value || []} onChange={field.onChange} />}
                        />
                    </div>

                    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium font-[Outfit]">Public Memory</h2>
                            <p className="text-sm text-neutral-400">Allow others to see this memory on the global map.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" {...register("isPublic")} className="sr-only peer" />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Memory"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
