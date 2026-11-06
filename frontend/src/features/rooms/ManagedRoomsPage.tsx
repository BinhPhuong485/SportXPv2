import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCw,
  Calendar,
  ChevronDown,
  Activity,
  AlertCircle,
  SlidersHorizontal,
  MapPin,
  Clock,
  Radio,
  Bolt,
  Tag,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  ManagedRoomData,
  RoomFilterState,
} from './domain/managedRoom';
import {
  managedRoomRepository,
  RoomNotice,
  roomFailure,
} from './data/managedRoomRepository';
import { RoomCard } from './presentation/widgets/RoomCard';
import { RoomFilterSheet } from './presentation/widgets/RoomFilterSheet';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import { UpcomingRoomsStrip } from '../calendar/presentation/widgets/UpcomingRoomsStrip';

export const ManagedRoomsPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation tabs: 'discover' (Tìm kèo) | 'mine' (Buổi của tôi)
  const [mainTab, setMainTab] = useState<'discover' | 'mine'>('discover');
  const [mineSubTab, setMineSubTab] = useState<'mine' | 'history'>('mine');
  const [activeSport, setActiveSport] = useState<'badminton' | 'pickleball' | 'tennis' | 'padel'>('badminton');

  const scope = mainTab === 'mine' ? mineSubTab : mainTab;

  const [items, setItems] = useState<ManagedRoomData[]>([]);
  const [, setNotices] = useState<RoomNotice[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<RoomFilterState>(new RoomFilterState());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Join by code modal state
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [searchingCode, setSearchingCode] = useState(false);

  // 1-Click Quick Matchmaker selection
  const [quickTime, setQuickTime] = useState<'18:30' | '20:00' | 'morning'>('18:30');

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      if (reset) {
        setItems([]);
        setMore(false);
      }

      try {
        const offset = reset ? 0 : items.length;
        const rows = await managedRoomRepository.list(scope, offset);

        // Client-side filtering
        let filtered = rows;
        if (scope === 'mine') {
          filtered = filtered.filter(
            (r) => r.isHost || (r.myStatus && r.myStatus !== 'CANCELLED' && r.myStatus !== 'LEAVE')
          );
        }
        if (filter.area !== 'Tất cả') {
          filtered = filtered.filter(
            (r) =>
              r.address.includes(filter.area) ||
              r.courtName.includes(filter.area) ||
              r.title.includes(filter.area)
          );
        }
        if (filter.skill !== null) {
          filtered = filtered.filter(
            (r) => filter.skill! >= r.minElo && filter.skill! <= r.maxElo
          );
        }
        if (filter.maxFee !== null) {
          filtered = filtered.filter((r) => r.fee <= filter.maxFee!);
        }
        if (filter.availableOnly) {
          filtered = filtered.filter((r) => r.capacity - r.reserved > 0);
        }
        if (filter.date !== null) {
          filtered = filtered.filter((r) => {
            return (
              r.startsAt.getFullYear() === filter.date!.getFullYear() &&
              r.startsAt.getMonth() === filter.date!.getMonth() &&
              r.startsAt.getDate() === filter.date!.getDate()
            );
          });
        }

        setItems((prev) => (reset ? filtered : [...prev, ...filtered]));
        setMore(rows.length === 50);
      } catch (e) {
        setError(roomFailure(e));
      } finally {
        setLoading(false);
      }

      if (reset) {
        try {
          const noticeRows = await managedRoomRepository.notices();
          setNotices(noticeRows);
        } catch {
          // non-blocking
        }
      }
    },
    [scope, items.length, filter]
  );

  useEffect(() => {
    load(true);
    calendarRepository.loadUserCalendarEvents().then(setCalendarEvents).catch(() => {});
  }, [mainTab, mineSubTab, filter]);

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinCodeError('Vui lòng nhập mã phòng.');
      return;
    }

    setSearchingCode(true);
    setJoinCodeError(null);

    try {
      const room = await managedRoomRepository.lookupCode(code);
      if (!room) {
        setJoinCodeError(`Không tìm thấy phòng với mã "${code}".`);
        return;
      }
      setIsJoinCodeOpen(false);
      setJoinCode('');
      navigate(`/rooms/${room.id}`);
    } catch (e) {
      setJoinCodeError(roomFailure(e));
    } finally {
      setSearchingCode(false);
    }
  };

  const currentArea = filter.area === 'Tất cả' ? 'TP.HCM • Q.10, Bình Thạnh, Thủ Đức' : filter.area;

  const sampleRooms: ManagedRoomData[] = [
    {
      id: 'sample-room-1',
      courtId: 'court-1',
      title: 'Kèo Giao lưu Đôi Nam - Cọ Xát Leo Rank Sân 3',
      courtName: 'Sân Cầu Lông Kỳ Hòa, 238 Ba Tháng Hai, Q.10',
      address: '238 Ba Tháng Hai, Quận 10',
      startsAt: new Date(Date.now() + 2 * 3600 * 1000),
      endsAt: new Date(Date.now() + 4 * 3600 * 1000),
      cancelBy: new Date(Date.now() + 3600 * 1000),
      capacity: 4,
      reserved: 3,
      minElo: 1800,
      maxElo: 2000,
      fee: 75000,
      revision: 1,
      status: 'OPEN',
      isHost: false,
      hostPlays: true,
      roomType: 'PUBLIC_RECRUIT',
      isRated: true,
      members: [],
      canRegister: true,
      canEdit: false,
      statusLabel: 'Đang tuyển',
      hostName: 'Tuấn Pro',
      roomCode: '#XP-9821'
    },
    {
      id: 'sample-room-2',
      courtId: 'court-2',
      title: 'Pickleball DINK & SMASH - Trình DUPR 3.5 - 4.0 Thảo Điền',
      courtName: 'CLB D-Pickleball Court 2, Thảo Điền, TP. Thủ Đức',
      address: 'Thảo Điền, TP. Thủ Đức',
      startsAt: new Date(Date.now() + 3 * 3600 * 1000),
      endsAt: new Date(Date.now() + 5 * 3600 * 1000),
      cancelBy: new Date(Date.now() + 2 * 3600 * 1000),
      capacity: 4,
      reserved: 2,
      minElo: 1600,
      maxElo: 1850,
      fee: 120000,
      revision: 1,
      status: 'OPEN',
      isHost: false,
      hostPlays: true,
      roomType: 'PUBLIC_RECRUIT',
      isRated: true,
      members: [],
      canRegister: true,
      canEdit: false,
      statusLabel: 'Đang tuyển',
      hostName: 'Phương Ly',
      roomCode: '#XP-7712'
    },
    {
      id: 'sample-room-3',
      courtId: 'court-3',
      title: 'Giao Lưu Đêm Muộn Vui Vẻ - Nhóm Công Nghệ Xả Stress',
      courtName: 'Sân Viettel Hẻm 158 Hoàng Hoa Thám, Tân Bình',
      address: 'Hẻm 158 Hoàng Hoa Thám, Tân Bình',
      startsAt: new Date(Date.now() + 5 * 3600 * 1000),
      endsAt: new Date(Date.now() + 7 * 3600 * 1000),
      cancelBy: new Date(Date.now() + 4 * 3600 * 1000),
      capacity: 4,
      reserved: 4,
      minElo: 1200,
      maxElo: 1500,
      fee: 50000,
      revision: 1,
      status: 'FULL',
      isHost: false,
      hostPlays: true,
      roomType: 'PUBLIC_RECRUIT',
      isRated: false,
      members: [],
      canRegister: false,
      canEdit: false,
      statusLabel: 'Đủ người',
      hostName: 'Hoàng IT',
      roomCode: '#XP-3341'
    }
  ] as unknown as ManagedRoomData[];

  const displayRooms = items.length > 0 ? items : mainTab === 'discover' ? sampleRooms : [];

  return (
    <div className="w-full flex flex-col bg-app-background min-h-[calc(100vh-64px)] select-none pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* ========================================================= */}
        {/* TOP TELEMETRY STATUS TICKER (Stitch Screen 2 Pattern)       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-app-surface p-4 rounded-xl border border-app-border shadow-2xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-app-muted uppercase tracking-wider font-bold">
                Hệ thống mở
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl text-app-text font-black">142</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">kèo sẵn sàng</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Activity size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-app-surface p-4 rounded-xl border border-app-border shadow-2xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-app-muted uppercase tracking-wider font-bold">
                Người tìm đối
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-black">
                  89
                </span>
                <span className="text-xs text-app-muted font-medium">vận động viên</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Radio size={18} className="animate-pulse" />
            </div>
          </div>

          <div className="bg-white dark:bg-app-surface p-4 rounded-xl border border-app-border shadow-2xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-app-muted uppercase tracking-wider font-bold">
                Tốc độ ghép
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl text-app-text font-black">3:48</span>
                <span className="text-xs text-app-muted font-medium">phút / kèo</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
              <Clock size={18} />
            </div>
          </div>

          <div className="bg-white dark:bg-app-surface p-4 rounded-xl border border-app-border shadow-2xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-app-muted uppercase tracking-wider font-bold">
                Sân liên kết
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl text-app-text font-black">36</span>
                <span className="text-xs text-app-muted font-medium">cụm sân active</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <MapPin size={18} />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILTER DOCK & SPORT SELECTOR (Stitch Screen 2 Pattern)     */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-app-surface p-3.5 sm:p-4 rounded-xl border border-app-border shadow-2xs flex flex-col gap-3.5">
          {/* Top Bar inside Dock: Sport Tabs & Sub-actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-app-border/70">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'badminton', label: 'Cầu Lông', icon: '🏸' },
                { key: 'pickleball', label: 'Pickleball', icon: '🏓' },
                { key: 'tennis', label: 'Tennis', icon: '🎾' },
                { key: 'padel', label: 'Padel', icon: '🏏' },
              ].map((sp) => (
                <button
                  key={sp.key}
                  type="button"
                  onClick={() => setActiveSport(sp.key as any)}
                  className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeSport === sp.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{sp.icon}</span>
                  <span>{sp.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsJoinCodeOpen(true)}
                className="text-app-muted hover:text-app-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center text-xs font-semibold gap-1 transition-colors"
              >
                <Search size={14} className="text-emerald-600" />
                <span>Nhập mã phòng</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="text-app-muted hover:text-app-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center text-xs font-semibold gap-1 transition-colors"
              >
                <SlidersHorizontal size={14} className="text-emerald-600" />
                <span>Bộ lọc chuyên sâu</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => load(true)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-500/10 flex items-center text-xs font-bold gap-1 transition-colors disabled:opacity-50"
              >
                <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* 4-Field Detail Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Area */}
            <div
              onClick={() => setIsFilterOpen(true)}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-lg flex items-center justify-between text-app-text cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={16} className="text-emerald-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] text-app-muted leading-none font-bold uppercase">Khu Vực</span>
                  <span className="text-xs font-bold text-app-text leading-tight mt-0.5 truncate">
                    {currentArea}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-app-muted shrink-0" />
            </div>

            {/* Elo Level */}
            <div
              onClick={() => setIsFilterOpen(true)}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-lg flex items-center justify-between text-app-text cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity size={16} className="text-emerald-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] text-app-muted leading-none font-bold uppercase">Trình Độ Elo</span>
                  <span className="text-xs font-bold text-app-text leading-tight mt-0.5 truncate">
                    {filter.skill !== null ? `${filter.skill} Elo` : 'Bán chuyên & Phong trào'}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-app-muted shrink-0" />
            </div>

            {/* Format */}
            <div
              onClick={() => setIsFilterOpen(true)}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-lg flex items-center justify-between text-app-text cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Radio size={16} className="text-emerald-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] text-app-muted leading-none font-bold uppercase">Thể Thức</span>
                  <span className="text-xs font-bold text-app-text leading-tight mt-0.5 truncate">
                    Đôi Nam & Đôi Nam Nữ
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-app-muted shrink-0" />
            </div>

            {/* Time */}
            <div
              onClick={() => setIsFilterOpen(true)}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2 rounded-lg flex items-center justify-between text-app-text cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={16} className="text-emerald-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[10px] text-app-muted leading-none font-bold uppercase">Thời Gian</span>
                  <span className="text-xs font-bold text-app-text leading-tight mt-0.5 truncate">
                    {filter.date ? `${filter.date.getDate()}/${filter.date.getMonth() + 1}` : 'Hôm nay (Tối 18:00 - 22:00)'}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className="text-app-muted shrink-0" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE: MATCH FEED (8 COLS) + RIGHT BENTO (4 COLS) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* ================= PRIMARY MATCH FEED (8 Cols) ================= */}
          <div className="xl:col-span-8 flex flex-col gap-4 min-w-0">
            {/* Header: Scope Switcher + Sort */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMainTab('discover')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mainTab === 'discover'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border'
                  }`}
                >
                  <Activity size={14} />
                  <span>Phòng Chờ Đang Mở</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                    {items.length || 8}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainTab('mine')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mainTab === 'mine'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border'
                  }`}
                >
                  <Calendar size={14} />
                  <span>Buổi Của Tôi</span>
                </button>

                {mainTab === 'mine' && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setMineSubTab('mine')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        mineSubTab === 'mine'
                          ? 'bg-white dark:bg-app-surface text-app-text shadow-2xs'
                          : 'text-app-muted hover:text-app-text'
                      }`}
                    >
                      Sắp tới
                    </button>
                    <button
                      type="button"
                      onClick={() => setMineSubTab('history')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        mineSubTab === 'history'
                          ? 'bg-white dark:bg-app-surface text-app-text shadow-2xs'
                          : 'text-app-muted hover:text-app-text'
                      }`}
                    >
                      Lịch sử
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-app-muted font-medium">
                <span>Sắp xếp:</span>
                <span className="text-app-text font-bold cursor-pointer hover:text-emerald-600">Gần nhất trước ▼</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
                <button type="button" onClick={() => load(true)} className="underline font-bold">
                  Thử lại
                </button>
              </div>
            )}

            {/* Buổi của tôi strip */}
            {mainTab === 'mine' && calendarEvents.length > 0 && (
              <UpcomingRoomsStrip events={calendarEvents} />
            )}

            {/* List of Rooms */}
            <div className="space-y-4">
              {loading && items.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-app-muted font-medium">Đang tải phòng thi đấu…</span>
                </div>
              ) : mainTab === 'mine' && displayRooms.length === 0 ? (
                <div className="py-12 bg-white dark:bg-app-surface border border-app-border rounded-xl flex flex-col items-center justify-center p-6 text-center gap-2.5">
                  <Calendar size={32} className="text-app-muted/60" />
                  <h4 className="text-sm font-bold text-app-text">Chưa Có Buổi Chơi Nào</h4>
                  <p className="text-xs text-app-muted max-w-sm leading-relaxed">
                    {mineSubTab === 'mine'
                      ? 'Bạn chưa tham gia buổi chơi nào sắp diễn ra. Hãy vào Phòng Chờ Đang Mở để tìm kèo hoặc tự tạo kèo mới!'
                      : 'Bạn chưa có lịch sử buổi chơi nào.'}
                  </p>
                  {mineSubTab === 'mine' && (
                    <button
                      type="button"
                      onClick={() => setMainTab('discover')}
                      className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Khám Phá Phòng Chờ
                    </button>
                  )}
                </div>
              ) : (
                displayRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onTap={() => navigate(room.id.startsWith('sample-') ? '/rooms/new' : `/rooms/${room.id}`)}
                  />
                ))
              )}

              {/* Load More Button */}
              {!loading && more && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => load(false)}
                    className="px-5 py-2 rounded-xl border border-app-border bg-white dark:bg-app-surface text-app-text text-xs font-bold flex items-center gap-1.5 hover:border-emerald-500 transition-all shadow-2xs active:scale-95"
                  >
                    <ChevronDown size={16} />
                    <span>TẢI THÊM BUỔI CHƠI</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT BENTO DOCK (4 Cols) ================= */}
          <aside className="xl:col-span-4 flex flex-col gap-5 sticky top-18">
            {/* Widget 1: Tạo Kèo Nhanh 1-Click (Auto Bot AI Matchmaker) */}
            <div className="bg-white dark:bg-app-surface p-5 rounded-xl border border-app-border shadow-2xs flex flex-col gap-3.5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bolt size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-app-text">Tạo Kèo Nhanh 1-Click</h3>
                </div>
                <span className="font-mono text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                  Auto Bot AI
                </span>
              </div>

              <p className="text-xs text-app-muted leading-relaxed">
                Hệ thống tự động book sân & gợi ý VĐV có chỉ số Elo tương đương trong bán kính 5km.
              </p>

              <div className="flex flex-col gap-3 pt-1">
                {/* Bộ môn */}
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-app-muted uppercase font-bold">
                    Bộ Môn Cần Đánh
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      🏸 Cầu Lông
                    </button>
                    <button
                      type="button"
                      className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-app-muted font-mono text-xs font-semibold flex items-center justify-center gap-1 hover:text-app-text transition-colors"
                    >
                      🏓 Pickleball
                    </button>
                  </div>
                </div>

                {/* Khung giờ */}
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-app-muted uppercase font-bold">
                    Khung Giờ Ghép
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: '18:30', label: '18:30 Tối' },
                      { key: '20:00', label: '20:00 Tối' },
                      { key: 'morning', label: 'Sáng Mai' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setQuickTime(t.key as any)}
                        className={`py-1.5 rounded-lg font-mono text-[11px] font-bold text-center transition-all ${
                          quickTime === t.key
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-app-muted hover:text-app-text'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yêu cầu Elo */}
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-app-muted uppercase font-bold">
                    Yêu Cầu Elo / Kỹ Năng
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs text-app-text">
                    <span className="font-medium">± 100 Elo so với bạn (850)</span>
                    <SlidersHorizontal size={13} className="text-emerald-600" />
                  </div>
                </div>

                {/* Chia tiền */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2 rounded-lg text-xs">
                  <span className="text-app-text font-medium">Campuchia chia đều qua Ví</span>
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/rooms/new')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 mt-1"
              >
                <Bolt size={15} />
                <span>Bắt Đầu Ghép Kèo Ngay</span>
              </button>
            </div>

            {/* Widget 2: Sân Giờ Vàng -20% (Live Flash Deals) */}
            <div className="bg-white dark:bg-app-surface p-5 rounded-xl border border-app-border shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tag size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-app-text">Sân Giờ Vàng -20%</h3>
                </div>
                <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                  Live Booking
                </span>
              </div>

              <p className="text-xs text-app-muted leading-relaxed">
                Sân trống đột xuất được tài trợ giảm giá trong 2 giờ tới.
              </p>

              <div className="space-y-2">
                {[
                  {
                    name: 'Sân VSTAR Badminton',
                    district: 'TP. Thủ Đức',
                    time: '18:00 - 20:00 (Sân 2)',
                    price: '160.000đ/h',
                    oldPrice: '200.000đ',
                  },
                  {
                    name: 'Sân TADA Thanh Đa',
                    district: 'Bình Thạnh',
                    time: '19:30 - 21:30 (Sân 5)',
                    price: '140.000đ/h',
                    oldPrice: '175.000đ',
                  },
                  {
                    name: 'Sân An Bình',
                    district: 'Quận 9',
                    time: '20:00 - 22:00 (Sân 1)',
                    price: '120.000đ/h',
                    oldPrice: '150.000đ',
                  },
                ].map((deal, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/rooms/new')}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-app-text truncate">{deal.name}</span>
                      <span className="text-[10px] text-app-muted truncate font-medium">
                        {deal.district} • {deal.time}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-black">
                        {deal.price}
                      </span>
                      <span className="font-mono text-[9px] text-app-muted line-through">
                        {deal.oldPrice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Room Filter Modal Sheet */}
      <RoomFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initial={filter}
        onApply={(updated) => setFilter(updated)}
      />

      {/* Join By Code Modal */}
      <ModalSheet
        isOpen={isJoinCodeOpen}
        onClose={() => setIsJoinCodeOpen(false)}
        title="VÀO PHÒNG BẰNG MÃ"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-app-muted leading-relaxed">
            Nhập mã phòng do host chia sẻ (ví dụ: #XP-8291) để tìm và tham gia kèo đấu.
          </p>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinCodeError(null);
            }}
            placeholder="Nhập mã phòng (e.g. XP-1234)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-app-border bg-app-surface text-app-text text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-emerald-500"
          />
          {joinCodeError && (
            <span className="text-xs text-rose-500 font-medium">{joinCodeError}</span>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsJoinCodeOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-app-muted hover:text-app-text"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={searchingCode}
              onClick={handleJoinByCode}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {searchingCode ? 'Đang tìm…' : 'Vào phòng'}
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
};
