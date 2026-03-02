import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uniqueId = crypto.randomUUID()
        const originalExt = file.name.split(".").pop()
        const filename = `${uniqueId}.${originalExt}`

        const uploadDir = join(process.cwd(), "public/uploads")

        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (err) {
            // Ignore error if directory already exists
        }

        const path = join(uploadDir, filename)

        // Ensure the array type since writeFileSync returns void.
        await writeFile(path, buffer as any)

        return NextResponse.json({ url: `/uploads/${filename}` })
    } catch (error) {
        console.error("Upload Error:", error)
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
}
