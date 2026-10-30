import { supabase } from '../../../core/config/supabase';
import { Court, PlayerProfile } from '../../../core/types/database.types';
import { RankTierInfo, rankTierFromElo } from '../domain/rankTier';

export interface PlayerCourtRank {
  rank: number;
  totalPlayers: number;
  courtName: string;
  courtId: string;
  pointsToNextRank?: number | null;
  nextPlayerName?: string | null;
  isPodium: boolean;
  tier?: RankTierInfo | null;
  elo?: number | null;
  rankDelta: number;
}

export function getPlayerInitials(displayName: string): string {
  if (!displayName || !displayName.trim()) return 'V';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return displayName.substring(0, Math.min(2, displayName.length)).toUpperCase();
}

const LEADERBOARD_COLUMNS =
  'id, display_name, avatar_url, elo_rating, tier_name, trust_score, win_streak, home_court_id, courts(id, name, distance_km)';

export class SupabaseLeaderboardRepository {
  async getCourts(): Promise<Court[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, distance_km')
        .order('name', { ascending: true });
      if (error || !data) return [];
      
      const courtItems: Court[] = [
        {
          id: 'all',
          name: 'Tất cả cụm sân (Toàn thành phố)',
          distance_km: undefined,
          distanceKm: undefined,
        },
        ...data.map((r: any) => ({
          id: r.id,
          name: r.name,
          distance_km: r.distance_km,
          distanceKm: r.distance_km,
        })),
      ];
      return courtItems;
    } catch {
      return [];
    }
  }

  async getCourtLeaderboard(courtId: string = 'all', limit?: number): Promise<PlayerProfile[]> {
    if (!supabase) return [];
    try {
      let query = supabase
        .from('profiles')
        .select(LEADERBOARD_COLUMNS)
        .not('elo_rating', 'is', null)
        .eq('onboarding_step', 5)
        .order('elo_rating', { ascending: false })
        .order('id', { ascending: true });

      if (courtId && courtId !== 'all') {
        query = query.eq('home_court_id', courtId);
      }

      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((row: any) => {
        const courtInfo = row.courts as { id: string; name: string; distance_km?: number } | null;
        return {
          id: row.id,
          displayName: row.display_name || 'Vận động viên',
          avatarUrl: row.avatar_url,
          eloRating: row.elo_rating,
          tierName: row.tier_name || 'Nhập môn',
          trustScore: row.trust_score ?? 100,
          winStreak: row.win_streak ?? 0,
          homeCourtId: row.home_court_id,
          homeCourtName: courtInfo?.name || null,
          onboardingStep: 5,
          socialVisibility: 'PUBLIC',
          isIdentityVerified: false,
          confirmedMatchesCount: 0,
          rankDelta: 0,
        };
      });
    } catch {
      return [];
    }
  }

  async getNearbyPlayers(courtId: string = 'all', playerId: string, radius = 5): Promise<PlayerProfile[]> {
    const all = await this.getCourtLeaderboard(courtId);
    const index = all.findIndex((p) => p.id === playerId);
    if (index === -1) {
      return all.slice(0, radius * 2 + 1);
    }
    const start = Math.max(0, index - radius);
    const end = Math.min(all.length, index + radius + 1);
    return all.slice(start, end);
  }

  async getPlayerCourtRank(playerId: string, courtId: string = 'all'): Promise<PlayerCourtRank | null> {
    try {
      const list = await this.getCourtLeaderboard(courtId);
      const index = list.findIndex((p) => p.id === playerId);
      if (index === -1) return null;

      const player = list[index];
      const rank = index + 1;
      const total = list.length;

      let pointsToNext: number | null = null;
      let nextPlayerName: string | null = null;
      if (index > 0) {
        const above = list[index - 1];
        pointsToNext = Math.abs((above.eloRating || 0) - (player.eloRating || 0)) + 1;
        nextPlayerName = above.displayName;
      }

      const courts = await this.getCourts();
      const courtName = courtId === 'all'
        ? 'Toàn hệ thống'
        : (courts.find((c) => c.id === courtId)?.name || 'Sân thi đấu');

      return {
        rank,
        totalPlayers: total,
        courtName,
        courtId,
        pointsToNextRank: pointsToNext,
        nextPlayerName,
        isPodium: rank <= 3,
        tier: player.eloRating ? rankTierFromElo(player.eloRating) : null,
        elo: player.eloRating,
        rankDelta: player.rankDelta,
      };
    } catch {
      return null;
    }
  }
}

export const leaderboardRepository = new SupabaseLeaderboardRepository();
