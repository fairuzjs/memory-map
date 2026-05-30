-- ============================================================
-- Script: Enable Supabase Realtime for global_chat_messages
-- ============================================================
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- 
-- Langkah-langkah:
-- 1. Buka https://supabase.com/dashboard
-- 2. Pilih project Anda
-- 3. Navigasi ke "SQL Editor" di sidebar kiri
-- 4. Paste seluruh isi file ini
-- 5. Klik "Run"
-- ============================================================

-- 1. Tambahkan tabel global_chat_messages ke Supabase Realtime Publication
--    Ini WAJIB agar postgres_changes bisa mendeteksi INSERT/UPDATE/DELETE
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;

-- 2. Enable RLS pada tabel (jika belum aktif)
ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Buat policy agar user yang login (via anon key) bisa SELECT
--    Supabase Realtime menggunakan anon key, jadi butuh policy SELECT
CREATE POLICY "Allow authenticated users to read global chat messages"
ON public.global_chat_messages
FOR SELECT
TO authenticated
USING (true);

-- 4. Buat policy agar anon juga bisa SELECT (diperlukan untuk Realtime subscription)
CREATE POLICY "Allow anon to read global chat messages for realtime"
ON public.global_chat_messages
FOR SELECT
TO anon
USING (true);

-- ============================================================
-- Verifikasi: Cek apakah tabel sudah masuk publication
-- ============================================================
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
