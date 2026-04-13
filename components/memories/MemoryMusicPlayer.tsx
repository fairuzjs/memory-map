"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react"

interface MemoryMusicPlayerProps {
    audioUrl: string
    startTime: number
    duration: number
    fileName: string
    autoPlay?: boolean
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
}

export function MemoryMusicPlayer({
    audioUrl,
    startTime,
    duration,
    fileName,
    autoPlay = true,
}: MemoryMusicPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [waveformReady, setWaveformReady] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [hasAutoPlayed, setHasAutoPlayed] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    const waveformRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<any>(null)
    const clipBlobRef = useRef<Blob | null>(null)

    const endTime = startTime + duration

    // Extract clip portion and initialize wavesurfer with only that portion
    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return

        let destroyed = false
        let ws: any = null

        const initPlayer = async () => {
            // 1. Fetch the full audio and decode it
            const response = await fetch(audioUrl)
            if (destroyed) return
            const arrayBuffer = await response.arrayBuffer()
            if (destroyed) return

            const audioCtx = new AudioContext()
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
            if (destroyed) return

            // 2. Extract only the clip portion (startTime → endTime)
            const sampleRate = audioBuffer.sampleRate
            const channels = audioBuffer.numberOfChannels
            const clipStart = Math.floor(startTime * sampleRate)
            const clipEnd = Math.min(Math.floor(endTime * sampleRate), audioBuffer.length)
            const clipLength = clipEnd - clipStart

            const clipBuffer = audioCtx.createBuffer(channels, clipLength, sampleRate)
            for (let ch = 0; ch < channels; ch++) {
                const fullData = audioBuffer.getChannelData(ch)
                const clipData = clipBuffer.getChannelData(ch)
                for (let i = 0; i < clipLength; i++) {
                    clipData[i] = fullData[clipStart + i]
                }
            }

            // 3. Encode clip buffer to WAV blob
            const wavBlob = audioBufferToWavBlob(clipBuffer)
            clipBlobRef.current = wavBlob
            if (destroyed) return

            await audioCtx.close()

            // 4. Initialize wavesurfer with the clip blob
            const WaveSurfer = (await import("wavesurfer.js")).default
            if (destroyed) return

            ws = WaveSurfer.create({
                container: waveformRef.current!,
                waveColor: "rgba(192, 132, 252, 0.35)",
                progressColor: "rgba(232, 121, 249, 0.75)",
                cursorColor: "rgba(232, 121, 249, 0.6)",
                cursorWidth: 2,
                barWidth: 2,
                barGap: 1.5,
                barRadius: 2,
                height: 36,
                normalize: true,
                interact: false,
            })

            if (destroyed) {
                ws.destroy()
                return
            }

            ws.loadBlob(wavBlob)

            ws.on("ready", () => {
                if (destroyed) return
                setWaveformReady(true)
                wavesurferRef.current = ws

                // Auto-play on load
                if (autoPlay && !hasAutoPlayed) {
                    ws.play()
                    setIsPlaying(true)
                    setHasAutoPlayed(true)
                }
            })

            ws.on("audioprocess", () => {
                if (destroyed) return
                const ct = ws.getCurrentTime()
                const clipDuration = ws.getDuration()
                setElapsedTime(ct)

                if (ct >= clipDuration - 0.05) {
                    ws.pause()
                    ws.seekTo(0)
                    setIsPlaying(false)
                    setIsPaused(false)
                    setProgress(0)
                    setElapsedTime(0)
                    return
                }

                const p = ct / clipDuration
                setProgress(Math.max(0, Math.min(1, p)))
            })

            ws.on("finish", () => {
                if (destroyed) return
                setIsPlaying(false)
                setIsPaused(false)
                setProgress(0)
                setElapsedTime(0)
            })
        }

        initPlayer()

        return () => {
            destroyed = true
            if (ws) {
                try { ws.destroy() } catch {}
            }
            wavesurferRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, startTime, duration])

    // Play from start or resume from pause
    const handlePlay = useCallback(() => {
        const ws = wavesurferRef.current
        if (!ws) return

        if (isPaused) {
            // Resume from current position
            ws.play()
        } else {
            // Fresh play from start
            ws.seekTo(0)
            ws.play()
        }
        setIsPlaying(true)
        setIsPaused(false)
    }, [isPaused])

    const handlePause = useCallback(() => {
        const ws = wavesurferRef.current
        if (!ws) return
        ws.pause()
        setIsPlaying(false)
        setIsPaused(true)
    }, [])

    const handleStop = useCallback(() => {
        const ws = wavesurferRef.current
        if (!ws) return
        ws.pause()
        ws.seekTo(0)
        setIsPlaying(false)
        setIsPaused(false)
        setProgress(0)
        setElapsedTime(0)
    }, [])

    const toggleMute = useCallback(() => {
        const ws = wavesurferRef.current
        if (!ws) return
        ws.setMuted(!isMuted)
        setIsMuted(!isMuted)
    }, [isMuted])

    // Animated equalizer bars
    const EqualizerBars = () => (
        <div className="flex items-end gap-[2px] h-4">
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full bg-fuchsia-400"
                    style={{
                        height: isPlaying ? undefined : "4px",
                        animation: isPlaying
                            ? `equalizer ${0.4 + i * 0.15}s ease-in-out infinite alternate`
                            : "none",
                    }}
                />
            ))}
        </div>
    )

    return (
        <>
            {/* Inline keyframes for equalizer animation */}
            <style jsx>{`
                @keyframes equalizer {
                    0% { height: 4px; }
                    100% { height: 16px; }
                }
            `}</style>

            <div className="bg-neutral-900/70 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-fuchsia-500/20">
                        <EqualizerBars />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-neutral-200 truncate">{fileName}</p>
                        <p className="text-[11px] text-neutral-500">
                            {formatTime(startTime)} — {formatTime(endTime)} · {duration}s klip
                        </p>
                    </div>
                    <button
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <VolumeX className="w-4 h-4 text-neutral-500" />
                        ) : (
                            <Volume2 className="w-4 h-4 text-neutral-400" />
                        )}
                    </button>
                </div>

                {/* Waveform — shows only the clip portion */}
                <div className="px-4 py-2 relative">
                    <div ref={waveformRef} className="opacity-90" />

                    {/* Progress overlay on waveform */}
                    {waveformReady && (
                        <div className="absolute bottom-2 left-4 right-4 h-[2px] bg-neutral-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-150 ease-linear"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                    )}

                    {!waveformReady && (
                        <div className="flex items-center justify-center h-9">
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-fuchsia-500/40 animate-pulse"
                                        style={{ animationDelay: `${i * 150}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-4 pb-4 pt-1">
                    {/* Time display */}
                    <span className="text-[11px] font-mono text-neutral-500 tabular-nums w-16">
                        {formatTime(elapsedTime)} / {formatTime(duration)}
                    </span>

                    {/* Buttons */}
                    <div className="flex items-center gap-1.5">
                        {/* Stop */}
                        <button
                            onClick={handleStop}
                            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-all"
                            title="Stop"
                        >
                            <Square className="w-3.5 h-3.5" />
                        </button>

                        {/* Play / Pause */}
                        <button
                            onClick={isPlaying ? handlePause : handlePlay}
                            className="relative p-2.5 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/35 hover:scale-105 active:scale-95 transition-all"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Spacer for symmetry */}
                    <div className="w-16" />
                </div>
            </div>
        </>
    )
}

/**
 * Convert an AudioBuffer to a WAV Blob for wavesurfer to render
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const length = buffer.length
    const bytesPerSample = 2
    const blockAlign = numChannels * bytesPerSample
    const dataSize = length * blockAlign
    const headerSize = 44
    const totalSize = headerSize + dataSize

    const arrayBuffer = new ArrayBuffer(totalSize)
    const view = new DataView(arrayBuffer)

    // RIFF header
    writeString(view, 0, "RIFF")
    view.setUint32(4, totalSize - 8, true)
    writeString(view, 8, "WAVE")

    // fmt chunk
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true) // chunk size
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true) // byte rate
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true) // bits per sample

    // data chunk
    writeString(view, 36, "data")
    view.setUint32(40, dataSize, true)

    // Interleave samples
    let offset = 44
    for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = buffer.getChannelData(ch)[i]
            const clamped = Math.max(-1, Math.min(1, sample))
            view.setInt16(offset, clamped * 0x7fff, true)
            offset += 2
        }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" })
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
    }
}
