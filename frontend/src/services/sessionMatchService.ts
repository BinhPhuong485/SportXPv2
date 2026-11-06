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

const STORAGE_KEY = 'sportxp_session_matches_store_v2';
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sportxp_matches_sync') : null;

export class SessionMatchService {
  private localMatches: SessionMatch[] = [];
  private initialized = false;

  constructor() {
    this.initStore();
    if (broadcastChannel) {
      broadcastChannel.onmessage = () => {
        this.loadFromStorage();
      };
    }
  }

  private initStore() {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
  }

  private buildInitialMockMatches(): SessionMatch[] {
    const now = Date.now();
    return [
      // Match 1: Confirmed set (Đã đồng thuận, +16 Elo)
      {
        id: 'match-seed-1',
        roomId: 'room-live-102',
        matchType: 'singles',
        teamAPlayerIds: ['b86ef8fb-4486-4a71-a5a9-d6430f48857d'],
        teamBPlayerIds: ['9ded99f9-af7d-4297-829a-18e213294403'],
        scores: [{ set: 1, a: 21, b: 19 }],
        scoreText: '21-19',
        winnerTeam: 'A',
        status: 'confirmed',
        confirmations: ['b86ef8fb-4486-4a71-a5a9-d6430f48857d', '9ded99f9-af7d-4297-829a-18e213294403'],
        kFactor: 32,
        eloDelta: 16,
        createdBy: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
        createdAt: new Date(now - 40 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 35 * 60 * 1000).toISOString(),
        teamANames: ['Đặng Cao Bồ (Host)'],
        teamBNames: ['Square (Đối thủ)'],
        canConfirm: false,
        canDispute: false,
        hasConfirmed: true,
        isParticipant: true,
        isCreator: false,
      },

      // Match 2: Pending confirmation (Chờ đối thủ xác nhận: có nút Đúng / Sai)
      {
        id: 'match-seed-2',
        roomId: 'room-live-102',
        matchType: 'singles',
        teamAPlayerIds: ['b86ef8fb-4486-4a71-a5a9-d6430f48857d'],
        teamBPlayerIds: ['9ded99f9-af7d-4297-829a-18e213294403'],
        scores: [{ set: 1, a: 19, b: 21 }],
        scoreText: '19-21',
        winnerTeam: 'B',
        status: 'pending',
        confirmations: ['b86ef8fb-4486-4a71-a5a9-d6430f48857d'],
        kFactor: 32,
        eloDelta: 16,
        createdBy: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
        createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 15 * 60 * 1000).toISOString(),
        teamANames: ['Đặng Cao Bồ (Host)'],
        teamBNames: ['Square (Đối thủ)'],
        canConfirm: true,
        canDispute: true,
        hasConfirmed: false,
        isParticipant: true,
        isCreator: false,
      },

      // Match 3: Disputed match (Đang khiếu nại tỉ số: có banner + nút Thương lượng vòng 2)
      {
        id: 'match-seed-3',
        roomId: 'room-live-102',
        matchType: 'singles',
        teamAPlayerIds: ['b86ef8fb-4486-4a71-a5a9-d6430f48857d'],
        teamBPlayerIds: ['9ded99f9-af7d-4297-829a-18e213294403'],
        scores: [
          { set: 1, a: 21, b: 18 },
          { set: 2, a: 19, b: 21 },
          { set: 3, a: 21, b: 19 },
        ],
        scoreText: '21-18, 19-21, 21-19',
        winnerTeam: 'A',
        status: 'disputed',
        confirmations: ['b86ef8fb-4486-4a71-a5a9-d6430f48857d'],
        kFactor: 32,
        eloDelta: 16,
        createdBy: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
        createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
        teamANames: ['Đặng Cao Bồ (Host)'],
        teamBNames: ['Square (Đối thủ)'],
        canConfirm: false,
        canDispute: false,
        hasConfirmed: false,
        isParticipant: true,
        isCreator: false,
        disputeData: {
          phase: 'conflict_round_1',
          initiatorId: '9ded99f9-af7d-4297-829a-18e213294403',
          initiatorName: 'Square',
          proposals: [
            {
              round: 1,
              by: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
              winnerTeam: 'A',
              scoreText: '21-18, 19-21, 21-19',
              scores: [
                { set: 1, a: 21, b: 18 },
                { set: 2, a: 19, b: 21 },
                { set: 3, a: 21, b: 19 },
              ],
              submittedAt: new Date(now - 8 * 60 * 1000).toISOString(),
            },
            {
              round: 2,
              by: '9ded99f9-af7d-4297-829a-18e213294403',
              winnerTeam: 'B',
              scoreText: '21-18, 19-21, 20-22',
              scores: [
                { set: 1, a: 21, b: 18 },
                { set: 2, a: 19, b: 21 },
                { set: 3, a: 20, b: 22 },
              ],
              submittedAt: new Date(now - 5 * 60 * 1000).toISOString(),
              reason: 'Tỉ số set 3 bên mình là 22-20 thắng cuộc',
            },
          ],
        },
      },
    ];
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localMatches = parsed;
          return;
        }
      }
    } catch {
      // fallback
    }

    // Seed mock matches if empty
    this.localMatches = this.buildInitialMockMatches();
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localMatches));
      broadcastChannel?.postMessage({ type: 'MATCHES_UPDATED', at: Date.now() });
    } catch {
      // fallback
    }
  }

  private synthesizeFallbackMatches(roomId: string): SessionMatch[] {
    const now = Date.now();
    return [
      {
        id: `match-${roomId}-1`,
        roomId,
        matchType: 'singles',
        teamAPlayerIds: ['host-player-id'],
        teamBPlayerIds: ['opp-player-id'],
        scores: [{ set: 1, a: 21, b: 19 }],
        scoreText: '21-19',
        winnerTeam: 'A',
        status: 'confirmed',
        confirmations: ['host-player-id', 'opp-player-id'],
        kFactor: 32,
        eloDelta: 16,
        createdBy: 'host-player-id',
        createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
        teamANames: ['Đội A (Host)'],
        teamBNames: ['Đội B (Đối thủ)'],
        canConfirm: false,
        canDispute: false,
        hasConfirmed: true,
        isParticipant: true,
        isCreator: false,
      },
      {
        id: `match-${roomId}-2`,
        roomId,
        matchType: 'singles',
        teamAPlayerIds: ['host-player-id'],
        teamBPlayerIds: ['opp-player-id'],
        scores: [{ set: 1, a: 19, b: 21 }],
        scoreText: '19-21',
        winnerTeam: 'B',
        status: 'pending',
        confirmations: ['host-player-id'],
        kFactor: 32,
        eloDelta: 16,
        createdBy: 'host-player-id',
        createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 10 * 60 * 1000).toISOString(),
        teamANames: ['Đội A (Host)'],
        teamBNames: ['Đội B (Đối thủ)'],
        canConfirm: true,
        canDispute: true,
        hasConfirmed: false,
        isParticipant: true,
        isCreator: false,
      },
      {
        id: `match-${roomId}-3`,
        roomId,
        matchType: 'singles',
        teamAPlayerIds: ['host-player-id'],
        teamBPlayerIds: ['opp-player-id'],
        scores: [
          { set: 1, a: 21, b: 18 },
          { set: 2, a: 19, b: 21 },
          { set: 3, a: 21, b: 19 },
        ],
        scoreText: '21-18, 19-21, 21-19',
        winnerTeam: 'A',
        status: 'disputed',
        confirmations: ['host-player-id'],
        kFactor: 32,
        eloDelta: 16,
        createdBy: 'host-player-id',
        createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 3 * 60 * 1000).toISOString(),
        teamANames: ['Đội A (Host)'],
        teamBNames: ['Đội B (Đối thủ)'],
        canConfirm: false,
        canDispute: false,
        hasConfirmed: false,
        isParticipant: true,
        isCreator: false,
        disputeData: {
          phase: 'conflict_round_1',
          initiatorId: 'opp-player-id',
          initiatorName: 'Đối thủ',
          proposals: [
            {
              round: 1,
              by: 'host-player-id',
              winnerTeam: 'A',
              scoreText: '21-18, 19-21, 21-19',
              scores: [
                { set: 1, a: 21, b: 18 },
                { set: 2, a: 19, b: 21 },
                { set: 3, a: 21, b: 19 },
              ],
              submittedAt: new Date(now - 5 * 60 * 1000).toISOString(),
            },
            {
              round: 2,
              by: 'opp-player-id',
              winnerTeam: 'B',
              scoreText: '21-18, 19-21, 20-22',
              scores: [
                { set: 1, a: 21, b: 18 },
                { set: 2, a: 19, b: 21 },
                { set: 3, a: 20, b: 22 },
              ],
              submittedAt: new Date(now - 3 * 60 * 1000).toISOString(),
              reason: 'Tỉ số set 3 bên mình là 22-20 thắng',
            },
          ],
        },
      },
    ];
  }

  async listMatches(roomId: string, viewerId?: string | null): Promise<SessionMatch[]> {
    this.initStore();
    this.loadFromStorage();

    let matchesForRoom = this.localMatches.filter((m) => m.roomId === roomId);

    // Auto-seed realistic demo matches if room has no matches yet
    if (matchesForRoom.length === 0) {
      const generated = this.synthesizeFallbackMatches(roomId);
      this.localMatches.push(...generated);
      this.saveToStorage();
      matchesForRoom = generated;
    }

    // Compute UI permissions
    return matchesForRoom.map((m) => {
      const hasConfirmed = Boolean(viewerId) && m.confirmations.includes(viewerId!);
      const isCreator = Boolean(viewerId) && m.createdBy === viewerId;

      // In prototype demo: allow viewer to test confirming and disputing seamlessly
      const canConfirm = !hasConfirmed && m.status === 'pending';
      const canDispute = m.status === 'pending';

      return {
        ...m,
        canConfirm,
        canDispute,
        hasConfirmed,
        isParticipant: true,
        isCreator,
      };
    });
  }

  async createMatch(params: {
    roomId: string;
    matchType: 'singles' | 'doubles';
    teamA: string[];
    teamB: string[];
    scores: SetScore[];
    winnerTeam: 'A' | 'B';
    createdBy: string;
  }): Promise<string> {
    this.initStore();
    this.loadFromStorage();

    const matchId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const scoreText = params.scores.map((s) => `${s.a}-${s.b}`).join(', ');

    // Calculate initial Elo delta prediction
    const eloCalc = calculateElo({
      teamAElos: [1200],
      teamBElos: [1200],
      winnerTeam: params.winnerTeam,
      h2hMatchesLast24h: 0,
    });

    const newMatch: SessionMatch = {
      id: matchId,
      roomId: params.roomId,
      matchType: params.matchType,
      teamAPlayerIds: params.teamA,
      teamBPlayerIds: params.teamB,
      scores: params.scores,
      scoreText,
      winnerTeam: params.winnerTeam,
      status: 'pending',
      confirmations: [params.createdBy],
      kFactor: eloCalc.kFactor,
      eloDelta: eloCalc.eloDelta,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      teamANames: params.teamA.map((_, i) => (i === 0 ? 'Bên A (Host)' : 'Đồng đội A')),
      teamBNames: params.teamB.map((_, i) => (i === 0 ? 'Bên B (Đối thủ)' : 'Đồng đội B')),
      canConfirm: false,
      canDispute: false,
      hasConfirmed: true,
      isParticipant: true,
      isCreator: true,
      disputeData: {
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
      },
    };

    this.localMatches.unshift(newMatch);
    this.saveToStorage();
    return matchId;
  }

  async confirmMatch(
    matchId: string,
    userId: string,
    _kFactorMultiplier = 1.0
  ): Promise<{ confirmed: boolean; eloResults?: SettlePlayerResult[] }> {
    this.initStore();
    this.loadFromStorage();

    const match = this.localMatches.find((m) => m.id === matchId);
    if (!match) {
      throw new Error('Không tìm thấy ván đấu yêu cầu.');
    }

    if (match.status === 'confirmed') {
      return { confirmed: true };
    }

    // Add confirmation
    if (!match.confirmations.includes(userId)) {
      match.confirmations.push(userId);
    }

    // Both sides confirm: Host (Team A) and Opponent (Team B)
    const hasA = match.teamAPlayerIds.some((id) => match.confirmations.includes(id));
    const hasB = match.teamBPlayerIds.some((id) => match.confirmations.includes(id));
    const isConsentComplete = hasA && hasB;

    if (!isConsentComplete) {
      this.saveToStorage();
      return { confirmed: false };
    }

    // Consent complete -> mark confirmed and settle Elo
    match.status = 'confirmed';
    match.updatedAt = new Date().toISOString();

    const teamAPlayers: EloPlayerProfile[] = match.teamAPlayerIds.map((id) => ({
      id,
      displayName: 'VĐV A',
      eloRating: 1200,
      winStreak: 1,
    }));

    const teamBPlayers: EloPlayerProfile[] = match.teamBPlayerIds.map((id) => ({
      id,
      displayName: 'VĐV B',
      eloRating: 1200,
      winStreak: 0,
    }));

    const eloSettleResults = settlePlayers({
      teamAPlayers,
      teamBPlayers,
      winnerTeam: match.winnerTeam,
      eloDelta: match.eloDelta || 16,
      isHeadToHeadCapped: false,
    });

    this.saveToStorage();

    // Try optional sync to Supabase profile if possible
    try {
      if (supabase) {
        for (const res of eloSettleResults) {
          await supabase
            .from('profiles')
            .update({
              elo_rating: res.newElo,
              win_streak: res.newStreak,
            })
            .eq('id', res.playerId);
        }
      }
    } catch {
      // non-blocking
    }

    return { confirmed: true, eloResults: eloSettleResults };
  }

  async submitDispute(params: {
    matchId: string;
    userId: string;
    winnerTeam: 'A' | 'B';
    scoreText: string;
    scores: SetScore[];
    reason?: string;
  }): Promise<void> {
    this.initStore();
    this.loadFromStorage();

    const match = this.localMatches.find((m) => m.id === params.matchId);
    if (!match) return;

    match.status = 'disputed';
    match.updatedAt = new Date().toISOString();
    match.disputeData = {
      phase: 'conflict_round_1',
      initiatorId: params.userId,
      proposals: [
        ...(match.disputeData?.proposals || []),
        {
          round: 2,
          by: params.userId,
          winnerTeam: params.winnerTeam,
          scoreText: params.scoreText,
          scores: params.scores,
          submittedAt: new Date().toISOString(),
          reason: params.reason,
        },
      ],
    };

    this.saveToStorage();
  }

  async submitRound2Choice(params: {
    matchId: string;
    userId: string;
    winnerTeam: 'A' | 'B';
    scoreText: string;
    scores: SetScore[];
  }): Promise<{ resolved: boolean; resolution?: string; winnerTeam?: 'A' | 'B' }> {
    this.initStore();
    this.loadFromStorage();

    const match = this.localMatches.find((m) => m.id === params.matchId);
    if (!match) return { resolved: false };

    match.status = 'confirmed';
    match.winnerTeam = params.winnerTeam;
    match.scoreText = params.scoreText;
    match.scores = params.scores;
    match.updatedAt = new Date().toISOString();
    if (match.disputeData) {
      match.disputeData.phase = 'resolved_simple_winner';
      match.disputeData.resolutionNote = 'Hai bên đã thống nhất kết quả ở lần chọn lại thứ hai.';
    }
    this.saveToStorage();
    return { resolved: true, resolution: 'exact_match', winnerTeam: params.winnerTeam };
  }

  async autoConfirmAfter24h(matchId: string): Promise<{ confirmed: boolean; autoConfirmed: boolean }> {
    this.initStore();
    this.loadFromStorage();

    const match = this.localMatches.find((m) => m.id === matchId);
    if (!match) return { confirmed: false, autoConfirmed: false };

    match.status = 'confirmed';
    match.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return { confirmed: true, autoConfirmed: true };
  }
}

export const sessionMatchService = new SessionMatchService();
