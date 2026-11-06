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

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.localMatches = parsed;
        }
      }
    } catch {
      // fallback
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localMatches));
      broadcastChannel?.postMessage({ type: 'MATCHES_UPDATED', at: Date.now() });
    } catch {
      // fallback
    }
  }

  async listMatches(roomId: string, viewerId?: string | null): Promise<SessionMatch[]> {
    this.initStore();
    this.loadFromStorage();

    const matchesForRoom = this.localMatches.filter((m) => m.roomId === roomId);

    // If viewer is provided, compute permissions
    return matchesForRoom.map((m) => {
      const isMemberA = m.teamAPlayerIds.some((id) => id === viewerId);
      const isMemberB = m.teamBPlayerIds.some((id) => id === viewerId);
      const isParticipant = Boolean(viewerId) && (isMemberA || isMemberB);
      const hasConfirmed = Boolean(viewerId) && m.confirmations.includes(viewerId!);
      const isCreator = Boolean(viewerId) && m.createdBy === viewerId;

      const canConfirm = Boolean(viewerId) && isParticipant && !hasConfirmed && m.status === 'pending';
      const canDispute = Boolean(viewerId) && isParticipant && m.status === 'pending';

      return {
        ...m,
        canConfirm,
        canDispute,
        hasConfirmed,
        isParticipant,
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
    match.updatedAt = new Date().toISOString();
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
