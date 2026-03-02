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
        const status = searchParams.get('status');

        const reports = await prisma.report.findMany({
            where: status ? { status: status as any } : undefined,
            orderBy: { createdAt: 'desc' },
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
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
