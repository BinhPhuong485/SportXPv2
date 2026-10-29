import React, { useState, useEffect } from 'react';
import { ChevronDown, Trophy, Medal } from 'lucide-react';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';
import { supabase } from '../../core/config/supabase';
import { useAuthStore } from '../../shared/hooks/useAuth';

interface RankedPlayer {
  id: string;
  displayName: string;
  eloRating: number;
  tierName: string;
  winStreak: number;
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'nearMe'>('all');
  const [courtName] = useState('Sân Đào Duy Anh');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from('profiles')
      .select('id, display_name, elo_rating, tier_name, win_streak')
      .not('elo_rating', 'is', null)
      .order('elo_rating', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
          setPlayers(
            data.map((r) => ({
              id: r.id,
              displayName: r.display_name || 'Vận động viên',
              eloRating: r.elo_rating || 0,
              tierName: r.tier_name || 'Nhập môn',
              winStreak: r.win_streak || 0,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  return (
    <PageContent>
      {/* Court Picker Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => alert('Chọn sân thi đấu sẽ mở danh sách sân trong Phase 5!')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-app-surface border border-app-border hover:border-app-primary transition-colors text-xs font-bold text-app-text shadow-xs"
        >
          <span>📍 {courtName}</span>
          <ChevronDown size={14} className="text-app-muted" />
        </button>

        {/* View Mode Chips */}
        <div className="p-0.5 bg-app-surface rounded-xl border border-app-border flex text-xs shadow-xs">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'all'
                ? 'bg-app-primary text-app-on-primary'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setViewMode('nearMe')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'nearMe'
                ? 'bg-app-primary text-app-on-primary'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            Quanh bạn (±5)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-app-muted text-xs">
          <div className="w-6 h-6 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải bảng xếp hạng…</span>
        </div>
      ) : players.length === 0 ? (
        <BentoCard>
          <p className="text-sm text-app-muted text-center py-4">
            Chưa có vận động viên nào trên bảng xếp hạng.
          </p>
        </BentoCard>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 items-end">
            {/* Top 2 */}
            {players[1] && (
              <BentoCard className="p-3 text-center flex flex-col items-center gap-1.5 bg-app-surface border-app-border shadow-xs">
                <Medal size={22} className="text-gray-400" />
                <span className="text-xs font-bold text-app-text truncate max-w-full">
                  {players[1].displayName}
                </span>
                <span className="text-sm font-black font-mono text-app-text">
                  {players[1].eloRating}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-background text-app-muted font-bold">
                  {players[1].tierName}
                </span>
              </BentoCard>
            )}

            {/* Top 1 */}
            {players[0] && (
              <BentoCard className="p-3.5 text-center flex flex-col items-center gap-1.5 bg-app-mint/30 border-app-primary/50 shadow-md -translate-y-2">
                <Trophy size={28} className="text-app-gold animate-bounce" />
                <span className="text-xs font-black text-app-text truncate max-w-full">
                  {players[0].displayName}
                </span>
                <span className="text-base font-black font-mono text-app-primary">
                  {players[0].eloRating}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-app-primary text-app-on-primary font-bold">
                  {players[0].tierName}
                </span>
              </BentoCard>
            )}

            {/* Top 3 */}
            {players[2] && (
              <BentoCard className="p-3 text-center flex flex-col items-center gap-1.5 bg-app-surface border-app-border shadow-xs">
                <Medal size={22} className="text-amber-700" />
                <span className="text-xs font-bold text-app-text truncate max-w-full">
                  {players[2].displayName}
                </span>
                <span className="text-sm font-black font-mono text-app-text">
                  {players[2].eloRating}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-background text-app-muted font-bold">
                  {players[2].tierName}
                </span>
              </BentoCard>
            )}
          </div>

          {/* Full Ranking List */}
          <BentoCard className="p-0 overflow-hidden shadow-xs">
            <div className="flex flex-col divide-y divide-app-border">
              {players.map((p, idx) => {
                const isMe = p.id === user?.id;
                return (
                  <div
                    key={p.id}
                    className={`px-4 py-3.5 flex items-center justify-between transition-colors ${
                      isMe ? 'bg-app-mint/20 border-l-4 border-l-app-primary' : 'hover:bg-app-background/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-5 text-center text-xs font-mono font-bold text-app-muted">
                        #{idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-app-text flex items-center gap-1.5">
                          {p.displayName}
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-app-primary text-app-on-primary font-bold">
                              Bạn
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-app-muted">
                          {p.tierName} {p.winStreak > 0 ? `· 🔥 ${p.winStreak} trận` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-mono font-black text-app-primary">
                      {p.eloRating}
                    </div>
                  </div>
                );
              })}
            </div>
          </BentoCard>
        </>
      )}
    </PageContent>
  );
};
