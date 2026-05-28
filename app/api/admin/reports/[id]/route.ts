import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminReportStatusSchema } from "@/lib/validations";
import { createAdminAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsed = adminReportStatusSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
        }

        const { status } = parsed.data;

        const report = await prisma.report.update({
            where: { id },
            data: { status }
        });

        // Record audit trail
        await createAdminAuditLog(
            session.user.id,
            "UPDATE_REPORT_STATUS",
            "REPORT",
            id,
            { status: report.status, memoryId: report.memoryId }
        );

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error updating report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Fetch report info before delete
        const existing = await prisma.report.findUnique({
            where: { id },
            select: { reporterId: true, memoryId: true, reason: true }
        });

        await prisma.report.delete({
            where: { id }
        });

        // Record audit trail
        if (existing) {
            await createAdminAuditLog(
                session.user.id,
                "DELETE_REPORT",
                "REPORT",
                id,
                { reporterId: existing.reporterId, memoryId: existing.memoryId, reason: existing.reason }
            );
        }

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

