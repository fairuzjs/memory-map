"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Music, Upload, X, Play, Pause, Square, Loader2, RotateCcw, PencilLine } from "lucide-react"
import toast from "react-hot-toast"

export interface AudioClipData {
    url: string
    bucket: string
    path: string
    startTime: number
    duration: number
    fileName: string
}

interface MusicUploaderProps {
    value: AudioClipData | null | undefined
    onChange: (data: AudioClipData | null) => void
    isPublic: boolean
}

const DURATION_OPTIONS = [
    { value: 10, label: "10s" },
    { value: 15, label: "15s" },
    { value: 30, label: "30s" },
]

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
}

export function MusicUploader({ value, onChange, isPublic }: MusicUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(value?.url ?? null)
    const [uploadedData, setUploadedData] = useState<{ url: string; bucket: string; path: string } | null>(
        value ? { url: value.url, bucket: value.bucket, path: value.path } : null
    )
    const [fileName, setFileName] = useState<string>(value?.fileName ?? "")
    const [totalDuration, setTotalDuration] = useState(0)
    const [selectedDuration, setSelectedDuration] = useState<number>(value?.duration ?? 15)
    const [startTime, setStartTime] = useState<number>(value?.startTime ?? 0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playProgress, setPlayProgress] = useState(0)
    const [waveformReady, setWaveformReady] = useState(false)
    const [loopEnabled, setLoopEnabled] = useState(false)

    const waveformRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const animationRef = useRef<number | null>(null)

    // Initialize wavesurfer when audio is available
    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return

        let destroyed = false
        let ws: any = null

        const initWavesurfer = async () => {
            const WaveSurfer = (await import("wavesurfer.js")).default

            // If cleanup already ran while we were importing, bail out
            if (destroyed) return

            ws = WaveSurfer.create({
                container: waveformRef.current!,
                waveColor: "rgba(129, 140, 248, 0.4)",
                progressColor: "rgba(192, 132, 252, 0.8)",
                cursorColor: "rgba(232, 121, 249, 0.9)",
                cursorWidth: 2,
                barWidth: 3,
                barGap: 2,
                barRadius: 3,
                height: 80,
                normalize: true,
                interact: false,
            })

            // Guard again after create — cleanup may have fired
            if (destroyed) {
                ws.destroy()
                return
            }

            ws.load(audioUrl)

            ws.on("ready", () => {
                if (destroyed) return
                const dur = ws.getDuration()
                setTotalDuration(dur)
                setWaveformReady(true)

                // Adjust start time and duration if needed
                if (startTime + selectedDuration > dur) {
                    const newStart = Math.max(0, dur - selectedDuration)
                    setStartTime(newStart)
                }
            })

            // NOTE: audioprocess handler is managed separately in the second useEffect
            // to avoid stale closure issues with startTime/selectedDuration/loopEnabled

            ws.on("finish", () => {
                if (destroyed) return
                setIsPlaying(false)
                setPlayProgress(0)
            })

            wavesurferRef.current = ws
        }

        initWavesurfer()

        return () => {
            destroyed = true
            if (ws) {
                try { ws.destroy() } catch {}
            }
            wavesurferRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl])

    // Update loopEnabled and selectedDuration behavior in playback
    useEffect(() => {
        const ws = wavesurferRef.current
        if (!ws || !waveformReady) return

        let removed = false

        const handleAudioProcess = () => {
            if (removed) return
            try {
                const currentTime = ws.getCurrentTime()
                const endTime = startTime + selectedDuration
                if (currentTime >= endTime) {
                    if (loopEnabled) {
                        ws.seekTo(startTime / totalDuration)
                        ws.play()
                    } else {
                        ws.pause()
                        setIsPlaying(false)
                        setPlayProgress(1)
                    }
                } else {
                    const progress = (currentTime - startTime) / selectedDuration
                    setPlayProgress(Math.max(0, Math.min(1, progress)))
                }
            } catch {}
        }

        ws.un("audioprocess", handleAudioProcess)
        ws.on("audioprocess", handleAudioProcess)

        return () => {
            removed = true
            try { ws.un("audioprocess", handleAudioProcess) } catch {}
        }
    }, [startTime, selectedDuration, loopEnabled, totalDuration, waveformReady])

    // Emit changes to parent form
    useEffect(() => {
        if (uploadedData && waveformReady) {
            onChange({
                url: uploadedData.url,
                bucket: uploadedData.bucket,
                path: uploadedData.path,
                startTime,
                duration: selectedDuration,
                fileName,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTime, selectedDuration, uploadedData, waveformReady, fileName])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (file.type !== "audio/mpeg") {
            toast.error("Hanya file MP3 yang diizinkan")
            return
        }

        // Validate file size (4MB limit for Vercel Hobby tier)
        if (file.size > 4 * 1024 * 1024) {
            toast.error("Ukuran file melebihi batas 4MB")
            return
        }

        setAudioFile(file)
        setFileName(file.name)
        setWaveformReady(false)
        setStartTime(0)
        setPlayProgress(0)
        setIsPlaying(false)

        // Create local preview URL for waveform
        const localUrl = URL.createObjectURL(file)
        setAudioUrl(localUrl)

        // Upload to server
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("isPublic", isPublic ? "true" : "false")

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Upload gagal")
            }
            const data = await res.json()
            setUploadedData({
                url: data.url || data.path,
                bucket: data.bucket,
                path: data.path,
            })
            toast.success("Audio berhasil diupload!")
        } catch (err: any) {
            toast.error(err.message || "Gagal mengupload audio")
            handleRemove()
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleRemove = () => {
        if (wavesurferRef.current) {
            try { wavesurferRef.current.destroy() } catch {}
            wavesurferRef.current = null
        }
        if (audioUrl && audioUrl.startsWith("blob:")) {
            URL.revokeObjectURL(audioUrl)
        }
        setAudioFile(null)
        setAudioUrl(null)
        setUploadedData(null)
        setFileName("")
        setTotalDuration(0)
        setStartTime(0)
        setPlayProgress(0)
        setIsPlaying(false)
        setWaveformReady(false)
        onChange(null)
    }

    const handlePlay = () => {
        const ws = wavesurferRef.current
        if (!ws) return
        ws.seekTo(startTime / totalDuration)
        ws.play()
        setIsPlaying(true)
    }

    const handlePause = () => {
        const ws = wavesurferRef.current
        if (!ws) return
        ws.pause()
        setIsPlaying(false)
    }

    const handleStop = () => {
        const ws = wavesurferRef.current
        if (!ws) return
        ws.pause()
        ws.seekTo(startTime / totalDuration)
        setIsPlaying(false)
        setPlayProgress(0)
    }

    const handleDurationChange = (dur: number) => {
        setSelectedDuration(dur)
        // Clamp startTime if needed
        if (startTime + dur > totalDuration) {
            setStartTime(Math.max(0, totalDuration - dur))
        }
        handleStop()
    }

    // Region click handler — set startTime based on click position on waveform
    const handleRegionDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!waveformRef.current || !totalDuration) return
        const rect = waveformRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const ratio = x / rect.width
        const newStart = Math.max(0, Math.min(ratio * totalDuration, totalDuration - selectedDuration))
        setStartTime(newStart)
        // Stop playback when repositioning
        const ws = wavesurferRef.current
        if (ws && isPlaying) {
            ws.pause()
            setIsPlaying(false)
        }
        setPlayProgress(0)
    }

    const hasAudio = audioUrl !== null

    const endTime = startTime + selectedDuration
    const regionLeftPercent = totalDuration > 0 ? (startTime / totalDuration) * 100 : 0
    const regionWidthPercent = totalDuration > 0 ? (selectedDuration / totalDuration) * 100 : 0

    return (
        <div className="space-y-4">
            {!hasAudio ? (
                /* ── Upload Zone ────────────────────────────────── */
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-700 rounded-xl bg-neutral-900/50 hover:bg-neutral-800/60 hover:border-fuchsia-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin mb-2" />
                    ) : (
                        <div className="relative mb-2">
                            <div className="absolute inset-0 bg-fuchsia-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Upload className="w-8 h-8 text-neutral-400 group-hover:text-fuchsia-400 transition-colors relative" />
                        </div>
                    )}
                    <span className="text-sm font-medium text-neutral-300 group-hover:text-fuchsia-300 transition-colors">
                        {isUploading ? "Mengupload..." : "Klik untuk upload MP3"}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">Format: MP3 · Maks 4MB</span>
                </button>
            ) : (
                /* ── Waveform + Controls ────────────────────────── */
                <div className="space-y-4">
                    {/* File Info Bar */}
                    <div className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-3 border border-white/[0.05]">
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                            <div className="w-9 h-9 rounded-lg bg-fuchsia-500/15 flex items-center justify-center shrink-0">
                                <Music className="w-4 h-4 text-fuchsia-400" />
                            </div>
                            <div className="min-w-0 flex-1 group/input">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent focus:border-fuchsia-500/50 p-0 text-sm font-medium text-neutral-200 focus:ring-0 focus:outline-none transition-colors truncate"
                                        placeholder="Nama lagu..."
                                    />
                                    <PencilLine className="w-3.5 h-3.5 text-neutral-500 shrink-0 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {totalDuration > 0 ? `${formatTime(totalDuration)} total` : "Memuat..."}
                                    {isUploading && " · Uploading..."}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group/rm shrink-0"
                            title="Hapus audio"
                        >
                            <X className="w-4 h-4 text-neutral-500 group-hover/rm:text-red-400 transition-colors" />
                        </button>
                    </div>

                    {/* Waveform Container */}
                    <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/[0.05] p-3">
                        {/* Waveform */}
                        <div
                            ref={waveformRef}
                            className="relative z-10 cursor-pointer"
                            onClick={handleRegionDrag}
                        />

                        {/* Region Overlay */}
                        {waveformReady && totalDuration > 0 && (
                            <div
                                className="absolute top-0 bottom-0 z-20 pointer-events-none rounded-lg"
                                style={{
                                    left: `calc(${regionLeftPercent}% + 12px)`,
                                    width: `${regionWidthPercent}%`,
                                    background: "linear-gradient(180deg, rgba(192, 132, 252, 0.15) 0%, rgba(232, 121, 249, 0.1) 100%)",
                                    borderLeft: "2px solid rgba(192, 132, 252, 0.7)",
                                    borderRight: "2px solid rgba(192, 132, 252, 0.7)",
                                    boxShadow: "inset 0 0 20px rgba(192, 132, 252, 0.1)",
                                }}
                            >
                                {/* Progress fill within region */}
                                <div
                                    className="absolute inset-y-0 left-0 bg-fuchsia-500/10 transition-all duration-100"
                                    style={{ width: `${playProgress * 100}%` }}
                                />
                                {/* Start label */}
                                <span className="absolute -top-0 left-1 text-[9px] font-bold text-violet-400/80 tracking-wider">
                                    {formatTime(startTime)}
                                </span>
                                {/* End label */}
                                <span className="absolute -top-0 right-1 text-[9px] font-bold text-violet-400/80 tracking-wider">
                                    {formatTime(endTime)}
                                </span>
                            </div>
                        )}

                        {/* Loading overlay */}
                        {!waveformReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin" />
                                    <span className="text-xs text-neutral-400">Memuat waveform...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scrubber Slider */}
                    {waveformReady && totalDuration > 0 && (
                        <div className="px-1">
                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, totalDuration - selectedDuration)}
                                step={0.1}
                                value={startTime}
                                onChange={(e) => {
                                    setStartTime(parseFloat(e.target.value))
                                    handleStop()
                                }}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-800
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-400
                                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(232,121,249,0.5)]
                                    [&::-webkit-slider-thumb]:hover:bg-fuchsia-300 [&::-webkit-slider-thumb]:transition-colors
                                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                                    [&::-moz-range-thumb]:bg-fuchsia-400 [&::-moz-range-thumb]:border-0"
                            />
                            <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                                <span>Mulai: {formatTime(startTime)}</span>
                                <span>Akhir: {formatTime(endTime)}</span>
                            </div>
                        </div>
                    )}

                    {/* Duration + Controls Row */}
                    {waveformReady && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            {/* Duration Pills */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500 mr-1 hidden sm:inline">Durasi:</span>
                                {DURATION_OPTIONS.map((opt) => {
                                    // Hide options longer than total duration
                                    if (opt.value > totalDuration) return null
                                    const isActive = selectedDuration === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleDurationChange(opt.value)}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                                                isActive
                                                    ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,0.15)]"
                                                    : "bg-neutral-900/50 border-neutral-700/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Playback Controls */}
                            <div className="flex items-center gap-2">
                                {/* Loop toggle */}
                                <button
                                    type="button"
                                    onClick={() => setLoopEnabled(!loopEnabled)}
                                    className={`p-2 rounded-lg border transition-all ${
                                        loopEnabled
                                            ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                                            : "bg-neutral-900/50 border-neutral-700/50 text-neutral-500 hover:text-neutral-300"
                                    }`}
                                    title={loopEnabled ? "Loop aktif" : "Loop nonaktif"}
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                {/* Stop */}
                                <button
                                    type="button"
                                    onClick={handleStop}
                                    className="p-2 rounded-lg border bg-neutral-900/50 border-neutral-700/50 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all"
                                    title="Stop"
                                >
                                    <Square className="w-3.5 h-3.5" />
                                </button>

                                {/* Play / Pause */}
                                <button
                                    type="button"
                                    onClick={isPlaying ? handlePause : handlePlay}
                                    className="relative p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-105 active:scale-95 transition-all"
                                    title={isPlaying ? "Pause" : "Play preview"}
                                >
                                    <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4 relative" />
                                    ) : (
                                        <Play className="w-4 h-4 relative ml-0.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/mpeg,.mp3"
                className="hidden"
            />
        </div>
    )
}
