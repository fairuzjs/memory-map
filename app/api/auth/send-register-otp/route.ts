import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema } from "@/lib/validations"
import { sendVerificationEmail } from "@/lib/mail"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

const COOLDOWN_MS = 60 * 1000
const EXPIRY_MS = 10 * 60 * 1000

// In-memory cooldown per email
const cooldownMap = new Map<string, number>()

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
    // Rate limit: reuse REGISTER limits per IP
    const ip = getClientIP(req)
    const rl = checkRateLimit(`send-register-otp:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    try {
        const body = await req.json()
        const result = registerSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 })
        }

        const { name, email, password } = result.data
        const normalizedEmail = email.toLowerCase().trim()

        // Cek apakah email sudah terdaftar sebagai akun aktif
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
        if (existingUser) {
            return NextResponse.json({ error: "Email sudah digunakan oleh akun lain" }, { status: 409 })
        }

        // Cek cooldown
        const lastSent = cooldownMap.get(normalizedEmail)
        if (lastSent && Date.now() - lastSent < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastSent)) / 1000)
            return NextResponse.json(
                { error: `Tunggu ${remaining} detik sebelum meminta kode baru`, cooldown: remaining },
                { status: 429 }
            )
        }

        // Hash password dan simpan sementara bersama OTP
        const hashedPassword = await bcrypt.hash(password, 10)
        const code = generateOTP()
        const expires = new Date(Date.now() + EXPIRY_MS)

        // Upsert: update jika email sudah punya pending OTP
        await prisma.preRegisterOtp.upsert({
            where: { email: normalizedEmail },
            update: { name, password: hashedPassword, code, expires },
            create: { email: normalizedEmail, name, password: hashedPassword, code, expires }
        })

        // Kirim OTP ke email
        await sendVerificationEmail(normalizedEmail, code)

        // Catat cooldown
        cooldownMap.set(normalizedEmail, Date.now())

        return NextResponse.json({ message: "Kode verifikasi telah dikirim ke email Anda" })
    } catch (error) {
        console.error("send-register-otp error:", error)
        return NextResponse.json({ error: "Gagal mengirim kode verifikasi. Periksa konfigurasi email." }, { status: 500 })
    }
}
