"use client"

/**
 * PremiumCrown — Animated golden crown SVG positioned on top of avatar.
 * Features: floating animation, shimmer sweep, sparkle particles.
 * Used in ProfileHeader for premium users.
 */
export function PremiumCrown({ size = 40 }: { size?: number }) {
    const h = size * 0.75

    return (
        <div className="premium-crown" style={{ width: size, height: h }}>
            {/* Sparkle particles */}
            <span className="crown-sparkle" />
            <span className="crown-sparkle" />
            <span className="crown-sparkle" />

            {/* Crown SVG */}
            <svg
                viewBox="0 0 64 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: size, height: h }}
            >
                <defs>
                    <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffd700" />
                        <stop offset="25%" stopColor="#ffb800" />
                        <stop offset="50%" stopColor="#fff5cc" />
                        <stop offset="75%" stopColor="#ffd700" />
                        <stop offset="100%" stopColor="#b8860b" />
                    </linearGradient>
                    <linearGradient id="crownHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fff5cc" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
                    </linearGradient>
                    <filter id="crownGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Crown body */}
                <path
                    d="M8 38 L2 14 L16 24 L32 6 L48 24 L62 14 L56 38 Z"
                    fill="url(#crownGold)"
                    stroke="#b8860b"
                    strokeWidth="1.5"
                    filter="url(#crownGlow)"
                />

                {/* Crown highlight layer */}
                <path
                    d="M10 36 L5 16 L16 24 L32 8 L48 24 L59 16 L54 36 Z"
                    fill="url(#crownHighlight)"
                    opacity="0.4"
                />

                {/* Crown base band */}
                <rect x="8" y="36" width="48" height="6" rx="2" fill="url(#crownGold)" stroke="#b8860b" strokeWidth="1" />

                {/* Jewels */}
                <circle cx="32" cy="14" r="3.5" fill="#e63946" stroke="#b8860b" strokeWidth="1" />
                <circle cx="18" cy="25" r="2.5" fill="#2196f3" stroke="#b8860b" strokeWidth="0.8" />
                <circle cx="46" cy="25" r="2.5" fill="#2196f3" stroke="#b8860b" strokeWidth="0.8" />

                {/* Small jewels on band */}
                <circle cx="22" cy="39" r="1.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5" opacity="0.8" />
                <circle cx="32" cy="39" r="1.5" fill="#fff5cc" stroke="#b8860b" strokeWidth="0.5" opacity="0.8" />
                <circle cx="42" cy="39" r="1.5" fill="#ffd700" stroke="#b8860b" strokeWidth="0.5" opacity="0.8" />
            </svg>
        </div>
    )
}
