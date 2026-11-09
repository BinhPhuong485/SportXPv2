import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Edit3,
} from 'lucide-react';
import { PlayerProfile, getNextTierProgress } from '../../profile/domain/playerProfile';
import { Avatar } from '../../../shared/components/Avatar';

export interface FeedAthleteProfileCardProps {
  profile: PlayerProfile | null;
  onOpenCreateModal: (preset?: 'court_review' | 'match_recap' | 'general') => void;
}

/**
 * FeedAthleteProfileCard - Atomic Organism
 * Sleek, modern identity & athletic telemetry card for the feed sidebar.
 * Clean and streamlined without being overly minimal.
 */
export const FeedAthleteProfileCard: React.FC<FeedAthleteProfileCardProps> = ({
  profile,
  onOpenCreateModal,
}) => {
  const navigate = useNavigate();
  const tierProgress = getNextTierProgress(profile?.eloRating);

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col gap-4">
      {/* Ambient Corner Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* 1. Header: Avatar with PRO badge + Rank tag */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div
          onClick={() => navigate('/profile')}
          className="relative cursor-pointer group shrink-0"
        >
          <Avatar
            src={profile?.avatarUrl}
            alt={profile?.displayName}
            size="xl"
            className="w-14 h-14 rounded-2xl object-cover shadow-xs ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition-all"
          />
          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white shadow-2xs px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider">
            PRO
          </div>
        </div>

        <div className="text-right flex flex-col items-end min-w-0">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold uppercase tracking-wider truncate max-w-[140px]">
            {profile?.tierName || 'Tân binh'}
          </span>
          <div className="flex items-center gap-1 font-mono text-[10px] text-app-muted mt-1 font-semibold truncate max-w-[150px]">
            <MapPin size={11} className="text-emerald-500 shrink-0" />
            <span className="truncate" title={profile?.homeCourtName || 'Chưa chọn sân nhà'}>
              {profile?.homeCourtName ? profile.homeCourtName : 'Chưa có sân nhà'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Athlete Name & Bio */}
      <div className="min-w-0 relative z-10">
        <h2
          onClick={() => navigate('/profile')}
          className="text-base font-black text-app-text tracking-tight hover:text-emerald-600 cursor-pointer transition-colors flex items-center gap-1.5 truncate"
        >
          <span className="truncate">{profile?.displayName || 'Vận Động Viên'}</span>
          {profile?.isIdentityVerified && (
            <span title="VĐV Đã Xác Minh" className="shrink-0 flex items-center">
              <CheckCircle2 size={15} className="text-emerald-500" />
            </span>
          )}
        </h2>
        <p className="text-xs text-app-muted mt-0.5 font-medium line-clamp-2">
          {profile?.bio || 'VĐV Cầu lông phong trào • TP. Hồ Chí Minh'}
        </p>
      </div>

      {/* 3. 2x2 Telemetry Metrics Bento */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        {/* Metric 1: Elo Rating */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5">
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

        {/* Metric 2: Matches Count */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5">
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

        {/* Metric 3: Win Streak */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5">
          <span className="font-mono text-[10px] text-app-muted font-bold block uppercase tracking-wide">
            CHUỖI THẮNG
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame size={15} className="text-amber-500 fill-amber-500 shrink-0" />
            <span className="font-mono text-sm text-app-text font-black">
              {profile?.winStreak ?? 0}
            </span>
            <span className="text-[10px] text-app-muted font-bold">trận</span>
          </div>
        </div>

        {/* Metric 4: Trust Score */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5">
          <span className="font-mono text-[10px] text-app-muted font-bold block uppercase tracking-wide">
            TÍN NHIỆM
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-black">
              {profile?.trustScore ?? 100}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Linear Progress Arc Visual (Progress to Next Tier) */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-2.5 relative z-10">
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

      {/* 5. Quick Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1 relative z-10">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="py-2 px-3 rounded-xl border border-app-border hover:bg-slate-100 dark:hover:bg-slate-800/80 text-app-text font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <TrendingUp size={13} className="text-emerald-600" />
          <span>Hồ sơ cá nhân</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCreateModal('general')}
          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Edit3 size={13} />
          <span>Tạo bài viết</span>
        </button>
      </div>
    </div>
  );
};
