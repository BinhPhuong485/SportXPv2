import React from 'react';
import { RefreshCw, CircleDot, ChevronDown, Globe, TrendingUp } from 'lucide-react';
import { LeaderboardViewProps } from '../types';
import { LeaderboardScopeTabs } from '../presentation/widgets/LeaderboardScopeTabs';
import { LeaderboardFilterControls } from '../presentation/widgets/LeaderboardFilterControls';
import { LeaderboardPodium } from '../presentation/widgets/LeaderboardPodium';
import { DuolingoRankRow } from '../presentation/widgets/DuolingoRankRow';
import { MyFixedStandingBar } from '../presentation/widgets/MyFixedStandingBar';

export const LeaderboardMobileView: React.FC<LeaderboardViewProps> = ({
  scope,
  setScope,
  districts,
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
  onRefresh,
  onOpenCourtPicker,
  onSelectPlayer,
  onScrollToMyRank,
  myRankRef,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 select-none pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-app-text">
            Bảng xếp hạng
          </h1>
          <p className="text-xs text-app-muted mt-1 hidden sm:block">
            Theo dõi bảng phong thần và thứ hạng Elo VĐV đa chiều
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          title="Cập nhật bảng xếp hạng"
          className="h-9 px-3 rounded-xl border border-app-border bg-app-surface text-app-text hover:border-app-primary/40 font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin text-app-primary' : 'text-app-muted'}
          />
          <span className="hidden sm:inline">Cập nhật</span>
        </button>
      </div>

      {/* 3 Scope Tabs */}
      <LeaderboardScopeTabs
        scope={scope}
        onSelectScope={(s) => {
          setScope(s);
          setViewMode('all');
        }}
      />

      {/* Sub-selector depending on Scope */}
      {scope === 'court' && (
        <button
          type="button"
          onClick={onOpenCourtPicker}
          className="w-full p-3.5 rounded-2xl bg-white dark:bg-app-surface border border-app-border/80 flex items-center justify-between text-left hover:border-emerald-500/50 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedDistrict === d
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-app-surface text-app-muted border border-app-border hover:border-emerald-500/40'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {scope === 'national' && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-app-surface border border-app-border/80 flex items-center gap-3 shadow-2xs">
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

      {/* Filter Controls */}
      <LeaderboardFilterControls
        onlyQualified={onlyQualified}
        onToggleQualified={() => setOnlyQualified(!onlyQualified)}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        totalCount={eligibleForPodium.length}
      />

      {/* Loading & Error States */}
      {loading && allPlayers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải bảng xếp hạng…</span>
        </div>
      ) : errorMessage && allPlayers.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
          <span className="text-sm text-app-muted">{errorMessage}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {hasPodium && (
            <LeaderboardPodium
              eligibleForPodium={eligibleForPodium}
              onSelectPlayer={onSelectPlayer}
              onlyQualified={onlyQualified}
              isDesktop={false}
            />
          )}

          {/* Motivation banner */}
          {userRankSummary?.pointsToNextRank != null && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-3 shadow-2xs">
              <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-snug">
                Còn {userRankSummary.pointsToNextRank} Elo để vượt{' '}
                {userRankSummary.nextPlayerName ?? 'vị trí phía trên'}
              </span>
            </div>
          )}

          {/* Player List */}
          {displayPlayers.length === 0 ? (
            <div className="py-10 text-center text-xs text-app-muted bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 p-4 shadow-2xs">
              {onlyQualified
                ? 'Chưa có vận động viên nào hoàn thành đủ 5 trận đấu ở danh mục này.'
                : 'Chưa có vận động viên nào trong danh mục xếp hạng này.'}
            </div>
          ) : (
            <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 overflow-hidden shadow-2xs divide-y divide-app-border/40">
              {displayPlayers.map((player) => {
                const playerRank = eligibleForPodium.findIndex((p) => p.id === player.id) + 1;
                const isCurrent = player.id === currentUserId;
                return (
                  <div key={player.id} ref={isCurrent ? myRankRef : undefined}>
                    <DuolingoRankRow
                      player={player}
                      rank={playerRank > 0 ? playerRank : 999}
                      isCurrentUser={isCurrent}
                      showDivider={false}
                      onTap={() => onSelectPlayer(player, playerRank > 0 ? playerRank : 999)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Floating Sticky Bar on Mobile */}
      {userRankSummary && currentUserProfile && (
        <div className="fixed bottom-18 left-0 right-0 z-30 pointer-events-none px-3 sm:px-4">
          <div className="max-w-md mx-auto pointer-events-auto shadow-2xl">
            <MyFixedStandingBar
              userProfile={currentUserProfile}
              rankSummary={userRankSummary}
              onScrollToMyRank={onScrollToMyRank}
            />
          </div>
        </div>
      )}
    </div>
  );
};
