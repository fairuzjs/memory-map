"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memorySchema, type MemoryInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { EmotionPicker } from "@/components/memories/EmotionPicker"
import { PhotoUploader } from "@/components/memories/PhotoUploader"
import { MusicUploader } from "@/components/memories/MusicUploader"
import { SpotifySearch } from "@/components/memories/SpotifySearch"
import { PremiumLockedState } from "@/components/memories/PremiumLockedState"
import { CollaboratorPicker } from "@/components/memories/CollaboratorPicker"
import { MarkerStylePicker } from "@/components/memories/MarkerStylePicker"
import { motion, AnimatePresence } from "framer-motion"
import {
    BookText, MapPin, Smile, ImagePlus, Users, Globe, Music,
    ArrowRight, ArrowLeft, Sparkles, Save, ChevronRight, Crown,
    ShieldAlert, Settings
} from "lucide-react"
import Link from "next/link"

import dynamic from "next/dynamic"

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-[#E5E5E5] animate-pulse border-[3px] border-black flex items-center justify-center">
        <span className="text-neutral-500 text-sm font-black uppercase">Memuat peta...</span>
    </div>
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

export default function CreateMemoryPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)
    const [musicTab, setMusicTab] = useState<"upload" | "spotify">("upload")
    const [hasSpotifyPremium, setHasSpotifyPremium] = useState(false)
    const [premiumPoints, setPremiumPoints] = useState(0)
    const [premiumLoading, setPremiumLoading] = useState(true)
    const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null)
    const [maxPhotos, setMaxPhotos] = useState(3)
    const [maxCollaborators, setMaxCollaborators] = useState(5)
    const [isPremium, setIsPremium] = useState(false)

    // Check email verification status
    useEffect(() => {
        if (!session?.user?.id) return
        fetch(`/api/users/${session.user.id}`)
            .then(r => r.json())
            .then(data => setIsEmailVerified(data.isEmailVerified ?? false))
            .catch(() => setIsEmailVerified(true)) // fail open
    }, [session?.user?.id])

    // Check premium feature access + premium subscription status
    useEffect(() => {
        const checkPremium = async () => {
            try {
                // Check inventory for shop-purchased features
                const invRes = await fetch("/api/inventory/premium")
                if (invRes.ok) {
                    const data = await invRes.json()
                    setPremiumPoints(data.points ?? 0)
                    // Shop-purchased Spotify
                    const hasShopSpotify = data.features?.includes("spotify_integration") ?? false
                    setHasSpotifyPremium(hasShopSpotify)
                }

                // Check premium subscription for auto-unlock and limits
                const statusRes = await fetch("/api/premium/status")
                if (statusRes.ok) {
                    const status = await statusRes.json()
                    if (status.isPremium) {
                        setMaxPhotos(status.limits.maxPhotos)
                        setMaxCollaborators(status.limits.maxCollaborators)
                        setIsPremium(true)
                        // Premium users get Spotify auto-unlock
                        setHasSpotifyPremium(true)
                    }
                }
            } catch {}
            setPremiumLoading(false)
        }
        checkPremium()
    }, [])

    const {
        register,
        handleSubmit,
        control,
        trigger,
        watch,
        formState: { errors }
    } = useForm<MemoryInput>({
        resolver: zodResolver(memorySchema),
        defaultValues: {
            emotion: "HAPPY",
            isPublic: true,
            photos: [],
            tags: [],
            collaborators: [],
            audio: null,
            spotifyTrackId: null,
            markerStyle: null,
            latitude: -2.5489,
            longitude: 118.0149,
            locationName: "Indonesia",
            date: new Date().toISOString().split("T")[0]
        }
    })

    async function onSubmit(data: MemoryInput) {
        setIsSubmitting(true)
        try {
            // Map rich PhotoData objects to stringified JSON strings before sending to API 
            // This ensures backend `photos.create: photos.map(url => ({ url }))` gracefully stores the full metadata
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
                markerStyle: data.markerStyle || null,
            }

            const res = await fetch("/api/memories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            })

            if (!res.ok) throw new Error("Failed to create memory")

            toast.success("Kenangan berhasil dibuat!")
            router.push("/memories")
        } catch (error) {
            toast.error("Terjadi kesalahan saat menyimpan kenangan")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleNext = async () => {
        // Validate slide 1 fields before proceeding
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

    // We need to watch `isPublic` to tell PhotoUploader how to upload incoming files
    const isPublic = control._formValues.isPublic !== undefined ? control._formValues.isPublic : true
    const selectedMarkerStyle = watch("markerStyle")

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full relative">

            {/* ── Unverified Email Gate ──────────────────────────── */}
            <AnimatePresence>
                {isEmailVerified === false && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative z-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
                    >
                        {/* Icon */}
                        <div className="w-20 h-20 flex items-center justify-center mb-6 mx-auto bg-[#FFFF00] border-[4px] border-black shadow-[4px_4px_0_#000]">
                            <ShieldAlert className="w-9 h-9 text-black" />
                        </div>

                        {/* Text */}
                        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase mb-3">
                            Email Belum Diverifikasi
                        </h1>
                        <p className="text-neutral-500 text-sm leading-relaxed max-w-sm mb-8 font-bold">
                            Kamu perlu memverifikasi email sebelum dapat membuat memory baru.
                            Ini hanya perlu dilakukan sekali untuk menjaga keamanan platform.
                        </p>

                        {/* Feature preview — blurred cards */}
                        <div className="relative w-full max-w-md mb-8 pointer-events-none select-none">
                            <div className="space-y-3" style={{ filter: "blur(3px)", opacity: 0.4 }}>
                                {["Judul memory", "Cerita & momen", "Lokasi di peta"].map(label => (
                                    <div
                                        key={label}
                                        className="h-12 flex items-center px-4 bg-[#E5E5E5] border-[3px] border-black"
                                    >
                                        <span className="text-sm text-neutral-500 font-bold">{label}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Lock badge overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000]">
                                    <ShieldAlert className="w-4 h-4 text-black" />
                                    <span className="text-sm font-black text-black uppercase">Konten terkunci</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <Link
                                href="/settings?tab=security"
                                className="flex items-center gap-2.5 px-6 py-3 text-sm font-black text-black uppercase bg-[#FF00FF] text-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                            >
                                Verifikasi Email Sekarang
                            </Link>
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-6 py-3 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                            >
                                Kembali
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Form (only shown when verified or loading) ── */}
            {isEmailVerified !== false && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">

                {/* Page Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] mb-4">
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="text-xs font-black text-black uppercase tracking-widest">Buat Baru</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight">
                        Simpan Kenangan Baru
                    </h1>
                    <p className="text-neutral-500 text-sm font-bold mt-2 max-w-md mx-auto">
                        Abadikan momen spesial Anda, tandai di peta, dan bagikan perasaan dengan sahabat terdekat.
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
                                        flex items-center gap-2.5 px-4 py-2.5 border-[3px] border-black transition-all duration-200
                                        ${isActive
                                            ? "bg-[#FFFF00] text-black shadow-[4px_4px_0_#000]"
                                            : isCompleted
                                                ? "bg-[#00FF00] text-black shadow-[3px_3px_0_#000] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000]"
                                                : "bg-[#E5E5E5] text-neutral-400"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-7 h-7 flex items-center justify-center text-xs font-black transition-all border-[2px] border-black
                                        ${isActive
                                            ? "bg-black text-[#FFFF00]"
                                            : isCompleted
                                                ? "bg-black text-[#00FF00]"
                                                : "bg-white text-neutral-400"
                                        }
                                    `}>
                                        {isCompleted ? "✓" : index + 1}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-sm font-black uppercase leading-tight">{step.label}</p>
                                        <p className={`text-[10px] leading-tight mt-0.5 font-bold ${isActive ? "text-black/60" : "text-neutral-500"}`}>
                                            {step.description}
                                        </p>
                                    </div>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={`w-6 h-[3px] ${currentStep > index ? "bg-black" : "bg-[#E5E5E5]"}`} />
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
                                <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-[#00FFFF] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            <BookText className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-black uppercase">Momen</h2>
                                            <p className="text-xs text-neutral-500 font-bold">Detail kenangan Anda</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Judul</label>
                                            <Input
                                                {...register("title")}
                                                placeholder="Liburan tak terlupakan..."
                                                className="!bg-[#E5E5E5] !border-[3px] !border-black !rounded-none focus:!bg-[#FFFF00] !transition-all !text-black !font-bold !placeholder:text-neutral-400"
                                                disabled={isSubmitting}
                                            />
                                            {errors.title && <p className="text-[#FF0000] text-sm mt-1.5 font-bold">{errors.title.message}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Cerita</label>
                                            <textarea
                                                {...register("story")}
                                                className="w-full min-h-[140px] bg-[#E5E5E5] border-[3px] border-black p-4 text-base focus:bg-[#FFFF00] outline-none resize-none transition-all placeholder:text-neutral-400 text-black font-bold"
                                                placeholder="Ceritakan apa yang terjadi... setiap detail berharga."
                                                disabled={isSubmitting}
                                            />
                                            {errors.story && <p className="text-[#FF0000] text-sm mt-1.5 font-bold">{errors.story.message}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Tanggal</label>
                                            <Input
                                                type="date"
                                                {...register("date")}
                                                className="!bg-[#E5E5E5] !border-[3px] !border-black !rounded-none focus:!bg-[#FFFF00] !transition-all !text-black !font-bold"
                                                disabled={isSubmitting}
                                            />
                                            {errors.date && <p className="text-[#FF0000] text-sm mt-1.5 font-bold">{errors.date.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Emotion */}
                                <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            <Smile className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-black uppercase">Perasaan</h2>
                                            <p className="text-xs text-neutral-500 font-bold">Pilih emosi Anda</p>
                                        </div>
                                    </div>
                                    <Controller
                                        control={control}
                                        name="emotion"
                                        render={({ field }) => <EmotionPicker value={field.value} onChange={field.onChange} />}
                                    />
                                </div>

                                {/* Premium Map Marker — pick style before location so preview shows */}
                                <Controller
                                    control={control}
                                    name="markerStyle"
                                    render={({ field }) => (
                                        <MarkerStylePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            isPremium={isPremium}
                                        />
                                    )}
                                />

                                {/* Location */}
                                <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000] relative z-30">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-[#FFFF00] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            <MapPin className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-black uppercase">Lokasi</h2>
                                            <p className="text-xs text-neutral-500 font-bold">Tandai tempat kenangan</p>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden border-[3px] border-black">
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
                                                                    markerStyle={selectedMarkerStyle}
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
                                <div className="flex justify-between items-center pt-4 mt-2 border-t-[3px] border-dashed border-black/20">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-black uppercase bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                                    >
                                        Lanjutkan
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
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
                                    <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000]">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 bg-[#00FF00] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                                <ImagePlus className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-black uppercase">Galeri Foto</h2>
                                                <p className="text-xs text-neutral-500 font-bold">Upload visual kenangan (Maks {maxPhotos} foto, ukuran max 5MB/foto)</p>
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
                                                    maxPhotos={maxPhotos}
                                                />
                                            )}
                                        />
                                    </div>

                                    {/* Music */}
                                    <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000] flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                                    <Music className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-black text-black uppercase">Musik</h2>
                                                    <p className="text-xs text-neutral-500 font-bold">Tambahkan lagu</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Music Source Tabs */}
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div className="flex border-[3px] border-black overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => setMusicTab("upload")}
                                                    className={`flex-1 py-2.5 text-sm font-black uppercase transition-all border-r-[3px] border-black ${
                                                        musicTab === "upload" 
                                                            ? "bg-[#FF00FF] text-white" 
                                                            : "bg-white text-neutral-400 hover:bg-[#E5E5E5] hover:text-black"
                                                    }`}
                                                >
                                                    Upload MP3
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMusicTab("spotify")}
                                                    className={`flex-1 py-2.5 text-sm font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                                                        musicTab === "spotify" 
                                                            ? "bg-[#1DB954] text-white" 
                                                            : "bg-white text-neutral-400 hover:bg-[#E5E5E5] hover:text-black"
                                                    }`}
                                                >
                                                    Spotify
                                                    {!hasSpotifyPremium && (
                                                        <Crown className="w-3 h-3 text-[#FFFF00]" />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="flex-1 bg-[#E5E5E5] border-[3px] border-black p-4">
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
                                                                        // Clear spotify if upload is chosen
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
                                                                        // Clear upload if spotify is chosen
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
                                <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000] relative z-20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2.5 bg-[#00FFFF] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                            <Users className="w-5 h-5 text-black" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-black uppercase">Kolaborator</h2>
                                            <p className="text-xs text-neutral-500 font-bold">Tandai teman yang membagikan momen ini (Maks {maxCollaborators})</p>
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
                                                    maxCollaborators={maxCollaborators}
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.collaborators && (
                                        <p className="text-[#FF0000] text-sm mt-3 font-bold">{errors.collaborators.message}</p>
                                    )}
                                </div>

                                {/* Settings */}
                                <div className="bg-white p-6 sm:p-8 border-[3px] border-black shadow-[4px_4px_0_#000] relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-[#FFFF00] border-[2px] border-black shadow-[2px_2px_0_#000]">
                                                <Globe className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-black uppercase">Pengaturan Privasi</h2>
                                                <p className="text-xs text-neutral-500 font-bold">Izinkan orang lain melihat kenangan ini di peta</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" {...register("isPublic")} className="sr-only peer" />
                                            <div className="w-14 h-8 bg-[#E5E5E5] border-[3px] border-black peer-focus:outline-none peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-[2px] after:border-black after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00FF00]"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between items-center pt-4 mt-2 border-t-[3px] border-dashed border-black/20">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-black text-black uppercase bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSubmitting ? "Menyimpan..." : "Simpan Kenangan"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
                </motion.div>
            )}
        </div>
    )
}
