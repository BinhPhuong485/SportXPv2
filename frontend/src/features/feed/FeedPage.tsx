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
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Pencil,
  MoreHorizontal,
  Play,
  UserPlus,
  ChevronDown,
  Bookmark,
  ThumbsUp,
  TrendingUp,
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

type FeedTab = 'all' | 'court_review' | 'match_recap' | 'media' | 'general';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerProfile[]>([]);
  const [myRooms, setMyRooms] = useState<ManagedRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
      if (courtList.length > 0 && !selectedCourtId) {
        setSelectedCourtId(courtList[0].id);
      }
    } catch {
      setError('Chưa tải được bảng tin thể thao mới nhất.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCourtId]);

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
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'media') return p.mediaUrls && p.mediaUrls.length > 0;
    return p.postType === activeTab;
  });

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-app-surface text-app-text border border-app-border shadow-xl text-xs font-black animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* 2-Column Responsive Feed Container */}
      <div className="w-full flex flex-col xl:flex-row gap-6 items-start justify-center">
        {/* CENTER FEED STREAM (640px max on desktop) */}
        <div className="w-full max-w-[640px] flex flex-col gap-4 mx-auto xl:mx-0">
          {/* 1. QUICK POST COMPOSER BENTO CARD (Matched to reference image) */}
          <div className="w-full bg-app-surface rounded-[28px] border border-app-border/80 p-5 shadow-xs flex flex-col gap-3.5">
            {/* Top Pill Input */}
            <div
              onClick={() => handleOpenCreateModal('general')}
              className="w-full h-12 px-4 rounded-full bg-app-background/60 border border-app-border/80 hover:border-app-primary/50 text-app-muted hover:text-app-text flex items-center gap-3 cursor-pointer transition-all shadow-2xs"
            >
              <Pencil size={17} className="text-app-muted shrink-0 ml-1" />
              <span className="text-xs sm:text-[13px] font-medium truncate flex-1">
                Bạn vừa hoàn thành set đấu hay có review sân nào? 🏸
              </span>
            </div>

            {/* Bottom Triggers (Photo, Video, Event, Article style) */}
            <div className="grid grid-cols-4 gap-1 pt-1 border-t border-app-border/60">
              {/* Photo */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('general')}
                className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 hover:bg-app-background text-xs font-bold text-app-muted hover:text-app-text transition-colors"
              >
                <ImageIcon size={18} className="text-sky-500 shrink-0" />
                <span className="hidden sm:inline">Ảnh sân</span>
              </button>

              {/* Video */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('general')}
                className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 hover:bg-app-background text-xs font-bold text-app-muted hover:text-app-text transition-colors"
              >
                <VideoIcon size={18} className="text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">Video</span>
              </button>

              {/* Match / Event */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('match_recap')}
                className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 hover:bg-app-background text-xs font-bold text-app-muted hover:text-app-text transition-colors"
              >
                <Trophy size={18} className="text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Kèo đấu</span>
              </button>

              {/* Court Review / Article */}
              <button
                type="button"
                onClick={() => handleOpenCreateModal('court_review')}
                className="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 hover:bg-app-background text-xs font-bold text-app-muted hover:text-app-text transition-colors"
              >
                <Star size={18} className="text-rose-500 fill-rose-500/20 shrink-0" />
                <span className="hidden sm:inline">Review sân</span>
              </button>
            </div>
          </div>

          {/* Sort & Filter Sub-bar */}
          <div className="flex items-center justify-between px-2 py-0.5">
            <div className="flex items-center gap-1 text-xs text-app-muted">
              <span>Sắp xếp theo:</span>
              <button
                type="button"
                onClick={loadFeed}
                className="font-black text-app-text flex items-center gap-1 hover:text-app-primary"
              >
                <span>Mới nhất</span>
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Refresh Feed Icon */}
            <button
              type="button"
              onClick={loadFeed}
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-app-surface text-app-muted hover:text-app-text transition-colors"
              title="Làm mới"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-app-primary' : ''} />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'court_review', label: '★ Review sân' },
              { key: 'match_recap', label: '🏆 Nhật ký ván đấu' },
              { key: 'media', label: '📷 Ảnh & Video' },
              { key: 'general', label: '💬 Giao lưu' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as FeedTab)}
                className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border ${
                  activeTab === tab.key
                    ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                    : 'bg-app-surface text-app-muted border-app-border/80 hover:border-app-primary/40 hover:text-app-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Upcoming Rooms Strip on Mobile */}
          <div className="xl:hidden w-full">
            {upcomingEvents.length > 0 && <UpcomingRoomsStrip events={upcomingEvents} />}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-[28px] bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && posts.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-app-muted text-xs bg-app-surface rounded-[28px] border border-app-border">
              <div className="w-8 h-8 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-bold mt-2">Đang tải nhật ký thể thao…</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPosts.length === 0 && !error && (
            <div className="p-10 rounded-[28px] bg-app-surface border border-app-border text-center flex flex-col items-center gap-3 shadow-xs">
              <Sparkles size={34} className="text-app-primary" />
              <h3 className="text-base font-black text-app-text">Chưa có bài viết trong danh mục này</h3>
              <p className="text-xs text-app-muted max-w-xs leading-relaxed">
                Hãy là người đầu tiên chia sẻ cảm nghĩ, review chất lượng sân cầu hoặc ghi lại kết quả ván đấu vừa chơi!
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('general')}
                className="mt-2 px-5 py-2.5 rounded-full bg-app-primary text-app-on-primary text-xs font-black uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-xs"
              >
                Viết bài đầu tiên
              </button>
            </div>
          )}

          {/* 2. POSTS LIST (MATCHING LINKEDIN UX CARDS) */}
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => {
              const isReview = post.postType === 'court_review';
              const isRecap = post.postType === 'match_recap';
              const isExpanded = expandedPostIds.has(post.id);
              const shouldTruncate = post.content.length > 180;

              return (
                <article
                  key={post.id}
                  className="bg-app-surface rounded-[28px] p-5 sm:p-6 border border-app-border/80 flex flex-col gap-3.5 shadow-xs hover:shadow-md transition-all duration-200"
                >
                  {/* Top Contextual Social Line (Like in reference: "Michael Jack liked") */}
                  <div className="flex items-center justify-between text-[11px] text-app-muted pb-1 border-b border-app-border/40">
                    <span className="flex items-center gap-1.5 font-bold">
                      {isReview ? (
                        <>
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span>Đánh giá trải nghiệm sân cầu</span>
                        </>
                      ) : isRecap ? (
                        <>
                          <Trophy size={12} className="text-app-primary" />
                          <span>Kết quả ván đấu vừa hoàn thành</span>
                        </>
                      ) : (
                        <>
                          <ThumbsUp size={12} className="text-sky-500" />
                          <span>Cộng đồng giao lưu SportXP</span>
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Đã sao chép liên kết!');
                      }}
                      className="hover:text-app-text p-0.5 rounded"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-app-mint text-app-primary border-2 border-app-surface shadow-xs flex items-center justify-center font-black text-sm shrink-0">
                        {post.author.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-app-text truncate">
                            {post.author.displayName}
                          </span>
                          {post.author.tierName && (
                            <span className="px-2 py-0.5 rounded-full bg-app-primary/10 text-app-primary text-[10px] font-black">
                              {post.author.tierName}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-app-muted mt-0.5 font-medium">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content Text */}
                  <div className="text-[14px] text-app-text leading-relaxed whitespace-pre-line">
                    {isExpanded || !shouldTruncate
                      ? post.content
                      : `${post.content.slice(0, 180)}…`}
                    {shouldTruncate && !isExpanded && (
                      <button
                        type="button"
                        onClick={() => toggleExpandPost(post.id)}
                        className="text-app-primary font-black ml-1.5 hover:underline uppercase text-xs"
                      >
                        READ MORE
                      </button>
                    )}
                  </div>

                  {/* 3. FEATURED MEDIA & SCOREBOARD BOX (Ảnh, Video, Trận đấu) */}
                  {/* CASE A: MATCH RECAP SCOREBOARD CARD */}
                  {isRecap && (
                    <div className="rounded-2xl border border-app-border bg-gradient-to-br from-app-surface via-app-mint/15 to-app-background p-4 sm:p-5 flex flex-col gap-3 shadow-xs">
                      {/* Top Bar of Matchup */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black tracking-wider text-app-primary uppercase flex items-center gap-1.5">
                          <Trophy size={13} />
                          <span>CẦU LÔNG ĐÔI · GIAO LƯU TÍNH ELO</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-black flex items-center gap-1">
                          <TrendingUp size={12} />
                          <span>+18 Elo</span>
                        </span>
                      </div>

                      {/* Main Matchup Scoreboard */}
                      <div className="grid grid-cols-11 items-center py-2 bg-app-surface/90 rounded-xl border border-app-border/70 px-3">
                        {/* Team A */}
                        <div className="col-span-4 flex flex-col items-center sm:items-start">
                          <span className="text-xs font-black text-app-primary truncate max-w-full">
                            {post.author.displayName} & Tuấn
                          </span>
                          <span className="text-[10px] text-app-muted font-bold">Đội Thắng</span>
                        </div>

                        {/* Sets Score */}
                        <div className="col-span-3 flex flex-col items-center justify-center">
                          <div className="text-base sm:text-lg font-black text-app-text tracking-wider tabular-nums">
                            21 - 19
                          </div>
                          <div className="text-[10px] font-bold text-app-muted tabular-nums">
                            Set 2: 21 - 17
                          </div>
                        </div>

                        {/* Team B */}
                        <div className="col-span-4 flex flex-col items-center sm:items-end">
                          <span className="text-xs font-bold text-app-text truncate max-w-full">
                            Minh & Khoa
                          </span>
                          <span className="text-[10px] text-app-muted">Đội Bạn</span>
                        </div>
                      </div>

                      {/* Room & Court Link */}
                      <div className="flex items-center justify-between text-xs text-app-muted pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-app-primary" />
                          <span className="font-semibold">{post.roomTitle || 'Sân thi đấu'}</span>
                        </span>
                        {post.roomId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/rooms/${post.roomId}`)}
                            className="font-black text-app-primary hover:underline text-[11px]"
                          >
                            Xem phòng đấu →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CASE B: COURT REVIEW BANNER */}
                  {isReview && post.courtName && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black text-app-text flex items-center gap-1.5">
                          <MapPin size={15} className="text-amber-500 shrink-0" />
                          <span>{post.courtName}</span>
                        </span>
                        {/* Rating Stars */}
                        {post.rating && (
                          <div className="flex items-center gap-1 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= post.rating!
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-app-border'
                                }
                              />
                            ))}
                            <span className="text-xs font-black text-amber-500 ml-1">
                              {post.rating}.0
                            </span>
                          </div>
                        )}
                      </div>
                      {post.courtAddress && (
                        <span className="text-[11px] text-app-muted">{post.courtAddress}</span>
                      )}
                      {/* Facility Tags */}
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                        {['Thảm tiêu chuẩn BWF', 'Trần cao thoáng', 'Ánh sáng đều', 'Bãi đỗ xe'].map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-full bg-app-surface text-app-muted text-[10px] font-bold border border-app-border/80 whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CASE C: ATTACHED PHOTO / VIDEO PREVIEW */}
                  {post.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl overflow-hidden mt-1">
                      {post.mediaUrls.map((url, idx) => {
                        const isVideo = url.endsWith('.mp4') || url.endsWith('.mov') || url.includes('video');
                        return (
                          <div key={idx} className="relative rounded-2xl overflow-hidden border border-app-border group">
                            {isVideo ? (
                              <div className="w-full h-56 bg-slate-900 flex items-center justify-center relative">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg cursor-pointer">
                                  <Play size={24} fill="white" className="ml-1" />
                                </div>
                                <span className="absolute bottom-3 left-3 text-xs text-white/80 font-bold bg-black/40 px-2 py-0.5 rounded-md">
                                  Video ván đấu
                                </span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt="Ảnh bài đăng"
                                className="w-full h-52 sm:h-64 object-cover rounded-2xl group-hover:scale-102 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer Action Bar */}
                  <div className="pt-3 border-t border-app-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 ${
                          post.isLiked ? 'text-app-loss font-black' : 'text-app-muted hover:text-app-text'
                        }`}
                      >
                        <Heart
                          size={18}
                          className={post.isLiked ? 'fill-app-loss text-app-loss' : ''}
                        />
                        <span className="tabular-nums">{post.likesCount}</span>
                        <span className="hidden sm:inline font-semibold">Thích</span>
                      </button>

                      {/* Comment drawer trigger */}
                      <button
                        type="button"
                        onClick={() => handleOpenCommentDrawer(post)}
                        className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
                      >
                        <MessageCircle size={18} />
                        <span className="tabular-nums">{post.commentsCount}</span>
                        <span className="hidden sm:inline font-semibold">Bình luận</span>
                      </button>

                      {/* Share button */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          showToast('Đã sao chép liên kết bài viết!');
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
                      >
                        <Share2 size={17} />
                        <span className="hidden sm:inline font-semibold">Chia sẻ</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast('Đã lưu bài viết vào mục yêu thích!')}
                      className="text-app-muted hover:text-app-text p-1 transition-colors"
                      title="Lưu bài viết"
                    >
                      <Bookmark size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* RIGHT WIDGETS COLUMN (Desktop only: 280px - 320px) */}
        <aside className="hidden xl:flex flex-col w-80 shrink-0 sticky top-20 gap-4">
          {/* Widget 1: Add to your feed (Gợi ý kết nối bạn chơi) */}
          <div className="bg-app-surface rounded-[28px] border border-app-border/80 p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-black uppercase tracking-wider text-app-text">
                Gợi ý kết nối bạn chơi
              </span>
              <button
                type="button"
                onClick={() => navigate('/rankings')}
                className="text-app-muted hover:text-app-primary"
              >
                →
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {topPlayers.slice(0, 4).map((pl) => (
                <div key={pl.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-app-mint text-app-primary font-black text-xs flex items-center justify-center shrink-0 border border-app-primary/20">
                      {pl.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-app-text truncate">{pl.displayName}</span>
                      <span className="text-[10px] text-app-muted truncate">
                        {pl.tierName || 'TB'} · {pl.eloRating} Elo
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`Đã gửi lời mời giao lưu tới ${pl.displayName}!`)}
                    className="w-7 h-7 rounded-full border border-app-border hover:border-app-primary hover:bg-app-mint text-app-muted hover:text-app-primary flex items-center justify-center transition-all shrink-0"
                    title="Gửi lời mời"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Kèo hot hôm nay (Today's top courses style) */}
          <div className="bg-app-surface rounded-[28px] border border-app-border/80 p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-black uppercase tracking-wider text-app-text">
                Kèo hot hôm nay
              </span>
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="text-app-muted hover:text-app-primary"
              >
                →
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { title: 'Kèo đôi nam phong trào', court: 'Sân Kỳ Hòa · Q10', time: '19:30 - 21:30' },
                { title: 'Giao lưu TB/TBK tối nay', court: 'Sân Viettel · Tân Bình', time: '20:00 - 22:00' },
                { title: 'Đánh đơn rèn thể lực', court: 'Sân Hải Yến · Bình Thạnh', time: '18:00 - 20:00' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/rooms')}
                  className="flex items-start gap-2.5 cursor-pointer group"
                >
                  <span className="text-xs font-black text-app-muted group-hover:text-app-primary tabular-nums">
                    {idx + 1}.
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-app-text group-hover:text-app-primary truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-app-muted">
                      {item.court} · {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Legal & Help Links */}
          <div className="px-2 text-[11px] text-app-muted/80 flex flex-wrap gap-x-3 gap-y-1">
            <span>Về SportXP</span>
            <span>Trợ giúp</span>
            <span>Điều khoản dịch vụ</span>
            <span>Chính sách bảo mật</span>
            <span>© 2026 SportXP Inc.</span>
          </div>
        </aside>
      </div>

      {/* SLIDE-UP COMMENTS DRAWER / MODAL SHEET */}
      {commentDrawerPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-[32px] sm:rounded-[28px] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-app-primary" />
                <h3 className="text-sm font-black text-app-text">
                  Bình luận ({commentDrawerPost.commentsCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCommentDrawerPost(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Post Snippet Reference */}
            <div className="px-4 py-2.5 bg-app-background border-b border-app-border flex items-center gap-2.5 text-xs shrink-0">
              <div className="w-6 h-6 rounded-full bg-app-mint text-app-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                {commentDrawerPost.author.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-app-text truncate">{commentDrawerPost.author.displayName}:</span>
              <span className="text-app-muted truncate flex-1">{commentDrawerPost.content}</span>
            </div>

            {/* Comments Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[220px]">
              {commentsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-app-muted text-xs">
                  <div className="w-6 h-6 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải bình luận…</span>
                </div>
              ) : (commentsMap[commentDrawerPost.id] || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-app-muted flex flex-col items-center gap-2">
                  <MessageCircle size={24} className="text-app-muted/60" />
                  <span>Chưa có bình luận nào. Hãy gửi lời bình đầu tiên!</span>
                </div>
              ) : (
                (commentsMap[commentDrawerPost.id] || []).map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-app-background border border-app-border/80 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-app-surface border border-app-border flex items-center justify-center font-bold text-[10px] text-app-primary">
                          {c.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-black text-app-text">{c.authorName}</span>
                      </div>
                      <span className="text-[10px] text-app-muted">
                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-app-text text-xs leading-relaxed pl-8">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Sticky Comment Input Bar at Bottom */}
            <div className="p-3 bg-app-surface border-t border-app-border flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Viết bình luận của bạn…"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendComment();
                }}
                className="flex-1 h-10 px-3.5 rounded-full bg-app-background border border-app-border text-xs text-app-text focus:border-app-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendComment}
                className="h-10 px-4 rounded-full bg-app-primary text-app-on-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shadow-xs"
              >
                <Send size={14} />
                <span>Gửi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE POST MODAL SHEET */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-[32px] sm:rounded-[28px] p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h2 className="text-base font-black text-app-text">Đăng Bài Lên Bản Tin</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-app-loss/12 border border-app-loss/40 text-xs text-app-loss font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-app-background border border-app-border">
                <button
                  type="button"
                  onClick={() => setPostTypeChoice('court_review')}
                  className={`py-2 rounded-full text-xs font-black transition-all ${
                    postTypeChoice === 'court_review'
                      ? 'bg-app-primary text-app-on-primary shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  ★ Review Sân
                </button>
                <button
                  type="button"
                  onClick={() => setPostTypeChoice('match_recap')}
                  className={`py-2 rounded-full text-xs font-black transition-all ${
                    postTypeChoice === 'match_recap'
                      ? 'bg-app-primary text-app-on-primary shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Nhật Ký Trận
                </button>
                <button
                  type="button"
                  onClick={() => setPostTypeChoice('general')}
                  className={`py-2 rounded-full text-xs font-black transition-all ${
                    postTypeChoice === 'general'
                      ? 'bg-app-primary text-app-on-primary shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Cộng Đồng
                </button>
              </div>

              {/* Review Sân Specifics */}
              {postTypeChoice === 'court_review' && (
                <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-app-background border border-app-border">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-app-muted">Chọn sân cầu lông</label>
                    <select
                      value={selectedCourtId}
                      onChange={(e) => setSelectedCourtId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                    >
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.district || 'TP.HCM'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-app-muted">Đánh giá sao</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingChoice(star)}
                          className="p-1 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star
                            size={24}
                            className={
                              star <= ratingChoice
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-app-border'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-sm font-extrabold text-amber-500 ml-2">
                        {ratingChoice} / 5 Sao
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Recap Specifics */}
              {postTypeChoice === 'match_recap' && myRooms.length > 0 && (
                <div className="flex flex-col gap-1 p-3.5 rounded-2xl bg-app-background border border-app-border">
                  <label className="text-xs font-bold text-app-muted">Gắn liền với buổi chơi</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                  >
                    {myRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.courtName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Content Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted uppercase">
                  {postTypeChoice === 'court_review'
                    ? 'Nhận xét sân (Thảm, trần, ánh sáng, gửi xe...)'
                    : postTypeChoice === 'match_recap'
                    ? 'Cảm nghĩ sau buổi thi đấu'
                    : 'Nội dung chia sẻ'}
                </label>
                <textarea
                  rows={4}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder={
                    postTypeChoice === 'court_review'
                      ? 'Sân đánh rất êm, trần cao thoáng khí, ánh sáng đều không bị lóa mắt…'
                      : 'Buổi chơi hôm nay rực lửa! Thắng sát nút set cuối cùng…'
                  }
                  className="w-full p-3.5 rounded-2xl bg-app-background border border-app-border text-xs sm:text-sm text-app-text focus:border-app-primary focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Media Image URL (Optional) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted">Đính kèm URL hình ảnh hoặc video (Tùy chọn)</label>
                <input
                  type="url"
                  placeholder="https://... link ảnh hoặc clip highlight"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-app-background border border-app-border text-xs text-app-text focus:border-app-primary focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-full bg-app-primary text-app-on-primary text-xs font-black uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-xs"
                >
                  {busy ? 'Đang đăng…' : 'Đăng Bài Viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
