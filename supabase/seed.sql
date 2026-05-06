-- Seed data realistis untuk WALI MVP demo
-- Lokasi: Ciliwung, Pesanggrahan, Sunter, Bekasi

-- ── Admin users ──────────────────────────────────────────
-- Update existing admin@wali.id to use the demo UUID so progress_logs FK works
UPDATE admin_users SET id = 'a1000000-0000-0000-0000-000000000001', full_name = 'Administrator WALI', role = 'super_admin'
WHERE email = 'admin@wali.id';

-- Insert demo petugas (no auth account needed, FK-only for progress logs)
INSERT INTO admin_users (id, email, full_name, role) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'petugas1@dinas.go.id', 'Budi Santoso', 'petugas_lapangan'),
  ('a1000000-0000-0000-0000-000000000003', 'petugas2@dinas.go.id', 'Siti Rahayu', 'admin_dinas')
ON CONFLICT (id) DO NOTHING;

-- ── Reports ──────────────────────────────────────────────
INSERT INTO reports (id, source, photos, description, location_lat, location_lng, location_name, water_body_type, urgency_scale, priority_score, react_count, status, unique_token, reporter_email, created_at) VALUES

('b1000000-0000-0000-0000-000000000001', 'web',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
  'Saya melihat ratusan ikan sapu-sapu di Kali Ciliwung dekat Manggarai. Airnya sangat keruh dan ikan-ikan ini sangat aktif. Jumlahnya sangat banyak sekali melebihi pengamatan sebelumnya.',
  -6.2088, 106.8456, 'Kali Ciliwung, Manggarai, Jakarta Selatan', 'sungai', 5, 85.5, 42, 'proses',
  'abc123demo1', 'warga1@gmail.com', NOW() - INTERVAL '5 days'),

('b1000000-0000-0000-0000-000000000002', 'web',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
  'Ada banyak ikan sapu-sapu di kolam dekat perumahan saya. Anak-anak tidak bisa main di pinggir kolam karena ikan-ikan ini sudah menguasai seluruh bagian kolam.',
  -6.2614, 106.7897, 'Kali Pesanggrahan, Kebayoran Lama, Jakarta Selatan', 'kolam', 4, 62.0, 28, 'terverifikasi',
  'abc123demo2', NULL, NOW() - INTERVAL '3 days'),

('b1000000-0000-0000-0000-000000000003', 'telegram',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
  'Kali Sunter dipenuhi ikan sapu-sapu. Nelayan lokal sangat terdampak karena ikan asli semakin sedikit. Perlu penanganan segera.',
  -6.1745, 106.8799, 'Kali Sunter, Tanjung Priok, Jakarta Utara', 'sungai', 5, 78.0, 35, 'baru',
  'abc123demo3', NULL, NOW() - INTERVAL '1 day'),

('b1000000-0000-0000-0000-000000000004', 'web',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
  'Temuan ikan sapu-sapu di danau buatan Sunter Park. Jumlahnya belum terlalu banyak tapi sudah mengkhawatirkan.',
  -6.1632, 106.8756, 'Danau Sunter, Jakarta Utara', 'danau', 3, 25.0, 12, 'selesai',
  'abc123demo4', 'warga2@gmail.com', NOW() - INTERVAL '10 days'),

('b1000000-0000-0000-0000-000000000005', 'web',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
  'Parit irigasi sawah di Bekasi penuh dengan ikan sapu-sapu. Petani sangat khawatir karena parit menjadi mampet dan ikan asli tidak ada lagi.',
  -6.2382, 106.9756, 'Parit Irigasi, Bekasi Barat, Bekasi', 'parit', 4, 55.0, 20, 'baru',
  'abc123demo5', NULL, NOW() - INTERVAL '2 days'),

('b1000000-0000-0000-0000-000000000006', 'telegram',
  ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
  'Ikan sapu-sapu ditemukan di Kali Krukut jumlahnya cukup banyak. Airnya sudah sangat keruh.',
  -6.2156, 106.8012, 'Kali Krukut, Kebayoran Baru, Jakarta Selatan', 'sungai', 3, 30.0, 15, 'terverifikasi',
  'abc123demo6', NULL, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ── Situation Comments ────────────────────────────────────
INSERT INTO situation_comments (report_id, type, fingerprint_hash) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'still_there', 'fp_demo_1'),
  ('b1000000-0000-0000-0000-000000000001', 'increasing', 'fp_demo_2'),
  ('b1000000-0000-0000-0000-000000000001', 'increasing', 'fp_demo_3'),
  ('b1000000-0000-0000-0000-000000000001', 'still_there', 'fp_demo_4'),
  ('b1000000-0000-0000-0000-000000000002', 'still_there', 'fp_demo_5'),
  ('b1000000-0000-0000-0000-000000000002', 'decreasing', 'fp_demo_6'),
  ('b1000000-0000-0000-0000-000000000003', 'increasing', 'fp_demo_7'),
  ('b1000000-0000-0000-0000-000000000003', 'still_there', 'fp_demo_8')
ON CONFLICT DO NOTHING;

-- ── Reacts ────────────────────────────────────────────────
INSERT INTO reacts (report_id, fingerprint_hash) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'fp_react_1'),
  ('b1000000-0000-0000-0000-000000000001', 'fp_react_2'),
  ('b1000000-0000-0000-0000-000000000002', 'fp_react_3'),
  ('b1000000-0000-0000-0000-000000000003', 'fp_react_4'),
  ('b1000000-0000-0000-0000-000000000003', 'fp_react_5')
ON CONFLICT DO NOTHING;

-- ── Progress Logs ─────────────────────────────────────────
INSERT INTO progress_logs (report_id, officer_id, photos, description, fish_caught_count, logged_at) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
   'Tim lapangan telah melakukan penyisiran pertama di Kali Ciliwung dekat Manggarai. Berhasil menangkap sekitar 150 ekor ikan sapu-sapu. Kondisi air masih keruh.',
   150, NOW() - INTERVAL '3 days'),
  ('b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000002',
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
   'Penyisiran kedua dilakukan dengan jaring khusus. Total 280 ekor berhasil ditangkap hari ini. Akan dilanjutkan minggu depan.',
   280, NOW() - INTERVAL '1 day'),
  ('b1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000003',
   ARRAY['https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Pterygoplichthys_disjunctivus.jpg/640px-Pterygoplichthys_disjunctivus.jpg'],
   'Penanganan selesai. Total 520 ekor ikan sapu-sapu berhasil diangkat dari Danau Sunter. Ekosistem sudah mulai pulih.',
   520, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Update status selesai
UPDATE reports SET status = 'selesai', assigned_to = 'a1000000-0000-0000-0000-000000000003'
WHERE id = 'b1000000-0000-0000-0000-000000000004';

-- Update assigned untuk yang proses
UPDATE reports SET assigned_to = 'a1000000-0000-0000-0000-000000000002'
WHERE id = 'b1000000-0000-0000-0000-000000000001';

-- Recalculate priority scores
SELECT update_priority_score(id) FROM reports;
