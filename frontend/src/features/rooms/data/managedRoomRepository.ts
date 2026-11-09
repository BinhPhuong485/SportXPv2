import { supabase } from '../../../core/config/supabase';
import { useAuthStore } from '../../../shared/hooks/useAuth';
import { ManagedRoomData, RoomMember } from '../domain/managedRoom';

export interface RoomCommand {
  requestId: string;
  action: string;
  roomId?: string;
  payload?: Record<string, unknown>;
}

export interface Court {
  id: string;
  name: string;
  distance_km?: number;
}

export interface RoomNotice {
  id: number;
  room_id: string;
  kind: string;
  created_at: string;
  room_title: string;
  revision: number;
  read?: boolean;
}

export function roomFailure(error: unknown): string {
  if (!error) return 'Đã có lỗi xảy ra.';
  const err = error as { message?: string; code?: string };
  const message = err.message || String(error);

  const labels: Record<string, string> = {
    SCHEDULE_CONFLICT: 'Bạn đã có lịch trùng với buổi này.',
    HOST_SKILL_OUT_OF_RANGE: 'Trình của host đang nằm ngoài khoảng Elo đã chọn.',
    NOT_ELIGIBLE: 'Không đủ điều kiện trình độ hoặc quyền vào phòng.',
    ROOM_FULL: 'Phòng vừa đủ người. Bạn có thể vào danh sách chờ.',
    ROOM_UNAVAILABLE: 'Phòng không tồn tại hoặc bạn không có quyền xem.',
    REVISION_CONFLICT: 'Điều kiện phòng đã đổi. Tải lại trước khi xác nhận.',
    CAPACITY_BELOW_MEMBERS: 'Số chỗ mới thấp hơn số chỗ đã giữ.',
    REGISTRATION_CLOSED: 'Phòng đã đóng đăng ký hoặc đã đến giờ chơi.',
    NOT_ENOUGH_PLAYERS: 'Cần ít nhất hai người chơi đã xác nhận để bắt đầu.',
    ANOTHER_SESSION_ACTIVE: 'Host hoặc người chơi vẫn đang ở một buổi chưa kết thúc.',
    OUTSIDE_START_WINDOW: 'Chỉ bắt đầu trong khoảng giờ đã công bố.',
    RECONFIRMATION_REQUIRED: 'Còn người chưa xác nhận lại lịch. Cần xử lý trước khi bắt đầu.',
    HOST_ONLY: 'Chỉ host được thực hiện thao tác này.',
    HOST_MUST_CANCEL_ROOM: 'Host cần hủy buổi thay vì rời phòng.',
    ROOM_LOCKED: 'Không thể thực hiện ở trạng thái hiện tại.',
    INVALID_ROOM_TERMS: 'Kiểm tra lại thời gian, sân, số chỗ, Elo và phí.',
    IDEMPOTENCY_CONFLICT: 'Yêu cầu cũ đã được dùng. Tải lại danh sách để kiểm tra kết quả.',
    REASON_REQUIRED: 'Vui lòng nhập lý do hủy buổi.',
  };

  for (const [key, label] of Object.entries(labels)) {
    if (message.includes(key)) return label;
  }

  return message;
}

const STORAGE_KEY = 'sportxp_managed_rooms_v3';
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sportxp_rooms_sync') : null;

// Wipe legacy mock storage keys if present
try {
  localStorage.removeItem('sportxp_managed_rooms');
  localStorage.removeItem('sportxp_managed_rooms_v2');
} catch {
  // non-blocking
}

const DEFAULT_COURTS: Court[] = [
  { id: 'c0000002-0000-4000-8000-000000000001', name: 'Sân Cầu Lông An Bình', distance_km: 1.2 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sân Cầu Lông Kỳ Hòa', distance_km: 2.5 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sân Cầu Lông Viettel', distance_km: 3.8 },
  { id: 'pb000001-0000-4000-8000-000000000001', name: 'CLB D-Pickleball Court 2 Thảo Điền', distance_km: 4.1 },
  { id: 'tn000001-0000-4000-8000-000000000001', name: 'Sân Tennis Phú Thọ Quận 11', distance_km: 5.6 },
];

export class ManagedRoomRepository {
  private localRooms: ManagedRoomData[] = [];

  constructor() {
    this.loadFromStorage();
    if (broadcastChannel) {
      broadcastChannel.onmessage = () => {
        this.loadFromStorage();
      };
    }
  }

  private buildInitialMockRooms(): ManagedRoomData[] {
    const now = Date.now();
    return [
      // 1. Casual Doubles waiting room (Flow A - 3/4 slots)
      {
        id: 'room-open-101',
        courtId: '22222222-2222-2222-2222-222222222222',
        courtName: 'Sân Cầu Lông Kỳ Hòa, Quận 10',
        address: '238 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM',
        title: 'Kèo Giao lưu Đôi Nam / Nữ (Trình độ B+ đến A)',
        startsAt: new Date(now + 2 * 3600 * 1000),
        endsAt: new Date(now + 4 * 3600 * 1000),
        cancelBy: new Date(now + 3600 * 1000),
        capacity: 4,
        reserved: 3,
        minElo: 1850,
        maxElo: 2500,
        fee: 60000,
        revision: 1,
        visibility: 'PUBLIC',
        status: 'OPEN',
        statusLabel: 'Đang tuyển',
        hostPlays: true,
        isHost: false,
        hostName: 'Thảo My (Captain)',
        myStatus: null,
        cancellationReason: null,
        notes: 'Cầu thi đấu VinaStar Đỏ 50 (Có nước). Tuyển gấp 1 VĐV trình độ B+ đến A cọ xát.',
        courtLabel: 'Sân 3 (Thảm Yonex)',
        bookingStatus: 'CONFIRMED',
        viewerId: null,
        roomCode: '#XP-9821',
        roomType: 'PUBLIC_RECRUIT',
        joinCode: 'XP-9821',
        isRated: true,
        zaloGroupLink: 'https://zalo.me/g/sportxp9821',
        canRegister: true,
        canEdit: false,
        targetGender: 'all',
        members: [
          {
            id: 'tm-host',
            user_id: 'tm-host',
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: 'Thảo My (Captain)',
            name: 'Thảo My (Captain)',
            elo_rating: 1890,
            tier_name: 'Bán chuyên B+',
            avatar_url: null,
          },
          {
            id: 'qh-mem',
            user_id: 'qh-mem',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Quốc Huy',
            name: 'Quốc Huy',
            elo_rating: 1820,
            tier_name: 'Bán chuyên B',
            avatar_url: null,
          },
          {
            id: 'vd-mem',
            user_id: 'vd-mem',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Văn Đức',
            name: 'Văn Đức',
            elo_rating: 1860,
            tier_name: 'Bán chuyên B+',
            avatar_url: null,
          },
        ],
      },

      // 2. Head-to-Head Rated Match Lobby (Flow B - 1v1 In Progress, ready to record scores)
      {
        id: 'room-live-102',
        courtId: 'c0000002-0000-4000-8000-000000000001',
        courtName: 'Sân Cầu Lông An Bình',
        address: '240A Dương Đình Hội, P. Tăng Nhơn Phú B, TP. Thủ Đức',
        title: 'Trận Đơn 1v1 Thách Đấu Leo Rank - Sân An Bình',
        startsAt: new Date(now - 30 * 60 * 1000),
        endsAt: new Date(now + 90 * 60 * 1000),
        cancelBy: new Date(now - 60 * 60 * 1000),
        capacity: 2,
        reserved: 2,
        minElo: 0,
        maxElo: 2000,
        fee: 40000,
        revision: 1,
        visibility: 'PRIVATE',
        status: 'IN_PROGRESS',
        statusLabel: 'Đang diễn ra',
        hostPlays: true,
        isHost: true,
        hostName: 'Đặng Cao Bồ',
        myStatus: 'REGISTERED',
        cancellationReason: null,
        notes: 'Trận 1V1 Tính Điểm Elo [CODE:XP-02B2]',
        courtLabel: 'Sân số 2',
        bookingStatus: 'CONFIRMED',
        viewerId: null,
        roomCode: '#XP-02B2',
        roomType: 'PRIVATE_RATED',
        joinCode: 'XP-02B2',
        isRated: true,
        zaloGroupLink: null,
        canRegister: false,
        canEdit: true,
        targetGender: 'male',
        members: [
          {
            id: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
            user_id: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: 'Đặng Cao Bồ',
            name: 'Đặng Cao Bồ',
            elo_rating: 750,
            tier_name: 'Phong trào Khá',
            avatar_url: null,
          },
          {
            id: '9ded99f9-af7d-4297-829a-18e213294403',
            user_id: '9ded99f9-af7d-4297-829a-18e213294403',
            public_id: 'ba1fd41e-b597-48d3-867a-5735bbc67d41',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Square',
            name: 'Square',
            elo_rating: 850,
            tier_name: 'Nhập môn',
            avatar_url: null,
          },
        ],
      },

      // 3. Completed Room with Recorded History (History Tab)
      {
        id: 'room-completed-103',
        courtId: 'c0000002-0000-4000-8000-000000000001',
        courtName: 'Sân Cầu Lông An Bình',
        address: '240A Dương Đình Hội, P. Tăng Nhơn Phú B, TP. Thủ Đức',
        title: 'Kèo Giao Lưu Đơn 1v1 - An Bình (Đã kết thúc)',
        startsAt: new Date(now - 4 * 3600 * 1000),
        endsAt: new Date(now - 2 * 3600 * 1000),
        cancelBy: new Date(now - 5 * 3600 * 1000),
        capacity: 2,
        reserved: 2,
        minElo: 0,
        maxElo: 2000,
        fee: 40000,
        revision: 1,
        visibility: 'PUBLIC',
        status: 'COMPLETED',
        statusLabel: 'Đã kết thúc',
        hostPlays: true,
        isHost: true,
        hostName: 'Square',
        myStatus: 'REGISTERED',
        cancellationReason: null,
        notes: 'Buổi cọ xát giao lưu đã hoàn tất.',
        courtLabel: 'Sân 1',
        bookingStatus: 'CONFIRMED',
        viewerId: null,
        roomCode: '#XP-DE86',
        roomType: 'PUBLIC_RECRUIT',
        joinCode: 'XP-DE86',
        isRated: false,
        zaloGroupLink: null,
        canRegister: false,
        canEdit: false,
        targetGender: 'male',
        members: [
          {
            id: '9ded99f9-af7d-4297-829a-18e213294403',
            user_id: '9ded99f9-af7d-4297-829a-18e213294403',
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: 'Square',
            name: 'Square',
            elo_rating: 850,
            tier_name: 'Nhập môn',
            avatar_url: null,
          },
          {
            id: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
            user_id: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Đặng Cao Bồ',
            name: 'Đặng Cao Bồ',
            elo_rating: 750,
            tier_name: 'Phong trào Khá',
            avatar_url: null,
          },
        ],
      },

      // 4. Pickleball Community Room (Multi-sport mock)
      {
        id: 'room-pickleball-104',
        courtId: 'pb000001-0000-4000-8000-000000000001',
        courtName: 'CLB D-Pickleball Court 2 Thảo Điền',
        address: 'Thảo Điền, TP. Thủ Đức, TP.HCM',
        title: 'Pickleball DINK & SMASH - Trình DUPR 3.5 - 4.0 Thảo Điền',
        startsAt: new Date(now + 3 * 3600 * 1000),
        endsAt: new Date(now + 5 * 3600 * 1000),
        cancelBy: new Date(now + 2 * 3600 * 1000),
        capacity: 4,
        reserved: 2,
        minElo: 1600,
        maxElo: 1850,
        fee: 120000,
        revision: 1,
        visibility: 'PUBLIC',
        status: 'OPEN',
        statusLabel: 'Đang tuyển',
        hostPlays: true,
        isHost: false,
        hostName: 'Phương Ly',
        myStatus: null,
        cancellationReason: null,
        notes: 'Sân thảm outdoor đạt chuẩn USA Pickleball. Có bóng Franklin X-40 miễn phí.',
        courtLabel: 'Court 2 Outdoor',
        bookingStatus: 'CONFIRMED',
        viewerId: null,
        roomCode: '#XP-7712',
        roomType: 'PUBLIC_RECRUIT',
        joinCode: 'XP-7712',
        isRated: true,
        zaloGroupLink: null,
        canRegister: true,
        canEdit: false,
        targetGender: 'female',
        members: [
          {
            id: 'pl-host',
            user_id: 'pl-host',
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: 'Phương Ly',
            name: 'Phương Ly',
            elo_rating: 1650,
            tier_name: 'Phong trào Giỏi',
            avatar_url: null,
          },
          {
            id: 'tk-mem',
            user_id: 'tk-mem',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Trần Tuấn Kiệt',
            name: 'Trần Tuấn Kiệt',
            elo_rating: 1720,
            tier_name: 'Phong trào Giỏi',
            avatar_url: null,
          },
        ],
      },

      // 5. Full Room (Badge Đủ Người)
      {
        id: 'room-full-105',
        courtId: '33333333-3333-3333-3333-333333333333',
        courtName: 'Sân Cầu Lông Viettel',
        address: 'Hẻm 158 Hoàng Hoa Thám, Tân Bình, TP.HCM',
        title: 'Giao Lưu Đêm Muộn Vui Vẻ - Nhóm Công Nghệ Xả Stress',
        startsAt: new Date(now + 5 * 3600 * 1000),
        endsAt: new Date(now + 7 * 3600 * 1000),
        cancelBy: new Date(now + 4 * 3600 * 1000),
        capacity: 4,
        reserved: 4,
        minElo: 1200,
        maxElo: 1500,
        fee: 50000,
        revision: 1,
        visibility: 'PUBLIC',
        status: 'FULL',
        statusLabel: 'Đủ người',
        hostPlays: true,
        isHost: false,
        hostName: 'Hoàng IT',
        myStatus: null,
        cancellationReason: null,
        notes: 'Đã đủ 4 thành viên. Hẹn gặp mọi người lúc 21h!',
        courtLabel: 'Sân số 4',
        bookingStatus: 'CONFIRMED',
        viewerId: null,
        roomCode: '#XP-3341',
        roomType: 'PUBLIC_RECRUIT',
        joinCode: 'XP-3341',
        isRated: false,
        zaloGroupLink: null,
        canRegister: false,
        canEdit: false,
        targetGender: 'all',
        members: [
          {
            id: 'hit-host',
            user_id: 'hit-host',
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: 'Hoàng IT',
            name: 'Hoàng IT',
            elo_rating: 1350,
            tier_name: 'Phong trào TB',
            avatar_url: null,
          },
          {
            id: 'hd-mem',
            user_id: 'hd-mem',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Nguyễn Hải Đăng',
            name: 'Nguyễn Hải Đăng',
            elo_rating: 1280,
            tier_name: 'Phong trào TB',
            avatar_url: null,
          },
          {
            id: 'ltm-mem',
            user_id: 'ltm-mem',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Lê Thảo My',
            name: 'Lê Thảo My',
            elo_rating: 1300,
            tier_name: 'Phong trào TB',
            avatar_url: null,
          },
          {
            id: 'tk-mem2',
            user_id: 'tk-mem2',
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: 'Trần Tuấn Kiệt',
            name: 'Trần Tuấn Kiệt',
            elo_rating: 1400,
            tier_name: 'Phong trào TB',
            avatar_url: null,
          },
        ],
      },

      // 6. Tennis Community Room
      {
        id: 'room-tennis-106',
        courtId: 'tn000001-0000-4000-8000-000000000001',
        courtName: 'Sân Tennis Phú Thọ Quận 11',
        address: '219 Lý Thường Kiệt, Phường 15, Quận 11, TP.HCM',
        title: 'Tennis Giao Lưu Cuối Tuần - Đơn Nam Phong Trào',
        startsAt: new Date(now + 18 * 3600 * 1000),
        endsAt: new Date(now + 20 * 3600 * 1000),
        cancelBy: new Date(now + 15 * 3600 * 1000),
        capacity: 2,
        reserved: 1,
        minElo: 900,
        maxElo: 1300,
        fee: 150000,
        revision: 1,
        visibility: 'PUBLIC',
        status: 'OPEN',
        statusLabel: 'Đang tuyển',
        hostPlays: true,
        isHost: false,
        hostName: 'Trần Tuấn Kiệt',
        myStatus: null,
        cancellationReason: null,
        notes: 'Đấu đơn giao lưu cọ xát cuối tuần, bóng mới đập hộp.',
        courtLabel: 'Sân cứng số 3',
        bookingStatus: 'CONFIRMED',
        viewerId: null,
        roomCode: '#XP-5521',
        roomType: 'PUBLIC_RECRUIT',
        joinCode: 'XP-5521',
        isRated: true,
        zaloGroupLink: null,
        canRegister: true,
        canEdit: false,
        targetGender: 'male',
        members: [
          {
            id: 'tk-host',
            user_id: 'tk-host',
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: 'Trần Tuấn Kiệt',
            name: 'Trần Tuấn Kiệt',
            elo_rating: 950,
            tier_name: 'Phong trào Khá',
            avatar_url: null,
          },
        ],
      },
    ];
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localRooms = parsed.map((r: any) => ({
            ...r,
            startsAt: new Date(r.startsAt),
            endsAt: new Date(r.endsAt),
            cancelBy: new Date(r.cancelBy),
            targetGender: r.targetGender || 'all',
          }));
          return;
        }
      }
    } catch {
      // fallback
    }

    // Seed comprehensive mock rooms if empty
    this.localRooms = this.buildInitialMockRooms();
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.localRooms));
      broadcastChannel?.postMessage({ type: 'ROOMS_UPDATED', at: Date.now() });
    } catch {
      // fallback
    }
  }

  public clearAllRooms() {
    this.localRooms = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
      broadcastChannel?.postMessage({ type: 'ROOMS_UPDATED', at: Date.now() });
    } catch {
      // fallback
    }
  }

  private async getCurrentUser() {
    try {
      const authState = useAuthStore.getState();
      if (authState.user) {
        return {
          id: authState.user.id,
          name:
            authState.profile?.displayName ||
            authState.user.user_metadata?.display_name ||
            authState.user.email?.split('@')[0] ||
            'Square',
          elo: authState.profile?.eloRating ?? 850,
          tier: authState.profile?.tierName ?? 'Nhập môn',
          avatar: authState.profile?.avatarUrl ?? null,
        };
      }
    } catch {
      // fallback
    }

    return {
      id: '9ded99f9-af7d-4297-829a-18e213294403',
      name: 'Square',
      elo: 850,
      tier: 'Nhập môn',
      avatar: null,
    };
  }

  private mapDbRowToRoom(row: any, user: { id: string; name: string }): ManagedRoomData {
    const startsAt = new Date(row.play_time || row.starts_at || Date.now());
    const endsAt = new Date(row.end_time || row.ends_at || (startsAt.getTime() + 2 * 3600 * 1000));
    const cancelBy = new Date(row.cancellation_deadline || row.cancel_by || startsAt);

    // Auto-detect completed if session time has elapsed
    const isEndedByTime = endsAt.getTime() < Date.now();
    const effectiveStatus = isEndedByTime && row.status === 'OPEN' ? 'COMPLETED' : (row.status || 'OPEN');

    const isPrivate = row.visibility === 'PRIVATE' || row.room_type === 'PRIVATE_RATED' || (row.notes && row.notes.includes('[CODE:'));
    const cleanJoinCode = row.join_code || (row.notes && row.notes.match(/\[CODE:([A-Za-z0-9_-]+)\]/)?.[1]) || `XP-${row.id.substring(0, 4).toUpperCase()}`;

    const members: RoomMember[] = Array.isArray(row.room_members)
      ? row.room_members.map((rm: any) => {
          const prof = rm.profiles || {};
          return {
            id: rm.user_id || rm.id,
            user_id: rm.user_id || rm.id,
            role: rm.role || 'PLAYER',
            status: rm.status || 'REGISTERED',
            is_host: rm.role === 'HOST' || rm.user_id === row.host_id,
            display_name: prof.display_name || 'VĐV',
            name: prof.display_name || 'VĐV',
            elo_rating: prof.elo_rating ?? 1200,
            tier_name: prof.tier_name ?? 'Phong trào',
            avatar_url: prof.avatar_url ?? null,
          };
        })
      : [];

    // Ensure host is present in members list
    if (!members.some((m) => m.is_host)) {
      const hostProf = row.profiles || {};
      members.unshift({
        id: row.host_id,
        user_id: row.host_id,
        role: 'HOST',
        status: 'REGISTERED',
        is_host: true,
        display_name: hostProf.display_name || (row.host_id === user.id ? user.name : 'Hoang'),
        name: hostProf.display_name || (row.host_id === user.id ? user.name : 'Hoang'),
        elo_rating: hostProf.elo_rating ?? 700,
        tier_name: hostProf.tier_name ?? 'Phong trào Trung bình',
        avatar_url: hostProf.avatar_url ?? null,
      });
    }

    const myMember = members.find((m) => m.user_id === user.id);
    const isHost = row.host_id === user.id || (myMember && myMember.is_host);
    const reserved = members.filter((m) => m.status === 'REGISTERED').length;

    return {
      id: row.id,
      courtId: row.court_id || DEFAULT_COURTS[0].id,
      courtName: row.courts?.name || 'Sân Cầu Lông An Bình',
      address: row.courts?.address || '240A Dương Đình Hội, P. Tăng Nhơn Phú B, TP. Thủ Đức',
      title: row.title || (isPrivate ? 'Trận Đơn 1vs1 Tính Elo' : 'Kèo Giao Lưu Cầu Lông'),
      startsAt,
      endsAt,
      cancelBy,
      capacity: Number(row.max_slots || row.capacity || 2),
      reserved,
      minElo: Number(row.min_elo ?? 0),
      maxElo: Number(row.max_elo ?? 3000),
      fee: Number(row.fee_per_person || row.fee || 0),
      revision: Number(row.schedule_revision || row.room_version || 1),
      visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      status: effectiveStatus,
      hostPlays: Boolean(row.host_plays ?? true),
      isHost: Boolean(isHost),
      hostName: members.find((m) => m.is_host)?.display_name || 'Hoang',
      myStatus: myMember ? myMember.status : null,
      cancellationReason: row.cancellation_reason || null,
      notes: row.notes || '',
      courtLabel: row.court_label || '',
      bookingStatus: 'CONFIRMED',
      viewerId: user.id,
      roomCode: `#${cleanJoinCode}`,
      roomType: isPrivate ? 'PRIVATE_RATED' : 'PUBLIC_RECRUIT',
      joinCode: isPrivate ? cleanJoinCode : null,
      isRated: isPrivate ? true : Boolean(row.is_rated),
      zaloGroupLink: row.zalo_group_link || null,
      members,
      canRegister: !myMember && effectiveStatus === 'OPEN' && reserved < (row.max_slots || 2),
      canEdit: Boolean(isHost),
      statusLabel: effectiveStatus === 'OPEN' ? 'Đang tuyển' : effectiveStatus === 'IN_PROGRESS' ? 'Đang diễn ra' : 'Đã kết thúc',
      targetGender: (row.target_gender as 'all' | 'male' | 'female') || (row.targetGender as 'all' | 'male' | 'female') || 'all',
    };
  }

  async list(scope: string, _offset = 0): Promise<ManagedRoomData[]> {
    this.loadFromStorage();
    const user = await this.getCurrentUser();

    // 1. Prototype Priority: Return rich mock and locally managed rooms immediately
    const localResults: ManagedRoomData[] = this.localRooms
      .map((r): ManagedRoomData => {
        const isEndedByTime = r.endsAt.getTime() < Date.now();
        const effectiveStatus = isEndedByTime && r.status === 'OPEN' ? 'COMPLETED' : r.status;
        const myMember = r.members.find((m) => m.user_id === user.id);
        const isHost = r.hostName === user.name || (myMember && myMember.is_host);
        return {
          ...r,
          status: effectiveStatus,
          statusLabel:
            effectiveStatus === 'OPEN'
              ? 'Đang tuyển'
              : effectiveStatus === 'IN_PROGRESS'
              ? 'Đang diễn ra'
              : 'Đã kết thúc',
          isHost: Boolean(isHost),
          viewerId: user.id,
          myStatus: myMember ? myMember.status : null,
          canRegister: !myMember && effectiveStatus === 'OPEN' && r.reserved < r.capacity,
          canEdit: Boolean(isHost),
        };
      })
      .filter((r) => {
        if (scope === 'discover') {
          return (
            r.roomType !== 'PRIVATE_RATED' &&
            r.visibility !== 'PRIVATE' &&
            r.status === 'OPEN' &&
            r.endsAt.getTime() > Date.now()
          );
        }
        if (scope === 'mine') {
          return (
            (r.isHost || r.myStatus === 'REGISTERED') &&
            r.status !== 'CANCELLED' &&
            r.status !== 'COMPLETED' &&
            r.endsAt.getTime() > Date.now()
          );
        }
        if (scope === 'history') {
          return r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.endsAt.getTime() <= Date.now();
        }
        return true;
      });

    // Prototype safety: Ensure 'mine' and 'history' always have rich mock demonstrations
    if (scope === 'mine' && localResults.length === 0) {
      const live = this.localRooms.find((r) => r.id === 'room-live-102');
      if (live) localResults.push({ ...live, viewerId: user.id, isHost: false, myStatus: 'REGISTERED' });
    } else if (scope === 'history' && localResults.length === 0) {
      const comp = this.localRooms.find((r) => r.id === 'room-completed-103');
      if (comp) localResults.push({ ...comp, viewerId: user.id });
    }

    if (localResults.length > 0) {
      return localResults;
    }

    // 2. Fallback to Supabase REST query if local is empty
    try {
      if (supabase) {
        let query = supabase
          .from('match_rooms')
          .select('*, courts(name, address), room_members(*, profiles(id, display_name, elo_rating, tier_name, avatar_url))')
          .order('created_at', { ascending: false });

        if (scope === 'discover') {
          query = query.eq('visibility', 'PUBLIC').neq('status', 'CANCELLED').neq('status', 'COMPLETED');
        } else if (scope === 'history') {
          query = query.in('status', ['COMPLETED', 'CANCELLED']);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data
            .map((row) => this.mapDbRowToRoom(row, user))
            .filter((r) => {
              if (scope === 'discover') {
                return (
                  r.roomType !== 'PRIVATE_RATED' &&
                  r.visibility !== 'PRIVATE' &&
                  r.status === 'OPEN' &&
                  r.endsAt.getTime() > Date.now()
                );
              }
              if (scope === 'mine') {
                return (
                  (r.isHost || r.myStatus === 'REGISTERED') &&
                  r.status !== 'CANCELLED' &&
                  r.status !== 'COMPLETED' &&
                  r.endsAt.getTime() > Date.now()
                );
              }
              if (scope === 'history') {
                return r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.endsAt.getTime() <= Date.now();
              }
              return true;
            });
        }
      }
    } catch {
      // fallback
    }

    return localResults;
  }

  private createDynamicMockRoom(
    id: string,
    user: { id: string; name: string; elo?: number; tier?: string; avatar?: string | null }
  ): ManagedRoomData {
    const isSquare = user.name === 'Square' || user.id === '9ded99f9-af7d-4297-829a-18e213294403';
    const hostUser = isSquare
      ? { id: 'b86ef8fb-4486-4a71-a5a9-d6430f48857d', name: 'Đặng Cao Bồ', elo: 750, tier: 'Phong trào Khá' }
      : { id: user.id, name: user.name, elo: user.elo || 850, tier: user.tier || 'Nhập môn' };
    const memberUser = isSquare
      ? { id: user.id, name: user.name, elo: user.elo || 850, tier: user.tier || 'Nhập môn' }
      : { id: '9ded99f9-af7d-4297-829a-18e213294403', name: 'Square', elo: 850, tier: 'Nhập môn' };

    const cleanCode = `XP-${id.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || '02B2'}`;
    const now = Date.now();

    return {
      id,
      courtId: DEFAULT_COURTS[0].id,
      courtName: 'Sân Cầu Lông An Bình',
      address: '240A Dương Đình Hội, P. Tăng Nhơn Phú B, TP. Thủ Đức',
      title: 'Kèo Giao Lưu & Cọ Xát Điểm Elo (Sân An Bình)',
      startsAt: new Date(now - 30 * 60 * 1000),
      endsAt: new Date(now + 90 * 60 * 1000),
      cancelBy: new Date(now - 60 * 60 * 1000),
      capacity: 2,
      reserved: 2,
      minElo: 0,
      maxElo: 2000,
      fee: 40000,
      revision: 1,
      visibility: 'PUBLIC',
      status: 'IN_PROGRESS',
      statusLabel: 'Đang diễn ra',
      hostPlays: true,
      isHost: user.name === hostUser.name,
      hostName: hostUser.name,
      myStatus: 'REGISTERED',
      cancellationReason: null,
      notes: `Trận 1V1 Tính Điểm Elo [CODE:${cleanCode}]`,
      courtLabel: 'Sân số 2',
      bookingStatus: 'CONFIRMED',
      viewerId: user.id,
      roomCode: `#${cleanCode}`,
      roomType: 'PUBLIC_RECRUIT',
      joinCode: cleanCode,
      isRated: true,
      zaloGroupLink: null,
      canRegister: false,
      canEdit: true,
      targetGender: 'all',
      members: [
        {
          id: hostUser.id,
          user_id: hostUser.id,
          role: 'HOST',
          status: 'REGISTERED',
          is_host: true,
          display_name: hostUser.name,
          name: hostUser.name,
          elo_rating: hostUser.elo,
          tier_name: hostUser.tier,
          avatar_url: null,
        },
        {
          id: memberUser.id,
          user_id: memberUser.id,
          role: 'PLAYER',
          status: 'REGISTERED',
          is_host: false,
          display_name: memberUser.name,
          name: memberUser.name,
          elo_rating: memberUser.elo,
          tier_name: memberUser.tier,
          avatar_url: null,
        },
      ],
    };
  }

  async get(id: string): Promise<ManagedRoomData | null> {
    this.loadFromStorage();
    const user = await this.getCurrentUser();

    // 1. Try Supabase REST query
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('match_rooms')
          .select('*, courts(name, address), room_members(*, profiles(id, display_name, elo_rating, tier_name, avatar_url))')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return this.mapDbRowToRoom(data, user);
        }
      }
    } catch {
      // fallback
    }

    // 2. Search in local store
    const local = this.localRooms.find((r) => r.id === id);
    if (local) {
      const myMember = local.members.find((m) => m.user_id === user.id);
      const isHost = local.hostName === user.name || (myMember && myMember.is_host);

      return {
        ...local,
        isHost: Boolean(isHost),
        viewerId: user.id,
        myStatus: myMember ? myMember.status : null,
        canRegister: !myMember && local.status === 'OPEN' && local.reserved < local.capacity,
        canEdit: Boolean(isHost),
      };
    }

    // 3. Fallback mock room generator: never 404 in prototype
    const synthesized = this.createDynamicMockRoom(id, user);
    this.localRooms.push(synthesized);
    this.saveToStorage();
    return synthesized;
  }

  async lookupCode(code: string): Promise<ManagedRoomData | null> {
    this.loadFromStorage();
    const user = await this.getCurrentUser();

    // Clean all whitespace, dashes, hashes
    const clean = code.trim().toUpperCase().replace(/^#/, '').replace(/\s+/g, '');
    if (!clean) return null;

    // 1. Search in local storage first
    const matched = this.localRooms.find((r) => {
      const roomClean = (r.roomCode || '').replace(/^#/, '').replace(/\s+/g, '').toUpperCase();
      const joinClean = (r.joinCode || '').replace(/^#/, '').replace(/\s+/g, '').toUpperCase();
      const notesClean = (r.notes || '').replace(/\s+/g, '').toUpperCase();
      const idClean = (r.id || '').replace(/-/g, '').toUpperCase();

      return (
        joinClean.includes(clean) ||
        roomClean.includes(clean) ||
        notesClean.includes(clean) ||
        idClean.includes(clean) ||
        r.id === clean
      );
    });

    if (matched) {
      return this.get(matched.id);
    }

    // 2. Search in Supabase match_rooms table
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('match_rooms')
          .select('*, courts(name, address), room_members(*, profiles(id, display_name, elo_rating, tier_name, avatar_url))')
          .or(`join_code.ilike.%${clean}%,notes.ilike.%${clean}%`)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return this.mapDbRowToRoom(data, user);
        }

        // Also check if clean is a UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
          return await this.get(clean);
        }
      }
    } catch {
      // fallback
    }

    return null;
  }

  async execute(command: RoomCommand): Promise<string> {
    this.loadFromStorage();
    const user = await this.getCurrentUser();
    const payload = command.payload || {};

    // 1. CREATE ACTION
    if (command.action === 'create') {
      const roomId = command.roomId || crypto.randomUUID();
      const isPrivate = payload.visibility === 'PRIVATE' || payload.room_type === 'PRIVATE_RATED';
      const cleanJoinCode = payload.join_code
        ? String(payload.join_code).toUpperCase().trim().replace(/\s+/g, '')
        : `XP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const courtId = (payload.court_id as string) || DEFAULT_COURTS[0].id;
      const startsAt = payload.starts_at ? new Date(payload.starts_at as string) : new Date();
      const endsAt = payload.ends_at ? new Date(payload.ends_at as string) : new Date(startsAt.getTime() + 2 * 3600 * 1000);
      const cancelBy = payload.cancel_by ? new Date(payload.cancel_by as string) : startsAt;

      const title = (payload.title as string) || (isPrivate ? 'Trận Đơn 1vs1 Tính Elo - Sân Cầu Lông An Bình' : 'Kèo Giao Lưu Cầu Lông');
      const notes = (payload.notes as string) || (isPrivate ? `Trận 1V1 Tính Điểm Elo [CODE:${cleanJoinCode}]` : '');

      // Try inserting into Supabase match_rooms directly
      try {
        if (supabase) {
          await supabase.from('match_rooms').insert({
            id: roomId,
            court_id: courtId,
            host_id: user.id,
            title,
            play_time: startsAt.toISOString(),
            end_time: endsAt.toISOString(),
            cancellation_deadline: cancelBy.toISOString(),
            max_slots: Number(payload.capacity ?? (isPrivate ? 2 : 4)),
            min_elo: Number(payload.min_elo ?? 0),
            max_elo: Number(payload.max_elo ?? 3000),
            fee_per_person: Number(payload.fee ?? 0),
            status: 'OPEN',
            visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
            room_type: isPrivate ? 'PRIVATE_RATED' : 'PUBLIC_RECRUIT',
            join_code: cleanJoinCode,
            is_rated: isPrivate ? true : Boolean(payload.is_rated),
            notes,
            court_label: (payload.court_label as string) || '',
            target_gender: (payload.target_gender as string) || (payload.targetGender as string) || 'all',
          });

          // Insert host into room_members
          await supabase.from('room_members').insert({
            room_id: roomId,
            user_id: user.id,
            role: 'HOST',
            status: 'REGISTERED',
            is_playing: true,
            confirmed_revision: 1,
          });
        }
      } catch {
        // non-blocking fallback to local
      }

      // Save to local store
      const newRoom: ManagedRoomData = {
        id: roomId,
        courtId,
        courtName: 'Sân Cầu Lông An Bình',
        address: '240A Dương Đình Hội, P. Tăng Nhơn Phú B, TP. Thủ Đức',
        title,
        startsAt,
        endsAt,
        cancelBy,
        capacity: Number(payload.capacity ?? (isPrivate ? 2 : 4)),
        reserved: 1,
        minElo: Number(payload.min_elo ?? 0),
        maxElo: Number(payload.max_elo ?? 3000),
        fee: Number(payload.fee ?? 0),
        revision: 1,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        status: 'OPEN',
        hostPlays: true,
        isHost: true,
        hostName: user.name,
        myStatus: 'REGISTERED',
        cancellationReason: null,
        notes,
        courtLabel: (payload.court_label as string) || '',
        bookingStatus: 'CONFIRMED',
        viewerId: user.id,
        roomCode: `#${cleanJoinCode}`,
        roomType: isPrivate ? 'PRIVATE_RATED' : 'PUBLIC_RECRUIT',
        joinCode: isPrivate ? cleanJoinCode : null,
        isRated: isPrivate ? true : Boolean(payload.is_rated),
        zaloGroupLink: (payload.zalo_group_link as string) || null,
        targetGender: (payload.target_gender as 'all' | 'male' | 'female') || (payload.targetGender as 'all' | 'male' | 'female') || 'all',
        members: [
          {
            id: user.id,
            user_id: user.id,
            role: 'HOST',
            status: 'REGISTERED',
            is_host: true,
            display_name: user.name,
            name: user.name,
            elo_rating: user.elo,
            tier_name: user.tier,
            avatar_url: user.avatar,
          },
        ],
        canRegister: false,
        canEdit: true,
        statusLabel: 'Sẵn sàng',
      };

      this.localRooms.unshift(newRoom);
      this.saveToStorage();
      return roomId;
    }

    const targetRoomId = command.roomId;
    if (!targetRoomId) throw new Error('ROOM_UNAVAILABLE');

    // 2. JOIN ACTION
    if (command.action === 'join' || command.action === 'register') {
      try {
        if (supabase) {
          await supabase.from('room_members').insert({
            room_id: targetRoomId,
            user_id: user.id,
            role: 'PLAYER',
            status: 'REGISTERED',
            is_playing: true,
            confirmed_revision: 1,
          });
        }
      } catch {
        // fallback
      }

      const room = this.localRooms.find((r) => r.id === targetRoomId);
      if (room) {
        if (!room.members.some((m) => m.user_id === user.id)) {
          room.members.push({
            id: user.id,
            user_id: user.id,
            role: 'PLAYER',
            status: 'REGISTERED',
            is_host: false,
            display_name: user.name,
            name: user.name,
            elo_rating: user.elo,
            tier_name: user.tier,
            avatar_url: user.avatar,
          });
          room.reserved = room.members.filter((m) => m.status === 'REGISTERED').length;
          this.saveToStorage();
        }
      }
      return targetRoomId;
    }

    // 3. START ACTION
    if (command.action === 'start') {
      try {
        if (supabase) {
          await supabase.from('match_rooms').update({ status: 'IN_PROGRESS' }).eq('id', targetRoomId);
        }
      } catch {
        // fallback
      }

      const room = this.localRooms.find((r) => r.id === targetRoomId);
      if (room) {
        room.status = 'IN_PROGRESS';
        room.statusLabel = 'Đang diễn ra';
        this.saveToStorage();
      }
      return targetRoomId;
    }

    // 4. FINISH ACTION
    if (command.action === 'finish') {
      try {
        if (supabase) {
          await supabase.from('match_rooms').update({ status: 'COMPLETED' }).eq('id', targetRoomId);
        }
      } catch {
        // fallback
      }

      const room = this.localRooms.find((r) => r.id === targetRoomId);
      if (room) {
        room.status = 'COMPLETED';
        room.statusLabel = 'Đã kết thúc';
        this.saveToStorage();
      }
      return targetRoomId;
    }

    // 5. CANCEL ACTION
    if (command.action === 'cancel') {
      try {
        if (supabase) {
          await supabase.from('match_rooms').update({
            status: 'CANCELLED',
            cancellation_reason: (payload.reason as string) || 'Host hủy phòng',
          }).eq('id', targetRoomId);
        }
      } catch {
        // fallback
      }

      const room = this.localRooms.find((r) => r.id === targetRoomId);
      if (room) {
        room.status = 'CANCELLED';
        room.statusLabel = 'Đã hủy';
        room.cancellationReason = (payload.reason as string) || 'Host hủy phòng';
        this.saveToStorage();
      }
      return targetRoomId;
    }

    return targetRoomId;
  }

  async courts(): Promise<Court[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('courts').select('id, name, distance_km').order('name');
        if (!error && data && data.length > 0) {
          return data as Court[];
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_COURTS;
  }

  async notices(): Promise<RoomNotice[]> {
    return [];
  }

  async enrichMembersWithProfiles(_members: RoomMember[]): Promise<void> {
    // Handled in mapping
  }

  async readNotices(_through: number): Promise<void> {
    // no-op
  }
}

export const managedRoomRepository = new ManagedRoomRepository();
