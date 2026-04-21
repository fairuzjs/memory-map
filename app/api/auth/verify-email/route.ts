import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id
        const body = await req.json()
        const { email, code } = body

        if (!email || !code) {
            return NextResponse.json({ error: "Email dan kode verifikasi wajib diisi" }, { status: 400 })
        }

        const normalizedEmail = email.toLowerCase().trim()

        // Ambil record OTP dari DB
        const record = await prisma.verificationCode.findUnique({
            where: { userId_email: { userId, email: normalizedEmail } }
        })

        if (!record) {
            return NextResponse.json({ error: "Kode verifikasi tidak ditemukan. Silakan minta kode baru." }, { status: 404 })
        }

        // Cek kadaluwarsa
        if (new Date() > record.expires) {
            await prisma.verificationCode.delete({ where: { id: record.id } })
            return NextResponse.json({ error: "Kode verifikasi sudah kadaluwarsa. Silakan minta kode baru." }, { status: 410 })
        }

        // Cek kecocokan kode
        if (record.code !== code.trim()) {
            return NextResponse.json({ error: "Kode verifikasi salah. Periksa kembali email Anda." }, { status: 400 })
        }

        // Hapus semua kode OTP lama milik user ini (bersih-bersih)
        await prisma.verificationCode.deleteMany({ where: { userId } })

        // Update email + isEmailVerified user (bukan isVerified — itu khusus admin badge)
        await prisma.user.update({
            where: { id: userId },
            data: { email: normalizedEmail, isEmailVerified: true }
        })

        return NextResponse.json({ message: "Email berhasil diverifikasi!" })
    } catch (error) {
        console.error("verify-email error:", error)
        return NextResponse.json({ error: "Gagal memverifikasi email" }, { status: 500 })
    }
}
