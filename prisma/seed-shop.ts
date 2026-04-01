import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SHOP_ITEMS = [
    // ── Avatar Frames ──────────────────────────────────────
    {
        name: "Lingkaran Api",
        description: "Bingkai berkilap berwarna oranye-merah yang membara.",
        price: 75,
        type: "AVATAR_FRAME" as const,
        value: "linear-gradient(135deg, #ff6b35, #f7c59f, #e63946, #ff6b35)",
        previewColor: "#ff6b35",
    },
    {
        name: "Cincin Emas",
        description: "Bingkai mewah bergradasi emas untuk explorer sejati.",
        price: 150,
        type: "AVATAR_FRAME" as const,
        value: "linear-gradient(135deg, #f9c74f, #f8961e, #f3722c, #f9c74f)",
        previewColor: "#f9c74f",
    },
    {
        name: "Neon Cyan",
        description: "Bingkai bercahaya warna cyan neon modern.",
        price: 100,
        type: "AVATAR_FRAME" as const,
        value: "linear-gradient(135deg, #00f5d4, #00bbf9, #4361ee, #00f5d4)",
        previewColor: "#00f5d4",
    },
    {
        name: "Pelangi Ajaib",
        description: "Bingkai dengan semua warna pelangi yang memukau.",
        price: 250,
        type: "AVATAR_FRAME" as const,
        value: "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #ff6b6b)",
        previewColor: "#ff6b6b",
    },
    // ── Profile Banners ─────────────────────────────────────
    {
        name: "Aurora Boreal",
        description: "Latar hijau-cyan bergelombang seperti cahaya aurora utara.",
        price: 100,
        type: "PROFILE_BANNER" as const,
        value: "linear-gradient(135deg, #0f3460 0%, #16213e 30%, #0d7377 60%, #14a085 100%)",
        previewColor: "#0d7377",
    },
    {
        name: "Langit Senja",
        description: "Gradasi merah-oranye-ungu indah seperti matahari terbenam.",
        price: 125,
        type: "PROFILE_BANNER" as const,
        value: "linear-gradient(135deg, #2d1b69 0%, #8b1a1a 30%, #d4541a 60%, #e8852b 100%)",
        previewColor: "#d4541a",
    },
    {
        name: "Galaxy Dalam",
        description: "Latar hitam penuh bintang dan nebula berwarna.",
        price: 200,
        type: "PROFILE_BANNER" as const,
        value: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 25%, #0d1a3a 50%, #1e0040 75%, #0a0a0f 100%)",
        previewColor: "#1a0a2e",
    },
    {
        name: "Sakura Malam",
        description: "Gradasi pink-merah muda hening seperti bunga sakura.",
        price: 150,
        type: "PROFILE_BANNER" as const,
        value: "linear-gradient(135deg, #1a0a1e 0%, #3d1040 30%, #8b3a6e 60%, #c97ba8 100%)",
        previewColor: "#8b3a6e",
    },
    {
        name: "Lautan Biru",
        description: "Gradasi biru dalam seperti samudra tak berujung.",
        price: 100,
        type: "PROFILE_BANNER" as const,
        value: "linear-gradient(135deg, #0a1628 0%, #0d3b6e 40%, #1565c0 70%, #1e88e5 100%)",
        previewColor: "#1565c0",
    },
    // ── Memory Card Themes ──────────────────────────────────
    {
        name: "Polaroid",
        description: "Tampilan kartu kenangan seperti foto polaroid klasik dengan bingkai putih.",
        price: 175,
        type: "MEMORY_CARD_THEME" as const,
        value: JSON.stringify({
            border: "4px solid #f5f0e8",
            background: "#f5f0e8",
            shadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            imageFilter: "sepia(15%) contrast(1.05) brightness(1.02)",
            radius: "4px",
            contentPadding: "p-3 pb-6",
            titleColor: "#1a1a1a",
            storyColor: "#4a4a4a",
            footerBorder: "border-t border-neutral-200",
            footerTextColor: "text-neutral-500",
        }),
        previewColor: "#f5f0e8",
    },
    {
        name: "Vintage",
        description: "Efek sepia hangat seperti foto jadul dari era 70-an.",
        price: 150,
        type: "MEMORY_CARD_THEME" as const,
        value: JSON.stringify({
            border: "2px solid #7c5c2e",
            background: "linear-gradient(160deg, #1a1208 0%, #2a1f0e 100%)",
            shadow: "0 8px 32px rgba(100,60,10,0.4), inset 0 1px 0 rgba(255,200,100,0.05)",
            imageFilter: "sepia(60%) contrast(0.9) brightness(0.95) saturate(0.8)",
            radius: "8px",
            contentPadding: "p-4",
            titleColor: "#d4aa70",
            storyColor: "#a08060",
            footerBorder: "border-t border-amber-900/40",
            footerTextColor: "text-amber-800/70",
        }),
        previewColor: "#7c5c2e",
    },
    {
        name: "Dark Minimal",
        description: "Tampilan kartu bersih dengan border tipis neon dan font modern.",
        price: 140,
        type: "MEMORY_CARD_THEME" as const,
        value: JSON.stringify({
            border: "1px solid rgba(99,102,241,0.5)",
            background: "linear-gradient(160deg, rgba(10,10,20,0.98), rgba(5,5,15,0.99))",
            shadow: "0 0 24px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.6)",
            imageFilter: "contrast(1.1) brightness(0.95) saturate(1.1)",
            radius: "16px",
            contentPadding: "p-5",
            titleColor: "#e0e7ff",
            storyColor: "#6b7280",
            footerBorder: "border-t border-indigo-500/20",
            footerTextColor: "text-indigo-400/60",
        }),
        previewColor: "#6366f1",
    },
]

async function main() {
    console.log("🌟 Seeding shop items...")

    const existing = await prisma.shopItem.findMany({ select: { name: true } })
    const existingNames = new Set(existing.map((i: { name: string }) => i.name))

    const toCreate = SHOP_ITEMS.filter((item) => !existingNames.has(item.name))

    if (toCreate.length > 0) {
        await prisma.shopItem.createMany({ data: toCreate })
        console.log(`✅ Created ${toCreate.length} shop items`)
    } else {
        console.log("⏭️  All shop items already exist, skipping.")
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })