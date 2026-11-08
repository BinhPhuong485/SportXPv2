import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Zap,
  Trophy,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Clock,
  Sparkles,
  QrCode,
  Flame,
  Swords,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ManagedRoomData, RoomMember } from '../../domain/managedRoom';
import { managedRoomRepository, roomFailure } from '../../data/managedRoomRepository';
import {
  sessionMatchService,
  SessionMatch,
  SetScore,
} from '../../../../services/sessionMatchService';
import { calculateElo } from '../../../../services/eloEngine';
import { useAuthStore } from '../../../../shared/hooks/useAuth';
import { ModalSheet } from '../../../../shared/components/ModalSheet';
import { Avatar } from '../../../../shared/components/Avatar';
import { BentoCard } from '../../../../shared/components/BentoCard';

interface PrivateGameLobbyPageProps {
  room: ManagedRoomData;
  onReload: () => Promise<void>;
}

export const PrivateGameLobbyPage: React.FC<PrivateGameLobbyPageProps> = ({ room, onReload }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?.id || '';

  const [matches, setMatches] = useState<SessionMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Score Entry Modal state
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [sets, setSets] = useState<SetScore[]>([
    { set: 1, a: 21, b: 19 },
    { set: 2, a: 19, b: 21 },
    { set: 3, a: 21, b: 17 },
  ]);
  const [winnerTeam, setWinnerTeam] = useState<'A' | 'B'>('A');
  const [numSets, setNumSets] = useState<2 | 3>(2);

  // Dispute Modal state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<SessionMatch | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  const isHost = room.isHost;
  const is1v1 = room.capacity <= 2;
  const totalCapacity = room.capacity || (is1v1 ? 2 : 4);

  const registeredMembers = (room.members || []).filter(
    (m: RoomMember) => m.status === 'REGISTERED' || m.status === 'RECONFIRM'
  );

  // Partition members: Team A (Host & partner) vs Team B (Opponents)
  const hostMember = registeredMembers.find((m) => m.is_host) || registeredMembers[0];
  const otherMembers = registeredMembers.filter((m) => m !== hostMember);

  const teamAPlayers: RoomMember[] = [];
  const teamBPlayers: RoomMember[] = [];

  if (hostMember) teamAPlayers.push(hostMember);

  if (is1v1) {
    if (otherMembers.length > 0) teamBPlayers.push(otherMembers[0]);
  } else {
    // 2v2 format
    if (otherMembers[0]) teamAPlayers.push(otherMembers[0]);
    if (otherMembers[1]) teamBPlayers.push(otherMembers[1]);
    if (otherMembers[2]) teamBPlayers.push(otherMembers[2]);
  }

  const isRoomFull = registeredMembers.length >= totalCapacity;
  const isUserInRoom = registeredMembers.some((m) => m.user_id === currentUserId);
  const isStarted = room.status === 'IN_PROGRESS';
  const isCompleted = room.status === 'COMPLETED';

  // Effective Join Code
  const joinCode =
    room.joinCode ||
    (room.notes ? room.notes.match(/\[CODE:([A-Za-z0-9_-]+)\]/)?.[1] : null) ||
    room.roomCode.replace(/^#/, '');

  const roomShareUrl = `${window.location.origin}/#/rooms/${room.id}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    showToast(`Đã sao chép mã phòng: ${joinCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopiedLink(true);
    showToast('Đã sao chép link mời vào phòng');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Load session matches
  const loadMatches = useCallback(async () => {
    if (!room.id) return;
    try {
      const matchRows = await sessionMatchService.listMatches(room.id, currentUserId);
      setMatches(matchRows);
    } catch {
      // non-blocking
    }
  }, [room.id, currentUserId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // 1. Action: Host starts game immediately
  const handleStartMatch = async () => {
    if (!isHost || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await managedRoomRepository.execute({
        action: 'start',
        roomId: room.id,
        requestId: crypto.randomUUID(),
        payload: {},
      });
      showToast('⚡ Trận đấu đã chính thức bắt đầu!');
      await onReload();
      await loadMatches();
    } catch (err) {
      setActionError(roomFailure(err));
    } finally {
      setBusy(false);
    }
  };

  // 2. Action: Player joins match lobby
  const handleJoinLobby = async () => {
    if (busy || isUserInRoom) return;
    setBusy(true);
    setActionError(null);
    try {
      await managedRoomRepository.execute({
        action: 'join',
        roomId: room.id,
        requestId: crypto.randomUUID(),
        payload: { room_code: room.roomCode },
      });
      showToast('Bạn đã vào phòng thi đấu thành công!');
      await onReload();
    } catch (err) {
      setActionError(roomFailure(err));
    } finally {
      setBusy(false);
    }
  };

  // 3. Score submission
  const handleOpenScoreModal = () => {
    setSets([
      { set: 1, a: 21, b: 19 },
      { set: 2, a: 19, b: 21 },
      { set: 3, a: 21, b: 17 },
    ]);
    setNumSets(2);
    setWinnerTeam('A');
    setIsScoreModalOpen(true);
  };

  const handleScoreChange = (setIdx: number, team: 'a' | 'b', delta: number) => {
    setSets((prev) =>
      prev.map((s, idx) => {
        if (idx !== setIdx) return s;
        const current = s[team];
        const updated = Math.max(0, Math.min(30, current + delta));
        return { ...s, [team]: updated };
      })
    );
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.id || busy) return;

    const teamAPlayerIds = teamAPlayers.map((m) => m.user_id);
    const teamBPlayerIds = teamBPlayers.map((m) => m.user_id);

    // If opposing slot is solo/mock or empty during demo, auto-fill current user as A and placeholder as B
    const effectiveTeamB = teamBPlayerIds.length > 0 ? teamBPlayerIds : ['mock-opponent-player'];

    const effectiveScores = sets.slice(0, numSets);

    setBusy(true);
    setActionError(null);
    try {
      await sessionMatchService.createMatch({
        roomId: room.id,
        matchType: is1v1 ? 'singles' : 'doubles',
        teamA: teamAPlayerIds,
        teamB: effectiveTeamB,
        scores: effectiveScores,
        winnerTeam,
        createdBy: currentUserId,
      });

      setIsScoreModalOpen(false);
      showToast('Đã lưu kết quả trận đấu!');
      await loadMatches();
      await onReload();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi gửi kết quả.');
    } finally {
      setBusy(false);
    }
  };

  // 4. Opponent confirms match (ĐỒNG Ý)
  const handleConfirmMatch = async (match: SessionMatch) => {
    if (busy || !currentUserId) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await sessionMatchService.confirmMatch(match.id, currentUserId, 1.0);
      if (res.confirmed) {
        showToast('🎉 Hai bên đã chốt tỉ số! Điểm Elo đã được cập nhật chính thức.');
        try {
          await managedRoomRepository.execute({
            action: 'finish',
            roomId: room.id,
            requestId: crypto.randomUUID(),
            payload: {},
          });
        } catch {
          // non-blocking
        }
      } else {
        showToast('Đã ghi nhận kết quả!');
      }
      await loadMatches();
      await onReload();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi xác nhận ván đấu.');
    } finally {
      setBusy(false);
    }
  };

  // 5. Opponent disputes match (BÁO SAI)
  const handleOpenDispute = (match: SessionMatch) => {
    setDisputeTarget(match);
    setDisputeReason('');
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeTarget || busy) return;
    setBusy(true);
    try {
      await sessionMatchService.submitDispute({
        matchId: disputeTarget.id,
        userId: currentUserId,
        winnerTeam: disputeTarget.winnerTeam === 'A' ? 'B' : 'A',
        scoreText: '21-19',
        scores: [{ set: 1, a: 19, b: 21 }],
        reason: disputeReason || 'Tỉ số không chính xác',
      });
      setIsDisputeModalOpen(false);
      showToast('Đã báo tranh chấp. Trạng thái Elo đang được tạm khóa.');
      await loadMatches();
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi gửi báo sai.');
    } finally {
      setBusy(false);
    }
  };

  // Live Elo calculation preview
  const hostElo = hostMember?.elo_rating ?? 1200;
  const opponentElo = teamBPlayers[0]?.elo_rating ?? 1200;
  const eloPreview = calculateElo({
    teamAElos: [hostElo],
    teamBElos: [opponentElo],
    winnerTeam,
    h2hMatchesLast24h: 0,
  });

  const statusLabel = isCompleted
    ? 'Đã kết thúc'
    : isStarted
    ? 'Đang diễn ra'
    : isRoomFull
    ? 'Sẵn sàng đấu'
    : 'Đang đợi đối thủ';

  return (
    <div className="min-h-screen w-full bg-app-background text-app-text flex flex-col select-none antialiased">
      {/* ============================================================== */}
      {/* 1. TOP APP BAR (Consistent with RoomDetailPage & SportXP)     */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-30 w-full bg-app-surface/95 backdrop-blur-md border-b border-app-border">
        <div className="w-full max-w-content md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-2">
          {/* Left: Back button & Title block */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <button
              onClick={() => navigate('/rooms')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách kèo"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex flex-col min-w-0">
              {/* Desktop/Tablet badges */}
              <div className="hidden sm:flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-1 whitespace-nowrap">
                  <Trophy size={11} className="text-emerald-600" />
                  <span>{is1v1 ? 'Đấu Đơn 1v1 Tính Elo' : 'Đấu Đôi 2v2 Tính Elo'}</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    isCompleted
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : isStarted
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isRoomFull
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              {/* Main Room Title */}
              <h1 className="text-sm sm:text-base font-extrabold text-app-text truncate">
                {room.title || 'Phòng Thi Đấu 1v1'}
              </h1>
              {/* Mobile-only compact status sub-line */}
              <div className="flex sm:hidden items-center gap-1.5 text-[11px] text-app-muted truncate">
                <span className="inline-flex items-center gap-1 font-bold">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isStarted
                        ? 'bg-rose-500 animate-pulse'
                        : isRoomFull
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span
                    className={
                      isStarted
                        ? 'text-rose-600 dark:text-rose-400'
                        : isRoomFull
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {statusLabel}
                  </span>
                </span>
                <span>•</span>
                <span className="truncate">{is1v1 ? 'Đơn 1v1 Elo' : 'Đôi 2v2 Elo'}</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Header Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Join Code Chip */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-app-text font-mono text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Nhấn để chép mã phòng"
            >
              <span className="hidden sm:inline text-app-muted font-sans font-normal text-[11px]">MÃ:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-black">#{joinCode}</span>
              {copiedCode ? (
                <Check size={12} className="text-emerald-600 shrink-0" />
              ) : (
                <Copy size={12} className="text-app-muted shrink-0" />
              )}
            </button>

            {/* QR Code trigger */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-app-text flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
              title="Mã QR phòng"
            >
              <QrCode size={15} />
            </button>

            {/* Reload button */}
            <button
              type="button"
              onClick={() => {
                onReload();
                loadMatches();
              }}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-app-text flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
              title="Tải lại phòng"
            >
              <RotateCcw size={14} className={busy ? 'animate-spin text-emerald-600' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. TOAST & NOTIFICATION BANNERS                                */}
      {/* ============================================================== */}
      {toastMessage && (
        <div className="sticky top-16 z-40 w-full max-w-md mx-auto px-4 mt-2">
          <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg">
            <Sparkles size={16} className="text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {actionError && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-3">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN ARENA CONTENT (SportXP Light Theme)                    */}
      {/* ============================================================== */}
      <main className="w-full max-w-content md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6 py-4 sm:py-5 flex flex-col gap-4 sm:gap-5 flex-1">
        {/* Mobile Format & Status Badge Bar */}
        <div className="flex sm:hidden items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-1 shadow-2xs whitespace-nowrap">
              <Trophy size={12} className="text-emerald-600 shrink-0" />
              <span>{is1v1 ? 'Đấu Đơn 1v1 Tính Elo' : 'Đấu Đôi 2v2 Tính Elo'}</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                isCompleted
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : isStarted
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isRoomFull
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ARENA CARD: BADMINTON COURT (BÊN A VS BÊN B)                */}
        {/* ============================================================ */}
        <section className="w-full rounded-bento bg-white dark:bg-app-surface border border-app-border p-5 sm:p-6 shadow-2xs flex flex-col gap-4 relative overflow-hidden">
          {/* Header row inside Court Card */}
          <div className="flex items-center justify-between border-b border-app-border/70 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-app-text">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-extrabold">{room.courtName || 'Sân Cầu Lông'}</span>
              {room.courtLabel && <span className="text-app-muted">• {room.courtLabel}</span>}
            </div>
            <span className="font-mono text-xs font-bold text-app-muted">
              THỂ THỨC: BO3 • 21 ĐIỂM
            </span>
          </div>

          {/* Badminton Court Surface Area */}
          <div className="relative rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/90 dark:border-emerald-800/40 p-4 sm:p-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative items-center">
              {/* TEAM A DECK (BÊN A) */}
              <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs relative">
                <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>BÊN A (HOME)</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-app-muted">
                    {teamAPlayers.length}/{is1v1 ? 1 : 2} VĐV
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {teamAPlayers.map((p, idx) => (
                    <div
                      key={p.user_id || idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={p.avatar_url}
                          alt={p.display_name || p.name || 'VĐV'}
                          size="md"
                          className="ring-2 ring-emerald-500/40"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-sm text-app-text truncate">
                              {p.display_name || p.name || 'Người chơi'}
                            </span>
                            {p.is_host && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                HOST
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                            {p.elo_rating ?? 1200} Elo ·{' '}
                            <span className="text-app-muted font-normal">{p.tier_name || 'Hạng TB'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>SẴN SÀNG</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty Slot A2 if 2v2 */}
                  {!is1v1 && teamAPlayers.length < 2 && (
                    <div className="p-3.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 flex items-center justify-center gap-2 text-emerald-700 text-xs font-bold">
                      <Plus size={14} />
                      <span>Đang chờ đồng đội vào phe A...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CENTER VS BADGE */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-amber-500 border-2 border-white dark:border-slate-800 text-white shadow-md flex items-center justify-center font-black text-xs tracking-wider">
                  VS
                </div>
              </div>

              {/* TEAM B DECK (BÊN B - ĐỐI THỦ) */}
              <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-2xs relative">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>BÊN B (ĐỐI THỦ)</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-app-muted">
                    {teamBPlayers.length}/{is1v1 ? 1 : 2} VĐV
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {teamBPlayers.length > 0 ? (
                    teamBPlayers.map((p, idx) => (
                      <div
                        key={p.user_id || idx}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={p.avatar_url}
                            alt={p.display_name || p.name || 'Đối thủ'}
                            size="md"
                            className="ring-2 ring-amber-500/40"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-app-text truncate">
                              {p.display_name || p.name || 'Đối thủ'}
                            </span>
                            <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                              {p.elo_rating ?? 1200} Elo ·{' '}
                              <span className="text-app-muted font-normal">{p.tier_name || 'Hạng TB'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>SẴN SÀNG</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Clean Empty Slot for Opponent */
                    <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col items-center text-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 border border-amber-300 flex items-center justify-center text-amber-800 dark:text-amber-300 font-black text-sm">
                        ?
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-amber-900 dark:text-amber-300">
                          Đang chờ đối thủ vào phòng...
                        </span>
                        <span className="text-[11px] text-app-muted mt-0.5">
                          Chia sẻ mã PIN <strong className="text-emerald-700 font-mono">{joinCode}</strong> hoặc quét QR
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 border border-amber-300 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <Share2 size={13} />
                        <span>Gửi link mời cho đối thủ</span>
                      </button>
                    </div>
                  )}

                  {/* Empty Slot B2 if 2v2 */}
                  {!is1v1 && teamBPlayers.length === 1 && (
                    <div className="p-3.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-center gap-2 text-amber-700 text-xs font-bold">
                      <Plus size={14} />
                      <span>Đang chờ VĐV thứ 2 của phe B...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar inside Court Card */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-app-muted">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Phòng thi đấu có bảo chứng Elo · Xác thực kết quả 2 chiều (Mutual Consent)</span>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {/* If user is not yet in room and there's space */}
              {!isUserInRoom && !isRoomFull && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleJoinLobby}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords size={15} />
                  <span>VÀO PHÒNG ĐẤU NÀY</span>
                </button>
              )}

              {/* If Host & not completed */}
              {isHost && !isStarted && !isCompleted && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartMatch}
                  className="w-full sm:w-auto h-11 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap size={16} className="fill-white" />
                  <span>{busy ? 'ĐANG KHỞI TẠO…' : '⚡ BẮT ĐẦU TRẬN ĐẤU'}</span>
                </button>
              )}

              {/* If In-Progress or completed: Enter Score button */}
              {(isStarted || isHost) && !isCompleted && (
                <button
                  type="button"
                  onClick={handleOpenScoreModal}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trophy size={15} />
                  <span>GHI NHẬN TỈ SỐ SET ĐẤU</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* MATCH HISTORY & SCORECARD DECK                               */}
        {/* ============================================================ */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase text-app-muted tracking-wider flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500" />
              <span>BẢNG ĐIỂM & ĐỐI SOÁT TRẬN ĐẤU ({matches.length})</span>
            </h2>

            {matches.length > 0 && !isCompleted && (
              <button
                type="button"
                onClick={handleOpenScoreModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Ghi thêm ván đấu</span>
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <BentoCard>
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <Clock size={28} className="text-app-muted mb-1" />
                <span className="font-bold text-sm text-app-text">Chưa có ván đấu nào được ghi nhận</span>
                <p className="text-xs text-app-muted max-w-sm">
                  Sau khi hoàn thành set đấu thực tế trên sân, bấm nút &quot;Ghi nhận tỉ số&quot; để nhập điểm và
                  chốt biến động Rank Elo.
                </p>
              </div>
            </BentoCard>
          ) : (
            <div className="flex flex-col gap-3">
              {matches.map((m) => {
                const canConfirm = m.canConfirm;
                const isConfirmed = m.status === 'confirmed';
                const isDisputed = m.status === 'disputed';

                return (
                  <div
                    key={m.id}
                    className={`p-4 sm:p-5 rounded-bento border transition-all shadow-2xs ${
                      isConfirmed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : isDisputed
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : 'bg-white dark:bg-app-surface border-app-border'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-app-border/70 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isDisputed
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isConfirmed
                            ? '✓ ĐÃ ĐỒNG THUẬN (CHỐT ELO)'
                            : isDisputed
                            ? '⚠ ĐANG TRANH CHẤP'
                            : 'CHỜ XÁC NHẬN'}
                        </span>
                        <span className="text-xs font-medium text-app-muted">
                          {m.matchType === 'singles' ? 'Đơn 1v1' : 'Đôi 2v2'}
                        </span>
                      </div>

                      <span className="font-mono text-xs text-emerald-700 font-bold">
                        {isConfirmed && `±${m.eloDelta || 18} Elo`}
                      </span>
                    </div>

                    {/* Score display */}
                    <div className="py-4 flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center text-center">
                        <span
                          className={`text-sm font-bold truncate max-w-[120px] ${
                            m.winnerTeam === 'A' ? 'text-emerald-700 font-black' : 'text-app-text'
                          }`}
                        >
                          {(m.teamANames && m.teamANames[0]) || 'Bên A'}
                        </span>
                        {m.winnerTeam === 'A' && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">
                            THẮNG CUỘC
                          </span>
                        )}
                      </div>

                      <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-lg sm:text-xl font-black text-app-text tracking-wider">
                        {m.scores.map((s) => `${s.a}-${s.b}`).join('  ·  ')}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <span
                          className={`text-sm font-bold truncate max-w-[120px] ${
                            m.winnerTeam === 'B' ? 'text-amber-700 font-black' : 'text-app-text'
                          }`}
                        >
                          {(m.teamBNames && m.teamBNames[0]) || 'Bên B'}
                        </span>
                        {m.winnerTeam === 'B' && (
                          <span className="text-[10px] font-bold text-amber-600 uppercase">
                            THẮNG CUỘC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Opponent Confirmation Deck */}
                    {canConfirm && !isConfirmed && !isDisputed && (
                      <div className="mt-2 pt-3 border-t border-app-border/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <span className="text-xs text-amber-800 dark:text-amber-300 font-medium text-center sm:text-left">
                          Đối thủ đã nộp tỉ số. Bạn có đồng ý với kết quả này để hệ thống tính điểm Rank?
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleOpenDispute(m)}
                            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                          >
                            Báo sai
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleConfirmMatch(m)}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>ĐỒNG Ý (CHỐT KẾT QUẢ)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ============================================================== */}
      {/* 4. MODAL: NHẬP TỈ SỐ SET ĐẤU (SCORE ENTRY MODAL)               */}
      {/* ============================================================== */}
      <ModalSheet
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title="GHI NHẬN TỈ SỐ TRẬN ĐẤU"
      >
        <form onSubmit={handleSubmitScore} className="flex flex-col gap-4 py-2 text-app-text">
          <div className="flex items-center justify-between text-xs text-app-muted border-b border-app-border pb-2">
            <span>Đấu {numSets === 2 ? '2 Set' : '3 Set (BO3)'}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNumSets(2)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  numSets === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                2 Set
              </button>
              <button
                type="button"
                onClick={() => setNumSets(3)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  numSets === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                3 Set
              </button>
            </div>
          </div>

          {/* Set Scores List */}
          <div className="flex flex-col gap-3">
            {sets.slice(0, numSets).map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <span className="font-mono text-xs font-bold text-app-muted uppercase">Set {idx + 1}</span>
                <div className="flex items-center justify-between gap-3">
                  {/* Team A score control */}
                  <div className="flex-1 flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-xs font-bold text-emerald-700 truncate max-w-[70px]">Bên A</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScoreChange(idx, 'a', -1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-mono text-base font-black w-7 text-center">{s.a}</span>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(idx, 'a', 1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <span className="font-mono font-black text-slate-400">—</span>

                  {/* Team B score control */}
                  <div className="flex-1 flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <span className="text-xs font-bold text-amber-700 truncate max-w-[70px]">Bên B</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScoreChange(idx, 'b', -1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-mono text-base font-black w-7 text-center">{s.b}</span>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(idx, 'b', 1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Winner selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-app-muted">Đội chiến thắng chung cuộc:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWinnerTeam('A')}
                className={`p-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  winnerTeam === 'A'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                BÊN A THẮNG
              </button>
              <button
                type="button"
                onClick={() => setWinnerTeam('B')}
                className={`p-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  winnerTeam === 'B'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                }`}
              >
                BÊN B THẮNG
              </button>
            </div>
          </div>

          {/* Predicted Elo Delta */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-app-muted font-medium">Dự kiến biến động Elo:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {winnerTeam === 'A'
                ? `Bên A: +${eloPreview.eloDelta} Elo  |  Bên B: -${eloPreview.eloDelta} Elo`
                : `Bên B: +${eloPreview.eloDelta} Elo  |  Bên A: -${eloPreview.eloDelta} Elo`}
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {busy ? 'ĐANG LƯU KẾT QUẢ…' : 'LƯU KẾT QUẢ VÁN ĐẤU'}
          </button>
        </form>
      </ModalSheet>

      {/* ============================================================== */}
      {/* 5. MODAL: QR CODE CHO PHÒNG ĐẤU                               */}
      {/* ============================================================== */}
      <ModalSheet
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="MÃ QR VÀO PHÒNG ĐẤU"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2 text-app-text">
          <div className="flex flex-col">
            <span className="font-mono text-2xl font-black text-emerald-700 tracking-wider">
              {joinCode}
            </span>
            <span className="text-xs text-app-muted mt-0.5">
              Đưa điện thoại cho đối thủ quét mã này để vào sảnh thi đấu
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <QRCodeSVG value={roomShareUrl} size={200} />
          </div>

          <div className="w-full flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-app-text font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              {copiedCode ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              <span>{copiedCode ? 'Đã sao chép mã' : 'Sao chép mã PIN'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Share2 size={15} />
              <span>{copiedLink ? 'Đã sao chép link' : 'Sao chép link mời đối thủ'}</span>
            </button>
          </div>
        </div>
      </ModalSheet>

      {/* ============================================================== */}
      {/* 6. MODAL: TRANH CHẤP / BÁO SAI TỈ SỐ                          */}
      {/* ============================================================== */}
      <ModalSheet
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="BÁO SAI TỈ SỐ / TRANH CHẤP"
      >
        <div className="flex flex-col gap-3 py-2 text-app-text">
          <p className="text-xs text-app-muted">
            Nếu tỉ số bên đối thủ báo không đúng với diễn biến trên sân, hãy nêu rõ lý do để hệ thống tạm khóa
            biến động Elo ván này.
          </p>

          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Ví dụ: Tỉ số set 2 là 21-18 chứ không phải 21-15..."
            className="w-full h-24 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-rose-500"
          />

          <button
            type="button"
            disabled={busy}
            onClick={handleSubmitDispute}
            className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all mt-2 cursor-pointer shadow-xs"
          >
            {busy ? 'ĐANG GỬI…' : 'XÁC NHẬN BÁO SAI'}
          </button>
        </div>
      </ModalSheet>
    </div>
  );
};
