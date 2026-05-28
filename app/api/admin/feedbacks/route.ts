import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "10");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const status = searchParams.get("status") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { message: { contains: search, mode: "insensitive" } },
                {
                    user: {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                            { username: { contains: search, mode: "insensitive" } },
                        ]
                    }
                }
            ];
        }

        if (category && ["SUGGESTION", "BUG", "QUESTION", "OTHER"].includes(category)) {
            where.category = category;
        }

        if (status && ["PENDING", "READ", "REPLIED"].includes(status)) {
            where.status = status;
        }

        const [
            feedbacks,
            total,
            categoryCounts,
            statusCounts
        ] = await Promise.all([
            prisma.feedback.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, image: true }
                    }
                }
            }),
            prisma.feedback.count({ where }),
            prisma.feedback.groupBy({
                by: ['category'],
                _count: { _all: true }
            }),
            prisma.feedback.groupBy({
                by: ['status'],
                _count: { _all: true }
            })
        ]);

        const suggestionCount = categoryCounts.find(c => c.category === "SUGGESTION")?._count._all ?? 0;
        const bugCount = categoryCounts.find(c => c.category === "BUG")?._count._all ?? 0;
        const questionCount = categoryCounts.find(c => c.category === "QUESTION")?._count._all ?? 0;
        const otherCount = categoryCounts.find(c => c.category === "OTHER")?._count._all ?? 0;

        const pendingCount = statusCounts.find(s => s.status === "PENDING")?._count._all ?? 0;
        const repliedCount = statusCounts.find(s => s.status === "REPLIED")?._count._all ?? 0;

        return NextResponse.json({
            feedbacks,
            total,
            page,
            limit,
            pendingCount,
            repliedCount,
            suggestionCount,
            bugCount,
            questionCount,
            otherCount
        });
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}



