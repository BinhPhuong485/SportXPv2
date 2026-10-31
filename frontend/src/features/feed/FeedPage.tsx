import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Heart, AlertCircle } from 'lucide-react';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';
import { RecordMatchSheet } from './RecordMatchSheet';
import { MatchDraft, MatchSummary } from './domain/activity';
import { supabaseMatchRepository } from '../../services/supabaseMatchRepository';
import { useAuthStore } from '../../shared/hooks/useAuth';

export const FeedPage: React.FC = () => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecordSheet, setShowRecordSheet] = useState(
    () => window.location.href.includes('record=true')
  );

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseMatchRepository.fetchMatches();
      setMatches(data);
    } catch {
      setError('Không thể tải danh sách trận đấu từ Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleRecordMatch = async (draft: MatchDraft) => {
    if (!user) return;
    await supabaseMatchRepository.recordMatch(user.id, draft);
    fetchMatches();
  };

  return (
    <>
      <div className="w-full flex flex-col items-center">
        {/* Action Header Row matching Flutter FeedPage */}
        <div className="w-full max-w-content px-4 pt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowRecordSheet(true)}
            className="flex-1 h-11 px-4 rounded-btn bg-app-surface border border-app-border hover:border-app-primary text-xs font-bold text-app-primary flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-xs"
          >
            <Plus size={16} />
            <span>Ghi nhận set cầu</span>
          </button>
          <button
            type="button"
            onClick={fetchMatches}
            disabled={loading}
            className="w-11 h-11 rounded-btn bg-app-surface border border-app-border hover:border-app-primary text-app-muted hover:text-app-text flex items-center justify-center transition-colors shadow-xs"
            title="Cập nhật bảng tin"
            aria-label="Cập nhật bảng tin"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Feed Content */}
        <PageContent>
          <h2 className="text-xl sm:text-2xl font-extrabold text-app-text whitespace-pre-line tracking-tight mb-1">
            {'Mọi set cầu đều được\nđịnh danh và ghi nhận.'}
          </h2>

          {/* Error Message */}
          {error && (
            <BentoCard className="border-app-loss/30 bg-app-loss/10 text-app-loss flex items-center gap-2.5 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </BentoCard>
          )}

          {/* Loading Indicator */}
          {loading && matches.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-app-muted text-xs">
              <div className="w-6 h-6 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
              <span>Đang tải các trận đấu…</span>
            </div>
          )}

          {/* Empty State matching Flutter */}
          {!loading && matches.length === 0 && !error && (
            <BentoCard>
              <p className="text-sm text-app-muted">
                Chưa có trận đấu. Ghi nhận set cầu đầu tiên của bạn.
              </p>
            </BentoCard>
          )}

          {/* Match Result BentoCards matching Flutter exactly */}
          {matches.map((match) => {
            const d = match.createdAt ? new Date(match.createdAt) : null;
            const dateStr =
              d && !isNaN(d.getTime())
                ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
                : '';
            return (
              <BentoCard key={match.id} className="flex flex-col gap-2.5">
                <span className="text-xs text-app-muted font-medium">
                  {match.teamA} &nbsp;/&nbsp; {match.teamB}
                </span>

                <div className="text-2xl font-extrabold font-mono tracking-tight text-app-text">
                  {match.score}
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold tracking-wider uppercase ${
                      match.isWin ? 'text-app-primary' : 'text-app-loss'
                    }`}
                  >
                    {match.isWin ? 'ĐỘI A THẮNG' : 'ĐỘI B THẮNG'}
                  </span>

                  {match.eloChange !== null && match.eloChange !== undefined && (
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        match.eloChange >= 0 ? 'text-app-primary' : 'text-app-loss'
                      }`}
                    >
                      {match.eloChange >= 0 ? `+${match.eloChange}` : match.eloChange} ELO
                    </span>
                  )}
                </div>

                <div className="text-[11.5px] text-app-muted pt-1 border-t border-app-border/40 flex items-center justify-between">
                  <span>{match.courtName}</span>
                  {dateStr && <span>{dateStr}</span>}
                </div>
              </BentoCard>
            );
          })}

          {/* Health Kit Card matching Flutter */}
          <BentoCard className="flex flex-col gap-2 opacity-90">
            <Heart size={20} className="text-app-muted" />
            <h3 className="text-sm font-bold text-app-text">Sức khỏe chưa kết nối</h3>
            <p className="text-xs text-app-muted leading-relaxed">
              HealthKit / Health Connect sẽ được tích hợp sau. Chỉ đọc dữ liệu khi bạn cấp quyền.
            </p>
          </BentoCard>
        </PageContent>
      </div>

      {/* Record Match Modal Sheet */}
      <RecordMatchSheet
        isOpen={showRecordSheet}
        onClose={() => setShowRecordSheet(false)}
        onSubmit={handleRecordMatch}
      />
    </>
  );
};
