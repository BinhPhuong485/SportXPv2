import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Lock,
  Eye,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { ActivityAudience, ActivityView, matchToActivityView } from './domain/activity';
import { supabaseMatchRepository } from '../../services/supabaseMatchRepository';
import { ActivityCard } from './ActivityCard';
import { PageContent } from '../../shared/components/PageContent';

const QUICK_TAGS = [
  '🔥 Smash cháy sân',
  '⚡ Thắng kịch tính',
  '🤝 Đồng đội ăn ý',
  '🏸 Set 3 cân não',
  '💪 Thể lực sung mãn',
  '🎯 Điều cầu chuẩn xác',
];

export const ActivityEditorPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<ActivityView | null>(null);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<ActivityAudience>('friends');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPost = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    try {
      const match = await supabaseMatchRepository.getMatch(activityId);
      if (match) {
        const view = matchToActivityView(match);
        setPost(view);
        setCaption(view.caption);
        setAudience(view.audience);
      }
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const addQuickTag = (tag: string) => {
    const current = caption.trim();
    if (!current) {
      setCaption(tag);
    } else {
      setCaption(`${current} ${tag}`);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!post) return;
    setBusy(true);
    setError(null);
    try {
      // Local preview / publish update
      setPost((prev) =>
        prev
          ? {
              ...prev,
              caption: caption.trim(),
              audience,
              isDraft: !publish,
            }
          : null
      );
      navigate(-1);
    } catch {
      setError('Chưa lưu được bài viết. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const previewPost: ActivityView | null = post
    ? {
        ...post,
        caption: caption.trim() || post.caption,
        audience,
      }
    : null;

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
          <h1 className="text-base font-extrabold text-app-text tracking-tight">
            Chỉnh sửa hoạt động
          </h1>
        </div>

        <button
          onClick={() => setPreview(!preview)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
            preview
              ? 'bg-app-primary text-app-on-primary border-app-primary'
              : 'border-app-border text-app-muted hover:text-app-text bg-app-surface'
          }`}
        >
          <Eye size={14} />
          <span>{preview ? 'Chỉnh sửa' : 'Xem trước'}</span>
        </button>
      </header>

      {/* Main Content */}
      <PageContent>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-app-muted">Đang tải…</span>
          </div>
        ) : !post ? (
          <div className="p-8 text-center text-app-muted text-sm font-medium">
            Không tìm thấy hoạt động này.
          </div>
        ) : preview && previewPost ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-app-mint/30 border border-app-primary/30 rounded-xl text-xs font-semibold text-app-primary flex items-center gap-2">
              <Eye size={15} />
              <span>Chế độ xem trước bài đăng</span>
            </div>
            <ActivityCard post={previewPost} />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Caption Input Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-app-muted">
                <span>CẢM NGHĨ / NHẬT KÝ SET CẦU</span>
                <span className="font-mono">{caption.length}/2000</span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2000}
                placeholder="Chia sẻ cảm xúc của bạn về buổi chơi, những pha smash đẹp hoặc khoảnh khắc kịch tính…"
                rows={4}
                className="w-full p-3.5 rounded-xl bg-app-surface border border-app-border focus:border-app-primary text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Quick Hashtags */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-app-muted uppercase tracking-wider">
                Gợi ý nhanh
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addQuickTag(tag)}
                    className="px-3 py-1.5 rounded-full bg-app-surface border border-app-border text-xs font-semibold text-app-text hover:border-app-primary hover:text-app-primary active:scale-95 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience Scope Selection */}
            <div className="flex flex-col gap-2.5 pt-2">
              <span className="text-xs font-bold text-app-muted uppercase tracking-wider">
                Quyền riêng tư bài viết
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAudience('friends')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                    audience === 'friends'
                      ? 'bg-app-mint/30 border-app-primary text-app-primary'
                      : 'bg-app-surface border-app-border text-app-muted hover:border-app-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Users size={18} />
                    {audience === 'friends' ? (
                      <CheckCircle2 size={16} className="text-app-primary" />
                    ) : (
                      <Circle size={16} className="text-app-muted/40" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-app-text mt-1">Bạn bè</span>
                  <span className="text-[11px] text-app-muted leading-tight">
                    Chỉ bạn bè trên SportXP được xem
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudience('onlyMe')}
                  className={`p-3.5 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                    audience === 'onlyMe'
                      ? 'bg-app-mint/30 border-app-primary text-app-primary'
                      : 'bg-app-surface border-app-border text-app-muted hover:border-app-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Lock size={18} />
                    {audience === 'onlyMe' ? (
                      <CheckCircle2 size={16} className="text-app-primary" />
                    ) : (
                      <Circle size={16} className="text-app-muted/40" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-app-text mt-1">Chỉ mình tôi</span>
                  <span className="text-[11px] text-app-muted leading-tight">
                    Lưu làm nhật ký cá nhân riêng tư
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSave(false)}
                className="flex-1 h-12 rounded-xl border border-app-border bg-app-surface hover:border-app-muted text-xs font-bold text-app-text uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                LƯU BẢN NHÁP
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSave(true)}
                className="flex-1 h-12 rounded-xl bg-app-primary text-app-on-primary text-xs font-extrabold uppercase tracking-wider hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 shadow-xs"
              >
                CÔNG BỐ BÀI VIẾT
              </button>
            </div>
          </div>
        )}
      </PageContent>
    </div>
  );
};
