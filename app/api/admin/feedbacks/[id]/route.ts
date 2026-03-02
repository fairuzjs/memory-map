import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status, adminReply } = body;

        let updateData: any = {};

        // If an admin reply is provided, set status to REPLIED automatically
        if (adminReply !== undefined && adminReply.trim() !== '') {
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

        await prisma.feedback.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
