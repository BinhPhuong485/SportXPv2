export interface Court {
  id: string;
  name: string;
  distance_km?: number | null;
  distanceKm?: number | null;
}

export interface PlayerProfile {
  id: string;
  publicId?: string;
  socialVisibility: string;
  displayName: string;
  avatarUrl?: string | null;
  eloRating?: number | null;
  tierName: string;
  trustScore: number;
  winStreak: number;
  homeCourtId?: string | null;
  homeCourtName?: string | null;
  createdAt?: string | null;
  onboardingStep: number;
  isIdentityVerified: boolean;
  confirmedMatchesCount: number;
  rankDelta: number;
}

export interface MatchSummary {
  id: string;
  courtName: string;
  teamA: string;
  teamB: string;
  score: string;
  isWin: boolean;
  eloChange?: number;
  createdAt: string;
}

export interface MatchRoom {
  id: string;
  courtName: string;
  startsAt: string;
  hostId: string;
  playerIds: string[];
  capacity: number;
  distanceKm?: number;
}

export interface ManagedRoom {
  id: string;
  courtId: string;
  title: string;
  courtName: string;
  address: string;
  startsAt: string;
  endsAt: string;
  cancelBy: string;
  capacity: number;
  reserved: number;
  minElo: number;
  maxElo: number;
  fee: number;
  revision: number;
  visibility: string;
  status: string;
  hostPlays: boolean;
  isHost: boolean;
  hostName: string;
  myStatus?: string | null;
  cancellationReason?: string | null;
  notes: string;
  courtLabel: string;
  bookingStatus: string;
  viewerId?: string | null;
  roomCode: string;
  members: Record<string, unknown>[];
}

export interface SocialProfile {
  publicId: string;
  name: string;
  relationship: string;
  elo?: number | null;
  tier?: string | null;
  streak: number;
  statsVisible: boolean;
}

export interface OnboardingStateData {
  onboarding_step: number;
  answers: number[];
  display_name: string;
  elo_rating: number | null;
  tier_name: string | null;
}

