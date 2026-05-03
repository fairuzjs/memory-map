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
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00FFFF] border-[3px] border-black shadow-[3px_3px_0_#000] mb-4">
                    <BookText className="w-4 h-4 text-black" />
                    <span className="text-xs font-black text-black uppercase tracking-widest">Editor</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight">
                    Edit Kenangan
                </h1>
                <p className="text-neutral-500 text-sm font-bold mt-2 max-w-md mx-auto">
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
                                    flex items-center gap-2.5 px-4 py-2.5 border-[3px] border-black transition-all duration-200
                                    ${isActive
                                        ? "bg-[#FFFF00] text-black shadow-[4px_4px_0_#000]"
                                        : isCompleted
                                            ? "bg-[#00FF00] text-black shadow-[3px_3px_0_#000] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000]"
                                            : "bg-[#E5E5E5] text-neutral-400"
                                    }
                                `}
                            >
                                <div className={`
                                    w-7 h-7 flex items-center justify-center text-xs font-black transition-all border-[2px] border-black
                                    ${isActive
                                        ? "bg-black text-[#FFFF00]"
                                        : isCompleted
                                            ? "bg-black text-[#00FF00]"
                                            : "bg-white text-neutral-400"
                                    }
                                `}>
                                    {isCompleted ? "✓" : index + 1}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-black uppercase leading-tight">{step.label}</p>
                                    <p className={`text-[10px] leading-tight mt-0.5 font-bold ${isActive ? "text-black/60" : "text-neutral-500"}`}>
                                        {step.description}
                                    </p>
                                </div>
                            </button>
                            {index < STEPS.length - 1 && (
                                <div className={`w-6 h-[3px] ${currentStep > index ? "bg-black" : "bg-[#E5E5E5]"}`} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
