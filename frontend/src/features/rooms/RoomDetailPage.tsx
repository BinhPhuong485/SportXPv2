import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Edit2,
  XCircle,
  Copy,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Award,
  AlertTriangle,
  Play,
  CheckCircle2,
  Shield,
  HelpCircle,
  LogOut,
  RotateCcw,
  MessageCircle,
  Trophy,
  Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ManagedRoomData,
  createRoomCommand,
} from './domain/managedRoom';
import {
  managedRoomRepository,
  roomFailure,
} from './data/managedRoomRepository';
import { RoomUiFormatters } from './presentation/widgets/roomUiFormatters';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { EventReminderToggle } from '../reminders/presentation/widgets/EventReminderToggle';
import { PrivateGameLobbyPage } from './presentation/pages/PrivateGameLobbyPage';

export const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sheets and dialogs
  const [showQrSheet, setShowQrSheet] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const load = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await managedRoomRepository.get(roomId);
      setRoom(data);
    } catch (err) {
      setError(roomFailure(err));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
  }, [load]);

  const executeAction = async (
    action: string,
    payload: Record<string, unknown> = {}
  ) => {
    if (busy || !room) return;
    setBusy(true);
    setActionError(null);
    try {
      const cmd = createRoomCommand(action, {
        roomId: room.id,
        payload,
      });
      await managedRoomRepository.execute(cmd);
      await load();
    } catch (err) {
      setActionError(roomFailure(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelRoom = async () => {
    if (!cancelReason.trim()) return;
    setShowCancelDialog(false);
    await executeAction('cancel', { reason: cancelReason.trim() });
    setCancelReason('');
  };

  const handleLeaveRoom = async () => {
    setShowLeaveDialog(false);
    await executeAction('leave');
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    showToast(`Đã sao chép mã phòng #${room.roomCode}`);
  };

  const roomLink = `${window.location.origin}/#/rooms/${roomId}`;

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: room?.title || 'Kèo đấu SportXP',
          text: `Tham gia kèo đấu "${room?.title}" tại ${room?.courtName} trên SportXP!`,
          url: roomLink,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      navigator.clipboard.writeText(roomLink);
      showToast('Đã sao chép link tham gia phòng.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-app-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-app-muted mt-3">
          Đang tải chi tiết kèo đấu…
        </span>
      </div>
    );
  }

  // Fatal 404: Only when room is truly null (not found / permission denied)
  if (!room) {
    return (
      <div className="min-h-screen w-full bg-app-background flex flex-col items-center justify-center p-4 text-center">
        <HelpCircle size={48} className="text-app-muted mb-3" />
        <h2 className="text-base font-bold text-app-text mb-1">
          {error || 'Không tìm thấy phòng chơi'}
        </h2>
        <p className="text-xs text-app-muted max-w-[280px] mb-5 leading-relaxed">
          Phòng có thể đã bị hủy hoặc bạn không có quyền truy cập vào phòng riêng tư này.
        </p>
        <button
          onClick={() => navigate('/rooms')}
          className="px-5 py-2.5 rounded-xl bg-app-primary text-app-on-primary text-xs font-bold shadow-xs active:scale-95"
        >
          QUAY LẠI TÌM KÈO
        </button>
      </div>
    );
  }

  // ==============================================================
  // FLOW B: DEDICATED PRIVATE RATED GAME LOBBY
  // If this is a private match or rated head-to-head game,
  // delegate to PrivateGameLobbyPage for visual court & instant match flow
  // ==============================================================
  if (room.roomType === 'PRIVATE_RATED' || room.visibility === 'PRIVATE') {
    return <PrivateGameLobbyPage room={room} onReload={load} />;
  }

  const availableSlots = Math.max(0, room.capacity - room.reserved);
  const registeredMembers = room.members.filter(
    (m) => m.status === 'REGISTERED' || m.status === 'RECONFIRM'
  );
  const waitlistMembers = room.members.filter((m) => m.status === 'WAITLIST');

  const now = new Date();
  const isPastCancelBy = now > room.cancelBy;

  const renderDesktopActionCard = () => {
    if (!room) return null;
    return (
      <BentoCard highlighted={room.status === 'OPEN' || room.myStatus === 'RECONFIRM'}>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-app-border/40 pb-2.5">
            <span className="text-[11px] font-black uppercase text-app-muted tracking-wider">
              Thao tác buổi chơi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide bg-app-primary/15 text-app-primary">
              {room.myStatus === 'REGISTERED'
                ? 'Đã tham gia'
                : room.myStatus === 'WAITLIST'
                ? 'Danh sách chờ'
                : room.myStatus === 'RECONFIRM'
                ? 'Cần xác nhận lại'
                : room.isHost
                ? 'Host'
                : 'Khách'}
            </span>
          </div>

          {room.myStatus === 'RECONFIRM' ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-app-loss font-semibold">
                Điều kiện buổi chơi đã thay đổi. Vui lòng xác nhận bạn vẫn tham gia.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowLeaveDialog(true)}
                  className="flex-1 h-11 rounded-[12px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all"
                >
                  TỪ CHỐI
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    executeAction('reconfirm', {
                      expected_revision: room.revision,
                    })
                  }
                  className="flex-1 h-11 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-xs hover:brightness-105 transition-all shadow-xs"
                >
                  ĐỒNG Ý
                </button>
              </div>
            </div>
          ) : ['IN_PROGRESS', 'COMPLETED'].includes(room.status) ? (
            room.isHost && room.status === 'IN_PROGRESS' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => executeAction('finish')}
                className="w-full h-11 rounded-[12px] border border-app-border text-app-muted hover:text-app-text font-bold text-xs transition-all"
              >
                KẾT THÚC BUỔI CHƠI
              </button>
            ) : (
              <p className="text-xs text-app-muted text-center py-1">
                {room.status === 'IN_PROGRESS' ? 'Buổi chơi đang diễn ra' : 'Buổi chơi đã kết thúc'}
              </p>
            )
          ) : room.isHost && room.status === 'DRAFT' ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCancelDialog(true)}
                className="h-11 px-4 rounded-[12px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => executeAction('publish')}
                className="flex-1 h-11 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                MỞ ĐĂNG KÝ
              </button>
            </div>
          ) : room.isHost && ['OPEN', 'FULL'].includes(room.status) ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => executeAction('start')}
                className="w-full h-11 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Play size={16} fill="currentColor" />
                <span>BẮT ĐẦU BUỔI CHƠI</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCancelDialog(true)}
                className="w-full h-10 rounded-[12px] border border-app-loss/60 text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all"
              >
                HỦY BUỔI CHƠI
              </button>
            </div>
          ) : room.myStatus === 'REGISTERED' || room.myStatus === 'WAITLIST' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col text-xs text-app-muted gap-0.5">
                <span>Hạn hủy miễn phạt:</span>
                <span className="font-bold text-app-text">{RoomUiFormatters.deadline(room.cancelBy)}</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowLeaveDialog(true)}
                className="w-full h-11 rounded-[12px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut size={15} />
                <span>HỦY ĐĂNG KÝ</span>
              </button>
            </div>
          ) : room.canRegister ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-app-muted font-medium">Chi phí:</span>
                <span className="text-base font-black text-app-primary tabular-nums">
                  {RoomUiFormatters.currency(room.fee)}
                </span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  executeAction(availableSlots > 0 ? 'join' : 'waitlist', {
                    expected_revision: room.revision,
                    ...(room.visibility === 'PRIVATE' ? { room_code: room.roomCode } : {}),
                  })
                }
                className={`w-full h-11 rounded-[12px] font-black text-xs tracking-wider uppercase transition-all shadow-xs active:scale-[0.99] ${
                  availableSlots > 0
                    ? 'bg-app-primary text-app-on-primary hover:brightness-105'
                    : 'bg-app-streak text-white hover:brightness-105'
                }`}
              >
                {busy ? (
                  <span>ĐANG XỬ LÝ…</span>
                ) : availableSlots > 0 ? (
                  'ĐĂNG KÝ THAM GIA'
                ) : (
                  'VÀO DANH SÁCH CHỜ'
                )}
              </button>
            </div>
          ) : (
            <div className="w-full text-center py-2 text-xs font-semibold text-app-muted">
              Buổi chơi đã đóng đăng ký.
            </div>
          )}
        </div>
      </BentoCard>
    );
  };

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col select-none antialiased relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900/95 text-white text-xs font-bold shadow-2xl backdrop-blur-md border border-white/10 animate-fade-in pointer-events-none">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-app-surface/95 backdrop-blur-md border-b border-app-border">
        <div className="w-full max-w-content md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/rooms')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-extrabold tracking-tight">Chi tiết buổi chơi</h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => load()}
              title="Tải lại"
              disabled={busy}
              className="p-2 text-app-muted hover:text-app-text rounded-full hover:bg-app-background transition-colors"
            >
              <RotateCcw size={18} className={busy ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setShowQrSheet(true)}
              title="Chia sẻ & Mã QR"
              className="p-2 text-app-muted hover:text-app-text rounded-full hover:bg-app-background transition-colors"
            >
              <Share2 size={18} />
            </button>

            {room.canEdit && (
              <button
                onClick={() => navigate(`/rooms/${room.id}/edit`)}
                title="Chỉnh sửa buổi chơi"
                className="p-2 text-app-muted hover:text-app-text rounded-full hover:bg-app-background transition-colors"
              >
                <Edit2 size={18} />
              </button>
            )}

            {room.isHost &&
              room.status !== 'CANCELLED' &&
              room.status !== 'COMPLETED' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  title="Hủy cả buổi chơi"
                  className="p-2 text-app-loss hover:text-app-loss/80 rounded-full hover:bg-app-loss/10 transition-colors"
                >
                  <XCircle size={18} />
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <PageContent>
        {/* Error Notification Banner */}
        {(error || actionError) && (
          <div className="p-3.5 rounded-xl bg-app-loss/12 border border-app-loss/35 text-xs text-app-loss font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{actionError || error}</span>
            </div>
            {actionError && (
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-app-loss hover:text-app-text font-bold text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* CANCELLATION BANNER */}
        {room.status === 'CANCELLED' && (
          <div className="p-4 rounded-bento bg-app-loss/12 border border-app-loss/40 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-app-loss font-extrabold text-xs uppercase tracking-wider">
              <XCircle size={16} />
              <span>BUỔI CHƠI NÀY ĐÃ BỊ HỦY BỞI HOST</span>
            </div>
            {room.cancellationReason && (
              <p className="text-xs text-app-text leading-relaxed">
                Lý do: <em>"{room.cancellationReason}"</em>
              </p>
            )}
          </div>
        )}

        {/* Main Content Layout (Responsive 2-column grid on desktop, single column on mobile) */}
        <div className="w-full flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
          {/* LEFT COLUMN: Main details, specifications, host */}
          <div className="flex flex-col gap-4 md:gap-5 lg:col-span-7 xl:col-span-8">
            {/* 1. STATUS & TITLE CARD WITH DOUBLE-BEZEL DEPTH */}
            <BentoCard highlighted={room.status === 'IN_PROGRESS'} doubleBezel courtPattern overflowVisible>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md bg-app-primary/12 text-app-primary text-xs font-extrabold tracking-wider border border-app-primary/30">
                      {room.statusLabel.toUpperCase()}
                    </span>
                    {room.isRated ? (
                      <span className="px-2 py-0.5 rounded-md bg-app-streak/15 text-app-streak border border-app-streak/40 text-[10px] font-extrabold flex items-center gap-1">
                        <Trophy size={11} />
                        <span>KÈO KÍN TÍNH ELO</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-app-primary/15 text-app-primary border border-app-primary/40 text-[10px] font-extrabold">
                        GIAO LƯU (UNRATED)
                      </span>
                    )}
                  </div>

                  {/* Room Code Badge */}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded-md bg-app-background border border-app-border text-xs font-mono font-bold text-app-text flex items-center gap-1.5 hover:border-app-primary transition-colors"
                    title="Sao chép mã phòng"
                  >
                    <span>{room.roomCode}</span>
                    <Copy size={13} className="text-app-muted" />
                  </button>
                </div>

                <h1 className="text-2xl font-extrabold text-app-text tracking-tight leading-snug">
                  {room.title}
                </h1>

                <div className="flex items-start gap-2 text-sm font-semibold text-app-text pt-1">
                  <Clock size={18} className="text-app-primary shrink-0 mt-0.5" />
                  <span className="tabular-nums">
                    {RoomUiFormatters.dateRange(room.startsAt, room.endsAt)}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs text-app-muted">
                  <MapPin size={18} className="text-app-muted shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-bold text-app-text">
                      {room.courtLabel
                        ? `${room.courtName} · ${room.courtLabel}`
                        : room.courtName}
                    </span>
                    {room.address && <span className="mt-0.5">{room.address}</span>}
                  </div>
                </div>

                {/* Link nhóm Zalo buổi chơi (Flow A - Mock cho prototype) */}
                {room.zaloGroupLink && (
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Tính năng kết nối nhóm Zalo đang được phát triển.');
                    }}
                    className="w-full mt-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>MỞ NHÓM ZALO BUỔI CHƠI</span>
                  </button>
                )}

                {/* Session Matches Entry Button */}
                {room.status !== 'CANCELLED' && room.status !== 'DRAFT' && (
                  (() => {
                    const isUserInRoom = Boolean(room.isHost || room.myStatus === 'REGISTERED');
                    const isStarted = room.status === 'IN_PROGRESS';
                    const isCompleted = room.status === 'COMPLETED';
                    const canEnter = isUserInRoom && (isStarted || isCompleted);

                    let helperMessage: string | null = null;
                    if (!isUserInRoom) {
                      helperMessage = 'Chỉ VĐV đã đăng ký tham gia phòng mới có thể vào buổi chơi & ghi nhận tỉ số.';
                    } else if (!isStarted && !isCompleted) {
                      helperMessage = room.isHost
                        ? 'Buổi chơi chưa bắt đầu. Vui lòng bấm "BẮT ĐẦU BUỔI CHƠI" ở bảng bên phải trước khi vào ghi nhận tỉ số.'
                        : 'Buổi chơi chưa bắt đầu. Vui lòng chờ Host bấm "Bắt đầu buổi chơi" khi đến giờ thi đấu.';
                    }

                    return (
                      <div className="w-full flex flex-col gap-1 mt-2">
                        <button
                          type="button"
                          disabled={!canEnter}
                          onClick={() => {
                            if (canEnter) {
                              navigate(`/rooms/${room.id}/session`);
                            }
                          }}
                          className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                            canEnter
                              ? isCompleted
                                ? 'bg-app-surface border border-slate-300 dark:border-slate-700 text-app-text hover:bg-slate-100 dark:hover:bg-slate-800 group cursor-pointer'
                                : 'bg-app-surface border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white group cursor-pointer'
                              : 'bg-slate-100 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700 text-app-muted cursor-not-allowed opacity-65'
                          }`}
                        >
                          {!canEnter ? (
                            <Lock size={15} className="text-app-muted shrink-0" />
                          ) : (
                            <Trophy size={16} className={isCompleted ? 'text-app-text' : 'text-emerald-600 group-hover:text-white'} />
                          )}
                          <span>
                            {isCompleted
                              ? 'VÀO XEM THÔNG TIN BUỔI GIAO LƯU'
                              : 'VÀO BUỔI CHƠI & ĐIỂM DANH CÓ MẶT'}
                          </span>
                        </button>
                        {helperMessage && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center font-medium">
                            {helperMessage}
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Per-event reminder toggle control */}
                {room.status !== 'CANCELLED' && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-app-border/40 mt-1">
                    <span className="text-xs text-app-muted font-medium">Nhắc nhở trước giờ chơi:</span>
                    <EventReminderToggle eventId={`room-${room.id}`} isCancelled={room.status === 'CANCELLED'} />
                  </div>
                )}
              </div>
            </BentoCard>

            {/* 2. SPECIFICATIONS GRID */}
            <BentoCard>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Phí tham gia */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={13} />
                    <span>MỨC PHÍ</span>
                  </span>
                  <span className="text-base font-extrabold text-app-primary tabular-nums">
                    {RoomUiFormatters.currency(room.fee)}
                    <span className="text-xs font-normal text-app-muted ml-1">/người</span>
                  </span>
                </div>

                {/* Chỗ trống */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                    <Users size={13} />
                    <span>SỐ CHỖ</span>
                  </span>
                  <span className="text-base font-extrabold text-app-text tabular-nums">
                    {room.reserved}/{room.capacity}
                    <span className="text-xs font-semibold text-app-primary ml-1.5">
                      ({availableSlots > 0 ? `Còn ${availableSlots}` : 'Đủ'})
                    </span>
                  </span>
                </div>

                {/* Trình độ Elo */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                    <Award size={13} />
                    <span>TRÌNH ĐỘ</span>
                  </span>
                  <span className="text-xs font-bold text-app-text">
                    {RoomUiFormatters.skillRange(room.minElo, room.maxElo)}
                  </span>
                </div>

                {/* Hạn hủy miễn phạt */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                    <Shield size={13} />
                    <span>HẠN HỦY</span>
                  </span>
                  <span className="text-xs font-semibold text-app-text">
                    {RoomUiFormatters.deadline(room.cancelBy)}
                  </span>
                </div>
              </div>

              {/* Ghi chú thêm nếu có */}
              {room.notes && (
                <div className="mt-4 pt-3 border-t border-app-border/40 text-xs text-app-muted leading-relaxed">
                  <strong className="text-app-text font-bold">Ghi chú:</strong> {room.notes}
                </div>
              )}
            </BentoCard>

            {/* 3. HOST CARD */}
            <BentoCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-app-mint text-app-primary flex items-center justify-center font-bold text-base shrink-0">
                    {room.hostName.charAt(0).toUpperCase() || 'H'}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-app-text">
                        {room.hostName === 'Vận động viên' || room.hostName === 'VĐV'
                          ? (registeredMembers.find(m => m.is_host)?.display_name || (room.isHost ? 'Bạn (Host)' : 'Host'))
                          : (room.hostName || (room.isHost ? 'Bạn (Host)' : 'Host'))}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-sm bg-app-primary text-app-on-primary text-[9px] font-extrabold uppercase">
                        HOST
                      </span>
                    </div>
                    <span className="text-xs text-app-muted mt-0.5">
                      Chủ trì buổi chơi này
                    </span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </div>

          {/* RIGHT COLUMN: Desktop action card, roster, waitlist */}
          <div className="flex flex-col gap-4 md:gap-5 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
            {/* Desktop Action Card (only visible on lg: and up) */}
            <div className="hidden lg:block">
              {renderDesktopActionCard()}
            </div>

            {/* 4. ROSTER (DANH SÁCH THÀNH VIÊN) */}
            <BentoCard>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-app-border/40 pb-2">
                  <h3 className="text-xs font-extrabold text-app-text tracking-wider uppercase flex items-center gap-1.5">
                    <Users size={14} className="text-app-primary" />
                    <span>DANH SÁCH THAM GIA ({registeredMembers.length}/{room.capacity})</span>
                  </h3>
                </div>

                <div className="flex flex-col divide-y divide-app-border/40">
                  {registeredMembers.map((member, idx) => {
                    let name = member.display_name || member.name;
                    if (!name || name === 'Vận động viên' || name === 'VĐV' || name === 'Người chơi') {
                      if (member.user_id === '9ded99f9-af7d-4297-829a-18e213294403' || String(member.id) === '9ded99f9-af7d-4297-829a-18e213294403') {
                        name = 'Square';
                      } else {
                        name = name || 'Người chơi';
                      }
                    }
                    const initial = name.charAt(0).toUpperCase() || 'P';
                    return (
                      <div
                        key={member.user_id || member.id || member.public_id || idx}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-full bg-app-background border border-app-border flex items-center justify-center font-bold text-app-text shrink-0 overflow-hidden">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-app-text truncate">
                              {name}
                            </span>
                            <span className="text-[11px] text-app-muted truncate">
                              {member.elo_rating != null ? `${member.elo_rating} Elo` : 'Chưa có Elo'}
                              {member.tier_name ? ` · ${member.tier_name}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {member.is_host ? (
                            <span className="px-2 py-0.5 rounded-full bg-app-primary/15 text-app-primary text-[10px] font-bold">
                              Host
                            </span>
                          ) : member.status === 'RECONFIRM' ? (
                            <span className="px-2 py-0.5 rounded-full bg-app-loss/15 text-app-loss text-[10px] font-bold">
                              Chờ xác nhận lại
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-app-mint text-app-primary text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Chính thức</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </BentoCard>

            {/* 5. WAITLIST (DANH SÁCH CHỜ) NẾU CÓ */}
            {waitlistMembers.length > 0 && (
              <BentoCard>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-app-border/40 pb-2">
                    <h3 className="text-xs font-extrabold text-app-streak tracking-wider uppercase flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>DANH SÁCH CHỜ ({waitlistMembers.length})</span>
                    </h3>
                  </div>

                  <div className="flex flex-col divide-y divide-app-border/40">
                    {waitlistMembers.map((member, idx) => {
                      let name = member.display_name || member.name;
                      if (!name || name === 'Vận động viên' || name === 'VĐV' || name === 'Người chơi') {
                        if (member.user_id === '9ded99f9-af7d-4297-829a-18e213294403' || String(member.id) === '9ded99f9-af7d-4297-829a-18e213294403') {
                          name = 'Square';
                        } else {
                          name = name || 'Người chơi';
                        }
                      }
                      const initial = name.charAt(0).toUpperCase() || 'P';
                      return (
                        <div
                          key={member.user_id || member.id || member.public_id || idx}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-full bg-app-background border border-app-border flex items-center justify-center font-bold text-app-muted shrink-0 overflow-hidden">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initial
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-app-text truncate">
                                {name}
                              </span>
                              <span className="text-[11px] text-app-muted truncate">
                                {member.elo_rating != null ? `${member.elo_rating} Elo` : 'Chưa có Elo'}
                                {member.tier_name ? ` · ${member.tier_name}` : ''}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-app-streak/15 text-app-streak text-[10px] font-bold shrink-0">
                            Thứ {idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </BentoCard>
            )}
          </div>
        </div>

        <div className="h-20 lg:hidden" />
      </PageContent>

      {/* 6. BOTTOM STICKY ACTION BAR (Visible on mobile/tablet, hidden on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-app-surface/95 backdrop-blur-md border-t border-app-border p-3 sm:px-6 lg:hidden">
        <div className="w-full max-w-content mx-auto flex items-center justify-between gap-3">
          {/* Case 1: Needs Reconfirm */}
          {room.myStatus === 'RECONFIRM' ? (
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowLeaveDialog(true)}
                className="flex-1 h-12 rounded-[14px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all"
              >
                TỪ CHỐI
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  executeAction('reconfirm', {
                    expected_revision: room.revision,
                  })
                }
                className="flex-2 h-12 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs"
              >
                ĐỒNG Ý ĐIỀU KIỆN MỚI
              </button>
            </div>
          ) : /* Case 2: Session in progress or completed */
          ['IN_PROGRESS', 'COMPLETED'].includes(room.status) ? (
            room.isHost && room.status === 'IN_PROGRESS' ? (
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => executeAction('finish')}
                  className="w-full h-12 rounded-[14px] border border-app-border text-app-muted hover:text-app-text font-bold text-xs transition-all"
                >
                  KẾT THÚC
                </button>
              </div>
            ) : null
          ) : /* Case 3: Host with draft room */
          room.isHost && room.status === 'DRAFT' ? (
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCancelDialog(true)}
                className="h-12 px-5 rounded-[14px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all"
              >
                HỦY BUỔI
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => executeAction('publish')}
                className="flex-1 h-12 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                MỞ ĐĂNG KÝ
              </button>
            </div>
          ) : /* Case 4: Host with open/full room -> Start match or Cancel */
          room.isHost && ['OPEN', 'FULL'].includes(room.status) ? (
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowCancelDialog(true)}
                className="flex-1 h-12 rounded-[14px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all"
              >
                HỦY BUỔI
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => executeAction('start')}
                className="flex-2 h-12 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Play size={16} fill="currentColor" />
                <span>BẮT ĐẦU BUỔI CHƠI</span>
              </button>
            </div>
          ) : /* Case 5: Registered player or waitlist member -> Can leave */
          room.myStatus === 'REGISTERED' || room.myStatus === 'WAITLIST' ? (
            <div className="w-full flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-app-primary uppercase">
                  {room.myStatus === 'WAITLIST' ? 'ĐANG CHỜ CHỖ' : 'ĐÃ THAM GIA'}
                </span>
                <span className="text-xs text-app-muted">
                  Hạn hủy: {RoomUiFormatters.deadline(room.cancelBy)}
                </span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowLeaveDialog(true)}
                className="h-11 px-5 rounded-[12px] border border-app-loss text-app-loss font-bold text-xs hover:bg-app-loss/10 transition-all flex items-center gap-1.5"
              >
                <LogOut size={15} />
                <span>HỦY ĐĂNG KÝ</span>
              </button>
            </div>
          ) : /* Case 5: Not joined -> Register or Waitlist */
          room.canRegister ? (
            <div className="w-full flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-app-primary tabular-nums">
                  {RoomUiFormatters.currency(room.fee)}
                </span>
                <span className="text-[11px] text-app-muted">
                  {availableSlots > 0 ? `Còn ${availableSlots} chỗ trống` : 'Đã đủ chỗ'}
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  executeAction(availableSlots > 0 ? 'join' : 'waitlist', {
                    expected_revision: room.revision,
                    ...(room.visibility === 'PRIVATE' ? { room_code: room.roomCode } : {}),
                  })
                }
                className={`h-12 px-6 rounded-[14px] font-bold text-xs tracking-wider uppercase transition-all shadow-xs active:scale-[0.99] ${
                  availableSlots > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                    : 'bg-app-streak text-white hover:brightness-105'
                }`}
              >
                {busy ? (
                  <span>ĐANG XỬ LÝ…</span>
                ) : availableSlots > 0 ? (
                  'ĐĂNG KÝ THAM GIA'
                ) : (
                  'VÀO DANH SÁCH CHỜ'
                )}
              </button>
            </div>
          ) : (
            <div className="w-full text-center py-2 text-xs font-semibold text-app-muted">
              Buổi chơi đã đóng đăng ký.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: SHARE & QR PASSPORT */}
      <ModalSheet
        isOpen={showQrSheet}
        onClose={() => setShowQrSheet(false)}
        title="CHIA SẺ KÈO ĐẤU"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <h3 className="text-lg font-extrabold text-app-text">{room.title}</h3>
          <p className="text-xs text-app-muted -mt-2">
            Mã phòng: <strong className="text-app-text font-mono">{room.roomCode}</strong>
          </p>

          <div className="p-4 bg-white rounded-2xl shadow-lg my-1">
            <QRCodeSVG value={roomLink} size={200} />
          </div>

          <p className="text-xs text-app-muted leading-relaxed">
            Quét mã để xem chi tiết buổi chơi và đăng ký tham gia.
          </p>

          <div className="w-full flex flex-col gap-2 pt-1">
            <button
              onClick={handleShareLink}
              className="w-full h-12 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-xs"
            >
              CHIA SẺ LINK PHÒNG
            </button>
            <button
              onClick={handleCopyCode}
              className="w-full h-11 rounded-[14px] border border-app-border text-app-text font-semibold text-xs hover:border-app-muted transition-all"
            >
              SAO CHÉP MÃ PHÒNG
            </button>
          </div>
        </div>
      </ModalSheet>

      {/* MODAL 2: CANCEL ENTIRE ROOM (HOST ONLY) */}
      <ModalSheet
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="HỦY CẢ BUỔI CHƠI"
      >
        <div className="flex flex-col gap-4 py-1">
          <p className="text-xs text-app-muted leading-relaxed">
            Hủy buổi chơi sẽ thông báo tới toàn bộ thành viên đã đăng ký và xóa buổi chơi khỏi danh sách. Vui lòng nêu rõ lý do.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-app-muted">Lý do hủy buổi</label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="VD: Sân bận bảo trì đột xuất, dời lịch sang tuần sau…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-app-background border border-app-border rounded-xl p-3 text-xs text-app-text outline-hidden"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              className="flex-1 h-12 rounded-xl border border-app-border text-app-muted text-xs font-bold hover:text-app-text"
            >
              QUAY LẠI
            </button>
            <button
              type="button"
              disabled={!cancelReason.trim() || busy}
              onClick={handleCancelRoom}
              className="flex-1 h-12 rounded-xl bg-app-loss text-white text-xs font-bold hover:brightness-105 disabled:opacity-50"
            >
              XÁC NHẬN HỦY
            </button>
          </div>
        </div>
      </ModalSheet>

      {/* MODAL 3: LEAVE / CANCEL REGISTRATION DIALOG */}
      <ModalSheet
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        title="HỦY ĐĂNG KÝ?"
      >
        <div className="flex flex-col gap-4 py-1">
          <p className="text-xs text-app-muted leading-relaxed">
            {room.myStatus === 'WAITLIST'
              ? 'Rời danh sách chờ không bị ghi là hủy muộn.'
              : room.myStatus === 'RECONFIRM'
              ? 'Bạn từ chối điều kiện mới, không ghi là hủy muộn.'
              : isPastCancelBy
              ? 'Đã qua hạn hủy. Sự kiện hủy muộn sẽ được lưu vào lịch sử đăng ký.'
              : 'Bạn được hủy trước hạn. Chỗ có thể chuyển cho người trong danh sách chờ.'}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLeaveDialog(false)}
              className="flex-1 h-12 rounded-xl border border-app-border text-app-muted text-xs font-bold hover:text-app-text"
            >
              QUAY LẠI
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleLeaveRoom}
              className="flex-1 h-12 rounded-xl bg-app-loss text-white text-xs font-bold hover:brightness-105"
            >
              HỦY ĐĂNG KÝ
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
};
