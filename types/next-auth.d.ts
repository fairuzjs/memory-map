import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string;
            isVerified?: boolean;
            isEmailVerified?: boolean;
            isPremium?: boolean;
            premiumExpiresAt?: string | null;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        role?: string;
        isVerified?: boolean;
        isEmailVerified?: boolean;
        isPremium?: boolean;
        premiumExpiresAt?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: string;
        isVerified?: boolean;
        isEmailVerified?: boolean;
        isPremium?: boolean;
        premiumExpiresAt?: string | null;
    }
}
