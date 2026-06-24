import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const checkSchema = z.object({
    action: z.literal("CHECK"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(1, "Sandi wajib diisi"),
})

const submitSchema = z.object({
    action: z.literal("SUBMIT"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(1, "Sandi wajib diisi"),
    reason: z.string().min(10, "Alasan banding minimal 10 karakter").max(1000, "Maksimal 1000 karakter"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const isCheck = body.action === "CHECK"
        
        const parsed = isCheck ? checkSchema.safeParse(body) : submitSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const email = parsed.data.email
        const password = parsed.data.password

        // 1. Verify credentials
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true, bannedUntil: true }
        })

        if (!user || !user.password) {
            return NextResponse.json({ error: "Email atau sandi tidak valid" }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: "Email atau sandi tidak valid" }, { status: 401 })
        }

        // 2. Check if actually banned (only block SUBMIT if not banned, CHECK can still see history)
        if (!isCheck) {
            if (!user.bannedUntil || new Date(user.bannedUntil) <= new Date()) {
                return NextResponse.json({ error: "Akun ini tidak sedang dalam masa blokir permanen." }, { status: 400 })
            }
        }

        if (isCheck) {
            // Return appeal history
            const history = await prisma.banAppeal.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                select: { id: true, reason: true, status: true, createdAt: true, adminNotes: true }
            })
            return NextResponse.json({ history }, { status: 200 })
        } else {
            // Handle SUBMIT
            const reason = (parsed.data as z.infer<typeof submitSchema>).reason

            const existingAppeal = await prisma.banAppeal.findFirst({
                where: {
                    userId: user.id,
                    status: "PENDING"
                }
            })

            if (existingAppeal) {
                return NextResponse.json({ error: "Anda sudah memiliki pengajuan banding yang sedang menunggu antrean ulasan Admin." }, { status: 400 })
            }

            await prisma.banAppeal.create({
                data: {
                    userId: user.id,
                    reason,
                }
            })

            return NextResponse.json({ success: true, message: "Pengajuan banding berhasil dikirim. Harap tunggu ulasan Admin." }, { status: 201 })
        }
    } catch (error) {
        console.error("Appeal Error:", error)
        return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 })
    }
}
