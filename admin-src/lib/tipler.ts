/**
 * Saha46 veri modeli.
 *
 * Team / Listing / Offer / Match tipleri mobil uygulamadan birebir alınmıştır.
 * Alan adları İngilizce ve camelCase'dir; sunucu bu şemanın üzerine kurulacağı
 * için DEĞİŞTİRİLMEMELİDİR. Panele özgü tipler (Profile, Report, AuditLog,
 * Tournament, TournamentApplication) mobilde henüz yok, sunucuda olacak.
 */

export type Ilce =
  | 'Onikişubat'
  | 'Dulkadiroğlu'
  | 'Elbistan'
  | 'Afşin'
  | 'Türkoğlu'
  | 'Pazarcık';

export type Seviye = 'Amatör' | 'Orta' | 'İddialı' | 'Profesyonel';
export type Format = '7v7' | '8v8';
export type Mevki = 'Kaleci' | 'Defans' | 'Orta Saha' | 'Forvet';

export type Team = {
  id: string;
  name: string;
  short: string;
  district: string;
  level: Seviye;
  color: string;
  code: string;
  format: Format;
  formationId: string;
  logoUri?: string;
};

export type ListingKind = 'rakip' | 'oyuncu' | 'kaleci' | 'turnuva' | 'kiralik';

export type Listing = {
  id: string;
  teamId: string;
  kind: ListingKind;
  date: string;
  time: string;
  pitch: string;
  district: string;
  format: Format;
  fee: number;
  note: string;
  urgent?: boolean;
  positions?: string[];
  playerName?: string;
  age?: number;
  createdAt: number;
};

export type Offer = {
  id: string;
  listingId: string;
  teamId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  note: string;
  createdAt: number;
  matchId?: string;
};

export type Match = {
  id: string;
  opponentId: string;
  date: string;
  time: string;
  pitch: string;
  district: string;
  format: Format;
  fee: number;
  status: 'upcoming' | 'played' | 'cancelled';
  result?: { us: number; them: number };
  rating?: number;
  noShow?: boolean;
  createdAt: number;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  teamId?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  suspendedReason?: string;
  suspendedAt?: number;
  createdAt: number;
};

export type ReportReason = 'sahte-ilan' | 'hakaret' | 'taciz' | 'spam' | 'diger';

export type Report = {
  id: string;
  reporterId: string;
  targetType: 'team' | 'profile' | 'listing';
  targetId: string;
  reason: ReportReason;
  detail: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: number;
  resolution?: string;
  createdAt: number;
};

export type AuditLog = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string;
  createdAt: number;
};

/** Turnuva ekranı için — mobilde ilan olarak duruyor, sunucuda ayrı tablo olacak. */
export type Tournament = {
  id: string;
  name: string;
  organizer: string;
  format: Format;
  quota: number;
  fee: number;
  prize: string;
  startDate: string;
  pitch: string;
  district: string;
  status: 'draft' | 'open' | 'closed';
  createdAt: number;
};

export type TournamentApplication = {
  id: string;
  tournamentId: string;
  teamId: string;
  status: 'pending' | 'accepted' | 'rejected';
  note: string;
  createdAt: number;
};

/** Duyuru ekranının önizlemesi için. Gönderim sahtedir. */
export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: { type: 'all' | 'district' | 'level'; value?: string };
  createdAt: number;
};
