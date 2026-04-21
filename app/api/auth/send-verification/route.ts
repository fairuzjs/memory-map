import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/mail"

// OTP Cooldown: 60 detik per request
const COOLDOWN_MS = 60 * 1000
// OTP Expiry: 10 menit
const EXPIRY_MS = 10 * 60 * 1000

// In-memory store for cooldown tracking (resets on server restart — cukup untuk production)
const cooldownMap = new Map<string, number>()

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id
        const body = await req.json()
        const { email } = body

        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 })
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Cek cooldown
        const lastSent = cooldownMap.get(userId)
        if (lastSent && Date.now() - lastSent < COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - lastSent)) / 1000)
            return NextResponse.json(
                { error: `Tunggu ${remainingSeconds} detik sebelum meminta kode baru`, cooldown: remainingSeconds },
                { status: 429 }
            )
        }

        // Cek apakah email sudah dipakai oleh user lain
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true }
        })
        if (existingUser && existingUser.id !== userId) {
            return NextResponse.json({ error: "Email ini sudah digunakan oleh akun lain" }, { status: 409 })
        }

        const code = generateOTP()
        const expires = new Date(Date.now() + EXPIRY_MS)

        // Upsert: update jika record sudah ada, insert baru jika belum
        await prisma.verificationCode.upsert({
            where: { userId_email: { userId, email: normalizedEmail } },
            update: { code, expires },
            create: { userId, email: normalizedEmail, code, expires }
        })

        // Kirim email OTP
        await sendVerificationEmail(normalizedEmail, code)

        // Catat cooldown
        cooldownMap.set(userId, Date.now())

        return NextResponse.json({ message: "Kode verifikasi telah dikirim ke email Anda" })
    } catch (error) {
        console.error("send-verification error:", error)
        return NextResponse.json({ error: "Gagal mengirim kode verifikasi. Periksa konfigurasi email server." }, { status: 500 })
    }
}
