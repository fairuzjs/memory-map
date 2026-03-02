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

            // Ensure upload directory exists
            const uploadDir = join(process.cwd(), "public", "uploads", "feedbacks");
            await mkdir(uploadDir, { recursive: true });

            // Generate unique filename
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const filename = `${uniqueSuffix}-${image.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
            const filepath = join(uploadDir, filename);

            // Save file
            await writeFile(filepath, buffer);
            imageUrl = `/uploads/feedbacks/${filename}`;
        }

        const feedback = await prisma.feedback.create({
            data: {
                message,
                imageUrl,
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
