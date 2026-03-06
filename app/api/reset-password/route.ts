import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { token, ...data } = body

        if (!token || typeof token !== "string") {
            return new NextResponse("Token tidak ditemukan", { status: 400 })
        }

        const result = resetPasswordSchema.safeParse(data)

        if (!result.success) {
            return new NextResponse("Permintaan tidak valid", { status: 400 })
        }

        const { password } = result.data

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        })

        if (!resetToken || resetToken.expires < new Date()) {
            return new NextResponse("Token kadaluwarsa atau tidak valid", { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: resetToken.email }
        })

        if (!user) {
            return new NextResponse("Pengguna tidak ditemukan", { status: 404 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id }
        })

        return new NextResponse("Kata sandi berhasil diperbarui", { status: 200 })
    } catch (error) {
        console.error("RESET_PASSWORD_ERROR", error)
        return new NextResponse("Terjadi kesalahan", { status: 500 })
    }
}
