"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
// Menggunakan alias @/ untuk konsistensi dengan struktur proyek Next.js
import { memorySchema, type MemoryInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { EmotionPicker } from "@/components/memories/EmotionPicker"
import { PhotoUploader } from "@/components/memories/PhotoUploader"
import { Loader2, BookText, MapPin, Smile, ImagePlus, Globe, Users } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

// Memuat LocationPicker secara dinamis untuk menghindari error pada sisi server (SSR)
// karena pustaka peta seperti Leaflet memerlukan akses ke objek 'window'.
const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-neutral-900/50 animate-pulse rounded-2xl border border-white/5 flex items-center justify-center">
            <span className="text-neutral-500 text-sm italic">Memuat peta...</span>
        </div>
    )
})

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
        if (!id) return

        const fetchMemory = async () => {
            try {
                const res = await fetch(`/api/memories/${id}`)
                if (!res.ok) throw new Error("Data tidak ditemukan")
                const data = await res.json()

                // Validasi kepemilikan: Pastikan hanya pemilik yang bisa mengedit
                if (session?.user?.id && data.userId !== session.user.id) {
                    toast.error("Anda tidak memiliki izin untuk mengedit kenangan ini")
                    router.push("/memories")
                    return
                }

                // Mengisi form dengan data dari database
                reset({
                    title: data.title,
                    story: data.story,
                    emotion: data.emotion,
                    isPublic: data.isPublic,
                    date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
                    latitude: data.latitude,
                    longitude: data.longitude,
                    locationName: data.locationName || "",
                    photos: data.photos?.map((p: any) => p.url) || [],
                    tags: data.tags?.map((t: any) => t.name) || [],
                })
                setLoading(false)
            } catch (error) {
                toast.error("Gagal memuat data kenangan")
                router.push("/memories")
            }
        }

        // Jalankan fetch data saat sesi tersedia
        if (session) {
            fetchMemory()
        }
    }, [id, router, session, reset])

    const onSubmit = async (data: MemoryInput) => {
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/memories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) throw new Error("Gagal memperbarui")

            toast.success("Kenangan berhasil diperbarui!")
            router.push(`/memories/${id}`)
        } catch (error) {
            toast.error("Terjadi kesalahan saat menyimpan perubahan")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 w-full relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">

                {/* Page Header */}
                <div className="mb-10 text-center max-w-4xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold font-[Outfit] mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 via-indigo-100 to-indigo-300">
                        Edit Kenangan
                    </h1>
                    <p className="text-neutral-300 text-md">
                        Sesuaikan detail momen berharga Anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                        {/* ── LEFT COLUMN ──────────────────────────── */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* The Story */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-xl">
                                        <BookText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-semibold font-[Outfit] text-white">Momen</h2>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Judul</label>
                                        <Input
                                            {...register("title")}
                                            placeholder="A Walk to Remember..."
                                            className="bg-black/20 border-white/10 focus:border-indigo-500/50 transition-colors text-base"
                                            disabled={isSubmitting}
                                        />
                                        {errors.title && <p className="text-red-400 text-sm mt-1.5">{errors.title.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Cerita</label>
                                        <textarea
                                            {...register("story")}
                                            className="w-full min-h-[160px] bg-black/20 border border-white/10 rounded-xl p-4 text-base focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-neutral-600 text-neutral-200"
                                            placeholder="Ceritakan momen Anda..."
                                            disabled={isSubmitting}
                                        />
                                        {errors.story && <p className="text-red-400 text-sm mt-1.5">{errors.story.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Tanggal</label>
                                        <Input
                                            type="date"
                                            {...register("date")}
                                            className="bg-black/20 border-white/10 focus:border-indigo-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                                            disabled={isSubmitting}
                                        />
                                        {errors.date && <p className="text-red-400 text-sm mt-1.5">{errors.date.message}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Emotion */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 sm:p-3 bg-rose-500/10 rounded-xl">
                                        <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-semibold font-[Outfit] text-white">Perasaan</h2>
                                </div>
                                <Controller
                                    control={control}
                                    name="emotion"
                                    render={({ field }) => <EmotionPicker value={field.value} onChange={field.onChange} />}
                                />
                            </div>

                            {/* Photos */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl">
                                        <ImagePlus className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-semibold font-[Outfit] text-white">Galeri Foto</h2>
                                </div>
                                <Controller
                                    control={control}
                                    name="photos"
                                    render={({ field }) => <PhotoUploader photos={field.value || []} onChange={field.onChange} />}
                                />
                            </div>

                        </div>

                        {/* ── RIGHT COLUMN ──────────────────────────── */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* Location */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08] relative z-20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 sm:p-3 bg-amber-500/10 rounded-xl">
                                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-semibold font-[Outfit] text-white">Lokasi</h2>
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-white/10">
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
                            </div>

                            {/* Settings */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08] flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-violet-500/10 rounded-xl hidden sm:block">
                                        <Globe className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-medium font-[Outfit] text-white">Kenangan Publik</h2>
                                        <p className="text-sm text-neutral-400 mt-1">Izinkan orang lain melihat kenangan ini.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register("isPublic")} className="sr-only peer" />
                                    <div className="w-12 h-7 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500 border border-white/10"></div>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto hover:bg-white/5 rounded-xl px-6"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 shadow-lg shadow-indigo-500/25 transition-all"
                                >
                                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                            </div>

                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}