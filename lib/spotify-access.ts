import { hasActivePremium } from "./premium-status";
import { UserInventory, ShopItem, SpotifyAccessSource } from "@prisma/client";

export interface SpotifyAccessStatus {
    canUseSpotify: boolean;
    source: SpotifyAccessSource | null;
    hasPremiumAccess: boolean;
    hasPermanentShopUnlock: boolean;
    canAttachNewTrack: boolean;
    canEditTrack: boolean;
}

/**
 * Validasi akses pengguna terhadap fitur Spotify Integration.
 * @param user User object containing `premiumExpiresAt`
 * @param userInventories List of user's inventory items (must include `item` relation)
 */
export function getSpotifyAccess(
    user: { premiumExpiresAt: Date | string | null } | null,
    userInventories: (UserInventory & { item?: Pick<ShopItem, 'type' | 'value'> })[] = []
): SpotifyAccessStatus {
    const hasPremiumAccess = hasActivePremium(user);
    
    // Cek apakah user memiliki item 'spotify_integration' di inventory-nya
    const hasPermanentShopUnlock = userInventories.some(
        inv => inv.item?.value === "spotify_integration" || (inv as any).item?.value === "spotify_integration"
    );

    const canUseSpotify = hasPremiumAccess || hasPermanentShopUnlock;
    
    let source: SpotifyAccessSource | null = null;
    if (hasPremiumAccess && hasPermanentShopUnlock) {
        source = "BOTH";
    } else if (hasPremiumAccess) {
        source = "PREMIUM";
    } else if (hasPermanentShopUnlock) {
        source = "SHOP_PERMANENT";
    }

    return {
        canUseSpotify,
        source,
        hasPremiumAccess,
        hasPermanentShopUnlock,
        canAttachNewTrack: canUseSpotify,
        canEditTrack: canUseSpotify,
    };
}
