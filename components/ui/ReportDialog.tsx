"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
                <button className="flex items-center bg-[#FF00FF] text-white border-[3px] border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                    <Flag className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Laporkan</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-[#E5E5E5] border-[4px] border-black p-6 sm:p-8 shadow-[8px_8px_0_#000] max-w-md [&>button]:bg-[#FF3300] [&>button]:border-[2px] [&>button]:border-black [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:opacity-90 [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button>svg]:w-4 [&>button>svg]:h-4">
                <DialogHeader>
                    <DialogTitle className="text-[20px] font-black uppercase text-black bg-[#FFFF00] border-[3px] border-black px-4 py-2 inline-block shadow-[4px_4px_0_#000] w-fit mb-4">
                        Laporkan Postingan
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="space-y-3">
                        <label className="text-[14px] font-black uppercase text-black">Alasan Pelaporan</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full h-12 px-4 py-2 bg-white border-[3px] border-black focus:outline-none focus:shadow-[4px_4px_0_#000] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all text-black font-bold cursor-pointer appearance-none"
                            style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem top 50%", backgroundSize: "0.65rem auto" }}
                        >
                            {reasons.map((r) => (
                                <option key={r.value} value={r.value} className="font-bold">
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[14px] font-black uppercase text-black">Detail Tambahan (Opsional)</label>
                        <Textarea
                            placeholder="Berikan bukti atau penjelasan mengapa postingan ini melanggar..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="h-[120px] bg-white border-[3px] border-black focus-visible:ring-0 focus-visible:outline-none focus-visible:shadow-[4px_4px_0_#000] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] transition-all text-black font-bold p-4 resize-none rounded-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setOpen(false)} className="bg-white text-black border-[3px] border-black px-6 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all">
                            Batal
                        </button>
                        <button type="submit" disabled={isLoading} className="flex items-center bg-[#FF3300] text-white border-[3px] border-black px-6 py-2 font-black uppercase shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Kirim
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
