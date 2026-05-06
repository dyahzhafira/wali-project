export type ReportStatus = "baru" | "terverifikasi" | "proses" | "selesai" | "dismissed";
export type ReportSource = "web" | "telegram" | "dinas";
export type WaterBodyType = "sungai" | "danau" | "kolam" | "parit" | "lainnya";
export type SituationCommentType = "still_there" | "increasing" | "decreasing" | "gone";
export type AdminRole = "admin_dinas" | "petugas_lapangan" | "super_admin";

export interface Report {
  id: string;
  source: ReportSource;
  telegram_user_id?: string;
  photos: string[];
  description: string;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  water_body_type?: WaterBodyType;
  urgency_scale: number;
  priority_score?: number;
  react_count: number;
  status: ReportStatus;
  assigned_to?: string;
  reporter_email?: string;
  unique_token: string;
  verified_at?: string;
  created_at: string;
}

export interface ProgressLog {
  id: string;
  report_id: string;
  officer_id: string;
  photos: string[];
  description: string;
  fish_caught_count?: number;
  logged_at: string;
  admin_users?: { full_name: string };
}

export interface SituationComment {
  id: string;
  report_id: string;
  type: SituationCommentType;
  fingerprint_hash: string;
  created_at: string;
}

export interface React {
  id: string;
  report_id: string;
  fingerprint_hash: string;
  created_at: string;
}

export interface ExtraPhoto {
  id: string;
  report_id: string;
  photo_url: string;
  fingerprint_hash: string;
  is_approved: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
}

export interface Stats {
  total_reports: number;
  active_reports: number;
  reports_today: number;
  reports_in_progress: number;
  reports_done_this_month: number;
}

export interface ReportWithDetails extends Report {
  progress_logs?: ProgressLog[];
  situation_comments?: SituationComment[];
  extra_photos?: ExtraPhoto[];
  assigned_user?: AdminUser;
  comment_counts?: {
    still_there: number;
    increasing: number;
    decreasing: number;
    gone: number;
  };
}
