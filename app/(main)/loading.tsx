"use client"

import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFDF0]">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: "linear-gradient(#00000015 1px, transparent 1px), linear-gradient(90deg, #00000015 1px, transparent 1px)",
                    backgroundSize: "32px 32px"
                }}
            />

            <div className="relative z-10 flex flex-col items-center">
                {/* Spinner Box */}
                <div className="w-20 h-20 bg-[#FFFF00] border-[4px] border-black flex items-center justify-center shadow-[8px_8px_0_#000] mb-6">
                    <Loader2 className="w-10 h-10 text-black animate-spin" />
                </div>

                {/* Text Box */}
                <div className="bg-white border-[4px] border-black px-6 py-2 shadow-[6px_6px_0_#000] transform -rotate-1">
                    <p className="text-lg font-black text-black uppercase tracking-[0.2em]">
                        Memuat...
                    </p>
                </div>
            </div>
        </div>
    )
}
