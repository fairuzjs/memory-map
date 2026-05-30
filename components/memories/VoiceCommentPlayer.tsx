"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, Loader2 } from "lucide-react"

import type WaveSurfer from "wavesurfer.js"

interface VoiceCommentPlayerProps {
    voiceUrl: string
    durationSeconds?: number | null
}

interface WaveSurferInstance {
    on(event: string, callback: () => void): void
    getDuration(): number
    getCurrentTime(): number
    destroy(): void
    play(): Promise<void> | void
    pause(): void
}

export function VoiceCommentPlayer({ voiceUrl, durationSeconds }: VoiceCommentPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(durationSeconds || 0)
    const [isLoaded, setIsLoaded] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        let ws: WaveSurfer | null = null

        const initWaveSurfer = async () => {
            try {
                // Dynamically import WaveSurfer to prevent SSR issues in Next.js
                const WaveSurferModule = (await import("wavesurfer.js")).default

                const activeWs = WaveSurferModule.create({
                    container: containerRef.current!,
                    waveColor: "#A3A3A3", // neutral grey
                    progressColor: "#FF00FF", // neon pink
                    cursorColor: "transparent",
                    barWidth: 2,
                    barGap: 2,
                    height: 24,
                    barRadius: 1.5,
                    normalize: true,
                    url: voiceUrl
                }) as unknown as WaveSurferInstance

                ws = activeWs as unknown as WaveSurfer
                wavesurferRef.current = activeWs as unknown as WaveSurfer

                activeWs.on("ready", () => {
                    setIsLoaded(true)
                    const audioDuration = activeWs.getDuration()
                    setDuration(Math.round(audioDuration))
                })

                activeWs.on("audioprocess", () => {
                    setCurrentTime(Math.round(activeWs.getCurrentTime()))
                })

                activeWs.on("seek", () => {
                    setCurrentTime(Math.round(activeWs.getCurrentTime()))
                })

                activeWs.on("finish", () => {
                    setIsPlaying(false)
                    setCurrentTime(0)
                })

                activeWs.on("play", () => setIsPlaying(true))
                activeWs.on("pause", () => setIsPlaying(false))

            } catch (err) {
                console.error("WaveSurfer initialization failed:", err)
            }
        }

        initWaveSurfer()

        return () => {
            if (ws) {
                try {
                    ws.destroy()
                } catch (e) {
                    console.error("WaveSurfer destroy failed:", e)
                }
                wavesurferRef.current = null
            }
        }
    }, [voiceUrl])

    const togglePlay = () => {
        const ws = wavesurferRef.current
        if (!ws || !isLoaded) return

        if (isPlaying) {
            ws.pause()
        } else {
            ws.play()
        }
    }

    const formatTime = (timeInSecs: number) => {
        const mins = Math.floor(timeInSecs / 60)
        const secs = Math.floor(timeInSecs % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className="flex items-center gap-2.5 p-1.5 bg-[#F5F5F4] border-[2px] border-black shadow-[2px_2px_0_#000] rounded-xl max-w-sm w-full my-1 relative overflow-hidden">
            {/* Play/Pause Neubrutalist Control */}
            <button
                type="button"
                onClick={togglePlay}
                disabled={!isLoaded}
                className={`w-8 h-8 border-[2px] border-black shadow-[1.5px_1.5px_0_#000] active:translate-y-px active:shadow-none flex items-center justify-center rounded-full shrink-0 transition-all ${
                    !isLoaded
                        ? "bg-neutral-200"
                        : isPlaying
                            ? "bg-[var(--mm-warning)]"
                            : "bg-[var(--mm-success)]"
                }`}
            >
                {!isLoaded ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                ) : isPlaying ? (
                    <Pause className="w-3.5 h-3.5 text-black fill-black" />
                ) : (
                    <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                )}
            </button>

            {/* Waveform Container */}
            <div className="flex-1 min-w-0 flex items-center">
                <div ref={containerRef} className="w-full h-6 overflow-hidden" />
            </div>

            {/* Time Display */}
            <div className="shrink-0 pr-1 text-[9px] font-black text-black/60 font-mono tracking-wider">
                {formatTime(currentTime)} / {formatTime(duration)}
            </div>
        </div>
    )
}
