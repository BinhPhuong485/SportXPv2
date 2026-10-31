import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, CircleDot, ChevronDown, Trophy, TrendingUp, Medal } from 'lucide-react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { Court, PlayerProfile } from '../../core/types/database.types';
import {
  leaderboardRepository,
  PlayerCourtRank,
} from './data/leaderboardRepository';
import { CourtPickerSheet } from './presentation/widgets/CourtPickerSheet';
import { DuolingoRankRow } from './presentation/widgets/DuolingoRankRow';
import { MyFixedStandingBar } from './presentation/widgets/MyFixedStandingBar';
import { PlayerDetailModal } from './presentation/widgets/PlayerDetailModal';

type LeaderboardViewMode = 'all' | 'nearMe';

export const LeaderboardPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const currentUserId = user?.id || '';

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>([]);
  const [displayPlayers, setDisplayPlayers] = useState<PlayerProfile[]>([]);
  const [userCourtRank, setUserCourtRank] = useState<PlayerCourtRank | null>(null);
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

  const myRankRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load initial courts and data
  const loadCourtsAndData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const courtsList = await leaderboardRepository.getCourts();
      setCourts(courtsList);

      let courtId = selectedCourtId;
      if (!courtId) {
        if (profile?.homeCourtId && courtsList.some((c) => c.id === profile.homeCourtId)) {
          courtId = profile.homeCourtId;
        } else if (courtsList.length > 0) {
          courtId = courtsList[0].id;
        }
        setSelectedCourtId(courtId);
      }

      if (courtId) {
        await loadLeaderboardForCourt(courtId);
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Không thể tải danh sách sân.');
      setLoading(false);
    }
  }, [selectedCourtId, profile?.homeCourtId]);

  // Sync to home court whenever profile updates (and court exists)
  useEffect(() => {
    if (profile?.homeCourtId && courts.length > 0 && courts.some((c) => c.id === profile.homeCourtId)) {
      if (selectedCourtId !== profile.homeCourtId) {
        setSelectedCourtId(profile.homeCourtId);
        loadLeaderboardForCourt(profile.homeCourtId);
      }
    }
  }, [profile?.homeCourtId, courts]);

  const loadLeaderboardForCourt = async (courtId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [list, rankInfo] = await Promise.all([
        leaderboardRepository.getCourtLeaderboard(courtId),
        currentUserId
          ? leaderboardRepository.getPlayerCourtRank(currentUserId, courtId)
          : Promise.resolve(null),
      ]);

      setAllPlayers(list);
      setUserCourtRank(rankInfo);
      setLoading(false);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Không thể tải bảng xếp hạng.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourtsAndData();
  }, [loadCourtsAndData]);

  // Apply view mode
  useEffect(() => {
    if (viewMode === 'all') {
      setDisplayPlayers(allPlayers);
    } else {
      const index = allPlayers.findIndex((p) => p.id === currentUserId);
      if (index === -1) {
        setDisplayPlayers(allPlayers.slice(0, 11));
      } else {
        const start = Math.max(0, index - 5);
        const end = Math.min(allPlayers.length, index + 6);
        setDisplayPlayers(allPlayers.slice(start, end));
      }
    }
  }, [viewMode, allPlayers, currentUserId]);

  const handleSelectCourt = (courtId: string) => {
    if (courtId === selectedCourtId) return;
    setSelectedCourtId(courtId);
    setViewMode('all');
    loadLeaderboardForCourt(courtId);
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
  const currentCourtName = currentCourt?.name || 'Sân thi đấu';
  const currentUserProfile = allPlayers.find((p) => p.id === currentUserId);

  const hasPodium = viewMode === 'all' && allPlayers.length >= 1;
  const listPlayers = displayPlayers;

  return (
    <div className="min-h-full flex flex-col bg-app-background text-app-text select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-app-surface text-app-text border border-app-border shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Scroll Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 pb-24 max-w-[720px] w-full mx-auto flex flex-col gap-4"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-app-text">
            Bảng xếp hạng
          </h1>
          <button
            type="button"
            onClick={loadCourtsAndData}
            title="Cập nhật bảng xếp hạng"
            className="w-10 h-10 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-surface/60 active:scale-95 transition-all"
          >
            <RefreshCw size={19} className={loading ? 'animate-spin text-app-primary' : ''} />
          </button>
        </div>

        {/* Court Selector Button */}
        <button
          type="button"
          onClick={() => setIsCourtPickerOpen(true)}
          className="w-full p-3.5 rounded-[14px] bg-app-surface border border-app-border flex items-center justify-between text-left hover:border-app-primary/50 active:scale-[0.99] transition-all shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-app-primary/10 flex items-center justify-center text-app-primary shrink-0">
              <CircleDot size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-bold text-app-text truncate">
                {currentCourtName}
              </span>
              <span className="text-xs text-app-muted mt-0.5">
                {allPlayers.length} tay vợt
              </span>
            </div>
          </div>
          <ChevronDown size={18} className="text-app-muted shrink-0 ml-2" />
        </button>

        {/* Loading Spinner */}
        {loading && allPlayers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
            <div className="w-7 h-7 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang tải bảng xếp hạng…</span>
          </div>
        ) : errorMessage && allPlayers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
            <span className="text-sm text-app-muted">{errorMessage}</span>
            <button
              type="button"
              onClick={loadCourtsAndData}
              className="px-4 py-2 rounded-xl bg-app-primary text-app-on-primary font-bold text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Thử lại</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {hasPodium && (
              <div className="flex flex-col gap-3 mt-1">
                <span className="text-xs font-bold text-app-muted px-1">
                  Top tay vợt tại sân
                </span>

                <div className="grid grid-cols-3 items-end gap-2 pt-2 pb-1">
                  {/* Rank #2 (Left) */}
                  {allPlayers[1] ? (
                    <div
                      onClick={() =>
                        setSelectedPlayerModal({ player: allPlayers[1], rank: 2 })
                      }
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <Medal size={36} className="text-slate-400 mb-2 drop-shadow-xs group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
                        {allPlayers[1].displayName}
                      </span>
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                        {allPlayers[1].eloRating ?? '—'} Elo
                      </span>
                      <div className="w-full h-11 mt-2.5 rounded-t-[14px] bg-app-surface border-t-3 border-t-app-primary flex items-center justify-center shadow-xs">
                        <span className="text-lg font-extrabold text-app-primary">#2</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-40">
                      <Medal size={30} className="text-app-muted/40 mb-2" />
                      <span className="text-xs font-medium text-app-muted text-center truncate max-w-full px-1">
                        Trống
                      </span>
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                        —
                      </span>
                      <div className="w-full h-11 mt-2.5 rounded-t-[14px] bg-app-surface/60 border-t-3 border-t-app-border flex items-center justify-center shadow-xs">
                        <span className="text-lg font-extrabold text-app-muted">#2</span>
                      </div>
                    </div>
                  )}

                  {/* Rank #1 (Center - Champion) */}
                  <div
                    onClick={() =>
                      setSelectedPlayerModal({ player: allPlayers[0], rank: 1 })
                    }
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <Trophy size={44} className="text-app-streak mb-2 drop-shadow-sm group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-extrabold text-app-text text-center truncate max-w-full px-1">
                      {allPlayers[0].displayName}
                    </span>
                    <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                      {allPlayers[0].eloRating ?? '—'} Elo
                    </span>
                    <div className="w-full h-16 mt-2.5 rounded-t-[14px] bg-app-surface border-t-3 border-t-app-streak flex items-center justify-center shadow-xs">
                      <span className="text-xl font-black text-app-streak">#1</span>
                    </div>
                  </div>

                  {/* Rank #3 (Right) */}
                  {allPlayers[2] ? (
                    <div
                      onClick={() =>
                        setSelectedPlayerModal({ player: allPlayers[2], rank: 3 })
                      }
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <Medal size={34} className="text-amber-700 dark:text-amber-500 mb-2 drop-shadow-xs group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
                        {allPlayers[2].displayName}
                      </span>
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                        {allPlayers[2].eloRating ?? '—'} Elo
                      </span>
                      <div className="w-full h-9 mt-2.5 rounded-t-[14px] bg-app-surface border-t-3 border-t-app-primary flex items-center justify-center shadow-xs">
                        <span className="text-base font-extrabold text-app-primary">#3</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-40">
                      <Medal size={28} className="text-app-muted/40 mb-2" />
                      <span className="text-xs font-medium text-app-muted text-center truncate max-w-full px-1">
                        Trống
                      </span>
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                        —
                      </span>
                      <div className="w-full h-9 mt-2.5 rounded-t-[14px] bg-app-surface/60 border-t-3 border-t-app-border flex items-center justify-center shadow-xs">
                        <span className="text-base font-extrabold text-app-muted">#3</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Motivation banner */}
            {userCourtRank?.pointsToNextRank != null && (
              <div className="p-4 rounded-2xl bg-app-mint flex items-center gap-3 shadow-xs">
                <TrendingUp size={20} className="text-app-primary shrink-0" />
                <span className="text-xs font-bold text-app-primary leading-snug">
                  Còn {userCourtRank.pointsToNextRank} Elo để vượt{' '}
                  {userCourtRank.nextPlayerName ?? 'vị trí phía trên'}
                </span>
              </div>
            )}

            {/* Segmented Button View Mode */}
            <div className="w-full p-1 bg-app-surface rounded-[14px] border border-app-border grid grid-cols-2 gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  viewMode === 'all'
                    ? 'bg-app-primary text-app-on-primary shadow-xs'
                    : 'text-app-muted hover:text-app-text'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setViewMode('nearMe')}
                className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  viewMode === 'nearMe'
                    ? 'bg-app-primary text-app-on-primary shadow-xs'
                    : 'text-app-muted hover:text-app-text'
                }`}
              >
                Quanh bạn (±5)
              </button>
            </div>

            {/* Ranked List Section */}
            {listPlayers.length === 0 ? (
              allPlayers.length === 0 ? (
                <div className="py-8 text-center text-xs text-app-muted bg-app-surface rounded-2xl border border-app-border p-4">
                  Chưa có vận động viên trong bảng xếp hạng sân này.
                </div>
              ) : null
            ) : (
              <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden shadow-xs divide-y divide-app-border/40">
                {listPlayers.map((player) => {
                  const playerRank = allPlayers.findIndex((p) => p.id === player.id) + 1;
                  const isCurrent = player.id === currentUserId;
                  return (
                    <div
                      key={player.id}
                      ref={isCurrent ? myRankRef : null}
                    >
                      <DuolingoRankRow
                        player={player}
                        rank={playerRank}
                        isCurrentUser={isCurrent}
                        showDivider={false}
                        onTap={() =>
                          setSelectedPlayerModal({ player, rank: playerRank })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Sticky MyStandingBar at Bottom */}
      {userCourtRank && currentUserProfile && (
        <div className="sticky bottom-0 z-30">
          <MyFixedStandingBar
            userProfile={currentUserProfile}
            rankSummary={userCourtRank}
            onScrollToMyRank={handleScrollToMyRank}
          />
        </div>
      )}

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
