-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── admin_users ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin_dinas', 'petugas_lapangan', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('web', 'telegram')),
  telegram_user_id TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  location_lat DECIMAL(10,8) NOT NULL,
  location_lng DECIMAL(11,8) NOT NULL,
  location_name TEXT,
  water_body_type TEXT CHECK (water_body_type IN ('sungai','danau','kolam','parit','lainnya')),
  urgency_scale INTEGER NOT NULL CHECK (urgency_scale BETWEEN 1 AND 5),
  priority_score DECIMAL DEFAULT 0,
  react_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','terverifikasi','proses','selesai','dismissed')),
  assigned_to UUID REFERENCES admin_users(id),
  reporter_email TEXT,
  unique_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── reacts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, fingerprint_hash)
);

-- ── situation_comments ───────────────────────────────────
CREATE TABLE IF NOT EXISTS situation_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('still_there','increasing','decreasing','gone')),
  fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── progress_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES admin_users(id),
  photos TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  fish_caught_count INTEGER,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── extra_photos ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extra_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── rate_limits ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(fingerprint_hash, action, created_at);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_reports_token ON reports(unique_token);
CREATE INDEX IF NOT EXISTS idx_reacts_report ON reacts(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_report ON situation_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_progress_report ON progress_logs(report_id);

-- ── DB function: recalculate priority score ──────────────
CREATE OR REPLACE FUNCTION update_priority_score(p_report_id UUID)
RETURNS VOID AS $$
DECLARE
  v_react_count INTEGER;
  v_still_there INTEGER;
  v_increasing INTEGER;
  v_decreasing INTEGER;
  v_gone INTEGER;
  v_urgency INTEGER;
  v_days_unhandled FLOAT;
  v_score DECIMAL;
BEGIN
  SELECT react_count, urgency_scale,
         EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400
  INTO v_react_count, v_urgency, v_days_unhandled
  FROM reports WHERE id = p_report_id;

  SELECT
    COUNT(*) FILTER (WHERE type = 'still_there'),
    COUNT(*) FILTER (WHERE type = 'increasing'),
    COUNT(*) FILTER (WHERE type = 'decreasing'),
    COUNT(*) FILTER (WHERE type = 'gone')
  INTO v_still_there, v_increasing, v_decreasing, v_gone
  FROM situation_comments WHERE report_id = p_report_id;

  v_score := (v_react_count * 3) + (v_still_there * 2) + (v_increasing * 3) +
             (v_decreasing * -1) + (v_gone * -3) + (v_urgency * 1) + (v_days_unhandled * 0.5);

  UPDATE reports SET priority_score = v_score WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- ── Trigger: update priority score on react change ───────
CREATE OR REPLACE FUNCTION trigger_update_priority()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_priority_score(NEW.report_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_priority_score(OLD.report_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_react_priority ON reacts;
CREATE TRIGGER trg_react_priority
AFTER INSERT OR DELETE ON reacts
FOR EACH ROW EXECUTE FUNCTION trigger_update_priority();

DROP TRIGGER IF EXISTS trg_comment_priority ON situation_comments;
CREATE TRIGGER trg_comment_priority
AFTER INSERT ON situation_comments
FOR EACH ROW EXECUTE FUNCTION trigger_update_priority();

-- ── RLS Policies ─────────────────────────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- reports: public read (non-dismissed), public insert, admin update
CREATE POLICY "reports_public_read" ON reports FOR SELECT USING (status != 'dismissed');
CREATE POLICY "reports_public_insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_admin_update" ON reports FOR UPDATE USING (auth.role() = 'authenticated');

-- reacts: public read + insert
CREATE POLICY "reacts_public" ON reacts FOR SELECT USING (true);
CREATE POLICY "reacts_insert" ON reacts FOR INSERT WITH CHECK (true);
CREATE POLICY "reacts_delete" ON reacts FOR DELETE USING (true);

-- situation_comments: public read + insert
CREATE POLICY "comments_public" ON situation_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON situation_comments FOR INSERT WITH CHECK (true);

-- progress_logs: public read, admin insert
CREATE POLICY "progress_public_read" ON progress_logs FOR SELECT USING (true);
CREATE POLICY "progress_admin_insert" ON progress_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- extra_photos: public insert, public read (approved only)
CREATE POLICY "extra_photos_insert" ON extra_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "extra_photos_read" ON extra_photos FOR SELECT USING (is_approved = true);
CREATE POLICY "extra_photos_admin_read" ON extra_photos FOR SELECT USING (auth.role() = 'authenticated');

-- admin_users: authenticated only
CREATE POLICY "admin_users_auth" ON admin_users FOR ALL USING (auth.role() = 'authenticated');

-- rate_limits: public
CREATE POLICY "rate_limits_public" ON rate_limits FOR ALL USING (true);
