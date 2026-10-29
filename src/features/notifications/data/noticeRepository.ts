import { supabase } from '../../../core/config/supabase';
import { SportNotice, parseSportNotice } from '../domain/notice';

export const fallbackNotices: SportNotice[] = [
  {
    id: '1',
    title: 'Chào mừng đến với SportXP!',
    content: 'Bắt đầu tìm kiếm đối thủ gần bạn hoặc đăng ký các giải đấu phong trào cuối tuần này.',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    kind: 'WELCOME',
    isRead: false,
  },
  {
    id: '2',
    title: 'Giải đấu mới: SportXP Championship',
    content: 'Giải đấu tại Sân Cầu Lông Kỳ Hòa đang mở đăng ký. Đừng bỏ lỡ cúp vô địch!',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    kind: 'TOURNAMENT',
    isRead: false,
  },
];

export class SupabaseNoticeRepository {
  async listNotices(): Promise<SportNotice[]> {
    if (!supabase) return fallbackNotices;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return fallbackNotices;

      const { data, error } = await supabase.rpc('room_notices_v2');
      if (error || !Array.isArray(data) || data.length === 0) {
        return fallbackNotices;
      }

      return data.map((r: Record<string, unknown>) => parseSportNotice(r));
    } catch {
      return fallbackNotices;
    }
  }

  // NOTE: User instruction: Never call read_room_notices_v2 without approval.
  // Method stub provided for read-only interface compliance.
  async markAsRead(_id: string): Promise<void> {
    // Read-only audit lock active
  }

  async markAllAsRead(): Promise<void> {
    // Read-only audit lock active
  }
}

export const noticeRepository = new SupabaseNoticeRepository();

