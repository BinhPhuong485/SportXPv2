import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle, XCircle, MapPin, Calendar } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';
import { MatchDiaryItem } from '../../domain/playerProfile';

interface MatchDiarySectionProps {
  matches: MatchDiaryItem[];
  loading?: boolean;
}

export const MatchDiarySection: React.FC<MatchDiarySectionProps> = ({ matches, loading = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* Entry Tile */}
      <BentoCard doubleBezel>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left group active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center text-app-primary shrink-0 group-hover:scale-105 transition-transform">
              <History size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-app-text leading-tight group-hover:text-app-primary transition-colors">
                Lịch sử thi đấu
              </h4>
              <p className="text-xs text-app-muted mt-0.5 truncate font-medium">
                {matches.length > 0 ? `${matches.length} trận đấu đã lưu trong hệ thống` : 'Các trận đấu và kết quả đối đầu đã ghi nhận'}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted group-hover:text-app-text transition-colors shrink-0">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
      </BentoCard>

      {/* Expanded Match Cards */}
      {expanded && (
        <div className="flex flex-col gap-2.5 pt-1 animate-in fade-in duration-200">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-app-muted">
              <div className="w-4 h-4 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
              <span>Đang tải lịch sử thi đấu…</span>
            </div>
          ) : matches.length === 0 ? (
            <BentoCard doubleBezel>
              <div className="py-8 px-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-app-background flex items-center justify-center text-app-muted mb-2">
                  <History size={24} />
                </div>
                <p className="text-sm font-bold text-app-text">
                  Chưa có kết quả trận đấu nào được ghi nhận
                </p>
                <p className="text-xs text-app-muted mt-1 max-w-xs">
                  Kết quả thi đấu tại các phòng chơi hoặc giải đấu sẽ hiển thị chi tiết tại đây.
                </p>
              </div>
            </BentoCard>
          ) : (
            matches.map((m) => (
              <BentoCard key={m.id} doubleBezel className="transition-all hover:border-app-primary/40">
                <div className="flex flex-col gap-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {m.isWin ? (
                        <div className="w-5 h-5 rounded-full bg-app-mint flex items-center justify-center text-app-primary">
                          <CheckCircle size={14} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-app-loss/15 flex items-center justify-center text-app-loss">
                          <XCircle size={14} />
                        </div>
                      )}
                      <span
                        className={`text-xs font-black uppercase tracking-wider ${
                          m.isWin ? 'text-app-primary' : 'text-app-loss'
                        }`}
                      >
                        {m.isWin ? 'THẮNG' : 'THUA'}
                      </span>
                    </div>

                    {m.eloChange != null && (
                      <span
                        className={`px-2 py-0.5 rounded-badge text-[11px] font-black tabular-nums border ${
                          m.isWin
                            ? 'bg-app-mint text-app-primary border-app-primary/30'
                            : 'bg-app-loss/15 text-app-loss border-app-loss/30'
                        }`}
                      >
                        {m.eloChange > 0 ? `+${m.eloChange}` : m.eloChange} Elo
                      </span>
                    )}
                  </div>

                  {/* Teams and score */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-btn bg-app-background/60 border border-app-border">
                    <div className="flex flex-col gap-1 min-w-0 flex-1 text-xs">
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

                    <div className="px-3 py-1.5 rounded-badge bg-app-surface border border-app-border text-xs font-black text-app-text tabular-nums shrink-0 shadow-2xs">
                      {m.score}
                    </div>
                  </div>

                  {/* Venue and date footer */}
                  <div className="flex items-center justify-between text-[11px] text-app-muted pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={12} className="text-app-muted shrink-0" />
                      <span className="truncate">{m.courtName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar size={12} className="text-app-muted shrink-0" />
                      <span>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              </BentoCard>
            ))
          )}
        </div>
      )}
    </div>
  );
};
