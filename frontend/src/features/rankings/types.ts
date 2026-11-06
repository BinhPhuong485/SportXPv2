import React from 'react';
import { Court, PlayerProfile } from '../../core/types/database.types';
import { LeaderboardScope, PlayerCourtRank } from './data/leaderboardRepository';

export type LeaderboardViewMode = 'all' | 'nearMe';

export interface LeaderboardViewProps {
  scope: LeaderboardScope;
  setScope: (s: LeaderboardScope) => void;
  courts: Court[];
  districts: string[];
  selectedCourtId: string;
  setSelectedCourtId: (id: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  onlyQualified: boolean;
  setOnlyQualified: (q: boolean) => void;
  viewMode: LeaderboardViewMode;
  setViewMode: (m: LeaderboardViewMode) => void;
  allPlayers: PlayerProfile[];
  displayPlayers: PlayerProfile[];
  eligibleForPodium: PlayerProfile[];
  userRankSummary: PlayerCourtRank | null;
  currentUserProfile?: PlayerProfile;
  currentUserId: string;
  loading: boolean;
  errorMessage: string | null;
  currentCourtName: string;
  hasPodium: boolean;
  onRefresh: () => void;
  onOpenCourtPicker: () => void;
  onSelectPlayer: (player: PlayerProfile, rank: number) => void;
  onScrollToMyRank: () => void;
  myRankRef: React.RefObject<HTMLDivElement>;
}
