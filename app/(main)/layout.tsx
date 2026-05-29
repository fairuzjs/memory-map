import { Navbar } from "@/components/layout/Navbar"
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[var(--mm-bg)] text-[var(--mm-ink)] flex flex-col pt-[92px] selection:bg-[var(--mm-primary)] selection:text-[var(--mm-ink)]">
            {/* ── Neubrutalism Background ───────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,1) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,1) 2px, transparent 2px)`,
                    backgroundSize: "80px 80px"
                }} />
            </div>

            <OnboardingProvider>
                <div className="relative z-10 w-full flex-1 flex flex-col">
                    <Navbar />
                    <main className="flex-1 flex flex-col">
                        {children}
                    </main>
                </div>
            </OnboardingProvider>
        </div>
    )
}
