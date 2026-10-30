import { supabase } from '../../../core/config/supabase';
import { ManagedRoomData, parseManagedRoom } from '../domain/managedRoom';

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

export interface MatchItem {
  id: string;
  author_id?: string;
  team_a: string[];
  team_b: string[];
  score: string;
  winner: 'A' | 'B';
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'VOIDED';
  version: number;
  reason?: string;
}

export interface AttendanceRecord {
  outcome: 'PRESENT' | 'ABSENT';
  status: 'RECORDED' | 'DISPUTED' | 'RESOLVED';
  reason?: string;
  version: number;
}

export interface SessionData {
  matches: MatchItem[];
  attendance: Record<string, AttendanceRecord>;
  booking_status?: string;
  audit: Array<{ action: string; actor_id: string; at: string }>;
}

// In-memory fallback session store matching Flutter's MockRoomRepository._sessions
const sessionMemoryStore: Record<string, SessionData> = {};

function getOrCreateSession(roomId: string): SessionData {
  if (!sessionMemoryStore[roomId]) {
    sessionMemoryStore[roomId] = {
      matches: [],
      attendance: {},
      booking_status: 'CONFIRMED',
      audit: [],
    };
  }
  return sessionMemoryStore[roomId];
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

  async get(id: string): Promise<ManagedRoomData | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('get_room_v2', {
      p_room_id: id,
    });
    if (error) throw error;
    if (!data) return null;
    return parseManagedRoom(data as Record<string, unknown>);
  }

  async execute(command: RoomCommand): Promise<string> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase.');

    // Attempt live Supabase RPC first
    try {
      const { data, error } = await supabase.rpc('room_command_v2', {
        p_request_id: command.requestId,
        p_action: command.action,
        p_room_id: command.roomId,
        p_payload: command.payload || {},
      });
      if (error) throw error;
      return String(data || '');
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || String(err);

      // Narrow fallback for session actions if backend lacks Phase 2B SQL (returns INVALID_ACTION)
      const sessionActions = [
        'match_create',
        'match_edit',
        'match_confirm',
        'match_dispute',
        'match_void',
        'attendance_mark',
        'attendance_dispute',
        'attendance_resolve',
      ];

      if (sessionActions.includes(command.action) && (errMsg.includes('INVALID_ACTION') || errMsg.includes('PGRST202') || errMsg.includes('42883'))) {
        return this.executeSessionFallback(command);
      }

      throw err;
    }
  }

  private executeSessionFallback(command: RoomCommand): string {
    const roomId = command.roomId || 'default';
    const s = getOrCreateSession(roomId);
    const p = command.payload || {};

    const actorId = 'actor';

    if (command.action === 'match_create') {
      const matchId = `match-${Date.now()}`;
      s.matches.push({
        id: matchId,
        author_id: actorId,
        team_a: (p.team_a as string[]) || [],
        team_b: (p.team_b as string[]) || [],
        score: String(p.score || '21-19'),
        winner: (p.winner as 'A' | 'B') || 'A',
        status: 'PENDING',
        version: 1,
      });
      s.audit.push({
        action: 'match_create',
        actor_id: actorId,
        at: new Date().toISOString(),
      });
      return matchId;
    }

    if (command.action === 'match_edit') {
      const m = s.matches.find((x) => x.id === p.match_id);
      if (m) {
        m.team_a = (p.team_a as string[]) || m.team_a;
        m.team_b = (p.team_b as string[]) || m.team_b;
        m.score = String(p.score || m.score);
        m.winner = (p.winner as 'A' | 'B') || m.winner;
        m.status = 'PENDING';
        m.version += 1;
        s.audit.push({
          action: 'match_edit',
          actor_id: actorId,
          at: new Date().toISOString(),
        });
      }
      return 'ok';
    }

    if (command.action === 'match_confirm') {
      const m = s.matches.find((x) => x.id === p.match_id);
      if (m) {
        m.status = 'CONFIRMED';
        m.version += 1;
        s.audit.push({
          action: 'match_confirm',
          actor_id: actorId,
          at: new Date().toISOString(),
        });
      }
      return 'ok';
    }

    if (command.action === 'match_dispute' || command.action === 'match_void') {
      const m = s.matches.find((x) => x.id === p.match_id);
      if (m) {
        m.status = command.action === 'match_void' ? 'VOIDED' : 'DISPUTED';
        m.reason = String(p.reason || '');
        m.version += 1;
        s.audit.push({
          action: command.action,
          actor_id: actorId,
          at: new Date().toISOString(),
        });
      }
      return 'ok';
    }

    if (command.action === 'attendance_mark') {
      const playerId = String(p.player_id);
      const oldRec = s.attendance[playerId];
      s.attendance[playerId] = {
        outcome: (p.outcome as 'PRESENT' | 'ABSENT') || 'PRESENT',
        status: 'RECORDED',
        reason: String(p.reason || ''),
        version: (oldRec?.version || 0) + 1,
      };
      s.audit.push({
        action: 'attendance_mark',
        actor_id: actorId,
        at: new Date().toISOString(),
      });
      return 'ok';
    }

    if (command.action === 'attendance_dispute') {
      const playerId = String(p.player_id);
      const oldRec = s.attendance[playerId];
      if (oldRec) {
        oldRec.status = 'DISPUTED';
        oldRec.reason = String(p.reason || '');
        oldRec.version += 1;
        s.audit.push({
          action: 'attendance_dispute',
          actor_id: actorId,
          at: new Date().toISOString(),
        });
      }
      return 'ok';
    }

    if (command.action === 'attendance_resolve') {
      const playerId = String(p.player_id);
      const oldRec = s.attendance[playerId];
      if (oldRec) {
        oldRec.status = 'RESOLVED';
        oldRec.outcome = (p.outcome as 'PRESENT' | 'ABSENT') || 'PRESENT';
        oldRec.version += 1;
        s.audit.push({
          action: 'attendance_resolve',
          actor_id: actorId,
          at: new Date().toISOString(),
        });
      }
      return 'ok';
    }

    return 'ok';
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

  async session(roomId: string): Promise<SessionData> {
    return getOrCreateSession(roomId);
  }
}

export const managedRoomRepository = new ManagedRoomRepository();
