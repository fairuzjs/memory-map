"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"
import { Flag, Loader2 } from "lucide-react"

export function ReportDialog({ memoryId }: { memoryId: string }) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState("SPAM")
    const [details, setDetails] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const reasons = [
        { value: "SARA", label: "Mengandung SARA" },
        { value: "PORNOGRAPHY", label: "Pornografi" },
        { value: "VIOLENCE", label: "Kekerasan" },
        { value: "SPAM", label: "Spam / Iklan Terlarang" },
        { value: "OTHER", label: "Lainnya" },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memoryId, reason, details }),
            })

            if (!res.ok) throw new Error("Gagal mengirim laporan")

            toast.success("Terima kasih atas laporan Anda. Kami akan meninjaunya segera.")
            setDetails("")
            setReason("SPAM")
            setOpen(false)
        } catch (error) {
            toast.error("Terjadi kesalahan saat mengirim laporan.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <span className="flex items-center text-rose-500 cursor-pointer text-sm hover:underline hover:text-rose-400 border border-neutral-800 rounded-lg px-2 py-1">
                    <Flag className="w-4 h-4 mr-2" />
                    Laporkan Postingan
                </span>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                <DialogHeader>
                    <DialogTitle>Laporkan Postingan</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Alasan Pelaporan</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-800 border-neutral-700 text-sm"
                        >
                            {reasons.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Detail Tambahan (Opsional)</label>
                        <Textarea
                            placeholder="Berikan bukti atau penjelasan mengapa postingan ini melanggar..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="h-[100px] bg-neutral-800 border-neutral-700 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 text-white">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-neutral-700 hover:bg-neutral-800">
                            Batal
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Kirim Laporan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
