import { useState, useRef } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export interface PhotoData {
    path: string
    bucket: string
    url?: string | null
    previewUrl?: string // for local preview
}

interface PhotoUploaderProps {
    photos: PhotoData[]
    onChange: (photos: PhotoData[]) => void
    isPublic: boolean
    maxPhotos?: number // dynamic limit based on premium status
}

export function PhotoUploader({ photos, onChange, isPublic, maxPhotos = 3 }: PhotoUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        if (photos.length + e.target.files.length > maxPhotos) {
            toast.error(`Maksimal ${maxPhotos} foto diperbolehkan`)
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setIsUploading(true)
        const newPhotos = [...photos]

        // Generate temporary local previews for all selected files immediately
        const tempFiles = Array.from(e.target.files).map(file => {
            const tempPhoto: PhotoData = {
                path: "", // will be filled after upload
                bucket: "",
                previewUrl: URL.createObjectURL(file)
            }
            newPhotos.push(tempPhoto)
            return { file, index: newPhotos.length - 1 }
        })

        onChange([...newPhotos]) // Show placeholders/previews immediately

        // Upload files sequentially
        for (const { file, index } of tempFiles) {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("isPublic", isPublic ? "true" : "false")

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })
                if (!res.ok) {
                    const errorData = await res.json()
                    throw new Error(errorData.error || "Upload failed")
                }
                const data = await res.json()

                // Update the placeholder with actual backend data
                newPhotos[index] = {
                    path: data.path,
                    bucket: data.bucket,
                    url: data.url,
                    previewUrl: newPhotos[index].previewUrl // keep local preview
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to upload photo")
                // Remove the failed temp photo
                newPhotos.splice(index, 1)
            }
        }

        onChange([...newPhotos])
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removePhoto = (index: number) => {
        const newPhotos = [...photos]
        // Free memory for object URL if it exists
        if (newPhotos[index].previewUrl) {
            URL.revokeObjectURL(newPhotos[index].previewUrl!)
        }
        newPhotos.splice(index, 1)
        onChange(newPhotos)
    }

    return (
        <div className="space-y-4">
            {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map((photo, i) => (
                        <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all bg-white">
                            {/* Fallback to path if url/previewUrl isn't available, but typically previewUrl is always there for new uploads */}
                            <img
                                src={photo.previewUrl || photo.url || ""}
                                alt={`Memory ${i}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Show loading spinner over image if it hasn't finished uploading yet */}
                            {!photo.path && photo.previewUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                    <Loader2 className="w-8 h-8 text-[#00FF00] animate-spin drop-shadow-md" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 border-[2px] border-black text-white hover:bg-black hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shadow-[2px_2px_0_#000] rounded-lg"
                            >
                                <X className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {photos.length < maxPhotos && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex flex-col items-center justify-center p-8 border-[3px] border-dashed border-black rounded-2xl bg-white shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] hover:bg-[#00FF00]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none group"
                >
                    {isUploading ? (
                        <Loader2 className="w-10 h-10 text-black animate-spin mb-3" />
                    ) : (
                        <div className="relative mb-3">
                            <div className="absolute inset-0 bg-[#00FF00]/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ImagePlus className="w-10 h-10 text-black relative group-hover:scale-110 transition-transform duration-250" />
                        </div>
                    )}
                    <span className="text-[15px] font-black uppercase text-black tracking-wide">
                        {isUploading ? "MENGUPLOAD..." : "PILIH FOTO UNTUK DIUPLOAD"}
                    </span>
                    <span className="text-[11px] font-bold text-black/60 uppercase mt-2">
                        {photos.length}/{maxPhotos} FOTO • MAKS 5MB PER FOTO
                    </span>
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
            />
        </div>
    )
}
