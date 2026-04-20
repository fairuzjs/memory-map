"use client"

import { Control, Controller, UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form"
import { ImagePlus, Music, Crown, Users, Globe } from "lucide-react"
import { PhotoUploader } from "@/components/memories/PhotoUploader"
import { MusicUploader } from "@/components/memories/MusicUploader"
import { SpotifySearch } from "@/components/memories/SpotifySearch"
import { PremiumLockedState } from "@/components/memories/PremiumLockedState"
import { CollaboratorPicker } from "@/components/memories/CollaboratorPicker"
import { MemoryInput } from "@/lib/validations"

interface EditorStepMediaProps {
    register: UseFormRegister<MemoryInput>
    control: Control<MemoryInput>
    setValue: UseFormSetValue<MemoryInput> // Added this
    errors: FieldErrors<MemoryInput>
    isSubmitting: boolean
    musicTab: "upload" | "spotify"
    setMusicTab: (tab: "upload" | "spotify") => void
    hasSpotifyPremium: boolean
    setHasSpotifyPremium: (val: boolean) => void
    premiumPoints: number
    isPublic: boolean
}

export function EditorStepMedia({
    register,
    control,
    setValue,
    errors,
    isSubmitting,
    musicTab,
    setMusicTab,
    hasSpotifyPremium,
    setHasSpotifyPremium,
    premiumPoints,
    isPublic
}: EditorStepMediaProps) {
    return (
        <div className="space-y-6">
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
                            <p className="text-xs text-neutral-500">Upload visual kenangan (Maks 3 foto)</p>
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
                                                    setValue("spotifyTrackId", null)
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
                                                    setValue("audio", null)
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
        </div>
    )
}
