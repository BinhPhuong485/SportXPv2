import { rankTierFromElo, RANK_TIERS } from '../../rankings/domain/rankTier';

export interface PlayerProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  eloRating?: number | null;
  tierName: string;
  trustScore: number;
  winStreak: number;
  homeCourtId?: string | null;
  homeCourtName?: string | null;
  createdAt?: string | null;
  onboardingStep: number;
  publicId?: string | null;
  socialVisibility: string;
  isIdentityVerified: boolean;
  confirmedMatchesCount: number;
  rankDelta: number;
}

export interface MatchDiaryItem {
  id: string;
  courtName: string;
  teamA: string;
  teamB: string;
  score: string;
  isWin: boolean;
  eloChange?: number | null;
  createdAt: string;
}

export function getInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return 'XP';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return trimmed.substring(0, trimmed.length >= 2 ? 2 : 1).toUpperCase();
}

export function formatMemberSince(createdAt?: string | null): string {
  if (!createdAt) return 'Mới gia nhập';
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return 'Mới gia nhập';
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

export interface NextTierProgress {
  nextTier: string;
  targetElo: number;
  pointsNeeded: number;
  progress: number;
}

export function getNextTierProgress(eloRating?: number | null): NextTierProgress {
  const elo = eloRating ?? 300;
  const current = rankTierFromElo(elo);
  const currentIndex = RANK_TIERS.findIndex((t) => t.key === current.key);

  if (currentIndex < 0 || currentIndex >= RANK_TIERS.length - 1) {
    return {
      nextTier: 'Đỉnh cao bảng đấu',
      targetElo: elo,
      pointsNeeded: 0,
      progress: 1.0,
    };
  }

  const next = RANK_TIERS[currentIndex + 1];
  const pointsNeeded = Math.max(0, next.minimumElo - elo);
  const range = next.minimumElo - current.minimumElo;
  const progress = range > 0 ? Math.min(Math.max((elo - current.minimumElo) / range, 0.0), 1.0) : 1.0;

  return {
    nextTier: next.label,
    targetElo: next.minimumElo,
    pointsNeeded,
    progress,
  };
}

export function getPlacementMatchesCompleted(confirmedCount: number): number {
  return Math.min(Math.max(confirmedCount, 0), 5);
}

export function isProfileCalibrated(confirmedCount: number): boolean {
  return getPlacementMatchesCompleted(confirmedCount) >= 5;
}

export function getTrustStatusText(trustScore: number, hasMatchHistory: boolean): string {
  if (!hasMatchHistory) return 'Uy tín khởi tạo · chưa đủ lịch sử';
  if (trustScore >= 95) return 'Uy tín tuyệt đối';
  if (trustScore >= 80) return 'Đáng tin cậy';
  if (trustScore >= 60) return 'Cần cải thiện';
  return 'Cảnh báo bùng kèo';
}
