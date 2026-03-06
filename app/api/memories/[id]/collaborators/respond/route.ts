import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/memories/[id]/collaborators/respond
// Body: { action: "ACCEPTED" | "DECLINED" }
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: memoryId } = await params
        const { action } = await req.json()

        if (!["ACCEPTED", "DECLINED"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        const collab = await prisma.memoryCollaborator.findUnique({
            where: {
                memoryId_userId: {
                    memoryId,
                    userId: session.user.id
                }
            }
        })

        if (!collab) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
        }

        if (collab.status !== "PENDING") {
            return NextResponse.json({ error: "Invitation already responded" }, { status: 409 })
        }

        const updated = await prisma.memoryCollaborator.update({
            where: {
                memoryId_userId: {
                    memoryId,
                    userId: session.user.id
                }
            },
            data: { status: action },
            include: {
                user: { select: { id: true, name: true, image: true } }
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        console.error("PATCH collaborator respond error:", error?.message)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
