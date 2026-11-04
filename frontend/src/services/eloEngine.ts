import { rankTierFromElo } from '../features/rankings/domain/rankTier';

export interface EloPlayerProfile {
  id: string;
  displayName: string;
  eloRating: number;
  winStreak: number;
}

export interface EloCalculationResult {
  kFactor: number;
  eloDelta: number;
  expectedA: number;
  expectedB: number;
  isHeadToHeadCapped: boolean;
  message?: string;
}

export interface SettlePlayerResult {
  playerId: string;
  oldElo: number;
  newElo: number;
  eloChange: number;
  oldStreak: number;
  newStreak: number;
  oldTier: string;
  newTier: string;
  isWin: boolean;
}

/**
 * Determine dynamic K-Factor:
 * - K = 10: Friends or have played before in last 30 days (prevents rating farming)
 * - K = 20: New opponents
 * - K = 32: Official match with host/referee certified
 */
export function determineKFactor(params: {
  hasPlayedBeforeOrFriends?: boolean;
  isOfficialOrCertified?: boolean;
}): number {
  if (params.isOfficialOrCertified) return 32;
  if (params.hasPlayedBeforeOrFriends) return 10;
  return 20;
}

/**
 * Core Elo calculation with Head-to-Head capping and Flat Team Distribution.
 */
export function calculateElo(params: {
  teamAElos: number[];
  teamBElos: number[];
  winnerTeam: 'A' | 'B';
  h2hMatchesLast24h: number;
  hasPlayedBeforeOrFriends?: boolean;
  isOfficialOrCertified?: boolean;
}): EloCalculationResult {
  // 1. Anti-Cheat: Head-to-Head Capping
  // Within 24h, maximum 2 rated matches between the same opponents.
  // 3rd match onwards is automatically Unrated (eloDelta = 0).
  if (params.h2hMatchesLast24h >= 2) {
    return {
      kFactor: 0,
      eloDelta: 0,
      expectedA: 0.5,
      expectedB: 0.5,
      isHeadToHeadCapped: true,
      message: 'Đã đạt giới hạn 2 trận tính điểm/ngày giữa 2 đối thủ. Trận đấu này chuyển sang Unrated.',
    };
  }

  const kFactor = determineKFactor({
    hasPlayedBeforeOrFriends: params.hasPlayedBeforeOrFriends,
    isOfficialOrCertified: params.isOfficialOrCertified,
  });

  // 2. Calculate average team Elo
  const avgA =
    params.teamAElos.length > 0
      ? params.teamAElos.reduce((a, b) => a + b, 0) / params.teamAElos.length
      : 750;
  const avgB =
    params.teamBElos.length > 0
      ? params.teamBElos.reduce((a, b) => a + b, 0) / params.teamBElos.length
      : 750;

  // 3. Expected score
  // E_A = 1.0 / (1.0 + 10^((Elo_B - Elo_A) / 400.0))
  const diff = avgB - avgA;
  const expectedA = 1.0 / (1.0 + Math.pow(10, diff / 400.0));
  const expectedB = 1.0 - expectedA;

  // 4. Actual score from Team A perspective
  const actualA = params.winnerTeam === 'A' ? 1.0 : 0.0;

  // 5. Raw Delta
  const rawDelta = Math.round(kFactor * (actualA - expectedA));
  const eloDelta = Math.max(1, Math.abs(rawDelta));

  return {
    kFactor,
    eloDelta,
    expectedA,
    expectedB,
    isHeadToHeadCapped: false,
  };
}

/**
 * Apply Elo changes to all participating players (Flat Team Distribution).
 * - Winning team gets +eloDelta, streak increases.
 * - If streak >= 3, add +3 streak bonus Elo.
 * - Losing team gets -eloDelta (floor at 300 Elo), streak resets to 0.
 */
export function settlePlayers(params: {
  teamAPlayers: EloPlayerProfile[];
  teamBPlayers: EloPlayerProfile[];
  winnerTeam: 'A' | 'B';
  eloDelta: number;
  isHeadToHeadCapped: boolean;
}): SettlePlayerResult[] {
  if (params.isHeadToHeadCapped || params.eloDelta === 0) {
    // Unrated match
    return [...params.teamAPlayers, ...params.teamBPlayers].map((p) => {
      const tier = rankTierFromElo(p.eloRating);
      return {
        playerId: p.id,
        oldElo: p.eloRating,
        newElo: p.eloRating,
        eloChange: 0,
        oldStreak: p.winStreak,
        newStreak: p.winStreak,
        oldTier: tier.label,
        newTier: tier.label,
        isWin: (params.winnerTeam === 'A' && params.teamAPlayers.some((a) => a.id === p.id)) ||
              (params.winnerTeam === 'B' && params.teamBPlayers.some((b) => b.id === p.id)),
      };
    });
  }

  const results: SettlePlayerResult[] = [];

  // Team A
  for (const player of params.teamAPlayers) {
    const isWin = params.winnerTeam === 'A';
    let delta = isWin ? params.eloDelta : -params.eloDelta;
    let newStreak = isWin ? player.winStreak + 1 : 0;

    // Win streak bonus (+3 if streak >= 3)
    if (isWin && newStreak >= 3) {
      delta += 3;
    }

    const oldElo = player.eloRating;
    const newElo = isWin ? oldElo + delta : Math.max(300, oldElo + delta);
    const oldTier = rankTierFromElo(oldElo).label;
    const newTier = rankTierFromElo(newElo).label;

    results.push({
      playerId: player.id,
      oldElo,
      newElo,
      eloChange: newElo - oldElo,
      oldStreak: player.winStreak,
      newStreak,
      oldTier,
      newTier,
      isWin,
    });
  }

  // Team B
  for (const player of params.teamBPlayers) {
    const isWin = params.winnerTeam === 'B';
    let delta = isWin ? params.eloDelta : -params.eloDelta;
    let newStreak = isWin ? player.winStreak + 1 : 0;

    // Win streak bonus
    if (isWin && newStreak >= 3) {
      delta += 3;
    }

    const oldElo = player.eloRating;
    const newElo = isWin ? oldElo + delta : Math.max(300, oldElo + delta);
    const oldTier = rankTierFromElo(oldElo).label;
    const newTier = rankTierFromElo(newElo).label;

    results.push({
      playerId: player.id,
      oldElo,
      newElo,
      eloChange: newElo - oldElo,
      oldStreak: player.winStreak,
      newStreak,
      oldTier,
      newTier,
      isWin,
    });
  }

  return results;
}

