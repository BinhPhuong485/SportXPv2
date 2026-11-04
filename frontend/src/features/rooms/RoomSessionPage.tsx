import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trophy,
  Users,
  Check,
  X,
} from 'lucide-react';
import { managedRoomRepository, roomFailure } from './data/managedRoomRepository';
import { ManagedRoomData } from './domain/managedRoom';
import { sessionMatchService, SessionMatch } from '../../services/sessionMatchService';
import { useAuthStore } from '../../shared/hooks/useAuth';

interface PlayerOption {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  elo?: number;
}

export const RoomSessionPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [matches, setMatches] = useState<SessionMatch[]>([]);

  // Dialog state
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);
  const [teamAChoice1, setTeamAChoice1] = useState<string>('');
  const [teamAChoice2, setTeamAChoice2] = useState<string>('');
  const [teamBChoice1, setTeamBChoice1] = useState<string>('');
  const [teamBChoice2, setTeamBChoice2] = useState<string>('');
  const [scoreText, setScoreText] = useState('21-19');
  const [winnerTeam, setWinnerTeam] = useState<'A' | 'B'>('A');
  const [matchDialogError, setMatchDialogError] = useState<string | null>(null);

  const effectiveUserId = user?.id || room?.viewerId || '';

  const loadData = useCallback(async () => {
    if (!roomId) return;
    try {
      setError(null);
      const [roomData, matchRows] = await Promise.all([
        managedRoomRepository.get(roomId),
        sessionMatchService.listMatches(roomId, user?.id || null),
      ]);
      setRoom(roomData);
      setMatches(matchRows);
    } catch (e) {
      setError(roomFailure(e));
    } finally {
      setLoading(false);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Eligible players: registered members
  const players: PlayerOption[] = (room?.members || [])
    .filter((m) => {
      const status = String(m.status || '');
      const isPlaying = m.is_playing ?? m.isPlaying ?? true;
      return (status === 'REGISTERED' || status === 'RECONFIRM') && Boolean(isPlaying);
    })
    .map((m) => ({
      id: String(m.user_id || m.id || ''),
      name: String(m.display_name || m.name || 'Người chơi'),
      role: m.is_host ? 'HOST' : String(m.role || 'PLAYER'),
      avatarUrl: m.avatar_url,
      elo: m.elo_rating || undefined,
    }));

  const openCreateMatch = () => {
    setIsDoubles(false);
    setTeamAChoice1(players[0]?.id || effectiveUserId);
    setTeamBChoice1(players[1]?.id || '');
    setTeamAChoice2(players[2]?.id || '');
    setTeamBChoice2(players[3]?.id || '');
    setScoreText('21-19');
    setWinnerTeam('A');
    setMatchDialogError(null);
    setIsMatchDialogOpen(true);
  };

  const handleMatchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    const teamA = isDoubles ? [teamAChoice1, teamAChoice2] : [teamAChoice1];
    const teamB = isDoubles ? [teamBChoice1, teamBChoice2] : [teamBChoice1];
    const allSelected = [...teamA, ...teamB];

    if (allSelected.some((id) => !id)) {
      setMatchDialogError('Vui lòng chọn đủ người chơi cho cả hai đội.');
      return;
    }
    if (new Set(allSelected).size !== allSelected.length) {
      setMatchDialogError('Người chơi không được trùng nhau giữa các vị trí.');
      return;
    }

    // Parse score text (e.g. "21-19" or "21-18, 19-21, 21-15")
    const setSegments = scoreText.split(',').map((s) => s.trim()).filter(Boolean);
    const scores = setSegments.map((seg, idx) => {
      const parts = seg.split('-');
      return {
        set: idx + 1,
        a: parseInt(parts[0] || '21', 10),
        b: parseInt(parts[1] || '19', 10),
      };
    });

    if (scores.length === 0) {
      scores.push({ set: 1, a: 21, b: 19 });
    }

    setBusy(true);
    setMatchDialogError(null);
    try {
      await sessionMatchService.createMatch({
        roomId,
        matchType: isDoubles ? 'doubles' : 'singles',
        teamA,
        teamB,
        scores,
        winnerTeam,
        createdBy: effectiveUserId,
      });

      setIsMatchDialogOpen(false);
      setSuccessMessage('Đã tạo bản ghi tỉ số! Đối thủ cần bấm xác nhận để chốt kết quả.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setMatchDialogError(err.message || 'Lỗi khi tạo ván đấu.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmMatch = async (m: SessionMatch) => {
    if (busy || !effectiveUserId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sessionMatchService.confirmMatch(m.id, effectiveUserId);
      if (res.confirmed) {
        if (res.eloResults && res.eloResults.length > 0) {
          const myResult = res.eloResults.find((r) => r.playerId === effectiveUserId);
          if (myResult) {
            setSuccessMessage(
              `Hai bên đã đồng thuận! Elo của bạn: ${myResult.oldElo} → ${myResult.newElo} (${myResult.eloChange >= 0 ? '+' : ''}${myResult.eloChange} Elo). Hạng: ${myResult.newTier}`
            );
          } else {
            setSuccessMessage('Hai bên đã đồng thuận thành công! Kết quả đã được chốt và cập nhật Elo.');
          }
        } else {
          setSuccessMessage('Đồng thuận thành công! Ván đấu đã được xác nhận.');
        }
      } else {
        setSuccessMessage('Bạn đã bấm xác nhận! Đang chờ đối thủ xác nhận để chốt kết quả.');
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xác nhận ván đấu.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisputeMatch = async (m: SessionMatch) => {
    if (busy || !effectiveUserId) return;
    const ok = window.confirm(
      'Bạn có chắc chắn muốn khiếu nại tỉ số ván đấu này? Hệ thống sẽ đóng băng điểm số và chuyển sang trạng thái tranh chấp.'
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await sessionMatchService.disputeMatch(m.id, effectiveUserId);
      setSuccessMessage('Đã gửi khiếu nại! Ván đấu chuyển sang trạng thái tranh chấp và bị đóng băng điểm.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi khiếu nại.');
    } finally {
      setBusy(false);
    }
  };

  const getPlayerName = (id: string): string => {
    const member = players.find((p) => p.id === id);
    return member?.name || id.substring(0, 8);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-app-muted mt-3">Đang tải buổi chơi…</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-app-background flex flex-col items-center justify-center p-4">
        <p className="text-sm font-semibold text-app-muted">Không tìm thấy thông tin buổi chơi này.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-app-surface border border-app-border text-xs font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const isRoomRated = room.roomType === 'PRIVATE_RATED' || room.isRated;

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased text-app-text">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-app-surface/90 backdrop-blur-md border-b border-app-border">
        <div className="w-full max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tight line-clamp-1">{room.title}</h1>
              <span className="text-[11px] text-app-muted">Buổi chơi & Ghi nhận tỉ số</span>
            </div>
          </div>

          <button
            onClick={loadData}
            title="Làm mới"
            disabled={busy}
            className="p-2 text-app-muted hover:text-app-text rounded-full hover:bg-app-background transition-colors"
          >
            <RefreshCw size={17} className={busy ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-[720px] mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Banner Flow Indicator */}
        <div className="p-3.5 rounded-2xl bg-app-surface border border-app-border flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            {isRoomRated ? (
              <span className="p-2 rounded-xl bg-app-streak/15 text-app-streak">
                <Trophy size={18} />
              </span>
            ) : (
              <span className="p-2 rounded-xl bg-app-primary/15 text-app-primary">
                <Users size={18} />
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-black">
                {isRoomRated ? 'KÈO KÍN TÍNH ĐIỂM ELO (FLOW B)' : 'TUYỂN QUÂN GIAO LƯU (FLOW A)'}
              </span>
              <span className="text-[11px] text-app-muted">
                {isRoomRated
                  ? 'Hai bên cần đồng thuận tỉ số để hệ thống cập nhật Elo và Streak.'
                  : 'Trận đấu mang tính chất giao lưu vãng lai, không biến động xếp hạng.'}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase ${
              isRoomRated
                ? 'bg-app-streak/15 text-app-streak border border-app-streak/40'
                : 'bg-app-primary/15 text-app-primary border border-app-primary/40'
            }`}
          >
            {isRoomRated ? 'Rated' : 'Unrated'}
          </span>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3.5 rounded-xl bg-app-loss/12 border border-app-loss/35 text-xs text-app-loss font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-app-primary/15 border border-app-primary/40 text-xs text-app-primary font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MATCHES SECTION */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-app-muted uppercase tracking-wider">
                DANH SÁCH VÁN ĐẤU ({matches.length})
              </span>
            </div>

            <button
              type="button"
              onClick={openCreateMatch}
              disabled={busy || players.length < 2}
              className="h-8 px-3 rounded-xl bg-app-primary text-app-on-primary text-xs font-extrabold flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            >
              <Plus size={15} />
              <span>+ Ghi set cầu</span>
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-app-surface border border-app-border text-center flex flex-col items-center gap-2">
              <HelpCircle size={32} className="text-app-muted/60" />
              <p className="text-sm font-bold text-app-text">Chưa có ván đấu nào được ghi nhận</p>
              <p className="text-xs text-app-muted max-w-xs leading-relaxed">
                Sau mỗi set đấu, bấm nút "+ Ghi set cầu" để nhập tỉ số. Đối thủ sẽ nhận được yêu cầu bấm xác nhận.
              </p>
            </div>
          ) : (
            matches.map((m) => {
              const isConfirmed = m.status === 'confirmed';
              const isDisputed = m.status === 'disputed';
              const isPending = m.status === 'pending';

              const teamAText = m.teamANames && m.teamANames.length > 0
                ? m.teamANames.join(' + ')
                : m.teamAPlayerIds.map(getPlayerName).join(' + ');

              const teamBText = m.teamBNames && m.teamBNames.length > 0
                ? m.teamBNames.join(' + ')
                : m.teamBPlayerIds.map(getPlayerName).join(' + ');

              return (
                <div
                  key={m.id}
                  className={`bg-app-surface rounded-[20px] p-4 border flex flex-col gap-3 shadow-xs transition-all ${
                    isPending && m.canConfirm
                      ? 'border-app-primary ring-2 ring-app-primary/20'
                      : isDisputed
                      ? 'border-app-loss/60'
                      : 'border-app-border'
                  }`}
                >
                  {/* Match Header: Teams & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-app-text">
                      <span className={m.winnerTeam === 'A' ? 'text-app-primary' : ''}>
                        {teamAText}
                      </span>
                      <span className="text-app-muted font-normal">vs</span>
                      <span className={m.winnerTeam === 'B' ? 'text-app-primary' : ''}>
                        {teamBText}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                        isConfirmed
                          ? 'bg-app-primary/15 text-app-primary border border-app-primary/40'
                          : isDisputed
                          ? 'bg-app-loss/15 text-app-loss border border-app-loss/40'
                          : 'bg-app-streak/15 text-app-streak border border-app-streak/40'
                      }`}
                    >
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 size={11} />
                          <span>Đã Đồng Thuận</span>
                        </>
                      ) : isDisputed ? (
                        <>
                          <AlertTriangle size={11} />
                          <span>Đang Khiếu Nại</span>
                        </>
                      ) : (
                        <>
                          <Clock size={11} />
                          <span>Chờ Xác Nhận ({m.confirmations.length}/{m.matchType === 'singles' ? 2 : 2})</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Score & Winner */}
                  <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono tracking-wider text-app-primary">
                        {m.scoreText}
                      </span>
                      <span className="text-xs font-bold text-app-muted">
                        • Đội {m.winnerTeam} ({m.winnerTeam === 'A' ? teamAText : teamBText}) Thắng
                      </span>
                    </div>

                    {/* Elo Delta Indicator */}
                    {isConfirmed && (
                      <div className="text-xs font-extrabold">
                        {m.eloDelta > 0 ? (
                          <span className="text-app-streak">±{m.eloDelta} Elo (K={m.kFactor})</span>
                        ) : (
                          <span className="text-app-muted">Unrated</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mutual Consent Actions */}
                  {isPending && (
                    <div className="pt-2 border-t border-app-border/40 flex flex-wrap items-center justify-between gap-2">
                      {m.canConfirm ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleConfirmMatch(m)}
                            disabled={busy}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-app-primary text-app-on-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shadow-xs"
                          >
                            <Check size={14} />
                            <span>Xác nhận tỉ số</span>
                          </button>
                          {m.canDispute && (
                            <button
                              type="button"
                              onClick={() => handleDisputeMatch(m)}
                              disabled={busy}
                              className="px-3 py-2 rounded-xl border border-app-loss text-app-loss text-xs font-bold hover:bg-app-loss/10 transition-colors"
                            >
                              Khiếu nại
                            </button>
                          )}
                        </div>
                      ) : m.hasConfirmed ? (
                        <div className="flex items-center gap-1.5 text-xs text-app-muted italic">
                          <Clock size={13} className="text-app-streak" />
                          <span>Bạn đã xác nhận. Đang chờ đại diện đội đối thủ bấm xác nhận…</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-app-muted">
                          Chờ VĐV trong trận vào xác nhận tỉ số.
                        </div>
                      )}

                      {m.canDispute && !m.canConfirm && (
                        <button
                          type="button"
                          onClick={() => handleDisputeMatch(m)}
                          disabled={busy}
                          className="text-xs text-app-loss font-semibold hover:underline"
                        >
                          Khiếu nại tỉ số
                        </button>
                      )}
                    </div>
                  )}

                  {isDisputed && (
                    <div className="p-2.5 rounded-xl bg-app-loss/10 border border-app-loss/30 text-xs text-app-loss flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Trận đấu đang có khiếu nại. Điểm số bị đóng băng cho đến khi hai bên hòa giải.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* ATTENDANCE SECTION */}
        <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-app-muted uppercase tracking-wider">
              DANH SÁCH THÀNH VIÊN VÀO SÂN ({players.length})
            </span>
          </div>

          <div className="divide-y divide-app-border/40">
            {players.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-app-background border border-app-border flex items-center justify-center font-bold text-xs text-app-primary">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-app-text">{p.name}</span>
                    <span className="text-[10px] text-app-muted">
                      {p.role === 'HOST' ? 'Chủ phòng (Host)' : 'Thành viên'} {p.elo ? `• ${p.elo} Elo` : ''}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-app-primary/10 text-app-primary border border-app-primary/20">
                  Có mặt
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* CREATE MATCH MODAL SHEET */}
      {isMatchDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-[28px] sm:rounded-[24px] p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h2 className="text-base font-black text-app-text">Ghi Nhận Ván Đấu Mới</h2>
              <button
                type="button"
                onClick={() => setIsMatchDialogOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background"
              >
                <X size={18} />
              </button>
            </div>

            {matchDialogError && (
              <div className="p-3 rounded-xl bg-app-loss/12 border border-app-loss/40 text-xs text-app-loss font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{matchDialogError}</span>
              </div>
            )}

            <form onSubmit={handleMatchFormSubmit} className="flex flex-col gap-4">
              {/* Singles vs Doubles */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">Thể thức thi đấu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDoubles(false)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      !isDoubles
                        ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted hover:border-app-muted'
                    }`}
                  >
                    Đánh Đơn (1v1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDoubles(true)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      isDoubles
                        ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted hover:border-app-muted'
                    }`}
                  >
                    Đánh Đôi (2v2)
                  </button>
                </div>
              </div>

              {/* Team A Selection */}
              <div className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col gap-2">
                <span className="text-xs font-black text-app-text">ĐỘI A</span>
                <select
                  value={teamAChoice1}
                  onChange={(e) => setTeamAChoice1(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                >
                  <option value="">-- Chọn VĐV 1 bên A --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.elo ? `(${p.elo} Elo)` : ''}
                    </option>
                  ))}
                </select>

                {isDoubles && (
                  <select
                    value={teamAChoice2}
                    onChange={(e) => setTeamAChoice2(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                  >
                    <option value="">-- Chọn VĐV 2 bên A --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.elo ? `(${p.elo} Elo)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Team B Selection */}
              <div className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col gap-2">
                <span className="text-xs font-black text-app-text">ĐỘI B</span>
                <select
                  value={teamBChoice1}
                  onChange={(e) => setTeamBChoice1(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                >
                  <option value="">-- Chọn VĐV 1 bên B --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.elo ? `(${p.elo} Elo)` : ''}
                    </option>
                  ))}
                </select>

                {isDoubles && (
                  <select
                    value={teamBChoice2}
                    onChange={(e) => setTeamBChoice2(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                  >
                    <option value="">-- Chọn VĐV 2 bên B --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.elo ? `(${p.elo} Elo)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Score Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">
                  Tỉ số (Đội A - Đội B)
                </label>
                <input
                  type="text"
                  value={scoreText}
                  onChange={(e) => setScoreText(e.target.value)}
                  placeholder="VD: 21-19 hoặc 21-19, 18-21, 21-15"
                  className="w-full h-10 px-3 rounded-xl bg-app-background border border-app-border text-sm font-mono font-bold text-app-text outline-none focus:border-app-primary"
                />
              </div>

              {/* Winner Choice */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">Đội chiến thắng</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWinnerTeam('A')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      winnerTeam === 'A'
                        ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội A Thắng
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinnerTeam('B')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      winnerTeam === 'B'
                        ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội B Thắng
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsMatchDialogOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-app-primary text-app-on-primary text-xs font-black uppercase hover:brightness-105 active:scale-95 transition-all shadow-xs"
                >
                  {busy ? 'Đang lưu…' : 'Lưu & Chờ Xác Nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
