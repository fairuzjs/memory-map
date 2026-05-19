import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/onboarding — check onboarding status
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            hasCompletedOnboarding: true,
            hasSeenWelcomeGuide: true,
        },
    })

    return NextResponse.json({
        hasCompletedOnboarding: user?.hasCompletedOnboarding ?? false,
        hasSeenWelcomeGuide: user?.hasSeenWelcomeGuide ?? false,
    })
}

// PATCH /api/onboarding — mark onboarding as completed
export async function PATCH(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Support marking specific fields
    let body: { field?: string } = {}
    try {
        body = await req.json()
    } catch {
        // No body = default behavior (mark onboarding completed)
    }

    if (body.field === "welcomeGuide") {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { hasSeenWelcomeGuide: true },
        })
    } else {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { hasCompletedOnboarding: true },
        })
    }

    return NextResponse.json({ success: true })
}
