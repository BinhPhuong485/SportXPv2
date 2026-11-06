import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  HelpCircle,
  X,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { ManagedRoomData, RoomMember } from './domain/managedRoom';
import { managedRoomRepository, roomFailure } from './data/managedRoomRepository';
import {
  sessionMatchService,
  SessionMatch,
  SetScore,
} from '../../services/sessionMatchService';

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

  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [matches, setMatches] = useState<SessionMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Match creation dialog state
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);
  const [teamAChoice1, setTeamAChoice1] = useState('');
  const [teamAChoice2, setTeamAChoice2] = useState('');
  const [teamBChoice1, setTeamBChoice1] = useState('');
  const [teamBChoice2, setTeamBChoice2] = useState('');
  const [scoreText, setScoreText] = useState('21-19');
  const [winnerTeam, setWinnerTeam] = useState<'A' | 'B'>('A');
  const [matchDialogError, setMatchDialogError] = useState<string | null>(null);

  // Dispute Modal (Khi bấm "Sai")
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<SessionMatch | null>(null);
  const [disputeWinnerTeam, setDisputeWinnerTeam] = useState<'A' | 'B'>('B');
  const [disputeScoreText, setDisputeScoreText] = useState('21-19');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Round 2 Modal (Chọn lại một lần)
  const [isRound2ModalOpen, setIsRound2ModalOpen] = useState(false);
  const [round2Target, setRound2Target] = useState<SessionMatch | null>(null);
  const [round2WinnerTeam, setRound2WinnerTeam] = useState<'A' | 'B'>('A');
  const [round2ScoreText, setRound2ScoreText] = useState('21-19');
  const [round2Error, setRound2Error] = useState<string | null>(null);

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
    .filter((m: RoomMember) => {
      const status = String(m.status || '');
      const isPlaying = m.is_playing ?? m.isPlaying ?? true;
      return (status === 'REGISTERED' || status === 'RECONFIRM') && Boolean(isPlaying);
    })
    .map((m: RoomMember) => {
      let playerName = m.display_name || m.name;
      const pid = String(m.user_id || m.id || '');
      if (!playerName || playerName === 'Vận động viên' || playerName === 'VĐV' || playerName === 'Người chơi') {
        if (pid === '9ded99f9-af7d-4297-829a-18e213294403' || m.public_id === 'ba1fd41e-b597-48d3-867a-5735bbc67d41') {
          playerName = 'Square';
        } else {
          playerName = playerName || 'Người chơi';
        }
      }
      return {
        id: pid,
        name: playerName,
        role: m.is_host ? 'HOST' : String(m.role || 'PLAYER'),
        avatarUrl: m.avatar_url,
        elo: m.elo_rating || undefined,
      };
    });

  const isUserInRoom = Boolean(room?.isHost || room?.myStatus === 'REGISTERED');
  const isRoomInProgress = room?.status === 'IN_PROGRESS';
  const isRoomCompleted = room?.status === 'COMPLETED';
  const isRoomCancelled = room?.status === 'CANCELLED';
  const isRoomWaitingToStart = room && ['OPEN', 'FULL', 'DRAFT'].includes(room.status);

  const handleStartRoom = async () => {
    if (!room || !room.isHost || busy) return;
    setBusy(true);
    setError(null);
    try {
      await managedRoomRepository.execute({
        action: 'start',
        roomId: room.id,
        requestId: crypto.randomUUID(),
        payload: {},
      });
      setSuccessMessage('Đã bắt đầu buổi chơi thành công! Bây giờ bạn có thể ghi nhận các set thi đấu.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err) {
      setError(roomFailure(err));
    } finally {
      setBusy(false);
    }
  };

  const openCreateMatch = () => {
    if (!isRoomInProgress) {
      if (isRoomWaitingToStart) {
        setError('Buổi chơi chưa bắt đầu. Cần Host bấm "Bắt đầu buổi chơi" trước khi ghi nhận ván đấu.');
      } else if (isRoomCompleted) {
        setError('Buổi chơi đã kết thúc. Không thể ghi nhận thêm ván đấu mới.');
      }
      return;
    }
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

  const parseScoreSegments = (raw: string): SetScore[] => {
    const segments = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const sets = segments.map((seg, idx) => {
      const parts = seg.split('-');
      return {
        set: idx + 1,
        a: parseInt(parts[0] || '21', 10),
        b: parseInt(parts[1] || '19', 10),
      };
    });
    return sets.length > 0 ? sets : [{ set: 1, a: 21, b: 19 }];
  };

  const handleMatchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    if (!isRoomInProgress) {
      setMatchDialogError('Chỉ có thể ghi nhận ván đấu khi buổi chơi đang diễn ra.');
      return;
    }

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

    const scores = parseScoreSegments(scoreText);

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

  // 1. Confirm ("ĐÚNG")
  const handleConfirmMatch = async (m: SessionMatch) => {
    if (busy || !effectiveUserId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sessionMatchService.confirmMatch(m.id, effectiveUserId, 1.0);
      if (res.confirmed) {
        if (res.eloResults && res.eloResults.length > 0) {
          const myResult = res.eloResults.find((r: any) => r.playerId === effectiveUserId);
          if (myResult) {
            setSuccessMessage(
              `Hai bên đã đồng thuận! Elo: ${myResult.oldElo} → ${myResult.newElo} (${myResult.eloChange >= 0 ? '+' : ''}${myResult.eloChange} Elo). Hạng: ${myResult.newTier}`
            );
          } else {
            setSuccessMessage('Hai bên đã đồng thuận thành công! Kết quả đã chốt và cập nhật Elo.');
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

  // 2. Open Dispute Modal ("SAI")
  const openDisputeModal = (m: SessionMatch) => {
    setDisputeTarget(m);
    setDisputeWinnerTeam(m.winnerTeam === 'A' ? 'B' : 'A');
    setDisputeScoreText(m.scoreText || '21-19');
    setDisputeReason('');
    setDisputeError(null);
    setIsDisputeModalOpen(true);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTarget || !effectiveUserId || busy) return;

    const trimmedScore = disputeScoreText.trim();
    if (!trimmedScore) {
      setDisputeError('Bảo vệ người thắng: phản đối bắt buộc phải kèm tỉ số hợp lệ.');
      return;
    }

    const scores = parseScoreSegments(trimmedScore);

    setBusy(true);
    setDisputeError(null);
    try {
      await sessionMatchService.submitDispute({
        matchId: disputeTarget.id,
        userId: effectiveUserId,
        winnerTeam: disputeWinnerTeam,
        scoreText: trimmedScore,
        scores,
        reason: disputeReason.trim() || undefined,
      });

      setIsDisputeModalOpen(false);
      setSuccessMessage('Đã ghi nhận phản đối! Hai bên có thể chọn lại một lần để thống nhất.');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      setDisputeError(err.message || 'Không thể gửi khiếu nại.');
    } finally {
      setBusy(false);
    }
  };

  // 3. Round 2 Choice Modal (Chọn lại một lần)
  const openRound2Modal = (m: SessionMatch) => {
    setRound2Target(m);
    setRound2WinnerTeam(m.winnerTeam);
    setRound2ScoreText(m.scoreText || '21-19');
    setRound2Error(null);
    setIsRound2ModalOpen(true);
  };

  const handleRound2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round2Target || !effectiveUserId || busy) return;

    const trimmedScore = round2ScoreText.trim();
    if (!trimmedScore) {
      setRound2Error('Vui lòng nhập tỉ số cho lần chọn lại.');
      return;
    }

    const scores = parseScoreSegments(trimmedScore);

    setBusy(true);
    setRound2Error(null);
    try {
      const res = await sessionMatchService.submitRound2Choice({
        matchId: round2Target.id,
        userId: effectiveUserId,
        winnerTeam: round2WinnerTeam,
        scoreText: trimmedScore,
        scores,
      });

      setIsRound2ModalOpen(false);
      if (res.resolution === 'exact_match') {
        setSuccessMessage('Hai bên đã thống nhất kết quả ở lần chọn thứ hai! Ván đấu đã được xác nhận (100% Elo).');
      } else if (res.resolution === 'simple_winner_discounted') {
        setSuccessMessage('Cùng đồng thuận người thắng! Đã tính thắng/thua đơn giản với trọng số giảm 50%.');
      } else if (res.resolution === 'cancelled_mismatch') {
        setSuccessMessage('Bất đồng về người chiến thắng! Ván đấu đã bị hủy (0 điểm Elo) và ghi nhận tỉ lệ tranh chấp.');
      } else {
        setSuccessMessage('Đã lưu lựa chọn lần 2 của bạn. Đang chờ đối thủ gửi lựa chọn để chốt kết quả.');
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      setRound2Error(err.message || 'Lỗi khi gửi lựa chọn lần 2.');
    } finally {
      setBusy(false);
    }
  };

  // 4. Auto-Confirm after 24h
  const handleAutoConfirm24h = async (m: SessionMatch) => {
    if (busy || !effectiveUserId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sessionMatchService.autoConfirmAfter24h(m.id);
      if (res.confirmed) {
        setSuccessMessage('Đã tự động xác nhận sau 24h không có phản hồi (trọng số 50%).');
      }
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Không thể tự động chốt kết quả.');
    } finally {
      setBusy(false);
    }
  };

  const getPlayerName = (id: string): string => {
    const member = players.find((p) => p.id === id);
    if (member?.name) return member.name;
    if (id === '9ded99f9-af7d-4297-829a-18e213294403' || id === 'ba1fd41e-b597-48d3-867a-5735bbc67d41') {
      return 'Square';
    }
    return id.substring(0, 8);
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

  // Access Restriction Guard: User is not host and not a registered player
  if (!isUserInRoom) {
    return (
      <div className="min-h-screen w-full bg-app-background flex flex-col antialiased text-app-text">
        <header className="sticky top-0 z-30 w-full bg-app-surface/90 backdrop-blur-md border-b border-app-border">
          <div className="w-full max-w-[720px] mx-auto px-4 h-14 flex items-center gap-2">
            <button
              onClick={() => navigate(`/rooms/${roomId}`, { replace: true })}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-sm font-black tracking-tight line-clamp-1">{room.title}</h1>
          </div>
        </header>

        <main className="w-full max-w-[540px] mx-auto px-4 py-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-base font-black text-app-text">Chưa Tham Gia Buổi Chơi</h2>
          <p className="text-xs text-app-muted leading-relaxed max-w-sm">
            Bạn chưa đăng ký tham gia kèo thi đấu này. Chỉ Host và các VĐV đã đăng ký xác nhận mới có quyền vào phòng để theo dõi và ghi nhận tỉ số set đấu.
          </p>
          <button
            onClick={() => navigate(`/rooms/${roomId}`, { replace: true })}
            className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            Quay Lại Chi Tiết Buổi Chơi
          </button>
        </main>
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
              onClick={() => navigate(`/rooms/${roomId}`, { replace: true })}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors cursor-pointer"
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

        {/* Room Status Banners */}
        {isRoomWaitingToStart && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Buổi chơi chưa bắt đầu
                </span>
                <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  {room.isHost
                    ? 'Bạn là Host: hãy bấm "Bắt đầu buổi chơi" bên cạnh để mở khóa ghi nhận tỉ số.'
                    : 'Đang chờ Host bấm bắt đầu buổi chơi để mở khóa ghi nhận các set đấu.'}
                </span>
              </div>
            </div>
            {room.isHost && (
              <button
                type="button"
                onClick={handleStartRoom}
                disabled={busy}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Play size={13} fill="currentColor" />
                <span>Bắt đầu ngay</span>
              </button>
            )}
          </div>
        )}

        {isRoomCompleted && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Buổi chơi đã kết thúc
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Host đã hoàn tất buổi chơi. Không thể ghi nhận thêm ván đấu mới.
              </span>
            </div>
          </div>
        )}

        {isRoomCancelled && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 shadow-xs">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Buổi chơi đã bị hủy
              </span>
            </div>
          </div>
        )}

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
              disabled={busy || !isRoomInProgress || players.length < 2}
              className={`h-8 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs ${
                isRoomInProgress && players.length >= 2
                  ? 'bg-app-primary text-app-on-primary hover:brightness-105 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-app-muted opacity-60 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              }`}
              title={
                !isRoomInProgress
                  ? isRoomWaitingToStart
                    ? 'Chờ Host bấm "Bắt đầu buổi chơi" để ghi nhận ván đấu'
                    : 'Buổi chơi đã kết thúc'
                  : undefined
              }
            >
              {!isRoomInProgress ? (
                <>
                  <Lock size={13} />
                  <span>{isRoomCompleted ? 'Đã kết thúc' : 'Chờ Host bắt đầu'}</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>+ Ghi set cầu</span>
                </>
              )}
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-app-surface border border-app-border text-center flex flex-col items-center gap-2">
              <HelpCircle size={32} className="text-app-muted/60" />
              <p className="text-sm font-bold text-app-text">Chưa có ván đấu nào được ghi nhận</p>
              <p className="text-xs text-app-muted max-w-xs leading-relaxed">
                {isRoomInProgress
                  ? 'Sau mỗi set đấu, bấm nút "+ Ghi set cầu" để nhập tỉ số. Đối thủ sẽ nhận được yêu cầu bấm xác nhận.'
                  : 'Sau khi Host bấm bắt đầu buổi chơi, các VĐV sẽ có thể ghi nhận tỉ số tại đây.'}
              </p>
            </div>
          ) : (
            matches.map((m) => {
              const isConfirmed = m.status === 'confirmed';
              const isDisputed = m.status === 'disputed';
              const isPending = m.status === 'pending';
              const isVoid = m.status === 'void';

              const teamAText =
                m.teamANames && m.teamANames.length > 0
                  ? m.teamANames.join(' + ')
                  : m.teamAPlayerIds.map(getPlayerName).join(' + ');

              const teamBText =
                m.teamBNames && m.teamBNames.length > 0
                  ? m.teamBNames.join(' + ')
                  : m.teamBPlayerIds.map(getPlayerName).join(' + ');

              const winnerText = m.winnerTeam === 'A' ? teamAText : teamBText;

              // Check if dispute is in active conflict phase
              const disputePhase = m.disputeData?.phase || 'none';
              const isConflictRound1 = disputePhase === 'conflict_round_1' || disputePhase === 'waiting_round_2';

              // User submitted round 2?
              const userRound2Done = (m.disputeData?.proposals || []).some(
                (p: any) => p.round === 2 && (p.by === effectiveUserId || p.by === user?.id)
              );

              return (
                <div
                  key={m.id}
                  className={`bg-app-surface rounded-[20px] p-4 border flex flex-col gap-3 shadow-xs transition-all ${
                    isPending && m.canConfirm
                      ? 'border-app-primary ring-2 ring-app-primary/20'
                      : isDisputed
                      ? 'border-app-loss/60 ring-2 ring-rose-500/10'
                      : isVoid
                      ? 'border-slate-300 dark:border-slate-700 opacity-80'
                      : 'border-app-border'
                  }`}
                >
                  {/* Match Header: Teams & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-app-text">
                      <span className={m.winnerTeam === 'A' && !isVoid ? 'text-app-primary' : ''}>
                        {teamAText}
                      </span>
                      <span className="text-app-muted font-normal">vs</span>
                      <span className={m.winnerTeam === 'B' && !isVoid ? 'text-app-primary' : ''}>
                        {teamBText}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                        isConfirmed
                          ? 'bg-app-primary/15 text-app-primary border border-app-primary/40'
                          : isDisputed
                          ? 'bg-app-loss/15 text-app-loss border border-app-loss/40'
                          : isVoid
                          ? 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
                          : 'bg-app-streak/15 text-app-streak border border-app-streak/40'
                      }`}
                    >
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 size={11} />
                          <span>{m.disputeData?.autoConfirmed ? 'Tự Động Chốt' : 'Đã Đồng Thuận'}</span>
                        </>
                      ) : isDisputed ? (
                        <>
                          <AlertTriangle size={11} />
                          <span>Đang Khiếu Nại</span>
                        </>
                      ) : isVoid ? (
                        <>
                          <X size={11} />
                          <span>Đã Hủy Ván Đấu</span>
                        </>
                      ) : (
                        <>
                          <Clock size={11} />
                          <span>Chờ Xác Nhận ({m.confirmations.length}/2)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Score & Winner */}
                  <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black font-mono tracking-wider ${isVoid ? 'text-app-muted line-through' : 'text-app-primary'}`}>
                        {m.scoreText}
                      </span>
                      {!isVoid ? (
                        <span className="text-xs font-bold text-app-muted">
                          • Đội {m.winnerTeam} ({winnerText}) Thắng
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-500">
                          • Hủy (Bất đồng người thắng)
                        </span>
                      )}
                    </div>

                    {/* Elo Delta Indicator */}
                    {isConfirmed && (
                      <div className="text-xs font-extrabold">
                        {m.eloDelta > 0 ? (
                          <span className="text-app-streak">
                            ±{m.eloDelta} Elo {m.kFactor > 0 ? `(K=${m.kFactor}${m.disputeData?.kFactorMultiplier ? ' - 50%' : ''})` : ''}
                          </span>
                        ) : (
                          <span className="text-app-muted">Unrated</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resolution Notes (if any) */}
                  {m.disputeData?.resolutionNote && (
                    <div className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-app-muted font-medium">
                      ℹ️ {m.disputeData.resolutionNote}
                    </div>
                  )}

                  {/* Case 1: PENDING -> Mutual Consent Actions (ĐÚNG / SAI) */}
                  {isPending && (
                    <div className="pt-2 border-t border-app-border/40 flex flex-col gap-2.5">
                      {m.canConfirm ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-bold text-app-text">
                            Đội bạn cần xác nhận: Đội {m.winnerTeam} ({winnerText}) thắng {m.scoreText}?
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmMatch(m)}
                              disabled={busy}
                              className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                            >
                              <Check size={14} />
                              <span>ĐÚNG (Xác nhận)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDisputeModal(m)}
                              disabled={busy}
                              className="flex-1 px-4 py-2 rounded-xl border border-rose-500/80 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <X size={14} />
                              <span>SAI (Nhập lại)</span>
                            </button>
                          </div>
                        </div>
                      ) : m.hasConfirmed ? (
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-app-muted italic">
                            <Clock size={13} className="text-app-streak shrink-0" />
                            <span>Bạn đã xác nhận. Đang chờ đại diện đối thủ bấm xác nhận…</span>
                          </div>
                          {m.canDispute && (
                            <button
                              type="button"
                              onClick={() => openDisputeModal(m)}
                              disabled={busy}
                              className="text-xs text-rose-600 hover:underline font-semibold"
                            >
                              Phản đối / Khiếu nại
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-app-muted italic">
                          Chờ đại diện các đội trong trận vào bấm xác nhận.
                        </div>
                      )}

                      {/* 24H Auto-Confirm Footer */}
                      <div className="flex items-center justify-between text-[11px] text-app-muted border-t border-app-border/30 pt-1.5">
                        <span>⏰ Tự động xác nhận sau 24h nếu đối thủ im lặng (trọng số 50%)</span>
                        {m.isAutoConfirmEligible && (
                          <button
                            type="button"
                            onClick={() => handleAutoConfirm24h(m)}
                            disabled={busy}
                            className="text-emerald-600 hover:underline font-bold"
                          >
                            Chốt tự động ngay
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Case 2: DISPUTED -> Active Conflict & Round 2 Rechoice */}
                  {isDisputed && isConflictRound1 && (
                    <div className="p-3.5 rounded-xl bg-app-loss/8 border border-app-loss/30 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-black text-rose-600">
                        <AlertTriangle size={15} />
                        <span>Tỉ số hai bên chưa khớp — Lệch lần 1</span>
                      </div>

                      {/* Proposals Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {m.disputeData?.proposals.map((prop: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-app-surface border border-app-border flex flex-col gap-1"
                          >
                            <span className="text-[10px] uppercase font-bold text-app-muted">
                              {idx === 0 ? 'Người ghi ván' : 'Người phản đối'}
                            </span>
                            <div className="font-bold text-app-text">
                              Đội {prop.winnerTeam} thắng ({prop.scoreText})
                            </div>
                            {prop.reason && (
                              <p className="text-[11px] text-app-muted italic">"{prop.reason}"</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-app-muted leading-relaxed">
                        Theo quy định: hai bên cùng <b>chọn lại một lần</b>. Nếu vẫn lệch nhưng cùng công nhận ai thắng thì tính thắng/thua đơn giản (trọng số giảm 50%). Nếu bất đồng cả người thắng thì ván đấu bị hủy (0 điểm).
                      </div>

                      {/* Round 2 Action */}
                      <div className="flex items-center justify-between pt-1">
                        {userRound2Done ? (
                          <div className="flex items-center gap-1.5 text-xs text-app-muted italic">
                            <Clock size={13} className="text-app-streak" />
                            <span>Bạn đã gửi lựa chọn lần 2. Đang chờ đối thủ gửi lựa chọn…</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openRound2Modal(m)}
                            disabled={busy}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <RotateCcw size={13} />
                            <span>CHỌN LẠI TỈ SỐ (LẦN 2)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Case 3: VOID / Cancelled */}
                  {isVoid && (
                    <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs text-slate-500 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>Ván đấu đã bị hủy do hai bên không thống nhất được người thắng (0 điểm Elo).</span>
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

          <div className="flex flex-col divide-y divide-app-border/40">
            {players.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-app-primary/15 text-app-primary font-black text-xs flex items-center justify-center">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-app-text">{p.name}</span>
                    <span className="text-[10px] text-app-muted">
                      {p.role === 'HOST' ? 'Chủ phòng (Host)' : 'Thành viên'} {p.elo ? `• ${p.elo} Elo` : ''}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                  Có mặt
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE MATCH FORM                               */}
      {/* ======================================================== */}
      {isMatchDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-app-surface border border-app-border rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-app-primary" />
                <h3 className="text-sm font-black text-app-text">Ghi Nhận Set Đấu Mới</h3>
              </div>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase transition-all shadow-xs"
                >
                  {busy ? 'Đang lưu…' : 'Lưu & Chờ Xác Nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DISPUTE FORM (KHI BẤM "SAI")                     */}
      {/* ======================================================== */}
      {isDisputeModalOpen && disputeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-app-surface border border-rose-500/40 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                <h3 className="text-sm font-black text-app-text">Phản Đối & Nhập Lại Tỉ Số</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-app-muted leading-relaxed">
              Bảo vệ người thắng: phản đối bắt buộc phải kèm tỉ số và đội thắng theo ghi nhận thực tế của bạn.
            </p>

            {disputeError && (
              <div className="p-3 rounded-xl bg-app-loss/12 border border-app-loss/40 text-xs text-app-loss font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{disputeError}</span>
              </div>
            )}

            <form onSubmit={handleDisputeSubmit} className="flex flex-col gap-3.5">
              {/* Winner Choice */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">Đội chiến thắng theo bạn</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisputeWinnerTeam('A')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      disputeWinnerTeam === 'A'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội A Thắng
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputeWinnerTeam('B')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      disputeWinnerTeam === 'B'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội B Thắng
                  </button>
                </div>
              </div>

              {/* Score Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">
                  Tỉ số theo bạn (VD: 21-19 hoặc 19-21)
                </label>
                <input
                  type="text"
                  value={disputeScoreText}
                  onChange={(e) => setDisputeScoreText(e.target.value)}
                  placeholder="VD: 19-21"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-app-background border border-app-border text-sm font-mono font-bold text-app-text outline-none focus:border-rose-500"
                />
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">Ghi chú phản đối (tùy chọn)</label>
                <input
                  type="text"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="VD: Bên tôi ghi điểm cuối chạm lưới..."
                  className="w-full h-10 px-3 rounded-xl bg-app-background border border-app-border text-xs text-app-text outline-none focus:border-rose-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black uppercase transition-all shadow-xs"
                >
                  {busy ? 'Đang gửi…' : 'Gửi Phản Đối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ROUND 2 RECHOICE FORM                            */}
      {/* ======================================================== */}
      {isRound2ModalOpen && round2Target && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-app-surface border border-amber-500/40 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-600" />
                <h3 className="text-sm font-black text-app-text">Chọn Lại Tỉ Số (Lần 2)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRound2ModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-app-muted leading-relaxed">
              Đây là cơ hội thương lượng cuối cùng. Nếu cả hai cùng đồng ý đội thắng, hệ thống sẽ chốt thắng/thua đơn giản (50% trọng số Elo). Nếu không thống nhất đội thắng, ván đấu sẽ bị hủy (0 điểm).
            </div>

            {round2Error && (
              <div className="p-3 rounded-xl bg-app-loss/12 border border-app-loss/40 text-xs text-app-loss font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{round2Error}</span>
              </div>
            )}

            <form onSubmit={handleRound2Submit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">Đội chiến thắng</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRound2WinnerTeam('A')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      round2WinnerTeam === 'A'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội A Thắng
                  </button>
                  <button
                    type="button"
                    onClick={() => setRound2WinnerTeam('B')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      round2WinnerTeam === 'B'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội B Thắng
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">Tỉ số thống nhất</label>
                <input
                  type="text"
                  value={round2ScoreText}
                  onChange={(e) => setRound2ScoreText(e.target.value)}
                  placeholder="VD: 21-19"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-app-background border border-app-border text-sm font-mono font-bold text-app-text outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsRound2ModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black uppercase transition-all shadow-xs"
                >
                  {busy ? 'Đang lưu…' : 'Xác Nhận Lựa Chọn Lần 2'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
