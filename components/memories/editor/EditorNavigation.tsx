"use client"

import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface EditorNavigationProps {
    currentStep: number
    onBack: () => void
    onNext?: () => void
    isSubmitting: boolean
}

export function EditorNavigation({ currentStep, onBack, onNext, isSubmitting }: EditorNavigationProps) {
    return (
        <div className="flex justify-between items-center pt-2">
            {currentStep === 0 ? (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="hover:bg-white/5 rounded-xl px-6 text-neutral-400"
                >
                    Batal
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="hover:bg-white/5 rounded-xl px-6 text-neutral-400 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                    Kembali
                </Button>
            )}

            {currentStep === 0 ? (
                <Button
                    type="button"
                    onClick={onNext}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 shadow-lg shadow-indigo-500/25 transition-all group"
                >
                    Lanjutkan
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
            ) : (
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 shadow-lg shadow-indigo-500/25 transition-all group"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
            )}
        </div>
    )
}
