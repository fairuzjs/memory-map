import Link from "next/link"
import { MapPin, Map } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-neutral-950 px-4 text-center">
            <div className="w-24 h-24 bg-indigo-600/10 rounded-3xl flex items-center justify-center rotate-12 mb-8 shadow-2xl shadow-indigo-600/20 border border-indigo-500/20">
                <MapPin className="w-12 h-12 text-indigo-500 -rotate-12" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-[Outfit] text-white tracking-tight mb-4">
                404
            </h1>

            <h2 className="text-2xl font-semibold text-neutral-300 mb-6 flex items-center gap-2">
                Map Area Uncharted
            </h2>

            <p className="text-neutral-500 max-w-md text-lg leading-relaxed mb-10">
                You've wandered off the edge of the memory map. The location or memory you are looking for doesn't exist or has faded away.
            </p>

            <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-8 py-4 rounded-full font-medium transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
                <Map className="w-5 h-5" />
                Return to Global Map
            </Link>
        </div>
    )
}
