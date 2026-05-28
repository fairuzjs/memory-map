import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { adminUserVerifySchema } from "@/lib/validations"
import { createAdminAuditLog } from "@/lib/audit"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const parsed = adminUserVerifySchema.safeParse(body)
        
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }
        
        const { isVerified } = parsed.data

        const user = await prisma.user.update({
            where: { id },
            data: { isVerified },
            select: { id: true, name: true, username: true, isVerified: true },
        })

        // Record audit trail
        await createAdminAuditLog(
            session.user.id,
            isVerified ? "GRANT_VERIFICATION" : "REVOKE_VERIFICATION",
            "USER",
            id,
            { name: user.name, username: user.username, isVerified }
        )

        return NextResponse.json(user)
    } catch (error) {
        console.error("PATCH verify user error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

