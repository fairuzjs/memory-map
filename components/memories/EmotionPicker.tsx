import { cn } from "@/lib/utils"

const emotions = [
    { id: "HAPPY", label: "Happy", icon: "🌟", bg: "bg-[#FFFF00]" },
    { id: "SAD", label: "Sad", icon: "💧", bg: "bg-[#00FFFF]" },
    { id: "NOSTALGIC", label: "Nostalgic", icon: "🕰️", bg: "bg-[#FFA500]" },
    { id: "EXCITED", label: "Excited", icon: "🔥", bg: "bg-[#FF3300]" },
    { id: "PEACEFUL", label: "Peaceful", icon: "🍃", bg: "bg-[#00FF00]" },
    { id: "GRATEFUL", label: "Grateful", icon: "🙏", bg: "bg-[#00FFCC]" },
    { id: "ROMANTIC", label: "Romantic", icon: "❤️", bg: "bg-[#FF00FF]" },
    { id: "ADVENTUROUS", label: "Adventurous", icon: "🏕️", bg: "bg-[#7B61FF]" },
]

interface EmotionPickerProps {
    value: string
    onChange: (value: string) => void
}

export function EmotionPicker({ value, onChange }: EmotionPickerProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {emotions.map((emotion) => {
                const isSelected = value === emotion.id
                return (
                    <button
                        key={emotion.id}
                        type="button"
                        onClick={() => onChange(emotion.id)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 border-[3px] border-black transition-all duration-200",
                            emotion.bg,
                            isSelected
                                ? "shadow-[4px_4px_0_#000] translate-x-[-2px] translate-y-[-2px] ring-0"
                                : "shadow-[2px_2px_0_#000] opacity-60 hover:opacity-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000]"
                        )}
                    >
                        <span className="text-2xl mb-1">{emotion.icon}</span>
                        <span className={cn(
                            "text-xs font-black uppercase tracking-wider",
                            emotion.id === "EXCITED" || emotion.id === "ROMANTIC" || emotion.id === "ADVENTUROUS"
                                ? "text-white"
                                : "text-black"
                        )}>{emotion.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
