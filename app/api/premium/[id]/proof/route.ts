import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        const order = await prisma.premiumOrder.findUnique({ where: { id } })
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

        // Upload to Supabase public_uploads bucket
        const ext = file.name.split(".").pop() || file.type.split("/")[1].replace("jpeg", "jpg")
        const filename = `premium-proofs/${id}_${Date.now()}.${ext}`

        const { data, error: uploadError } = await supabase.storage
            .from("public_uploads")
            .upload(filename, file)

        if (uploadError) {
            console.error("Supabase upload error:", uploadError)
            return NextResponse.json({ error: "Gagal menyimpan file" }, { status: 500 })
        }

        const { data: publicData } = supabase.storage
            .from("public_uploads")
            .getPublicUrl(data.path)

        const proofUrl = publicData.publicUrl

        // Update order dengan URL bukti
        const updated = await prisma.premiumOrder.update({
            where: { id },
            data: { proofImage: proofUrl },
        })

        return NextResponse.json({ proofImage: updated.proofImage })
    } catch (error) {
        console.error("Upload premium proof error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
