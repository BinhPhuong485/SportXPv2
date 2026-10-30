import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CalendarOff, RefreshCw } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';
import { Tournament } from './domain/tournament';
import { tournamentRepository } from './data/tournamentRepository';
import { TournamentCard } from './presentation/widgets/TournamentCard';
import { RegisterTournamentSheet } from './presentation/widgets/RegisterTournamentSheet';

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
      {/* 1. Filter Chips */}
      <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 py-1 flex items-center gap-2">
        {filterOptions.map((opt) => {
          const selected = selectedFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all shrink-0 ${
                selected
                  ? 'bg-app-primary border-app-primary text-app-on-primary font-bold shadow-xs'
                  : 'bg-app-surface border-app-border text-app-text hover:border-app-primary/40'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 2. Feedback notification banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-app-primary text-app-on-primary'
              : 'bg-app-loss text-white'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline font-bold ml-2 opacity-90 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3. Tournaments List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-app-primary border-t-transparent animate-spin" />
        </div>
      ) : errorMessage ? (
        <BentoCard>
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <AlertCircle size={36} className="text-app-loss" />
            <p className="text-sm font-bold text-app-text">{errorMessage}</p>
            <button
              type="button"
              onClick={loadTournaments}
              className="mt-1 px-4 py-2 rounded-xl border border-app-border text-xs font-bold hover:bg-app-background transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Thử lại</span>
            </button>
          </div>
        </BentoCard>
      ) : tournaments.length === 0 ? (
        <BentoCard>
          <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
            <CalendarOff size={40} className="text-app-muted" />
            <p className="text-sm text-app-muted">Hiện chưa có giải đấu nào trong mục này.</p>
          </div>
        </BentoCard>
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

      {/* 4. Registration & Info Bottom Sheet */}
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
