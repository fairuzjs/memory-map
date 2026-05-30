"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Square, Play, Pause, RotateCcw, Send, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface VoiceCommentRecorderProps {
    onSendVoice: (voiceUrl: string, durationSeconds: number) => void
    onClose: () => void
}

export function VoiceCommentRecorder({ onSendVoice, onClose }: VoiceCommentRecorderProps) {
    const [status, setStatus] = useState<"idle" | "recording" | "preview">("idle")
    const [seconds, setSeconds] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

    // Duration limit: 15 seconds
    const MAX_DURATION = 15

    // Request permissions and start recording
    const startRecording = async () => {
        chunksRef.current = []
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" })
                setAudioBlob(blob)
                
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                
                setStatus("preview")
            }

            recorder.start()
            setStatus("recording")
            setSeconds(0)

            // Start countdown timer
            timerRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev >= MAX_DURATION - 1) {
                        stopRecording()
                        return MAX_DURATION
                    }
                    return prev + 1
                })
            }, 1000)

        } catch (err) {
            console.error("Access microphone error:", err)
            toast.error("Gagal mengakses mikrofon. Pastikan izin mikrofon diaktifkan.")
            onClose()
        }
    }

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
    }

    const resetRecording = () => {
        stopAudioPlayback()
        setAudioBlob(null)
        setAudioUrl(null)
        setStatus("idle")
        setSeconds(0)
    }

    // Preview Player Methods
    const togglePlayback = () => {
        if (!audioUrl) return
        
        if (!audioPlayerRef.current) {
            const audio = new Audio(audioUrl)
            audioPlayerRef.current = audio
            audio.onended = () => setIsPlaying(false)
        }

        const player = audioPlayerRef.current

        if (isPlaying) {
            player.pause()
            setIsPlaying(false)
        } else {
            player.play()
            setIsPlaying(true)
        }
    }

    const stopAudioPlayback = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
            audioPlayerRef.current = null
            setIsPlaying(false)
        }
    }

    // Cleanup refs on unmount
    useEffect(() => {
        return () => {
            stopRecording()
            stopAudioPlayback()
        }
    }, [])

    const handleUploadAndSend = async () => {
        if (!audioBlob || isUploading) return
        setIsUploading(true)

        try {
            // Upload audio file as form data
            const formData = new FormData()
            const audioFile = new File([audioBlob], `voice-comment-${Date.now()}.webm`, { type: "audio/webm" })
            formData.append("file", audioFile)
            formData.append("isPublic", "true")

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            })

            if (!res.ok) throw new Error("Gagal mengupload audio")

            const data = await res.json()
            if (!data.url) throw new Error("URL berkas audio kosong")

            // Send voiceUrl and duration back to parent component
            onSendVoice(data.url, seconds === 0 ? 1 : seconds)
            toast.success("Balasan suara dikirim!")
            onClose()
        } catch (error) {
            console.error("Upload voice error:", error)
            toast.error("Gagal mengirim balasan suara. Silakan coba lagi.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white border-[3px] border-black p-6 rounded-2xl shadow-[6px_6px_0_#000] w-full max-w-sm flex flex-col items-center text-center space-y-6"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isUploading}
                    className="absolute top-4 right-4 p-1 bg-white border-[2px] border-black shadow-[2px_2px_0_#000] hover:bg-neutral-100 rounded-lg active:translate-y-px transition-all"
                >
                    <X className="w-4 h-4 text-black" strokeWidth={2.8} />
                </button>

                {/* Title */}
                <div className="mt-2">
                    <h3 className="text-sm font-black uppercase text-black tracking-wider flex items-center justify-center gap-1.5">
                        <Mic className="w-4 h-4" />
                        Balasan Suara
                    </h3>
                    <p className="text-[10px] font-bold text-black/55 uppercase mt-1 leading-normal">
                        Rekam suara singkat Anda (Maks 15 Detik)
                    </p>
                </div>

                {/* Main Visualizer Area */}
                <div className="w-full flex flex-col items-center justify-center min-h-[140px] border-[2.5px] border-black bg-stone-50 rounded-xl relative overflow-hidden shadow-[inner_3px_3px_0_rgba(0,0,0,0.1)] p-4">
                    {status === "idle" && (
                        <div className="flex flex-col items-center space-y-3">
                            <button
                                onClick={startRecording}
                                className="w-16 h-16 bg-[var(--mm-primary)] hover:bg-[var(--mm-primary)]/80 hover:-translate-y-0.5 border-[2.5px] border-black shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none flex items-center justify-center rounded-full transition-all"
                            >
                                <Mic className="w-7 h-7 text-black" />
                            </button>
                            <span className="text-[10px] font-black uppercase text-black/40">Ketuk untuk rekam</span>
                        </div>
                    )}

                    {status === "recording" && (
                        <div className="flex flex-col items-center space-y-4">
                            {/* Pulsing visualizer */}
                            <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                                className="w-16 h-16 bg-rose-500 border-[2.5px] border-black flex items-center justify-center rounded-full shadow-[3px_3px_0_#000]"
                            >
                                <Square className="w-6 h-6 text-white fill-white" />
                            </motion.div>
                            
                            <div className="flex flex-col items-center space-y-1">
                                <span className="text-xl font-black text-black leading-none">
                                    0:{seconds.toString().padStart(2, "0")} / 0:15
                                </span>
                                <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">
                                    SEDANG MEREKAM...
                                </span>
                            </div>

                            <button
                                onClick={stopRecording}
                                className="px-4 py-1.5 bg-white hover:bg-neutral-100 border-[2px] border-black text-[9px] font-black uppercase rounded-lg shadow-[2px_2px_0_#000] active:translate-y-px active:shadow-none transition-all"
                            >
                                Selesai
                            </button>
                        </div>
                    )}

                    {status === "preview" && (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={togglePlayback}
                                    className={`w-12 h-12 border-[2.5px] border-black shadow-[2.5px_2.5px_0_#000] active:translate-y-px active:shadow-none flex items-center justify-center rounded-full transition-all ${
                                        isPlaying ? "bg-[var(--mm-warning)]" : "bg-[var(--mm-success)]"
                                    }`}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 text-black fill-black" /> : <Play className="w-5 h-5 text-black fill-black ml-0.5" />}
                                </button>
                                <button
                                    onClick={resetRecording}
                                    className="w-12 h-12 bg-white hover:bg-neutral-100 border-[2.5px] border-black shadow-[2.5px_2.5px_0_#000] active:translate-y-px active:shadow-none flex items-center justify-center rounded-full transition-all"
                                >
                                    <RotateCcw className="w-5 h-5 text-black" />
                                </button>
                            </div>
                            
                            <div className="flex flex-col items-center space-y-0.5 mt-2">
                                <span className="text-xs font-black text-black">
                                    Balasan suara siap ({seconds} detik)
                                </span>
                                <span className="text-[9px] font-bold text-black/50 uppercase">
                                    Ketuk mainkan untuk meninjau
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Send / Cancel buttons */}
                {status === "preview" && (
                    <div className="w-full flex gap-3">
                        <button
                            onClick={resetRecording}
                            disabled={isUploading}
                            className="flex-1 py-2.5 px-4 bg-white hover:bg-neutral-100 border-[2.5px] border-black text-xs font-black uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleUploadAndSend}
                            disabled={isUploading}
                            className="flex-1 py-2.5 px-4 bg-[var(--mm-success)] border-[2.5px] border-black text-xs font-black uppercase rounded-xl shadow-[3px_3px_0_#000] active:translate-y-px active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    KIRIM...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Kirim
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
