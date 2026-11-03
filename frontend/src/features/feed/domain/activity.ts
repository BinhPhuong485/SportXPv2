export type ActivityAudience = 'friends' | 'onlyMe';

export type ActivityKind = 'personal' | 'hostSummary';

export interface ActivityTotals {
  confirmed: number;
  pending: number;
  disputed: number;
  voided: number;
  wins?: number | null;
  losses?: number | null;
  total: number;
}

export interface ActivityView {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  caption: string;
  title: string;
  courtName: string;
  kind: ActivityKind;
  audience: ActivityAudience;
  publishedAt: string | null;
  playedAt: string;
  version: number;
  totals: ActivityTotals;
  resultsUpdated: boolean;
  isOwner: boolean;
  canOpenLog: boolean;
  liked: boolean;
  likeCount: number;
  sportType: string;
  durationMinutes?: number | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  distanceKm?: number | null;
  pace?: string | null;
  deviceSource?: string | null;
  matchScores: string[];
  likedByNames: string[];
  commentCount: number;
  isDraft: boolean;
}

export interface ActivityCommand {
  action: 'react' | 'save' | 'publish' | 'delete';
  activityId: string;
  requestId?: string;
  expectedVersion?: number;
  caption?: string;
  audience?: ActivityAudience;
  liked?: boolean;
}

export interface MatchDraft {
  courtName: string;
  teamA: string;
  teamB: string;
  score: string;
  isWin: boolean;
}

export namespace MatchDraft {
  export function validateScore(value?: string | null): string | null {
    const score = (value || '').trim();
    if (!/^\d{1,2}\s*[-–]\s*\d{1,2}(?:\s+\d{1,2}\s*[-–]\s*\d{1,2}){0,2}$/.test(score)) {
      return 'Nhập 1–3 set, ví dụ: 21-19 21-16.';
    }
    const setRegex = /(\d+)\s*[-–]\s*(\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = setRegex.exec(score)) !== null) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      const high = a > b ? a : b;
      const low = a > b ? b : a;
      if (
        high > 30 ||
        high < 21 ||
        (high === 21 && low > 19) ||
        (high > 21 && high < 30 && high - low !== 2) ||
        (high === 30 && low !== 28 && low !== 29)
      ) {
        return 'Tỉ số set phải kết thúc ở 21 điểm, cách 2 điểm hoặc chạm 30.';
      }
    }
    return null;
  }
}

export interface MatchSummary {
  id: string;
  courtName: string;
  teamA: string;
  teamB: string;
  score: string;
  isWin: boolean;
  createdAt: string;
  eloChange?: number | null;
}

export function matchToActivityView(match: MatchSummary): ActivityView {
  return {
    id: match.id,
    roomId: match.id,
    authorId: 'athlete',
    authorName: match.teamA.split('&')[0]?.trim() || 'Vận động viên',
    caption: `${match.isWin ? 'Thắng set cầu' : 'Trận đấu kịch tính'} tại ${match.courtName}. Tỉ số chung cuộc: ${match.score}.`,
    title: `${match.teamA}  /  ${match.teamB}`,
    courtName: match.courtName,
    kind: 'personal',
    audience: 'friends',
    publishedAt: match.createdAt,
    playedAt: match.createdAt,
    version: 1,
    totals: {
      confirmed: 1,
      pending: 0,
      disputed: 0,
      voided: 0,
      wins: match.isWin ? 1 : 0,
      losses: match.isWin ? 0 : 1,
      total: 1,
    },
    resultsUpdated: false,
    isOwner: true,
    canOpenLog: false,
    liked: false,
    likeCount: 0,
    sportType: 'badminton',
    durationMinutes: 45,
    calories: 320,
    avgHeartRate: 142,
    maxHeartRate: 178,
    matchScores: match.score.split(/\s+/),
    likedByNames: [],
    commentCount: 0,
    isDraft: false,
  };
}
