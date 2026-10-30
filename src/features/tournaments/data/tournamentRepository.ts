import { supabase } from '../../../core/config/supabase';
import { Tournament, parseTournament } from '../domain/tournament';

export const fallbackTournaments: Tournament[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    title: 'SportXP Open Championship 2026',
    venueName: 'Sân Cầu Lông Kỳ Hòa, Quận 10',
    address: 'Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
    format: 'doubles',
    entryFee: 200000,
    prizePool: 5000000,
    maxSlots: 32,
    currentSlots: 18,
    startDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'registering',
    minTier: 'TB',
    maxTier: 'Khá+',
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    title: 'Cúp Tân Binh Phong Trào - Đĩa Bạc',
    venueName: 'Sân Cầu Lông Đào Duy Anh',
    address: 'Đào Duy Anh, Phú Nhuận, TP.HCM',
    format: 'doubles',
    entryFee: 150000,
    prizePool: 3000000,
    maxSlots: 16,
    currentSlots: 12,
    startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'registering',
    minTier: 'Nhập môn',
    maxTier: 'TBY+',
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    title: 'Super Smash Master - Đơn Nam',
    venueName: 'Sân Cầu Lông Kim Cương',
    address: 'Thủ Đức, TP.HCM',
    format: 'singles',
    entryFee: 250000,
    prizePool: 8000000,
    maxSlots: 16,
    currentSlots: 16,
    startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'ongoing',
    minTier: 'Khá-',
    maxTier: 'Cao thủ phong trào',
  },
];

export class TournamentRepository {
  async listTournaments(filter = 'all'): Promise<Tournament[]> {
    if (!supabase) return fallbackTournaments;
    try {
      let query = supabase.from('tournaments').select('*');
      if (filter && filter !== 'all') {
        query = query.eq('status', filter);
      }
      const { data, error } = await query.order('start_date', { ascending: true });
      if (error) {
        console.warn('Error loading tournaments, using fallback:', error.message);
        return fallbackTournaments;
      }
      if (!data || data.length === 0) {
        return [];
      }
      return (data as Array<Record<string, unknown>>).map((r) => parseTournament(r));
    } catch (e) {
      console.warn('Failed to query tournaments table:', e);
      return fallbackTournaments;
    }
  }

  async registerTournament(tournamentId: string, partnerId?: string): Promise<void> {
    if (!supabase) throw new Error('Chưa kết nối Supabase.');
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error('Vui lòng đăng nhập để đăng ký giải đấu.');

    const payload: Record<string, unknown> = {
      tournament_id: tournamentId,
      user_id: user.id,
      status: 'registered',
    };
    if (partnerId) {
      payload.partner_id = partnerId;
    }

    const { error } = await supabase.from('tournament_participants').insert(payload);
    if (error) throw error;
  }

  async withdrawTournament(tournamentId: string): Promise<void> {
    if (!supabase) throw new Error('Chưa kết nối Supabase.');
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error('Vui lòng đăng nhập.');

    const { error } = await supabase
      .from('tournament_participants')
      .delete()
      .match({ tournament_id: tournamentId, user_id: user.id });
    if (error) throw error;
  }

  async getMyRegistrations(): Promise<string[]> {
    if (!supabase) return [];
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('tournament_participants')
        .select('tournament_id')
        .eq('user_id', user.id);
      if (error) return [];
      return ((data || []) as Array<{ tournament_id: string }>).map((row) => String(row.tournament_id));
    } catch {
      return [];
    }
  }
}

export const tournamentRepository = new TournamentRepository();
