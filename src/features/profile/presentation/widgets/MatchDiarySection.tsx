import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle, XCircle, MapPin, Trophy } from 'lucide-react';
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
      {/* Entry Tile matching Flutter's ListTile */}
      <BentoCard>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-app-primary/10 text-app-primary shrink-0">
              <History size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-app-text leading-tight">
                Lịch sử thi đấu
              </h4>
              <p className="text-xs text-app-muted mt-0.5 truncate">
                Các trận đấu và kết quả đối đầu đã ghi nhận
              </p>
            </div>
          </div>
          <div className="text-app-muted shrink-0 pl-2">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>
      </BentoCard>

      {/* Expanded Match Cards */}
      {expanded && (
        <div className="flex flex-col gap-2.5 pt-1 animate-in fade-in duration-200">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-xs text-app-muted">
              Đang tải lịch sử thi đấu…
            </div>
          ) : matches.length === 0 ? (
            <BentoCard>
              <div className="py-6 px-4 flex flex-col items-center text-center">
                <Trophy size={32} className="text-app-muted/60 mb-2" />
                <p className="text-sm font-semibold text-app-muted">
                  Chưa có kết quả trận đấu nào được ghi nhận
                </p>
                <p className="text-xs text-app-muted/80 mt-1 max-w-xs">
                  Kết quả thi đấu tại các buổi chơi sẽ hiển thị tại đây.
                </p>
              </div>
            </BentoCard>
          ) : (
            matches.map((m) => (
              <BentoCard key={m.id}>
                <div className="flex flex-col gap-2.5">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {m.isWin ? (
                        <CheckCircle size={15} className="text-app-primary" />
                      ) : (
                        <XCircle size={15} className="text-app-loss" />
                      )}
                      <span
                        className={`text-xs font-black uppercase ${
                          m.isWin ? 'text-app-primary' : 'text-app-loss'
                        }`}
                      >
                        {m.isWin ? 'THẮNG' : 'THUA'}
                      </span>
                    </div>

                    {m.eloChange != null && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          m.isWin
                            ? 'bg-app-primary/10 text-app-primary'
                            : 'bg-app-loss/10 text-app-loss'
                        }`}
                      >
                        {m.eloChange > 0 ? `+${m.eloChange}` : m.eloChange} Elo
                      </span>
                    )}
                  </div>

                  {/* Teams and score */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0 flex-1 text-xs">
                      <div
                        className={`truncate ${
                          m.isWin ? 'font-extrabold text-app-text' : 'font-semibold text-app-muted'
                        }`}
                      >
                        {m.teamA}
                      </div>
                      <div
                        className={`truncate ${
                          !m.isWin ? 'font-extrabold text-app-text' : 'font-semibold text-app-muted'
                        }`}
                      >
                        {m.teamB}
                      </div>
                    </div>

                    <div className="px-2.5 py-1.5 rounded-lg bg-app-background border border-app-border text-xs font-black text-app-text tabular-nums shrink-0">
                      {m.score}
                    </div>
                  </div>

                  {/* Venue and date footer */}
                  <div className="flex items-center gap-1.5 text-[11px] text-app-muted pt-1 border-t border-app-border/40">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{m.courtName}</span>
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

