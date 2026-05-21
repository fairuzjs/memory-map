import {
    MapPin, Map, BookText, Smile, ImagePlus, Music, Users,
    Globe, Save, ChevronRight, CheckCircle2, Sparkles, Flame, Package, User,
    ShoppingBag, Dices, Crown, Settings, MessageSquareText, HelpCircle,
    BookOpen, Plus, Image as ImageIcon, FolderPlus, BookHeart, Crop, Layers3
} from "lucide-react"

// ─── Step Types ─────────────────────────────────────────────────────────────
export interface OnboardingStep {
    id: string
    title: string
    description: string
    helperText?: string         // shown if validation fails
    icon: any
    accentColor: string
    targetSelector?: string     // CSS selector for spotlight
    mobileTargetSelector?: string  // CSS selector for mobile alternative
    requiredPath?: string       // route to navigate before showing
    position?: "center" | "auto" // "center" = modal, "auto" = anchored to target
    allowInteraction?: boolean  // allow clicking the highlighted element
    scrollToTarget?: boolean    // scroll element into view before spotlighting
    formStep?: number           // which form step (0 or 1) user should be on
    nextLabel?: string          // custom label for next button
    backLabel?: string          // custom label for back button
    showSkip?: boolean          // show skip/lewati button
    /** If true, this step is an "action step" — user must click target to proceed. Hide "Lanjut" button. */
    isActionStep?: boolean
    /** Hint text shown on action steps instead of next button */
    actionHint?: string
    /** If true, the action step will not auto-advance on click; it must be advanced programmatically. */
    manualAdvance?: boolean
    /** Delay (ms) to wait after action completes before advancing */
    actionDelay?: number
    /** If true, step requires opening hamburger menu first on mobile */
    requiresHamburger?: boolean
    /** Guide key this step belongs to */
    guideKey?: string
    /** CSS selector to observe for DOM mutations (appear/disappear) */
    observeSelector?: string
    /** If true, advance when observeSelector element disappears from DOM */
    observeDisappear?: boolean
    /** If true, render as a compact floating helper that doesn't block interaction */
    isFloatingHelper?: boolean
}

// ─── Guide Definitions for Popup ────────────────────────────────────────────
export interface GuideDefinition {
    key: string
    title: string
    description: string
    icon: any
    accentColor: string
    /** If set, navigate to this path when guide is selected */
    navigateTo?: string
    /** If true, use the firstMemoryOnboarding steps */
    useSteps?: boolean
    /** CSS selector to highlight on the destination page */
    highlightSelector?: string
    /** Mobile alternative selector */
    mobileHighlightSelector?: string
}

export const GUIDE_DEFINITIONS: GuideDefinition[] = [
    {
        key: "album",
        title: "PANDUAN ALBUM",
        description: "Panduan lengkap cara mengelompokkan kenangan berdasarkan tema cerita kustom, cover manual, ganti cover, tambah & pindah kenangan.",
        icon: BookOpen,
        accentColor: "#00FFFF",
        useSteps: true,
        navigateTo: "/albums",
    },
    {
        key: "firstMemory",
        title: "CARA MEMBUAT MEMORY",
        description: "Panduan lengkap membuat kenangan pertama dari judul, cerita, tanggal, lokasi, upload foto, musik, privasi, hingga publish.",
        icon: Sparkles,
        accentColor: "#00FFFF",
        useSteps: true,
    },
    {
        key: "map",
        title: "HALAMAN MAP",
        description: "Jelajahi peta dunia dan lihat semua kenangan yang telah disimpan.",
        icon: Map,
        accentColor: "#00FF00",
        navigateTo: "/map",
        highlightSelector: "[data-tutorial='map-area'], .leaflet-container, #map-container",
    },
    {
        key: "community",
        title: "COMMUNITY",
        description: "Lihat kenangan publik dari pengguna lain dan berinteraksi.",
        icon: Globe,
        accentColor: "#FF00FF",
        navigateTo: "/community",
    },
    {
        key: "streak",
        title: "STREAK",
        description: "Klaim streak harian dan kumpulkan poin dengan konsistensi.",
        icon: Flame,
        accentColor: "#FFFF00",
        navigateTo: "/streak",
        highlightSelector: "[data-tutorial='claim-streak'], button:has(.lucide-flame)",
    },
    {
        key: "shop",
        title: "SHOP",
        description: "Beli item dekorasi dan aksesori untuk mempercantik profil dan peta.",
        icon: ShoppingBag,
        accentColor: "#00FFFF",
        navigateTo: "/shop",
        highlightSelector: "[data-tutorial='shop-items'], .shop-items-grid",
    },
    {
        key: "gacha",
        title: "GACHA",
        description: "Buka gacha dan dapatkan item langka secara acak.",
        icon: Dices,
        accentColor: "#FF00FF",
        navigateTo: "/gacha",
        highlightSelector: "[data-tutorial='open-gacha'], button:has(.lucide-dices)",
    },
    {
        key: "inventory",
        title: "INVENTORY",
        description: "Kelola koleksi item dan dekorasi yang kamu miliki.",
        icon: Package,
        accentColor: "#00FF00",
        navigateTo: "/inventory",
    },
    {
        key: "premium",
        title: "PREMIUM",
        description: "Pelajari fitur premium dan manfaat berlangganan.",
        icon: Crown,
        accentColor: "#FFFF00",
        navigateTo: "/premium",
    },
    {
        key: "profile",
        title: "PROFILE",
        description: "Lihat dan edit profil, statistik, dan koleksi kenanganmu.",
        icon: User,
        accentColor: "#00FFFF",
        navigateTo: "/profile/__USER__", // Will be replaced with actual user ID
    },
    {
        key: "settings",
        title: "SETTINGS",
        description: "Atur preferensi akun, notifikasi, dan pengaturan lainnya.",
        icon: Settings,
        accentColor: "#FF00FF",
        navigateTo: "/settings",
    },
    {
        key: "bantuan",
        title: "BANTUAN",
        description: "Kirim tiket bantuan atau lihat pusat bantuan.",
        icon: MessageSquareText,
        accentColor: "#00FF00",
        navigateTo: "/feedbacks",
    },
]

// ─── First Memory Onboarding Steps ──────────────────────────────────────────
export const FIRST_MEMORY_STEPS: OnboardingStep[] = [
    // Step 1 — Welcome
    {
        id: "welcome",
        title: "Selamat Datang di Memory Map!",
        description: "Mari buat kenangan pertamamu. Kami akan memandu langkah demi langkah hingga kenangan pertamamu berhasil tersimpan.",
        icon: MapPin,
        accentColor: "#00FFFF",
        position: "center",
        nextLabel: "Mulai",
        showSkip: true,
        guideKey: "firstMemory",
    },
    // Step 2 — Tombol Tambah Kenangan
    {
        id: "click-create",
        title: "Tambah Kenangan",
        description: "Klik tombol ini untuk mulai membuat kenangan baru. Setiap kenangan berisi cerita, lokasi, dan perasaan yang ingin kamu simpan.",
        icon: Sparkles,
        accentColor: "#FFFF00",
        targetSelector: "[data-tutorial='create-memory']",
        requiredPath: "/dashboard",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        isActionStep: true,
        actionHint: "Klik area yang disorot untuk melanjutkan",
        actionDelay: 800,
        guideKey: "firstMemory",
    },
    // Step 3 — Judul Memory
    {
        id: "input-title",
        title: "Beri Judul Kenangan",
        description: "Beri judul untuk kenanganmu. Judul yang baik akan membuatmu mudah mengingat momen ini.",
        helperText: "Judul wajib diisi.",
        icon: BookText,
        accentColor: "#00FFFF",
        targetSelector: "[data-tutorial='input-title']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 0,
        guideKey: "firstMemory",
    },
    // Step 4 — Cerita Memory
    {
        id: "input-story",
        title: "Ceritakan Momenmu",
        description: "Ceritakan momen yang ingin kamu simpan. Tulis sebebas mungkin — detail kecil sering menjadi yang paling berharga.",
        helperText: "Cerita wajib diisi.",
        icon: BookText,
        accentColor: "#FF00FF",
        targetSelector: "[data-tutorial='input-story']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 0,
        guideKey: "firstMemory",
    },
    // Step 5 — Tanggal
    {
        id: "input-date",
        title: "Pilih Tanggal",
        description: "Pilih tanggal saat kenangan ini terjadi. Bisa tanggal hari ini atau kapan saja di masa lalu.",
        icon: BookText,
        accentColor: "#FFFF00",
        targetSelector: "[data-tutorial='input-date']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 0,
        guideKey: "firstMemory",
    },
    // Step 6 — Perasaan
    {
        id: "input-emotion",
        title: "Pilih Suasana Hati",
        description: "Pilih suasana hati yang paling cocok dengan kenangan ini. Perasaanmu akan ditampilkan sebagai ikon di peta.",
        icon: Smile,
        accentColor: "#FF00FF",
        targetSelector: "[data-tutorial='input-emotion']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 0,
        guideKey: "firstMemory",
    },
    // Step 7 — Lokasi
    {
        id: "input-location",
        title: "Tandai Lokasi",
        description: "Cari lokasi atau klik titik di peta tempat kenangan ini terjadi. Lokasi akan muncul sebagai pin di peta dunia.",
        icon: Map,
        accentColor: "#00FF00",
        targetSelector: "[data-tutorial='input-location']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 0,
        guideKey: "firstMemory",
    },
    // Step 8 — Lanjut ke Step Media
    {
        id: "click-next-step",
        title: "Lanjutkan ke Media",
        description: "Bagus! Detail kenangan sudah terisi. Klik 'Lanjutkan' untuk menambahkan foto, musik, dan pengaturan lainnya.",
        icon: ChevronRight,
        accentColor: "#00FFFF",
        targetSelector: "[data-tutorial='btn-next-step']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 0,
        isActionStep: true,
        manualAdvance: true,
        actionHint: "Klik area yang disorot untuk melanjutkan",
        actionDelay: 600,
        guideKey: "firstMemory",
    },
    // Step 9 — Upload Foto
    {
        id: "upload-photo",
        title: "Tambahkan Foto",
        description: "Tambahkan minimal 1 foto agar kenanganmu terasa hidup. Foto akan ditampilkan sebagai galeri di halaman memory.",
        helperText: "Wajib upload minimal 1 foto untuk onboarding pertama.",
        icon: ImagePlus,
        accentColor: "#00FF00",
        targetSelector: "[data-tutorial='photo-uploader']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        guideKey: "firstMemory",
    },
    // Step 10 — Cover Memory Section
    {
        id: "cover-memory-section",
        title: "Cover Memory",
        description: "Cover Memory adalah thumbnail utama memory, seperti thumbnail YouTube. Cover membantu memory tampil lebih menarik di album dan timeline.",
        icon: Crop,
        accentColor: "#FFFF00",
        targetSelector: "[data-tutorial='cover-section']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        guideKey: "firstMemory",
    },
    // Step 11 — Klik Atur Cover (Action Step)
    {
        id: "click-atur-cover",
        title: "Atur Cover",
        description: "Klik tombol 'ATUR COVER' untuk membuka Cover Editor. Di sini kamu bisa memilih foto dari galeri atau upload foto baru sebagai cover.",
        icon: Crop,
        accentColor: "#00FFFF",
        targetSelector: "[data-tutorial='btn-atur-cover']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        isActionStep: true,
        actionHint: "Klik tombol yang disorot untuk membuka Cover Editor",
        actionDelay: 800,
        guideKey: "firstMemory",
    },
    // Step 12 — Cover Editor Guide (floating helper, non-blocking)
    {
        id: "cover-editor-guide",
        title: "Cover Editor",
        description: "Geser, zoom, atau putar gambar untuk mengatur cover.",
        icon: Crop,
        accentColor: "#FF00FF",
        requiredPath: "/memories/create",
        formStep: 1,
        isFloatingHelper: true,
        isActionStep: true,
        actionHint: "Simpan cover untuk melanjutkan",
        observeSelector: "[data-tutorial='cover-editor-modal']",
        observeDisappear: true,
        actionDelay: 600,
        guideKey: "firstMemory",
    },
    // Step 13 — Musik
    {
        id: "music-section",
        title: "Tambahkan Musik (Opsional)",
        description: "Kamu bisa menambahkan musik melalui upload MP3 atau Spotify jika fitur premium aktif. Langkah ini boleh dilewati.",
        icon: Music,
        accentColor: "#FF00FF",
        targetSelector: "[data-tutorial='music-uploader']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        guideKey: "firstMemory",
    },
    // Step 14 — Kolaborator
    {
        id: "collaborators",
        title: "Undang Kolaborator (Opsional)",
        description: "Kamu bisa mengundang teman sebagai kolaborator memory. Mereka akan menerima notifikasi undangan. Langkah ini boleh dilewati.",
        icon: Users,
        accentColor: "#00FFFF",
        targetSelector: "[data-tutorial='collaborator-picker']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        guideKey: "firstMemory",
    },
    // Step 15 — Privasi
    {
        id: "privacy-toggle",
        title: "Pengaturan Privasi",
        description: "Aktifkan 'Public' jika kamu ingin memory muncul di peta publik dan bisa dilihat pengguna lain. Matikan untuk menyimpannya secara privat.",
        icon: Globe,
        accentColor: "#FFFF00",
        targetSelector: "[data-tutorial='privacy-toggle']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        guideKey: "firstMemory",
    },
    // Step 16 — Simpan Kenangan
    {
        id: "submit-memory",
        title: "Simpan Kenanganmu!",
        description: "Semua sudah siap! Klik 'Simpan Kenangan' untuk menyimpan kenangan pertamamu. Setelah tersimpan, kamu bisa melihatnya di peta.",
        icon: Save,
        accentColor: "#00FF00",
        targetSelector: "[data-tutorial='btn-submit']",
        requiredPath: "/memories/create",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        formStep: 1,
        isActionStep: true,
        actionHint: "Klik area yang disorot untuk melanjutkan",
        actionDelay: 1500,
        guideKey: "firstMemory",
    },
]

// ─── Album Kenangan Onboarding Steps ─────────────────────────────────────────
export const ALBUM_GUIDE_STEPS: OnboardingStep[] = [
    // Step 1 — Welcome
    {
        id: "album-welcome",
        title: "Cara Membuat Album 📚",
        description: "Album membantu kamu mengelompokkan kenangan berdasarkan tema atau cerita. Mari buat album pertamamu!",
        icon: BookHeart,
        accentColor: "#FF00FF",
        position: "center",
        nextLabel: "Mulai Panduan",
        showSkip: true,
        guideKey: "album",
    },
    // Step 2 — Klik Buat Album (Action Step)
    {
        id: "album-click-create",
        title: "Buat Album Baru",
        description: "Buat album untuk mengelompokkan memory berdasarkan tema atau cerita.",
        icon: Plus,
        accentColor: "#FFFF00",
        targetSelector: "[data-tutorial='create-album-btn']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        isActionStep: true,
        actionHint: "Klik tombol yang disorot untuk membuat album baru",
        actionDelay: 800,
        guideKey: "album",
    },
    // Step 3 — Input Nama Album
    {
        id: "album-input-name",
        title: "Nama Album",
        description: "Masukkan nama album, misalnya Gunung, Liburan, Bucin, Kuliner, atau tema lainnya.",
        icon: BookOpen,
        accentColor: "#00FFFF",
        targetSelector: "[data-tutorial='album-input-name']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        guideKey: "album",
    },
    // Step 4 — Cover Album
    {
        id: "album-cover",
        title: "Cover Album",
        description: "Tambahkan cover agar album memiliki identitas visual yang menarik. Klik area upload untuk memilih gambar cover.",
        icon: ImageIcon,
        accentColor: "#00FF00",
        targetSelector: "[data-tutorial='album-cover-upload']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        guideKey: "album",
    },
    // Step 5 — Simpan Album (Action Step)
    {
        id: "album-save",
        title: "Simpan Album",
        description: "Album siap disimpan. Klik tombol untuk menyimpan album barumu.",
        icon: Save,
        accentColor: "#00FF00",
        targetSelector: "[data-tutorial='album-btn-save']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        isActionStep: true,
        actionHint: "Klik tombol yang disorot untuk menyimpan album",
        actionDelay: 1200,
        guideKey: "album",
    },
    // Step 6 — Buka Menu Album → Kelola Memory (Action Step)
    {
        id: "album-menu-open",
        title: "Kelola Memory",
        description: "Masukkan memory ke album ini. Klik tombol menu (⋮) pada kartu album, lalu pilih 'Kelola Memory'.",
        icon: Layers3,
        accentColor: "#FF00FF",
        targetSelector: "[data-tutorial='album-menu-btn']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        isActionStep: true,
        actionHint: "Klik menu (⋮) pada album yang disorot",
        actionDelay: 600,
        guideKey: "album",
    },
    // Step 7 — Pilih Memory dari daftar
    {
        id: "album-organize-list",
        title: "Pilih Memory",
        description: "Pilih memory yang ingin dimasukkan ke album. Centang satu atau lebih memory, lalu lanjut ke langkah berikutnya.",
        icon: FolderPlus,
        accentColor: "#00FFFF",
        targetSelector: "[data-tutorial='album-memory-list']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        guideKey: "album",
    },
    // Step 8 — Simpan Pengelompokan (Action Step)
    {
        id: "album-save-organize",
        title: "Simpan Pengelompokan",
        description: "Album siap disimpan. Klik tombol untuk menyimpan pengelompokan memory.",
        icon: Save,
        accentColor: "#00FF00",
        targetSelector: "[data-tutorial='album-btn-save-organize']",
        requiredPath: "/albums",
        position: "auto",
        allowInteraction: true,
        scrollToTarget: true,
        isActionStep: true,
        actionHint: "Klik tombol yang disorot untuk menyimpan",
        actionDelay: 1200,
        guideKey: "album",
    },
]

// ─── Navigation Guide Steps (simple highlight-on-page guides) ───────────────
export function createNavigationStep(
    guide: GuideDefinition,
    targetSelector?: string
): OnboardingStep {
    return {
        id: `guide-${guide.key}`,
        title: guide.title,
        description: guide.description,
        icon: guide.icon,
        accentColor: guide.accentColor,
        targetSelector: targetSelector || guide.highlightSelector,
        requiredPath: guide.navigateTo,
        position: targetSelector ? "auto" : "center",
        allowInteraction: true,
        scrollToTarget: true,
        guideKey: guide.key,
    }
}

// ─── Storage Keys ───────────────────────────────────────────────────────────
export const ONBOARDING_STORAGE_KEYS = {
    completed: "memorymap:onboarding-completed",
    firstMemoryCreated: "memorymap:first-memory-created",
    currentStep: "memorymap:onboarding-step",
    welcomeGuide: "memorymap:welcome-guide-seen",
} as const
