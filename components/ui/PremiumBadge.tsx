"use client"

import { motion } from "framer-motion"

interface PremiumBadgeProps {
    size?: "sm" | "md"
    className?: string
}

/**
 * Premium subscriber badge — golden diamond ✦ with shimmer
 * Use next to usernames in profile headers, comments, leaderboards etc.
 */
export function PremiumBadge({ size = "sm", className = "" }: PremiumBadgeProps) {
    const isMd = size === "md"

    return (
        <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center justify-center relative shrink-0 ${className}`}
            title="Premium Member"
        >
            <div className={`relative flex items-center justify-center ${isMd ? 'w-5 h-5' : 'w-4 h-4'}`}>
                {/* Glow behind the crown */}
                <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full" />
                
                {/* The Crown Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="relative z-10 text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)] w-full h-full"
                >
                    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                </svg>

                {/* Subtle shine animation */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        boxShadow: [
                            "inset 0 0 0px rgba(250,204,21,0)",
                            "inset 0 0 4px rgba(250,204,21,0.4)",
                            "inset 0 0 0px rgba(250,204,21,0)",
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
        </motion.span>
    )
}
