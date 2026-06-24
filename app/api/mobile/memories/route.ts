import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/jwt-mobile";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyMobileToken(req);

    const { searchParams } = new URL(req.url);
    const emotion = searchParams.get("emotion");
    const publicOnly = searchParams.get("public") === "true";
    const sort = searchParams.get("sort") ?? "latest";
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const baseInclude = {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      photos: true,
      _count: { select: { reactions: true, comments: true } },
    };

    const where: Prisma.MemoryWhereInput = {};

    if (emotion) {
      where.emotion = emotion as Prisma.EnumEmotionFilter;
    }

    if (!user || publicOnly) {
      // Jika tidak login atau hanya minta public
      where.isPublic = true;
    } else {
      // Jika login, ambil memory sendiri + memory public milik orang lain
      where.OR = [
        { isPublic: true },
        { userId: user.id }
      ];
    }

    const orderBy: Prisma.MemoryOrderByWithRelationInput = 
      sort === "popular" 
        ? { reactions: { _count: "desc" } } 
        : { date: "desc" };

    const memories = await prisma.memory.findMany({
      where,
      include: baseInclude,
      orderBy,
      take: limit,
    });

    return NextResponse.json(memories);
  } catch (error) {
    console.error("[MOBILE_GET_MEMORIES]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kenangan" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyMobileToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Blokir user yang belum verifikasi email (jika ada, sesuaikan dengan web)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isEmailVerified: true },
    });

    if (!currentUser || currentUser.isEmailVerified === false) {
      return NextResponse.json(
        { error: "EMAIL_NOT_VERIFIED", message: "Verifikasi email kamu terlebih dahulu sebelum membuat memory." },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Validasi input sederhana untuk mobile
    if (!body.title || !body.story || !body.emotion || body.latitude === undefined || body.longitude === undefined) {
       return NextResponse.json({ error: "Invalid data: Missing required fields" }, { status: 400 });
    }

    const { title, story, emotion, latitude, longitude, photos, isPublic } = body;

    const newMemory = await prisma.memory.create({
      data: {
        title,
        story,
        emotion,
        latitude,
        longitude,
        date: new Date(),
        userId: user.id,
        isPublic: isPublic ?? true,
        photos: {
          create: Array.isArray(photos) ? photos.map((url: string) => ({ url })) : []
        }
      },
      include: {
        photos: true,
      }
    });

    return NextResponse.json(newMemory, { status: 201 });
  } catch (error) {
    console.error("[MOBILE_POST_MEMORY_ERROR]", error);
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
  }
}

