import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Heart,
  MessageCircle,
  Star,
  MapPin,
  Trophy,
  Share2,
  AlertCircle,
  Send,
  X,
  Image as ImageIcon,
  MoreHorizontal,
  Bookmark,
  CheckCircle2,
  Video,
  UserPlus,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { postService, PostItem, PostCommentItem } from '../../services/postService';
import { managedRoomRepository } from '../rooms/data/managedRoomRepository';
import { ManagedRoomData } from '../rooms/domain/managedRoom';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import { UpcomingRoomsStrip } from '../calendar/presentation/widgets/UpcomingRoomsStrip';
import { leaderboardRepository } from '../rankings/data/leaderboardRepository';
import { Court, PlayerProfile } from '../../core/types/database.types';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { Avatar } from '../../shared/components/Avatar';

type FeedTab = 'all' | 'court_review' | 'match_recap' | 'general';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [, setCourts] = useState<Court[]>([]);
  const [, setTopPlayers] = useState<PlayerProfile[]>([]);
  const [, setMyRooms] = useState<ManagedRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());

  // Create post modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postTypeChoice, setPostTypeChoice] = useState<'court_review' | 'match_recap' | 'general'>('court_review');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [ratingChoice, setRatingChoice] = useState<number>(5);
  const [contentInput, setContentInput] = useState<string>('');
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Dedicated slide-up comment drawer sheet
  const [commentDrawerPost, setCommentDrawerPost] = useState<PostItem | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, PostCommentItem[]>>({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postList, events, courtList, leaderboard] = await Promise.all([
        postService.listPosts(user?.id || null),
        calendarRepository.loadUserCalendarEvents(),
        leaderboardRepository.getCourts(),
        leaderboardRepository.getLeaderboard({ scope: 'national', limit: 5 }),
      ]);
      setPosts(postList);
      setUpcomingEvents(events);
      setCourts(courtList);
      setTopPlayers(leaderboard);
      if (courtList.length > 0) {
        setSelectedCourtId((prev) => prev || courtList[0].id);
      }
    } catch {
      setError('Chưa tải được bảng tin thể thao mới nhất.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const loadMyRoomsForRecap = async () => {
    try {
      const rooms = await managedRoomRepository.list('mine');
      setMyRooms(rooms);
      if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0].id);
      }
    } catch {
      // non-blocking
    }
  };

  const handleOpenCreateModal = (presetType: 'court_review' | 'match_recap' | 'general' = 'court_review') => {
    setPostTypeChoice(presetType);
    setContentInput('');
    setFormError(null);
    setRatingChoice(5);
    setMediaUrlInput('');
    loadMyRoomsForRecap();
    setIsCreateModalOpen(true);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!contentInput.trim()) {
      setFormError('Vui lòng nhập nội dung bài viết.');
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const mediaUrls = mediaUrlInput.trim() ? [mediaUrlInput.trim()] : [];

      await postService.createPost({
        authorId: user.id,
        postType: postTypeChoice,
        content: contentInput.trim(),
        mediaUrls,
        courtId: postTypeChoice === 'court_review' ? selectedCourtId : null,
        rating: postTypeChoice === 'court_review' ? ratingChoice : null,
        roomId: postTypeChoice === 'match_recap' ? selectedRoomId : null,
      });

      setIsCreateModalOpen(false);
      setContentInput('');
      showToast('Đã đăng bài viết lên bảng tin!');
      await loadFeed();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi đăng bài.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleLike = async (post: PostItem) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id) {
            const nextLiked = !p.isLiked;
            return {
              ...p,
              isLiked: nextLiked,
              likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
            };
          }
          return p;
        })
      );
      await postService.toggleLike(post.id, user.id);
    } catch {
      loadFeed();
    }
  };

  const handleOpenCommentDrawer = async (post: PostItem) => {
    setCommentDrawerPost(post);
    setNewCommentText('');
    if (!commentsMap[post.id]) {
      setCommentsLoading(true);
      try {
        const list = await postService.listComments(post.id);
        setCommentsMap((prev) => ({ ...prev, [post.id]: list }));
      } catch {
        // non-blocking
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentDrawerPost || !user || !newCommentText.trim()) return;
    const postId = commentDrawerPost.id;
    const text = newCommentText.trim();
    setNewCommentText('');

    try {
      const created = await postService.addComment(postId, user.id, text);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
      setCommentDrawerPost((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
      );
    } catch (e: any) {
      showToast(e.message || 'Không thể gửi bình luận.');
    }
  };

  const toggleExpandPost = (postId: string) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'all') return true;
    return p.postType === activeTab;
  });

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Toast notification feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-black animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* LINKEDIN 3-COLUMN RESPONSIVE LAYOUT CONTAINER */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-5 items-start justify-center">
        {/* ========================================================= */}
        {/* COLUMN 1: LEFT USER PROFILE & SHORTCUTS (LinkedIn Left Rail) */}
        {/* ========================================================= */}
        <aside className="w-56 xl:w-60 shrink-0 hidden lg:flex flex-col gap-3.5 sticky top-18 select-none">
          {/* Card 1: User Profile Summary Card */}
          <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 shadow-2xs overflow-hidden flex flex-col">
            {/* Cover Banner */}
            <div className="h-14 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative" />

            {/* Avatar overlapping banner (Default silhouette graphic, no letters) */}
            <div className="relative flex justify-center -mt-8">
              <div
                onClick={() => navigate('/profile')}
                className="cursor-pointer shadow-xs rounded-full"
              >
                <Avatar
                  src={profile?.avatarUrl}
                  alt={profile?.displayName}
                  size="xl"
                  className="w-16 h-16 border-2 border-white dark:border-app-surface shadow-xs"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="px-4 pt-2 pb-3 flex flex-col items-center text-center">
              <div
                onClick={() => navigate('/profile')}
                className="font-black text-sm text-app-text hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{profile?.displayName || user?.email?.split('@')[0] || 'Hoàng Minh'}</span>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              </div>
              <span className="text-[11px] text-app-muted mt-0.5 font-medium leading-tight line-clamp-2">
                VĐV Cầu Lông Phong Trào | Tier {profile?.tierName || 'Trung bình'}
              </span>
              <span className="text-[10px] text-app-muted/80 mt-1 font-medium">
                CLB Cầu Lông TP.HCM
              </span>
            </div>

            {/* Stats Dividers & Rows */}
            <div className="border-t border-app-border/70 py-2 flex flex-col text-xs">
              <div
                onClick={() => navigate('/profile')}
                className="px-4 py-1.5 flex items-center justify-between hover:bg-app-background/60 cursor-pointer transition-colors"
              >
                <span className="text-app-muted font-medium text-[11px]">Trận đã đấu</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">24</span>
              </div>
              <div
                onClick={() => navigate('/rankings')}
                className="px-4 py-1.5 flex items-center justify-between hover:bg-app-background/60 cursor-pointer transition-colors"
              >
                <span className="text-app-muted font-medium text-[11px]">Điểm Elo</span>
                <span className="font-black text-app-text tabular-nums">{profile?.eloRating || 820}</span>
              </div>
              <div
                onClick={() => navigate('/profile')}
                className="px-4 py-1.5 flex items-center justify-between hover:bg-app-background/60 cursor-pointer transition-colors"
              >
                <span className="text-app-muted font-medium text-[11px]">Tỉ lệ thắng</span>
                <span className="font-black text-app-text tabular-nums">68%</span>
              </div>
            </div>

            {/* Saved Items Link */}
            <div className="border-t border-app-border/70 px-4 py-2.5 hover:bg-app-background/60 cursor-pointer transition-colors flex items-center gap-2 text-xs font-bold text-app-muted hover:text-app-text">
              <Bookmark size={14} />
              <span>Mục đã lưu</span>
            </div>
          </div>

          {/* Card 2: Sân Quen & Nhóm Thể Thao */}
          <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-3.5 shadow-2xs flex flex-col gap-2.5">
            <span className="text-xs font-black text-app-text">Sân quen & Nhóm</span>
            <div className="flex flex-col gap-1.5 text-xs">
              <div
                onClick={() => navigate('/rooms')}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer text-app-muted hover:text-emerald-600 transition-colors"
              >
                <MapPin size={13} className="text-emerald-500 shrink-0" />
                <span className="font-medium truncate">#SanKyHoa (Quận 10)</span>
              </div>
              <div
                onClick={() => navigate('/rooms')}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer text-app-muted hover:text-emerald-600 transition-colors"
              >
                <MapPin size={13} className="text-emerald-500 shrink-0" />
                <span className="font-medium truncate">#SanViettel (Tân Bình)</span>
              </div>
              <div
                onClick={() => navigate('/rooms')}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer text-app-muted hover:text-emerald-600 transition-colors"
              >
                <Users size={13} className="text-emerald-500 shrink-0" />
                <span className="font-medium truncate">CLB Cầu Lông Sài Gòn</span>
              </div>
            </div>
            <div
              onClick={() => navigate('/rooms')}
              className="pt-2 border-t border-app-border/70 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer text-center"
            >
              Khám phá thêm →
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* COLUMN 2: CENTER FEED STREAM (LinkedIn Center Stream)       */}
        {/* ========================================================= */}
        <div className="flex-1 max-w-[620px] xl:max-w-[640px] flex flex-col gap-3.5 min-w-0">
          {/* 1. LINKEDIN-STYLE POST COMPOSER CARD */}
          <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-3.5 shadow-2xs flex flex-col gap-3">
            {/* Top row: Avatar + Pill Input Trigger */}
            <div className="flex items-center gap-2.5">
              <Avatar
                src={profile?.avatarUrl}
                alt={profile?.displayName}
                size="md"
                className="w-10 h-10 shadow-2xs"
              />
              <div
                onClick={() => handleOpenCreateModal('general')}
                className="flex-1 h-10 px-4 rounded-full border border-app-border hover:bg-app-background/70 text-xs font-semibold text-app-muted hover:text-app-text flex items-center cursor-pointer transition-all shadow-2xs"
              >
                <span>Hôm nay bạn vừa hoàn thành trận đấu hay có review sân nào?</span>
              </div>
            </div>

            {/* Bottom row: Colorful action buttons matching LinkedIn */}
            <div className="flex items-center justify-between pt-1 border-t border-app-border/60 text-xs font-bold text-app-muted">
              {/* Video button */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('general')}
                className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-emerald-600 dark:text-emerald-400"
              >
                <Video size={16} />
                <span>Video</span>
              </button>

              {/* Photo button */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('general')}
                className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-sky-500"
              >
                <ImageIcon size={16} />
                <span>Ảnh</span>
              </button>

              {/* Match Recap button */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('match_recap')}
                className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-amber-500"
              >
                <Trophy size={16} />
                <span>Nhật ký</span>
              </button>

              {/* Court Review button (Warm Gold Star Icon) */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('court_review')}
                className="flex-1 py-2 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors text-amber-500"
              >
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span>Review sân</span>
              </button>
            </div>
          </div>

          {/* 2. SUBHEADER FILTER & SORT BAR */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'match_recap', label: 'Nhật ký trận' },
                { key: 'court_review', label: 'Review sân' },
                { key: 'general', label: 'Cộng đồng' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as FeedTab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-app-surface text-app-muted hover:text-app-text border border-app-border/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Refresh feed */}
            <button
              type="button"
              onClick={loadFeed}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-app-surface text-app-muted hover:text-app-text transition-colors border border-transparent hover:border-app-border"
              title="Làm mới bảng tin"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
          </div>

          {/* Upcoming Rooms Strip on Mobile */}
          <div className="xl:hidden w-full">
            {upcomingEvents.length > 0 && <UpcomingRoomsStrip events={upcomingEvents} />}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && posts.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-app-muted text-xs bg-white dark:bg-app-surface rounded-xl border border-app-border">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-bold mt-2">Đang tải bảng tin…</span>
            </div>
          )}

          {/* 3. POSTS TIMELINE STREAM (LinkedIn Post Card Architecture) */}
          <div className="flex flex-col gap-3.5">
            {filteredPosts.map((post) => {
              const isReview = post.postType === 'court_review';
              const isRecap = post.postType === 'match_recap';
              const isExpanded = expandedPostIds.has(post.id);
              const shouldTruncate = post.content.length > 180;

              return (
                <article
                  key={post.id}
                  className="bg-white dark:bg-app-surface rounded-xl p-4 border border-app-border/80 flex flex-col gap-3 shadow-2xs hover:border-emerald-500/30 transition-all overflow-hidden"
                >
                  {/* LinkedIn Author Header (Avatar with silhouette fallback) */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar
                        src={post.author.avatarUrl}
                        alt={post.author.displayName}
                        size="md"
                        className="w-11 h-11 shadow-2xs"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-black text-app-text truncate">
                            {post.author.displayName}
                          </span>
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span className="text-[10px] text-app-muted font-medium shrink-0">
                            · 1st
                          </span>
                        </div>
                        <span className="text-[11px] text-app-muted truncate font-medium">
                          {post.author.tierName || 'VĐV Phong trào · 820 Elo'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-app-muted/80">
                          <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span>·</span>
                          <span>🌐</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => showToast(`Đã theo dõi ${post.author.displayName}!`)}
                        className="h-7 px-3 rounded-full border border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <UserPlus size={12} />
                        <span>Theo dõi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          showToast('Đã sao chép liên kết!');
                        }}
                        className="text-app-muted hover:text-app-text p-1.5 rounded-full hover:bg-app-background/60"
                        title="Tùy chọn"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="text-[13px] text-app-text leading-relaxed whitespace-pre-line font-normal break-words overflow-hidden">
                    {isExpanded || !shouldTruncate
                      ? post.content
                      : `${post.content.slice(0, 180)}…`}
                    {shouldTruncate && !isExpanded && (
                      <button
                        type="button"
                        onClick={() => toggleExpandPost(post.id)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 hover:underline text-xs inline-block"
                      >
                        ...Xem thêm
                      </button>
                    )}
                  </div>

                  {/* Embedded Activity Box: Match Recap or Court Review */}
                  {isRecap && (
                    <div className="p-3.5 rounded-xl bg-app-background border border-app-border/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                          <Trophy size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-app-text truncate">
                            Thắng set đấu [21-19 | 21-17]
                          </span>
                          <span className="text-[11px] text-app-muted truncate">
                            {post.roomTitle || 'Kèo đôi nam giao lưu Sân Kỳ Hòa'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          ▲ +18 Elo
                        </span>
                        <span className="text-[9px] text-app-muted font-medium">điểm xếp hạng</span>
                      </div>
                    </div>
                  )}

                  {/* UI/UX Refined Court Review Rating Box */}
                  {isReview && (
                    <div className="p-3.5 rounded-xl bg-app-background border border-app-border/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                          <Star size={18} className="fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-app-text truncate">
                            {post.courtName || 'Sân Đào Duy Anh'}
                          </span>
                          <span className="text-[11px] text-app-muted truncate">
                            {post.courtAddress || '#SânThảm #QuậnPhúNhuận'}
                          </span>
                        </div>
                      </div>
                      {/* Polished High-Contrast Rating Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-white">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-black tabular-nums">{post.rating || 5}.0</span>
                          <span className="text-[10px] text-app-muted font-medium">/ 5.0</span>
                        </div>
                        <span className="text-[9px] text-app-muted font-medium mt-0.5">chất lượng sân</span>
                      </div>
                    </div>
                  )}

                  {/* Media Preview if attached */}
                  {post.mediaUrls.length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-app-border mt-0.5">
                      <img
                        src={post.mediaUrls[0]}
                        alt="Ảnh bài đăng"
                        className="w-full h-52 sm:h-60 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* LinkedIn Engagement Stats Row */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-app-muted border-b border-app-border/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">
                        👍
                      </div>
                      <span>{post.likesCount} người thích</span>
                    </div>
                    <span>{post.commentsCount} bình luận</span>
                  </div>

                  {/* LinkedIn 4-Action Bottom Bar (Like, Comment, Repost, Save) */}
                  <div className="flex items-center justify-between text-xs text-app-muted font-bold">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 transition-colors ${
                        post.isLiked ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'hover:text-app-text'
                      }`}
                    >
                      <Heart size={16} className={post.isLiked ? 'fill-emerald-600 text-emerald-600' : ''} />
                      <span>Thích</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCommentDrawer(post)}
                      className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>Bình luận</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Đã sao chép liên kết!');
                      }}
                      className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
                    >
                      <Share2 size={16} />
                      <span>Chia sẻ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast('Đã lưu bài viết!')}
                      className="flex-1 py-1.5 rounded-lg hover:bg-app-background/60 flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
                    >
                      <Bookmark size={16} />
                      <span>Lưu</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: RIGHT WIDGETS (LinkedIn Right Rail)              */}
        {/* ========================================================= */}
        <aside className="w-72 xl:w-80 shrink-0 hidden xl:flex flex-col gap-3.5 sticky top-18 select-none">
          {/* Card 1: Kèo Đấu Nổi Bật (LinkedIn Today's News / Puzzles Style) */}
          <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-app-text flex items-center gap-1.5">
                <Award size={15} className="text-emerald-600" />
                <span>Kèo Đấu Nổi Bật</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                HOT
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-black text-app-text leading-snug">
                {upcomingEvents.length > 0 ? upcomingEvents[0].title : 'Kèo Đôi Nam Phong Trào Tối Nay'}
              </h4>
              <span className="text-[11px] text-app-muted font-medium">
                {upcomingEvents.length > 0
                  ? `${new Date(upcomingEvents[0].startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${upcomingEvents[0].subtitle || 'Sân Kỳ Hòa'}`
                  : '19:30, Tối nay · Sân Kỳ Hòa, Quận 10'}
              </span>
            </div>

            {/* Slots status */}
            <div className="flex items-center justify-between text-[11px] font-bold py-1 border-y border-app-border/60">
              <span className="text-app-muted">Trạng thái phòng đấu</span>
              <span className="text-emerald-600 font-black">4/4 Slots</span>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => {
                if (upcomingEvents.length > 0 && upcomingEvents[0].rawRoom) {
                  navigate(`/rooms/${upcomingEvents[0].rawRoom.id}`);
                } else {
                  navigate('/rooms');
                }
              }}
              className="w-full py-2 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
            >
              <span>Xem chi tiết phòng đấu</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Card 2: Gợi Ý Kết Nối Bạn Chơi (Default Silhouette Avatars) */}
          <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-3">
            <span className="text-xs font-black text-app-text flex items-center gap-1.5">
              <Users size={15} className="text-emerald-600" />
              <span>Gợi ý kết nối bạn chơi</span>
            </span>

            <div className="flex flex-col gap-2.5">
              {[
                { name: 'Trần Tuấn Kiệt', tier: 'Tier Khá · 950 Elo', mutual: '3 bạn chung' },
                { name: 'Nguyễn Hải Đăng', tier: 'Tier TB · 840 Elo', mutual: 'Sân Kỳ Hòa' },
                { name: 'Lê Thảo My', tier: 'Tier TBK · 890 Elo', mutual: '5 bạn chung' },
              ].map((player, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar size="sm" className="w-8 h-8 shadow-2xs" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-app-text truncate">{player.name}</span>
                      <span className="text-[10px] text-app-muted truncate">{player.tier}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Đã gửi lời mời tới ${player.name}!`)}
                    className="h-6.5 px-2.5 rounded-full border border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Kết nối</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Top Sân Cầu Hot Hôm Nay (UI/UX Refined Star Rating Badges) */}
          <div className="bg-white dark:bg-app-surface rounded-xl border border-app-border/80 p-4 shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-app-text flex items-center gap-1.5">
                <TrendingUp size={15} className="text-emerald-600" />
                <span>Sân Cầu Hot Hôm Nay</span>
              </span>
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                Tất cả →
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {[
                { rank: 1, name: 'Sân Kỳ Hòa', district: 'Quận 10', rating: '4.9' },
                { rank: 2, name: 'Sân Viettel', district: 'Tân Bình', rating: '4.8' },
                { rank: 3, name: 'Sân Đào Duy Anh', district: 'Phú Nhuận', rating: '4.8' },
                { rank: 4, name: 'Sân Hải Yến', district: 'Bình Thạnh', rating: '4.7' },
              ].map((court) => (
                <div
                  key={court.rank}
                  onClick={() => navigate('/rooms')}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-app-background/60 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-4.5 text-[11px] font-black text-app-muted tabular-nums">
                      {court.rank}.
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-app-text group-hover:text-emerald-600 transition-colors truncate">
                        {court.name}
                      </span>
                      <span className="text-[10px] text-app-muted truncate">{court.district}</span>
                    </div>
                  </div>

                  {/* UI/UX Refined Rating Badge: Warm Golden Star + High Contrast Number */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-zinc-100 shrink-0">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-black tabular-nums">{court.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compact LinkedIn Footer Links */}
          <div className="px-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-muted/80 justify-center text-center">
            <a href="#" className="hover:text-emerald-600 hover:underline">Về SportXP</a>
            <a href="#" className="hover:text-emerald-600 hover:underline">Trợ giúp</a>
            <a href="#" className="hover:text-emerald-600 hover:underline">Điều khoản</a>
            <a href="#" className="hover:text-emerald-600 hover:underline">Quyền riêng tư</a>
            <span className="w-full text-[10px] text-app-muted/60 mt-1">SportXP Corporation © 2026</span>
          </div>
        </aside>
      </div>

      {/* SLIDE-UP COMMENTS DRAWER / MODAL SHEET */}
      {commentDrawerPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-app-surface border border-app-border rounded-t-[28px] sm:rounded-xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-600" />
                <h3 className="text-sm font-black text-app-text">
                  Bình luận ({commentDrawerPost.commentsCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCommentDrawerPost(null)}
                className="w-8 h-8 rounded-full hover:bg-app-background flex items-center justify-center text-app-muted hover:text-app-text"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[220px]">
              {commentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-app-muted text-xs">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải bình luận…</span>
                </div>
              ) : (commentsMap[commentDrawerPost.id] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-1 text-app-muted text-xs text-center">
                  <MessageCircle size={32} className="text-app-border mb-1" />
                  <span className="font-bold">Chưa có bình luận nào</span>
                  <span>Hãy là người đầu tiên để lại ý kiến của bạn!</span>
                </div>
              ) : (
                (commentsMap[commentDrawerPost.id] || []).map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-3 rounded-lg bg-app-background border border-app-border/60 flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar size="xs" className="w-6 h-6" />
                        <span className="font-black text-app-text">{cmt.authorName}</span>
                      </div>
                      <span className="text-[10px] text-app-muted">
                        {new Date(cmt.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-app-text/90 font-medium leading-relaxed pl-8">{cmt.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Footer */}
            <div className="p-3 sm:p-4 border-t border-app-border bg-white dark:bg-app-surface flex items-center gap-2 shrink-0">
              <Avatar
                src={profile?.avatarUrl}
                alt={profile?.displayName}
                size="xs"
                className="w-8 h-8"
              />
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendComment();
                }}
                placeholder="Viết bình luận của bạn…"
                className="flex-1 h-10 px-4 rounded-full bg-app-background border border-app-border text-xs text-app-text placeholder:text-app-muted outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSendComment}
                disabled={!newCommentText.trim()}
                className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 hover:brightness-105 active:scale-95 transition-all shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL DIALOG */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-app-surface border border-app-border rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-app-border">
              <h2 className="text-base font-black text-app-text">Tạo bài viết mới</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-app-background text-app-muted hover:text-app-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Post Type Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-app-background border border-app-border/80 text-xs font-bold">
              {[
                { type: 'general', label: 'Cộng đồng', icon: MessageCircle },
                { type: 'court_review', label: 'Review sân', icon: Star },
                { type: 'match_recap', label: 'Nhật ký trận', icon: Trophy },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setPostTypeChoice(item.type as any)}
                    className={`py-2 px-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                      postTypeChoice === item.type
                        ? 'bg-white dark:bg-app-surface text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                        : 'text-app-muted hover:text-app-text'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePost} className="flex flex-col gap-3.5">
              {/* Content Textarea */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black uppercase text-app-muted">Nội dung</label>
                <textarea
                  rows={4}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm sân, ván đấu vừa chơi, hoặc tìm kiếm bạn giao lưu…"
                  className="w-full p-3.5 rounded-xl bg-app-background border border-app-border text-xs text-app-text placeholder:text-app-muted outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Rating Star Picker (for Court Review) */}
              {postTypeChoice === 'court_review' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                    Đánh giá chất lượng sân:
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingChoice(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={18}
                          className={star <= ratingChoice ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-black ml-1 text-amber-800 dark:text-amber-300">{ratingChoice}.0</span>
                  </div>
                </div>
              )}

              {/* Media URL Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black uppercase text-app-muted">
                  Liên kết Ảnh / Video (tùy chọn)
                </label>
                <input
                  type="url"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full h-10 px-3.5 rounded-xl bg-app-background border border-app-border text-xs text-app-text placeholder:text-app-muted outline-none focus:border-emerald-500"
                />
              </div>

              {/* Form Error */}
              {formError && (
                <div className="p-3 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-app-muted hover:bg-app-background transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all"
                >
                  Đăng bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
