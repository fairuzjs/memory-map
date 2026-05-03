"use client"

import { PREMIUM_MARKER_STYLES } from "@/components/map/MapIcons"
import { Crown, Lock } from "lucide-react"

interface MarkerStylePickerProps {
    value: string | null | undefined
    onChange: (value: string | null) => void
    isPremium: boolean
}

export function MarkerStylePicker({ value, onChange, isPremium }: MarkerStylePickerProps) {
    if (!isPremium) {
        return (
            <div className="bg-white p-5 sm:p-6 border-[3px] border-black shadow-[4px_4px_0_#000] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#FFFF00] border-[2px] border-black shadow-[2px_2px_0_#000]">
                        <Crown className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-black uppercase">Map Marker</h2>
                        <p className="text-[11px] text-neutral-500 font-bold">Gaya marker eksklusif di peta</p>
                    </div>
                </div>
                {/* Locked preview */}
                <div className="flex items-center gap-2 opacity-30 pointer-events-none select-none">
                    {PREMIUM_MARKER_STYLES.map(style => (
                        <div
                            key={style.id}
                            className={`w-7 h-7 shrink-0 border-[2px] border-black ${style.shape !== "circle" ? `pm-shape-${style.shape}` : "rounded-full"}`}
                            style={{
                                background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`,
                            }}
                        />
                    ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000]">
                        <Lock className="w-3.5 h-3.5 text-black" />
                        <span className="text-xs font-black text-black uppercase">Fitur Premium</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-5 sm:p-6 border-[3px] border-black shadow-[4px_4px_0_#000]">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-[#FFFF00] border-[2px] border-black shadow-[2px_2px_0_#000]">
                    <Crown className="w-4 h-4 text-black" />
                </div>
                <div>
                    <h2 className="text-sm font-black text-black uppercase">Map Marker</h2>
                    <p className="text-[11px] text-neutral-500 font-bold">Pilih gaya marker — preview langsung terlihat di peta atas</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* Default option */}
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className={`group flex flex-col items-center gap-1.5 px-3 py-2.5 border-[3px] border-black transition-all duration-200 shrink-0 ${
                        !value
                            ? "bg-[#00FFFF] shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]"
                            : "bg-[#E5E5E5] hover:bg-[#D5D5D5]"
                    }`}
                >
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 border-[2px] border-black flex items-center justify-center">
                            <span className="text-sm">📍</span>
                        </div>
                        {!value && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-black flex items-center justify-center">
                                <svg className="w-2 h-2 text-[#00FF00]" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        )}
                    </div>
                    <span className={`text-[10px] font-black uppercase leading-tight ${!value ? "text-black" : "text-neutral-500"}`}>
                        Default
                    </span>
                </button>

                {PREMIUM_MARKER_STYLES.map(style => {
                    const isSelected = value === style.id
                    const shapeClass = style.shape !== "circle" ? `pm-shape-${style.shape}` : "rounded-full"

                    return (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => onChange(style.id)}
                            className={`group flex flex-col items-center gap-1.5 px-3 py-2.5 border-[3px] border-black transition-all duration-200 shrink-0 ${
                                isSelected
                                    ? "bg-[#FFFF00] shadow-[3px_3px_0_#000] translate-x-[-1px] translate-y-[-1px]"
                                    : "bg-[#E5E5E5] hover:bg-[#D5D5D5]"
                            }`}
                        >
                            <div className="relative">
                                <div
                                    className={`relative w-8 h-8 ${shapeClass} transition-transform duration-200 group-hover:scale-110 ${isSelected ? "scale-110" : ""}`}
                                    style={{
                                        background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`,
                                        border: `2px solid ${style.borderColor}`,
                                        boxShadow: isSelected ? `0 0 14px ${style.glowColor}` : `0 2px 6px rgba(0,0,0,0.3)`,
                                    }}
                                >
                                    {/* Inner shine */}
                                    <div
                                        className={`absolute inset-[2px] opacity-25 ${shapeClass}`}
                                        style={{ background: `radial-gradient(circle at 35% 35%, white, transparent 60%)` }}
                                    />
                                </div>
                                {isSelected && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-black flex items-center justify-center">
                                        <svg className="w-2 h-2 text-[#FFFF00]" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[10px] font-black uppercase leading-tight whitespace-nowrap ${isSelected ? "text-black" : "text-neutral-500"}`}>
                                {style.name}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
