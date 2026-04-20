import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { forgotPasswordSchema } from "@/lib/validations"
import { sendPasswordResetEmail } from "@/lib/mail"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // ── Rate Limit: 3 permintaan reset password per jam per IP ──
    const ip = getClientIP(req)
    const rl = checkRateLimit(`forgot-password:${ip}`, RATE_LIMITS.FORGOT_PASSWORD.limit, RATE_LIMITS.FORGOT_PASSWORD.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    try {
        const body = await req.json()
        const result = forgotPasswordSchema.safeParse(body)

        if (!result.success) {
            return new NextResponse("Email tidak valid", { status: 400 })
        }

        const { email } = result.data

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            return new NextResponse("Email sent", { status: 200 })
        }

        const token = crypto.randomBytes(32).toString("hex")
        const expires = new Date(Date.now() + 3600000) // 1 hour

        // Clean up any existing tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: { email }
        })

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        })

        await sendPasswordResetEmail(email, token)

        return new NextResponse("Email sent", { status: 200 })
    } catch (error) {
        console.error("FORGOT_PASSWORD_ERROR", error)
        return new NextResponse("Terjadi kesalahan internal", { status: 500 })
    }
}
