import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                isAdminLogin: { label: "Admin Login", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user || !user.password) {
                    return null
                }

                const isValid = await bcrypt.compare(credentials.password as string, user.password)

                if (!isValid) {
                    return null
                }

                const isAdminLogin = credentials.isAdminLogin === "true"

                if (isAdminLogin && user.role !== "ADMIN") {
                    throw new Error("AccessDenied: Not an Admin")
                }

                if (!isAdminLogin && user.role === "ADMIN") {
                    throw new Error("AccessDenied: Please use Admin Login")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    isVerified: user.isVerified,
                    isEmailVerified: user.isEmailVerified,
                }
            }
        })
    ],
})
