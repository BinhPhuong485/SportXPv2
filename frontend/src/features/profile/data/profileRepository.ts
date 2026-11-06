import { supabase } from '../../../core/config/supabase';
import { PlayerProfile, MatchDiaryItem } from '../domain/playerProfile';
import { Court } from '../../rooms/data/managedRoomRepository';

export interface UpdateProfileParams {
  displayName?: string;
  homeCourtId?: string | null;
  zaloPhone?: string | null;
  zaloLink?: string | null;
  facebookLink?: string | null;
  bio?: string | null;
  district?: string | null;
}

export class ProfileRepository {
  async currentProfile(): Promise<PlayerProfile | null> {
    if (!supabase) return null;
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          public_id,
          social_visibility,
          display_name,
          avatar_url,
          elo_rating,
          tier_name,
          trust_score,
          win_streak,
          home_court_id,
          district,
          city,
          zalo_phone,
          zalo_link,
          facebook_link,
          bio,
          created_at,
          onboarding_step,
          courts (
            id,
            name,
            distance_km
          )
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If profile does not exist yet in public.profiles, initialize it via get_onboarding_state
      if (!data) {
        try {
          await supabase.rpc('get_onboarding_state');
          const retry = await supabase
            .from('profiles')
            .select(`
              id,
              public_id,
              social_visibility,
              display_name,
              avatar_url,
              elo_rating,
              tier_name,
              trust_score,
              win_streak,
              home_court_id,
              district,
              city,
              zalo_phone,
              zalo_link,
              facebook_link,
              bio,
              created_at,
              onboarding_step,
              courts (
                id,
                name,
                distance_km
              )
            `)
            .eq('id', user.id)
            .maybeSingle();
          data = retry.data;
        } catch {
          // non-blocking
        }
      }

      if (!data) return null;

      // Sync display_name if DB profile has empty/fallback name but user_metadata has a chosen name
      if (user.user_metadata?.display_name && (!data.display_name || data.display_name === 'Vận động viên')) {
        try {
          await supabase
            .from('profiles')
            .update({ display_name: user.user_metadata.display_name.trim() })
            .eq('id', user.id);
          data.display_name = user.user_metadata.display_name.trim();
        } catch {
          // non-blocking
        }
      }

      const rawCourt = Array.isArray(data.courts) ? data.courts[0] : data.courts;
      const court = rawCourt as unknown as { id: string; name: string; distance_km?: number } | null;

      // Count confirmed matches from session_matches
      let confirmedMatches = 0;
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
            if (players.includes(user.id)) {
              confirmedMatches++;
            }
          }
        }
      } catch {
        // ignore
      }

      return {
        id: data.id,
        publicId: data.public_id,
        socialVisibility: data.social_visibility || 'public',
        displayName: data.display_name || user.user_metadata?.display_name || 'Vận động viên',
        avatarUrl: data.avatar_url,
        eloRating: data.elo_rating,
        tierName: data.tier_name || 'Chưa xếp hạng',
        trustScore: data.trust_score ?? 100,
        winStreak: data.win_streak ?? 0,
        homeCourtId: data.home_court_id,
        homeCourtName: court?.name || null,
        district: data.district || null,
        city: data.city || 'TP. Hồ Chí Minh',
        zaloPhone: data.zalo_phone || null,
        zaloLink: data.zalo_link || null,
        facebookLink: data.facebook_link || null,
        bio: data.bio || null,
        createdAt: data.created_at,
        onboardingStep: data.onboarding_step ?? 0,
        isIdentityVerified: false,
        confirmedMatchesCount: confirmedMatches,
        rankDelta: 0,
      };
    } catch {
      // Fallback query if relation or specific columns differ
      let { data: fbData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, elo_rating, tier_name, trust_score, win_streak, home_court_id, district, city, zalo_phone, zalo_link, facebook_link, bio, created_at, onboarding_step')
        .eq('id', user.id)
        .maybeSingle();

      if (!fbData) {
        try {
          await supabase.rpc('get_onboarding_state');
          const retry = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, elo_rating, tier_name, trust_score, win_streak, home_court_id, district, city, zalo_phone, zalo_link, facebook_link, bio, created_at, onboarding_step')
            .eq('id', user.id)
            .maybeSingle();
          fbData = retry.data;
        } catch {
          // non-blocking
        }
      }

      if (!fbData) return null;

      if (user.user_metadata?.display_name && (!fbData.display_name || fbData.display_name === 'Vận động viên')) {
        try {
          await supabase
            .from('profiles')
            .update({ display_name: user.user_metadata.display_name.trim() })
            .eq('id', user.id);
          fbData.display_name = user.user_metadata.display_name.trim();
        } catch {
          // non-blocking
        }
      }

      let fallbackCourtName: string | null = null;
      if (fbData.home_court_id) {
        try {
          const { data: courtRow } = await supabase
            .from('courts')
            .select('name')
            .eq('id', fbData.home_court_id)
            .maybeSingle();
          if (courtRow?.name) {
            fallbackCourtName = courtRow.name;
          }
        } catch {
          // ignore court fetch failure in fallback
        }
      }

      return {
        id: fbData.id,
        displayName: fbData.display_name || user.user_metadata?.display_name || 'Vận động viên',
        avatarUrl: fbData.avatar_url,
        eloRating: fbData.elo_rating,
        tierName: fbData.tier_name || 'Chưa xếp hạng',
        trustScore: fbData.trust_score ?? 100,
        winStreak: fbData.win_streak ?? 0,
        homeCourtId: fbData.home_court_id,
        homeCourtName: fallbackCourtName,
        district: fbData.district || null,
        city: fbData.city || 'TP. Hồ Chí Minh',
        zaloPhone: fbData.zalo_phone || null,
        zaloLink: fbData.zalo_link || null,
        facebookLink: fbData.facebook_link || null,
        bio: fbData.bio || null,
        createdAt: fbData.created_at,
        onboardingStep: fbData.onboarding_step ?? 0,
        isIdentityVerified: false,
        confirmedMatchesCount: 0,
        rankDelta: 0,
        socialVisibility: 'public',
      };
    }
  }

  async updateProfile(params: UpdateProfileParams): Promise<void> {
    if (!supabase) throw new Error('Chưa kết nối Supabase.');
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error('Vui lòng đăng nhập.');

    const updates: Record<string, unknown> = {};
    if (params.displayName != null && params.displayName.trim().length > 0) {
      updates.display_name = params.displayName.trim();
    }
    if (params.homeCourtId !== undefined) {
      updates.home_court_id = params.homeCourtId && params.homeCourtId.trim().length > 0 ? params.homeCourtId : null;
    }
    if (params.zaloPhone !== undefined) {
      updates.zalo_phone = params.zaloPhone && params.zaloPhone.trim().length > 0 ? params.zaloPhone.trim() : null;
    }
    if (params.zaloLink !== undefined) {
      updates.zalo_link = params.zaloLink && params.zaloLink.trim().length > 0 ? params.zaloLink.trim() : null;
    }
    if (params.facebookLink !== undefined) {
      updates.facebook_link = params.facebookLink && params.facebookLink.trim().length > 0 ? params.facebookLink.trim() : null;
    }
    if (params.bio !== undefined) {
      updates.bio = params.bio && params.bio.trim().length > 0 ? params.bio.trim() : null;
    }
    if (params.district !== undefined) {
      updates.district = params.district && params.district.trim().length > 0 ? params.district.trim() : null;
    }

    if (Object.keys(updates).length === 0) return;

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) {
      console.error('Update profile error:', error);
      throw new Error('Không thể lưu thay đổi hồ sơ. Vui lòng thử lại.');
    }
  }

  async loadCourts(): Promise<Court[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, distance_km')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Court[];
    } catch {
      return [];
    }
  }

  async playerRecentMatches(playerName: string): Promise<MatchDiaryItem[]> {
    if (!supabase || !playerName) return [];
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('id, court_name, team_a_names, team_b_names, score_text, winner_team, elo_change, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !Array.isArray(data)) return [];

      const queryLower = playerName.toLowerCase();
      const filtered = data
        .filter((row) => {
          const teamA = String(row.team_a_names || '').toLowerCase();
          const teamB = String(row.team_b_names || '').toLowerCase();
          return teamA.includes(queryLower) || teamB.includes(queryLower);
        })
        .slice(0, 5)
        .map((row) => ({
          id: row.id,
          courtName: row.court_name || 'Sân thi đấu',
          teamA: row.team_a_names || '',
          teamB: row.team_b_names || '',
          score: row.score_text || '',
          isWin: row.winner_team === 'A',
          eloChange: row.elo_change != null ? Number(row.elo_change) : null,
          createdAt: row.created_at,
        }));

      return filtered;
    } catch {
      return [];
    }
  }
}

export const profileRepository = new ProfileRepository();
