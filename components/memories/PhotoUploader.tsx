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
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-700">
                            {/* Fallback to path if url/previewUrl isn't available, but typically previewUrl is always there for new uploads */}
                            <img
                                src={photo.previewUrl || photo.url || ""}
                                alt={`Memory ${i}`}
                                className={`w-full h-full object-cover ${!photo.path && photo.previewUrl ? 'opacity-50 grayscale' : ''}`}
                            />
                            {/* Show loading spinner over image if it hasn't finished uploading yet */}
                            {!photo.path && photo.previewUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Loader2 className="w-6 h-6 text-white animate-spin drop-shadow-md" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
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
                    className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mb-2" />
                    ) : (
                        <ImagePlus className="w-8 h-8 text-neutral-400 mb-2" />
                    )}
                    <span className="text-sm font-medium text-neutral-300">
                        {isUploading ? "Uploading..." : "Click to select photos"}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">
                        {photos.length}/{maxPhotos} foto, ukuran max 5MB per foto
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
