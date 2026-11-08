import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Globe,
  MapPin,
  Calendar,
  Users,
  Trophy,
  DollarSign,
  AlertCircle,
  KeyRound,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Link2,
  MessageCircle,
  Swords,
  Crown,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { managedRoomRepository, roomFailure } from './data/managedRoomRepository';
import { ManagedRoomData, Court, newRoomRequestId } from './domain/managedRoom';
import { RoomUiFormatters } from './presentation/widgets/roomUiFormatters';
import { MiniDatePicker } from './presentation/widgets/MiniDatePicker';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { Avatar } from '../../shared/components/Avatar';
import { useAuthStore } from '../../shared/hooks/useAuth';

function generateRandomJoinCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `XP-${rand}`;
}

export const RoomEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId?: string }>();
  const isEditing = Boolean(roomId);

  const { profile, user } = useAuthStore();
  const hostDisplayName = profile?.displayName || user?.email?.split('@')[0] || 'Bạn (Host)';
  const hostElo = profile?.eloRating ?? 1200;
  const hostTier = profile?.tierName || 'Hạng B';
  const hostAvatarUrl = profile?.avatarUrl;

  const [loading, setLoading] = useState(isEditing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Private Match specific states
  const [matchFormat, setMatchFormat] = useState<'1v1' | '2v2'>('1v1');
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copiedPassportCode, setCopiedPassportCode] = useState(false);
  const [copiedPassportLink, setCopiedPassportLink] = useState(false);

  // Form states - Default to PUBLIC_RECRUIT first
  const [title, setTitle] = useState('Kèo giao lưu');
  const [duration, setDuration] = useState('120');
  const [capacity, setCapacity] = useState('4');
  const [minElo, setMinElo] = useState('0');
  const [maxElo, setMaxElo] = useState('2000');
  const [fee, setFee] = useState('40000');
  const [cancelBeforeMinutes, setCancelBeforeMinutes] = useState('60');
  const [courtId, setCourtId] = useState<string>('');
  const [courtLabel, setCourtLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [joinCode, setJoinCode] = useState(() => generateRandomJoinCode());
  const [roomCode, setRoomCode] = useState(() => `#${joinCode}`);
  const [roomType, setRoomType] = useState<'PUBLIC_RECRUIT' | 'PRIVATE_RATED'>('PUBLIC_RECRUIT');
  const [zaloGroupLink, setZaloGroupLink] = useState('');
  const [hostPlays, setHostPlays] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [targetGender, setTargetGender] = useState<'all' | 'male' | 'female'>('all');

  // Start date/time state
  const [startsAt, setStartsAt] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Load courts and existing room (if editing)
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const courtList = await managedRoomRepository.courts();
        if (mounted) {
          setCourts(courtList);
          if (courtList.length > 0 && !courtId) {
            setCourtId(courtList[0].id);
          }
        }

        if (roomId) {
          const existing = await managedRoomRepository.get(roomId);
          if (mounted && existing) {
            setRoom(existing);
            setTitle(existing.title);
            setCourtId(existing.courtId || (courtList[0]?.id ?? ''));
            setCourtLabel(existing.courtLabel || '');
            setStartsAt(existing.startsAt);
            const durationMins = Math.round(
              (existing.endsAt.getTime() - existing.startsAt.getTime()) / 60000
            );
            setDuration(String(durationMins > 0 ? durationMins : 120));
            const cancelMins = Math.round(
              (existing.startsAt.getTime() - existing.cancelBy.getTime()) / 60000
            );
            setCancelBeforeMinutes(String(cancelMins > 0 ? cancelMins : 60));
            setCapacity(String(existing.capacity));
            setMinElo(String(existing.minElo));
            setMaxElo(String(existing.maxElo));
            setFee(String(existing.fee));
            if (existing.roomType) {
              setRoomType(existing.roomType);
              if (existing.roomType === 'PRIVATE_RATED') {
                setMatchFormat(existing.capacity <= 2 ? '1v1' : '2v2');
              }
            }
            if (existing.zaloGroupLink) setZaloGroupLink(existing.zaloGroupLink);
            if (existing.targetGender) setTargetGender(existing.targetGender);
            if (existing.joinCode) {
              setJoinCode(existing.joinCode);
              setRoomCode(`#${existing.joinCode}`);
            }
            setHostPlays(existing.hostPlays);
            setIsDraft(existing.status === 'DRAFT');
            setNotes(existing.notes || '');
            if (existing.roomCode) setRoomCode(existing.roomCode);
          }
        }
      } catch (e) {
        if (mounted) setError(roomFailure(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const regenerateJoinCode = () => {
    if (isEditing) return;
    const newCode = generateRandomJoinCode();
    setJoinCode(newCode);
    setRoomCode(`#${newCode}`);
  };

  const stepCapacity = (delta: number) => {
    const curr = parseInt(capacity, 10) || 4;
    const next = Math.min(100, Math.max(2, curr + delta));
    setCapacity(String(next));
  };

  const setEloRange = (minVal: number, maxVal: number) => {
    setMinElo(String(minVal));
    setMaxElo(String(maxVal));
  };

  const appendNote = (tag: string) => {
    const trimmed = notes.trim();
    if (trimmed.includes(tag)) return;
    setNotes(trimmed.length === 0 ? tag : `${trimmed}, ${tag}`);
  };

  const formatDisplayStart = (d: Date) => {
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate();

    const datePrefix = isToday
      ? 'Hôm nay'
      : isTomorrow
      ? 'Ngày mai'
      : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${datePrefix}, ${hours}:${minutes}`;
  };

  const formatDateLabel = (d: Date) => {
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate();

    const prefix = isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : weekdays[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${prefix}, ${dd}/${mm}/${yyyy}`;
  };

  const handleSelectDate = (date: Date) => {
    const updated = new Date(startsAt);
    updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setStartsAt(updated);
    setIsDatePickerOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [hhStr, mmStr] = val.split(':');
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    if (!isNaN(hh) && !isNaN(mm)) {
      const updated = new Date(startsAt);
      updated.setHours(hh, mm, 0, 0);
      setStartsAt(updated);
    }
  };

  const handleQuickTime = (hh: number, mm: number) => {
    const updated = new Date(startsAt);
    updated.setHours(hh, mm, 0, 0);
    setStartsAt(updated);
  };

  const timeString = `${String(startsAt.getHours()).padStart(2, '0')}:${String(
    startsAt.getMinutes()
  ).padStart(2, '0')}`;

  const validate = (): string | null => {
    if (!courtId) return 'Vui lòng chọn sân thi đấu.';
    if (courtLabel.length > 100) return 'Sân con tối đa 100 ký tự.';

    if (roomType === 'PUBLIC_RECRUIT') {
      const t = title.trim();
      if (!t || t.length > 100) return 'Tên buổi chơi từ 1 đến 100 ký tự.';
      if (notes.length > 2000) return 'Ghi chú tối đa 2000 ký tự.';

      const capNum = parseInt(capacity, 10);
      if (isNaN(capNum) || capNum < 2 || capNum > 100) return 'Số chỗ chơi từ 2 đến 100 chỗ.';

      const durNum = parseInt(duration, 10);
      if (isNaN(durNum) || durNum < 1) return 'Thời lượng phải lớn hơn 0.';

      if (startsAt.getTime() <= Date.now()) return 'Giờ bắt đầu phải trong tương lai.';

      const minE = parseInt(minElo, 10);
      const maxE = parseInt(maxElo, 10);
      if (isNaN(minE) || minE < 0 || isNaN(maxE) || maxE < 0) {
        return 'Elo phải là số nguyên không âm.';
      }
      if (maxE < minE) return 'Elo tối đa phải lớn hơn hoặc bằng Elo tối thiểu.';

      const feeNum = parseInt(fee, 10);
      if (isNaN(feeNum) || feeNum < 0) return 'Phí dự kiến phải là số không âm.';
    }

    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const isPrivateRated = roomType === 'PRIVATE_RATED';
    const finalCapacity = isPrivateRated
      ? matchFormat === '1v1'
        ? 2
        : 4
      : parseInt(capacity, 10) || 4;

    const selectedCourt = courts.find((c) => c.id === courtId);
    const courtName = selectedCourt ? selectedCourt.name : '';

    const autoTitle = isPrivateRated
      ? `Trận ${matchFormat === '1v1' ? 'Đơn 1vs1' : 'Đôi 2vs2'} Tính Elo${courtName ? ` - ${courtName}` : ''}`
      : title.trim();

    const finalTitle = isPrivateRated
      ? title.trim() && title !== 'Kèo giao lưu'
        ? title.trim()
        : autoTitle
      : title.trim();

    const nowTime = Date.now();
    // For instant private rated match: start immediately (60s in future to satisfy future check)
    const effectiveStartsAt = isPrivateRated ? new Date(nowTime + 60 * 1000) : startsAt;
    const durMinutes = isPrivateRated ? 120 : parseInt(duration, 10) || 120;
    const cancelMinutes = isPrivateRated ? 0 : parseInt(cancelBeforeMinutes, 10) || 60;
    const effectiveEndsAt = isPrivateRated
      ? new Date(nowTime + 2 * 3600 * 1000)
      : new Date(startsAt.getTime() + durMinutes * 60000);
    const effectiveCancelBy = isPrivateRated
      ? effectiveStartsAt
      : new Date(startsAt.getTime() - cancelMinutes * 60000);

    const effectiveJoinCode = isPrivateRated
      ? joinCode.trim().toUpperCase() || roomCode.replace(/^#/, '')
      : null;

    const payload: Record<string, unknown> = {
      court_id: courtId,
      title: finalTitle,
      starts_at: effectiveStartsAt.toISOString(),
      ends_at: effectiveEndsAt.toISOString(),
      cancel_by: effectiveCancelBy.toISOString(),
      capacity: finalCapacity,
      min_elo: isPrivateRated ? 0 : parseInt(minElo, 10),
      max_elo: isPrivateRated ? 3000 : parseInt(maxElo, 10),
      fee: isPrivateRated ? 0 : parseInt(fee, 10),
      visibility: isPrivateRated ? 'PRIVATE' : 'PUBLIC',
      room_type: roomType,
      is_rated: isPrivateRated,
      join_code: effectiveJoinCode,
      zalo_group_link:
        roomType === 'PUBLIC_RECRUIT' && zaloGroupLink.trim() ? zaloGroupLink.trim() : null,
      host_plays: true, // auto host inside room
      notes: isPrivateRated
        ? `Trận ${matchFormat.toUpperCase()} Tính Điểm Elo [CODE:${effectiveJoinCode}]`
        : notes,
      court_label: courtLabel.trim(),
      target_gender: targetGender,
      draft: isPrivateRated ? false : isDraft, // NEVER draft for private match
      room_code: roomCode,
      ...(room ? { expected_revision: room.revision } : {}),
    };

    setBusy(true);
    setError(null);

    try {
      const createdId = await managedRoomRepository.execute({
        requestId: newRoomRequestId(),
        action: isEditing ? 'edit' : 'create',
        roomId: room?.id,
        payload,
      });

      if (!isEditing && isPrivateRated) {
        setCreatedRoomId(createdId || room?.id || '');
        setShowPassportModal(true);
      } else {
        navigate(-1);
      }
    } catch (saveError) {
      setError(roomFailure(saveError));
    } finally {
      setBusy(false);
    }
  };

  const handleCopyPassportCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedPassportCode(true);
    setTimeout(() => setCopiedPassportCode(false), 2000);
  };

  const handleCopyPassportLink = () => {
    if (!createdRoomId) return;
    const url = `${window.location.origin}/#/rooms/${createdRoomId}`;
    navigator.clipboard.writeText(url);
    setCopiedPassportLink(true);
    setTimeout(() => setCopiedPassportLink(false), 2000);
  };

  const selectedCourt = courts.find((c) => c.id === courtId);
  const selectedCourtName = selectedCourt ? selectedCourt.name : 'Sân thi đấu';
  const minEloVal = parseInt(minElo, 10) || 0;
  const maxEloVal = parseInt(maxElo, 10) || 2000;
  const currentFee = parseInt(fee, 10) || 0;
  const currentDuration = parseInt(duration, 10) || 120;
  const capCount = parseInt(capacity, 10) || 4;

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased text-app-text">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 w-full bg-app-surface/90 backdrop-blur-md border-b border-app-border">
        <div className="w-full max-w-content md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              disabled={busy}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-extrabold tracking-tight">
              {isEditing
                ? 'Sửa điều kiện buổi chơi'
                : roomType === 'PRIVATE_RATED'
                ? 'Tạo phòng thi đấu riêng'
                : 'Tạo kèo tuyển quân'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-content md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-4">
        {/* Revision conflict warning when editing */}
        {isEditing && (
          <div className="p-3 rounded-xl bg-app-streak/10 border border-app-streak/40 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-app-streak shrink-0 mt-0.5" />
            <p className="text-xs text-app-text leading-relaxed">
              Lưu thay đổi sẽ yêu cầu người đã đăng ký xác nhận lại; danh sách chờ được hủy để đăng ký theo điều kiện mới.
            </p>
          </div>
        )}

        {/* TOP TAB SWITCHER: PUBLIC RECRUIT (FIRST) vs PRIVATE RATED */}
        {!isEditing && (
          <div className="grid grid-cols-2 p-1 bg-app-surface rounded-2xl border border-app-border shadow-xs">
            <button
              type="button"
              onClick={() => {
                setRoomType('PUBLIC_RECRUIT');
                setCapacity('4');
              }}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roomType === 'PUBLIC_RECRUIT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-app-muted hover:text-app-text hover:bg-app-background'
              }`}
            >
              <Globe size={16} />
              <span>PHÒNG CÔNG KHAI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoomType('PRIVATE_RATED');
                setCapacity(matchFormat === '1v1' ? '2' : '4');
              }}
              className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roomType === 'PRIVATE_RATED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-app-muted hover:text-app-text hover:bg-app-background'
              }`}
            >
              <Swords size={16} />
              <span>PHÒNG ĐẤU RIÊNG</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* ============================================================== */}
          {/* MODE 1: PRIVATE RATED CUSTOM MATCH LOBBY (1v1 / 2v2 TÍNH ELO)  */}
          {/* ============================================================== */}
          {roomType === 'PRIVATE_RATED' ? (
            <div className="flex flex-col gap-4">
              {/* 1. MÃ PHÒNG (JOIN CODE) - ĐƯỢC ĐẶT LÊN ĐẦU TIÊN */}
              <div className="p-4 bg-app-surface rounded-2xl border border-emerald-500/40 relative overflow-hidden shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500 uppercase tracking-wider">
                      <KeyRound size={14} />
                      <span>MÃ PHÒNG RIÊNG (JOIN CODE)</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black font-mono tracking-widest text-emerald-500">
                        {joinCode}
                      </span>
                      <span className="text-[10px] text-emerald-500/90 font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 uppercase">
                        PIN Cáp Kèo
                      </span>
                    </div>
                    <span className="text-[11px] text-app-muted mt-1 leading-snug">
                      Chia sẻ mã này cho đối thủ hoặc quét QR sau khi tạo để vào phòng thi đấu.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={copyRoomCode}
                      className="h-10 px-3.5 rounded-xl bg-app-background border border-app-border hover:border-emerald-500 text-app-text text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                      title="Sao chép mã phòng"
                    >
                      {copiedCode ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      <span>{copiedCode ? 'ĐÃ CHÉP' : 'CHÉP MÃ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={regenerateJoinCode}
                      className="h-10 w-10 rounded-xl bg-app-background border border-app-border hover:border-emerald-500 text-app-muted hover:text-emerald-500 text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
                      title="Đổi mã ngẫu nhiên"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. CHUNG 1 CARD DUY NHẤT: THỂ THỨC THI ĐẤU (FIX UX TRÀN TITLE) */}
              <div className="p-4 bg-app-surface rounded-2xl border border-app-border flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Swords size={14} className="text-emerald-500" />
                    <span>THỂ THỨC THI ĐẤU (TÍNH ELO)</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {matchFormat === '1v1' ? '2 người • Solo' : '4 người • Đôi'}
                  </span>
                </div>

                {/* Segmented Control 1v1 vs 2v2 */}
                <div className="grid grid-cols-2 p-1 bg-app-background rounded-xl border border-app-border gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMatchFormat('1v1');
                      setCapacity('2');
                    }}
                    className={`py-3 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      matchFormat === '1v1'
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                        : 'text-app-muted hover:text-app-text hover:bg-app-surface'
                    }`}
                  >
                    <span className="text-base">⚔️</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span>ĐƠN 1 VS 1</span>
                      <span className={`text-[10px] font-medium ${matchFormat === '1v1' ? 'text-emerald-100' : 'text-app-muted'}`}>
                        2 người chơi
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMatchFormat('2v2');
                      setCapacity('4');
                    }}
                    className={`py-3 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      matchFormat === '2v2'
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                        : 'text-app-muted hover:text-app-text hover:bg-app-surface'
                    }`}
                  >
                    <span className="text-base">🛡️</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span>ĐÔI 2 VS 2</span>
                      <span className={`text-[10px] font-medium ${matchFormat === '2v2' ? 'text-emerald-100' : 'text-app-muted'}`}>
                        4 người chơi
                      </span>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-app-muted px-0.5">
                  {matchFormat === '1v1'
                    ? '⚡ Đấu đơn: Solo 1 đối thủ trực tiếp. Kết quả cập nhật bảng xếp hạng cá nhân ngay sau trận.'
                    : '⚡ Đấu đôi: Host cùng 1 đồng đội đối đầu 2 đối thủ. Tính điểm Elo theo cặp thi đấu.'}
                </p>
              </div>

              {/* 3. ĐỊA ĐIỂM SÂN ĐẤU */}
              <div className="flex flex-col gap-3 p-4 bg-app-surface rounded-2xl border border-app-border shadow-xs">
                <label className="text-xs font-extrabold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-500" />
                  <span>ĐỊA ĐIỂM SÂN ĐẤU</span>
                </label>

                {/* Dropdown cụm sân */}
                <div className="relative">
                  <select
                    value={courtId}
                    onChange={(e) => setCourtId(e.target.value)}
                    disabled={busy}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm font-bold text-app-text appearance-none outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-emerald-500 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* 4. SƠ ĐỒ ĐỘI HÌNH TRỰC QUAN (LOBBY ROSTER - GAMING STYLE) */}
              <div className="p-4 bg-app-surface rounded-2xl border border-app-border flex flex-col gap-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-500" />
                    <span>SƠ ĐỒ PHÒNG CHỜ (LOBBY ROSTER)</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Host tự động vào phòng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch relative">
                  {/* TEAM A */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-500 tracking-wider uppercase">
                        ĐỘI A (ĐỘI NHÀ)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                        Sẵn sàng
                      </span>
                    </div>

                    {/* Slot 1: Host */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-app-surface border border-emerald-500/40">
                      <Avatar src={hostAvatarUrl} alt={hostDisplayName} size="sm" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Crown size={12} className="text-amber-400 shrink-0" />
                          <span className="text-xs font-black text-app-text truncate">
                            {hostDisplayName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-500 text-[9px] font-black">
                            HOST
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold">
                          {hostElo} Elo • {hostTier}
                        </span>
                      </div>
                    </div>

                    {/* Slot 2 (if 2v2): Teammate */}
                    {matchFormat === '2v2' && (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-400/80">
                        <div className="w-8 h-8 rounded-full border border-dashed border-emerald-500/50 flex items-center justify-center text-xs font-bold">
                          +
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-app-text">Đồng đội Đội A</span>
                          <span className="text-[10px] text-app-muted">
                            Đang chờ quét QR / nhập mã...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TEAM B */}
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-500 tracking-wider uppercase">
                        ĐỘI B (ĐỐI THỦ)
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase">
                        Đang chờ
                      </span>
                    </div>

                    {/* Slot 1: Opponent 1 */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 text-rose-400/80">
                      <div className="w-8 h-8 rounded-full border border-dashed border-rose-500/50 flex items-center justify-center text-xs font-bold">
                        +
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-app-text">Đối thủ 1</span>
                        <span className="text-[10px] text-app-muted">
                          Đang chờ quét QR / nhập mã...
                        </span>
                      </div>
                    </div>

                    {/* Slot 2 (if 2v2): Opponent 2 */}
                    {matchFormat === '2v2' && (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 text-rose-400/80">
                        <div className="w-8 h-8 rounded-full border border-dashed border-rose-500/50 flex items-center justify-center text-xs font-bold">
                          +
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-app-text">Đối thủ 2</span>
                          <span className="text-[10px] text-app-muted">
                            Đang chờ quét QR / nhập mã...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. YÊU CẦU GIỚI TÍNH ĐỐI THỦ */}
              <div className="p-4 bg-app-surface rounded-2xl border border-app-border flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-500" />
                    <span>GIỚI TÍNH YÊU CẦU</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-500">
                    {targetGender === 'female' ? 'Chỉ Nữ (♀)' : targetGender === 'male' ? 'Chỉ Nam (♂)' : 'Nam & Nữ (⚥)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'Nam & Nữ', icon: '⚥' },
                    { id: 'male', label: 'Chỉ Nam', icon: '♂' },
                    { id: 'female', label: 'Chỉ Nữ', icon: '♀' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTargetGender(g.id as 'all' | 'male' | 'female')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        targetGender === g.id
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                          : 'bg-app-background border-app-border text-app-muted hover:text-app-text hover:border-app-border/80'
                      }`}
                    >
                      <span className="text-sm">{g.icon}</span>
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-xl bg-app-loss/10 border border-app-loss/40 flex items-start gap-2.5 text-app-loss text-xs font-semibold">
                  <AlertCircle size={17} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-black text-base tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer mt-2"
              >
                {busy ? (
                  <>
                    <RefreshCw size={19} className="animate-spin" />
                    <span>ĐANG TẠO PHÒNG ĐẤU…</span>
                  </>
                ) : (
                  <>
                    <Swords size={20} />
                    <span>TẠO PHÒNG & LẤY MÃ QR ({matchFormat.toUpperCase()})</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ============================================================== */
            /* MODE 2: PUBLIC RECRUITMENT FLOW (TUYỂN QUÂN CÔNG KHAI)          */
            /* ============================================================== */
            <div className="w-full flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
              {/* LEFT COLUMN: Arena & Time */}
              <div className="flex flex-col gap-4">
                {/* Zalo Group Link */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-app-background border border-app-border">
                  <label className="text-xs font-bold text-app-text flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-app-primary" />
                    <span>Link nhóm Zalo buổi chơi (Host đính kèm)</span>
                  </label>
                  <div className="relative flex items-center">
                    <Link2 size={14} className="absolute left-3 text-app-muted" />
                    <input
                      type="url"
                      value={zaloGroupLink}
                      onChange={(e) => setZaloGroupLink(e.target.value)}
                      placeholder="https://zalo.me/g/..."
                      className="w-full h-10 pl-8 pr-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text focus:border-app-primary focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-app-muted">
                    Thành viên vãng lai bấm nút trên trang phòng để mở ngay nhóm Zalo trao đổi cách vào sân.
                  </span>
                </div>

                {/* Sân đấu & Lịch trình */}
                <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
                    <MapPin size={15} className="text-app-primary" />
                    <span>SÂN ĐẤU & THỜI GIAN</span>
                  </div>

                  {/* Sân thi đấu */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-app-muted">Sân thi đấu</label>
                    <div className="relative">
                      <select
                        value={courtId}
                        onChange={(e) => setCourtId(e.target.value)}
                        disabled={busy}
                        className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm font-semibold text-app-text appearance-none outline-none focus:border-app-primary transition-colors cursor-pointer"
                      >
                        {courts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-app-primary text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Sân con / số sân */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-app-muted">Sân con / số sân</label>
                    <input
                      type="text"
                      value={courtLabel}
                      onChange={(e) => setCourtLabel(e.target.value)}
                      placeholder="Ví dụ: Sân 3, Thảm số 1"
                      disabled={busy}
                      className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm text-app-text outline-none focus:border-app-primary transition-colors"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                      {['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Thảm VIP'].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setCourtLabel(label)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            courtLabel === label
                              ? 'bg-app-primary text-app-on-primary'
                              : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start date & time */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-app-muted flex items-center justify-between">
                      <span>Thời gian thi đấu</span>
                      <span className="text-[11px] text-app-primary font-bold">
                        {formatDisplayStart(startsAt)}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                        className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          isDatePickerOpen
                            ? 'bg-app-primary/10 border-app-primary text-app-primary shadow-xs'
                            : 'bg-app-background border-app-border hover:border-app-primary/40 text-app-text'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-app-primary/15 text-app-primary flex items-center justify-center shrink-0">
                            <Calendar size={17} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                              Ngày thi đấu
                            </span>
                            <span className="text-xs font-black truncate">
                              {formatDateLabel(startsAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-app-muted shrink-0 ml-1">
                          {isDatePickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-app-primary/15 text-app-primary flex items-center justify-center shrink-0">
                            <Clock size={17} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                              Giờ bắt đầu
                            </span>
                            <span className="text-xs font-black text-app-text">{timeString}</span>
                          </div>
                        </div>
                        <input
                          type="time"
                          value={timeString}
                          onChange={handleTimeChange}
                          disabled={busy}
                          className="bg-app-surface border border-app-border rounded-lg px-2.5 py-1 text-xs font-black text-app-primary cursor-pointer hover:border-app-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {isDatePickerOpen && (
                      <div className="mt-1">
                        <MiniDatePicker
                          selectedDate={startsAt}
                          onSelectDate={handleSelectDate}
                          onClose={() => setIsDatePickerOpen(false)}
                          minDate={new Date()}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                      <span className="text-[10px] font-bold text-app-muted shrink-0 mr-1">
                        Giờ nhanh:
                      </span>
                      {[
                        { label: '17:00', h: 17, m: 0 },
                        { label: '18:00', h: 18, m: 0 },
                        { label: '19:00', h: 19, m: 0 },
                        { label: '19:30', h: 19, m: 30 },
                        { label: '20:00', h: 20, m: 0 },
                      ].map((item) => {
                        const isCurrentTime =
                          startsAt.getHours() === item.h && startsAt.getMinutes() === item.m;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleQuickTime(item.h, item.m)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              isCurrentTime
                                ? 'bg-app-primary text-app-on-primary'
                                : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Thời lượng */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-app-muted">
                      Thời lượng trận đấu (phút)
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {[60, 90, 120, 180].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDuration(String(mins))}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            currentDuration === mins
                              ? 'bg-app-primary text-app-on-primary'
                              : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                          }`}
                        >
                          {mins >= 120 ? `${Math.floor(mins / 60)}h (${mins}p)` : `${mins}p`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      disabled={busy}
                      className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-none focus:border-app-primary transition-colors mt-1"
                    />
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Slots, Matchmaking, Fee, Notes, Submit */}
              <div className="flex flex-col gap-4">
                {/* SLOTS THI ĐẤU */}
                <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
                    <Users size={15} className="text-app-primary" />
                    <span>SLOTS THI ĐẤU & VAI TRÒ HOST</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-app-background border border-app-border flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-app-muted font-medium">Số chỗ thi đấu</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-app-primary tabular-nums">
                          {capCount}
                        </span>
                        <span className="text-xs text-app-muted font-semibold">
                          {capCount === 2
                            ? 'người (1 sân đơn)'
                            : capCount === 4
                            ? 'người (1 sân đôi)'
                            : `${capCount} người`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stepCapacity(-1)}
                        disabled={busy || capCount <= 2}
                        className="w-9 h-9 rounded-xl bg-app-surface border border-app-border text-app-text font-bold text-lg flex items-center justify-center hover:bg-app-border/40 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => stepCapacity(1)}
                        disabled={busy || capCount >= 100}
                        className="w-9 h-9 rounded-xl bg-app-surface border border-app-border text-app-text font-bold text-lg flex items-center justify-center hover:bg-app-border/40 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[2, 4, 6, 8, 12].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setCapacity(String(cap))}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          capCount === cap
                            ? 'bg-app-primary text-app-on-primary'
                            : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                        }`}
                      >
                        {cap === 2 ? '2 chỗ (Đơn)' : cap === 4 ? '4 chỗ (Đôi)' : `${cap} chỗ`}
                      </button>
                    ))}
                  </div>

                  <label className="p-3.5 rounded-xl bg-app-background border border-app-border flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-app-text">Host cũng chơi</span>
                      <span className="text-[11px] text-app-muted">
                        Tắt nếu chỉ tổ chức; không chiếm chỗ chơi.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hostPlays}
                      onChange={(e) => setHostPlays(e.target.checked)}
                      disabled={busy}
                      className="w-5 h-5 accent-app-primary rounded cursor-pointer"
                    />
                  </label>
                </section>

                {/* GIỚI HẠN RANK ELO */}
                <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
                    <Trophy size={15} className="text-app-primary" />
                    <span>GIỚI HẠN RANK ELO (MATCHMAKING)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-app-primary/12 text-app-primary flex items-center justify-center shrink-0">
                      <Trophy size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-app-muted uppercase font-bold tracking-wider">
                        Khoảng trình độ cho phép
                      </span>
                      <span className="text-xs font-extrabold text-app-text">
                        {RoomUiFormatters.skillRange(minEloVal, maxEloVal)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { label: 'Mọi trình', min: 0, max: 2000 },
                      { label: 'Yếu - TB', min: 400, max: 800 },
                      { label: 'TB - TBK', min: 700, max: 1000 },
                      { label: 'TBK - Khá', min: 900, max: 1400 },
                      { label: 'Khá+', min: 1100, max: 2000 },
                    ].map((p) => {
                      const isSelected = minEloVal === p.min && maxEloVal === p.max;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setEloRange(p.min, p.max)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-app-primary text-app-on-primary'
                              : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-app-muted">Elo tối thiểu</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={minElo}
                          onChange={(e) => setMinElo(e.target.value)}
                          disabled={busy}
                          className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-none focus:border-app-primary transition-colors"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-app-muted font-bold pointer-events-none">
                          Elo
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-app-muted">Elo tối đa</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={maxElo}
                          onChange={(e) => setMaxElo(e.target.value)}
                          disabled={busy}
                          className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-none focus:border-app-primary transition-colors"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-app-muted font-bold pointer-events-none">
                          Elo
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* YÊU CẦU GIỚI TÍNH */}
                <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
                      <Users size={15} className="text-app-primary" />
                      <span>YÊU CẦU GIỚI TÍNH</span>
                    </div>
                    <span className="text-[11px] font-bold text-app-primary">
                      {targetGender === 'female' ? 'Chỉ Nữ (♀)' : targetGender === 'male' ? 'Chỉ Nam (♂)' : 'Nam & Nữ (⚥)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'Nam & Nữ', icon: '⚥' },
                      { id: 'male', label: 'Chỉ Nam', icon: '♂' },
                      { id: 'female', label: 'Chỉ Nữ', icon: '♀' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setTargetGender(g.id as 'all' | 'male' | 'female')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          targetGender === g.id
                            ? 'bg-app-primary/15 border-app-primary text-app-primary font-black shadow-xs'
                            : 'bg-app-background border-app-border text-app-muted hover:text-app-text hover:border-app-border/80'
                        }`}
                      >
                        <span className="text-sm">{g.icon}</span>
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* CHI PHÍ & THÔNG TIN PHÒNG */}
                <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
                    <DollarSign size={15} className="text-app-primary" />
                    <span>CHI PHÍ & THÔNG TIN PHÒNG</span>
                  </div>

                  {/* Tên buổi chơi */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-app-muted">Tên buổi chơi</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Kèo giao lưu tối thứ 6, Cọ xát leo rank"
                      disabled={busy}
                      className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm text-app-text outline-none focus:border-app-primary transition-colors"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                      {['Kèo giao lưu', 'Cọ xát leo rank', 'Kèo đôi nam nữ', 'Tập luyện kỹ thuật'].map(
                        (item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setTitle(item)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                              title === item
                                ? 'bg-app-primary text-app-on-primary'
                                : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Phí dự kiến / người */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-app-muted">
                      Phí dự kiến / người
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {[0, 30000, 40000, 50000, 70000].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFee(String(f))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                            currentFee === f
                              ? 'bg-app-primary text-app-on-primary'
                              : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                          }`}
                        >
                          {f === 0 ? 'Miễn phí' : RoomUiFormatters.currency(f)}
                        </button>
                      ))}
                    </div>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={fee}
                        onChange={(e) => setFee(e.target.value)}
                        disabled={busy}
                        className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-none focus:border-app-primary transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-app-muted font-bold pointer-events-none">
                        VND
                      </span>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-app-muted">
                      Ghi chú / dịch vụ đã gồm
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ví dụ: Đã gồm tiền sân + 2 ống cầu, nước tự túc."
                      rows={2}
                      disabled={busy}
                      className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-none focus:border-app-primary transition-colors resize-none"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                      {[
                        '+ Tiền cầu',
                        '+ Nước uống',
                        '+ Nhặt cầu',
                        '+ Trọng tài',
                        '+ Chia đều tiền sân',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => appendNote(tag)}
                          className="px-2.5 py-1 rounded-lg bg-app-background border border-app-border text-[11px] font-semibold text-app-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* DRAFT TOGGLE */}
                {(!isEditing || room?.status === 'DRAFT') && (
                  <label className="p-3.5 rounded-2xl bg-app-surface border border-app-border flex items-center justify-between cursor-pointer shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-app-text">
                        Lưu nháp, chưa mở đăng ký
                      </span>
                      <span className="text-[11px] text-app-muted">
                        Phòng chỉ hiển thị với bạn để chuẩn bị trước.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isDraft}
                      onChange={(e) => setIsDraft(e.target.checked)}
                      disabled={busy}
                      className="w-5 h-5 accent-app-primary rounded cursor-pointer"
                    />
                  </label>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-app-loss/10 border border-app-loss/40 flex items-start gap-2.5 text-app-loss text-xs font-semibold">
                    <AlertCircle size={17} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-4 px-6 rounded-btn bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-base tracking-wide uppercase transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>{isEditing ? 'ĐANG LƯU…' : 'ĐANG TẠO KÈO…'}</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'LƯU BUỔI CHƠI' : 'TẠO KÈO TUYỂN QUÂN'}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="h-8" />
        </form>
      </main>

      {/* ============================================================== */}
      {/* PASSPORT MODAL (HIỆN MÃ QR & CODE NGAY SAU KHI TẠO PHÒNG RIÊNG) */}
      {/* ============================================================== */}
      <ModalSheet
        isOpen={showPassportModal}
        onClose={() => {
          setShowPassportModal(false);
          if (createdRoomId) navigate(`/rooms/${createdRoomId}`);
        }}
        title="PASSPORT PHÒNG THI ĐẤU"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          {/* Badge Thành Công */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Phòng Thi Đấu Đã Sẵn Sàng</span>
          </div>

          {/* Title & Sân */}
          <div>
            <h3 className="text-lg font-black text-app-text">
              {matchFormat === '1v1' ? 'Trận Đơn 1vs1 Tính Elo' : 'Trận Đôi 2vs2 Tính Elo'}
            </h3>
            <p className="text-xs text-app-muted mt-0.5">
              {selectedCourtName} {courtLabel && `(${courtLabel})`}
            </p>
          </div>

          {/* Join Code Box */}
          <div className="w-full p-3.5 bg-app-background rounded-2xl border border-app-border flex items-center justify-between">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                MÃ PHÒNG (JOIN CODE)
              </span>
              <span className="text-3xl font-black font-mono tracking-widest text-emerald-500 mt-0.5">
                {joinCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyPassportCode}
              className="h-10 px-3.5 rounded-xl bg-app-surface border border-app-border hover:bg-app-background text-app-text text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedPassportCode ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Copy size={16} />
              )}
              <span>{copiedPassportCode ? 'Đã sao chép' : 'Sao chép mã'}</span>
            </button>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center">
            <QRCodeSVG
              value={createdRoomId ? `${window.location.origin}/#/rooms/${createdRoomId}` : ''}
              size={190}
              level="H"
              includeMargin
            />
            <span className="text-[11px] font-bold text-slate-600 mt-2">
              Quét mã QR bằng camera điện thoại để vào sảnh
            </span>
          </div>

          <p className="text-xs text-app-muted leading-relaxed">
            Chia sẻ mã phòng hoặc link cho đối thủ. Khi đối thủ vào phòng, trận đấu có thể bắt đầu ngay!
          </p>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowPassportModal(false);
                if (createdRoomId) navigate(`/rooms/${createdRoomId}`);
              }}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>VÀO PHÒNG CHỜ THI ĐẤU NGAY</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={handleCopyPassportLink}
              className="w-full h-11 rounded-xl bg-app-surface border border-app-border text-app-text hover:bg-app-background font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedPassportLink ? (
                <Check size={15} className="text-emerald-500" />
              ) : (
                <Share2 size={15} />
              )}
              <span>{copiedPassportLink ? 'Đã sao chép link mời' : 'Sao chép link mời đối thủ'}</span>
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
};
