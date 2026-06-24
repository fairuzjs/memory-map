import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppealCard } from "./AppealCard"

export const dynamic = "force-dynamic"

export default async function AdminAppealsPage() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        redirect("/admin/login")
    }

    const appeals = await prisma.banAppeal.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    bannedReason: true,
                    bannedUntil: true,
                    globalChatMessages: {
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    const pendingCount = appeals.filter(a => a.status === "PENDING").length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-[3px] border-black bg-white p-6 shadow-[6px_6px_0_#000] rounded-xl">
                <div>
                    <h1 className="font-[Outfit] font-black text-3xl text-black uppercase tracking-wide">
                        Banding Akun
                    </h1>
                    <p className="text-black/60 font-bold mt-1 text-sm">
                        Kelola permintaan unban dari pengguna yang diblokir permanen.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-black tracking-widest uppercase text-black/50">Menunggu Review</p>
                    <p className="text-3xl font-black text-rose-500">{pendingCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {appeals.length === 0 ? (
                    <div className="border-[3px] border-black border-dashed rounded-xl p-12 text-center bg-white/50">
                        <span className="text-4xl">📭</span>
                        <p className="font-bold text-black mt-4">Belum ada pengajuan banding.</p>
                    </div>
                ) : (
                    appeals.map((appeal) => (
                        <AppealCard key={appeal.id} appeal={appeal} />
                    ))
                )}
            </div>
        </div>
    )
}
