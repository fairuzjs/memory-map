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
import { MusicUploader } from "@/components/memories/MusicUploader"
import { SpotifySearch } from "@/components/memories/SpotifySearch"
import { PremiumLockedState } from "@/components/memories/PremiumLockedState"
import { CollaboratorPicker } from "@/components/memories/CollaboratorPicker"
import {
    Loader2, BookText, MapPin, Smile, ImagePlus, Globe, Users, Music,
    ArrowRight, ArrowLeft, Pencil, Save, ChevronRight, Crown
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

const STEPS = [
    { label: "Detail", icon: BookText, description: "Ceritakan momen Anda" },
    { label: "Media", icon: ImagePlus, description: "Tambahkan media & pengaturan" },
]

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
        scale: 0.98,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 80 : -80,
        opacity: 0,
        scale: 0.98,
    }),
}

export default function EditMemoryPage() {
    const { id } = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)
    const [musicTab, setMusicTab] = useState<"upload" | "spotify">("upload")
    const [hasSpotifyPremium, setHasSpotifyPremium] = useState(false)
    const [premiumPoints, setPremiumPoints] = useState(0)

    // Check premium feature access
    useEffect(() => {
        const checkPremium = async () => {
            try {
                const res = await fetch("/api/inventory/premium")
                if (res.ok) {
                    const data = await res.json()
                    setHasSpotifyPremium(data.features?.includes("spotify_integration") ?? false)
                    setPremiumPoints(data.points ?? 0)
                }
            } catch {}
        }
        checkPremium()
    }, [])

    const {
        register,
        handleSubmit,
        control,
        reset,
        trigger,
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
                    photos: data.photos?.map((p: any) => {
                        // Support migrating old URL-only string versus new JSON structure string from DB
                        try {
                            const parsed = JSON.parse(p.url)
                            return {
                                path: parsed.path,
                                bucket: parsed.bucket,
                                url: parsed.url,
                                previewUrl: parsed.url // fallback for preview UI
                            }
                        } catch {
                            // Legacy: p.url was just a flat url string
                            return {
                                path: p.url, // we don't know the exact path for old ones
                                bucket: data.isPublic ? "public_uploads" : "private_uploads",
                                url: p.url,
                                previewUrl: p.url
                            }
                        }
                    }) || [],
                    tags: data.tags?.map((t: any) => t.name) || [],
                    collaborators: data.collaborators?.map((c: any) => c.userId) || [],
                    audio: data.audioUrl ? {
                        url: data.audioUrl,
                        bucket: data.audioBucket || "",
                        path: data.audioPath || "",
                        startTime: data.audioStartTime || 0,
                        duration: data.audioDuration || 15,
                        fileName: data.audioFileName || "audio.mp3",
                    } : null,
                    spotifyTrackId: data.spotifyTrackId || null,
                })
                
                // Initialize music tab based on what's available
                if (data.spotifyTrackId) {
                    setMusicTab("spotify")
                } else {
                    setMusicTab("upload")
                }
                
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
            const formattedData = {
                ...data,
                photos: data.photos?.map((photo: any) =>
                    JSON.stringify({
                        path: photo.path,
                        bucket: photo.bucket,
                        url: photo.url || null
                    })
                ) || [],
                audio: data.audio || null,
                spotifyTrackId: data.spotifyTrackId || null,
            }

            const res = await fetch(`/api/memories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
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

    const handleNext = async () => {
        const valid = await trigger(["title", "story", "date"])
        if (!valid) {
            toast.error("Lengkapi detail momen terlebih dahulu")
            return
        }
        setDirection(1)
        setCurrentStep(1)
    }

    const handleBack = () => {
        setDirection(-1)
        setCurrentStep(0)
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    const isPublic = control._formValues.isPublic !== undefined ? control._formValues.isPublic : true

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">

                {/* Page Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold font-[Outfit] mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 via-indigo-100 to-indigo-300">
                        Edit Kenangan
                    </h1>
                    <p className="text-neutral-400 text-sm max-w-md mx-auto">
                        Sesuaikan detail momen berharga Anda.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === index
                        const isCompleted = currentStep > index
                        return (
                            <div key={index} className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (index < currentStep) {
                                            setDirection(-1)
                                            setCurrentStep(index)
                                        }
                                    }}
                                    className={`
                                        flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? "bg-indigo-500/15 border border-indigo-500/30 text-white shadow-lg shadow-indigo-500/10"
                                            : isCompleted
                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/15"
                                                : "bg-neutral-900/40 border border-white/5 text-neutral-500"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                        ${isActive
                                            ? "bg-indigo-500 text-white"
                                            : isCompleted
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-neutral-800 text-neutral-500"
                                        }
                                    `}>
                                        {isCompleted ? "✓" : index + 1}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-sm font-medium leading-tight">{step.label}</p>
                                        <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-indigo-300/70" : "text-neutral-600"}`}>
                                            {step.description}
                                        </p>
                                    </div>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <ChevronRight className={`w-4 h-4 ${currentStep > index ? "text-emerald-500/50" : "text-neutral-700"}`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {currentStep === 0 && (
                            <motion.div
                                key="step-0"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                className="space-y-6"
                            >
                                {/* Momen Form */}
                                <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                            <BookText className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold font-[Outfit] text-white">Momen</h2>
                                            <p className="text-xs text-neutral-500">Detail kenangan Anda</p>
                                        </div>
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
                                                className="w-full min-h-[140px] bg-black/20 border border-white/10 rounded-xl p-4 text-base focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none transition-all placeholder:text-neutral-600 text-neutral-200"
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
                                        <div className="p-2.5 bg-rose-500/10 rounded-xl">
                                            <Smile className="w-5 h-5 text-rose-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold font-[Outfit] text-white">Perasaan</h2>
                                            <p className="text-xs text-neutral-500">Pilih emosi Anda</p>
                                        </div>
                                    </div>
                                    <Controller
                                        control={control}
                                        name="emotion"
                                        render={({ field }) => <EmotionPicker value={field.value} onChange={field.onChange} />}
                                    />
                                </div>

                                {/* Location */}
                                <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08] relative z-30">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                            <MapPin className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold font-[Outfit] text-white">Lokasi</h2>
                                            <p className="text-xs text-neutral-500">Tandai tempat kenangan</p>
                                        </div>
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

                                {/* Navigation */}
                                <div className="flex justify-between items-center pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => router.back()}
                                        disabled={isSubmitting}
                                        className="hover:bg-white/5 rounded-xl px-6 text-neutral-400"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 shadow-lg shadow-indigo-500/25 transition-all group"
                                    >
                                        Lanjutkan
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step-1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                className="space-y-6"
                            >
                                {/* Photos & Music in 2-column grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Photos */}
                                    <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08]">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                                <ImagePlus className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold font-[Outfit] text-white">Galeri Foto</h2>
                                                <p className="text-xs text-neutral-500">Upload visual kenangan</p>
                                            </div>
                                        </div>
                                        <Controller
                                            control={control}
                                            name="photos"
                                            render={({ field }) => (
                                                <PhotoUploader
                                                    photos={field.value || []}
                                                    onChange={field.onChange}
                                                    isPublic={isPublic}
                                                />
                                            )}
                                        />
                                    </div>

                                    {/* Music */}
                                    <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08] flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-fuchsia-500/10 rounded-xl">
                                                    <Music className="w-5 h-5 text-fuchsia-400" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-semibold font-[Outfit] text-white">Musik</h2>
                                                    <p className="text-xs text-neutral-500">Tambahkan lagu</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Music Source Tabs */}
                                        <div className="flex-1 rounded-2xl flex flex-col gap-4">
                                            <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => setMusicTab("upload")}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                                                        musicTab === "upload" 
                                                            ? "bg-fuchsia-500/20 text-fuchsia-300 shadow-sm" 
                                                            : "text-neutral-500 hover:text-neutral-300"
                                                    }`}
                                                >
                                                    Upload MP3
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMusicTab("spotify")}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                                        musicTab === "spotify" 
                                                            ? "bg-[#1DB954]/20 text-[#1DB954] shadow-sm" 
                                                            : "text-neutral-500 hover:text-neutral-300"
                                                    }`}
                                                >
                                                    Spotify
                                                    {!hasSpotifyPremium && (
                                                        <Crown className="w-3 h-3 text-amber-400" />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-4">
                                                {musicTab === "upload" ? (
                                                    <Controller
                                                        control={control}
                                                        name="audio"
                                                        render={({ field }) => (
                                                            <MusicUploader
                                                                value={field.value}
                                                                onChange={(val) => {
                                                                    field.onChange(val)
                                                                    if (val) {
                                                                        control._formValues.spotifyTrackId = null
                                                                    }
                                                                }}
                                                                isPublic={isPublic}
                                                            />
                                                        )}
                                                    />
                                                ) : hasSpotifyPremium ? (
                                                    <Controller
                                                        control={control}
                                                        name="spotifyTrackId"
                                                        render={({ field }) => (
                                                            <SpotifySearch
                                                                value={field.value || null}
                                                                onChange={(val) => {
                                                                    field.onChange(val)
                                                                    if (val) {
                                                                        control._formValues.audio = null
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <PremiumLockedState
                                                        featureName="Integrasi Spotify"
                                                        price={500}
                                                        userPoints={premiumPoints}
                                                        onUnlocked={() => {
                                                            setHasSpotifyPremium(true)
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Collaborators */}
                                <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08] relative z-20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                            <Users className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold font-[Outfit] text-white">Kolaborator</h2>
                                            <p className="text-xs text-neutral-500">Tandai teman yang membagikan momen ini (Maks 5)</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Controller
                                            control={control}
                                            name="collaborators"
                                            render={({ field }) => (
                                                <CollaboratorPicker
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.collaborators && (
                                        <p className="text-red-400 text-sm mt-3">{errors.collaborators.message}</p>
                                    )}
                                </div>

                                {/* Settings */}
                                <div className="bg-neutral-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/[0.05] shadow-2xl transition-all hover:border-white/[0.08] relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                                <Globe className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold font-[Outfit] text-white">Pengaturan Privasi</h2>
                                                <p className="text-xs text-neutral-500">Izinkan orang lain melihat kenangan ini di peta</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" {...register("isPublic")} className="sr-only peer" />
                                            <div className="w-12 h-7 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500 border border-white/10"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between items-center pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                        className="hover:bg-white/5 rounded-xl px-6 text-neutral-400 group"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                                        Kembali
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 shadow-lg shadow-indigo-500/25 transition-all group"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    )
}