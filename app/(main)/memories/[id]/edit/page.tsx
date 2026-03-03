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
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// Memuat LocationPicker secara dinamis untuk menghindari error pada sisi server (SSR)
// karena pustaka peta seperti Leaflet memerlukan akses ke objek 'window'.
const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-neutral-900 animate-pulse rounded-2xl border border-neutral-800 flex items-center justify-center">
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
        <div className="max-w-5xl mx-auto px-4 py-8 w-full">
            <h1 className="text-3xl font-bold font-[Outfit] mb-2">Edit Kenangan</h1>
            <p className="text-neutral-400 mb-8">Sesuaikan detail momen berharga Anda.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Bagian Cerita dan Informasi Dasar */}
                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">Momen</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Judul</label>
                            <Input {...register("title")} disabled={isSubmitting} />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Cerita</label>
                            <textarea
                                {...register("story")}
                                className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="Ceritakan momen Anda..."
                                disabled={isSubmitting}
                            />
                            {errors.story && <p className="text-red-500 text-sm mt-1">{errors.story.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Tanggal</label>
                            <Input type="date" {...register("date")} disabled={isSubmitting} />
                        </div>
                    </div>
                </div>

                {/* Bagian Lokasi (Sama dengan halaman Create) */}
                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">Lokasi</h2>
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

                {/* Bagian Emosi */}
                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">Perasaan</h2>
                    <Controller
                        control={control}
                        name="emotion"
                        render={({ field }) => (
                            <EmotionPicker value={field.value} onChange={field.onChange} />
                        )}
                    />
                </div>

                {/* Bagian Galeri Foto */}
                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                    <h2 className="text-xl font-medium font-[Outfit] mb-4">Galeri Foto</h2>
                    <Controller
                        control={control}
                        name="photos"
                        render={({ field }) => (
                            <PhotoUploader photos={field.value || []} onChange={field.onChange} />
                        )}
                    />
                </div>

                {/* Pengaturan Privasi */}
                <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-medium font-[Outfit]">Kenangan Publik</h2>
                        <p className="text-sm text-neutral-400">Izinkan orang lain melihat kenangan ini di peta global.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register("isPublic")} className="sr-only peer" />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {/* Tombol Navigasi */}
                <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                </div>
            </form>
        </div>
    )
}