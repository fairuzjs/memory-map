import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Konfigurasi Validasi File
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: Request) {
  try {
    // SECURITY CHECK 1: Wajib Login
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const isPublic = formData.get("isPublic") === "true"

    // SECURITY CHECK 2: File Wajib Ada
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // SECURITY CHECK 3: Hanya Izinkan Image
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed." }, { status: 400 })
    }

    // SECURITY CHECK 4: Batasi Ukuran File (5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
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