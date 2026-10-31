/**
 * Unit tests for profile stat computation functions using Node assert.
 * Covers: streaks (current and best), win rate, favorite court, empty input,
 * one match, ties in favorite court, matches this month, and Elo history generation.
 */
const assert = require('assert');

// Pure stat functions mirroring src/features/profile/domain/profileStats.ts
function computeWinRate(matches) {
  if (!matches || matches.length === 0) return 0;
  const wins = matches.filter((m) => m.isWin).length;
  return Math.round((wins / matches.length) * 1000) / 10;
}

function computeStreaks(matches) {
  if (!matches || matches.length === 0) return { currentStreak: 0, bestStreak: 0 };
  let currentStreak = 0;
  for (const m of matches) {
    if (m.isWin) currentStreak++;
    else break;
  }
  const chrono = [...matches].reverse();
  let bestStreak = 0;
  let tempStreak = 0;
  for (const m of chrono) {
    if (m.isWin) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }
  return { currentStreak, bestStreak };
}

function computeFavoriteCourt(matches) {
  if (!matches || matches.length === 0) return 'Chưa có';
  const counts = {};
  matches.forEach((m, index) => {
    const court = m.courtName || 'Sân thi đấu';
    if (!counts[court]) counts[court] = { count: 0, mostRecentIndex: index };
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

function computeAvgEloChange(matches) {
  if (!matches || matches.length === 0) return 0;
  const withDelta = matches.filter((m) => m.eloChange != null);
  if (withDelta.length === 0) return 0;
  const sum = withDelta.reduce((acc, m) => acc + (m.eloChange || 0), 0);
  return Math.round((sum / withDelta.length) * 10) / 10;
}

function computeMatchesThisMonth(matches, referenceDate = new Date()) {
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
    if (mYear === currentYear && mMonth === currentMonth) count++;
  }
  return count;
}

function computeEloHistoryPoints(matches, currentElo) {
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
  let runningElo = currentElo;
  const pointsReversed = [];
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
    runningElo -= delta;
  }
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
  return pointsReversed.reverse();
}

// ==================== TEST SUITE ====================
console.log('--- STARTING PROFILE STATS UNIT TESTS ---');

// 1. Empty Input Test
{
  console.log('[Test 1] Empty Input Handling');
  const emptyMatches = [];
  assert.strictEqual(computeWinRate(emptyMatches), 0, 'Win rate for empty matches must be 0');
  const streaks = computeStreaks(emptyMatches);
  assert.strictEqual(streaks.currentStreak, 0);
  assert.strictEqual(streaks.bestStreak, 0);
  assert.strictEqual(computeFavoriteCourt(emptyMatches), 'Chưa có', 'Favorite court must return fallback');
  assert.strictEqual(computeAvgEloChange(emptyMatches), 0);
  assert.strictEqual(computeMatchesThisMonth(emptyMatches), 0);
  const eloPoints = computeEloHistoryPoints(emptyMatches, 700);
  assert.strictEqual(eloPoints.length, 1, 'Should return fallback single point');
  assert.strictEqual(eloPoints[0].elo, 700);
  console.log('  ✓ PASS: Empty matches safely handled with proper fallbacks.');
}

// 2. One Match Test (Single win vs Single loss)
{
  console.log('[Test 2] Single Match Edge Cases');
  const singleWin = [
    {
      id: 'm-1',
      courtName: 'Sân Cầu Lông Bình Triệu',
      isWin: true,
      eloChange: 18,
      createdAt: '2026-10-31T08:00:00.000Z',
    },
  ];

  assert.strictEqual(computeWinRate(singleWin), 100, 'Single win must be 100%');
  const streaksWin = computeStreaks(singleWin);
  assert.strictEqual(streaksWin.currentStreak, 1);
  assert.strictEqual(streaksWin.bestStreak, 1);
  assert.strictEqual(computeFavoriteCourt(singleWin), 'Sân Cầu Lông Bình Triệu');
  assert.strictEqual(computeAvgEloChange(singleWin), 18);

  const singleLoss = [
    {
      id: 'm-2',
      courtName: 'Sân Kỳ Hòa',
      isWin: false,
      eloChange: -12,
      createdAt: '2026-10-31T08:00:00.000Z',
    },
  ];
  assert.strictEqual(computeWinRate(singleLoss), 0, 'Single loss must be 0%');
  const streaksLoss = computeStreaks(singleLoss);
  assert.strictEqual(streaksLoss.currentStreak, 0);
  assert.strictEqual(streaksLoss.bestStreak, 0);
  assert.strictEqual(computeFavoriteCourt(singleLoss), 'Sân Kỳ Hòa');
  assert.strictEqual(computeAvgEloChange(singleLoss), -12);
  console.log('  ✓ PASS: Single win and single loss edge cases compute accurately.');
}

// 3. Streaks Calculation (Newest first)
{
  console.log('[Test 3] Streak Calculations (Current vs Historical Best)');
  // Match order (newest to oldest):
  // m1: Win (newest)
  // m2: Win
  // m3: Loss
  // m4: Win
  // m5: Win
  // m6: Win
  // m7: Win
  // m8: Loss (oldest)
  // Current streak = 2 (m1, m2)
  // Chronological best streak = 4 (m4, m5, m6, m7)
  const matches = [
    { id: '1', isWin: true, courtName: 'A', createdAt: '2026-10-31T10:00:00Z' },
    { id: '2', isWin: true, courtName: 'A', createdAt: '2026-10-30T10:00:00Z' },
    { id: '3', isWin: false, courtName: 'A', createdAt: '2026-10-29T10:00:00Z' },
    { id: '4', isWin: true, courtName: 'A', createdAt: '2026-10-28T10:00:00Z' },
    { id: '5', isWin: true, courtName: 'A', createdAt: '2026-10-27T10:00:00Z' },
    { id: '6', isWin: true, courtName: 'A', createdAt: '2026-10-26T10:00:00Z' },
    { id: '7', isWin: true, courtName: 'A', createdAt: '2026-10-25T10:00:00Z' },
    { id: '8', isWin: false, courtName: 'A', createdAt: '2026-10-24T10:00:00Z' },
  ];

  const { currentStreak, bestStreak } = computeStreaks(matches);
  assert.strictEqual(currentStreak, 2, 'Current streak should be 2');
  assert.strictEqual(bestStreak, 4, 'Best historical streak should be 4');
  console.log('  ✓ PASS: Current streak (2) and historical best streak (4) correctly evaluated.');
}

// 4. Win Rate with Mixed Records
{
  console.log('[Test 4] Win Rate with Mixed Records');
  // 7 wins out of 10 matches = 70.0%
  const tenMatches = [
    { isWin: true },
    { isWin: true },
    { isWin: false },
    { isWin: true },
    { isWin: true },
    { isWin: false },
    { isWin: true },
    { isWin: true },
    { isWin: false },
    { isWin: true },
  ];
  assert.strictEqual(computeWinRate(tenMatches), 70.0);

  // 1 win out of 3 matches = 33.3%
  const threeMatches = [{ isWin: true }, { isWin: false }, { isWin: false }];
  assert.strictEqual(computeWinRate(threeMatches), 33.3);
  console.log('  ✓ PASS: Win rate rounded cleanly to 1 decimal place.');
}

// 5. Favorite Court Ties Resolution
{
  console.log('[Test 5] Favorite Court and Tie-Breaking by Recency');
  // 3 matches at Court A, 3 matches at Court B
  // Court B match is at index 0 (more recent), Court A match is at index 1
  const tiedMatches = [
    { id: '1', courtName: 'Sân Hồ Sen', createdAt: '2026-10-31T10:00:00Z' }, // index 0 (B)
    { id: '2', courtName: 'Sân Bình Triệu', createdAt: '2026-10-30T10:00:00Z' }, // index 1 (A)
    { id: '3', courtName: 'Sân Hồ Sen', createdAt: '2026-10-29T10:00:00Z' }, // index 2 (B)
    { id: '4', courtName: 'Sân Bình Triệu', createdAt: '2026-10-28T10:00:00Z' }, // index 3 (A)
    { id: '5', courtName: 'Sân Hồ Sen', createdAt: '2026-10-27T10:00:00Z' }, // index 4 (B)
    { id: '6', courtName: 'Sân Bình Triệu', createdAt: '2026-10-26T10:00:00Z' }, // index 5 (A)
  ];

  const favorite = computeFavoriteCourt(tiedMatches);
  assert.strictEqual(favorite, 'Sân Hồ Sen', 'Tie must be broken in favor of more recent court');

  // When clear majority
  const clearMatches = [
    ...tiedMatches,
    { id: '7', courtName: 'Sân Bình Triệu', createdAt: '2026-10-25T10:00:00Z' },
  ];
  assert.strictEqual(computeFavoriteCourt(clearMatches), 'Sân Bình Triệu', 'Clear majority wins');
  console.log('  ✓ PASS: Favorite court resolves ties by recency and detects majorities.');
}

// 6. Matches This Month (Asia/Ho_Chi_Minh Timezone)
{
  console.log('[Test 6] Matches This Month (Timezone Aware)');
  // Reference date: 2026-10-31 15:00 UTC (22:00 UTC+7) -> October 2026
  const refDate = new Date('2026-10-31T15:00:00.000Z');

  const matches = [
    { id: '1', createdAt: '2026-10-31T05:00:00.000Z' }, // Oct 2026
    { id: '2', createdAt: '2026-10-15T10:00:00.000Z' }, // Oct 2026
    { id: '3', createdAt: '2026-10-01T01:00:00.000Z' }, // Oct 2026
    { id: '4', createdAt: '2026-09-30T10:00:00.000Z' }, // Sep 2026
    { id: '5', createdAt: '2026-08-20T10:00:00.000Z' }, // Aug 2026
  ];

  const thisMonthCount = computeMatchesThisMonth(matches, refDate);
  assert.strictEqual(thisMonthCount, 3, 'Should count 3 matches in October 2026');
  console.log('  ✓ PASS: Current month filtering accurately isolates October matches.');
}

// 7. Elo History Points Reversal and Delta Accumulation
{
  console.log('[Test 7] Elo History Line Points Trajectory');
  // Current Elo: 760
  // Match 1 (newest): Win +15 -> Elo prior: 745
  // Match 2: Win +20 -> Elo prior: 725
  // Match 3: Loss -10 -> Elo prior: 735
  const matches = [
    { id: 'm1', isWin: true, eloChange: 15, courtName: 'Sân A', createdAt: '2026-10-31T10:00:00Z' },
    { id: 'm2', isWin: true, eloChange: 20, courtName: 'Sân A', createdAt: '2026-10-30T10:00:00Z' },
    { id: 'm3', isWin: false, eloChange: -10, courtName: 'Sân B', createdAt: '2026-10-29T10:00:00Z' },
  ];

  const points = computeEloHistoryPoints(matches, 760);
  assert.strictEqual(points.length, 4, 'Should contain 3 match points + 1 initial baseline');
  // Chronological order:
  // points[0]: Baseline = 735
  // points[1]: After m3 (-10) = 725
  // points[2]: After m2 (+20) = 745
  // points[3]: After m1 (+15) = 760 (Current Elo)
  assert.strictEqual(points[0].elo, 735, 'Initial baseline Elo');
  assert.strictEqual(points[1].elo, 725, 'After match 3');
  assert.strictEqual(points[2].elo, 745, 'After match 2');
  assert.strictEqual(points[3].elo, 760, 'Latest match matches current Elo');
  console.log('  ✓ PASS: Elo historical points reconstruct cumulative trajectory from deltas.');
}

console.log('--- ALL 7 PROFILE STATS UNIT TESTS PASSED SUCCESSFULLY ---');
