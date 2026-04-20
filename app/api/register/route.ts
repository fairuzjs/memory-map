import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema } from "@/lib/validations"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // ── Rate Limit: 5 pendaftaran per jam per IP ──────────────
    const ip = getClientIP(req)
    const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    try {
        const body = await req.json()
        const result = registerSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 })
        }

        const { name, email, password } = result.data

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: "Email already exists" }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            }
        })

        return NextResponse.json(
            { message: "User created successfully", user: { id: user.id, name: user.name, email: user.email } },
            { status: 201 }
        )
    } catch (error) {
        console.error("Register Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
