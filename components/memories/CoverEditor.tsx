"use client"

import { useState, useCallback, useRef } from "react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import { X, RotateCcw, ZoomIn, ZoomOut, Upload, Image as ImageIcon, Crop, Check } from "lucide-react"
import getCroppedImg from "@/lib/cropImage"
import toast from "react-hot-toast"

interface CoverEditorProps {
    /** Current cover image URL (if any) */
    coverImage: string | null | undefined
    /** Current crop/zoom/rotation values for re-edit */
    coverPositionX: number
    coverPositionY: number
    coverScale: number
    coverRotation: number
    /** Available photos from the memory gallery */
    galleryPhotos: Array<{ previewUrl?: string; url?: string | null; path?: string; bucket?: string }>
    /** Whether the form is public (for upload bucket) */
    isPublic: boolean
    /** Callback when cover is saved */
    onSave: (data: {
        coverImage: string
        coverPositionX: number
        coverPositionY: number
        coverScale: number
        coverRotation: number
    }) => void
    /** Callback to remove cover */
    onRemove: () => void
    /** Callback to close */
    onClose: () => void
}

export function CoverEditor({
    coverImage,
    coverPositionX,
    coverPositionY,
    coverScale,
    coverRotation,
    galleryPhotos,
    isPublic,
    onSave,
    onRemove,
    onClose,
}: CoverEditorProps) {
    // Selected image to crop
    const [selectedImage, setSelectedImage] = useState<string | null>(coverImage || null)
    const [crop, setCrop] = useState<Point>({ x: coverPositionX || 0, y: coverPositionY || 0 })
    const [zoom, setZoom] = useState(coverScale || 1)
    const [rotation, setRotation] = useState(coverRotation || 0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Phase: "select" = choose source, "crop" = edit crop
    const [phase, setPhase] = useState<"select" | "crop">(coverImage ? "crop" : "select")

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels)
    }, [])

    const handleSelectFromGallery = (photoUrl: string) => {
        setSelectedImage(photoUrl)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setRotation(0)
        setPhase("crop")
    }

    const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const file = e.target.files[0]

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 5MB")
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("isPublic", isPublic ? "true" : "false")

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Upload gagal")
            }
            const data = await res.json()
            const url = data.url || data.path
            if (!url) throw new Error("Upload tidak mengembalikan URL")

            setSelectedImage(url)
            setCrop({ x: 0, y: 0 })
            setZoom(1)
            setRotation(0)
            setPhase("crop")
            toast.success("Foto berhasil diupload")
        } catch (err: any) {
            toast.error(err.message || "Gagal upload foto cover")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleSave = async () => {
        if (!selectedImage || !croppedAreaPixels) {
            toast.error("Atur posisi cover terlebih dahulu")
            return
        }

        setIsSaving(true)
        try {
            // Crop the image client-side
            const croppedFile = await getCroppedImg(selectedImage, croppedAreaPixels, rotation)
            if (!croppedFile) throw new Error("Gagal memproses gambar")

            // Upload cropped result
            const formData = new FormData()
            formData.append("file", croppedFile)
            formData.append("isPublic", isPublic ? "true" : "false")

            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error("Upload cover gagal")
            const data = await res.json()

            onSave({
                coverImage: data.url,
                coverPositionX: crop.x,
                coverPositionY: crop.y,
                coverScale: zoom,
                coverRotation: rotation,
            })

            toast.success("Cover berhasil disimpan!")
            onClose()
        } catch (err: any) {
            toast.error(err.message || "Gagal menyimpan cover")
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setRotation(0)
    }

    // Get usable gallery URLs
    const galleryUrls = galleryPhotos
        .map(p => p.previewUrl || p.url || null)
        .filter(Boolean) as string[]

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                className="relative w-full max-w-2xl bg-white border-[4px] border-black shadow-[8px_8px_0_#000] max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-[#FFFF00]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black flex items-center justify-center border-[2px] border-black shadow-[2px_2px_0_#FF00FF]">
                            <Crop className="w-5 h-5 text-[#FFFF00]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-black uppercase">
                                {phase === "select" ? "Pilih Cover" : "Atur Cover"}
                            </h2>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
                                Rasio 16:9 · Drag untuk atur posisi
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center border-[3px] border-black bg-white hover:bg-[#FF3300] hover:text-white transition-colors shadow-[2px_2px_0_#000]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Phase: Select Source */}
                {phase === "select" && (
                    <div className="p-5 space-y-5">
                        {/* Gallery selection */}
                        {galleryUrls.length > 0 && (
                            <div>
                                <h3 className="text-sm font-black text-black uppercase mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Pilih dari Galeri
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {galleryUrls.map((url, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectFromGallery(url)}
                                            className="aspect-square overflow-hidden border-[3px] border-black bg-neutral-100 shadow-[3px_3px_0_#000] hover:shadow-[5px_5px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group"
                                        >
                                            <img
                                                src={url}
                                                alt={`Foto ${i + 1}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload new */}
                        <div>
                            <h3 className="text-sm font-black text-black uppercase mb-3 flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Upload Cover Baru
                            </h3>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full flex flex-col items-center justify-center p-8 border-[3px] border-dashed border-black bg-[#E5E5E5] hover:bg-[#00FFFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <div className="w-8 h-8 border-[3px] border-black border-t-transparent animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-black mb-2" />
                                )}
                                <span className="text-sm font-black text-black uppercase">
                                    {isUploading ? "Mengupload..." : "Klik untuk upload"}
                                </span>
                                <span className="text-[10px] text-black/50 font-bold mt-1">Max 5MB · JPG, PNG, WebP</span>
                            </button>
                        </div>

                        {/* Remove cover button */}
                        {coverImage && (
                            <button
                                type="button"
                                onClick={() => { onRemove(); onClose() }}
                                className="w-full py-3 text-sm font-black uppercase text-[#FF3300] border-[3px] border-[#FF3300] bg-white hover:bg-[#FF3300] hover:text-white transition-colors shadow-[3px_3px_0_#000]"
                            >
                                Hapus Cover
                            </button>
                        )}
                    </div>
                )}

                {/* Phase: Crop Editor */}
                {phase === "crop" && selectedImage && (
                    <div className="p-5 space-y-4">
                        {/* Crop area */}
                        <div className="relative w-full border-[3px] border-black bg-black overflow-hidden shadow-[4px_4px_0_#000]" style={{ aspectRatio: "16/9" }}>
                            <Cropper
                                image={selectedImage}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={16 / 9}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                objectFit="horizontal-cover"
                                style={{
                                    containerStyle: { width: "100%", height: "100%" },
                                }}
                            />
                        </div>

                        {/* Controls */}
                        <div className="space-y-3">
                            {/* Zoom */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center bg-[#00FFFF] border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0">
                                    <ZoomIn className="w-4 h-4 text-black" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase text-black/60 block mb-1">Zoom</label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.05}
                                        value={zoom}
                                        onChange={e => setZoom(Number(e.target.value))}
                                        className="w-full h-2 accent-black cursor-pointer"
                                    />
                                </div>
                                <span className="text-xs font-black text-black min-w-[3ch] text-right">{zoom.toFixed(1)}x</span>
                            </div>

                            {/* Rotation */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center bg-[#FF00FF] border-[2px] border-black shadow-[2px_2px_0_#000] shrink-0">
                                    <RotateCcw className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase text-black/60 block mb-1">Rotasi</label>
                                    <input
                                        type="range"
                                        min={-45}
                                        max={45}
                                        step={1}
                                        value={rotation}
                                        onChange={e => setRotation(Number(e.target.value))}
                                        className="w-full h-2 accent-black cursor-pointer"
                                    />
                                </div>
                                <span className="text-xs font-black text-black min-w-[3ch] text-right">{rotation}°</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setPhase("select")}
                                className="flex-1 py-3 text-sm font-black uppercase text-black border-[3px] border-black bg-white hover:bg-[#E5E5E5] transition-colors shadow-[3px_3px_0_#000]"
                            >
                                Ganti Foto
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-3 text-sm font-black uppercase text-black border-[3px] border-black bg-[#E5E5E5] hover:bg-white transition-colors shadow-[3px_3px_0_#000]"
                                title="Reset posisi"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black uppercase text-black border-[3px] border-black bg-[#00FF00] hover:bg-[#00DD00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[3px_3px_0_#000]"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-[2px] border-black border-t-transparent animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                {isSaving ? "Menyimpan..." : "Simpan Cover"}
                            </button>
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadNew}
                    className="hidden"
                />
            </div>
        </div>
    )
}
