import { useState, useRef } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface PhotoUploaderProps {
    photos: string[]
    onChange: (photos: string[]) => void
}

export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        const newPhotos = [...photos]

        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i]
            const formData = new FormData()
            formData.append("file", file)

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })
                if (!res.ok) throw new Error("Upload failed")
                const data = await res.json()
                newPhotos.push(data.url)
            } catch (error) {
                toast.error("Failed to upload photo")
            }
        }

        onChange(newPhotos)
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removePhoto = (index: number) => {
        const newPhotos = [...photos]
        newPhotos.splice(index, 1)
        onChange(newPhotos)
    }

    return (
        <div className="space-y-4">
            {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map((photo, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-700">
                            <img src={photo} alt={`Memory ${i}`} className="w-full h-full object-cover" />
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
            </button>

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
