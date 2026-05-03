"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, Variants } from "framer-motion"
import Link from "next/link"
import { BadgeCheck, X, Trophy } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  image: string | null
  longestStreak: number
  currentStreak: number
  equippedDecoration?: any
  isVerified?: boolean
}

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
  leaderboard: LeaderboardEntry[]
  currentUserId?: string
}

// ─── Animations ───────────────────────────────────────────────────────────────
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 24 } },
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z"
        fill="#FF0000"
        stroke="#000"
        strokeWidth="2"
      />
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg width="42" height="36" viewBox="0 0 38 32" fill="none">
      <path
        d="M3 26 L6 10 L13 18 L19 4 L25 18 L32 10 L35 26 Z"
        fill="#FFFF00" stroke="#000" strokeWidth="2" strokeLinejoin="round"
      />
      <rect x="3" y="25" width="32" height="5" fill="#FFFF00" stroke="#000" strokeWidth="2" />
    </svg>
  )
}

function SilverMedalIcon() {
  return (
    <svg width="34" height="38" viewBox="0 0 30 34" fill="none">
      <circle cx="15" cy="20" r="12" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <path d="M10 10 L6 2 L12 5 L15 8Z" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <path d="M20 10 L24 2 L18 5 L15 8Z" fill="#E5E5E5" stroke="#000" strokeWidth="2" />
      <text x="15" y="25" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000" fontFamily="sans-serif">2</text>
    </svg>
  )
}

function BronzeMedalIcon() {
  return (
    <svg width="34" height="38" viewBox="0 0 30 34" fill="none">
      <circle cx="15" cy="20" r="12" fill="#FF9900" stroke="#000" strokeWidth="2" />
      <path d="M10 10 L6 2 L12 5 L15 8Z" fill="#FF9900" stroke="#000" strokeWidth="2" />
      <path d="M20 10 L24 2 L18 5 L15 8Z" fill="#FF9900" stroke="#000" strokeWidth="2" />
      <text x="15" y="25" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000" fontFamily="sans-serif">3</text>
    </svg>
  )
}

// ─── Rank Style ───────────────────────────────────────────────────────────────
function getRankStyle(rank: number) {
  if (rank === 1) return {
    pillarBg: "#FFFF00",
    pillarHeight: "140px",
  }
  if (rank === 2) return {
    pillarBg: "#E5E5E5",
    pillarHeight: "110px",
  }
  return {
    pillarBg: "#FF9900",
    pillarHeight: "85px",
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  image, name, size,
}: {
  image: string | null
  name: string
  size: number
}) {
  return (
    <div
      style={{
        width: size, height: size,
        border: `3px solid #000`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#FFF",
        flexShrink: 0,
      }}
    >
      {image ? (
        <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.4, fontWeight: 900, color: "#000" }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

// ─── Podium Step ──────────────────────────────────────────────────────────────
function PodiumStep({
  entry, isMe, delay, onClose,
}: {
  entry: LeaderboardEntry
  isMe: boolean
  delay: number
  onClose: () => void
}) {
  const rs = getRankStyle(entry.rank)
  const avatarSize = entry.rank === 1 ? 70 : entry.rank === 2 ? 60 : 54

  const rankIcon =
    entry.rank === 1 ? <CrownIcon /> :
    entry.rank === 2 ? <SilverMedalIcon /> :
    <BronzeMedalIcon />

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay }}
      className="flex flex-col items-center flex-1 max-w-[150px] relative"
      style={{ marginBottom: entry.rank === 1 ? -8 : 0 }}
    >
      <Link
        href={`/profile/${entry.userId}`}
        onClick={onClose}
        className="flex flex-col items-center w-full decoration-transparent group"
      >
        {/* Rank Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: delay + 0.25 }}
          className="h-10 flex items-center justify-center mb-2"
        >
          {rankIcon}
        </motion.div>

        {/* Avatar */}
        <div className="relative mb-3 group-hover:translate-y-[-4px] transition-transform">
          <Avatar
            image={entry.image}
            name={entry.name}
            size={avatarSize}
          />
          {isMe && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF00FF] text-white text-[10px] font-black px-2 py-0.5 border-[2px] border-black shadow-[2px_2px_0_#000] whitespace-nowrap uppercase">
              Kamu
            </span>
          )}
        </div>

        {/* Name */}
        <div className="text-[13px] font-black text-black text-center mb-1 overflow-hidden text-ellipsis whitespace-nowrap w-full px-1 flex items-center justify-center gap-1 uppercase">
          {entry.name}
          {entry.isVerified && <BadgeCheck className="w-4 h-4 text-black shrink-0 fill-[#00FFFF]" />}
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1.5 text-base font-black text-black mb-3 bg-white border-[2px] border-black px-2 shadow-[2px_2px_0_#000]">
          <FlameIcon size={14} />
          <span>{entry.longestStreak}</span>
        </div>

        {/* Pillar */}
        <div 
          className="w-full flex items-center justify-center border-[4px] border-black relative overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,0.2)]"
          style={{ height: rs.pillarHeight, background: rs.pillarBg }}
        >
          {/* Number */}
          <span className="text-[48px] font-black text-black/20 select-none">
            {entry.rank}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function LeaderboardModal({
  isOpen, onClose, leaderboard, currentUserId,
}: LeaderboardModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const topThree = leaderboard.slice(0, 3)
  const others = leaderboard.slice(3)

  // Podium order: 2nd | 1st | 3rd
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean)
  const podiumDelayMap: Record<number, number> = { 2: 0.2, 1: 0.1, 3: 0.3 }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            className="relative w-full flex flex-col bg-[#FFFDF0] border-[4px] border-black shadow-[12px_12px_0_#000] overflow-hidden"
            style={{ maxWidth: 600, maxHeight: "88vh" }}
          >

            {/* ── Header ── */}
            <div className="relative px-5 py-4 border-b-[4px] border-black bg-[#00FFFF] flex items-center justify-between overflow-hidden shrink-0">
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 bg-[#FFFF00] border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-black fill-black" />
                </div>
                <div>
                  <div className="text-[20px] font-black text-black uppercase tracking-widest">
                    Leaderboard
                  </div>
                  <div className="text-[12px] font-bold text-black/60 uppercase tracking-widest bg-white border-[2px] border-black px-2 py-0.5 inline-block mt-1">
                    Top 50 Streakers
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 bg-white border-[3px] border-black shadow-[3px_3px_0_#000] flex items-center justify-center cursor-pointer z-10 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#000] hover:bg-[#FF00FF] hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* Podium */}
              {topThree.length > 0 && (
                <div className="px-5 pt-8 pb-6 flex items-end justify-center gap-4 border-b-[4px] border-black bg-[#FFFDF0]">
                  {podiumOrder.map((entry) =>
                    entry ? (
                      <PodiumStep
                        key={entry.userId}
                        entry={entry}
                        isMe={entry.userId === currentUserId}
                        delay={podiumDelayMap[entry.rank] ?? 0.2}
                        onClose={onClose}
                      />
                    ) : null
                  )}
                </div>
              )}

              {/* List 4th+ */}
              {others.length > 0 && (
                <div className="p-5 flex flex-col gap-4 bg-white">
                  {others.map((entry) => {
                    const isMe = entry.userId === currentUserId
                    return (
                      <motion.div key={entry.userId} variants={itemVariants} whileHover={{ x: 4 }}>
                        <Link
                          href={`/profile/${entry.userId}`}
                          onClick={onClose}
                          className={`flex items-center gap-4 p-3 border-[3px] border-black shadow-[4px_4px_0_#000] transition-colors group ${isMe ? "bg-[#FFFF00]" : "bg-white hover:bg-[#00FFFF]"}`}
                        >
                          {/* Rank */}
                          <div className="w-8 text-[16px] font-black text-black text-center shrink-0">
                            #{entry.rank}
                          </div>

                          {/* Avatar */}
                          <div className="w-12 h-12 border-[3px] border-black bg-white flex items-center justify-center text-[16px] font-black text-black overflow-hidden shrink-0">
                            {entry.image ? (
                              <img src={entry.image} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span>{entry.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-black text-black flex items-center gap-2">
                              <span className="overflow-hidden text-ellipsis whitespace-nowrap uppercase group-hover:underline">
                                {entry.name}
                              </span>
                              {entry.isVerified && <BadgeCheck className="w-4 h-4 text-black shrink-0 fill-[#00FFFF]" />}
                              {isMe && (
                                <span className="text-[10px] px-2 py-0.5 bg-[#FF00FF] border-[2px] border-black text-white font-black uppercase shrink-0 shadow-[2px_2px_0_#000]">
                                  Kamu
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-black/60 uppercase mt-1">
                              Streak Terpanjang
                            </div>
                          </div>

                          {/* Streak pill */}
                          <div className="flex items-center gap-2 bg-[#FF0000] border-[2px] border-black px-3 py-1.5 shadow-[2px_2px_0_#000] shrink-0">
                            <FlameIcon size={16} />
                            <span className="text-[14px] font-black text-white">
                              {entry.longestStreak}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}