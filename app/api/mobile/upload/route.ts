import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/jwt-mobile";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import sharp from "sharp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

export async function POST(req: NextRequest) {
  try {
    const user = await verifyMobileToken(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit (optional, you can use the same as web)
    const rl = checkRateLimit(`upload:${user.id}`, RATE_LIMITS.UPLOAD.limit, RATE_LIMITS.UPLOAD.windowMs);
    if (!rl.success) return rateLimitResponse(rl.reset);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const isPublic = formData.get("isPublic") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    if (!isImage) {
      return NextResponse.json({ error: "Invalid file type. Only standard images are allowed." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const fileExt = MIME_TO_EXT[file.type];
    if (!fileExt) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const bucketName = isPublic ? "public_uploads" : "private_uploads";

    let uploadBuffer: Buffer | ArrayBuffer;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const sharpInstance = sharp(buffer).rotate(); 

      if (file.type === "image/jpeg") {
        uploadBuffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
      } else if (file.type === "image/png") {
        uploadBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
      } else if (file.type === "image/webp") {
        uploadBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      } else {
        uploadBuffer = buffer;
      }
    } catch (err) {
      console.error("Sharp processing error:", err);
      return NextResponse.json({ error: "Corrupted or invalid image file" }, { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uploadBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: "Upload failed to storage" }, { status: 500 });
    }

    if (isPublic) {
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return NextResponse.json({
        path: data.path,
        bucket: bucketName,
        url: publicData.publicUrl
      });
    }

    return NextResponse.json({ path: data.path, bucket: bucketName });

  } catch (error) {
    console.error("[MOBILE_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "Internal server error during upload" }, { status: 500 });
  }
}
