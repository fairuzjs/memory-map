import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body

        if (action !== "APPROVE" && action !== "REJECT") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        const appeal = await prisma.banAppeal.findUnique({
            where: { id },
            include: { user: true }
        })

        if (!appeal) {
            return NextResponse.json({ error: "Banding tidak ditemukan" }, { status: 404 })
        }

        if (appeal.status !== "PENDING") {
            return NextResponse.json({ error: "Banding ini sudah diulas sebelumnya" }, { status: 400 })
        }

        // Update appeal status
        const finalStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"
        await prisma.banAppeal.update({
            where: { id },
            data: { status: finalStatus }
        })

        if (action === "APPROVE") {
            // Unban user
            await prisma.user.update({
                where: { id: appeal.userId },
                data: {
                    bannedUntil: null,
                    bannedReason: null
                }
            })
            return NextResponse.json({ success: true, message: "Banding diterima. Akun berhasil dipulihkan." })
        } else {
            return NextResponse.json({ success: true, message: "Banding ditolak. Akun tetap diblokir." })
        }
    } catch (error) {
        console.error("Action Appeal Error:", error)
        return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 })
    }
}
