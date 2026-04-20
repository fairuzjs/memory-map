"use client"

import { Control, Controller, UseFormRegister, FieldErrors } from "react-hook-form"
import { BookText, Smile, MapPin } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { EmotionPicker } from "@/components/memories/EmotionPicker"
import dynamic from "next/dynamic"
import { MemoryInput } from "@/lib/validations"

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-neutral-900/50 animate-pulse rounded-2xl border border-white/5 flex items-center justify-center">
            <span className="text-neutral-500 text-sm italic">Memuat peta...</span>
        </div>
    )
})

interface EditorStepDetailProps {
    register: UseFormRegister<MemoryInput>
    control: Control<MemoryInput>
    errors: FieldErrors<MemoryInput>
    isSubmitting: boolean
}

export function EditorStepDetail({ register, control, errors, isSubmitting }: EditorStepDetailProps) {
    return (
        <div className="space-y-6">
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
        </div>
    )
}
