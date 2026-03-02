import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register" || nextUrl.pathname === "/forgot-password"

            // Allow accessing /admin/login even if logged in as a normal USER (so they can switch accounts)
            if (nextUrl.pathname === "/admin/login") {
                if (isLoggedIn && auth?.user?.role === "ADMIN") {
                    return Response.redirect(new URL("/admin", nextUrl))
                }
                return true
            }
        

            if (isAuthRoute) {
                if (isLoggedIn) {
                    if (auth?.user?.role === "ADMIN") return Response.redirect(new URL("/admin", nextUrl))
                    return Response.redirect(new URL("/dashboard", nextUrl))
                }
                return true
            }

            const isAdminRoute = nextUrl.pathname.startsWith("/admin") && nextUrl.pathname !== "/admin/login"

            if (isAdminRoute) {
                if (!isLoggedIn) return Response.redirect(new URL("/admin/login", nextUrl))
                if (auth?.user?.role !== "ADMIN") return Response.redirect(new URL("/dashboard", nextUrl))
                return true
            }

            const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname === "/api/register" || nextUrl.pathname.startsWith("/api/auth")

            if (!isLoggedIn && !isPublicRoute && !nextUrl.pathname.includes('.')) {
                return false // Redirects to login page
            }
            return true
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            if (trigger === "update" && session?.name) {
                token.name = session.name
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    providers: [],
} satisfies NextAuthConfig
