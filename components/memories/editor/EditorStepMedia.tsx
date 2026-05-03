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
    setValue: UseFormSetValue<MemoryInput>
    errors: FieldErrors<MemoryInput>
    isSubmitting: boolean
    musicTab: "upload" | "spotify"
    setMusicTab: (tab: "upload" | "spotify") => void
    hasSpotifyPremium: boolean
    setHasSpotifyPremium: (val: boolean) => void
    premiumPoints: number
    isPublic: boolean
    maxPhotos?: number
    maxCollaborators?: number
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
    isPublic,
    maxPhotos = 3,
    maxCollaborators = 5,
}: EditorStepMediaProps) {
    return (
        <div className="space-y-6">
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
        </div>
    )
}
