import { supabase } from '../core/config/supabase';
import { calculateElo, settlePlayers, EloPlayerProfile, SettlePlayerResult } from './eloEngine';

export interface SetScore {
  set: number;
  a: number;
  b: number;
}

export interface SessionMatch {
  id: string;
  roomId: string;
  matchType: 'singles' | 'doubles';
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
  scores: SetScore[];
  scoreText: string;
  winnerTeam: 'A' | 'B';
  status: 'pending' | 'confirmed' | 'disputed' | 'void';
  confirmations: string[];
  kFactor: number;
  eloDelta: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  teamANames?: string[];
  teamBNames?: string[];
  canConfirm?: boolean;
  canDispute?: boolean;
  hasConfirmed?: boolean;
  isParticipant?: boolean;
}

export class SessionMatchService {
  /**
   * List all matches for a specific room session.
   */
  async listMatches(roomId: string, viewerId?: string | null): Promise<SessionMatch[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('session_matches')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      // Collect all unique player IDs to enrich names
      const allPlayerIds = new Set<string>();
      for (const row of data) {
        if (Array.isArray(row.team_a_player_ids)) {
          row.team_a_player_ids.forEach((id: string) => allPlayerIds.add(id));
        }
        if (Array.isArray(row.team_b_player_ids)) {
          row.team_b_player_ids.forEach((id: string) => allPlayerIds.add(id));
        }
      }

      // Fetch player display names
      const nameMap = new Map<string, string>();
      if (allPlayerIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', Array.from(allPlayerIds));

        if (profiles) {
          for (const p of profiles) {
            nameMap.set(p.id, p.display_name || 'VĐV');
          }
        }
      }

      return data.map((row: any) => {
        const teamA: string[] = Array.isArray(row.team_a_player_ids) ? row.team_a_player_ids : [];
        const teamB: string[] = Array.isArray(row.team_b_player_ids) ? row.team_b_player_ids : [];
        const rawScores = Array.isArray(row.scores) ? row.scores : [];
        const scores: SetScore[] = rawScores.map((s: any, idx: number) => ({
          set: typeof s.set === 'number' ? s.set : idx + 1,
          a: Number(s.a ?? 0),
          b: Number(s.b ?? 0),
        }));

        const scoreText =
          scores.length > 0
            ? scores.map((s) => `${s.a}-${s.b}`).join(', ')
            : '21-19';

        const confirmations: string[] = Array.isArray(row.confirmations) ? row.confirmations : [];
        const status = (row.status || 'pending').toLowerCase() as SessionMatch['status'];

        const isParticipant =
          Boolean(viewerId) && (teamA.includes(viewerId!) || teamB.includes(viewerId!));
        const hasConfirmed = Boolean(viewerId) && confirmations.includes(viewerId!);
        const canConfirm =
          Boolean(viewerId) && isParticipant && !hasConfirmed && status === 'pending';
        const canDispute =
          Boolean(viewerId) && isParticipant && status === 'pending';

        return {
          id: row.id,
          roomId: row.room_id,
          matchType: row.match_type === 'singles' ? 'singles' : 'doubles',
          teamAPlayerIds: teamA,
          teamBPlayerIds: teamB,
          scores,
          scoreText,
          winnerTeam: row.winner_team === 'B' ? 'B' : 'A',
          status,
          confirmations,
          kFactor: Number(row.k_factor ?? 16),
          eloDelta: Number(row.elo_delta ?? 0),
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          teamANames: teamA.map((id) => nameMap.get(id) || id.substring(0, 6)),
          teamBNames: teamB.map((id) => nameMap.get(id) || id.substring(0, 6)),
          canConfirm,
          canDispute,
          hasConfirmed,
          isParticipant,
        };
      });
    } catch (e) {
      console.warn('Failed to list session matches:', e);
      return [];
    }
  }

  /**
   * Record a new set match into session_matches.
   * Starts in 'pending' status with creator automatically in confirmations.
   */
  async createMatch(params: {
    roomId: string;
    matchType: 'singles' | 'doubles';
    teamA: string[];
    teamB: string[];
    scores: SetScore[];
    winnerTeam: 'A' | 'B';
    createdBy: string;
  }): Promise<string> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const insertPayload = {
      room_id: params.roomId,
      match_type: params.matchType,
      team_a_player_ids: params.teamA,
      team_b_player_ids: params.teamB,
      scores: params.scores,
      winner_team: params.winnerTeam,
      status: 'pending',
      confirmations: [params.createdBy],
      created_by: params.createdBy,
      k_factor: 16,
      elo_delta: 0,
    };

    const { data, error } = await supabase
      .from('session_matches')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create session match:', error);
      throw new Error('Không thể lưu kết quả ván đấu. Vui lòng thử lại.');
    }

    return data.id;
  }

  /**
   * Mutual Consent: Confirm a match score.
   * If both sides have consented:
   * - 1v1: both players in confirmations.
   * - 2v2: at least 1 from Team A and 1 from Team B in confirmations.
   * Status transitions to 'confirmed' and triggers Elo calculation if rated.
   */
  async confirmMatch(
    matchId: string,
    userId: string
  ): Promise<{ confirmed: boolean; eloResults?: SettlePlayerResult[] }> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    // 1. Fetch match
    const { data: match, error: fetchErr } = await supabase
      .from('session_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (fetchErr || !match) {
      throw new Error('Không tìm thấy ván đấu yêu cầu.');
    }

    if (match.status === 'confirmed') {
      return { confirmed: true };
    }

    const teamA: string[] = Array.isArray(match.team_a_player_ids) ? match.team_a_player_ids : [];
    const teamB: string[] = Array.isArray(match.team_b_player_ids) ? match.team_b_player_ids : [];

    if (!teamA.includes(userId) && !teamB.includes(userId)) {
      throw new Error('Bạn không phải là VĐV thi đấu trong ván này.');
    }

    // 2. Add confirmation
    const currentConfirmations: string[] = Array.isArray(match.confirmations)
      ? match.confirmations
      : [];
    const newConfirmations = Array.from(new Set([...currentConfirmations, userId]));

    // 3. Check Consent Threshold
    const isSingles = match.match_type === 'singles';
    let isConsentComplete = false;

    if (isSingles) {
      // 1v1: Both players must confirm
      isConsentComplete = teamA.every((id) => newConfirmations.includes(id)) &&
                          teamB.every((id) => newConfirmations.includes(id));
    } else {
      // 2v2: At least 1 from Team A AND at least 1 from Team B
      const hasTeamA = teamA.some((id) => newConfirmations.includes(id));
      const hasTeamB = teamB.some((id) => newConfirmations.includes(id));
      isConsentComplete = hasTeamA && hasTeamB;
    }

    if (!isConsentComplete) {
      // Not yet fully consented: just update confirmations array
      await supabase
        .from('session_matches')
        .update({ confirmations: newConfirmations, updated_at: new Date().toISOString() })
        .eq('id', matchId);

      return { confirmed: false };
    }

    // 4. Consent is COMPLETE -> Transition to 'confirmed' & Settle Elo
    // Check if room is rated
    const { data: room } = await supabase
      .from('match_rooms')
      .select('is_rated, room_type')
      .eq('id', match.room_id)
      .single();

    const isRated = Boolean(room?.is_rated) || room?.room_type === 'PRIVATE_RATED';

    let eloSettleResults: SettlePlayerResult[] = [];
    let finalKFactor = 0;
    let finalEloDelta = 0;

    if (isRated) {
      // Fetch player profiles
      const allIds = [...teamA, ...teamB];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, elo_rating, win_streak')
        .in('id', allIds);

      const profileMap = new Map<string, EloPlayerProfile>();
      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, {
            id: p.id,
            displayName: p.display_name || 'VĐV',
            eloRating: p.elo_rating || 750,
            winStreak: p.win_streak || 0,
          });
        }
      }

      const teamAPlayers: EloPlayerProfile[] = teamA.map(
        (id) => profileMap.get(id) || { id, displayName: 'VĐV A', eloRating: 750, winStreak: 0 }
      );
      const teamBPlayers: EloPlayerProfile[] = teamB.map(
        (id) => profileMap.get(id) || { id, displayName: 'VĐV B', eloRating: 750, winStreak: 0 }
      );

      // Check H2H count in last 24 hours between these two teams
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: recentMatches } = await supabase
        .from('session_matches')
        .select('id')
        .eq('status', 'confirmed')
        .gte('created_at', twentyFourHoursAgo)
        .contains('team_a_player_ids', [teamA[0]])
        .contains('team_b_player_ids', [teamB[0]]);

      const h2hCount = (recentMatches || []).length;

      // Check if friends
      let areFriends = false;
      try {
        const { data: friendRows } = await supabase
          .from('friendships')
          .select('status')
          .eq('status', 'accepted')
          .or(
            `and(user_low.eq.${teamA[0]},user_high.eq.${teamB[0]}),and(user_low.eq.${teamB[0]},user_high.eq.${teamA[0]})`
          );
        areFriends = Boolean(friendRows && friendRows.length > 0);
      } catch {
        // non-blocking
      }

      // Calculate Elo
      const eloCalc = calculateElo({
        teamAElos: teamAPlayers.map((p) => p.eloRating),
        teamBElos: teamBPlayers.map((p) => p.eloRating),
        winnerTeam: match.winner_team === 'B' ? 'B' : 'A',
        h2hMatchesLast24h: h2hCount,
        hasPlayedBeforeOrFriends: areFriends,
      });

      finalKFactor = eloCalc.kFactor;
      finalEloDelta = eloCalc.eloDelta;

      eloSettleResults = settlePlayers({
        teamAPlayers,
        teamBPlayers,
        winnerTeam: match.winner_team === 'B' ? 'B' : 'A',
        eloDelta: eloCalc.eloDelta,
        isHeadToHeadCapped: eloCalc.isHeadToHeadCapped,
      });

      // Update player profiles in DB
      for (const res of eloSettleResults) {
        await supabase
          .from('profiles')
          .update({
            elo_rating: res.newElo,
            win_streak: res.newStreak,
            tier_name: res.newTier,
          })
          .eq('id', res.playerId);
      }
    }

    // 5. Update session_matches to confirmed
    await supabase
      .from('session_matches')
      .update({
        status: 'confirmed',
        confirmations: newConfirmations,
        k_factor: finalKFactor,
        elo_delta: finalEloDelta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    return { confirmed: true, eloResults: eloSettleResults };
  }

  /**
   * File a dispute against a match score.
   * Freezes score and marks status as 'disputed'.
   */
  async disputeMatch(matchId: string, _userId?: string): Promise<void> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const { error } = await supabase
      .from('session_matches')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (error) {
      throw new Error('Không thể ghi nhận khiếu nại. Vui lòng thử lại.');
    }
  }
}

export const sessionMatchService = new SessionMatchService();
