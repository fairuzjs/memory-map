"use client"

import React from "react"
import { ImageIcon } from "lucide-react"
import { getMemoryCover } from "@/lib/utils"

interface MemoryCoverProps {
    memory: any
    className?: string
}

const EMOTION_THEMES: Record<string, { icon: string; color: string; gradient: string }> = {
    HAPPY: { icon: "🌟", color: "#FFFF00", gradient: "linear-gradient(135deg, #FFFF00 0%, #FFF8D0 50%, #FFD700 100%)" },
    SAD: { icon: "💧", color: "#00FFFF", gradient: "linear-gradient(135deg, #00FFFF 0%, #E0FFFF 50%, #00BFFF 100%)" },
    NOSTALGIC: { icon: "🕰️", color: "#FF9900", gradient: "linear-gradient(135deg, #FF9900 0%, #FFE4B5 50%, #FF8C00 100%)" },
    EXCITED: { icon: "🔥", color: "#FF00FF", gradient: "linear-gradient(135deg, #FF00FF 0%, #FFE0FF 50%, #D800D8 100%)" },
    PEACEFUL: { icon: "🍃", color: "#00FF00", gradient: "linear-gradient(135deg, #00FF00 0%, #E8FEE8 50%, #00CD00 100%)" },
    GRATEFUL: { icon: "🙏", color: "#E5E5E5", gradient: "linear-gradient(135deg, #E5E5E5 0%, #F5F5F5 50%, #C0C0C0 100%)" },
    ROMANTIC: { icon: "❤️", color: "#FF3366", gradient: "linear-gradient(135deg, #FF3366 0%, #FFD0DA 50%, #E60045 100%)" },
    ADVENTUROUS: { icon: "🏕️", color: "#9900FF", gradient: "linear-gradient(135deg, #9900FF 0%, #E6D0FF 50%, #7A00CC 100%)" },
}

export function MemoryCover({ memory, className = "h-full w-full" }: MemoryCoverProps) {
    const coverUrl = getMemoryCover(memory)
    
    if (coverUrl) {
        return (
            <img
                src={coverUrl}
                alt={memory.title || "Memory cover"}
                className={`object-cover ${className}`}
                loading="lazy"
            />
        )
    }

    const emotionTheme = EMOTION_THEMES[memory.emotion]
    if (emotionTheme) {
        return (
            <div
                className={`relative flex items-center justify-center overflow-hidden bg-white ${className}`}
                style={{ background: emotionTheme.gradient }}
            >
                {/* Dot background texture to look scrapbook style */}
                <div 
                    className="absolute inset-0 opacity-20 pointer-events-none" 
                    style={{
                        backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1.5px, transparent 1.5px)",
                        backgroundSize: "8px 8px"
                    }}
                />
                <span className="relative z-10 text-lg sm:text-xl select-none filter drop-shadow-[1px_1.5px_0_rgba(0,0,0,0.85)] animate-[bounce_2s_infinite]">
                    {emotionTheme.icon}
                </span>
            </div>
        )
    }

    // Default neutral placeholder
    return (
        <div className={`relative flex items-center justify-center bg-[#E5E5E5] text-black ${className}`}>
            <div 
                className="absolute inset-0 opacity-25 pointer-events-none" 
                style={{
                    backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.1) 1.2px, transparent 1.2px)",
                    backgroundSize: "10px 10px"
                }}
            />
            <ImageIcon className="h-5 w-5 relative z-10 text-neutral-500/80" />
        </div>
    )
}
