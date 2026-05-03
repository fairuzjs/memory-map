/**
 * lib/premium-config.ts
 *
 * Single source of truth untuk semua konfigurasi Free vs Premium.
 * Dipakai oleh backend (API routes) dan bisa di-import di frontend.
 *
 * ── Benefit Premium (10 items) ──────────────────────────────────
 * 1. Max foto per memory       : 3 → 10
 * 2. Max kolaborator            : 5 → 10
 * 3. Free gacha 5 pull/minggu
 * 4. Diskon shop 10%
 * 5. Pity system 30 pull → Legend (tanpa booster)
 * 6. Streak poin multiplier ×2
 * 7. Bonus 250 poin saat upgrade
 * 8. Custom map marker (5 style)
 * 9. Premium badge (crown) di profil & komentar
 * 10. Streak freeze 2×/bulan
 *
 * ── Savings Calculation (kurs Rp 10/poin) ───────────────────────
 * Free gacha 5×/minggu  : 5 × 4 × 20 = 400 pts = Rp 4.000
 * Streak ×2 (30 hari)   : 1.320 extra  = Rp 13.200
 * Upgrade bonus         : 250 pts      = Rp 2.500
 * Shop discount ~10%    : ~30 pts      = Rp 300
 * ─────────────────────────────────────────────────
 * Total terukur/bulan   : ~2.000 pts   = Rp 20.000
 * + fitur tak terhitung : pity, freeze, badge, markers, 10 foto
 *
 * Harga premium: Rp 20.000 → user aktif mendapat value ≥ Rp 20.000
 * dari poin saja + semua fitur eksklusif = WORTH IT
 */

// ─── Types ───────────────────────────────────────────────────────
export interface PremiumLimits {
    // Memory
    maxPhotos: number
    maxCollaborators: number

    // Gacha
    freeGachaPullsPerWeek: number
    duplicateRefund: number
    pityGuarantee: number | null   // null = tidak ada pity

    // Economy
    shopDiscountPercent: number
    streakMultiplier: number
    upgradeBonus: number           // poin saat pertama kali upgrade

    // Cosmetic / Features
    customMapMarkers: number       // jumlah style yang tersedia
    premiumBadge: boolean
    streakFreezesPerMonth: number

    // Spotify tetap di shop, tapi premium user auto-unlock
    spotifyUnlocked: boolean
}

// ─── Config ──────────────────────────────────────────────────────
export const PREMIUM_CONFIG: Record<"free" | "premium", PremiumLimits> = {
    free: {
        maxPhotos: 3,
        maxCollaborators: 5,
        freeGachaPullsPerWeek: 0,
        duplicateRefund: 5,
        pityGuarantee: null,
        shopDiscountPercent: 0,
        streakMultiplier: 1,
        upgradeBonus: 0,
        customMapMarkers: 0,
        premiumBadge: false,
        streakFreezesPerMonth: 0,
        spotifyUnlocked: false,
    },
    premium: {
        maxPhotos: 10,
        maxCollaborators: 10,
        freeGachaPullsPerWeek: 5,
        duplicateRefund: 10,
        pityGuarantee: 30,
        shopDiscountPercent: 10,
        streakMultiplier: 2,
        upgradeBonus: 250,
        customMapMarkers: 5,
        premiumBadge: true,
        streakFreezesPerMonth: 2,
        spotifyUnlocked: true,
    },
} as const

// ─── Pricing ─────────────────────────────────────────────────────
export const PREMIUM_PRICING = {
    durationDays: 30,
    price: 20_000,       // Rp 20.000
    label: "1 Bulan",
} as const

// Grace period (masa tenggang) saat premium expire
export const PREMIUM_GRACE_PERIOD_DAYS = 3

// ─── Helpers ─────────────────────────────────────────────────────

/** Dapatkan config berdasarkan status premium user */
export function getUserLimits(isPremium: boolean): PremiumLimits {
    return isPremium ? PREMIUM_CONFIG.premium : PREMIUM_CONFIG.free
}

/**
 * Cek apakah premium masih aktif (termasuk grace period).
 * - Jika `premiumExpiresAt` null → belum pernah premium → false
 * - Jika belum expire → aktif
 * - Jika sudah expire tapi masih dalam grace period → aktif (grace)
 * - Jika sudah melewati grace period → expired
 */
export function isPremiumActive(premiumExpiresAt: Date | string | null): boolean {
    if (!premiumExpiresAt) return false
    const expires = new Date(premiumExpiresAt)
    const now = new Date()
    // Tambahkan grace period
    const graceEnd = new Date(expires.getTime() + PREMIUM_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    return now < graceEnd
}

/**
 * Cek apakah user sedang dalam masa tenggang (grace period).
 * Berguna untuk menampilkan warning di UI.
 */
export function isInGracePeriod(premiumExpiresAt: Date | string | null): boolean {
    if (!premiumExpiresAt) return false
    const expires = new Date(premiumExpiresAt)
    const now = new Date()
    const graceEnd = new Date(expires.getTime() + PREMIUM_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    return now >= expires && now < graceEnd
}

/** Hitung sisa hari premium (termasuk grace period, min 0) */
export function premiumDaysRemaining(premiumExpiresAt: Date | string | null): number {
    if (!premiumExpiresAt) return 0
    const expires = new Date(premiumExpiresAt)
    const now = new Date()
    const diffMs = expires.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
}
