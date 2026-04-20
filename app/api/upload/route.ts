import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Konfigurasi Validasi File
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_AUDIO_SIZE = 4 * 1024 * 1024 // 4MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_AUDIO_TYPES = ["audio/mpeg"]

export async function POST(req: Request) {
  try {
    // SECURITY CHECK 1: Wajib Login
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // SECURITY CHECK 2: Rate Limit — 20 upload per jam per user
    const rl = checkRateLimit(`upload:${session.user.id}`, RATE_LIMITS.UPLOAD.limit, RATE_LIMITS.UPLOAD.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    const formData = await req.formData()
    const file = formData.get("file") as File
    const isPublic = formData.get("isPublic") === "true"

    // SECURITY CHECK 2: File Wajib Ada
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // SECURITY CHECK 3: Hanya Izinkan Image atau Audio
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type)
    if (!isImage && !isAudio) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP, GIF, and MP3 are allowed." }, { status: 400 })
    }

    // SECURITY CHECK 4: Batasi Ukuran File (5MB image, 4MB audio)
    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size exceeds ${isAudio ? "4MB" : "5MB"} limit` }, { status: 400 })
    }

    // SECURITY CHECK 5: Gunakan Nama File Acak (UUID) untuk mencegah directory traversal / tebakan nama
    const fileExt = file.name.split(".").pop()
    // Opsional: prefix dengan userId agar rapi dan mudah di-manage
    const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`

    // SECURITY CHECK 6: Pisahkan bucket berdasarkan privacy filter
    // Memory private harus masuk bucket "private_uploads", memory public masuk "public_uploads"
    const bucketName = isPublic ? "public_uploads" : "private_uploads"

    // Upload menggunakan Service Role (aman karena Auth & RLS kita yang handle di handler ini)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file)

    if (error) {
      console.error("Supabase upload error:", error)
      return NextResponse.json({ error: "Upload failed to storage" }, { status: 500 })
    }

    // SECURITY CHECK 7: Jangan otomatis kembalikan Public URL untuk private file
    if (isPublic) {
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

      return NextResponse.json({
        path: data.path,
        bucket: bucketName,
        url: publicData.publicUrl
      })
    }

    // Untuk file private, HANYA kembalikan path dan bucket.
    // Client tidak akan mendapatkan URL langsung.
    // Harus ada endpoint GET terpisah untuk men-generate Signed URL saat membaca data.
    return NextResponse.json({ path: data.path, bucket: bucketName })

  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Internal server error during upload" }, { status: 500 })
  }
}