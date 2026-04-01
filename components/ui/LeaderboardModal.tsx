"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, Variants } from "framer-motion"
import Link from "next/link"

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  image: string | null
  longestStreak: number
  currentStreak: number
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
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15c-3.314 0-6-2.686-6-6V4h12v5c0 3.314-2.686 6-6 6z"
        stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path
        d="M6 6H3.5A1.5 1.5 0 0 0 2 7.5v.5a4 4 0 0 0 4 4M18 6h2.5A1.5 1.5 0 0 1 22 7.5v.5a4 4 0 0 1-4 4"
        stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"
      />
      <path d="M12 15v4M9 19h6" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="10" r="2" fill="rgba(251,191,36,0.35)" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 1l12 12M13 1L1 13"
        stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )
}

function FlameIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C9 7 6 9 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14 9 13.5 11 12 12c-.5-2-1.5-4-0-10z"
        fill="#fb923c"
      />
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg width="38" height="32" viewBox="0 0 38 32" fill="none">
      <defs>
        <linearGradient id="crownGrad" x1="0" y1="0" x2="38" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M3 26 L6 10 L13 18 L19 4 L25 18 L32 10 L35 26 Z"
        fill="url(#crownGrad)" stroke="#f59e0b" strokeWidth="0.8" strokeLinejoin="round"
      />
      <rect x="3" y="25" width="32" height="5" rx="2" fill="#f59e0b" />
      <circle cx="6.5" cy="27.5" r="2" fill="#fde68a" />
      <circle cx="19" cy="27.5" r="2.5" fill="#fff" opacity="0.9" />
      <circle cx="31.5" cy="27.5" r="2" fill="#fde68a" />
      <circle cx="19" cy="5" r="2.5" fill="#fff" opacity="0.85" />
      <circle cx="6.5" cy="11" r="1.8" fill="#fde68a" opacity="0.9" />
      <circle cx="31.5" cy="11" r="1.8" fill="#fde68a" opacity="0.9" />
      <path
        d="M8 14 Q11 12 13 16"
        stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" fill="none"
      />
    </svg>
  )
}

function SilverMedalIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
      <circle cx="15" cy="20" r="12" fill="rgba(203,213,225,0.1)" stroke="#cbd5e1" strokeWidth="1.2" />
      <circle cx="15" cy="20" r="8.5" fill="rgba(203,213,225,0.07)" stroke="rgba(203,213,225,0.3)" strokeWidth="0.8" />
      <path d="M10 10 L6 2 L12 5 L15 8Z" fill="#94a3b8" opacity="0.8" />
      <path d="M20 10 L24 2 L18 5 L15 8Z" fill="#64748b" opacity="0.8" />
      <text x="15" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#cbd5e1" fontFamily="sans-serif">2</text>
    </svg>
  )
}

function BronzeMedalIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
      <circle cx="15" cy="20" r="12" fill="rgba(251,146,60,0.1)" stroke="#fb923c" strokeWidth="1.2" />
      <circle cx="15" cy="20" r="8.5" fill="rgba(251,146,60,0.07)" stroke="rgba(251,146,60,0.3)" strokeWidth="0.8" />
      <path d="M10 10 L6 2 L12 5 L15 8Z" fill="#ea7c3a" opacity="0.8" />
      <path d="M20 10 L24 2 L18 5 L15 8Z" fill="#c2601e" opacity="0.8" />
      <text x="15" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fb923c" fontFamily="sans-serif">3</text>
    </svg>
  )
}

// ─── Rank Style ───────────────────────────────────────────────────────────────
function getRankStyle(rank: number) {
  if (rank === 1) return {
    color: "#fbbf24",
    avatarBorder: "#fbbf24",
    avatarShadow: "0 0 18px rgba(251,191,36,0.4), 0 0 4px rgba(251,191,36,0.5)",
    pillarBg: "rgba(251,191,36,0.13)",
    pillarBorder: "rgba(251,191,36,0.2)",
    pillarShadow: "0 -8px 32px rgba(251,191,36,0.15)",
    topBarBg: "linear-gradient(90deg, rgba(251,191,36,0.4), #fbbf24, rgba(251,191,36,0.4))",
    pillarHeight: "130px",
  }
  if (rank === 2) return {
    color: "#cbd5e1",
    avatarBorder: "#cbd5e1",
    avatarShadow: "0 0 12px rgba(203,213,225,0.2)",
    pillarBg: "rgba(203,213,225,0.08)",
    pillarBorder: "rgba(203,213,225,0.15)",
    pillarShadow: "none",
    topBarBg: "linear-gradient(90deg, rgba(203,213,225,0.4), #cbd5e1, rgba(203,213,225,0.4))",
    pillarHeight: "100px",
  }
  return {
    color: "#fb923c",
    avatarBorder: "#fb923c",
    avatarShadow: "0 0 12px rgba(251,146,60,0.25)",
    pillarBg: "rgba(251,146,60,0.1)",
    pillarBorder: "rgba(251,146,60,0.18)",
    pillarShadow: "none",
    topBarBg: "linear-gradient(90deg, rgba(251,146,60,0.4), #fb923c, rgba(251,146,60,0.4))",
    pillarHeight: "76px",
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  image, name, size, borderColor, boxShadow,
}: {
  image: string | null
  name: string
  size: number
  borderColor: string
  boxShadow?: string
}) {
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: "50%",
        border: `2.5px solid ${borderColor}`,
        boxShadow,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#1e1e26",
        flexShrink: 0,
      }}
    >
      {image ? (
        <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.3, fontWeight: 800, color: "#fff" }}>
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
  const avatarSize = entry.rank === 1 ? 62 : entry.rank === 2 ? 52 : 48

  const rankIcon =
    entry.rank === 1 ? <CrownIcon /> :
    entry.rank === 2 ? <SilverMedalIcon /> :
    <BronzeMedalIcon />

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        flex: 1, maxWidth: 150, position: "relative",
        marginBottom: entry.rank === 1 ? -8 : 0,
      }}
    >
      <Link
        href={`/profile/${entry.userId}`}
        onClick={onClose}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", textDecoration: "none" }}
      >
        {/* Rank Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: delay + 0.25 }}
          style={{
            height: entry.rank === 1 ? 42 : 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 6,
          }}
        >
          {rankIcon}
        </motion.div>

        {/* Avatar */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <Avatar
            image={entry.image}
            name={entry.name}
            size={avatarSize}
            borderColor={rs.avatarBorder}
            boxShadow={rs.avatarShadow}
          />
          {isMe && (
            <span style={{
              position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)",
              background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 700,
              padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.3px",
            }}>
              Kamu
            </span>
          )}
        </div>

        {/* Name */}
        <div style={{
          fontSize: entry.rank === 1 ? 13 : 12, fontWeight: 600, color: "#fff",
          textAlign: "center", marginBottom: 4, marginTop: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          width: "100%", padding: "0 4px",
        }}>
          {entry.name}
        </div>

        {/* Streak */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: entry.rank === 1 ? 15 : 13, fontWeight: 800,
          color: rs.color, marginBottom: 10,
        }}>
          <FlameIcon size={entry.rank === 1 ? 15 : 13} />
          <span>{entry.longestStreak}</span>
        </div>

        {/* Pillar */}
        <div style={{
          width: "100%", borderRadius: "10px 10px 0 0",
          position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          height: rs.pillarHeight,
          background: rs.pillarBg,
          border: `1px solid ${rs.pillarBorder}`,
          boxShadow: rs.pillarShadow,
        }}>
          {/* Top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 3, borderRadius: "3px 3px 0 0",
            background: rs.topBarBg,
          }} />
          {/* Shine */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: "40%", height: "100%",
            background: "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)",
          }} />
          {/* Number */}
          <span style={{
            fontSize: entry.rank === 1 ? 36 : 28,
            fontWeight: 900, opacity: 0.15, color: "#fff", userSelect: "none",
          }}>
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
  const podiumDelays = [0.2, 0.1, 0.3]
  const podiumDelayMap: Record<number, number> = { 2: 0.2, 1: 0.1, 3: 0.3 }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={onClose}
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: "rgba(8,8,12,0.88)" }}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            className="relative w-full flex flex-col overflow-hidden"
            style={{
              maxWidth: 540,
              maxHeight: "88vh",
              background: "linear-gradient(160deg, #131318 0%, #0e0e13 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
            }}
          >

            {/* ── Header ── */}
            <div style={{
              position: "relative",
              padding: "18px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              overflow: "hidden", flexShrink: 0,
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
                width: 280, height: 80, pointerEvents: "none",
                background: "radial-gradient(ellipse, rgba(251,191,36,0.18) 0%, transparent 70%)",
              }} />
              {/* Top line */}
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%",
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
                <div style={{
                  width: 42, height: 42,
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TrophyIcon />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
                    Streak Leaderboard
                  </div>
                  <div style={{
                    fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1,
                    letterSpacing: "0.5px", textTransform: "uppercase",
                  }}>
                    Peringkat 50 Teratas
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", zIndex: 1,
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* Podium */}
              {topThree.length > 0 && (
                <div style={{
                  padding: "28px 20px 20px",
                  display: "flex", alignItems: "flex-end",
                  justifyContent: "center", gap: 10,
                }}>
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

              {/* Divider */}
              {others.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  margin: "0 20px 12px",
                }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <div style={{
                    fontSize: 10, color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.8px", textTransform: "uppercase",
                  }}>
                    Selanjutnya
                  </div>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                </div>
              )}

              {/* List 4th+ */}
              {others.length > 0 && (
                <div style={{ padding: "0 14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {others.map((entry) => {
                    const isMe = entry.userId === currentUserId
                    return (
                      <motion.div key={entry.userId} variants={itemVariants} whileHover={{ x: 4 }}>
                        <Link
                          href={`/profile/${entry.userId}`}
                          onClick={onClose}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 12px",
                            background: isMe ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isMe ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)"}`,
                            borderRadius: 14,
                            textDecoration: "none",
                            transition: "background 0.15s",
                          }}
                        >
                          {/* Rank */}
                          <div style={{
                            width: 28, fontSize: 12, fontWeight: 700,
                            color: isMe ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.3)",
                            textAlign: "center", flexShrink: 0,
                          }}>
                            #{entry.rank}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, color: "#fff",
                            overflow: "hidden", flexShrink: 0,
                          }}>
                            {entry.image ? (
                              <img src={entry.image} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span>{entry.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600, color: "#fff",
                              display: "flex", alignItems: "center", gap: 6,
                            }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {entry.name}
                              </span>
                              {isMe && (
                                <span style={{
                                  fontSize: 9, padding: "2px 6px",
                                  background: "#6366f1", color: "#fff",
                                  borderRadius: 20, fontWeight: 700, flexShrink: 0,
                                }}>
                                  Kamu
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>
                              Streak terpanjang
                            </div>
                          </div>

                          {/* Streak pill */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: "rgba(255,255,255,0.05)",
                            border: `1px solid ${isMe ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.08)"}`,
                            padding: "5px 10px", borderRadius: 10, flexShrink: 0,
                          }}>
                            <FlameIcon size={12} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
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