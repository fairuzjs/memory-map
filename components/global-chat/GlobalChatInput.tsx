"use client"

import { useState, useRef, useEffect } from "react"
import { Send, X, CornerUpLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ChatMessage } from "./GlobalChatMessageItem"

interface Props {
    onSend: (content: string, replyToId?: string) => Promise<void>
    isDisabled?: boolean
    replyTo?: ChatMessage | null
    onCancelReply?: () => void
}

export function GlobalChatInput({ onSend, isDisabled, replyTo, onCancelReply }: Props) {
    const [content, setContent]     = useState("")
    const [isSending, setIsSending] = useState(false)
    const [cooldown, setCooldown]   = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    // Focus textarea when reply target is set
    useEffect(() => {
        if (replyTo) {
            textareaRef.current?.focus()
        }
    }, [replyTo])

    const handleSubmit = async () => {
        const text = content.trim()
        if (!text || text.length > 300 || isSending || cooldown > 0 || isDisabled) return
        try {
            setIsSending(true)
            await onSend(text, replyTo?.id)
            setContent("")
            setCooldown(5)
            onCancelReply?.()
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
                textareaRef.current.focus()
            }
        } catch {
            // error handled by parent
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
        if (e.key === "Escape" && replyTo) {
            onCancelReply?.()
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        if (val.length <= 300) setContent(val)
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }

    const isBlocked   = !content.trim() || isSending || cooldown > 0 || isDisabled
    const charLeft    = 300 - content.length
    const isNearLimit = content.length >= 260
    const isAtLimit   = content.length >= 300

    return (
        <div className="shrink-0 border-t-[3px] border-black bg-[var(--mm-surface)] z-20">

            {/* ── Reply Preview Banner ── */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        key="reply-banner"
                        initial={{ opacity: 0, y: 8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 8, height: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/5 border-b-[2px] border-black/10">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--mm-accent)] border-[2px] border-black shadow-[1.5px_1.5px_0_#000] shrink-0">
                                <CornerUpLeft className="w-3 h-3 text-white" />
                            </div>

                            {/* Preview text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--mm-accent)] leading-none mb-0.5">
                                    Membalas {replyTo.user.name}
                                </p>
                                <p className="text-[11px] font-semibold text-black/50 truncate leading-tight">
                                    {replyTo.content.length > 70
                                        ? replyTo.content.slice(0, 70) + "…"
                                        : replyTo.content
                                    }
                                </p>
                            </div>

                            {/* Cancel button */}
                            <button
                                onClick={onCancelReply}
                                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-white border-[2px] border-black shadow-[1.5px_1.5px_0_#000] hover:bg-red-500 hover:text-white transition-colors"
                                title="Batal balas (Esc)"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Input Row ── */}
            <div className="flex items-end gap-2 max-w-4xl mx-auto p-3">

                {/* Textarea wrapper */}
                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled || isSending || cooldown > 0}
                        placeholder={
                            cooldown > 0
                                ? `Tunggu ${cooldown}s...`
                                : isDisabled
                                    ? "Login untuk chat"
                                    : replyTo
                                        ? `Balas ${replyTo.user.name}...`
                                        : "Ketik pesan... (Enter untuk kirim)"
                        }
                        className="
                            w-full resize-none outline-none
                            bg-[var(--mm-bg)] text-black font-bold text-[13px] leading-relaxed
                            placeholder:text-black/40
                            border-[3px] border-black rounded-xl px-4 py-3 pr-14
                            focus:shadow-[3px_3px_0_#000] transition-shadow
                            disabled:opacity-50
                        "
                        style={{ height: "48px", minHeight: "48px" }}
                    />

                    {/* Character counter */}
                    <span
                        className={`absolute bottom-3 right-3 text-[11px] font-black tabular-nums ${
                            isAtLimit   ? "text-red-600" :
                            isNearLimit ? "text-orange-500" :
                                          "text-black/40"
                        }`}
                    >
                        {isNearLimit ? charLeft : `${content.length}/300`}
                    </span>
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isBlocked}
                    className="
                        shrink-0 h-12 w-12 flex items-center justify-center rounded-xl
                        border-[3px] border-black bg-[var(--mm-accent)] text-black
                        shadow-[4px_4px_0_#000]
                        hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#000]
                        active:translate-x-0 active:translate-y-0 active:shadow-none
                        disabled:opacity-40 disabled:pointer-events-none
                        transition-all duration-150
                    "
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
                    ) : cooldown > 0 ? (
                        <span className="text-[11px] font-black text-black">{cooldown}s</span>
                    ) : (
                        <Send className="w-5 h-5 text-black" />
                    )}
                </button>
            </div>

            {/* Hint */}
            <p className="text-center text-[10px] text-black/30 font-bold pb-2 max-w-4xl mx-auto">
                Enter untuk kirim · Shift+Enter baris baru · Geser pesan untuk balas · Esc batal balas
            </p>
        </div>
    )
}
