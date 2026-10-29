import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, Share2 } from 'lucide-react';
import { ActivityView, matchToActivityView } from './domain/activity';
import { supabaseMatchRepository } from '../../services/supabaseMatchRepository';
import { ActivityCard } from './ActivityCard';
import { ActivityShareSheet } from './widgets/ActivityShareSheet';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';

export const ActivityDetailPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<ActivityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  const loadPost = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    try {
      const match = await supabaseMatchRepository.getMatch(activityId);
      if (match) {
        setPost(matchToActivityView(match));
      } else {
        setPost(null);
      }
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col items-center">
      {/* Top Header */}
      <header className="w-full max-w-content px-4 py-3.5 flex items-center justify-between border-b border-app-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-extrabold text-app-text tracking-tight">Chi tiết hoạt động</h1>
        </div>
        <button
          onClick={loadPost}
          className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors"
          title="Làm mới"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Main Content */}
      <PageContent>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-app-muted">Đang tải hoạt động…</span>
          </div>
        ) : !post ? (
          <BentoCard>
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <AlertCircle size={32} className="text-app-muted" />
              <p className="text-sm font-medium text-app-muted">
                Bài đăng không còn khả dụng hoặc đã đổi quyền xem.
              </p>
              <button
                onClick={loadPost}
                className="mt-2 px-5 py-2.5 rounded-xl bg-app-surface border border-app-border text-xs font-bold text-app-text hover:bg-app-background transition-colors"
              >
                Thử lại
              </button>
            </div>
          </BentoCard>
        ) : (
          <div className="flex flex-col gap-4">
            <ActivityCard
              post={post}
              actions={
                <button
                  type="button"
                  onClick={() => setShowShare(true)}
                  className="px-4 py-2 rounded-xl border border-app-border bg-app-surface hover:border-app-primary text-xs font-bold text-app-text flex items-center gap-2 transition-colors"
                >
                  <Share2 size={15} className="text-app-primary" />
                  <span>Chia sẻ thành tích</span>
                </button>
              }
            />

            {/* Share Sheet */}
            <ActivityShareSheet
              isOpen={showShare}
              onClose={() => setShowShare(false)}
              post={post}
            />
          </div>
        )}
      </PageContent>
    </div>
  );
};
