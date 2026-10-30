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

export const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sheets and dialogs
  const [showQrSheet, setShowQrSheet] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

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
    setError(null);
    try {
      const cmd = createRoomCommand(action, {
        roomId: room.id,
        payload,
      });
      await managedRoomRepository.execute(cmd);
      await load();
    } catch (err) {
      setError(roomFailure(err));
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
    alert(`Đã sao chép mã phòng ${room.roomCode}`);
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
      alert('Đã sao chép link tham gia phòng.');
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

  if (!room || error) {
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
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-app-primary text-app-on-primary text-xs font-bold shadow-xs active:scale-95"
        >
          QUAY LẠI TÌM KÈO
        </button>
      </div>
    );
  }

  const availableSlots = Math.max(0, room.capacity - room.reserved);
  const registeredMembers = room.members.filter(
    (m) => m.status === 'REGISTERED' || m.status === 'RECONFIRM'
  );
  const waitlistMembers = room.members.filter((m) => m.status === 'WAITLIST');

  const now = new Date();
  const isPastCancelBy = now > room.cancelBy;

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col select-none antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-app-surface/95 backdrop-blur-md border-b border-app-border">
        <div className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors"
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
        {error && (
          <div className="p-3.5 rounded-xl bg-app-loss/12 border border-app-loss/35 text-xs text-app-loss font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
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

        {/* 1. STATUS & TITLE CARD */}
        <BentoCard highlighted={room.status === 'IN_PROGRESS'}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-md bg-app-primary/12 text-app-primary text-xs font-extrabold tracking-wider border border-app-primary/30">
                {room.statusLabel.toUpperCase()}
              </span>

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
          </div>
        </BentoCard>

        {/* 2. SPECIFICATIONS GRID */}
        <BentoCard>
          <div className="grid grid-cols-2 gap-4">
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
                    {room.hostName}
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
              {registeredMembers.map((member, idx) => (
                <div
                  key={member.user_id || idx}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-app-background border border-app-border flex items-center justify-center font-bold text-app-text shrink-0">
                      {(member.display_name || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-app-text">
                        {member.display_name || 'Vận động viên'}
                      </span>
                      <span className="text-[11px] text-app-muted">
                        {member.elo_rating || 750} Elo · {member.tier_name || 'TB'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
              ))}
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
                {waitlistMembers.map((member, idx) => (
                  <div
                    key={member.user_id || idx}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-app-background border border-app-border flex items-center justify-center font-bold text-app-muted shrink-0">
                        {(member.display_name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-app-text">
                        {member.display_name || 'Vận động viên'}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-app-streak/15 text-app-streak text-[10px] font-bold">
                      Thứ {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        )}

        <div className="h-20" />
      </PageContent>

      {/* 6. BOTTOM STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-app-surface/95 backdrop-blur-md border-t border-app-border p-3 sm:px-6">
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
                className="flex-2 h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-xs hover:brightness-105 transition-all shadow-xs"
              >
                ĐỒNG Ý ĐIỀU KIỆN MỚI
              </button>
            </div>
          ) : /* Case 2: Session in progress or completed */
          ['IN_PROGRESS', 'COMPLETED'].includes(room.status) ? (
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/rooms/${room.id}/session`)}
                className="flex-1 h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-xs"
              >
                <Play size={16} fill="currentColor" />
                <span>TRẬN ĐẤU / ĐIỂM DANH</span>
              </button>

              {room.isHost && room.status === 'IN_PROGRESS' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => executeAction('finish')}
                  className="h-12 px-4 rounded-[14px] border border-app-border text-app-muted hover:text-app-text font-bold text-xs transition-all"
                >
                  KẾT THÚC
                </button>
              )}
            </div>
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
                className="flex-1 h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 transition-all shadow-xs"
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
                className="flex-2 h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 transition-all shadow-xs"
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
              className="w-full h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-xs tracking-wider uppercase hover:brightness-105 transition-all shadow-xs"
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
