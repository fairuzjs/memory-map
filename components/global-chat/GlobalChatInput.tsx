"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface Props {
    onSend: (content: string) => Promise<void>
    isDisabled?: boolean
}

export function GlobalChatInput({ onSend, isDisabled }: Props) {
    const [content, setContent] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    const handleSubmit = async () => {
        const text = content.trim()
        if (!text || text.length > 300 || isSending || cooldown > 0 || isDisabled) return

        try {
            setIsSending(true)
            await onSend(text)
            setContent("")
            setCooldown(5) // 5 seconds cooldown after successful send
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
                textareaRef.current.focus()
            }
        } catch (error) {
            // error is handled by parent, we just stop sending state
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        if (val.length <= 300) {
            setContent(val)
        }
        
        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }

    return (
        <div className="bg-white border-t-[4px] border-black p-4 z-20">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled || isSending || cooldown > 0}
                        placeholder={cooldown > 0 ? `Tunggu ${cooldown} detik...` : isDisabled ? "Login untuk chat" : "Ketik pesan..."}
                        className="w-full bg-[#E5E5E5] border-[3px] border-black p-3 pr-16 resize-none outline-none font-bold placeholder:text-neutral-500 rounded-xl focus:bg-white transition-colors"
                        style={{ height: '52px', minHeight: '52px' }}
                    />
                    <span className={`absolute bottom-3 right-3 text-xs font-black ${content.length >= 300 ? 'text-red-600' : 'text-neutral-500'}`}>
                        {content.length}/300
                    </span>
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSending || cooldown > 0 || isDisabled}
                    className="
                        shrink-0 h-[52px] px-6 bg-[#FF00FF] text-white border-[3px] border-black shadow-[4px_4px_0_#000]
                        hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]
                        active:translate-x-[0px] active:translate-y-[0px] active:shadow-none
                        disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center rounded-xl
                    "
                >
                    {isSending ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-6 h-6" />
                    )}
                </button>
            </div>
        </div>
    )
}
