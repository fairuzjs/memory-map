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
        const limit = parseInt(searchParams.get("limit") ?? "15");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const status = searchParams.get('status') || "";

        const where: any = {};

        if (status && status !== "ALL") {
            where.status = status as any;
        }

        if (search) {
            // Check if search query matches any enum value for reason
            const possibleReasons = ["SARA", "PORNOGRAPHY", "VIOLENCE", "SPAM", "OTHER"];
            const isEnumReason = possibleReasons.includes(search.toUpperCase());
            
            where.OR = [
                { details: { contains: search, mode: "insensitive" } },
                ...(isEnumReason ? [{ reason: search.toUpperCase() as any }] : []),
                {
                    reporter: {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                        ]
                    }
                },
                {
                    memory: {
                        OR: [
                            { title: { contains: search, mode: "insensitive" } },
                            { story: { contains: search, mode: "insensitive" } },
                        ]
                    }
                }
            ];
        }

        const [
            reports,
            total,
            pendingCount,
            reviewedCount,
            resolvedCount,
            dismissedCount
        ] = await Promise.all([
            prisma.report.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    reporter: {
                        select: { id: true, name: true, email: true }
                    },
                    memory: {
                        select: {
                            id: true,
                            title: true,
                            story: true,
                            date: true,
                            emotion: true,
                            locationName: true,
                            user: {
                                select: { id: true, name: true }
                            },
                            photos: { select: { url: true } }
                        }
                    }
                }
            }),
            prisma.report.count({ where }),
            prisma.report.count({ where: { status: "PENDING" } }),
            prisma.report.count({ where: { status: "REVIEWED" } }),
            prisma.report.count({ where: { status: "RESOLVED" } }),
            prisma.report.count({ where: { status: "DISMISSED" } })
        ]);

        return NextResponse.json({
            reports,
            total,
            page,
            limit,
            pendingCount,
            reviewedCount,
            resolvedCount,
            dismissedCount
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

