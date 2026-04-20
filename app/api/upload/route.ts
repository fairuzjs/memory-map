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

// Map MIME type ke ekstensi file yang aman
// Mengabaikan nama file dari client agar tidak bisa dimanipulasi
const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
    "image/gif":  "gif",
    "audio/mpeg": "mp3",
}

import sharp from "sharp"

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

    // SECURITY CHECK 5: Derive ekstensi dari MIME type (BUKAN dari nama file client)
    const fileExt = MIME_TO_EXT[file.type]
    if (!fileExt) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }
    const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`

    // SECURITY CHECK 6: Pisahkan bucket berdasarkan privacy filter
    const bucketName = isPublic ? "public_uploads" : "private_uploads"

    let uploadBuffer: Buffer | ArrayBuffer;

    // SECURITY CHECK 8: Image Sanity & Privacy (Re-encoding)
    if (isImage) {
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            
            // Re-encode gambar untuk membuang payload malware (polyglot) yang mungkin disisipkan
            // dan menghapus metadata EXIF (lokasi GPS, info perangkat) demi privasi user.
            const sharpInstance = sharp(buffer).rotate() // Auto-rotate berdasarkan EXIF sebelum di-strip
            
            if (file.type === "image/jpeg") {
                uploadBuffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
            } else if (file.type === "image/png") {
                uploadBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer()
            } else if (file.type === "image/webp") {
                uploadBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer()
            } else {
                // Untuk GIF, kita tidak re-encode (karena sharp butuh setup extra), gunakan buffer asli aman
                uploadBuffer = buffer
            }
        } catch (err) {
            console.error("Sharp processing error:", err)
            return NextResponse.json({ error: "Corrupted or invalid image file" }, { status: 400 })
        }
    } else {
        uploadBuffer = await file.arrayBuffer()
    }

    // Upload menggunakan Service Role
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uploadBuffer, {
          contentType: file.type,
          upsert: false
      })

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

    return NextResponse.json({ path: data.path, bucket: bucketName })

  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Internal server error during upload" }, { status: 500 })
  }
}