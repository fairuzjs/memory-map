"use client"

import { BookOpen } from "lucide-react"

interface GuideBookButtonProps {
    onClick: () => void
}

/** Desktop navbar button — hidden on mobile */
export function GuideBookButton({ onClick }: GuideBookButtonProps) {
    return (
        <button
            onClick={onClick}
            title="Buku Panduan"
            data-tutorial="nav-guide"
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-bold text-black hover:bg-[#00FF00] border-[2px] border-transparent hover:border-black transition-all"
        >
            <BookOpen className="w-4 h-4" />
            <span className="hidden lg:inline">Panduan</span>
        </button>
    )
}

/** Mobile sidebar/menu button */
export function GuideBookMobileButton({ onClick }: GuideBookButtonProps) {
    return (
        <button
            onClick={onClick}
            data-tutorial="mobile-nav-guide"
            className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold border-[3px] border-transparent transition-all text-black hover:bg-[#00FF00] hover:border-black text-left w-full"
            style={{ minHeight: 44 }}
        >
            <BookOpen className="w-5 h-5 shrink-0" />
            Buku Panduan
        </button>
    )
}
