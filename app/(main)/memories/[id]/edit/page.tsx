"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memorySchema, type MemoryInput } from "@/lib/validations"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Modular Components
import { EditorHeader } from "@/components/memories/editor/EditorHeader"
import { EditorStepDetail } from "@/components/memories/editor/EditorStepDetail"
import { EditorStepMedia } from "@/components/memories/editor/EditorStepMedia"
import { EditorNavigation } from "@/components/memories/editor/EditorNavigation"

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

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        trigger,
        watch,
        formState: { errors }
    } = useForm<MemoryInput>({
        resolver: zodResolver(memorySchema),
    })

    const isPublic = watch("isPublic")

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

    useEffect(() => {
        if (!id) return

        const fetchMemory = async () => {
            try {
                const res = await fetch(`/api/memories/${id}`)
                if (!res.ok) throw new Error("Data tidak ditemukan")
                const data = await res.json()

                if (session?.user?.id && data.userId !== session.user.id) {
                    toast.error("Anda tidak memiliki izin untuk mengedit kenangan ini")
                    router.push("/memories")
                    return
                }

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
                        try {
                            const parsed = JSON.parse(p.url)
                            return {
                                path: parsed.path,
                                bucket: parsed.bucket,
                                url: parsed.url,
                                previewUrl: parsed.url
                            }
                        } catch {
                            return {
                                path: p.url,
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
        if (currentStep === 0) {
            router.back()
        } else {
            setDirection(-1)
            setCurrentStep(0)
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
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
                
                <EditorHeader 
                    currentStep={currentStep} 
                    setCurrentStep={setCurrentStep} 
                    setDirection={setDirection} 
                />

                <form onSubmit={handleSubmit(onSubmit)}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {currentStep === 0 ? (
                            <motion.div
                                key="step-0"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <EditorStepDetail 
                                    register={register}
                                    control={control}
                                    errors={errors}
                                    isSubmitting={isSubmitting}
                                />
                                <EditorNavigation 
                                    currentStep={0}
                                    onBack={handleBack}
                                    onNext={handleNext}
                                    isSubmitting={isSubmitting}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step-1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <EditorStepMedia 
                                    register={register}
                                    control={control}
                                    setValue={setValue}
                                    errors={errors}
                                    isSubmitting={isSubmitting}
                                    musicTab={musicTab}
                                    setMusicTab={setMusicTab}
                                    hasSpotifyPremium={hasSpotifyPremium}
                                    setHasSpotifyPremium={setHasSpotifyPremium}
                                    premiumPoints={premiumPoints}
                                    isPublic={isPublic}
                                />
                                <EditorNavigation 
                                    currentStep={1}
                                    onBack={handleBack}
                                    isSubmitting={isSubmitting}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    )
}