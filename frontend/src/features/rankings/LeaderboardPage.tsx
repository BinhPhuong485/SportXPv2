import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  CircleDot,
  ChevronDown,
  Trophy,
  TrendingUp,
  Medal,
  MapPin,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { Court, PlayerProfile } from '../../core/types/database.types';
import {
  leaderboardRepository,
  LeaderboardScope,
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

  const myRankRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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
  const currentUserProfile = allPlayers.find((p) => p.id === currentUserId);

  const eligibleForPodium = onlyQualified
    ? allPlayers.filter((p) => p.confirmedMatchesCount >= 5)
    : allPlayers;
  const hasPodium = eligibleForPodium.length >= 1;
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
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 pb-28 max-w-4xl w-full mx-auto flex flex-col gap-4"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-app-text">
              Bảng xếp hạng
            </h1>
            <p className="text-xs md:text-sm text-app-muted mt-1 hidden sm:block">
              Theo dõi bảng phong thần và thứ hạng Elo VĐV đa chiều
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRankings}
            title="Cập nhật bảng xếp hạng"
            className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl border border-app-border bg-app-surface text-app-text hover:border-app-primary/40 font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin text-app-primary' : 'text-app-muted'}
            />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        </div>

        {/* 3 Scope Tabs (Cụm sân / Quận / Toàn quốc) */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-app-surface border border-app-border gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setScope('court');
              setViewMode('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              scope === 'court'
                ? 'bg-app-primary text-app-on-primary shadow-xs'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            <CircleDot size={14} />
            <span>Cụm sân</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScope('district');
              setViewMode('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              scope === 'district'
                ? 'bg-app-primary text-app-on-primary shadow-xs'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            <MapPin size={14} />
            <span>Quận / Huyện</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setScope('national');
              setViewMode('all');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              scope === 'national'
                ? 'bg-app-primary text-app-on-primary shadow-xs'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            <Globe size={14} />
            <span>Toàn quốc</span>
          </button>
        </div>

        {/* Sub-selector depending on Scope */}
        {scope === 'court' && (
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
                  {allPlayers.length} tay vợt đăng ký sân nhà
                </span>
              </div>
            </div>
            <ChevronDown size={18} className="text-app-muted shrink-0 ml-2" />
          </button>
        )}

        {scope === 'district' && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-app-muted px-1">Chọn Quận / Khu vực:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedDistrict === d
                      ? 'bg-app-primary text-app-on-primary shadow-xs'
                      : 'bg-app-surface text-app-muted border border-app-border hover:border-app-primary/40'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {scope === 'national' && (
          <div className="p-3.5 rounded-2xl bg-app-surface border border-app-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Globe size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-app-text">Bảng tổng sắp Toàn quốc</span>
              <span className="text-xs text-app-muted">
                Tổng hợp tất cả các tay vợt phong trào đã hoàn thành onboarding
              </span>
            </div>
          </div>
        )}

        {/* Qualification Gate & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Official Qualification Filter Toggle */}
          <button
            type="button"
            onClick={() => setOnlyQualified(!onlyQualified)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              onlyQualified
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-app-surface text-app-muted border-app-border hover:text-app-text'
            }`}
          >
            <ShieldCheck size={14} className={onlyQualified ? 'text-emerald-500' : 'text-app-muted'} />
            <span>Chỉ hiện VĐV chính thức (≥ 5 trận)</span>
          </button>

          {/* All vs Near Me Segmented Switch */}
          <div className="p-1 bg-app-surface rounded-[14px] border border-app-border flex gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'all'
                  ? 'bg-app-primary text-app-on-primary shadow-xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Tất cả ({eligibleForPodium.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('nearMe')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'nearMe'
                  ? 'bg-app-primary text-app-on-primary shadow-xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Quanh bạn (±5)
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
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
              onClick={fetchRankings}
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
              <div className="flex flex-col gap-3 mt-1 bg-app-surface border border-app-border rounded-2xl p-3.5 md:p-6 shadow-xs">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs md:text-sm font-bold text-app-muted uppercase tracking-wider">
                    Vinh danh Top 3
                  </span>
                  <span className="text-xs text-app-primary font-bold hidden sm:inline">
                    {onlyQualified ? 'VĐV chính thức' : 'Mọi VĐV'}
                  </span>
                </div>

                <div className="grid grid-cols-3 items-end gap-2 md:gap-6 pt-2 pb-1 max-w-2xl mx-auto w-full">
                  {/* Rank #2 (Left) */}
                  {eligibleForPodium[1] ? (
                    <div
                      onClick={() =>
                        setSelectedPlayerModal({ player: eligibleForPodium[1], rank: 2 })
                      }
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <Medal
                        size={36}
                        className="text-slate-400 mb-2 drop-shadow-xs group-hover:scale-110 transition-transform"
                      />
                      <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
                        {eligibleForPodium[1].displayName}
                      </span>
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                        {eligibleForPodium[1].eloRating ?? '—'} Elo
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
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">—</span>
                      <div className="w-full h-11 mt-2.5 rounded-t-[14px] bg-app-surface/60 border-t-3 border-t-app-border flex items-center justify-center shadow-xs">
                        <span className="text-lg font-extrabold text-app-muted">#2</span>
                      </div>
                    </div>
                  )}

                  {/* Rank #1 (Center - Champion) */}
                  <div
                    onClick={() =>
                      setSelectedPlayerModal({ player: eligibleForPodium[0], rank: 1 })
                    }
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <Trophy
                      size={44}
                      className="text-app-streak mb-2 drop-shadow-sm group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs font-extrabold text-app-text text-center truncate max-w-full px-1">
                      {eligibleForPodium[0].displayName}
                    </span>
                    <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                      {eligibleForPodium[0].eloRating ?? '—'} Elo
                    </span>
                    <div className="w-full h-16 mt-2.5 rounded-t-[14px] bg-app-surface border-t-3 border-t-app-streak flex items-center justify-center shadow-xs">
                      <span className="text-xl font-black text-app-streak">#1</span>
                    </div>
                  </div>

                  {/* Rank #3 (Right) */}
                  {eligibleForPodium[2] ? (
                    <div
                      onClick={() =>
                        setSelectedPlayerModal({ player: eligibleForPodium[2], rank: 3 })
                      }
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <Medal
                        size={34}
                        className="text-amber-700 dark:text-amber-500 mb-2 drop-shadow-xs group-hover:scale-110 transition-transform"
                      />
                      <span className="text-xs font-bold text-app-text text-center truncate max-w-full px-1">
                        {eligibleForPodium[2].displayName}
                      </span>
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">
                        {eligibleForPodium[2].eloRating ?? '—'} Elo
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
                      <span className="text-[11px] text-app-muted tabular-nums mt-0.5">—</span>
                      <div className="w-full h-9 mt-2.5 rounded-t-[14px] bg-app-surface/60 border-t-3 border-t-app-border flex items-center justify-center shadow-xs">
                        <span className="text-base font-extrabold text-app-muted">#3</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Motivation banner */}
            {userRankSummary?.pointsToNextRank != null && (
              <div className="p-4 rounded-2xl bg-app-mint flex items-center gap-3 shadow-xs">
                <TrendingUp size={20} className="text-app-primary shrink-0" />
                <span className="text-xs font-bold text-app-primary leading-snug">
                  Còn {userRankSummary.pointsToNextRank} Elo để vượt{' '}
                  {userRankSummary.nextPlayerName ?? 'vị trí phía trên'}
                </span>
              </div>
            )}

            {/* Ranked List Section */}
            {listPlayers.length === 0 ? (
              <div className="py-10 text-center text-xs text-app-muted bg-app-surface rounded-2xl border border-app-border p-4">
                {onlyQualified
                  ? 'Chưa có vận động viên nào hoàn thành đủ 5 trận đấu ở danh mục này.'
                  : 'Chưa có vận động viên nào trong danh mục xếp hạng này.'}
              </div>
            ) : (
              <div className="bg-app-surface rounded-2xl border border-app-border overflow-hidden shadow-xs divide-y divide-app-border/40">
                {listPlayers.map((player) => {
                  const playerRank = eligibleForPodium.findIndex((p) => p.id === player.id) + 1;
                  const isCurrent = player.id === currentUserId;
                  return (
                    <div key={player.id} ref={isCurrent ? myRankRef : null}>
                      <DuolingoRankRow
                        player={player}
                        rank={playerRank > 0 ? playerRank : 999}
                        isCurrentUser={isCurrent}
                        showDivider={false}
                        onTap={() =>
                          setSelectedPlayerModal({
                            player,
                            rank: playerRank > 0 ? playerRank : 999,
                          })
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
      {userRankSummary && currentUserProfile && (
        <div className="sticky bottom-20 lg:bottom-4 z-30 w-full pointer-events-none">
          <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 pointer-events-auto">
            <MyFixedStandingBar
              userProfile={currentUserProfile}
              rankSummary={userRankSummary}
              onScrollToMyRank={handleScrollToMyRank}
            />
          </div>
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
