import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request) {
    // Rate limit: 5 per jam per IP
    const ip = getClientIP(req)
    const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    try {
        const body = await req.json()
        const { email, code } = body

        if (!email || !code) {
            return NextResponse.json({ error: "Email dan kode OTP wajib diisi" }, { status: 400 })
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Cek apakah email sudah aktif
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
        if (existingUser) {
            return NextResponse.json({ error: "Email sudah digunakan oleh akun lain" }, { status: 409 })
        }

        // Ambil pending OTP
        const pending = await prisma.preRegisterOtp.findUnique({ where: { email: normalizedEmail } })
        if (!pending) {
            return NextResponse.json({ error: "Kode verifikasi tidak ditemukan. Silakan mulai ulang proses pendaftaran." }, { status: 404 })
        }

        // Cek kadaluwarsa
        if (new Date() > pending.expires) {
            await prisma.preRegisterOtp.delete({ where: { email: normalizedEmail } })
            return NextResponse.json({ error: "Kode verifikasi sudah kadaluwarsa. Silakan mulai ulang proses pendaftaran." }, { status: 410 })
        }

        // Cek kecocokan kode
        if (pending.code !== code.trim()) {
            return NextResponse.json({ error: "Kode verifikasi salah. Periksa kembali email Anda." }, { status: 400 })
        }

        // Buat akun dengan isEmailVerified: true (email sudah dikonfirmasi)
        // isVerified tetap false — hanya admin yang bisa memberi verified badge
        const user = await prisma.user.create({
            data: {
                name: pending.name,
                email: normalizedEmail,
                password: pending.password,
                isEmailVerified: true,
                isVerified: false,
            }
        })

        // Bersihkan pending OTP
        await prisma.preRegisterOtp.delete({ where: { email: normalizedEmail } })

        return NextResponse.json(
            { message: "Akun berhasil dibuat!", user: { id: user.id, name: user.name, email: user.email } },
            { status: 201 }
        )
    } catch (error) {
        console.error("Register Error:", error)
        return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
    }
}
