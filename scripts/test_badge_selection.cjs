const assert = require('assert');

// Mock ClientAchievement items
function createMockAchievements() {
  return [
    {
      id: 'first_match',
      title: 'Bước Đầu Tiến Bộ',
      iconName: 'zap',
      isUnlocked: true,
      unlockHint: 'Tham gia 1 trận',
      progressText: '1/1 trận',
    },
    {
      id: 'five_matches',
      title: 'Chiến Binh Sân Cầu',
      iconName: 'shield',
      isUnlocked: true,
      unlockHint: '5 trận phân hạng',
      progressText: '5/5 trận',
    },
    {
      id: 'ten_matches',
      title: 'Bền Bỉ Đam Mê',
      iconName: 'flame',
      isUnlocked: true,
      unlockHint: '10 trận',
      progressText: '10/10 trận',
    },
    {
      id: 'win_streak_3',
      title: 'Tay Vợt Thăng Hoa',
      iconName: 'sparkles',
      isUnlocked: true,
      unlockHint: '3 trận thắng',
      progressText: '3/3 trận',
    },
    {
      id: 'tier_intermediate',
      title: 'Bứt Phá Trung Bình',
      iconName: 'award',
      isUnlocked: false, // Locked
      unlockHint: 'Đạt Elo 600',
      progressText: '550/600 Elo',
    },
    {
      id: 'host_first_room',
      title: 'Chủ Sân Thân Thiện',
      iconName: 'crown',
      isUnlocked: false, // Locked
      unlockHint: 'Tạo 1 kèo',
      progressText: '0/1 kèo',
    },
    {
      id: 'join_tournament',
      title: 'Đấu Trường Đỉnh Cao',
      iconName: 'trophy',
      isUnlocked: false, // Locked
      unlockHint: 'Đăng ký 1 giải',
      progressText: '0/1 giải',
    },
  ];
}

// Pure resolveEquippedBadges function implementation for Node test
function resolveEquippedBadges({ achievements, storedBadgeIds }) {
  const unlockedMap = new Map();
  achievements.forEach((a) => {
    if (a.isUnlocked) unlockedMap.set(a.id, a);
  });

  if (storedBadgeIds !== null) {
    const validEquipped = [];
    for (const id of storedBadgeIds) {
      const achievement = unlockedMap.get(id);
      if (achievement && !validEquipped.some((b) => b.id === achievement.id)) {
        validEquipped.push(achievement);
        if (validEquipped.length >= 3) break;
      }
    }
    return {
      equipped: validEquipped,
      isCustomSelection: true,
    };
  }

  const unlockedList = achievements.filter((a) => a.isUnlocked);
  const defaultEquipped = unlockedList.slice(-3).reverse();

  return {
    equipped: defaultEquipped,
    isCustomSelection: false,
  };
}

// Mock localStorage parser
function parseStoredBadges(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id) => typeof id === 'string');
  } catch {
    return null;
  }
}

console.log('--- STARTING BADGE SELECTION UNIT TESTS ---');

// Test 1: Default pick when stored preference is missing (null)
{
  console.log('[Test 1] Default pick when stored preference is missing (null)');
  const achievements = createMockAchievements();
  // Unlocked items: first_match, five_matches, ten_matches, win_streak_3
  // Last 3 unlocked: five_matches, ten_matches, win_streak_3 -> reverse: win_streak_3, ten_matches, five_matches
  const result = resolveEquippedBadges({ achievements, storedBadgeIds: null });

  assert.strictEqual(result.isCustomSelection, false);
  assert.strictEqual(result.equipped.length, 3);
  assert.strictEqual(result.equipped[0].id, 'win_streak_3');
  assert.strictEqual(result.equipped[1].id, 'ten_matches');
  assert.strictEqual(result.equipped[2].id, 'five_matches');
  console.log('  ✓ PASS: Auto-equipped up to 3 most recently unlocked badges.');
}

// Test 2: Maximum of 3 badges enforced
{
  console.log('[Test 2] Maximum of 3 badges enforced even if user selected more');
  const achievements = createMockAchievements();
  const stored = ['first_match', 'five_matches', 'ten_matches', 'win_streak_3'];
  const result = resolveEquippedBadges({ achievements, storedBadgeIds: stored });

  assert.strictEqual(result.isCustomSelection, true);
  assert.strictEqual(result.equipped.length, 3);
  assert.deepStrictEqual(result.equipped.map((b) => b.id), ['first_match', 'five_matches', 'ten_matches']);
  console.log('  ✓ PASS: Selection strictly clamped to a maximum of 3 badges.');
}

// Test 3: Ignoring locked or unknown badge IDs
{
  console.log('[Test 3] Ignoring locked or unknown badge IDs');
  const achievements = createMockAchievements();
  // 'unknown_badge_xyz' doesn't exist, 'tier_intermediate' is locked
  const stored = ['unknown_badge_xyz', 'tier_intermediate', 'first_match', 'win_streak_3'];
  const result = resolveEquippedBadges({ achievements, storedBadgeIds: stored });

  assert.strictEqual(result.equipped.length, 2);
  assert.deepStrictEqual(result.equipped.map((b) => b.id), ['first_match', 'win_streak_3']);
  console.log('  ✓ PASS: Unknown IDs and locked badges are safely ignored.');
}

// Test 4: Corrupted or missing storage fallback
{
  console.log('[Test 4] Corrupted or missing storage safely recovers to default pick');
  const invalidJson = '{ bad json !!!';
  const nonArrayJson = JSON.stringify({ id: 'first_match' });
  const emptyStorage = null;

  assert.strictEqual(parseStoredBadges(invalidJson), null);
  assert.strictEqual(parseStoredBadges(nonArrayJson), null);
  assert.strictEqual(parseStoredBadges(emptyStorage), null);

  const achievements = createMockAchievements();
  const recovered = resolveEquippedBadges({
    achievements,
    storedBadgeIds: parseStoredBadges(invalidJson),
  });

  assert.strictEqual(recovered.isCustomSelection, false);
  assert.strictEqual(recovered.equipped.length, 3);
  console.log('  ✓ PASS: Corrupted or missing localStorage gracefully falls back to default pick.');
}

// Test 5: Badge that becomes locked later
{
  console.log('[Test 5] Badge that becomes locked later is immediately omitted');
  const achievements = createMockAchievements();
  // User had previously equipped win_streak_3, five_matches, first_match
  const stored = ['win_streak_3', 'five_matches', 'first_match'];

  // Now suppose win_streak_3 is lost / reset to locked
  const modifiedAchievements = achievements.map((a) =>
    a.id === 'win_streak_3' ? { ...a, isUnlocked: false } : a
  );

  const result = resolveEquippedBadges({
    achievements: modifiedAchievements,
    storedBadgeIds: stored,
  });

  assert.strictEqual(result.equipped.length, 2);
  assert.deepStrictEqual(result.equipped.map((b) => b.id), ['five_matches', 'first_match']);
  console.log('  ✓ PASS: Badges that became locked later are cleanly excluded.');
}

// Test 6: Zero unlocked badges edge case
{
  console.log('[Test 6] Zero unlocked badges returns empty equipped array');
  const allLocked = createMockAchievements().map((a) => ({ ...a, isUnlocked: false }));
  const result = resolveEquippedBadges({ achievements: allLocked, storedBadgeIds: null });

  assert.strictEqual(result.equipped.length, 0);
  console.log('  ✓ PASS: Returns empty array when player has unlocked 0 badges.');
}

console.log('--- ALL 6 BADGE SELECTION UNIT TESTS PASSED SUCCESSFULLY ---');
