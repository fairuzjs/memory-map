// ============================================================
//  profanity-filter-v2.ts
//  Sistem Anti-Badwords v2 — Memory Map Global Chat
//  Peningkatan: scoring bertingkat, rate limiting, normalisasi
//  lebih dalam, deteksi pola kontekstual, whitelist kontekstual
// ============================================================

// ── 1. TIPE DATA ─────────────────────────────────────────────

export type SeverityLevel = "CLEAN" | "MILD" | "MODERATE" | "SEVERE";

export interface FilterResult {
    isFlagged: boolean;
    severity: SeverityLevel;
    matchedWords: string[];   // kata yang terdeteksi (untuk logging)
    reason: string;           // alasan singkat untuk ditampilkan ke user
}

// ── 2. DICTIONARY ────────────────────────────────────────────

/** Kata dengan bobot SEVERE — langsung tolak & log */
export const BAD_WORDS_SEVERE = [
    // Indonesian
    "kontol", "memek", "ngentot", "ngentod", "puki", "pepek", "pantek",
    "jembut", "lonte", "pelacur", "perek", "jablay",
    // English
    "fuck", "fucker", "fucking", "motherfucker", "cunt",
    "nigger", "nigga", "faggot",
];

/** Kata dengan bobot MODERATE — peringatan keras */
export const BAD_WORDS_MODERATE = [
    // Indonesian
    "anjing", "anjir", "anjrit", "bangsat", "bgst", "bajingan",
    "keparat", "brengsek", "kampret", "babi", "tai", "sialan",
    "goblok", "tolol", "idiot", "bego",
    "setan", "iblis", "monyet", "kunyuk",
    // English
    "shit", "bullshit", "bitch", "asshole", "ass", "dick",
    "pussy", "bastard", "slut", "whore", "damn", "crap",
];

/** Kata dengan bobot MILD — peringatan ringan / monitor */
export const BAD_WORDS_MILD = [
    // Indonesian slang ringan yang tetap perlu dimonitor
    "banci", "bencong", "maho", "waria",
    "ngehe", "kampungan",
    // English ringan
    "retard", "dyke",
];

// Gabungan semua kata untuk lookup cepat
const ALL_BAD_WORDS = {
    SEVERE:   BAD_WORDS_SEVERE,
    MODERATE: BAD_WORDS_MODERATE,
    MILD:     BAD_WORDS_MILD,
};

// ── 3. WHITELIST KONTEKSTUAL ──────────────────────────────────

/**
 * Whitelist berbasis regex konteks.
 * Setiap entry berupa [pola kata aman, deskripsi].
 * Kata dihapus HANYA jika cocok sebagai kata utuh (bukan substring acak).
 */
export const WHITELIST_PATTERNS: RegExp[] = [
    /\bpantai\b/g,
    /\bsantai\b/g,
    /\bbadai\b/g,
    /\bcintai\b/g,
    /\bpetai\b/g,
    /\brantai\b/g,
    /\blantai\b/g,
    /\buntai\b/g,
    /\bmencintai\b/g,
    /\bkedai\b/g,
    /\bpondasi\b/g,
    /\bdinasti\b/g,
    /\bfantasi\b/g,
    /\becstasy\b/g,       // nama obat dalam konteks medis
    /\bclass\b/g,         // mencegah "ass" dari kata "class"
    /\bgrass\b/g,
    /\bbass\b/g,
    /\bpass\b/g,
    /\bmass\b/g,
    /\bkiss\b/g,
    /\bdickens\b/g,
    /\bdickson\b/g,
    /\bbastille\b/g,
    /\bassist\b/g,
    /\bassistant\b/g,
    /\bassociate\b/g,
    /\bassume\b/g,
    /\bassess\b/g,
    /\bassign\b/g,
    /\bassemble\b/g,
    /\bassert\b/g,
    /\bassure\b/g,
    /\basset\b/g,
];

// ── 4. POLA KONTEKSTUAL TAMBAHAN ─────────────────────────────

/**
 * Regex untuk mendeteksi pola mencurigakan yang tidak ada di dictionary
 * tapi menunjukkan niat menghindari filter.
 * Contoh: "a-n-j-i-n-g", "@nj!ng", "4 n j i n g"
 */
const EVASION_PATTERNS: RegExp[] = [
    // Karakter berselang-seling dengan simbol/spasi (≥5 karakter)
    /([a-z][^a-z]){4,}[a-z]/i,
    // Huruf diulang berlebihan (≥4 kali berturut) → intensifikasi
    /(.)\1{3,}/i,
    // Kombinasi @ atau 4 diikuti pola konsonan umum kata kasar
    /[@4][nN][jJ]/,
    /[kK][0oO][nN][tT]/,
    /[nN][gG][eE3][nN][tT]/,
];

// ── 5. NORMALISASI ───────────────────────────────────────────

/**
 * Peta karakter unicode yang terlihat mirip huruf latin (homoglyphs).
 * Digunakan untuk mendeteksi trik penggantian karakter unicode.
 */
const UNICODE_MAP: Record<string, string> = {
    "à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a","æ":"ae",
    "è":"e","é":"e","ê":"e","ë":"e",
    "ì":"i","í":"i","î":"i","ï":"i",
    "ò":"o","ó":"o","ô":"o","õ":"o","ö":"o","ø":"o",
    "ù":"u","ú":"u","û":"u","ü":"u",
    "ñ":"n","ç":"c","ß":"ss","ý":"y",
    // Karakter full-width (sering dipakai di keyboard Asia)
    "ａ":"a","ｂ":"b","ｃ":"c","ｄ":"d","ｅ":"e","ｆ":"f","ｇ":"g",
    "ｈ":"h","ｉ":"i","ｊ":"j","ｋ":"k","ｌ":"l","ｍ":"m","ｎ":"n",
    "ｏ":"o","ｐ":"p","ｑ":"q","ｒ":"r","ｓ":"s","ｔ":"t","ｕ":"u",
    "ｖ":"v","ｗ":"w","ｘ":"x","ｙ":"y","ｚ":"z",
};

function normalizeText(raw: string): string {
    let text = raw.toLowerCase();

    // Hapus zero-width characters & RTL/LTR marks
    text = text.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "");

    // Ganti unicode homoglyphs
    text = text.replace(/[^\u0000-\u007E]/g, ch => UNICODE_MAP[ch] ?? ch);

    // Hapus whitelist kontekstual (berbasis \b — kata utuh)
    for (const pattern of WHITELIST_PATTERNS) {
        text = text.replace(pattern, " ");
    }

    // Normalisasi leetspeak & simbol umum
    text = text
        .replace(/[0]/g,  "o")
        .replace(/[1!|¡]/g, "i")
        .replace(/[3€]/g, "e")
        .replace(/[4@]/g,  "a")
        .replace(/[5$]/g,  "s")
        .replace(/[7]/g,   "t")
        .replace(/[8]/g,   "b")
        .replace(/[9]/g,   "g")
        .replace(/[6]/g,   "g")
        .replace(/[(]/g,   "c")   // (unt → cunt
        .replace(/[*]/g,   "")    // hapus asterisk yang sering dipakai sensor manual
        .replace(/[+]/g,   "t")   // varian +
        .replace(/[vV]/g,  "v");  // normalisasi v (vuck → fuck setelah f-check)

    // Hapus semua non-huruf (strip titik, spasi, simbol)
    const stripped = text.replace(/[^a-z]/g, "");

    // Deduplikasi huruf berulang (anjiiing → anjing)
    const deduped = stripped.replace(/(.)\1+/g, "$1");

    return deduped;
}

// ── 6. RATE LIMITER PER USER ──────────────────────────────────

interface ViolationRecord {
    count:     number;
    firstAt:   number;  // timestamp ms
    lastAt:    number;
}

const RATE_WINDOW_MS   = 10 * 60 * 1000; // 10 menit
const ESCALATE_AFTER   = 3;              // pelanggaran ke-3 → eskalasi severity

const violationStore   = new Map<string, ViolationRecord>();
const guestBanStore    = new Map<string, number>(); // Stores guestId or IP -> bannedUntil timestamp

export function banGuest(identifier: string, durationMs: number): void {
    guestBanStore.set(identifier, Date.now() + durationMs);
}

export function isGuestBanned(identifier: string): boolean {
    return getGuestBannedUntil(identifier) !== null;
}

export function getGuestBannedUntil(identifier: string): number | null {
    const bannedUntil = guestBanStore.get(identifier);
    if (!bannedUntil) return null;
    if (Date.now() > bannedUntil) {
        guestBanStore.delete(identifier);
        return null;
    }
    return bannedUntil;
}

function recordViolation(userId: string): number {
    const now  = Date.now();
    const rec  = violationStore.get(userId);

    if (!rec || now - rec.firstAt > RATE_WINDOW_MS) {
        violationStore.set(userId, { count: 1, firstAt: now, lastAt: now });
        return 1;
    }

    rec.count++;
    rec.lastAt = now;
    return rec.count;
}

export function getViolationCount(userId: string): number {
    const rec = violationStore.get(userId);
    if (!rec) return 0;
    if (Date.now() - rec.firstAt > RATE_WINDOW_MS) return 0;
    return rec.count;
}

/** Hapus data user dari store (misal setelah ban atau reset manual) */
export function resetUserViolations(userId: string): void {
    violationStore.delete(userId);
}

// ── 7. FUNGSI UTAMA ───────────────────────────────────────────

/**
 * Memeriksa teks apakah mengandung konten tidak pantas.
 *
 * @param text     - Pesan yang dikirim user
 * @param userId   - ID unik user (untuk rate limiting). Opsional.
 * @returns        FilterResult dengan severity, kata yang cocok, dan alasan
 *
 * @example
 * const result = checkMessage("dasar 4nj1ng lu", "user_123");
 * if (result.isFlagged) {
 *     showWarning(result.reason);
 * }
 */
export function checkMessage(text: string, userId?: string): FilterResult {
    if (!text?.trim()) {
        return { isFlagged: false, severity: "CLEAN", matchedWords: [], reason: "" };
    }

    const normalized = normalizeText(text);
    const matched: string[]    = [];
    let   detectedSeverity: SeverityLevel = "CLEAN";

    // Cek dictionary dari SEVERE ke MILD (berhenti di yang tertinggi)
    for (const [level, words] of Object.entries(ALL_BAD_WORDS) as [SeverityLevel, string[]][]) {
        for (const word of words) {
            const cleanWord = word.replace(/(.)\1+/g, "$1");
            if (normalized.includes(cleanWord)) {
                matched.push(word);
                if (
                    detectedSeverity === "CLEAN" ||
                    severityRank(level) > severityRank(detectedSeverity)
                ) {
                    detectedSeverity = level;
                }
            }
        }
    }

    // Cek pola evasion jika belum terdeteksi (atau tambah severity)
    if (detectedSeverity === "CLEAN") {
        for (const pattern of EVASION_PATTERNS) {
            if (pattern.test(text)) {
                detectedSeverity = "MILD";
                matched.push("[pola evasion]");
                break;
            }
        }
    }

    // Jika bersih, kembalikan langsung
    if (detectedSeverity === "CLEAN") {
        return { isFlagged: false, severity: "CLEAN", matchedWords: [], reason: "" };
    }

    // Rate limiting: eskalasi severity jika user berulang kali melanggar
    if (userId) {
        const totalViolations = recordViolation(userId);
        if (totalViolations >= ESCALATE_AFTER && detectedSeverity !== "SEVERE") {
            // Eskalasi satu level ke atas
            detectedSeverity = escalateSeverity(detectedSeverity);
        }
    }

    return {
        isFlagged:    true,
        severity:     detectedSeverity,
        matchedWords: [...new Set(matched)],  // deduplikasi
        reason:       buildReason(detectedSeverity, userId),
    };
}

// ── 8. HELPER ─────────────────────────────────────────────────

function severityRank(s: SeverityLevel): number {
    return { CLEAN: 0, MILD: 1, MODERATE: 2, SEVERE: 3 }[s];
}

function escalateSeverity(s: SeverityLevel): SeverityLevel {
    const ladder: SeverityLevel[] = ["CLEAN", "MILD", "MODERATE", "SEVERE"];
    const idx = ladder.indexOf(s);
    return ladder[Math.min(idx + 1, ladder.length - 1)];
}

function buildReason(severity: SeverityLevel, userId?: string): string {
    const violations = userId ? getViolationCount(userId) : 0;
    const repeat     = violations >= ESCALATE_AFTER ? " (pelanggaran berulang)" : "";

    switch (severity) {
        case "MILD":
            return `Pesan mengandung kata yang kurang sopan${repeat}. Mohon jaga komunikasi.`;
        case "MODERATE":
            return `Pesan mengandung kata kasar${repeat}. Pesan tidak dapat dikirim.`;
        case "SEVERE":
            return `Pesan mengandung konten yang sangat tidak pantas${repeat}. Akun Anda mungkin dibatasi.`;
        default:
            return "";
    }
}

// ── 9. AKSI BERDASARKAN SEVERITY (contoh integrasi) ───────────

export type FilterAction = "ALLOW" | "WARN" | "BLOCK" | "BAN_REVIEW";

/**
 * Menentukan aksi yang diambil berdasarkan hasil filter.
 * Sesuaikan threshold ini dengan kebijakan komunitas Memory Map.
 */
export function resolveAction(result: FilterResult, userId?: string): FilterAction {
    if (!result.isFlagged) return "ALLOW";

    const violations = userId ? getViolationCount(userId) : 0;

    switch (result.severity) {
        case "MILD":
            return "WARN";           // tampilkan peringatan, pesan tetap terkirim
        case "MODERATE":
            return "BLOCK";          // pesan diblokir, user diberi tahu
        case "SEVERE":
            return "BAN_REVIEW";     // langsung banned permanen untuk kata sangat berat
        default:
            return "ALLOW";
    }
}
