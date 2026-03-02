"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"
import { Loader2, MessageSquarePlus } from "lucide-react"

export function FeedbackDialog() {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        setIsLoading(true)
        try {
            const res = await fetch("/api/feedbacks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            })

            if (!res.ok) throw new Error("Gagal mengirim pesan")

            toast.success("Terima kasih atas saran dan kritik Anda!")
            setMessage("")
            setOpen(false)
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengirim pesan.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Kritik & Saran</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle>Kirim Kritik & Saran</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Tulis saran, kritik, atau temuan bug di sini..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[150px] bg-neutral-900 border-neutral-700 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 text-white">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-neutral-700 hover:bg-neutral-800">
                            Batal
                        </Button>
                        <Button type="submit" disabled={isLoading || !message.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Kirim
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
