"use client"

import { Control, Controller, UseFormRegister, FieldErrors, useWatch } from "react-hook-form"
import { BookText, Smile, MapPin } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { EmotionPicker } from "@/components/memories/EmotionPicker"
import { MarkerStylePicker } from "@/components/memories/MarkerStylePicker"
import dynamic from "next/dynamic"
import { MemoryInput } from "@/lib/validations"

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-[#E5E5E5] animate-pulse border-[3px] border-black flex items-center justify-center">
            <span className="text-neutral-500 text-sm font-black uppercase">Memuat peta...</span>
        </div>
    )
})

interface EditorStepDetailProps {
    register: UseFormRegister<MemoryInput>
    control: Control<MemoryInput>
    errors: FieldErrors<MemoryInput>
    isSubmitting: boolean
    isPremium?: boolean
}

export function EditorStepDetail({ register, control, errors, isSubmitting, isPremium = false }: EditorStepDetailProps) {
    const markerStyle = useWatch({ control, name: "markerStyle" })

    return (
        <div className="space-y-6">
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

            {/* Premium Map Marker — placed before location so user picks style first */}
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
                                                markerStyle={markerStyle}
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
