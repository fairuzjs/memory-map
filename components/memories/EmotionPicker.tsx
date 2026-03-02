import { cn } from "@/lib/utils"

const emotions = [
    { id: "HAPPY", label: "Happy", icon: "🌟", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20" },
    { id: "SAD", label: "Sad", icon: "💧", color: "bg-blue-500/10 text-blue-500 border-blue-500/50 hover:bg-blue-500/20" },
    { id: "NOSTALGIC", label: "Nostalgic", icon: "🕰️", color: "bg-amber-600/10 text-amber-500 border-amber-600/50 hover:bg-amber-600/20" },
    { id: "EXCITED", label: "Excited", icon: "🔥", color: "bg-orange-500/10 text-orange-500 border-orange-500/50 hover:bg-orange-500/20" },
    { id: "PEACEFUL", label: "Peaceful", icon: "🍃", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20" },
    { id: "GRATEFUL", label: "Grateful", icon: "🙏", color: "bg-teal-500/10 text-teal-500 border-teal-500/50 hover:bg-teal-500/20" },
    { id: "ROMANTIC", label: "Romantic", icon: "❤️", color: "bg-rose-500/10 text-rose-500 border-rose-500/50 hover:bg-rose-500/20" },
    { id: "ADVENTUROUS", label: "Adventurous", icon: "🏕️", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/50 hover:bg-indigo-500/20" },
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
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                            emotion.color,
                            isSelected ? "border-opacity-100 ring-2 ring-offset-2 ring-offset-neutral-900 ring-indigo-500 scale-105" : "border-opacity-20 hover:border-opacity-100 opacity-60 hover:opacity-100"
                        )}
                    >
                        <span className="text-2xl mb-1">{emotion.icon}</span>
                        <span className="text-xs font-semibold">{emotion.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
