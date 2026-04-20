/**
 * lib/rate-limit.ts
 *
 * In-memory sliding window rate limiter untuk Next.js API Routes (Node.js runtime).
 *
 * CARA KERJA:
 * - Setiap request diberi kunci unik (IP, userId, dsb)
 * - Setiap kunci memiliki counter + waktu reset (window)
 * - Jika counter melebihi limit dalam window, request ditolak (429)
 * - Keys yang sudah expired dibersihkan otomatis setiap 5 menit
 *
 * CATATAN PRODUCTION:
 * - Cocok untuk single-instance deployment (VPS, Railway, Render, dll)
 * - Untuk multi-instance / Vercel Edge → ganti store dengan Redis (Upstash)
 * - Counter reset saat server restart (dapat diterima untuk sebagian besar use case)
 */

interface RateLimitEntry {
    count: number
    resetAt: number // Unix timestamp (ms)
}

type RateLimitResult =
    | { success: true; remaining: number; reset: number }
    | { success: false; remaining: 0; reset: number }

// ─── In-Memory Store ────────────────────────────────────────────────────────
// Map<key, entry> — shared across requests dalam satu proses Node.js
const store = new Map<string, RateLimitEntry>()

// Bersihkan keys yang sudah expired setiap 5 menit agar tidak memory leak
const CLEANUP_INTERVAL_MS = 5 * 60_000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
    if (cleanupTimer) return
    cleanupTimer = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store) {
            if (now >= entry.resetAt) store.delete(key)
        }
    }, CLEANUP_INTERVAL_MS)

    // Jangan block process exit
    if (cleanupTimer.unref) cleanupTimer.unref()
}

// ─── Core Function ───────────────────────────────────────────────────────────

/**
 * Cek dan catat satu request terhadap rate limit.
 *
 * @param key      - Identifier unik: IP address, user ID, email, dll
 * @param limit    - Maksimum request yang diizinkan dalam window
 * @param windowMs - Panjang window dalam milliseconds
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    ensureCleanup()

    const now = Date.now()
    const entry = store.get(key)

    // Jika tidak ada entry atau window sudah expired → mulai window baru
    if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { success: true, remaining: limit - 1, reset: now + windowMs }
    }

    // Sudah melebihi limit → tolak
    if (entry.count >= limit) {
        return { success: false, remaining: 0, reset: entry.resetAt }
    }

    // Increment counter
    entry.count++
    return {
        success: true,
        remaining: limit - entry.count,
        reset: entry.resetAt,
    }
}

// ─── IP Extractor ────────────────────────────────────────────────────────────

/**
 * Ekstrak IP address dari request.
 * Mendukung reverse proxy (Vercel, Nginx, Cloudflare, dsb).
 */
export function getClientIP(req: Request): string {
    // Cloudflare
    const cfIP = req.headers.get("cf-connecting-ip")
    if (cfIP) return cfIP.trim()

    // Vercel / common proxy
    const forwarded = req.headers.get("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0].trim()

    // Nginx proxy_pass
    const realIP = req.headers.get("x-real-ip")
    if (realIP) return realIP.trim()

    return "unknown"
}

// ─── Standard 429 Response ───────────────────────────────────────────────────

/**
 * Kembalikan response 429 dengan header Retry-After dan X-RateLimit-Reset.
 */
export function rateLimitResponse(reset: number): Response {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    return new Response(
        JSON.stringify({
            error: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
            retryAfter: retryAfterSec,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfterSec),
                "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
                "X-RateLimit-Remaining": "0",
            },
        }
    )
}

// ─── Preset Configurations ───────────────────────────────────────────────────
// Kumpulan konfigurasi siap pakai untuk berbagai jenis endpoint

export const RATE_LIMITS = {
    /** Registrasi akun baru: 5 kali per jam per IP */
    REGISTER: { limit: 5, windowMs: 60 * 60_000 },

    /** Lupa password / kirim email reset: 3 kali per jam per IP */
    FORGOT_PASSWORD: { limit: 3, windowMs: 60 * 60_000 },

    /** Upload file: 20 kali per jam per user */
    UPLOAD: { limit: 20, windowMs: 60 * 60_000 },

    /** Gacha: 50 kali per jam per user */
    GACHA: { limit: 50, windowMs: 60 * 60_000 },

    /** Komentar: 30 kali per jam per user */
    COMMENT: { limit: 30, windowMs: 60 * 60_000 },

    /** Reaction: 60 kali per jam per user */
    REACTION: { limit: 60, windowMs: 60 * 60_000 },

    /** Pembelian shop: 20 kali per jam per user */
    SHOP_PURCHASE: { limit: 20, windowMs: 60 * 60_000 },
} as const
