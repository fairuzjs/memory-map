import React from "react"
import { MapPin, Users, UserCheck } from "lucide-react"

interface ProfileStatsProps {
    countMemories: number
    countFollowers: number
    countFollowing: number
    onShowFollowers?: () => void
    onShowFollowing?: () => void
}

export function ProfileStats({ countMemories, countFollowers, countFollowing, onShowFollowers, onShowFollowing }: ProfileStatsProps) {
    const stats = [
        { label: "Kenangan", value: countMemories, icon: MapPin, color: "#818cf8" },
        { label: "Pengikut", value: countFollowers, icon: Users, color: "#f472b6", onClick: onShowFollowers },
        { label: "Mengikuti", value: countFollowing, icon: UserCheck, color: "#34d399", onClick: onShowFollowing },
    ]

    return (
        <div className="flex items-stretch gap-0 rounded-xl overflow-hidden w-full max-w-sm md:max-w-md mx-auto md:ml-auto md:mr-0 mb-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {stats.map(({ label, value, icon: Icon, color, onClick }, i, arr) => (
                <div 
                    key={label} 
                    onClick={onClick} 
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 relative ${onClick ? 'cursor-pointer hover:bg-white/5 transition-all' : ''}`}
                >
                    {i < arr.length - 1 && <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-white/10" />}
                    <span className="text-lg sm:text-xl font-black mb-0.5" style={{ color }}>{value}</span>
                    <div className="flex items-center gap-1">
                        <Icon className="w-2.5 h-2.5" style={{ color }} />
                        <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
