import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const MOBILE_JWT_SECRET = process.env.MOBILE_JWT_SECRET || "default_secret_for_development_only";

interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Sign JWT token untuk mobile user.
 * Token berlaku 30 hari.
 */
export function signMobileToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, MOBILE_JWT_SECRET, {
    expiresIn: "30d",
  });
}

/**
 * Verifikasi Bearer token dari header Authorization.
 * Return user jika valid, null jika tidak.
 */
export async function verifyMobileToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, MOBILE_JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isPremium: true,
        points: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
