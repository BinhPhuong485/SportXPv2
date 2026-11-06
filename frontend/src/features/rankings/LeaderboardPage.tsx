import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { Court, PlayerProfile } from '../../core/types/database.types';
import {
  leaderboardRepository,
  LeaderboardScope,
  PlayerCourtRank,
} from './data/leaderboardRepository';
import { CourtPickerSheet } from './presentation/widgets/CourtPickerSheet';
import { PlayerDetailModal } from './presentation/widgets/PlayerDetailModal';
import { LeaderboardViewMode, LeaderboardViewProps } from './types';
import { LeaderboardDesktopView } from './views/LeaderboardDesktopView';
import { LeaderboardMobileView } from './views/LeaderboardMobileView';

export const LeaderboardPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const currentUserId = user?.id || '';

  // 3-tab Scope: 'court' | 'district' | 'national'
  const [scope, setScope] = useState<LeaderboardScope>('court');

  // Filter criteria
  const [courts, setCourts] = useState<Court[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [onlyQualified, setOnlyQualified] = useState<boolean>(false);

  // Loaded players
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>([]);
  const [displayPlayers, setDisplayPlayers] = useState<PlayerProfile[]>([]);
  const [userRankSummary, setUserRankSummary] = useState<PlayerCourtRank | null>(null);
  const [viewMode, setViewMode] = useState<LeaderboardViewMode>('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sheets & Modals state
  const [isCourtPickerOpen, setIsCourtPickerOpen] = useState(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<{
    player: PlayerProfile;
    rank: number;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const myRankRef = useRef<HTMLDivElement>(null!);

  // 1. Initial Load: Courts & Districts
  const loadInitialMetadata = useCallback(async () => {
    try {
      const [courtList, districtList] = await Promise.all([
        leaderboardRepository.getCourts(),
        leaderboardRepository.getDistricts(),
      ]);
      setCourts(courtList);
      setDistricts(districtList);

      let initialCourtId = selectedCourtId;
      if (!initialCourtId) {
        if (profile?.homeCourtId && courtList.some((c) => c.id === profile.homeCourtId)) {
          initialCourtId = profile.homeCourtId;
        } else if (courtList.length > 0) {
          initialCourtId = courtList[0].id;
        }
        setSelectedCourtId(initialCourtId);
      }

      if (!selectedDistrict && districtList.length > 0) {
        setSelectedDistrict(districtList[0]);
      }
    } catch (e: any) {
      console.warn('Failed loading metadata:', e);
    }
  }, [profile?.homeCourtId, selectedCourtId, selectedDistrict]);

  // 2. Fetch Leaderboard Data according to current scope & filters
  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let scopeTitle = 'Bảng xếp hạng';
      let courtIdArg: string | undefined = undefined;

      if (scope === 'court') {
        const c = courts.find((x) => x.id === selectedCourtId);
        scopeTitle = c ? c.name : 'Sân thi đấu';
        courtIdArg = selectedCourtId;
      } else if (scope === 'district') {
        scopeTitle = `Khu vực ${selectedDistrict || 'Quận/Huyện'}`;
      } else {
        scopeTitle = 'Toàn quốc';
      }

      const list = await leaderboardRepository.getLeaderboard({
        scope,
        courtId: scope === 'court' ? selectedCourtId : undefined,
        district: scope === 'district' ? selectedDistrict : undefined,
      });

      setAllPlayers(list);

      // Calculate current user rank in this view
      if (currentUserId) {
        const rankInfo = leaderboardRepository.getPlayerRank(
          currentUserId,
          list,
          scopeTitle,
          courtIdArg
        );
        setUserRankSummary(rankInfo);
      } else {
        setUserRankSummary(null);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Không thể tải bảng xếp hạng.');
    } finally {
      setLoading(false);
    }
  }, [scope, selectedCourtId, selectedDistrict, courts, currentUserId]);

  useEffect(() => {
    loadInitialMetadata();
  }, [loadInitialMetadata]);

  useEffect(() => {
    if (selectedCourtId || scope !== 'court') {
      fetchRankings();
    }
  }, [fetchRankings, scope, selectedCourtId, selectedDistrict]);

  // Apply qualification filter and view mode (all vs nearMe)
  useEffect(() => {
    let filtered = allPlayers;
    if (onlyQualified) {
      filtered = filtered.filter((p) => p.confirmedMatchesCount >= 5);
    }

    if (viewMode === 'all') {
      setDisplayPlayers(filtered);
    } else {
      const index = filtered.findIndex((p) => p.id === currentUserId);
      if (index === -1) {
        setDisplayPlayers(filtered.slice(0, 11));
      } else {
        const start = Math.max(0, index - 5);
        const end = Math.min(filtered.length, index + 6);
        setDisplayPlayers(filtered.slice(start, end));
      }
    }
  }, [viewMode, allPlayers, onlyQualified, currentUserId]);

  const handleSelectCourt = (courtId: string) => {
    if (courtId === selectedCourtId) return;
    setSelectedCourtId(courtId);
    setViewMode('all');
  };

  const handleScrollToMyRank = () => {
    if (myRankRef.current) {
      myRankRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setViewMode('nearMe');
      setTimeout(() => {
        myRankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentCourt = courts.find((c) => c.id === selectedCourtId);
  const currentCourtName = currentCourt?.name || 'Chọn sân thi đấu';
  const currentUserProfile =
    (allPlayers.find((p) => p.id === currentUserId) ||
      (profile as unknown as PlayerProfile)) ??
    undefined;

  const eligibleForPodium = onlyQualified
    ? allPlayers.filter((p) => p.confirmedMatchesCount >= 5)
    : allPlayers;
  const hasPodium = eligibleForPodium.length >= 1;

  const sharedProps: LeaderboardViewProps = {
    scope,
    setScope,
    courts,
    districts,
    selectedCourtId,
    setSelectedCourtId,
    selectedDistrict,
    setSelectedDistrict,
    onlyQualified,
    setOnlyQualified,
    viewMode,
    setViewMode,
    allPlayers,
    displayPlayers,
    eligibleForPodium,
    userRankSummary,
    currentUserProfile,
    currentUserId,
    loading,
    errorMessage,
    currentCourtName,
    hasPodium,
    onRefresh: fetchRankings,
    onOpenCourtPicker: () => setIsCourtPickerOpen(true),
    onSelectPlayer: (player, rank) => setSelectedPlayerModal({ player, rank }),
    onScrollToMyRank: handleScrollToMyRank,
    myRankRef,
  };

  return (
    <div className="min-h-full flex flex-col bg-app-background text-app-text select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-app-surface text-app-text border border-app-border shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* 1. DESKTOP VIEW (Visible on desktop screen >= 1024px) */}
      <div className="hidden lg:block w-full">
        <LeaderboardDesktopView {...sharedProps} />
      </div>

      {/* 2. MOBILE / TABLET VIEW (Visible on mobile/tablet screen < 1024px) */}
      <div className="block lg:hidden w-full px-2 sm:px-4 py-2 sm:py-4">
        <LeaderboardMobileView {...sharedProps} />
      </div>

      {/* Court Picker Sheet Modal */}
      {isCourtPickerOpen && (
        <CourtPickerSheet
          courts={courts}
          selectedCourtId={selectedCourtId}
          onSelectCourt={handleSelectCourt}
          onClose={() => setIsCourtPickerOpen(false)}
        />
      )}

      {/* Player Detail Modal */}
      {selectedPlayerModal && (
        <PlayerDetailModal
          player={selectedPlayerModal.player}
          rank={selectedPlayerModal.rank}
          isCurrentUser={selectedPlayerModal.player.id === currentUserId}
          onClose={() => setSelectedPlayerModal(null)}
          onInvite={(name) => showToast(`Đã gửi tín hiệu giao lưu tới ${name}!`)}
        />
      )}
    </div>
  );
};
