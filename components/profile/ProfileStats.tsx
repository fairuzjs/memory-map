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
        { label: "Kenangan", value: countMemories, icon: MapPin, bg: "#00FFFF" },
        { label: "Pengikut", value: countFollowers, icon: Users, bg: "#FF00FF", onClick: onShowFollowers },
        { label: "Mengikuti", value: countFollowing, icon: UserCheck, bg: "#FFFF00", onClick: onShowFollowing },
    ]

    return (
        <div className="flex items-stretch gap-0 overflow-hidden w-full max-w-sm md:max-w-md mx-auto md:ml-auto md:mr-0 mb-6 bg-white border-[3px] border-black shadow-[4px_4px_0_#000]">
            {stats.map(({ label, value, icon: Icon, bg, onClick }, i, arr) => (
                <div 
                    key={label} 
                    onClick={onClick} 
                    className={`flex-1 flex flex-col items-center justify-center py-3 px-3 relative ${onClick ? 'cursor-pointer hover:brightness-95 transition-all' : ''}`}
                    style={{ background: bg }}
                >
                    {i < arr.length - 1 && <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-black" />}
                    <span className="text-lg sm:text-xl font-black text-black mb-0.5">{value}</span>
                    <div className="flex items-center gap-1">
                        <Icon className="w-2.5 h-2.5 text-black" />
                        <span className="text-[10px] font-black tracking-wider uppercase text-black">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
