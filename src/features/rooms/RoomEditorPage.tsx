import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Shield,
  Lock,
  Globe,
  MapPin,
  Calendar,
  Users,
  Trophy,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Check,
} from 'lucide-react';
import { managedRoomRepository, roomFailure } from './data/managedRoomRepository';
import { ManagedRoomData, Court, newRoomRequestId } from './domain/managedRoom';
import { RoomUiFormatters } from './presentation/widgets/roomUiFormatters';

function generateRoomCode(): string {
  const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
  return `#XP-${hex}`;
}

export const RoomEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId?: string }>();
  const isEditing = Boolean(roomId);

  const [loading, setLoading] = useState(isEditing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states
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
  const [roomCode, setRoomCode] = useState(() => generateRoomCode());
  const [isPrivate, setIsPrivate] = useState(false);
  const [hostPlays, setHostPlays] = useState(true);
  const [isDraft, setIsDraft] = useState(false);

  // Start date/time state
  const [startsAt, setStartsAt] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });

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
            setIsPrivate(existing.visibility === 'PRIVATE');
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
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const regenerateRoomCode = () => {
    if (isEditing) return;
    setRoomCode(generateRoomCode());
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DDTHH:mm
    if (!val) return;
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      setStartsAt(parsed);
    }
  };

  const validate = (): string | null => {
    const t = title.trim();
    if (!t || t.length > 100) return 'Tên buổi chơi từ 1 đến 100 ký tự.';
    if (courtLabel.length > 100) return 'Sân con tối đa 100 ký tự.';
    if (notes.length > 2000) return 'Ghi chú tối đa 2000 ký tự.';

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum < 2 || capNum > 100) return 'Số chỗ chơi từ 2 đến 100 chỗ.';

    const durNum = parseInt(duration, 10);
    if (isNaN(durNum) || durNum < 1) return 'Thời lượng phải lớn hơn 0.';

    if (!courtId) return 'Chọn sân thi đấu.';
    if (startsAt.getTime() <= Date.now()) return 'Giờ bắt đầu phải trong tương lai.';

    const minE = parseInt(minElo, 10);
    const maxE = parseInt(maxElo, 10);
    if (isNaN(minE) || minE < 0 || isNaN(maxE) || maxE < 0) {
      return 'Elo phải là số nguyên không âm.';
    }
    if (maxE < minE) return 'Elo tối đa phải lớn hơn hoặc bằng Elo tối thiểu.';

    const feeNum = parseInt(fee, 10);
    if (isNaN(feeNum) || feeNum < 0) return 'Phí dự kiến phải là số không âm.';

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

    const durMinutes = parseInt(duration, 10) || 120;
    const cancelMinutes = parseInt(cancelBeforeMinutes, 10) || 60;
    const endsAt = new Date(startsAt.getTime() + durMinutes * 60000);
    const cancelBy = new Date(startsAt.getTime() - cancelMinutes * 60000);

    const payload: Record<string, unknown> = {
      court_id: courtId,
      title: title.trim(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      cancel_by: cancelBy.toISOString(),
      capacity: parseInt(capacity, 10),
      min_elo: parseInt(minElo, 10),
      max_elo: parseInt(maxElo, 10),
      fee: parseInt(fee, 10),
      visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      host_plays: hostPlays,
      notes: notes,
      court_label: courtLabel,
      draft: isDraft,
      room_code: roomCode,
      ...(room ? { expected_revision: room.revision } : {}),
    };

    setBusy(true);
    setError(null);

    try {
      await managedRoomRepository.execute({
        requestId: newRoomRequestId(),
        action: isEditing ? 'edit' : 'create',
        roomId: room?.id,
        payload,
      });
      navigate(-1);
    } catch (saveError) {
      setError(roomFailure(saveError));
    } finally {
      setBusy(false);
    }
  };

  const minEloVal = parseInt(minElo, 10) || 0;
  const maxEloVal = parseInt(maxElo, 10) || 2000;
  const currentFee = parseInt(fee, 10) || 0;
  const currentDuration = parseInt(duration, 10) || 120;
  const currentCancel = parseInt(cancelBeforeMinutes, 10) || 60;
  const capCount = parseInt(capacity, 10) || 4;

  const isoDateTimeString = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

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
        <div className="w-full max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              disabled={busy}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-extrabold tracking-tight">
              {isEditing ? 'Sửa điều kiện buổi chơi' : 'Tạo buổi chơi'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[720px] mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Revision conflict warning when editing */}
        {isEditing && (
          <div className="p-3 rounded-xl bg-app-streak/10 border border-app-streak/40 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-app-streak shrink-0 mt-0.5" />
            <p className="text-xs text-app-text leading-relaxed">
              Lưu thay đổi sẽ yêu cầu người đã đăng ký xác nhận lại; danh sách chờ được hủy để đăng ký theo điều kiện mới.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* SECTION 1: LOBBY CODE HERO BANNER */}
          <section className="bg-app-surface rounded-[20px] p-4 border border-app-primary/30 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-app-primary/15 text-app-primary text-[11px] font-extrabold tracking-wider">
                <Trophy size={13} />
                <span>SẢNH PHÒNG THI ĐẤU</span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold ${
                  isPrivate
                    ? 'bg-app-streak/15 text-app-streak'
                    : 'bg-app-primary/15 text-app-primary'
                }`}
              >
                {isPrivate ? 'PHÒNG KÍN' : 'PHÒNG CÔNG KHAI'}
              </span>
            </div>

            <div className="p-3.5 bg-app-background rounded-xl border border-app-border flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-app-muted uppercase tracking-wider">
                  MÃ PHÒNG (ROOM CODE)
                </span>
                <span className="text-2xl font-black text-app-primary tracking-widest tabular-nums mt-0.5 font-mono">
                  {roomCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyRoomCode}
                  title="Sao chép mã phòng"
                  className="h-9 px-3 rounded-xl bg-app-surface border border-app-border text-app-text hover:bg-app-background flex items-center gap-1.5 text-xs font-semibold transition-colors"
                >
                  {copiedCode ? (
                    <Check size={15} className="text-app-primary" />
                  ) : (
                    <Copy size={15} />
                  )}
                  <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={regenerateRoomCode}
                    title="Đổi mã phòng"
                    className="h-9 w-9 rounded-xl bg-app-surface border border-app-border text-app-muted hover:text-app-text hover:bg-app-background flex items-center justify-center transition-colors"
                  >
                    <RefreshCw size={15} />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-app-muted leading-relaxed">
              Chia sẻ mã cho người muốn tham gia. Phòng private ẩn khỏi sảnh; public hiện theo khu vực sân.
            </p>
          </section>

          {/* SECTION 2: GAME MODE SELECTOR (PUBLIC VS PRIVATE) */}
          <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
              <Shield size={15} className="text-app-primary" />
              <span>CHẾ ĐỘ PHÒNG (ROOM VISIBILITY)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Public */}
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                  !isPrivate
                    ? 'border-app-primary bg-app-primary/8 shadow-xs'
                    : 'border-app-border bg-app-background hover:border-app-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Globe
                    size={20}
                    className={!isPrivate ? 'text-app-primary' : 'text-app-muted'}
                  />
                  {!isPrivate && (
                    <CheckCircle2 size={16} className="text-app-primary" />
                  )}
                </div>
                <div className="text-sm font-extrabold text-app-text mt-1">Public</div>
                <div className="text-[11px] font-bold text-app-primary">Sảnh mở tự do</div>
                <div className="text-[11px] text-app-muted leading-tight mt-0.5">
                  Hiện ở sảnh theo khu vực sân. Ai đủ điều kiện đều có thể đăng ký.
                </div>
              </button>

              {/* Private */}
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                  isPrivate
                    ? 'border-app-streak bg-app-streak/8 shadow-xs'
                    : 'border-app-border bg-app-background hover:border-app-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Lock
                    size={20}
                    className={isPrivate ? 'text-app-streak' : 'text-app-muted'}
                  />
                  {isPrivate && (
                    <CheckCircle2 size={16} className="text-app-streak" />
                  )}
                </div>
                <div className="text-sm font-extrabold text-app-text mt-1">Private</div>
                <div className="text-[11px] font-bold text-app-streak">Phòng riêng có mã</div>
                <div className="text-[11px] text-app-muted leading-tight mt-0.5">
                  Ẩn khỏi sảnh. Có mã phòng là có thể tham gia, không cần kết bạn.
                </div>
              </button>
            </div>

            {isPrivate && (
              <div className="p-2.5 rounded-xl bg-app-background border border-app-border flex items-start gap-2 text-[11px] text-app-muted">
                <KeyRound size={15} className="text-app-streak shrink-0 mt-0.5" />
                <span>
                  Khóa bảo vệ: Chia sẻ mã <strong>{roomCode}</strong> cho người muốn tham gia. Nhập mã chỉ mở chi tiết, vẫn kiểm tra trình độ, lịch và số chỗ khi đăng ký.
                </span>
              </div>
            )}
          </section>

          {/* SECTION 3: ARENA & MATCH SCHEDULE */}
          <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
              <MapPin size={15} className="text-app-primary" />
              <span>SÂN ĐẤU & THỜI GIAN</span>
            </div>

            {/* Sân thi đấu */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">Sân cầu thi đấu</label>
              <div className="relative">
                <select
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  disabled={busy}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm font-semibold text-app-text appearance-none outline-hidden focus:border-app-primary transition-colors cursor-pointer"
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-app-primary">
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
                className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm text-app-text outline-hidden focus:border-app-primary transition-colors"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {['Sân 1', 'Sân 2', 'Sân 3', 'Sân 4', 'Sân 5', 'Thảm VIP'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCourtLabel(label)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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

            {/* Start time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">
                Thời gian bắt đầu thi đấu
              </label>
              <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-app-primary/12 text-app-primary flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-app-muted">Bắt đầu lúc</span>
                    <span className="text-sm font-bold text-app-text">
                      {formatDisplayStart(startsAt)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={isoDateTimeString}
                    onChange={handleDateChange}
                    disabled={busy}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="px-3 py-1.5 rounded-lg bg-app-surface border border-app-border text-xs font-bold text-app-primary hover:border-app-primary pointer-events-none">
                    Đổi giờ
                  </div>
                </div>
              </div>
            </div>

            {/* Match Duration */}
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
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
                className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-hidden focus:border-app-primary transition-colors mt-1"
              />
            </div>
          </section>

          {/* SECTION 4: SLOTS & HOST PARTICIPATION */}
          <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
              <Users size={15} className="text-app-primary" />
              <span>SLOTS THI ĐẤU & VAI TRÒ HOST</span>
            </div>

            {/* Capacity Stepper */}
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
                      : capCount === 6
                      ? 'người (đôi xoay tua)'
                      : capCount === 8
                      ? 'người (2 sân đôi)'
                      : 'người'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepCapacity(-1)}
                  disabled={busy || capCount <= 2}
                  className="w-9 h-9 rounded-xl bg-app-surface border border-app-border text-app-text font-bold text-lg flex items-center justify-center hover:bg-app-border/40 disabled:opacity-40 transition-colors"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => stepCapacity(1)}
                  disabled={busy || capCount >= 100}
                  className="w-9 h-9 rounded-xl bg-app-surface border border-app-border text-app-text font-bold text-lg flex items-center justify-center hover:bg-app-border/40 disabled:opacity-40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Preset chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[2, 4, 6, 8, 12].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setCapacity(String(cap))}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    capCount === cap
                      ? 'bg-app-primary text-app-on-primary'
                      : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                  }`}
                >
                  {cap === 2 ? '2 chỗ (Đơn)' : cap === 4 ? '4 chỗ (Đôi)' : `${cap} chỗ`}
                </button>
              ))}
            </div>

            {/* Host Plays Toggle */}
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

          {/* SECTION 5: RANK / ELO MATCHMAKING BRACKET */}
          <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-app-muted tracking-wider uppercase">
              <Trophy size={15} className="text-app-primary" />
              <span>GIỚI HẠN RANK ELO (MATCHMAKING)</span>
            </div>

            {/* Preview Banner */}
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

            {/* Quick rank preset chips */}
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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

            {/* Min / Max Elo inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Elo tối thiểu</label>
                <div className="relative">
                  <input
                    type="number"
                    value={minElo}
                    onChange={(e) => setMinElo(e.target.value)}
                    disabled={busy}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-hidden focus:border-app-primary transition-colors"
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
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-hidden focus:border-app-primary transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-app-muted font-bold pointer-events-none">
                    Elo
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: ECONOMICS & ROOM DETAILS */}
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
                className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-3 text-sm text-app-text outline-hidden focus:border-app-primary transition-colors"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {[
                  'Kèo giao lưu',
                  'Cọ xát leo rank',
                  'Kèo đôi nam nữ',
                  'Tập luyện kỹ thuật',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTitle(item)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      title === item
                        ? 'bg-app-primary text-app-on-primary'
                        : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                    }`}
                  >
                    {item}
                  </button>
                ))}
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
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
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-hidden focus:border-app-primary transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-xs text-app-muted font-bold pointer-events-none">
                  VND
                </span>
              </div>
            </div>

            {/* Hủy miễn ảnh hưởng */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">
                Hủy miễn ảnh hưởng trước giờ chơi (phút)
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[30, 60, 120, 240].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCancelBeforeMinutes(String(mins))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      currentCancel === mins
                        ? 'bg-app-primary text-app-on-primary'
                        : 'bg-app-background border border-app-border text-app-muted hover:text-app-text'
                    }`}
                  >
                    {mins >= 60 ? `${Math.floor(mins / 60)}h (${mins}p)` : `${mins}p`}
                  </button>
                ))}
              </div>
              <div className="relative mt-1">
                <input
                  type="number"
                  value={cancelBeforeMinutes}
                  onChange={(e) => setCancelBeforeMinutes(e.target.value)}
                  disabled={busy}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text outline-hidden focus:border-app-primary transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-xs text-app-muted font-bold pointer-events-none">
                  phút
                </span>
              </div>
            </div>

            {/* Ghi chú / dịch vụ đã gồm */}
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
                className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden focus:border-app-primary transition-colors resize-none"
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
                    className="px-2.5 py-1 rounded-lg bg-app-background border border-app-border text-[11px] font-semibold text-app-muted hover:text-app-text whitespace-nowrap transition-colors"
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

          {/* Policy disclaimer */}
          <p className="text-[11px] text-app-muted px-1 leading-relaxed">
            Phí chỉ là dự kiến, chưa phải thanh toán hay xác nhận đặt sân. Danh sách chờ có thể tự lên chỗ khi còn đủ điều kiện.
          </p>

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
            className="w-full h-13 rounded-2xl bg-app-primary text-app-on-primary font-black text-sm tracking-wide uppercase hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md mt-2"
          >
            {busy ? 'ĐANG LƯU…' : 'LƯU BUỔI CHƠI'}
          </button>

          <div className="h-8" />
        </form>
      </main>
    </div>
  );
};
