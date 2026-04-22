import { motion, AnimatePresence } from "framer-motion"
import { X, FileText, ShieldAlert } from "lucide-react"

interface TermsModalProps {
    isOpen: boolean
    onClose: () => void
    type: "terms" | "privacy"
}

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
    const title = type === "terms" ? "Syarat Layanan" : "Kebijakan Privasi"
    const Icon = type === "terms" ? FileText : ShieldAlert

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-2xl bg-[#0a0a10] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white font-[Outfit]">{title}</h2>
                                    <p className="text-xs text-neutral-400">Pembaruan Terakhir: 22 April 2026</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-neutral-300 leading-relaxed space-y-6">
                            {type === "terms" ? (
                                <>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">1. Penerimaan Syarat</h3>
                                        <p>Dengan membuat akun dan menggunakan MemoryMap, Anda menyetujui seluruh Syarat Layanan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.</p>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">2. Konten Pengguna</h3>
                                        <p>Anda bertanggung jawab penuh atas semua konten (foto, cerita, audio, lokasi) yang Anda unggah. Anda dilarang mengunggah konten yang mengandung:</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-400">
                                            <li>SARA, ujaran kebencian, atau diskriminasi.</li>
                                            <li>Pornografi atau konten eksplisit.</li>
                                            <li>Kekerasan atau ancaman.</li>
                                            <li>Spam, penipuan, atau pelanggaran hak cipta.</li>
                                        </ul>
                                        <p className="mt-2">Kami berhak menghapus konten atau memblokir akun yang melanggar aturan ini berdasarkan laporan pengguna maupun pantauan admin.</p>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">3. Fitur Premium & Transaksi</h3>
                                        <p>Beberapa fitur seperti Integrasi Spotify, kosmetik profil, dan Mystery Box (Gacha) memerlukan mata uang virtual (Poin) yang dapat dibeli (Topup). Semua transaksi bersifat final dan tidak dapat diuangkan kembali (non-refundable).</p>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">4. Privasi & Keamanan</h3>
                                        <p>Penggunaan data Anda diatur dalam Kebijakan Privasi kami. Anda bertanggung jawab menjaga kerahasiaan kata sandi akun Anda.</p>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">5. Perubahan Layanan</h3>
                                        <p>MemoryMap berhak mengubah, menangguhkan, atau menghentikan layanan (atau fitur di dalamnya) kapan saja tanpa pemberitahuan sebelumnya.</p>
                                    </section>
                                </>
                            ) : (
                                <>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">1. Data yang Kami Kumpulkan</h3>
                                        <p>Kami mengumpulkan informasi saat Anda mendaftar dan menggunakan layanan, termasuk namun tidak terbatas pada:</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-400">
                                            <li><strong>Informasi Akun:</strong> Nama, email, dan kata sandi (dienkripsi).</li>
                                            <li><strong>Data Kenangan:</strong> Koordinat lokasi (latitude/longitude), foto, cerita, rekaman suara, dan musik Spotify yang Anda tautkan.</li>
                                            <li><strong>Data Interaksi:</strong> Reaksi, komentar, kolaborasi, dan rekam jejak harian (streak).</li>
                                        </ul>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">2. Penggunaan Data</h3>
                                        <p>Data yang dikumpulkan digunakan untuk:</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-400">
                                            <li>Menampilkan kenangan Anda di peta dunia interaktif.</li>
                                            <li>Memfasilitasi fitur sosial (kolaborasi, komentar, reaksi).</li>
                                            <li>Memproses transaksi topup dan pembelian di dalam aplikasi.</li>
                                            <li>Menjaga keamanan platform dari spam dan penyalahgunaan.</li>
                                        </ul>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">3. Berbagi Data & Visibilitas</h3>
                                        <p>Memori yang Anda tandai sebagai "Publik" dapat dilihat oleh semua pengguna. Memori "Privat" hanya dapat dilihat oleh Anda dan kolaborator yang Anda undang. Kami <strong>tidak pernah menjual</strong> data pribadi Anda kepada pihak ketiga.</p>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">4. Keamanan Data</h3>
                                        <p>Semua kata sandi dienkripsi, dan berkas media (foto/audio) disimpan secara aman di infrastruktur cloud kami. Namun, tidak ada sistem yang 100% kebal, sehingga kami menyarankan Anda menggunakan kata sandi yang kuat.</p>
                                    </section>
                                    <section>
                                        <h3 className="text-white font-bold text-base mb-2">5. Hak Anda</h3>
                                        <p>Anda dapat mengedit, menghapus kenangan, atau meminta penghapusan akun beserta semua datanya kapan saja melalui pengaturan akun.</p>
                                    </section>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end">
                            <button 
                                onClick={onClose}
                                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
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
