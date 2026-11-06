import { supabase } from '../core/config/supabase';
import { calculateElo, settlePlayers, EloPlayerProfile, SettlePlayerResult } from './eloEngine';

export interface SetScore {
  set: number;
  a: number;
  b: number;
}

export interface MatchProposal {
  round: number;
  by: string;
  byName?: string;
  winnerTeam: 'A' | 'B';
  scoreText: string;
  scores: SetScore[];
  submittedAt: string;
  reason?: string;
}

export interface MatchDisputeData {
  phase:
    | 'none'
    | 'conflict_round_1'
    | 'waiting_round_2'
    | 'resolved_simple_winner'
    | 'cancelled_winner_mismatch';
  initiatorId?: string;
  initiatorName?: string;
  proposals: MatchProposal[];
  resolutionNote?: string;
  kFactorMultiplier?: number;
  autoConfirmed?: boolean;
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
  isCreator?: boolean;
  disputeData?: MatchDisputeData;
  isAutoConfirmEligible?: boolean;
  hoursUntilAutoConfirm?: number;
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
          row.team_a_player_ids.forEach((id: string) => allPlayerIds.add(String(id)));
        }
        if (Array.isArray(row.team_b_player_ids)) {
          row.team_b_player_ids.forEach((id: string) => allPlayerIds.add(String(id)));
        }
      }

      // Fetch player display names and map both user_id <-> public_id
      const nameMap = new Map<string, string>();
      const publicIdToId = new Map<string, string>();
      const idToPublicId = new Map<string, string>();

      if (allPlayerIds.size > 0) {
        const idList = Array.from(allPlayerIds);
        // Query by id
        const { data: profsById } = await supabase
          .from('profiles')
          .select('id, public_id, display_name')
          .in('id', idList);

        if (profsById) {
          for (const p of profsById) {
            let name = p.display_name;
            if (!name || name === 'VĐV' || name === 'Vận động viên') {
              if (p.id === '9ded99f9-af7d-4297-829a-18e213294403') name = 'Square';
            }
            if (p.id) {
              nameMap.set(p.id, name || 'VĐV');
            }
            if (p.public_id) {
              nameMap.set(p.public_id, name || 'VĐV');
              publicIdToId.set(p.public_id, p.id);
              idToPublicId.set(p.id, p.public_id);
            }
          }
        }

        // Query by public_id for any still unresolved
        const unresolved = idList.filter((id) => !nameMap.has(id));
        if (unresolved.length > 0) {
          const { data: profsByPublic } = await supabase
            .from('profiles')
            .select('id, public_id, display_name')
            .in('public_id', unresolved);

          if (profsByPublic) {
            for (const p of profsByPublic) {
              let name = p.display_name;
              if (!name || name === 'VĐV' || name === 'Vận động viên') {
                if (p.id === '9ded99f9-af7d-4297-829a-18e213294403') name = 'Square';
              }
              if (p.id) {
                nameMap.set(p.id, name || 'VĐV');
              }
              if (p.public_id) {
                nameMap.set(p.public_id, name || 'VĐV');
                publicIdToId.set(p.public_id, p.id);
                idToPublicId.set(p.id, p.public_id);
              }
            }
          }
        }

        // Hardcode fallback for Square
        if (allPlayerIds.has('9ded99f9-af7d-4297-829a-18e213294403')) {
          nameMap.set('9ded99f9-af7d-4297-829a-18e213294403', 'Square');
        }
        if (allPlayerIds.has('ba1fd41e-b597-48d3-867a-5735bbc67d41')) {
          nameMap.set('ba1fd41e-b597-48d3-867a-5735bbc67d41', 'Square');
          publicIdToId.set('ba1fd41e-b597-48d3-867a-5735bbc67d41', '9ded99f9-af7d-4297-829a-18e213294403');
          idToPublicId.set('9ded99f9-af7d-4297-829a-18e213294403', 'ba1fd41e-b597-48d3-867a-5735bbc67d41');
        }
      }

      const matchesViewer = (id: string): boolean => {
        if (!viewerId) return false;
        if (id === viewerId) return true;
        if (publicIdToId.get(id) === viewerId) return true;
        if (idToPublicId.get(id) === viewerId) return true;
        return false;
      };

      return data.map((row: any) => {
        const teamA: string[] = Array.isArray(row.team_a_player_ids) ? row.team_a_player_ids.map(String) : [];
        const teamB: string[] = Array.isArray(row.team_b_player_ids) ? row.team_b_player_ids.map(String) : [];

        // Parse scores & dispute payload
        let scores: SetScore[] = [];
        let disputeData: MatchDisputeData = {
          phase: 'none',
          proposals: [],
        };

        if (Array.isArray(row.scores)) {
          scores = row.scores.map((s: any, idx: number) => ({
            set: typeof s.set === 'number' ? s.set : idx + 1,
            a: Number(s.a ?? 0),
            b: Number(s.b ?? 0),
          }));
        } else if (row.scores && typeof row.scores === 'object') {
          if (Array.isArray(row.scores.sets)) {
            scores = row.scores.sets.map((s: any, idx: number) => ({
              set: typeof s.set === 'number' ? s.set : idx + 1,
              a: Number(s.a ?? 0),
              b: Number(s.b ?? 0),
            }));
          }
          if (row.scores.dispute) {
            disputeData = row.scores.dispute;
          }
        }

        const scoreText =
          scores.length > 0
            ? scores.map((s) => `${s.a}-${s.b}`).join(', ')
            : '21-19';

        const confirmations: string[] = Array.isArray(row.confirmations) ? row.confirmations.map(String) : [];
        const status = (row.status || 'pending').toLowerCase() as SessionMatch['status'];

        const isTeamA = teamA.some(matchesViewer);
        const isTeamB = teamB.some(matchesViewer);
        const isParticipant = Boolean(viewerId) && (isTeamA || isTeamB);
        const hasConfirmed = Boolean(viewerId) && confirmations.some(matchesViewer);
        const isCreator = Boolean(viewerId) && matchesViewer(row.created_by);

        const canConfirm = Boolean(viewerId) && isParticipant && !hasConfirmed && status === 'pending';
        const canDispute = Boolean(viewerId) && isParticipant && status === 'pending';

        // 24h auto-confirm eligibility
        const createdMs = new Date(row.created_at).getTime();
        const elapsedHours = (Date.now() - createdMs) / (3600 * 1000);
        const isAutoConfirmEligible = status === 'pending' && elapsedHours >= 24;
        const hoursUntilAutoConfirm = Math.max(0, Math.ceil(24 - elapsedHours));

        // Format names
        const formatPlayerName = (id: string): string => {
          let n = nameMap.get(id);
          if (!n && (id === '9ded99f9-af7d-4297-829a-18e213294403' || id === 'ba1fd41e-b597-48d3-867a-5735bbc67d41')) {
            n = 'Square';
          }
          return n || id.substring(0, 6);
        };

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
          teamANames: teamA.map(formatPlayerName),
          teamBNames: teamB.map(formatPlayerName),
          canConfirm,
          canDispute,
          hasConfirmed,
          isParticipant,
          isCreator,
          disputeData,
          isAutoConfirmEligible,
          hoursUntilAutoConfirm,
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

    // Strict guard: Only allowed when room is in progress
    const { data: roomCheck } = await supabase
      .from('match_rooms')
      .select('status')
      .eq('id', params.roomId)
      .single();

    if (roomCheck && roomCheck.status !== 'IN_PROGRESS') {
      if (['OPEN', 'FULL', 'DRAFT'].includes(roomCheck.status)) {
        throw new Error('Chưa thể nhập tỉ số. Chỉ khi Host bấm "Bắt đầu buổi chơi" thì mới được nhập tỉ số ván đấu.');
      }
      if (roomCheck.status === 'COMPLETED') {
        throw new Error('Buổi chơi đã kết thúc. Không thể nhập thêm ván đấu mới.');
      }
      if (roomCheck.status === 'CANCELLED') {
        throw new Error('Buổi chơi đã bị hủy.');
      }
    }

    const scoreText = params.scores.map((s) => `${s.a}-${s.b}`).join(', ');
    const initialDispute: MatchDisputeData = {
      phase: 'none',
      proposals: [
        {
          round: 1,
          by: params.createdBy,
          winnerTeam: params.winnerTeam,
          scoreText,
          scores: params.scores,
          submittedAt: new Date().toISOString(),
        },
      ],
    };

    const insertPayload = {
      room_id: params.roomId,
      match_type: params.matchType,
      team_a_player_ids: params.teamA,
      team_b_player_ids: params.teamB,
      scores: {
        sets: params.scores,
        dispute: initialDispute,
      },
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
   * Confirm match ("ĐÚNG").
   * Both sides agree -> status becomes 'confirmed'.
   * Settles Elo with full or discounted k_factor.
   */
  async confirmMatch(
    matchId: string,
    userId: string,
    kFactorMultiplier = 1.0
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

    const teamA: string[] = Array.isArray(match.team_a_player_ids) ? match.team_a_player_ids.map(String) : [];
    const teamB: string[] = Array.isArray(match.team_b_player_ids) ? match.team_b_player_ids.map(String) : [];

    // Map public_id <-> user_id
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, public_id')
      .or(`id.eq.${userId},public_id.eq.${userId}`);

    const userRealId = profs?.[0]?.id || userId;
    const userPublicId = profs?.[0]?.public_id || '';

    const isMemberA = teamA.includes(userRealId) || (userPublicId && teamA.includes(userPublicId));
    const isMemberB = teamB.includes(userRealId) || (userPublicId && teamB.includes(userPublicId));

    if (!isMemberA && !isMemberB) {
      throw new Error('Bạn không phải là VĐV thi đấu trong ván này.');
    }

    // 2. Add confirmation
    const currentConfirmations: string[] = Array.isArray(match.confirmations)
      ? match.confirmations.map(String)
      : [];
    const newConfirmations = Array.from(new Set([...currentConfirmations, userRealId]));

    // 3. Check Consent Threshold
    const isSingles = match.match_type === 'singles';
    let isConsentComplete = false;

    if (isSingles) {
      const hasA = teamA.some((id) => newConfirmations.includes(id) || (id === userPublicId && newConfirmations.includes(userRealId)));
      const hasB = teamB.some((id) => newConfirmations.includes(id) || (id === userPublicId && newConfirmations.includes(userRealId)));
      isConsentComplete = hasA && hasB;
    } else {
      const hasTeamA = teamA.some((id) => newConfirmations.includes(id) || (id === userPublicId && newConfirmations.includes(userRealId)));
      const hasTeamB = teamB.some((id) => newConfirmations.includes(id) || (id === userPublicId && newConfirmations.includes(userRealId)));
      isConsentComplete = hasTeamA && hasTeamB;
    }

    if (!isConsentComplete) {
      await supabase
        .from('session_matches')
        .update({ confirmations: newConfirmations, updated_at: new Date().toISOString() })
        .eq('id', matchId);

      return { confirmed: false };
    }

    // 4. Consent complete -> settle Elo
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
      const allIds = [...teamA, ...teamB];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, public_id, display_name, elo_rating, win_streak')
        .or(`id.in.(${allIds.join(',')}),public_id.in.(${allIds.join(',')})`);

      const profileMap = new Map<string, EloPlayerProfile>();
      if (profiles) {
        for (const p of profiles) {
          let name = p.display_name;
          if (!name || name === 'VĐV' || name === 'Vận động viên') {
            if (p.id === '9ded99f9-af7d-4297-829a-18e213294403') name = 'Square';
          }
          const eloData = {
            id: p.id,
            displayName: name || 'VĐV',
            eloRating: p.elo_rating || 750,
            winStreak: p.win_streak || 0,
          };
          profileMap.set(p.id, eloData);
          if (p.public_id) profileMap.set(p.public_id, eloData);
        }
      }

      const teamAPlayers: EloPlayerProfile[] = teamA.map(
        (id) => profileMap.get(id) || { id, displayName: 'VĐV A', eloRating: 750, winStreak: 0 }
      );
      const teamBPlayers: EloPlayerProfile[] = teamB.map(
        (id) => profileMap.get(id) || { id, displayName: 'VĐV B', eloRating: 750, winStreak: 0 }
      );

      // Check H2H count
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: recentMatches } = await supabase
        .from('session_matches')
        .select('id')
        .eq('status', 'confirmed')
        .gte('created_at', twentyFourHoursAgo);

      const h2hCount = (recentMatches || []).length;

      const eloCalc = calculateElo({
        teamAElos: teamAPlayers.map((p) => p.eloRating),
        teamBElos: teamBPlayers.map((p) => p.eloRating),
        winnerTeam: match.winner_team === 'B' ? 'B' : 'A',
        h2hMatchesLast24h: h2hCount,
        hasPlayedBeforeOrFriends: false,
      });

      finalKFactor = Math.round(eloCalc.kFactor * kFactorMultiplier);
      finalEloDelta = Math.round(eloCalc.eloDelta * kFactorMultiplier);

      eloSettleResults = settlePlayers({
        teamAPlayers,
        teamBPlayers,
        winnerTeam: match.winner_team === 'B' ? 'B' : 'A',
        eloDelta: finalEloDelta,
        isHeadToHeadCapped: eloCalc.isHeadToHeadCapped,
      });

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

    // 5. Update session_matches
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
   * Submit dispute ("SAI") - User enters their own counter score.
   * Enters 'conflict_round_1'.
   */
  async submitDispute(params: {
    matchId: string;
    userId: string;
    winnerTeam: 'A' | 'B';
    scoreText: string;
    scores: SetScore[];
    reason?: string;
  }): Promise<void> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const { data: match, error: fetchErr } = await supabase
      .from('session_matches')
      .select('*')
      .eq('id', params.matchId)
      .single();

    if (fetchErr || !match) throw new Error('Không tìm thấy ván đấu.');

    let disputeData: MatchDisputeData = {
      phase: 'conflict_round_1',
      initiatorId: params.userId,
      proposals: [],
    };

    if (match.scores && typeof match.scores === 'object' && match.scores.dispute) {
      disputeData = match.scores.dispute;
    }

    // Add opponent counter proposal
    disputeData.phase = 'conflict_round_1';
    disputeData.initiatorId = params.userId;
    disputeData.proposals.push({
      round: 1,
      by: params.userId,
      winnerTeam: params.winnerTeam,
      scoreText: params.scoreText,
      scores: params.scores,
      submittedAt: new Date().toISOString(),
      reason: params.reason,
    });

    const sets = Array.isArray(match.scores)
      ? match.scores
      : match.scores?.sets || params.scores;

    const { error: updateErr } = await supabase
      .from('session_matches')
      .update({
        status: 'disputed',
        scores: {
          sets,
          dispute: disputeData,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.matchId);

    if (updateErr) {
      console.error('Error submitting dispute:', updateErr);
      throw new Error('Không thể ghi nhận khiếu nại. Vui lòng thử lại.');
    }
  }

  /**
   * Submit Round 2 Choice (Chọn lại một lần).
   * If both agreed on winner: settle simple win with 50% kFactor.
   * If still disagree on winner: cancel match (status: 'void', 0 Elo, log dispute).
   */
  async submitRound2Choice(params: {
    matchId: string;
    userId: string;
    winnerTeam: 'A' | 'B';
    scoreText: string;
    scores: SetScore[];
  }): Promise<{
    status: 'confirmed' | 'disputed' | 'void';
    resolution: 'exact_match' | 'simple_winner_discounted' | 'cancelled_mismatch' | 'waiting_other_side';
    eloResults?: SettlePlayerResult[];
  }> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const { data: match, error: fetchErr } = await supabase
      .from('session_matches')
      .select('*')
      .eq('id', params.matchId)
      .single();

    if (fetchErr || !match) throw new Error('Không tìm thấy ván đấu.');

    let disputeData: MatchDisputeData = {
      phase: 'waiting_round_2',
      proposals: [],
    };

    if (match.scores && typeof match.scores === 'object' && match.scores.dispute) {
      disputeData = match.scores.dispute;
    }

    // Add round 2 proposal
    disputeData.proposals.push({
      round: 2,
      by: params.userId,
      winnerTeam: params.winnerTeam,
      scoreText: params.scoreText,
      scores: params.scores,
      submittedAt: new Date().toISOString(),
    });

    const round2Proposals = disputeData.proposals.filter((p) => p.round === 2);

    // If only 1 player has submitted Round 2, wait for other side
    if (round2Proposals.length < 2) {
      disputeData.phase = 'waiting_round_2';
      await supabase
        .from('session_matches')
        .update({
          scores: {
            sets: match.scores?.sets || match.scores,
            dispute: disputeData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.matchId);

      return { status: 'disputed', resolution: 'waiting_other_side' };
    }

    // Both sides submitted Round 2!
    const propA = round2Proposals[0];
    const propB = round2Proposals[1];

    // Case 1: Exact Match
    if (propA.winnerTeam === propB.winnerTeam && propA.scoreText === propB.scoreText) {
      disputeData.phase = 'none';
      disputeData.resolutionNote = 'Hai bên đã thống nhất kết quả ở lần chọn thứ hai.';
      await supabase
        .from('session_matches')
        .update({
          scores: { sets: propB.scores, dispute: disputeData },
          winner_team: propB.winnerTeam,
        })
        .eq('id', params.matchId);

      const confirmRes = await this.confirmMatch(params.matchId, params.userId, 1.0);
      return { status: 'confirmed', resolution: 'exact_match', eloResults: confirmRes.eloResults };
    }

    // Case 2: Same Winner, Different Scores -> Simple Win with 50% weight
    if (propA.winnerTeam === propB.winnerTeam) {
      disputeData.phase = 'resolved_simple_winner';
      disputeData.kFactorMultiplier = 0.5;
      disputeData.resolutionNote = `Cùng đồng thuận Đội ${propA.winnerTeam} thắng. Tính thắng/thua đơn giản (trọng số giảm 50%).`;

      await supabase
        .from('session_matches')
        .update({
          scores: { sets: propB.scores, dispute: disputeData },
          winner_team: propA.winnerTeam,
        })
        .eq('id', params.matchId);

      const confirmRes = await this.confirmMatch(params.matchId, params.userId, 0.5);
      return { status: 'confirmed', resolution: 'simple_winner_discounted', eloResults: confirmRes.eloResults };
    }

    // Case 3: Different Winner -> CANCELLED, 0 Elo, record dispute rate
    disputeData.phase = 'cancelled_winner_mismatch';
    disputeData.resolutionNote = 'Hai bên bất đồng về người thắng sau 2 lần thương lượng. Ván đấu bị hủy (0 điểm Elo).';

    await supabase
      .from('session_matches')
      .update({
        status: 'void',
        scores: { sets: match.scores?.sets || match.scores, dispute: disputeData },
        elo_delta: 0,
        k_factor: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.matchId);

    // Record dispute penalty on trust_score for the initiator
    const initiatorId = disputeData.initiatorId || params.userId;
    try {
      const { data: p } = await supabase.from('profiles').select('trust_score').eq('id', initiatorId).single();
      if (p) {
        const newScore = Math.max(0, (p.trust_score ?? 100) - 5);
        await supabase.from('profiles').update({ trust_score: newScore }).eq('id', initiatorId);
      }
    } catch {
      // non-blocking
    }

    return { status: 'void', resolution: 'cancelled_mismatch' };
  }

  /**
   * Auto-confirm after 24h silence (trọng số khoảng 50%).
   */
  async autoConfirmAfter24h(
    matchId: string
  ): Promise<{ confirmed: boolean; eloResults?: SettlePlayerResult[] }> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const { data: match } = await supabase.from('session_matches').select('*').eq('id', matchId).single();
    if (!match || match.status !== 'pending') {
      return { confirmed: match?.status === 'confirmed' };
    }

    const createdMs = new Date(match.created_at).getTime();
    const elapsedHours = (Date.now() - createdMs) / (3600 * 1000);
    if (elapsedHours < 24) {
      throw new Error(`Chưa đủ 24 giờ để tự động xác nhận (còn khoảng ${Math.ceil(24 - elapsedHours)} giờ).`);
    }

    // Mark as auto-confirmed with 50% weight
    let disputeData: MatchDisputeData = { phase: 'none', proposals: [] };
    if (match.scores && typeof match.scores === 'object' && match.scores.dispute) {
      disputeData = match.scores.dispute;
    }
    disputeData.autoConfirmed = true;
    disputeData.resolutionNote = 'Tự động chốt do đối thủ không phản hồi sau 24 giờ (trọng số 50%).';

    await supabase
      .from('session_matches')
      .update({
        scores: { sets: match.scores?.sets || match.scores, dispute: disputeData },
      })
      .eq('id', matchId);

    // Auto-confirm with creator's team or first opponent
    const otherTeamPlayer = match.team_b_player_ids?.[0] || match.team_a_player_ids?.[0];
    return this.confirmMatch(matchId, otherTeamPlayer, 0.5);
  }
}

export const sessionMatchService = new SessionMatchService();
