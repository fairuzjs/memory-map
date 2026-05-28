import { isPremiumActive, isInGracePeriod, premiumDaysRemaining, PREMIUM_GRACE_PERIOD_DAYS } from "./premium-config";

export interface PremiumStatus {
    isActive: boolean;
    isExpired: boolean;
    isInGracePeriod: boolean;
    expiresAt: Date | null;
    graceEndsAt: Date | null;
    daysRemaining: number;
    graceDaysRemaining: number;
    shouldDeactivate: boolean;
}

/**
 * Single source of truth untuk status premium user.
 * Return object lengkap berisi detail aktif/expired dan masa tenggang.
 */
export function getPremiumStatus(user: { premiumExpiresAt: Date | string | null } | null): PremiumStatus {
    if (!user || !user.premiumExpiresAt) {
        return {
            isActive: false,
            isExpired: true,
            isInGracePeriod: false,
            expiresAt: null,
            graceEndsAt: null,
            daysRemaining: 0,
            graceDaysRemaining: 0,
            shouldDeactivate: false, // Jika memang bukan premium, tidak perlu di-deactivate (karena default isPremium false)
        };
    }

    const expiresAt = new Date(user.premiumExpiresAt);
    const now = new Date();
    
    const graceEndsAt = new Date(expiresAt.getTime() + PREMIUM_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    
    const isActive = now < graceEndsAt; // Aktif selama belum melewati masa tenggang
    const isExpired = now >= graceEndsAt; // Expired total jika sudah melewati masa tenggang
    const isInGracePeriodStatus = now >= expiresAt && now < graceEndsAt;

    const diffGraceMs = graceEndsAt.getTime() - now.getTime();
    const graceDaysRemaining = Math.max(0, Math.ceil(diffGraceMs / (24 * 60 * 60 * 1000)));

    const daysRemaining = premiumDaysRemaining(user.premiumExpiresAt);

    return {
        isActive,
        isExpired,
        isInGracePeriod: isInGracePeriodStatus,
        expiresAt,
        graceEndsAt,
        daysRemaining,
        graceDaysRemaining,
        shouldDeactivate: isExpired,
    };
}

/**
 * Helper ringkas: Return true hanya jika user masih punya akses premium (belum expired total).
 */
export function hasActivePremium(user: { premiumExpiresAt: Date | string | null } | null): boolean {
    return getPremiumStatus(user).isActive;
}
