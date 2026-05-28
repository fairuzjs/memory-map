import { prisma } from "./prisma";
import { getPremiumStatus } from "./premium-status";

/**
 * Lazy cleanup: Mengecek apakah status premium user di database (isPremium) perlu di-downgrade.
 * Dipanggil pada endpoint backend yang sering diakses (misal /api/premium/status, /api/memories).
 * 
 * Skenario:
 * - isPremium == true di DB, tapi getPremiumStatus() return shouldDeactivate == true
 * - Maka update isPremium menjadi false tanpa menghapus premiumExpiresAt atau data lainnya.
 * 
 * @param user Partial user object dari DB
 * @returns boolean - True jika terjadi cleanup, False jika tidak
 */
export async function checkAndCleanupPremium(user: { id: string; isPremium: boolean; premiumExpiresAt: Date | null }): Promise<boolean> {
    if (!user.isPremium) return false;

    const status = getPremiumStatus({ premiumExpiresAt: user.premiumExpiresAt });

    if (status.shouldDeactivate) {
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { isPremium: false },
            });
            console.log(`[Premium Cleanup] User ${user.id} premium expired. isPremium set to false.`);
            return true;
        } catch (error) {
            console.error(`[Premium Cleanup] Failed to cleanup user ${user.id}:`, error);
        }
    }

    return false;
}
