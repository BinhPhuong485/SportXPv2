import { supabase } from '../core/config/supabase';
import { MatchDraft, MatchSummary, ActivityView, matchToActivityView } from '../features/feed/domain/activity';

export interface SupabaseMatchResultRow {
  id: string;
  court_name: string;
  team_a_names: string;
  team_b_names: string;
  score_text: string;
  winner_team: string;
  elo_change: number | null;
  created_at: string;
}

export const supabaseMatchRepository = {
  async fetchMatches(): Promise<MatchSummary[]> {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await supabase
      .from('match_results')
      .select('id, court_name, team_a_names, team_b_names, score_text, winner_team, elo_change, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return (data || []).map((row: SupabaseMatchResultRow) => ({
      id: row.id,
      courtName: row.court_name,
      teamA: row.team_a_names,
      teamB: row.team_b_names,
      score: row.score_text,
      isWin: row.winner_team === 'A',
      eloChange: row.elo_change,
      createdAt: row.created_at,
    }));
  },

  async getMatch(id: string): Promise<MatchSummary | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('match_results')
      .select('id, court_name, team_a_names, team_b_names, score_text, winner_team, elo_change, created_at')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      courtName: data.court_name,
      teamA: data.team_a_names,
      teamB: data.team_b_names,
      score: data.score_text,
      isWin: data.winner_team === 'A',
      eloChange: data.elo_change,
      createdAt: data.created_at,
    };
  },

  async listActivities(): Promise<ActivityView[]> {
    const matches = await this.fetchMatches();
    return matches.map(matchToActivityView);
  },

  async recordMatch(userId: string, draft: MatchDraft): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    const { error } = await supabase.rpc('record_match_and_update_elo', {
      p_user_id: userId,
      p_court_name: draft.courtName,
      p_team_a: draft.teamA,
      p_team_b: draft.teamB,
      p_score: draft.score,
      p_is_win: draft.isWin,
    });

    if (error) {
      throw error;
    }
  },
};
