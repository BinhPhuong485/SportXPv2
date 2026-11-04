import { supabase } from '../../../core/config/supabase';
import { Court, PlayerProfile } from '../../../core/types/database.types';
import { RankTierInfo, rankTierFromElo } from '../domain/rankTier';

export type LeaderboardScope = 'court' | 'district' | 'national';

export interface LeaderboardFilter {
  scope: LeaderboardScope;
  courtId?: string;
  district?: string;
  limit?: number;
}

export interface PlayerCourtRank {
  rank: number;
  totalPlayers: number;
  courtName: string;
  courtId?: string;
  pointsToNextRank?: number | null;
  nextPlayerName?: string | null;
  isPodium: boolean;
  tier?: RankTierInfo | null;
  elo?: number | null;
  rankDelta: number;
  confirmedMatchesCount?: number;
  isProvisional?: boolean;
  matchesNeeded?: number;
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
  'id, public_id, display_name, avatar_url, elo_rating, tier_name, trust_score, win_streak, home_court_id, district, city, zalo_phone, zalo_link, facebook_link, bio, courts(id, name, distance_km, district, city)';

export class SupabaseLeaderboardRepository {
  async getCourts(): Promise<Court[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, address, district, city, distance_km, rating, review_count')
        .order('name', { ascending: true });
      if (error || !data) return [];
      return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        district: r.district,
        city: r.city,
        distance_km: r.distance_km,
        distanceKm: r.distance_km,
        rating: r.rating,
        reviewCount: r.review_count,
      }));
    } catch {
      return [];
    }
  }

  async getDistricts(): Promise<string[]> {
    const fallbackDistricts = ['Quận 1', 'Quận 10', 'Tân Bình', 'Bình Thạnh', 'Gò Vấp', 'TP. Thủ Đức', 'Quận 7'];
    if (!supabase) return fallbackDistricts;
    try {
      const courts = await this.getCourts();
      const set = new Set<string>();
      for (const c of courts) {
        if (c.district && c.district.trim()) {
          set.add(c.district.trim());
        }
      }
      return set.size > 0 ? Array.from(set).sort() : fallbackDistricts;
    } catch {
      return fallbackDistricts;
    }
  }

  async getLeaderboard(filter: LeaderboardFilter): Promise<PlayerProfile[]> {
    if (!supabase) return [];
    try {
      let query = supabase
        .from('profiles')
        .select(LEADERBOARD_COLUMNS)
        .not('elo_rating', 'is', null)
        .eq('onboarding_step', 5)
        .order('elo_rating', { ascending: false })
        .order('id', { ascending: true });

      if (filter.scope === 'court' && filter.courtId) {
        query = query.eq('home_court_id', filter.courtId);
      } else if (filter.scope === 'district' && filter.district) {
        query = query.eq('district', filter.district);
      }

      if (filter.limit && filter.limit > 0) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      // Query session_matches to count confirmed matches per player
      const matchCounts = new Map<string, number>();
      try {
        const { data: matches } = await supabase
          .from('session_matches')
          .select('team_a_player_ids, team_b_player_ids')
          .eq('status', 'confirmed');

        if (matches) {
          for (const m of matches) {
            const players = [
              ...(Array.isArray(m.team_a_player_ids) ? m.team_a_player_ids : []),
              ...(Array.isArray(m.team_b_player_ids) ? m.team_b_player_ids : []),
            ];
            for (const pid of players) {
              matchCounts.set(pid, (matchCounts.get(pid) || 0) + 1);
            }
          }
        }
      } catch (err) {
        console.warn('Could not count session_matches for leaderboard:', err);
      }

      return data.map((row: any) => {
        const courtInfo = row.courts as {
          id: string;
          name: string;
          distance_km?: number;
          district?: string;
          city?: string;
        } | null;
        const confirmedMatches = matchCounts.get(row.id) || 0;

        return {
          id: row.id,
          publicId: row.public_id,
          displayName: row.display_name || 'Vận động viên',
          avatarUrl: row.avatar_url,
          eloRating: row.elo_rating,
          tierName: row.tier_name || 'Nhập môn',
          trustScore: row.trust_score ?? 100,
          winStreak: row.win_streak ?? 0,
          homeCourtId: row.home_court_id,
          homeCourtName: courtInfo?.name || null,
          district: row.district || courtInfo?.district || null,
          city: row.city || courtInfo?.city || 'TP. Hồ Chí Minh',
          zaloPhone: row.zalo_phone || null,
          zaloLink: row.zalo_link || null,
          facebookLink: row.facebook_link || null,
          bio: row.bio || null,
          onboardingStep: 5,
          socialVisibility: 'PUBLIC',
          isIdentityVerified: false,
          confirmedMatchesCount: confirmedMatches,
          rankDelta: 0,
        };
      });
    } catch {
      return [];
    }
  }

  async getCourtLeaderboard(courtId: string, limit?: number): Promise<PlayerProfile[]> {
    return this.getLeaderboard({ scope: 'court', courtId, limit });
  }

  getPlayerRank(
    playerId: string,
    list: PlayerProfile[],
    scopeTitle: string,
    courtId?: string
  ): PlayerCourtRank | null {
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

    const matchesCount = player.confirmedMatchesCount;
    const isProvisional = matchesCount < 5;

    return {
      rank,
      totalPlayers: total,
      courtName: scopeTitle,
      courtId: courtId || '',
      pointsToNextRank: pointsToNext,
      nextPlayerName,
      isPodium: rank <= 3,
      tier: player.eloRating ? rankTierFromElo(player.eloRating) : null,
      elo: player.eloRating,
      rankDelta: player.rankDelta,
      confirmedMatchesCount: matchesCount,
      isProvisional,
      matchesNeeded: Math.max(0, 5 - matchesCount),
    };
  }

  async getPlayerCourtRank(playerId: string, courtId: string): Promise<PlayerCourtRank | null> {
    try {
      const list = await this.getCourtLeaderboard(courtId);
      const courts = await this.getCourts();
      const courtName = courts.find((c) => c.id === courtId)?.name || 'Sân thi đấu';
      return this.getPlayerRank(playerId, list, courtName, courtId);
    } catch {
      return null;
    }
  }

  async getNearbyPlayers(courtId: string, playerId: string, radius = 5): Promise<PlayerProfile[]> {
    const all = await this.getCourtLeaderboard(courtId);
    const index = all.findIndex((p) => p.id === playerId);
    if (index === -1) {
      return all.slice(0, radius * 2 + 1);
    }
    const start = Math.max(0, index - radius);
    const end = Math.min(all.length, index + radius + 1);
    return all.slice(start, end);
  }
}

export const leaderboardRepository = new SupabaseLeaderboardRepository();
