import { supabase } from '../../../core/config/supabase';
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

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.localRooms = parsed.map((r: any) => ({
            ...r,
            startsAt: new Date(r.startsAt),
            endsAt: new Date(r.endsAt),
            cancelBy: new Date(r.cancelBy),
          }));
        }
      }
    } catch {
      // fallback
    }
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
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id, display_name, elo_rating, tier_name, avatar_url')
            .eq('id', data.user.id)
            .maybeSingle();

          return {
            id: data.user.id,
            name: prof?.display_name || data.user.user_metadata?.display_name || 'Vận động viên',
            elo: prof?.elo_rating ?? 1200,
            tier: prof?.tier_name ?? 'Phong trào',
            avatar: prof?.avatar_url ?? null,
          };
        }
      }
    } catch {
      // fallback
    }

    return {
      id: 'local-user-guest',
      name: 'Vận động viên',
      elo: 1200,
      tier: 'Phong trào',
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
    };
  }

  async list(scope: string, _offset = 0): Promise<ManagedRoomData[]> {
    this.loadFromStorage();
    const user = await this.getCurrentUser();

    // 1. Try querying Supabase REST directly
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
      // fallback to local store
    }

    // 2. Fallback to local store
    return this.localRooms
      .map((r) => {
        const isEndedByTime = r.endsAt.getTime() < Date.now();
        const effectiveStatus = isEndedByTime && r.status === 'OPEN' ? 'COMPLETED' : r.status;
        const myMember = r.members.find((m) => m.user_id === user.id);
        const isHost = r.hostName === user.name || (myMember && myMember.is_host);
        return {
          ...r,
          status: effectiveStatus,
          statusLabel: effectiveStatus === 'OPEN' ? 'Đang tuyển' : effectiveStatus === 'IN_PROGRESS' ? 'Đang diễn ra' : 'Đã kết thúc',
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

    // 2. Fallback to local store
    const local = this.localRooms.find((r) => r.id === id);
    if (!local) return null;

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

  async lookupCode(code: string): Promise<ManagedRoomData | null> {
    this.loadFromStorage();
    const user = await this.getCurrentUser();

    // Clean all whitespace, dashes, hashes
    const clean = code.trim().toUpperCase().replace(/^#/, '').replace(/\s+/g, '');
    if (!clean) return null;

    // 1. Search in Supabase match_rooms table
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

    // 2. Search in local storage
    const matched = this.localRooms.find((r) => {
      const roomClean = (r.roomCode || '').replace(/^#/, '').replace(/\s+/g, '').toUpperCase();
      const joinClean = (r.joinCode || '').replace(/^#/, '').replace(/\s+/g, '').toUpperCase();
      const notesClean = (r.notes || '').replace(/\s+/g, '').toUpperCase();

      return joinClean === clean || roomClean === clean || notesClean.includes(clean);
    });

    if (matched) {
      return this.get(matched.id);
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
