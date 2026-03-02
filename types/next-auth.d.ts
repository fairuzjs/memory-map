import NextAuth, { type DefaultSession } from "next-auth"

// Extend NextAuth module types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        role?: string;
    }
}
