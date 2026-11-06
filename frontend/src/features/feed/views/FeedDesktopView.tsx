import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Users,
  MapPin,
  Clock,
  Shield,
  Activity,
  Flame,
  Plus,
  RefreshCw,
  Bell,
  ChevronRight,
  Star,
  Swords,
  TrendingUp,
  UserCheck,
  Radio,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { FeedViewProps } from '../types';
import { PostCard } from '../components/PostCard';
import { PostSkeleton } from '../components/PostSkeleton';
import { Avatar } from '../../../shared/components/Avatar';
import { RoomUiFormatters } from '../../rooms/presentation/widgets/roomUiFormatters';
import { getNextTierProgress } from '../../profile/domain/playerProfile';

export const FeedDesktopView: React.FC<FeedViewProps> = ({
  posts,
  filteredPosts,
  upcomingEvents,
  activeTab,
  setActiveTab,
  loading,
  profile,
  expandedPostIds,
  onToggleExpand,
  onToggleLike,
  onOpenCommentDrawer,
  onOpenCreateModal,
  onRefreshFeed,
  onShowToast,
  urgentRoom,
  suggestedPlayers,
  courts,
}) => {
  const navigate = useNavigate();
  const tierProgress = getNextTierProgress(profile?.eloRating);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 select-none pb-12">
      {/* ========================================================= */}
      {/* TOP TELEMETRY STATUS TICKER (Stitch Screen 3 Pattern)       */}
      {/* ========================================================= */}
      <div className="w-full bg-white dark:bg-app-surface border border-app-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE SERVERS
          </span>
          <span className="text-app-text font-medium text-xs">
            Khu vực: TP. Hồ Chí Minh & TP. Thủ Đức
          </span>
          <span className="text-app-muted/60 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-app-muted font-medium">
            142 Trận đang diễn ra
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-app-text font-medium text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">894</span> VĐV trực tuyến
          </span>
          <button
            type="button"
            onClick={() => onShowToast('Hệ thống thông báo: 3 lịch thi đấu mới trong tuần!')}
            className="flex items-center gap-1.5 text-app-text hover:text-emerald-600 transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-app-border px-2.5 py-1 rounded-lg font-semibold text-xs"
          >
            <Bell size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Thông báo (3 mới)</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3-COLUMN DESKTOP WORKSPACE (Cols: 3 - 6 - 3)               */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================= */}
        {/* COLUMN 1: LEFT ATHLETE PROFILE & METRICS (3 Cols / 280px) */}
        {/* ========================================================= */}
        <aside className="lg:col-span-3 space-y-4 sticky top-18">
          {/* Card 1: Player Identity Bento Card */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col">
            {/* Ambient Corner Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header: Avatar with PRO badge + Rank tag */}
            <div className="flex items-start justify-between">
              <div
                onClick={() => navigate('/profile')}
                className="relative cursor-pointer group"
              >
                <Avatar
                  src={profile?.avatarUrl}
                  alt={profile?.displayName}
                  size="xl"
                  className="w-15 h-15 rounded-xl object-cover shadow-xs ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition-all"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white shadow-2xs px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider">
                  PRO
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold uppercase tracking-wider">
                  {profile?.tierName || 'Tân binh'}
                </span>
                <p className="font-mono text-[10px] text-app-muted mt-1 font-semibold">
                  {profile?.homeCourtName ? `Sân nhà: ${profile.homeCourtName}` : 'Chưa chọn sân nhà'}
                </p>
              </div>
            </div>

            {/* Athlete Name & Playstyle */}
            <div className="mt-3.5">
              <h2
                onClick={() => navigate('/profile')}
                className="text-base font-bold text-app-text tracking-tight hover:text-emerald-600 cursor-pointer transition-colors flex items-center gap-1"
              >
                <span>{profile?.displayName || 'Vận Động Viên'}</span>
                {profile?.isIdentityVerified && (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                )}
              </h2>
              <p className="text-xs text-app-muted mt-0.5 font-medium">
                {profile?.bio || 'VĐV Cầu lông phong trào • TP. Hồ Chí Minh'}
              </p>
            </div>

            {/* 2x2 Telemetry Metrics Bento */}
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-2.5">
                <span className="font-mono text-[10px] text-app-muted font-bold block uppercase tracking-wide">
                  ELO RATING
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400 font-black">
                    {profile?.eloRating ?? 1000}
                  </span>
                  {profile?.rankDelta !== undefined && profile.rankDelta !== 0 && (
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        profile.rankDelta > 0
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {profile.rankDelta > 0 ? `+${profile.rankDelta}` : profile.rankDelta}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-2.5">
                <span className="font-mono text-[10px] text-app-muted font-bold block uppercase tracking-wide">
                  TRẬN ĐÃ ĐẤU
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-lg text-app-text font-black">
                    {profile?.confirmedMatchesCount ?? 0}
                  </span>
                  <span className="text-[11px] text-app-muted font-medium">trận</span>
                </div>
              </div>
            </div>

            {/* Win Streak Metric Bar */}
            <div className="mt-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-app-text">Chuỗi thắng liên tiếp</span>
              </div>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                {profile?.winStreak ?? 0} TRẬN
              </span>
            </div>

            {/* Linear Performance Arc Visual (Progress to Next Tier) */}
            <div className="mt-3 pt-2.5 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-lg p-2.5">
              <div className="flex justify-between items-center text-[10px] font-mono text-app-muted mb-1.5 font-semibold">
                <span className="truncate">TIẾN TRÌNH LÊN {tierProgress.nextTier.toUpperCase()}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 shrink-0">
                  {profile?.eloRating ?? 1000} / {tierProgress.targetElo}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(tierProgress.progress * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Access Navigation Panel */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-3 shadow-2xs space-y-1">
            <div className="px-3 py-1.5 text-app-muted font-mono text-[10px] uppercase tracking-wider font-bold">
              Lối tắt vận động viên
            </div>

            <div
              onClick={() => navigate('/calendar')}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-app-text hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-emerald-600" />
                <span>Kèo đã tham gia</span>
              </div>
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white px-2 py-0.2 rounded-full text-app-muted font-bold transition-colors">
                12
              </span>
            </div>

            <div
              onClick={() => navigate('/rooms')}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-app-text hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Users size={15} className="text-emerald-600" />
                <span>Bạn tập thường xuyên</span>
              </div>
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.2 rounded-full text-app-muted font-bold">
                26
              </span>
            </div>

            <div
              onClick={() => navigate('/rooms')}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-app-text hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Shield size={15} className="text-emerald-600" />
                <span>CLB Cầu Lông Sài Gòn</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div
              onClick={() => navigate('/rooms')}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-app-text hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <MapPin size={15} className="text-emerald-600" />
                <span>Sân tập yêu thích</span>
              </div>
              <span className="font-mono text-[11px] text-app-muted">5 sân</span>
            </div>
          </div>

          {/* Card 3: Mini Telemetry Sparkline (7D Training Load) */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-4 shadow-2xs text-app-text">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-app-muted font-bold uppercase tracking-wider">
                TẢI TRỌNG LUYỆN TẬP (7D)
              </span>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                14.2 GIỜ
              </span>
            </div>

            {/* Inline Sparkline SVG Chart */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-200/60 dark:border-slate-800">
              <svg className="w-full h-10 text-emerald-600" fill="none" preserveAspectRatio="none" viewBox="0 0 200 48">
                <path
                  d="M0,40 Q30,35 50,20 T100,28 T150,8 T200,18"
                  fill="none"
                  stroke="#059669"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <path
                  d="M0,40 Q30,35 50,20 T100,28 T150,8 T200,18 L200,48 L0,48 Z"
                  fill="#84cc16"
                  fillOpacity="0.18"
                />
                <circle cx="150" cy="8" fill="#059669" r="3.5" />
              </svg>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-app-muted mt-1.5 font-semibold px-1">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* COLUMN 2: CENTER STREAM & COMPOSER (6 Cols / Feed)       */}
        {/* ========================================================= */}
        <main className="lg:col-span-6 space-y-4 min-w-0">
          {/* 1. Post Composer Box */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Avatar
                src={profile?.avatarUrl}
                alt={profile?.displayName}
                size="md"
                className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-app-border shadow-2xs"
              />
              <div
                onClick={() => onOpenCreateModal('general')}
                className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-app-muted hover:text-app-text p-3 rounded-xl cursor-pointer transition-all text-xs sm:text-sm font-medium"
              >
                Chia sẻ trận đấu vừa xong, tìm bạn đánh đôi, hoặc ghi lại highlight hôm nay...
              </div>
            </div>

            {/* Quick Action Button Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-app-border/70 text-xs">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCreateModal('general')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold"
                >
                  <ImageIcon size={15} className="text-sky-500" />
                  <span>Ảnh / Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCreateModal('match_recap')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold"
                >
                  <Swords size={15} className="text-emerald-600" />
                  <span>Ghi nhận tỷ số</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCreateModal('court_review')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold"
                >
                  <Star size={15} className="text-amber-500 fill-amber-400" />
                  <span>Review sân</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateModal('general')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
              >
                Đăng tin
              </button>
            </div>
          </div>

          {/* 2. Subheader Filter Tabs */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all', label: 'Tất cả hoạt động' },
                { key: 'match_recap', label: 'Nhật ký trận' },
                { key: 'court_review', label: 'Review sân' },
                { key: 'general', label: 'Cộng đồng' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefreshFeed}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-app-surface text-app-muted hover:text-app-text transition-colors border border-transparent hover:border-app-border"
              title="Làm mới bảng tin"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
          </div>

          {/* 3. Featured Urgent Matchmaking Broadcast (Stitch Screen 3 Pattern) */}
          {(activeTab === 'all' || activeTab === 'general') &&
            (urgentRoom ? (
              <article className="bg-white dark:bg-app-surface border border-emerald-500/40 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={urgentRoom.members.find((m) => m.is_host)?.avatar_url}
                      alt={urgentRoom.hostName}
                      size="md"
                      className="w-10 h-10 ring-1 ring-app-border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-app-text">
                          {urgentRoom.hostName || 'Chủ phòng'}
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                          Host
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-app-muted font-medium">
                        <span>{urgentRoom.courtName}</span>
                        <span>•</span>
                        <span>Sắp diễn ra</span>
                      </div>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    CẦN TUYỂN GẤP
                  </span>
                </div>

                {/* Lobby Brief Box */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-app-text">
                      {urgentRoom.title || 'Kèo giao lưu cầu lông tuyển slot'}
                    </h3>
                    <span className="font-mono text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-black">
                      {RoomUiFormatters.currency(urgentRoom.fee)}{' '}
                      <span className="text-xs text-app-muted font-normal">/ slot</span>
                    </span>
                  </div>

                  {/* Court & Slot Metadata 2x2 Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-app-muted font-medium">
                    <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs">
                      <Clock size={16} className="text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-app-muted/70 block text-[10px] font-mono font-bold">THỜI GIAN</span>
                        <span className="text-app-text font-bold">
                          {RoomUiFormatters.dateRange(urgentRoom.startsAt, urgentRoom.endsAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs">
                      <MapPin size={16} className="text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-app-muted/70 block text-[10px] font-mono font-bold">ĐỊA ĐIỂM</span>
                        <span className="text-app-text font-bold">
                          {urgentRoom.courtName} {urgentRoom.address ? `• ${urgentRoom.address}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs">
                      <Shield size={16} className="text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-app-muted/70 block text-[10px] font-mono font-bold">YÊU CẦU TRÌNH ĐỘ</span>
                        <span className="text-app-text font-bold">
                          {RoomUiFormatters.skillRange(urgentRoom.minElo, urgentRoom.maxElo)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-lg shadow-2xs">
                      <Radio size={16} className="text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-app-muted/70 block text-[10px] font-mono font-bold">CẦU / GHI CHÚ</span>
                        <span className="text-app-text font-bold truncate max-w-[200px]" title={urgentRoom.notes}>
                          {urgentRoom.notes || 'Cầu lông tiêu chuẩn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rosters & Visual Slot Indicator */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-app-muted font-mono text-[10px] mb-2 font-bold uppercase">
                      <span>
                        DANH SÁCH LOBBY ({urgentRoom.reserved}/{urgentRoom.capacity} VĐV)
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {urgentRoom.capacity - urgentRoom.reserved > 0
                          ? `CHỈ CÒN ${urgentRoom.capacity - urgentRoom.reserved} SLOT`
                          : 'ĐÃ ĐỦ CHỖ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {urgentRoom.members.map((member, idx) => (
                        <div
                          key={member.user_id || idx}
                          className="flex items-center gap-2 bg-white dark:bg-app-surface border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg shadow-2xs"
                        >
                          <Avatar
                            src={member.avatar_url}
                            alt={member.display_name || member.name}
                            size="sm"
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-xs font-bold text-app-text">
                            {member.display_name || member.name || `VĐV ${idx + 1}`}
                          </span>
                        </div>
                      ))}

                      {Array.from({
                        length: Math.max(0, urgentRoom.capacity - urgentRoom.reserved),
                      }).map((_, slotIdx) => (
                        <button
                          key={`empty-${slotIdx}`}
                          type="button"
                          onClick={() => navigate('/rooms')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all active:scale-95"
                        >
                          <Plus size={14} />
                          <span>Slot trống (Nhấn vào)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lobby Join Action CTA */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-app-muted font-medium">
                    <Activity size={14} className="text-emerald-500" />
                    <span>Đang mở đăng ký cho mọi VĐV đủ điều kiện Elo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/rooms')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <UserCheck size={14} />
                    <span>
                      Tham gia ngay (Còn {urgentRoom.capacity - urgentRoom.reserved} slot)
                    </span>
                  </button>
                </div>
              </article>
            ) : (
              <article className="bg-white dark:bg-app-surface border border-dashed border-emerald-500/30 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <Radio size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-app-text">
                      Chưa có kèo tuyển gấp nào đang mở
                    </h3>
                    <p className="text-xs text-app-muted">
                      Bạn đang thiếu người ghép đội? Tạo kèo ngay để tuyển đồng đội trong khu vực!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/rooms')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} />
                  <span>Tạo kèo mới</span>
                </button>
              </article>
            ))}

          {/* 4. Stream of Post Cards */}
          <div className="space-y-4">
            {loading && posts.length === 0 ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-app-surface rounded-xl p-8 border border-app-border text-center text-xs text-app-muted flex flex-col items-center justify-center gap-2 shadow-2xs">
                <span className="text-3xl">🏸</span>
                <span className="font-bold text-sm text-app-text">Chưa có bài viết nào trong mục này</span>
                <span className="text-xs text-app-muted">Hãy là người đầu tiên chia sẻ nhật ký trận đấu hoặc review sân nhé!</span>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isExpanded={expandedPostIds.has(post.id)}
                  onToggleExpand={onToggleExpand}
                  onToggleLike={onToggleLike}
                  onOpenCommentDrawer={onOpenCommentDrawer}
                  onShowToast={onShowToast}
                />
              ))
            )}
          </div>
        </main>

        {/* ========================================================= */}
        {/* COLUMN 3: RIGHT WIDGETS & DISCOVERY (3 Cols / 320px)      */}
        {/* ========================================================= */}
        <aside className="lg:col-span-3 space-y-4 sticky top-18">
          {/* Widget 1: Kèo Hot Sắp Đấu (Trong 2 Giờ Tới) */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-bold text-app-text uppercase tracking-wide">
                  Kèo hot sắp đấu
                </h3>
              </div>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                Trong 2h tới
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (ev.rawRoom) navigate(`/rooms/${ev.rawRoom.id}`);
                      else navigate('/rooms');
                    }}
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        {ev.type === 'tournament' ? 'GIẢI ĐẤU' : 'KÈO THI ĐẤU'}
                      </span>
                      <span className="text-app-muted font-semibold">
                        {new Date(ev.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-app-text truncate">
                      {ev.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-app-muted mt-1.5 font-medium">
                      <span>{ev.subtitle || 'Sân Cầu Lông Kỳ Hòa'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Live Match</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Mini Match Item 1 */}
                  <div
                    onClick={() => navigate('/rooms')}
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        CẦU LÔNG ĐÔI NAM
                      </span>
                      <span className="text-app-muted font-semibold">18:30 (35m nữa)</span>
                    </div>
                    <div className="text-xs font-bold text-app-text truncate">
                      Lê Dũng / Nam Phong vs Đình Trọng / Văn Cường
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-app-muted mt-1.5 font-medium">
                      <span>Sân Cầu Lông Kỳ Hòa, Q.10</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Kèo 500k ELO</span>
                    </div>
                  </div>

                  {/* Mini Match Item 2 */}
                  <div
                    onClick={() => navigate('/rooms')}
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        CẦU LÔNG ĐƠN A
                      </span>
                      <span className="text-app-muted font-semibold">19:15 (1h15m nữa)</span>
                    </div>
                    <div className="text-xs font-bold text-app-text truncate">
                      Nguyễn Hoàng Hải vs Đặng Quốc Việt
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-app-muted mt-1.5 font-medium">
                      <span>Sân Viettel, Tân Bình</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Ranked Solo</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
            >
              <span>Xem tất cả sảnh chờ</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Widget 2: Gợi Ý Kết Nối Bạn Chơi Cùng Trình Độ */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-4 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-app-text uppercase tracking-wide flex items-center gap-1.5">
              <Users size={14} className="text-emerald-600" />
              <span>Gợi ý kết nối bạn chơi</span>
            </span>

            <div className="space-y-2.5">
              {suggestedPlayers && suggestedPlayers.length > 0 ? (
                suggestedPlayers
                  .filter((p) => p.id !== profile?.id)
                  .slice(0, 4)
                  .map((player) => (
                    <div key={player.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={player.avatarUrl}
                          alt={player.displayName}
                          size="sm"
                          className="w-8 h-8 shadow-2xs ring-1 ring-app-border"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-app-text truncate">
                            {player.displayName}
                          </span>
                          <span className="text-[10px] text-app-muted truncate font-medium">
                            {player.tierName || 'Phong trào'} • {player.eloRating || 1000} Elo
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onShowToast(`Đã gửi lời mời kết nối tới ${player.displayName}!`)}
                        className="h-6.5 px-2.5 rounded-full border border-emerald-600/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                      >
                        <Plus size={11} />
                        <span>Kết nối</span>
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-app-muted py-2 text-center font-medium">
                  Đang cập nhật danh sách VĐV...
                </p>
              )}
            </div>
          </div>

          {/* Widget 3: Sân Cầu Hot Hôm Nay */}
          <div className="bg-white dark:bg-app-surface border border-app-border rounded-xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-app-text uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>Sân Cầu Hot Hôm Nay</span>
              </span>
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                Tất cả →
              </button>
            </div>

            <div className="space-y-1.5">
              {(courts && courts.length > 0
                ? courts.slice(0, 5)
                : [
                    { id: '1', name: 'Sân An Bình', district: 'Quận 9' },
                    { id: '2', name: 'Sân TADA Thanh Đa', district: 'Bình Thạnh' },
                    { id: '3', name: 'Sân VSTAR Badminton', district: 'TP. Thủ Đức' },
                    { id: '4', name: 'Sân Nơ Trang Long', district: 'Bình Thạnh' },
                    { id: '5', name: 'Sân Sky Badminton', district: 'Quận 9' },
                  ]
              ).map((court, idx) => (
                <div
                  key={court.id}
                  onClick={() => navigate('/rooms')}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4 font-mono text-[11px] font-bold text-app-muted">
                      {idx + 1}.
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-app-text group-hover:text-emerald-600 transition-colors truncate">
                        {court.name}
                      </span>
                      <span className="text-[10px] text-app-muted truncate font-medium">
                        {court.district || 'TP. Hồ Chí Minh'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-zinc-100 shrink-0">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="font-mono text-[11px] font-bold">4.9</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Footer Links */}
          <div className="px-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-muted justify-center text-center">
            <a href="#" className="hover:text-emerald-600 hover:underline">Về SportXP</a>
            <a href="#" className="hover:text-emerald-600 hover:underline">Trợ giúp</a>
            <a href="#" className="hover:text-emerald-600 hover:underline">Điều khoản</a>
            <a href="#" className="hover:text-emerald-600 hover:underline">Quyền riêng tư</a>
            <span className="w-full text-[10px] text-app-muted/60 mt-1">SportXP Corporation © 2026</span>
          </div>
        </aside>
      </div>
    </div>
  );
};
