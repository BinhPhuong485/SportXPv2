import { MatchDiaryItem } from './playerProfile';

export interface ProfileComputedStats {
  totalMatches: number;
  winsCount: number;
  lossesCount: number;
  winRate: number; // 0 - 100 percentage
  currentStreak: number;
  bestStreak: number;
  avgEloChange: number;
  favoriteCourt: string;
  matchesThisMonth: number;
  recentForm: ('W' | 'L')[]; // last up to 10 matches
}

export interface EloPoint {
  date: string;
  formattedDate: string;
  elo: number;
  delta: number;
  matchId: string;
  courtName: string;
}

export interface ClientAchievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  isUnlocked: boolean;
  unlockHint: string;
  progressText?: string;
}

export function getTierRingStyle(elo: number | null | undefined): {
  ringColor: string;
  badgeBg: string;
  badgeText: string;
} {
  const eloVal = elo ?? 750;
  if (eloVal >= 1200) {
    return {
      ringColor: 'border-app-streak text-app-streak ring-app-streak/40',
      badgeBg: 'bg-app-streak/15 border-app-streak/40',
      badgeText: 'text-app-streak',
    };
  }
  if (eloVal >= 850) {
    return {
      ringColor: 'border-app-primary text-app-primary ring-app-primary/40',
      badgeBg: 'bg-app-primary/15 border-app-primary/40',
      badgeText: 'text-app-primary',
    };
  }
  if (eloVal >= 600) {
    return {
      ringColor: 'border-amber-600 text-amber-600 ring-amber-600/30',
      badgeBg: 'bg-amber-600/15 border-amber-600/40',
      badgeText: 'text-amber-600',
    };
  }
  return {
    ringColor: 'border-app-muted text-app-muted ring-app-muted/30',
    badgeBg: 'bg-app-surface border-app-border',
    badgeText: 'text-app-muted',
  };
}

/**
 * Computes win rate percentage (0 to 100)
 */
export function computeWinRate(matches: MatchDiaryItem[]): number {
  if (!matches || matches.length === 0) return 0;
  const wins = matches.filter((m) => m.isWin).length;
  return Math.round((wins / matches.length) * 1000) / 10;
}

/**
 * Computes current and best win streak from matches (ordered newest to oldest)
 */
export function computeStreaks(matches: MatchDiaryItem[]): {
  currentStreak: number;
  bestStreak: number;
} {
  if (!matches || matches.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Current streak: consecutive wins starting from the most recent match (index 0)
  let currentStreak = 0;
  for (const m of matches) {
    if (m.isWin) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best streak: chronologically evaluate from oldest to newest
  const chrono = [...matches].reverse();
  let bestStreak = 0;
  let tempStreak = 0;

  for (const m of chrono) {
    if (m.isWin) {
      tempStreak++;
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
}

/**
 * Finds favorite court. In case of tie, breaks tie with the most recent match.
 */
export function computeFavoriteCourt(matches: MatchDiaryItem[]): string {
  if (!matches || matches.length === 0) return 'Chưa có';

  const counts: Record<string, { count: number; mostRecentIndex: number }> = {};

  matches.forEach((m, index) => {
    const court = m.courtName || 'Sân thi đấu';
    if (!counts[court]) {
      counts[court] = { count: 0, mostRecentIndex: index };
    }
    counts[court].count++;
  });

  let bestCourt = 'Chưa có';
  let maxCount = 0;
  let minRecentIndex = Number.MAX_SAFE_INTEGER;

  for (const [court, info] of Object.entries(counts)) {
    if (
      info.count > maxCount ||
      (info.count === maxCount && info.mostRecentIndex < minRecentIndex)
    ) {
      bestCourt = court;
      maxCount = info.count;
      minRecentIndex = info.mostRecentIndex;
    }
  }

  return bestCourt;
}

/**
 * Computes average Elo change across completed matches with recorded changes
 */
export function computeAvgEloChange(matches: MatchDiaryItem[]): number {
  if (!matches || matches.length === 0) return 0;
  const withDelta = matches.filter((m) => m.eloChange != null);
  if (withDelta.length === 0) return 0;
  const sum = withDelta.reduce((acc, m) => acc + (m.eloChange || 0), 0);
  return Math.round((sum / withDelta.length) * 10) / 10;
}

/**
 * Counts matches played in current month (Asia/Ho_Chi_Minh time)
 */
export function computeMatchesThisMonth(
  matches: MatchDiaryItem[],
  referenceDate: Date = new Date()
): number {
  if (!matches || matches.length === 0) return 0;

  const refFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'numeric',
  });
  const refParts = refFormatter.formatToParts(referenceDate);
  const currentYear = refParts.find((p) => p.type === 'year')?.value;
  const currentMonth = refParts.find((p) => p.type === 'month')?.value;

  let count = 0;
  for (const m of matches) {
    if (!m.createdAt) continue;
    const matchDate = new Date(m.createdAt);
    if (isNaN(matchDate.getTime())) continue;

    const parts = refFormatter.formatToParts(matchDate);
    const mYear = parts.find((p) => p.type === 'year')?.value;
    const mMonth = parts.find((p) => p.type === 'month')?.value;

    if (mYear === currentYear && mMonth === currentMonth) {
      count++;
    }
  }

  return count;
}

/**
 * Computes all stats from user's matches
 */
export function computeProfileStats(
  matches: MatchDiaryItem[],
  referenceDate: Date = new Date()
): ProfileComputedStats {
  const total = matches ? matches.length : 0;
  const wins = matches ? matches.filter((m) => m.isWin).length : 0;
  const losses = total - wins;
  const winRate = computeWinRate(matches);
  const { currentStreak, bestStreak } = computeStreaks(matches);
  const avgEloChange = computeAvgEloChange(matches);
  const favoriteCourt = computeFavoriteCourt(matches);
  const matchesThisMonth = computeMatchesThisMonth(matches, referenceDate);
  const recentForm = matches ? matches.slice(0, 10).map((m) => (m.isWin ? ('W' as const) : ('L' as const))) : [];

  return {
    totalMatches: total,
    winsCount: wins,
    lossesCount: losses,
    winRate,
    currentStreak,
    bestStreak,
    avgEloChange,
    favoriteCourt,
    matchesThisMonth,
    recentForm,
  };
}

/**
 * Builds Elo trajectory points for the hand-built SVG chart
 */
export function computeEloHistoryPoints(
  matches: MatchDiaryItem[],
  currentElo: number
): EloPoint[] {
  if (!matches || matches.length === 0) {
    return [
      {
        date: new Date().toISOString(),
        formattedDate: 'Hiện tại',
        elo: currentElo || 750,
        delta: 0,
        matchId: 'init',
        courtName: 'Khởi đầu',
      },
    ];
  }

  // Matches are newest first. Let's reconstruct Elo backwards from currentElo.
  // Then reverse to chronological order (oldest to newest) for line chart.
  let runningElo = currentElo;
  const pointsReversed: EloPoint[] = [];

  for (const m of matches) {
    const delta = m.eloChange ?? (m.isWin ? 15 : -15);
    const dateObj = new Date(m.createdAt);
    const formattedDate = !isNaN(dateObj.getTime())
      ? new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          day: '2-digit',
          month: '2-digit',
        }).format(dateObj)
      : 'Trận đấu';

    pointsReversed.push({
      date: m.createdAt,
      formattedDate,
      elo: runningElo,
      delta,
      matchId: m.id,
      courtName: m.courtName || 'Sân thi đấu',
    });

    // Step backwards
    runningElo -= delta;
  }

  // Add the base starting point prior to the oldest match
  const oldestDate = new Date(matches[matches.length - 1].createdAt);
  const baseDate = !isNaN(oldestDate.getTime())
    ? new Date(oldestDate.getTime() - 24 * 3600 * 1000)
    : new Date();

  pointsReversed.push({
    date: baseDate.toISOString(),
    formattedDate: 'Ban đầu',
    elo: runningElo,
    delta: 0,
    matchId: 'start',
    courtName: 'Điểm khởi tạo',
  });

  // Return chronological
  return pointsReversed.reverse();
}

/**
 * Computes client-side milestone achievements
 */
export function computeClientAchievements(params: {
  stats: ProfileComputedStats;
  eloRating: number;
  roomsHostedCount: number;
  tournamentsRegisteredCount: number;
}): ClientAchievement[] {
  const { stats, eloRating, roomsHostedCount, tournamentsRegisteredCount } = params;

  return [
    {
      id: 'first_match',
      title: 'Bước Đầu Tiến Bộ',
      description: 'Hoàn thành trận thi đấu đầu tiên trên hệ thống.',
      iconName: 'zap',
      isUnlocked: stats.totalMatches >= 1,
      unlockHint: 'Tham gia 1 trận đấu để mở khóa',
      progressText: `${Math.min(stats.totalMatches, 1)}/1 trận`,
    },
    {
      id: 'five_matches',
      title: 'Chiến Binh Sân Cầu',
      description: 'Chinh chiến 5 trận cầu để kích hoạt bảng xếp hạng chính thức.',
      iconName: 'shield',
      isUnlocked: stats.totalMatches >= 5,
      unlockHint: 'Hoàn tất đủ 5 trận phân hạng',
      progressText: `${Math.min(stats.totalMatches, 5)}/5 trận`,
    },
    {
      id: 'ten_matches',
      title: 'Bền Bỉ Đam Mê',
      description: 'Hoàn thành 10 trận đấu phong trào.',
      iconName: 'flame',
      isUnlocked: stats.totalMatches >= 10,
      unlockHint: 'Thi đấu tích lũy 10 trận',
      progressText: `${Math.min(stats.totalMatches, 10)}/10 trận`,
    },
    {
      id: 'win_streak_3',
      title: 'Tay Vợt Thăng Hoa',
      description: 'Đạt chuỗi 3 trận thắng liên tiếp không để đứt mạch.',
      iconName: 'sparkles',
      isUnlocked: stats.bestStreak >= 3,
      unlockHint: 'Thắng 3 trận liên tiếp',
      progressText: `Kỷ lục: ${stats.bestStreak}/3 trận`,
    },
    {
      id: 'tier_intermediate',
      title: 'Bứt Phá Trung Bình',
      description: 'Vượt mốc 600 Elo để vươn tới thứ hạng Trung bình.',
      iconName: 'award',
      isUnlocked: eloRating >= 600,
      unlockHint: 'Đạt Elo 600 trở lên',
      progressText: `${eloRating}/600 Elo`,
    },
    {
      id: 'host_first_room',
      title: 'Chủ Sân Thân Thiện',
      description: 'Tạo và làm host tổ chức ít nhất một phòng giao lưu.',
      iconName: 'crown',
      isUnlocked: roomsHostedCount >= 1,
      unlockHint: 'Tạo 1 kèo thi đấu mới',
      progressText: `${Math.min(roomsHostedCount, 1)}/1 kèo`,
    },
    {
      id: 'join_tournament',
      title: 'Đấu Trường Đỉnh Cao',
      description: 'Đăng ký tham gia giải đấu phong trào tại các cụm sân.',
      iconName: 'trophy',
      isUnlocked: tournamentsRegisteredCount >= 1,
      unlockHint: 'Đăng ký 1 giải đấu bất kỳ',
      progressText: `${Math.min(tournamentsRegisteredCount, 1)}/1 giải`,
    },
  ];
}
