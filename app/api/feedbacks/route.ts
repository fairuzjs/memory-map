import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
        }

        const formData = await req.formData();
        const message = formData.get("message") as string;
        const image = formData.get("image") as File | null;
        const categoryRaw = (formData.get("category") as string | null)?.toUpperCase();
        const VALID_CATEGORIES = ["SUGGESTION", "BUG", "QUESTION", "OTHER"] as const;
        type ValidCategory = typeof VALID_CATEGORIES[number];
        const category: ValidCategory = VALID_CATEGORIES.includes(categoryRaw as ValidCategory)
            ? (categoryRaw as ValidCategory)
            : "SUGGESTION";

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        let imageUrl = null;

        if (image && image.size > 0) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(image.type)) {
                return NextResponse.json(
                    { error: "Invalid image format. Only JPEG, PNG, and WebP are allowed." },
                    { status: 400 }
                );
            }

            // Validate file size (e.g. max 5MB)
            if (image.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "Image size must be less than 5MB" },
                    { status: 400 }
                );
            }

            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to Supabase Storage instead of local filesystem
            const { createClient } = await import("@supabase/supabase-js");
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const fileExt = image.name.split('.').pop() || 'jpg';
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const filename = `feedbacks/${session.user.id}/${uniqueSuffix}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from("public_uploads")
                .upload(filename, buffer, {
                    contentType: image.type,
                    upsert: false
                });

            if (error) {
                console.error("Supabase upload error:", error);
                return NextResponse.json({ error: "Failed to upload image to storage" }, { status: 500 });
            }

            const { data: publicData } = supabase.storage
                .from("public_uploads")
                .getPublicUrl(data.path);

            imageUrl = publicData.publicUrl;
        }

        const feedback = await prisma.feedback.create({
            data: {
                message,
                imageUrl,
                category,
                userId: session.user.id,
            },
        });

        return NextResponse.json(feedback, { status: 201 });
    } catch (error: any) {
        console.error("Error creating feedback ticket:", error);
        return NextResponse.json({ error: error?.message || error?.toString() || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const feedbacks = await prisma.feedback.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(feedbacks);
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedbacks" },
            { status: 500 }
        );
    }
}
