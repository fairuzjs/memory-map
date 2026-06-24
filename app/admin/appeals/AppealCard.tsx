"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { Check, X, MessageSquareWarning, History } from "lucide-react"

export function AppealCard({ appeal }: { appeal: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(appeal.status)
    const [showHistory, setShowHistory] = useState(false)

    async function handleAction(action: "APPROVE" | "REJECT") {
        if (!confirm(`Apakah Anda yakin ingin ${action === "APPROVE" ? "menerima banding & membatalkan blokir" : "menolak banding"} untuk ${appeal.user.name}?`)) {
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/appeals/${appeal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(data.message)
            setStatus(action === "APPROVE" ? "APPROVED" : "REJECTED")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const isPending = status === "PENDING"
    const isApproved = status === "APPROVED"

    return (
        <div className={`border-[3px] border-black rounded-xl p-6 shadow-[4px_4px_0_#000] bg-white transition-all ${isPending ? "" : "opacity-70"}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                    {/* User Info & Status Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-xl bg-purple-200 border-[2px] border-black flex items-center justify-center font-black text-xl">
                            {appeal.user.name[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-none">{appeal.user.name}</h3>
                            <p className="text-xs text-black/60 font-bold mt-1">{appeal.user.email}</p>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-black border-[2px] border-black shadow-[2px_2px_0_#000] ml-auto md:ml-4
                            ${isPending ? "bg-yellow-300 text-black" : isApproved ? "bg-green-400 text-black" : "bg-red-400 text-white"}
                        `}>
                            {status}
                        </div>
                    </div>

                    {/* Banned Reason & Appeal text */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-50 p-4 border-[2px] border-black rounded-xl">
                            <h4 className="text-xs font-black uppercase text-red-600 mb-2 flex items-center gap-2">
                                <MessageSquareWarning className="w-4 h-4" /> Alasan Diblokir
                            </h4>
                            <p className="text-sm font-medium text-black/80">{appeal.user.bannedReason || "Pelanggaran pedoman komunitas"}</p>
                            <p className="text-xs font-bold text-black/40 mt-3">Tgl Banding: {new Date(appeal.createdAt).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div className="bg-blue-50 p-4 border-[2px] border-black rounded-xl">
                            <h4 className="text-xs font-black uppercase text-blue-600 mb-2">Alasan Banding Pengguna</h4>
                            <p className="text-sm font-medium text-black/80 italic">&quot;{appeal.reason}&quot;</p>
                        </div>
                    </div>

                    {/* Chat History */}
                    {appeal.user.globalChatMessages?.length > 0 && (
                        <div>
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-xs font-bold bg-neutral-100 hover:bg-neutral-200 border-[2px] border-black px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <History className="w-3 h-3" />
                                {showHistory ? "Sembunyikan Histori Pesan" : "Lihat Histori Pesan Terakhir"}
                            </button>
                            
                            {showHistory && (
                                <div className="mt-3 space-y-2 pl-4 border-l-[3px] border-black/20">
                                    {appeal.user.globalChatMessages.map((msg: any) => (
                                        <div key={msg.id} className="text-sm bg-neutral-50 border-[2px] border-black/10 p-2 rounded-lg">
                                            <span className="text-xs text-black/40 font-bold block mb-1">
                                                {new Date(msg.createdAt).toLocaleString("id-ID")}
                                            </span>
                                            {msg.content}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {isPending && (
                    <div className="flex md:flex-col gap-2 shrink-0 md:w-32">
                        <button
                            onClick={() => handleAction("APPROVE")}
                            disabled={isLoading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-400 hover:bg-green-500 border-[2px] border-black px-4 py-2 rounded-xl text-sm font-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] transition-all disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" /> Terima
                        </button>
                        <button
                            onClick={() => handleAction("REJECT")}
                            disabled={isLoading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-400 hover:bg-red-500 text-white border-[2px] border-black px-4 py-2 rounded-xl text-sm font-black shadow-[2px_2px_0_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] transition-all disabled:opacity-50"
                        >
                            <X className="w-4 h-4" /> Tolak
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
