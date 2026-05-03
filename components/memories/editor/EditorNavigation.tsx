"use client"

import { ArrowLeft, ArrowRight, Save } from "lucide-react"

interface EditorNavigationProps {
    currentStep: number
    onBack: () => void
    onNext?: () => void
    isSubmitting: boolean
}

export function EditorNavigation({ currentStep, onBack, onNext, isSubmitting }: EditorNavigationProps) {
    return (
        <div className="flex justify-between items-center pt-4 mt-6 border-t-[3px] border-dashed border-black/20">
            {currentStep === 0 ? (
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                >
                    Batal
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-black uppercase bg-white border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>
            )}

            {currentStep === 0 ? (
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-black uppercase bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all"
                >
                    Lanjutkan
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-2.5 text-sm font-black text-black uppercase bg-[#00FF00] border-[3px] border-black shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            )}
        </div>
    )
}
