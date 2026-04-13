"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Pause, Music } from "lucide-react"

interface PopupMiniPlayerProps {
    audioUrl: string
    startTime: number
    duration: number
    fileName: string
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
}

export function PopupMiniPlayer({ audioUrl, startTime, duration, fileName }: PopupMiniPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const endTime = startTime + duration

    const fadeAudio = useCallback((audio: HTMLAudioElement, targetVolume: number, durationMs: number = 800, onComplete?: () => void) => {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
        
        const startVolume = audio.volume
        const steps = 20
        const stepTime = durationMs / steps
        const volumeStep = (targetVolume - startVolume) / steps
        let currentStep = 0

        fadeIntervalRef.current = setInterval(() => {
            currentStep++
            const nextVol = startVolume + (volumeStep * currentStep)
            audio.volume = Math.max(0, Math.min(1, nextVol))
            
            if (currentStep >= steps) {
                if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current)
                    fadeIntervalRef.current = null
                }
                if (onComplete) onComplete()
            }
        }, stepTime)
    }, [])

    // Create audio element
    useEffect(() => {
        const audio = new Audio(audioUrl)
        audio.preload = "metadata"
        audioRef.current = audio

        audio.addEventListener("ended", () => {
            setIsPlaying(false)
            setIsPaused(false)
            setProgress(0)
        })

        const handleTimeUpdate = () => {
            if (!audio) return
            const ct = audio.currentTime
            const timeLeft = endTime - ct

            // Start fading out when 1 second is left
            if (timeLeft <= 1.0 && timeLeft > 0 && audio.volume > 0.1 && !fadeIntervalRef.current) {
                fadeAudio(audio, 0, 1000)
            }

            if (ct >= endTime) {
                if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current)
                    fadeIntervalRef.current = null
                }
                audio.pause()
                audio.currentTime = startTime
                setIsPlaying(false)
                setIsPaused(false)
                setProgress(0)
                audio.volume = 1 // reset
                return
            }

            const p = (ct - startTime) / duration
            setProgress(Math.max(0, Math.min(1, p)))
        }

        audio.addEventListener("timeupdate", handleTimeUpdate)

        return () => {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
            audio.pause()
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.src = ""
            audioRef.current = null
        }
    }, [audioUrl, startTime, endTime, duration])

    const handlePlayPause = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            // Fade out before pause
            setIsPlaying(false)
            setIsPaused(true)
            fadeAudio(audio, 0, 600, () => {
                audio.pause()
            })
        } else {
            // Play or resume with fade in
            if (!isPaused) {
                audio.currentTime = startTime
            }
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current)
                fadeIntervalRef.current = null
            }
            audio.volume = 0
            audio.play().catch(() => {})
            fadeAudio(audio, 1, 800)
            setIsPlaying(true)
            setIsPaused(false)
        }
    }

    const truncatedName = fileName.length > 20
        ? fileName.substring(0, 18) + "..."
        : fileName

    return (
        <div
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg mt-3 mb-1 cursor-default"
            style={{
                background: "rgba(168, 85, 247, 0.08)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
            }}
        >
            {/* Play/Pause button */}
            <button
                type="button"
                onClick={handlePlayPause}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                    background: isPlaying
                        ? "linear-gradient(135deg, #d946ef, #8b5cf6)"
                        : "linear-gradient(135deg, #a855f7, #7c3aed)",
                    boxShadow: isPlaying
                        ? "0 0 12px rgba(217, 70, 239, 0.4)"
                        : "0 2px 8px rgba(139, 92, 246, 0.3)",
                }}
            >
                {isPlaying ? (
                    <Pause className="w-3 h-3 text-white" />
                ) : (
                    <Play className="w-3 h-3 text-white ml-0.5" />
                )}
            </button>

            {/* Info + progress */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <Music className="w-3 h-3 shrink-0" style={{ color: "rgba(192, 132, 252, 0.8)" }} />
                    <span
                        className="text-[11px] font-medium truncate"
                        style={{ color: "rgba(192, 132, 252, 0.9)" }}
                    >
                        {truncatedName}
                    </span>
                </div>

                {/* Progress bar */}
                <div
                    className="mt-1.5 h-[3px] rounded-full overflow-hidden"
                    style={{ background: "rgba(168, 85, 247, 0.15)" }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-150 ease-linear"
                        style={{
                            width: `${progress * 100}%`,
                            background: "linear-gradient(90deg, #a855f7, #d946ef)",
                        }}
                    />
                </div>

                {/* Time */}
                <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] font-mono" style={{ color: "rgba(168, 85, 247, 0.5)" }}>
                        {formatTime(startTime)} — {formatTime(endTime)}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "rgba(168, 85, 247, 0.5)" }}>
                        {duration}s
                    </span>
                </div>
            </div>
        </div>
    )
}
