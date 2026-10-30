import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, CircleDot, ChevronDown, Trophy, TrendingUp, Medal, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { Court, PlayerProfile } from '../../core/types/database.types';
import {
  leaderboardRepository,
  PlayerCourtRank,
  getPlayerInitials,
} from './data/leaderboardRepository';
import { CourtPickerSheet } from './presentation/widgets/CourtPickerSheet';
import { DuolingoRankRow } from './presentation/widgets/DuolingoRankRow';
import { MyFixedStandingBar } from './presentation/widgets/MyFixedStandingBar';
import { PlayerDetailModal } from './presentation/widgets/PlayerDetailModal';
import { EmptyState } from '../../shared/components/EmptyState';

type LeaderboardViewMode = 'all' | 'nearMe';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuthStore();
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
      if (!courtId && courtsList.length > 0) {
        courtId = courtsList[0].id;
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
  }, [selectedCourtId]);

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

  const hasPodium = viewMode === 'all' && allPlayers.length >= 3;
  const listPlayers = hasPodium ? displayPlayers.slice(3) : displayPlayers;

  return (
    <div className="min-h-full flex flex-col bg-app-background text-app-text select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-btn bg-app-surface text-app-text border border-app-border shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Scroll Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 pb-28 max-w-[720px] w-full mx-auto flex flex-col gap-4"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-app-text">
              Bảng xếp hạng
            </h1>
            <p className="text-xs text-app-muted mt-0.5">
              Hệ thống xếp hạng Elo theo câu lạc bộ & khu vực
            </p>
          </div>
          <button
            type="button"
            onClick={loadCourtsAndData}
            title="Cập nhật bảng xếp hạng"
            className="w-10 h-10 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-surface border border-transparent hover:border-app-border active:scale-95 transition-all"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-app-primary' : ''} />
          </button>
        </div>

        {/* Court Selector Button */}
        <button
          type="button"
          onClick={() => setIsCourtPickerOpen(true)}
          className="w-full p-3.5 rounded-bento bg-app-surface border border-app-border shadow-xs hover:border-app-primary/50 flex items-center justify-between text-left active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center text-app-primary shrink-0 group-hover:scale-105 transition-transform">
              <CircleDot size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-black text-app-text truncate group-hover:text-app-primary transition-colors">
                {currentCourtName}
              </span>
              <span className="text-xs text-app-muted mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-app-primary" />
                {allPlayers.length} tay vợt đang tranh tài
              </span>
            </div>
          </div>
          <ChevronDown size={18} className="text-app-muted shrink-0 ml-2 group-hover:text-app-text transition-colors" />
        </button>

        {/* Loading Spinner */}
        {loading && allPlayers.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
            <div className="w-8 h-8 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Đang tải bảng xếp hạng…</span>
          </div>
        ) : errorMessage && allPlayers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4 bg-app-surface rounded-bento border border-app-border">
            <span className="text-sm text-app-muted">{errorMessage}</span>
            <button
              type="button"
              onClick={loadCourtsAndData}
              className="px-4 py-2.5 rounded-btn bg-app-primary text-app-on-primary font-bold text-xs flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all shadow-xs"
            >
              <RefreshCw size={14} />
              <span>Thử lại</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Card with Double Bezel */}
            {hasPodium && (
              <div className="relative rounded-bento bg-app-surface border border-app-border p-4 pt-5 pb-3 overflow-hidden shadow-xs">
                {/* Court watermark accent */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-radial from-app-primary/10 to-transparent pointer-events-none -mr-16 -mt-16 rounded-full" />
                
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <Medal size={16} className="text-app-gold" />
                    <span className="text-xs font-black tracking-wider uppercase text-app-text">
                      Top 3 Xuất Sắc Nhất
                    </span>
                  </div>
                  <span className="text-[11px] text-app-muted font-medium flex items-center gap-1">
                    <Sparkles size={12} className="text-app-primary" />
                    Dẫn đầu sân
                  </span>
                </div>

                <div className="grid grid-cols-3 items-end gap-2.5 pt-1">
                  {/* Rank #2 (Left - Silver) */}
                  <div
                    onClick={() =>
                      setSelectedPlayerModal({ player: allPlayers[1], rank: 2 })
                    }
                    role="button"
                    tabIndex={0}
                    className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="relative mb-2">
                      <div className="w-13 h-13 rounded-full bg-app-background border-2 border-app-border flex items-center justify-center text-sm font-black text-app-text shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        {getPlayerInitials(allPlayers[1].displayName)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-[10px] font-black text-app-muted shadow-xs">
                        2
                      </span>
                    </div>
                    <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
                      {allPlayers[1].displayName}
                    </span>
                    <span className="text-[11px] font-semibold text-app-muted tabular-nums mt-0.5">
                      {allPlayers[1].eloRating ?? '—'} Elo
                    </span>
                    <div className="w-full h-12 mt-2 rounded-t-xl bg-app-background/90 border-t-2 border-t-app-muted/60 flex items-center justify-center shadow-inner">
                      <span className="text-base font-black text-app-muted">#2</span>
                    </div>
                  </div>

                  {/* Rank #1 (Center - Gold Champion) */}
                  <div
                    onClick={() =>
                      setSelectedPlayerModal({ player: allPlayers[0], rank: 1 })
                    }
                    role="button"
                    tabIndex={0}
                    className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform z-10"
                  >
                    <Trophy size={22} className="text-app-gold animate-bounce-subtle mb-1" />
                    <div className="relative mb-2">
                      <div className="w-16 h-16 rounded-full bg-app-mint border-2 border-app-gold ring-4 ring-app-gold/20 flex items-center justify-center text-base font-black text-app-streak shrink-0 group-hover:scale-105 transition-transform shadow-md">
                        {getPlayerInitials(allPlayers[0].displayName)}
                      </div>
                      <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-app-gold text-white flex items-center justify-center text-xs font-black shadow-sm">
                        👑
                      </span>
                    </div>
                    <span className="text-xs font-black text-app-text text-center truncate max-w-full px-1">
                      {allPlayers[0].displayName}
                    </span>
                    <span className="text-[11px] font-bold text-app-streak tabular-nums mt-0.5">
                      {allPlayers[0].eloRating ?? '—'} Elo
                    </span>
                    <div className="w-full h-18 mt-2 rounded-t-xl bg-app-mint/40 border-t-3 border-t-app-gold flex items-center justify-center shadow-inner">
                      <span className="text-xl font-black text-app-gold">#1</span>
                    </div>
                  </div>

                  {/* Rank #3 (Right - Bronze) */}
                  <div
                    onClick={() =>
                      setSelectedPlayerModal({ player: allPlayers[2], rank: 3 })
                    }
                    role="button"
                    tabIndex={0}
                    className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="relative mb-2">
                      <div className="w-13 h-13 rounded-full bg-app-background border-2 border-amber-600/40 dark:border-amber-400/40 flex items-center justify-center text-sm font-black text-amber-700 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        {getPlayerInitials(allPlayers[2].displayName)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-[10px] font-black text-amber-600 dark:text-amber-400 shadow-xs">
                        3
                      </span>
                    </div>
                    <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
                      {allPlayers[2].displayName}
                    </span>
                    <span className="text-[11px] font-semibold text-app-muted tabular-nums mt-0.5">
                      {allPlayers[2].eloRating ?? '—'} Elo
                    </span>
                    <div className="w-full h-10 mt-2 rounded-t-xl bg-app-background/90 border-t-2 border-t-amber-600/60 dark:border-t-amber-400/60 flex items-center justify-center shadow-inner">
                      <span className="text-base font-black text-amber-700 dark:text-amber-400">#3</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motivation banner */}
            {userCourtRank?.pointsToNextRank != null && (
              <div className="p-3.5 rounded-btn bg-app-mint border border-app-primary/25 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-app-primary/20 flex items-center justify-center text-app-primary shrink-0">
                  <TrendingUp size={18} />
                </div>
                <span className="text-xs font-bold text-app-primary leading-snug">
                  Còn <span className="font-black underline">{userCourtRank.pointsToNextRank} Elo</span> để vượt{' '}
                  <span className="font-black">{userCourtRank.nextPlayerName ?? 'vị trí phía trên'}</span>
                </span>
              </div>
            )}

            {/* Segmented Button View Mode */}
            <div className="w-full p-1 bg-app-surface rounded-btn border border-app-border grid grid-cols-2 gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                  viewMode === 'all'
                    ? 'bg-app-primary text-app-on-primary shadow-xs'
                    : 'text-app-muted hover:text-app-text'
                }`}
              >
                Tất cả ({allPlayers.length})
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
              <EmptyState
                type="racket"
                title="Chưa có vận động viên"
                description="Bảng xếp hạng tại sân này chưa có người chơi nào ghi nhận kết quả."
              />
            ) : (
              <div className="bg-app-surface rounded-bento border border-app-border overflow-hidden shadow-xs divide-y divide-app-border/40">
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
