import { prisma } from "./prisma"

/**
 * Creates a record in the AdminAuditLog table to track admin actions.
 * @param adminId The ID of the admin performing the action
 * @param action The name of the action performed (e.g., "APPROVE_TOPUP")
 * @param targetType The entity type affected (e.g., "USER", "FEEDBACK")
 * @param targetId The ID of the affected entity
 * @param metadata Additional JSON metadata detailing the action
 */
export async function createAdminAuditLog(
    adminId: string,
    action: string,
    targetType: string,
    targetId?: string | null,
    metadata?: any
) {
    try {
        const metadataStr = metadata ? JSON.stringify(metadata) : null

        const log = await prisma.adminAuditLog.create({
            data: {
                adminId,
                action,
                targetType,
                targetId: targetId ?? null,
                metadata: metadataStr,
            },
        })
        return log
    } catch (error) {
        console.error("Failed to create admin audit log:", error)
        // We do not crash the request if audit logging fails, but we log it
        return null
    }
}
