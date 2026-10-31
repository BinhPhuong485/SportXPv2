import { ClientAchievement } from './profileStats';

export interface EquippedBadgesResult {
  equipped: ClientAchievement[];
  isCustomSelection: boolean;
}

const STORAGE_KEY_PREFIX = 'sportxp_equipped_badges_';

/**
 * Safely loads user's custom badge choice from localStorage.
 * Returns null if no choice has been saved yet or on error.
 */
export function getStoredEquippedBadgeIds(userId: string): string[] | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id) => typeof id === 'string');
  } catch {
    return null;
  }
}

/**
 * Safely saves user's custom badge choice to localStorage (max 3 items).
 */
export function saveStoredEquippedBadgeIds(userId: string, badgeIds: string[]): boolean {
  if (!userId) return false;
  try {
    const sanitized = Array.from(new Set(badgeIds)).slice(0, 3);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure evaluation function resolving equipped badges (up to 3).
 * Rules:
 * - Max 3 badges
 * - If storedBadgeIds is null: auto-equip up to 3 most recently unlocked badges.
 * - If storedBadgeIds is provided: only equip valid unlocked badges from the list (max 3).
 * - Omit unknown IDs or badges that have become locked later.
 * - Return empty array if no badges are unlocked.
 */
export function resolveEquippedBadges(params: {
  achievements: ClientAchievement[];
  storedBadgeIds: string[] | null;
}): EquippedBadgesResult {
  const { achievements, storedBadgeIds } = params;

  // Build map of currently unlocked achievements
  const unlockedMap = new Map<string, ClientAchievement>();
  achievements.forEach((a) => {
    if (a.isUnlocked) {
      unlockedMap.set(a.id, a);
    }
  });

  // User made a custom selection
  if (storedBadgeIds !== null) {
    const validEquipped: ClientAchievement[] = [];
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

  // Default pick: most recently unlocked badges (up to 3)
  const unlockedList = achievements.filter((a) => a.isUnlocked);
  const defaultEquipped = unlockedList.slice(-3).reverse();

  return {
    equipped: defaultEquipped,
    isCustomSelection: false,
  };
}

