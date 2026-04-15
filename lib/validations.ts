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
    photos: z.array(z.any()).optional(), // array of anything (we will store rich objects and stringify before sending)
    tags: z.array(z.string()).optional(),
    collaborators: z.array(z.string()).max(5, { message: "Maximum 5 collaborators allowed" }).optional().default([]),
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
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type MemoryInput = z.infer<typeof memorySchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
