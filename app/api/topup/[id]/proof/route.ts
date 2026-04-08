import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Verifikasi order milik user ini
        const order = await prisma.topupOrder.findUnique({ where: { id } })
        if (!order) {
            return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
        }
        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        if (order.status !== "PENDING") {
            return NextResponse.json({ error: "Order sudah diproses" }, { status: 409 })
        }

        const formData = await req.formData()
        const file = formData.get("proof") as File | null

        if (!file) {
            return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
        }

        // Validasi tipe & ukuran (max 5MB)
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." }, { status: 400 })
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
        }

        // Simpan ke public/uploads/proofs/
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.type.split("/")[1].replace("jpeg", "jpg")
        const filename = `proof_${id}_${Date.now()}.${ext}`
        const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs")

        await mkdir(uploadDir, { recursive: true })
        await writeFile(path.join(uploadDir, filename), buffer)

        const proofUrl = `/uploads/proofs/${filename}`

        // Update order dengan URL bukti
        const updated = await prisma.topupOrder.update({
            where: { id },
            data: { proofImage: proofUrl },
        })

        return NextResponse.json({ proofImage: updated.proofImage })
    } catch (error) {
        console.error("Upload proof error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
