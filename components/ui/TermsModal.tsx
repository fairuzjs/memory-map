import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, ShieldAlert } from "lucide-react"

interface TermsModalProps {
    isOpen: boolean
    onClose: () => void
    type: "terms" | "privacy"
}

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
    const title = type === "terms" ? "SYARAT LAYANAN" : "KEBIJAKAN PRIVASI"
    const Icon = type === "terms" ? FileText : ShieldAlert

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-3xl bg-white border-[4px] border-black shadow-[12px_12px_0_#000] flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 sm:p-6 border-b-[4px] border-black bg-[#E5E5E5]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 border-[3px] border-black bg-[#00FFFF] flex items-center justify-center shadow-[4px_4px_0_#000]">
                                    <Icon className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h2 className="text-[20px] font-black text-black uppercase tracking-wider">{title}</h2>
                                    <p className="text-[12px] font-bold text-black/60 uppercase mt-0.5">Pembaruan Terakhir: 22 April 2026</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 border-[3px] border-black bg-[#FF3300] text-white flex items-center justify-center hover:bg-rose-600 shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all shrink-0 ml-4"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar text-[14px] text-black leading-relaxed space-y-8 bg-white">
                            {type === "terms" ? (
                                <>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#FFFF00] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            1. Penerimaan Syarat
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            Dengan membuat akun dan menggunakan MemoryMap, Anda menyetujui seluruh Syarat Layanan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.
                                        </p>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#00FF00] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            2. Konten Pengguna
                                        </h3>
                                        <div className="border-[3px] border-black p-4 bg-neutral-100 shadow-[4px_4px_0_#000]">
                                            <p className="font-bold text-black/80 mb-3">
                                                Anda bertanggung jawab penuh atas semua konten (foto, cerita, audio, lokasi) yang Anda unggah. Anda dilarang mengunggah konten yang mengandung:
                                            </p>
                                            <ul className="list-disc pl-6 space-y-2 font-bold text-black/80 mb-4 marker:text-[#FF3300]">
                                                <li>SARA, ujaran kebencian, atau diskriminasi.</li>
                                                <li>Pornografi atau konten eksplisit.</li>
                                                <li>Kekerasan atau ancaman.</li>
                                                <li>Spam, penipuan, atau pelanggaran hak cipta.</li>
                                            </ul>
                                            <p className="font-black text-[#FF3300] bg-[#FF3300]/10 p-2 border-[2px] border-[#FF3300] inline-block">
                                                Kami berhak menghapus konten atau memblokir akun yang melanggar aturan ini.
                                            </p>
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#00FFFF] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            3. Fitur Premium & Transaksi
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            Beberapa fitur seperti Integrasi Spotify, kosmetik profil, dan Mystery Box (Gacha) memerlukan mata uang virtual (Poin) yang dapat dibeli (Topup). Semua transaksi bersifat final dan <span className="font-black bg-[#FFFF00] px-1">tidak dapat diuangkan kembali (non-refundable)</span>.
                                        </p>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#FF00FF] border-[3px] border-black text-[16px] text-white font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            4. Privasi & Keamanan
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            Penggunaan data Anda diatur dalam Kebijakan Privasi kami. Anda bertanggung jawab menjaga kerahasiaan kata sandi akun Anda.
                                        </p>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-black text-white border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            5. Perubahan Layanan
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            MemoryMap berhak mengubah, menangguhkan, atau menghentikan layanan (atau fitur di dalamnya) kapan saja tanpa pemberitahuan sebelumnya.
                                        </p>
                                    </section>
                                </>
                            ) : (
                                <>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#FFFF00] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            1. Data yang Kami Kumpulkan
                                        </h3>
                                        <div className="border-[3px] border-black p-4 bg-neutral-100 shadow-[4px_4px_0_#000]">
                                            <p className="font-bold text-black/80 mb-3">Kami mengumpulkan informasi saat Anda mendaftar dan menggunakan layanan, termasuk namun tidak terbatas pada:</p>
                                            <ul className="list-disc pl-6 space-y-2 font-bold text-black/80 marker:text-[#00FF00]">
                                                <li><strong className="text-black bg-white px-1 border border-black">Informasi Akun:</strong> Nama, email, dan kata sandi (dienkripsi).</li>
                                                <li><strong className="text-black bg-white px-1 border border-black">Data Kenangan:</strong> Koordinat lokasi (latitude/longitude), foto, cerita, rekaman suara, dan musik Spotify.</li>
                                                <li><strong className="text-black bg-white px-1 border border-black">Data Interaksi:</strong> Reaksi, komentar, kolaborasi, dan rekam jejak harian (streak).</li>
                                            </ul>
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#00FF00] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            2. Penggunaan Data
                                        </h3>
                                        <div className="border-[3px] border-black p-4 bg-neutral-100 shadow-[4px_4px_0_#000]">
                                            <p className="font-bold text-black/80 mb-3">Data yang dikumpulkan digunakan untuk:</p>
                                            <ul className="list-disc pl-6 space-y-2 font-bold text-black/80 marker:text-[#00FFFF]">
                                                <li>Menampilkan kenangan Anda di peta dunia interaktif.</li>
                                                <li>Memfasilitasi fitur sosial (kolaborasi, komentar, reaksi).</li>
                                                <li>Memproses transaksi topup dan pembelian di dalam aplikasi.</li>
                                                <li>Menjaga keamanan platform dari spam dan penyalahgunaan.</li>
                                            </ul>
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#00FFFF] border-[3px] border-black text-[16px] font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            3. Berbagi Data & Visibilitas
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            Memori yang Anda tandai sebagai "Publik" dapat dilihat oleh semua pengguna. Memori "Privat" hanya dapat dilihat oleh Anda dan kolaborator. Kami <strong className="bg-[#FFFF00] px-1 text-black">tidak pernah menjual</strong> data pribadi Anda kepada pihak ketiga.
                                        </p>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-[#FF00FF] border-[3px] border-black text-[16px] text-white font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            4. Keamanan Data
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            Semua kata sandi dienkripsi, dan berkas media (foto/audio) disimpan secara aman di infrastruktur cloud kami. Namun, tidak ada sistem yang 100% kebal.
                                        </p>
                                    </section>
                                    <section>
                                        <h3 className="inline-block px-3 py-1 bg-black border-[3px] border-black text-[16px] text-white font-black uppercase shadow-[4px_4px_0_#000] mb-3">
                                            5. Hak Anda
                                        </h3>
                                        <p className="font-bold text-black/80 mt-2 p-3 border-[2px] border-black bg-neutral-100">
                                            Anda dapat mengedit, menghapus kenangan, atau meminta penghapusan akun beserta semua datanya kapan saja melalui pengaturan akun.
                                        </p>
                                    </section>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 sm:p-6 border-t-[4px] border-black bg-[#E5E5E5] flex justify-end">
                            <button 
                                onClick={onClose}
                                className="px-8 py-3 bg-[#00FF00] border-[3px] border-black text-black font-black uppercase tracking-wider shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
                            >
                                Saya Mengerti
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
