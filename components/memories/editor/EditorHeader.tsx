"use client"

import { BookText, ChevronRight, ImagePlus } from "lucide-react"

interface EditorHeaderProps {
    currentStep: number
    setCurrentStep: (step: number) => void
    setDirection: (dir: number) => void
}

const STEPS = [
    { label: "Detail", icon: BookText, description: "Ceritakan momen Anda" },
    { label: "Media", icon: ImagePlus, description: "Tambahkan media & pengaturan" },
]

export function EditorHeader({ currentStep, setCurrentStep, setDirection }: EditorHeaderProps) {
    return (
        <div className="mb-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold font-[Outfit] mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 via-indigo-100 to-indigo-300">
                    Edit Kenangan
                </h1>
                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                    Sesuaikan detail momen berharga Anda.
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mb-10">
                {STEPS.map((step, index) => {
                    const Icon = step.icon
                    const isActive = currentStep === index
                    const isCompleted = currentStep > index
                    return (
                        <div key={index} className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (index < currentStep) {
                                        setDirection(-1)
                                        setCurrentStep(index)
                                    }
                                }}
                                className={`
                                    flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300
                                    ${isActive
                                        ? "bg-indigo-500/15 border border-indigo-500/30 text-white shadow-lg shadow-indigo-500/10"
                                        : isCompleted
                                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/15"
                                            : "bg-neutral-900/40 border border-white/5 text-neutral-500"
                                    }
                                `}
                            >
                                <div className={`
                                    w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                    ${isActive
                                        ? "bg-indigo-500 text-white"
                                        : isCompleted
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-neutral-800 text-neutral-500"
                                    }
                                `}>
                                    {isCompleted ? "✓" : index + 1}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-medium leading-tight">{step.label}</p>
                                    <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-indigo-300/70" : "text-neutral-600"}`}>
                                        {step.description}
                                    </p>
                                </div>
                            </button>
                            {index < STEPS.length - 1 && (
                                <ChevronRight className={`w-4 h-4 ${currentStep > index ? "text-emerald-500/50" : "text-neutral-700"}`} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
