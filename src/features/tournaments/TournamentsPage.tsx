import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { Tournament } from './domain/tournament';
import { tournamentRepository } from './data/tournamentRepository';
import { TournamentCard } from './presentation/widgets/TournamentCard';
import { RegisterTournamentSheet } from './presentation/widgets/RegisterTournamentSheet';
import { EmptyState } from '../../shared/components/EmptyState';

const filterOptions = [
  { id: 'all', label: 'Tất cả giải' },
  { id: 'registering', label: 'Đang mở đăng ký' },
  { id: 'ongoing', label: 'Đang diễn ra' },
];

export const TournamentsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sheet state
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [list, myRegs] = await Promise.all([
        tournamentRepository.listTournaments(selectedFilter),
        tournamentRepository.getMyRegistrations(),
      ]);
      setTournaments(list);
      setMyRegistrations(myRegs);
    } catch {
      setErrorMessage('Không thể tải danh sách giải đấu.');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleOpenSheet = (tournament: Tournament) => {
    setActiveTournament(tournament);
    setIsSheetOpen(true);
  };

  const handleConfirmRegister = async () => {
    if (!activeTournament) return;
    setSheetBusy(true);
    try {
      await tournamentRepository.registerTournament(activeTournament.id);
      setIsSheetOpen(false);
      setFeedback({
        type: 'success',
        message: `Đã gửi đăng ký tham gia "${activeTournament.title}".`,
      });
      await loadTournaments();
    } catch (e) {
      setFeedback({
        type: 'error',
        message: e instanceof Error ? e.message : 'Đăng ký không thành công.',
      });
    } finally {
      setSheetBusy(false);
    }
  };

  return (
    <PageContent>
      {/* 1. Header Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-2">
            Giải đấu
            <Sparkles size={20} className="text-app-gold" />
          </h1>
          <p className="text-xs text-app-muted mt-0.5">
            Sân chơi phong trào có xếp hạng và tích lũy điểm ELO
          </p>
        </div>
        <button
          type="button"
          onClick={loadTournaments}
          title="Tải lại giải đấu"
          className="w-10 h-10 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-surface border border-transparent hover:border-app-border active:scale-95 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin text-app-primary' : ''} />
        </button>
      </div>

      {/* 2. Filter Chips */}
      <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 py-1 flex items-center gap-2">
        {filterOptions.map((opt) => {
          const selected = selectedFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all shrink-0 active:scale-95 ${
                selected
                  ? 'bg-app-primary border-app-primary text-app-on-primary shadow-xs'
                  : 'bg-app-surface border-app-border text-app-text hover:border-app-primary/40'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 3. Feedback notification banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-btn flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-app-mint text-app-primary border border-app-primary/30'
              : 'bg-app-loss text-white'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline font-black ml-2 opacity-90 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 4. Tournaments List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
          <div className="w-8 h-8 rounded-full border-3 border-app-primary border-t-transparent animate-spin" />
          <span className="font-medium">Đang tải danh sách giải đấu…</span>
        </div>
      ) : errorMessage ? (
        <div className="rounded-bento bg-app-surface border border-app-border p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle size={36} className="text-app-loss" />
          <p className="text-sm font-bold text-app-text">{errorMessage}</p>
          <button
            type="button"
            onClick={loadTournaments}
            className="mt-1 px-4 py-2.5 rounded-btn bg-app-primary text-app-on-primary text-xs font-bold hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          type="trophy"
          title="Chưa có giải đấu nào"
          description="Hiện tại chưa có giải đấu nào phù hợp với bộ lọc bạn chọn."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tournaments.map((tour) => (
            <TournamentCard
              key={tour.id}
              tournament={tour}
              isRegistered={myRegistrations.includes(tour.id)}
              onRegister={() => handleOpenSheet(tour)}
            />
          ))}
        </div>
      )}

      {/* 5. Registration & Info Bottom Sheet */}
      <RegisterTournamentSheet
        isOpen={isSheetOpen}
        tournament={activeTournament}
        isRegistered={Boolean(activeTournament && myRegistrations.includes(activeTournament.id))}
        busy={sheetBusy}
        onClose={() => setIsSheetOpen(false)}
        onConfirm={handleConfirmRegister}
      />
    </PageContent>
  );
};
