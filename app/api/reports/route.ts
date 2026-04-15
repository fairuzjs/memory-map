import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { memoryId, reason, details } = await req.json();

        if (!memoryId || !reason) {
            return NextResponse.json({ error: "Memory ID and Reason are required" }, { status: 400 });
        }

        const report = await prisma.report.create({
            data: {
                memoryId,
                reason,
                details,
                reporterId: user.id,
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error("Error creating report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reports = await prisma.report.findMany({
            where: {
                reporterId: user.id,
            },
            include: {
                memory: {
                    select: {
                        title: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
