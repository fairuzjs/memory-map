import { Navbar } from "@/components/layout/Navbar"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#FFFDF0] text-black flex flex-col pt-[72px] selection:bg-[#FFFF00] selection:text-black">
            {/* ── Neubrutalism Background ───────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
                    backgroundSize: "80px 80px"
                }} />
            </div>

            <div className="relative z-10 w-full flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    )
}
