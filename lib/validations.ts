import * as z from "zod"

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
})

export const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/\d/, { message: "Password must contain at least 1 number" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/\d/, { message: "Password must contain at least 1 number" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export const memorySchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    story: z.string().min(1, { message: "Story is required" }),
    date: z.string().or(z.date()),
    latitude: z.number().default(0), // Placeholder until Map
    longitude: z.number().default(0), // Placeholder until Map
    locationName: z.string().optional(),
    emotion: z.enum([
        "HAPPY", "SAD", "NOSTALGIC", "EXCITED",
        "PEACEFUL", "GRATEFUL", "ROMANTIC", "ADVENTUROUS"
    ]),
    isPublic: z.boolean().default(true),
    photos: z.array(z.any()).max(10, { message: "Maksimal foto telah tercapai" }).optional(), // actual limit enforced by API (3 free / 10 premium)
    tags: z.array(z.string()).optional(),
    collaborators: z.array(z.string()).max(10, { message: "Maksimal kolaborator telah tercapai" }).optional().default([]),
    // Audio clip fields (optional)
    audio: z.object({
        url: z.string(),
        bucket: z.string(),
        path: z.string(),
        startTime: z.number().min(0),
        duration: z.number().refine(v => [10, 15, 30].includes(v)),
        fileName: z.string(),
    }).optional().nullable(),
    spotifyTrackId: z.string().optional().nullable(),
    markerStyle: z.string().optional().nullable(),
    // Cover image fields
    coverImage: z.string().optional().nullable(),
    coverPositionX: z.number().optional().nullable(),
    coverPositionY: z.number().optional().nullable(),
    coverScale: z.number().optional().nullable(),
    coverRotation: z.number().optional().nullable(),
})

export const reactionSchema = z.object({
    type: z.enum(["LOVE", "WOW", "SAD", "LAUGH"]),
})

export const commentSchema = z.object({
    content: z.string().min(1, { message: "Komentar tidak boleh kosong" }).max(1000, { message: "Komentar maksimal 1000 karakter" }),
    parentId: z.string().optional().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type MemoryInput = z.infer<typeof memorySchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ── Admin Actions Validation Schemas ──
export const adminFeedbackStatusSchema = z.object({
    status: z.enum(["PENDING", "READ", "REPLIED"]).optional(),
    adminReply: z.string().max(2000, { message: "Balasan maksimal 2000 karakter" }).optional().nullable(),
})

export const adminReportStatusSchema = z.object({
    status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]),
})

export const adminTopupProcessSchema = z.object({
    emailOrName: z.string().min(1, { message: "Email atau nama diperlukan" }),
    amount: z.number().refine(val => [500, 1000, 2500, 5000, 10000, 25000].includes(val), {
        message: "Nominal tidak valid",
    }),
})

export const adminOrderActionSchema = z.object({
    status: z.enum(["COMPLETED", "CANCELLED"]),
    note: z.string().max(500, { message: "Catatan maksimal 500 karakter" }).optional().nullable(),
})

export const adminUserVerifySchema = z.object({
    isVerified: z.boolean(),
})

export type AdminFeedbackStatusInput = z.infer<typeof adminFeedbackStatusSchema>
export type AdminReportStatusInput = z.infer<typeof adminReportStatusSchema>
export type AdminTopupProcessInput = z.infer<typeof adminTopupProcessSchema>
export type AdminOrderActionInput = z.infer<typeof adminOrderActionSchema>
export type AdminUserVerifyInput = z.infer<typeof adminUserVerifySchema>

export const globalChatSchema = z.object({
    content: z.string().trim().min(1, { message: "Pesan tidak boleh kosong" }).max(300, { message: "Pesan maksimal 300 karakter" })
})

export type GlobalChatInput = z.infer<typeof globalChatSchema>
