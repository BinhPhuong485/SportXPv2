import { supabase } from '../../../core/config/supabase';
import { ManagedRoomData, RoomMember, parseManagedRoom } from '../domain/managedRoom';

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

  if (err.code === 'PGRST202' || err.code === '42883') {
    return 'Backend chưa có Phase 2A. Cần áp dụng migration rooms trước khi bật tính năng.';
  }

  return 'Chưa xác nhận được kết quả. Tải lại để kiểm tra; gửi lại cùng yêu cầu sẽ không tạo trùng.';
}

export class ManagedRoomRepository {
  async list(scope: string, offset = 0): Promise<ManagedRoomData[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('list_rooms_v2', {
      p_scope: scope,
      p_offset: offset,
    });
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return data.map((row) => parseManagedRoom(row as Record<string, unknown>));
  }

  async enrichMembersWithProfiles(members: RoomMember[]): Promise<void> {
    if (!supabase || members.length === 0) return;
    try {
      const publicIds = members
        .map((m) => m.public_id)
        .filter((id): id is string => Boolean(id));
      const userIds = members
        .map((m) => m.user_id || m.id)
        .filter((id): id is string => Boolean(id));

      const profileMap = new Map<
        string,
        {
          id: string;
          public_id?: string | null;
          display_name?: string | null;
          elo_rating?: number | null;
          tier_name?: string | null;
          avatar_url?: string | null;
        }
      >();

      if (publicIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, public_id, display_name, elo_rating, tier_name, avatar_url')
          .in('public_id', publicIds);
        if (profs) {
          for (const p of profs) {
            if (p.public_id) profileMap.set(p.public_id, p);
            if (p.id) profileMap.set(p.id, p);
          }
        }
      }

      const missingUserIds = userIds.filter((id) => !profileMap.has(id));
      if (missingUserIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, public_id, display_name, elo_rating, tier_name, avatar_url')
          .in('id', missingUserIds);
        if (profs) {
          for (const p of profs) {
            if (p.public_id) profileMap.set(p.public_id, p);
            if (p.id) profileMap.set(p.id, p);
          }
        }
      }

      for (const m of members) {
        const p =
          (m.public_id ? profileMap.get(m.public_id) : undefined) ||
          (m.user_id ? profileMap.get(m.user_id) : undefined) ||
          (m.id ? profileMap.get(m.id as string) : undefined);

        if (p) {
          if (p.display_name) {
            m.display_name = p.display_name;
            m.name = p.display_name;
          }
          if (p.elo_rating !== undefined && p.elo_rating !== null) {
            m.elo_rating = p.elo_rating;
          }
          if (p.tier_name) {
            m.tier_name = p.tier_name;
          }
          if (p.avatar_url) {
            m.avatar_url = p.avatar_url;
          }
          if (p.id) {
            m.user_id = p.id;
          }
        }
      }
    } catch (err) {
      console.warn('Could not enrich room members with profiles:', err);
    }
  }

  async get(id: string): Promise<ManagedRoomData | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('get_room_v2', {
      p_room_id: id,
    });
    if (error) throw error;
    if (!data) return null;
    const room = parseManagedRoom(data as Record<string, unknown>);
    if (room.members.length > 0) {
      await this.enrichMembersWithProfiles(room.members);
    }
    try {
      const { data: extra } = await supabase
        .from('match_rooms')
        .select('room_type, join_code, is_rated, zalo_group_link')
        .eq('id', id)
        .maybeSingle();
      if (extra) {
        if (extra.room_type) room.roomType = extra.room_type as 'PUBLIC_RECRUIT' | 'PRIVATE_RATED';
        if (extra.join_code) room.joinCode = extra.join_code;
        if (typeof extra.is_rated === 'boolean') room.isRated = extra.is_rated;
        if (extra.zalo_group_link) room.zaloGroupLink = extra.zalo_group_link;
      }
    } catch {
      // non-blocking extra enrichment
    }
    return room;
  }

  async execute(command: RoomCommand): Promise<string> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase.');
    const { data, error } = await supabase.rpc('room_command_v2', {
      p_request_id: command.requestId,
      p_action: command.action,
      p_room_id: command.roomId,
      p_payload: command.payload || {},
    });
    if (error) throw error;
    const targetRoomId = String(data || command.roomId || '');
    if (targetRoomId && command.payload) {
      const updates: Record<string, unknown> = {};
      if ('room_type' in command.payload) updates.room_type = command.payload.room_type;
      if ('join_code' in command.payload) updates.join_code = command.payload.join_code;
      if ('is_rated' in command.payload) updates.is_rated = command.payload.is_rated;
      if ('zalo_group_link' in command.payload) updates.zalo_group_link = command.payload.zalo_group_link;
      if (Object.keys(updates).length > 0) {
        try {
          await supabase.from('match_rooms').update(updates).eq('id', targetRoomId);
        } catch {
          // silent fallback
        }
      }
    }
    return String(data || '');
  }

  async lookupCode(code: string): Promise<ManagedRoomData | null> {
    if (!supabase) return null;
    const clean = code.trim().toUpperCase().replace(/^#/, '');
    if (!clean) return null;

    try {
      const { data } = await supabase
        .from('match_rooms')
        .select('id')
        .or(`join_code.ilike.%${clean}%,notes.ilike.%${clean}%`)
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        return await this.get(data.id);
      }
    } catch {
      // fallback
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
      try {
        return await this.get(clean);
      } catch {
        return null;
      }
    }

    return null;
  }

  async courts(): Promise<Court[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('courts')
      .select('id, name, distance_km')
      .order('name');
    if (error) throw error;
    return (data || []) as Court[];
  }

  async notices(): Promise<RoomNotice[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('room_notices_v2');
    if (error) throw error;
    return (data || []) as RoomNotice[];
  }

  async readNotices(through: number): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('read_room_notices_v2', {
      p_through_id: through,
    });
    if (error) throw error;
  }
}

export const managedRoomRepository = new ManagedRoomRepository();
