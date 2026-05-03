import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, AtSign, Loader2, Check, AlertCircle, Instagram, Facebook } from "lucide-react"
import Cropper from "react-easy-crop"
import toast from "react-hot-toast"
import getCroppedImg from "@/lib/cropImage"
import { getBadgeConfig, BADGE_STYLES } from "./BadgeConfigs"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    user: any
    onSave: (data: any) => Promise<void>
}

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.61a8.18 8.18 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01Z" />
        </svg>
    )
}

export function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
    const [editName, setEditName] = useState(user.name || "")
    const [editUsername, setEditUsername] = useState(user.username || "")
    const [editUsernameError, setEditUsernameError] = useState("")
    const [editUsernameStatus, setEditUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
    const [editModalTab, setEditModalTab] = useState<"profil" | "badge">("profil")
    const [editBio, setEditBio] = useState(user.bio || "")
    const [editImage, setEditImage] = useState(user.image || "")
    const [previewImage, setPreviewImage] = useState(user.image || "")
    const [editPinnedBadge, setEditPinnedBadge] = useState<number | null>(user.pinnedBadge)
    
    // Socials
    const [insta, setInsta] = useState(user.instagram || "")
    const [tiktok, setTiktok] = useState(user.tiktok || "")
    const [fb, setFb] = useState(user.facebook || "")

    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const usernameCheckTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Crop state
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [isCropping, setIsCropping] = useState(false)
    const [cropImageUrl, setCropImageUrl] = useState("")

    useEffect(() => {
        if (isOpen) {
            setEditName(user.name || "")
            setEditUsername(user.username || "")
            setEditBio(user.bio || "")
            setEditImage(user.image || "")
            setPreviewImage(user.image || "")
            setEditPinnedBadge(user.pinnedBadge)
            setInsta(user.instagram || "")
            setTiktok(user.tiktok || "")
            setFb(user.facebook || "")
        }
    }, [isOpen, user])

    const handleUsernameChange = (val: string) => {
        const v = val.toLowerCase().replace(/[^a-z0-9_.]/g, "")
        setEditUsername(v)
        setEditUsernameError("")
        setEditUsernameStatus("idle")

        if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current)
        if (v === "") return
        if (v === user.username) { setEditUsernameStatus("available"); return }

        if (!/^[a-z0-9_.]{3,30}$/.test(v)) {
            setEditUsernameError("Hanya huruf kecil, angka, underscore, dan titik (3-30 karakter)")
            return
        }

        setEditUsernameStatus("checking")
        usernameCheckTimerRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/by-username/${encodeURIComponent(v)}`)
                if (res.status === 404) setEditUsernameStatus("available")
                else if (res.ok) {
                    const data = await res.json()
                    setEditUsernameStatus(data.id === user.id ? "available" : "taken")
                } else setEditUsernameStatus("idle")
            } catch { setEditUsernameStatus("idle") }
        }, 500)
    }

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setCropImageUrl(url)
        setIsCropping(true)
        if (avatarInputRef.current) avatarInputRef.current.value = ""
    }

    const saveCrop = async () => {
        setIsUploadingPhoto(true)
        setIsCropping(false)
        try {
            const file = await getCroppedImg(cropImageUrl, croppedAreaPixels, rotation)
            if (!file) throw new Error("Gagal crop")
            const formData = new FormData()
            formData.append("file", file)
            formData.append("isPublic", "true")
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error("Upload failed")
            const { url } = await res.json()
            setEditImage(url)
            setPreviewImage(url)
        } catch {
            toast.error("Gagal mengupload foto")
        } finally {
            setIsUploadingPhoto(false)
        }
    }

    const handleSaveInternal = async () => {
        if (!editName.trim()) { toast.error("Nama tidak boleh kosong"); return }
        if (editUsernameError) { toast.error("Perbaiki username terlebih dahulu"); return }
        if (editUsernameStatus === "taken") { toast.error("Username sudah dipakai orang lain"); return }
        setIsSaving(true)
        try {
            await onSave({
                name: editName,
                bio: editBio,
                image: editImage,
                pinnedBadge: editPinnedBadge,
                username: editUsername || null,
                instagram: insta || null,
                tiktok: tiktok || null,
                facebook: fb || null
            })
            onClose()
        } catch (err: any) {
            toast.error(err.message || "Gagal memperbarui profil")
        } finally {
            setIsSaving(false)
        }
    }

    const inputClass = "w-full bg-[#E5E5E5] border-[3px] border-black px-4 py-3 text-sm text-black font-bold focus:outline-none focus:bg-[#FFFF00] transition-all placeholder:text-neutral-400"

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white border-[4px] border-black overflow-hidden relative shadow-[8px_8px_0_#000]"
                        >
                            <div className="flex items-center justify-between px-7 pt-6 pb-2">
                                <h2 className="text-xl font-black text-black uppercase">Edit Profil</h2>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-black bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex border-b-[3px] border-black">
                                {["profil", "badge"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setEditModalTab(tab as any)}
                                        className={`flex-1 py-3 text-sm font-black uppercase transition-all ${editModalTab === tab ? "text-black bg-[#FFFF00]" : "text-neutral-400 hover:text-black hover:bg-[#E5E5E5]"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="px-7 py-6 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-hide">
                                {editModalTab === "profil" ? (
                                    <>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative group">
                                                <img src={previewImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Avatar" className="relative w-24 h-24 rounded-full object-cover z-10 border-[4px] border-black shadow-[4px_4px_0_#000]" />
                                                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 z-20 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </button>
                                                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest mb-1.5 block">Nama Panggilan</label>
                                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest mb-1.5 block">Username (@)</label>
                                                <div className="relative">
                                                    <input type="text" value={editUsername} onChange={(e) => handleUsernameChange(e.target.value)} className={`${inputClass} ${editUsernameError ? 'border-[#FF0000]' : ''}`} />
                                                    {editUsernameStatus === "checking" && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black animate-spin" />}
                                                    {editUsernameStatus === "available" && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FF00]" />}
                                                </div>
                                                {editUsernameError && <p className="text-[10px] text-[#FF0000] mt-1 font-bold">{editUsernameError}</p>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest mb-1.5 block">Bio</label>
                                                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Tulis sesuatu tentang dirimu..." />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-widest mb-1.5 block">Media Sosial (Opsional)</label>
                                                <div className="flex items-center gap-3 bg-[#E5E5E5] border-[3px] border-black px-3 py-1">
                                                    <Instagram className="w-4 h-4 text-black" />
                                                    <input type="text" value={insta} onChange={(e) => setInsta(e.target.value)} placeholder="https://instagram.com/..." className="flex-1 bg-transparent py-2 text-xs text-black font-bold focus:outline-none placeholder:text-neutral-400" />
                                                </div>
                                                <div className="flex items-center gap-3 bg-[#E5E5E5] border-[3px] border-black px-3 py-1">
                                                    <TikTokIcon className="w-4 h-4 text-black" />
                                                    <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." className="flex-1 bg-transparent py-2 text-xs text-black font-bold focus:outline-none placeholder:text-neutral-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setEditPinnedBadge(null)} className={`p-4 border-[3px] border-black transition-all text-center shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none ${editPinnedBadge === null ? 'bg-[#FFFF00]' : 'bg-[#E5E5E5]'}`}>
                                            <span className="text-xs font-black text-black block uppercase">Sembunyikan</span>
                                        </button>
                                        {[7, 30, 60, 90].map((m) => {
                                            const cfg = getBadgeConfig(m)
                                            const Icon = cfg.icon
                                            const active = editPinnedBadge === m
                                            const isUnlocked = user.streakBadges?.some((b: any) => b.milestone === m)
                                            return (
                                                <button 
                                                    key={m} 
                                                    onClick={() => {
                                                        if (isUnlocked) setEditPinnedBadge(m)
                                                        else toast.error(`Capai streak ${m} hari untuk membuka badge ini`)
                                                    }} 
                                                    className={`p-4 border-[3px] border-black transition-all flex flex-col items-center gap-2 relative shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none ${active ? 'bg-[#FFFF00]' : 'bg-[#E5E5E5]'} ${!isUnlocked ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                                                >
                                                    <Icon className={`w-6 h-6 ${cfg.iconClassProfile}`} />
                                                    <span className="text-[10px] font-black text-black uppercase tracking-wider">{cfg.name}</span>
                                                    {!isUnlocked && (
                                                        <span className="absolute top-2 right-2 text-xs">🔒</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-7">
                                <button
                                    onClick={handleSaveInternal}
                                    disabled={isSaving || isUploadingPhoto}
                                    className="w-full py-4 bg-[#00FF00] border-[3px] border-black text-black font-black uppercase text-sm shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Simpan Perubahan"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCropping && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-white border-[4px] border-black shadow-[8px_8px_0_#000] overflow-hidden"
                        >
                            {/* Modal header */}
                            <div className="px-6 pt-6 pb-4 border-b-[3px] border-black">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 flex items-center justify-center bg-[#00FFFF] border-[3px] border-black shadow-[2px_2px_0_#000]">
                                        <Camera className="w-4 h-4 text-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-black uppercase">Sesuaikan Foto</h2>
                                        <p className="text-xs text-neutral-500 font-bold">Geser dan zoom untuk mendapatkan hasil terbaik</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="relative w-full h-64 overflow-hidden border-[3px] border-black" style={{ background: "rgba(0,0,0,0.6)" }}>
                                    <Cropper
                                        image={cropImageUrl}
                                        crop={crop}
                                        zoom={zoom}
                                        rotation={rotation}
                                        aspect={1}
                                        cropShape="round"
                                        onCropChange={setCrop}
                                        onCropComplete={(_: any, croppedPixels: any) => setCroppedAreaPixels(croppedPixels)}
                                        onZoomChange={setZoom}
                                        onRotationChange={setRotation}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black text-black uppercase tracking-wider">Zoom</label>
                                            <span className="text-xs text-black font-black font-mono bg-[#FFFF00] border-[2px] border-black px-2 py-0.5">{zoom.toFixed(1)}×</span>
                                        </div>
                                        <input
                                            type="range" min={1} max={3} step={0.1} value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full h-2 appearance-none accent-black cursor-pointer bg-[#E5E5E5] border-[2px] border-black"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black text-black uppercase tracking-wider">Rotasi</label>
                                            <span className="text-xs text-black font-black font-mono bg-[#00FFFF] border-[2px] border-black px-2 py-0.5">{rotation}°</span>
                                        </div>
                                        <input
                                            type="range" min={0} max={360} step={1} value={rotation}
                                            onChange={(e) => setRotation(Number(e.target.value))}
                                            className="w-full h-2 appearance-none accent-black cursor-pointer bg-[#E5E5E5] border-[2px] border-black"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => setIsCropping(false)}
                                        className="flex-1 py-2.5 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={saveCrop}
                                        className="flex-1 py-2.5 text-sm font-black text-black uppercase flex items-center justify-center gap-2 bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                                    >
                                        <Check className="w-4 h-4" /> Simpan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
