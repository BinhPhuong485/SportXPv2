import React, { useState } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { MatchDiaryItem } from '../../domain/playerProfile';
import { ProfileSectionCard } from './ProfileSectionCard';

interface MatchDiarySectionProps {
  matches: MatchDiaryItem[];
  loading?: boolean;
}

export const MatchDiarySection: React.FC<MatchDiarySectionProps> = ({
  matches,
  loading = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleAction = (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="text-xs font-black text-app-primary hover:underline flex items-center gap-1"
      aria-expanded={expanded}
    >
      <span>{expanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );

  return (
    <ProfileSectionCard
      id="profile-match-diary-card"
      icon={<History size={16} />}
      title="HOẠT ĐỘNG THI ĐẤU"
      subtitle={
        matches.length > 0
          ? `${matches.length} trận đấu gần nhất đã ghi nhận`
          : 'Các trận đấu và kết quả đối đầu đã ghi nhận'
      }
      action={matches.length > 0 ? toggleAction : undefined}
    >
      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-app-muted">
          <div className="w-4 h-4 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải lịch sử thi đấu…</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-6 px-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-app-background flex items-center justify-center text-app-muted mb-2">
            <History size={22} />
          </div>
          <p className="text-xs font-bold text-app-text">
            Chưa có kết quả trận đấu nào được ghi nhận
          </p>
          <p className="text-[11px] text-app-muted mt-1 max-w-xs leading-relaxed">
            Kết quả thi đấu tại các phòng chơi hoặc giải đấu sẽ hiển thị chi tiết tại đây.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Display 2 recent matches when collapsed, or all matches when expanded */}
          {(expanded ? matches : matches.slice(0, 2)).map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-app-background border border-app-border flex flex-col gap-2.5 shadow-2xs hover:border-app-primary/40 transition-all"
            >
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {m.isWin ? (
                    <div className="w-4 h-4 rounded-full bg-app-mint flex items-center justify-center text-app-primary">
                      <CheckCircle size={13} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-app-loss/15 flex items-center justify-center text-app-loss">
                      <XCircle size={13} />
                    </div>
                  )}
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider ${
                      m.isWin ? 'text-app-primary' : 'text-app-loss'
                    }`}
                  >
                    {m.isWin ? 'THẮNG' : 'THUA'}
                  </span>
                </div>

                {m.eloChange != null && (
                  <span
                    className={`px-2 py-0.5 rounded-badge text-[10px] font-black tabular-nums border ${
                      m.isWin
                        ? 'bg-app-mint text-app-primary border-app-primary/30'
                        : 'bg-app-loss/15 text-app-loss border-app-loss/30'
                    }`}
                  >
                    {m.eloChange > 0 ? `+${m.eloChange}` : m.eloChange} Elo
                  </span>
                )}
              </div>

              {/* Teams & Score */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-app-surface border border-app-border/80">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-xs">
                  <div
                    className={`truncate ${
                      m.isWin ? 'font-black text-app-text' : 'font-semibold text-app-muted'
                    }`}
                  >
                    {m.teamA}
                  </div>
                  <div
                    className={`truncate ${
                      !m.isWin ? 'font-black text-app-text' : 'font-semibold text-app-muted'
                    }`}
                  >
                    {m.teamB}
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-badge bg-app-background border border-app-border text-xs font-black text-app-text tabular-nums shrink-0 shadow-2xs">
                  {m.score}
                </div>
              </div>

              {/* Venue & Date Footer */}
              <div className="flex items-center justify-between text-[11px] text-app-muted pt-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin size={11} className="text-app-muted shrink-0" />
                  <span className="truncate">{m.courtName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar size={11} className="text-app-muted shrink-0" />
                  <span>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfileSectionCard>
  );
};
