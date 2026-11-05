import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hash,
  RotateCw,
  SlidersHorizontal,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  Bell,
  Activity,
  ArrowRight,
  AlertCircle,
  Plus,
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
import { EmptyState } from '../../shared/components/EmptyState';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import { UpcomingRoomsStrip } from '../calendar/presentation/widgets/UpcomingRoomsStrip';

export const ManagedRoomsPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation tabs: 'discover' (Tìm kèo) | 'mine' (Buổi của tôi)
  const [mainTab, setMainTab] = useState<'discover' | 'mine'>('discover');
  // Sub-tab for 'mine': 'mine' (Sắp tới) or 'history' (Lịch sử)
  const [mineSubTab, setMineSubTab] = useState<'mine' | 'history'>('mine');

  const scope = mainTab === 'mine' ? mineSubTab : mainTab;

  const [items, setItems] = useState<ManagedRoomData[]>([]);
  const [notices, setNotices] = useState<RoomNotice[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticesExpanded, setNoticesExpanded] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<RoomFilterState>(new RoomFilterState());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Join by code modal state
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [searchingCode, setSearchingCode] = useState(false);

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

        // Apply client-side filters for active criteria
        let filtered = rows;
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
          // Notices load failure is non-blocking
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
      // Find room by code / ID via get_room_v2
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

  const currentArea =
    filter.area === 'Tất cả' ? 'TP. Hồ Chí Minh' : filter.area;

  const activeFilterCount = [
    filter.area !== 'Tất cả',
    filter.radius !== 100,
    filter.date !== null,
    filter.skill !== null,
    filter.maxFee !== null,
    filter.availableOnly,
  ].filter(Boolean).length;

  const ongoingRooms =
    mainTab === 'mine' && mineSubTab === 'mine'
      ? items.filter((r) => r.status === 'IN_PROGRESS')
      : [];

  const displayRooms =
    mainTab === 'mine' && mineSubTab === 'mine'
      ? items.filter((r) => r.status !== 'IN_PROGRESS')
      : items;

  const unreadNoticesCount = notices.filter((n) => !n.read).length;

  const noticeText = (kind: string): string => {
    switch (kind) {
      case 'TERMS_CHANGED':
        return 'Điều kiện buổi chơi đã đổi; cần xem và xác nhận lại.';
      case 'PROMOTED':
        return 'Bạn đã được lên chỗ chính thức từ danh sách chờ.';
      case 'MEMBER_LEFT':
        return 'Có người chơi vừa hủy đăng ký.';
      case 'HOST_CANCELLED':
        return 'Host đã hủy buổi chơi này.';
      case 'NOT_RECONFIRMED':
        return 'Chỗ chưa xác nhận lại đã được giải phóng; không phạt.';
      case 'COMPLETED':
        return 'Buổi chơi đã kết thúc.';
      case 'WAITLIST_CLOSED':
        return 'Buổi chơi đã bắt đầu; danh sách chờ đã đóng, không phạt.';
      case 'WAITLIST_ACCESS_REVOKED':
        return 'Đăng ký chờ đã hủy do thay đổi quyền kết nối; không phạt.';
      default:
        return kind;
    }
  };

  return (
    <div className="w-full flex flex-col bg-app-background min-h-[calc(100vh-56px)] select-none">
      {/* 1. TOP BAR: KÈO ĐẤU + KHU VỰC + ACTIONS */}
      <div className="w-full max-w-content md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4 flex items-center justify-between gap-4">
        <div
          onClick={() => setIsFilterOpen(true)}
          className="flex flex-col cursor-pointer select-none py-1 group"
        >
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-app-text tracking-tight leading-tight">
              Kèo đấu
            </h1>
            <span className="px-2.5 py-1 rounded-lg bg-app-mint text-app-primary text-xs font-bold border border-app-primary/30 flex items-center gap-1 group-hover:border-app-primary transition-colors">
              <span>{currentArea}</span>
              <ChevronDown size={14} />
            </span>
          </div>
          <p className="hidden md:block text-xs text-app-muted mt-1 font-medium">
            Khám phá và tham gia các buổi chơi cầu lông giao lưu, ghép cặp theo trình độ Elo
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            title="Lịch thi đấu"
            className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl border border-app-border bg-app-surface text-app-text text-xs font-bold flex items-center gap-2 hover:border-app-primary/50 transition-colors shadow-2xs active:scale-95"
          >
            <Calendar size={16} className="text-app-primary" />
            <span className="hidden sm:inline">Lịch thi đấu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setJoinCode('');
              setJoinCodeError(null);
              setIsJoinCodeOpen(true);
            }}
            className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl border border-app-border bg-app-surface text-app-text text-xs font-bold flex items-center gap-2 hover:border-app-primary/50 transition-colors shadow-2xs active:scale-95"
          >
            <Hash size={16} className="text-app-primary" />
            <span>Nhập mã</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => load(true)}
            title="Tải lại danh sách"
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-app-text flex items-center justify-center transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <RotateCw
              size={17}
              className={loading ? 'animate-spin text-app-primary' : ''}
            />
          </button>

          {/* Desktop Primary Create Room CTA Button */}
          <button
            type="button"
            onClick={() => navigate('/rooms/new')}
            className="hidden md:flex h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold tracking-wider uppercase items-center gap-2 shadow-xs transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>TẠO KÈO MỚI</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-content md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-6 flex flex-col gap-3 md:gap-4">
        {/* 2. TOOLBAR: SCOPE TABS + QUICK FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-1.5 md:p-2 bg-app-surface/60 rounded-2xl border border-app-border/70 backdrop-blur-xs">
          {/* Scope Tabs */}
          <div className="p-1 bg-app-surface rounded-[12px] border border-app-border flex w-full md:w-auto md:min-w-[280px]">
            <button
              type="button"
              onClick={() => setMainTab('discover')}
              className={`flex-1 md:px-5 py-2 text-xs md:text-[13px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
                mainTab === 'discover'
                  ? 'bg-app-mint border border-app-primary/40 text-app-primary font-black shadow-2xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              <Activity
                size={15}
                className={mainTab === 'discover' ? 'text-app-primary' : 'text-app-muted'}
              />
              <span>Tìm kèo</span>
            </button>
            <button
              type="button"
              onClick={() => setMainTab('mine')}
              className={`flex-1 md:px-5 py-2 text-xs md:text-[13px] font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 ${
                mainTab === 'mine'
                  ? 'bg-app-mint border border-app-primary/40 text-app-primary font-black shadow-2xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              <Calendar
                size={15}
                className={mainTab === 'mine' ? 'text-app-primary' : 'text-app-muted'}
              />
              <span>Buổi của tôi</span>
            </button>
          </div>

          {/* Quick Filters (discover mode) */}
          {mainTab === 'discover' ? (
            <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible no-scrollbar py-0.5 md:flex-wrap">
              {/* Ngày chơi chip */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-all ${
                  filter.date !== null
                    ? 'bg-app-mint border-app-primary/40 text-app-primary font-bold shadow-2xs'
                    : 'bg-app-surface border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                <Calendar
                  size={13}
                  className={filter.date !== null ? 'text-app-primary' : 'text-app-muted'}
                />
                <span>
                  {filter.date === null
                    ? 'Ngày chơi'
                    : `${filter.date.getDate()}/${filter.date.getMonth() + 1}`}
                </span>
              </button>

              {/* Trình độ chip */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-all ${
                  filter.skill !== null
                    ? 'bg-app-mint border-app-primary/40 text-app-primary font-bold shadow-2xs'
                    : 'bg-app-surface border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                <Award
                  size={14}
                  className={filter.skill !== null ? 'text-app-primary' : 'text-app-muted'}
                />
                <span>
                  {filter.skill === null ? 'Trình độ Elo' : `${filter.skill} Elo`}
                </span>
              </button>

              {/* Còn chỗ chip */}
              <button
                type="button"
                onClick={() => {
                  setFilter((prev) => {
                    const updated = new RoomFilterState(prev);
                    updated.availableOnly = !prev.availableOnly;
                    return updated;
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shrink-0 transition-all ${
                  filter.availableOnly
                    ? 'bg-app-mint border-app-primary/40 text-app-primary font-bold shadow-2xs'
                    : 'bg-app-surface border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                <span>Chỉ hiện phòng còn chỗ</span>
              </button>

              {/* Bộ lọc chi tiết chip */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition-all ${
                  activeFilterCount > 0
                    ? 'bg-app-primary text-app-on-primary border-app-primary font-bold shadow-xs'
                    : 'bg-app-surface border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>
                  {activeFilterCount > 0
                    ? `Bộ lọc (${activeFilterCount})`
                    : 'Bộ lọc nâng cao'}
                </span>
              </button>

              {/* Xóa lọc */}
              {filter.hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    const fresh = new RoomFilterState();
                    setFilter(fresh);
                  }}
                  className="text-xs text-app-loss font-bold px-2 py-1 hover:underline shrink-0"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          ) : (
            /* Sub-tabs for Buổi của tôi */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMineSubTab('mine')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  mineSubTab === 'mine'
                    ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                    : 'bg-app-surface border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                Sắp tới
              </button>
              <button
                type="button"
                onClick={() => setMineSubTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  mineSubTab === 'history'
                    ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                    : 'bg-app-surface border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                Lịch sử
              </button>
            </div>
          )}
        </div>

        {/* Buổi của tôi: Upcoming strip */}
        {mainTab === 'mine' && (
          <div className="w-full">
            <UpcomingRoomsStrip events={calendarEvents} />
          </div>
        )}

        {/* 4. NOTICES BANNER (matching Flutter expandable notices banner) */}
        {notices.length > 0 && (
          <div
            className={`w-full bg-app-surface rounded-[14px] border overflow-hidden transition-all ${
              unreadNoticesCount > 0
                ? 'border-app-streak/50'
                : 'border-app-border'
            }`}
          >
            <div
              onClick={() => setNoticesExpanded(!noticesExpanded)}
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-app-background/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Bell
                  size={18}
                  className={
                    unreadNoticesCount > 0
                      ? 'text-app-streak'
                      : 'text-app-muted'
                  }
                />
                <span
                  className={`text-xs ${
                    unreadNoticesCount > 0
                      ? 'font-bold text-app-text'
                      : 'font-medium text-app-muted'
                  }`}
                >
                  {unreadNoticesCount > 0
                    ? `Bạn có ${unreadNoticesCount} thông báo buổi chơi mới`
                    : `Thông báo buổi chơi (${notices.length})`}
                </span>
              </div>
              {noticesExpanded ? (
                <ChevronUp size={18} className="text-app-muted" />
              ) : (
                <ChevronDown size={18} className="text-app-muted" />
              )}
            </div>

            {noticesExpanded && (
              <div className="border-t border-app-border divide-y divide-app-border/40">
                {notices.slice(0, 5).map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => navigate(`/rooms/${notice.room_id}`)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-app-background/40 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          notice.read ? 'bg-transparent' : 'bg-app-streak'
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-app-text">
                          {noticeText(notice.kind)}
                        </span>
                        <span className="text-[11px] text-app-muted">
                          Bản {notice.revision} • {notice.created_at}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-app-muted shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. ERROR BANNER */}
        {error && (
          <div className="p-3.5 rounded-xl bg-app-loss/10 border border-app-loss/30 text-xs text-app-loss flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => load(true)}
              className="text-xs font-bold underline shrink-0"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 6. ONGOING SECTION (BUỔI ĐANG DIỄN RA) */}
        {ongoingRooms.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-app-mint border border-app-primary/40 text-app-primary text-[11px] font-extrabold tracking-wider w-fit">
              <span className="w-2 h-2 rounded-full bg-app-primary animate-pulse" />
              <span>BUỔI ĐANG DIỄN RA ({ongoingRooms.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {ongoingRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isHighlight
                  onTap={() => navigate(`/rooms/${room.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section title if both ongoing and upcoming exist */}
        {ongoingRooms.length > 0 && displayRooms.length > 0 && (
          <div className="text-[11px] font-bold text-app-muted tracking-wider pt-2 flex items-center gap-1.5">
            <Calendar size={14} />
            <span>BUỔI SẮP TỚI ({displayRooms.length})</span>
          </div>
        )}

        {/* 7. ROOMS LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 pb-8">
          {displayRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onTap={() => navigate(`/rooms/${room.id}`)}
            />
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 col-span-full">
              <div className="w-6 h-6 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-app-muted">Đang tải buổi chơi…</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && !error && (
            <div className="py-8 px-4 col-span-full">
              <EmptyState
                type="shuttlecock"
                title={
                  scope === 'mine'
                    ? 'Bạn chưa tham gia hoặc làm host buổi chơi nào sắp tới.'
                    : scope === 'history'
                    ? 'Chưa có lịch sử buổi chơi nào hoàn tất.'
                    : filter.hasActiveFilter
                    ? 'Không tìm thấy kèo phù hợp với bộ lọc.'
                    : 'Chưa có buổi chơi nào mở tuyển trong khu vực.'
                }
                description={
                  scope === 'mine'
                    ? 'Tìm kèo ở mục "Tìm kèo" hoặc dùng "Nhập mã" ở trên để vào phòng.'
                    : scope === 'history'
                    ? 'Các buổi chơi sau khi kết thúc sẽ hiển thị tại đây.'
                    : 'Thử mở rộng phạm vi tìm kiếm hoặc bỏ bớt tiêu chí lọc.'
                }
                actionLabel={
                  filter.hasActiveFilter && scope === 'discover'
                    ? 'XÓA BỘ LỌC'
                    : 'TẠO KÈO ĐẦU TIÊN'
                }
                onAction={
                  filter.hasActiveFilter && scope === 'discover'
                    ? () => {
                        const fresh = new RoomFilterState();
                        setFilter(fresh);
                      }
                    : () => navigate('/rooms/new')
                }
              />
            </div>
          )}

          {/* Load More Button */}
          {!loading && more && !error && items.length > 0 && (
            <div className="pt-2 pb-6 flex justify-center col-span-full">
              <button
                type="button"
                onClick={() => load(false)}
                className="min-w-[180px] h-12 rounded-xl border border-app-border bg-app-surface text-app-text text-xs font-bold flex items-center justify-center gap-1.5 hover:border-app-primary/60 transition-all shadow-2xs active:scale-95"
              >
                <ChevronDown size={18} className="text-app-muted" />
                <span>TẢI THÊM BUỔI CHƠI</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 8. ROOM FILTER MODAL SHEET */}
      <RoomFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initial={filter}
        onApply={(updated) => setFilter(updated)}
      />

      {/* 9. JOIN BY CODE MODAL SHEET */}
      <ModalSheet
        isOpen={isJoinCodeOpen}
        onClose={() => setIsJoinCodeOpen(false)}
        title="VÀO PHÒNG BẰNG MÃ"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-app-muted leading-relaxed">
            Nhập mã phòng do host chia sẻ (ví dụ: #XP-8291) để tìm và tham gia
            kèo đấu. Phòng đã tham gia sẽ tự động nằm trong "Buổi của tôi".
          </p>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-app-primary pointer-events-none">
              <Hash size={20} />
            </span>
            <input
              type="text"
              autoFocus
              placeholder="VD: #XP-8291 hoặc 8291"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinByCode();
              }}
              className="w-full h-12 bg-app-surface border border-app-border focus:border-app-primary rounded-[14px] pl-11 pr-4 text-base font-bold tracking-wider text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
            />
          </div>

          {joinCodeError && (
            <div className="text-xs font-semibold text-app-loss">
              {joinCodeError}
            </div>
          )}

          <button
            type="button"
            disabled={searchingCode}
            onClick={handleJoinByCode}
            className="w-full h-12 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm tracking-wide disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {searchingCode ? (
              <>
                <div className="w-4 h-4 border-2 border-app-on-primary border-t-transparent rounded-full animate-spin" />
                <span>ĐANG TÌM PHÒNG…</span>
              </>
            ) : (
              <span>TÌM VÀ VÀO PHÒNG</span>
            )}
          </button>
        </div>
      </ModalSheet>
    </div>
  );
};
