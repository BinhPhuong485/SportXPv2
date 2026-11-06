import React from 'react';
import {
  RefreshCw,
  CircleDot,
  ChevronDown,
  Globe,
  MapPin,
  Users,
  Trophy,
  Activity,
  Layers,
} from 'lucide-react';
import { LeaderboardViewProps } from '../types';
import { LeaderboardScopeTabs } from '../presentation/widgets/LeaderboardScopeTabs';
import { LeaderboardFilterControls } from '../presentation/widgets/LeaderboardFilterControls';
import { LeaderboardPodium } from '../presentation/widgets/LeaderboardPodium';
import { DuolingoRankRow } from '../presentation/widgets/DuolingoRankRow';
import { DesktopStandingCard } from '../presentation/widgets/DesktopStandingCard';
import { RankTierInfoCard } from '../presentation/widgets/RankTierInfoCard';

export const LeaderboardDesktopView: React.FC<LeaderboardViewProps> = ({
  scope,
  setScope,
  courts,
  districts,
  selectedCourtId,
  selectedDistrict,
  setSelectedCourtId,
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 select-none flex flex-col gap-6 pb-20">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & BREADCRUMB / STATS BAR                    */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-app-surface border border-app-border/80 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <Trophy size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bảng xếp hạng VĐV Phong Trào
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hệ thống tính điểm Elo chuẩn hóa, cập nhật theo thời gian thực từ các set đấu
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Metadata */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{eligibleForPodium.length} VĐV tham gia</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới dữ liệu xếp hạng"
            className="h-10 px-4 rounded-xl border border-app-border/80 bg-white dark:bg-app-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin text-emerald-600' : 'text-slate-400'}
            />
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SCOPE TABS & SUB-SELECTOR                              */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3">
        {/* 3 Scope Tabs */}
        <div className="w-full max-w-xl mx-auto">
          <LeaderboardScopeTabs
            scope={scope}
            onSelectScope={(s) => {
              setScope(s);
              setViewMode('all');
            }}
          />
        </div>

        {/* Sub-selector Banner */}
        {scope === 'court' && (
          <div className="bg-white dark:bg-app-surface border border-app-border/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CircleDot size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {currentCourtName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                    Sân thi đấu
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đang hiển thị {allPlayers.length} vận động viên có hoạt động hoặc đăng ký sân nhà tại đây
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCourtPicker}
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <span>Đổi cụm sân khác</span>
              <ChevronDown size={15} />
            </button>
          </div>
        )}

        {scope === 'district' && (
          <div className="bg-white dark:bg-app-surface border border-app-border/80 rounded-2xl p-4 shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-300">
              <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Khu vực Quận / Huyện TP. Hồ Chí Minh:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDistrict === d
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/40 hover:text-emerald-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {scope === 'national' && (
          <div className="bg-white dark:bg-app-surface border border-app-border/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Globe size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Bảng tổng sắp Toàn quốc (SportXP National Tour)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Xếp hạng tổng hợp mọi vận động viên đã tham gia các trận cầu tính điểm Elo trên toàn hệ thống
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
              <Activity size={15} />
              <span>Xếp hạng chính thức</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN 2-COLUMN DESKTOP GRID                             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* ======================================================= */}
        {/* LEFT COLUMN: Controls + Top 3 Podium + Table (Col 8)     */}
        {/* ======================================================= */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
          {/* Controls Bar */}
          <LeaderboardFilterControls
            onlyQualified={onlyQualified}
            onToggleQualified={() => setOnlyQualified(!onlyQualified)}
            viewMode={viewMode}
            onSelectViewMode={setViewMode}
            totalCount={eligibleForPodium.length}
          />

          {/* Loading & Error States */}
          {loading && allPlayers.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 text-slate-400 text-xs shadow-2xs">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold">Đang tổng hợp dữ liệu bảng phong thần…</span>
            </div>
          ) : errorMessage && allPlayers.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 text-center px-4 shadow-2xs">
              <span className="text-sm text-slate-500 dark:text-slate-400">{errorMessage}</span>
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
              {/* Grand Top 3 Podium */}
              {hasPodium && (
                <LeaderboardPodium
                  eligibleForPodium={eligibleForPodium}
                  onSelectPlayer={onSelectPlayer}
                  onlyQualified={onlyQualified}
                  isDesktop={true}
                />
              )}

              {/* Main Leaderboard Table Container */}
              <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 overflow-hidden shadow-2xs">
                {/* Table Header */}
                <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-app-border/80 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-11 text-center">Hạng</span>
                    <span className="ml-2">Vận động viên & Cấp bậc</span>
                  </div>
                  <span className="mr-2">Điểm Elo</span>
                </div>

                {displayPlayers.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                    {onlyQualified
                      ? 'Chưa có vận động viên nào đạt tiêu chuẩn chính thức (≥ 5 trận) ở danh mục này.'
                      : 'Chưa có vận động viên nào trong danh mục xếp hạng này.'}
                  </div>
                ) : (
                  <div className="divide-y divide-app-border/40">
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
              </div>
            </>
          )}
        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: User Standing Card & Tier Guide (Col 4)   */}
        {/* ======================================================= */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-5 sticky top-20">
          {/* 1. Desktop User Standing Card */}
          <DesktopStandingCard
            userProfile={currentUserProfile}
            rankSummary={userRankSummary}
            onScrollToMyRank={onScrollToMyRank}
          />

          {/* 2. Rank Tier Guide Card */}
          <RankTierInfoCard />

          {/* 3. Popular Courts Quick Selector (When in Court Scope) */}
          {scope === 'court' && courts.length > 1 && (
            <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 p-5 shadow-2xs select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Cụm sân gợi ý
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={onOpenCourtPicker}
                  className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {courts.slice(0, 4).map((c) => {
                  const isSelected = c.id === selectedCourtId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCourtId(c.id)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CircleDot
                          size={13}
                          className={isSelected ? 'text-emerald-600' : 'text-slate-400'}
                        />
                        <span className="text-xs truncate">{c.name}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase">
                          Đang xem
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
