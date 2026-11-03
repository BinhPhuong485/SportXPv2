import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  AlertCircle,
  Search,
} from 'lucide-react';
import { ActivityView, MatchDraft } from './domain/activity';
import { supabaseMatchRepository } from '../../services/supabaseMatchRepository';
import { ActivityCard } from './ActivityCard';
import { RecordMatchSheet } from './RecordMatchSheet';
import { useAuthStore } from '../../shared/hooks/useAuth';

interface ActivityFeedPageProps {
  onFindRooms?: () => void;
  refreshToken?: number;
}

export const ActivityFeedPage: React.FC<ActivityFeedPageProps> = ({
  onFindRooms,
  refreshToken = 0,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<ActivityView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecordSheet, setShowRecordSheet] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await supabaseMatchRepository.listActivities();
      setPosts(rows);
    } catch {
      setError('Chưa tải được hoạt động mới nhất.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, refreshToken]);

  const handleRecordMatch = async (draft: MatchDraft) => {
    if (!user) return;
    await supabaseMatchRepository.recordMatch(user.id, draft);
    loadPosts();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Action Header */}
      <div className="w-full max-w-content px-4 py-3 flex items-center justify-between border-b border-app-border/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRecordSheet(true)}
            className="h-10 px-4 rounded-xl bg-app-primary text-app-on-primary font-bold text-xs flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>GHI NHẬN SET CẦU</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={loadPosts}
            className="p-2 text-app-muted hover:text-app-text transition-colors rounded-full"
            title="Làm mới"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content List */}
      <div className="w-full max-w-content px-4 py-4 flex flex-col gap-4">
        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && posts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-app-muted text-xs">
            <div className="w-6 h-6 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang tải bảng tin…</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && !error && (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <p className="text-sm font-medium text-app-muted">
              Chưa có trận đấu. Ghi nhận set cầu đầu tiên của bạn.
            </p>
            {onFindRooms && (
              <button
                type="button"
                onClick={onFindRooms}
                className="mt-2 px-4 py-2 rounded-xl bg-app-surface border border-app-border hover:border-app-primary text-xs font-bold text-app-primary transition-all flex items-center gap-1.5"
              >
                <Search size={14} />
                <span>Tìm kèo đấu ngay</span>
              </button>
            )}
          </div>
        )}

        {/* Activity Cards */}
        {posts.map((post) => (
          <ActivityCard
            key={post.id}
            post={post}
            onTapDetail={() => navigate(`/activities/${post.id}`)}
            onEdit={() => navigate(`/activities/${post.id}/edit`)}
          />
        ))}
      </div>

      {/* Record Match Sheet */}
      <RecordMatchSheet
        isOpen={showRecordSheet}
        onClose={() => setShowRecordSheet(false)}
        onSubmit={handleRecordMatch}
      />
    </div>
  );
};
