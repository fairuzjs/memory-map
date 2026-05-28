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

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Spinner */}
                <svg className="w-14 h-14 text-black animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>

                {/* Text Box */}
                <div className="bg-[#cca01d] rounded-full border-[3px] border-black px-6 py-2.5 shadow-[4px_4px_0_#000]">
                    <p className="text-[15px] font-black text-black uppercase tracking-widest">
                        MEMUAT...
                    </p>
                </div>
            </div>
        </div>
    )
}
