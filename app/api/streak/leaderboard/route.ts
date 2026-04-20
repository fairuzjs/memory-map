import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCachedLeaderboard } from "@/lib/services/user-service"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leaders = await getCachedLeaderboard()
    return NextResponse.json(leaders)
}
