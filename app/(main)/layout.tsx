import { Navbar } from "@/components/layout/Navbar"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col pt-[72px]">
            <Navbar />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    )
}
