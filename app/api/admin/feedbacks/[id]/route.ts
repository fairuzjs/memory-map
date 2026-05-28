import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminFeedbackStatusSchema } from "@/lib/validations";
import { createAdminAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsed = adminFeedbackStatusSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
        }

        const { status, adminReply } = parsed.data;

        let updateData: any = {};

        // If an admin reply is provided, set status to REPLIED automatically
        if (adminReply !== undefined && adminReply !== null && adminReply.trim() !== '') {
            updateData.adminReply = adminReply;
            updateData.status = "REPLIED";
        } else if (status) {
            // Otherwise, just update the status (e.g., to READ)
            updateData.status = status;
        }

        const feedback = await prisma.feedback.update({
            where: { id },
            data: updateData
        });

        // Record audit trail
        const isReply = adminReply !== undefined && adminReply !== null && adminReply.trim() !== '';
        await createAdminAuditLog(
            session.user.id,
            isReply ? "REPLY_FEEDBACK" : "UPDATE_FEEDBACK_STATUS",
            "FEEDBACK",
            id,
            { status: feedback.status, hasReply: isReply }
        );

        return NextResponse.json(feedback);
    } catch (error: any) {
        console.error("Error updating feedback:", error);
        return NextResponse.json({ error: error?.message || error?.toString() || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Fetch user/details for audit log before delete
        const existing = await prisma.feedback.findUnique({
            where: { id },
            select: { userId: true, category: true }
        });

        await prisma.feedback.delete({
            where: { id }
        });

        // Record audit trail
        if (existing) {
            await createAdminAuditLog(
                session.user.id,
                "DELETE_FEEDBACK",
                "FEEDBACK",
                id,
                { targetUserId: existing.userId, category: existing.category }
            );
        }

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

