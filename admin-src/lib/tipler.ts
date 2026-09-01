/**
 * Veritabanı tipleri.
 *
 * Bu tipler Supabase şemasının BİREBİR karşılığıdır: sütun adları
 * snake_case, tarihler ISO metin (timestamptz), sayılar number. Şema
 * mobil depodaki supabase/migrations/ klasöründen değişir; burada
 * yalnızca yansıtılır, uydurulmaz.
 */

export type TakimSeviyesi = 'Amatör' | 'Orta' | 'İddialı' | 'Profesyonel';
export type Format = '7v7' | '8v8';
export type UyeRolu = 'Kaptan' | 'Yönetici' | 'Oyuncu';
export type UyeDurumu = 'joined' | 'pending' | 'removed';
export type IlanTuru = 'rakip' | 'oyuncu' | 'kaleci' | 'turnuva' | 'kiralik';
export type TeklifDurumu = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type MacDurumu = 'upcoming' | 'played' | 'cancelled';
export type SonucDurumu = 'pending' | 'confirmed' | 'disputed';
export type KullaniciRolu = 'user' | 'admin';
export type KullaniciDurumu = 'active' | 'suspended';
export type SikayetDurumu = 'open' | 'resolved' | 'dismissed';

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: KullaniciRolu;
  status: KullaniciDurumu;
  suspended_reason: string | null;
  suspended_at: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  short: string;
  district: string;
  level: TakimSeviyesi;
  color: string;
  logo_url: string | null;
  code: string;
  format: Format;
  formation_id: string;
  created_by: string | null;
  created_at: string;
};

export type Listing = {
  id: string;
  team_id: string | null;
  author_id: string;
  kind: IlanTuru;
  date_text: string;
  time_text: string;
  starts_at: string | null;
  pitch: string;
  district: string;
  format: Format;
  fee: number;
  note: string;
  urgent: boolean;
  positions: string[] | null;
  player_name: string | null;
  age: number | null;
  is_open: boolean;
  created_at: string;
};

export type Offer = {
  id: string;
  listing_id: string;
  from_profile_id: string;
  from_team_id: string | null;
  status: TeklifDurumu;
  note: string | null;
  match_id: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  listing_id: string | null;
  home_team_id: string;
  away_team_id: string;
  starts_at: string;
  date_text: string;
  time_text: string;
  pitch: string;
  district: string;
  format: Format;
  fee: number;
  status: MacDurumu;
  home_score: number | null;
  away_score: number | null;
  result_status: SonucDurumu;
  reported_by: string | null;
  confirmed_at: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
};

/**
 * Maç sonrası değerlendirme.
 * Sahaya gelmeme bildirimi BURADA tutulur (no_show), matches tablosunda değil.
 * rater_team_id bildiren, rated_team_id bildirilen takımdır.
 */
export type MatchRating = {
  match_id: string;
  rater_team_id: string;
  rated_team_id: string;
  rating: number | null;
  no_show: boolean;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  detail: string;
  status: SikayetDurumu;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  note: string | null;
  created_at: string;
};

export type TeamMember = {
  team_id: string;
  profile_id: string;
  role: UyeRolu;
  status: UyeDurumu;
  invited_at: string | null;
  joined_at: string | null;
};

/** standings görünümü — yalnızca onaylanmış, oynanmış maçlardan hesaplanır. */
export type Standing = {
  team_id: string;
  name: string;
  short: string;
  color: string;
  logo_url: string | null;
  district: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scored: number;
  conceded: number;
  rating: number | null;
};
