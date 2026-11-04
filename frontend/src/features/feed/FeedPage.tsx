import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
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
} from 'lucide-react';
import { postService, PostItem, PostCommentItem } from '../../services/postService';
import { managedRoomRepository } from '../rooms/data/managedRoomRepository';
import { Court, ManagedRoomData } from '../rooms/domain/managedRoom';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import { UpcomingRoomsStrip } from '../calendar/presentation/widgets/UpcomingRoomsStrip';
import { useAuthStore } from '../../shared/hooks/useAuth';

type FeedTab = 'all' | 'court_review' | 'match_recap' | 'general';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [myRooms, setMyRooms] = useState<ManagedRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');

  // Create post modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postTypeChoice, setPostTypeChoice] = useState<'court_review' | 'match_recap' | 'general'>('court_review');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [ratingChoice, setRatingChoice] = useState<number>(5);
  const [contentInput, setContentInput] = useState<string>('');
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Comments drawer / expand state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, PostCommentItem[]>>({});
  const [newCommentText, setNewCommentText] = useState<string>('');

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postList, events, courtList] = await Promise.all([
        postService.listPosts(user?.id || null),
        calendarRepository.loadUserCalendarEvents(),
        managedRoomRepository.courts(),
      ]);
      setPosts(postList);
      setUpcomingEvents(events);
      setCourts(courtList);
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

  const handleOpenCreateModal = () => {
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
      await loadFeed();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi đăng bài.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleLike = async (post: PostItem) => {
    if (!user) return;
    try {
      // Optimistic update
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
      // Revert on error
      loadFeed();
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    setNewCommentText('');
    try {
      const list = await postService.listComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: list }));
    } catch {
      // ignore
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!user || !newCommentText.trim()) return;
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
    } catch (e: any) {
      alert(e.message || 'Không thể gửi bình luận.');
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'all') return true;
    return p.postType === activeTab;
  });

  return (
    <div className="w-full flex flex-col items-center antialiased text-app-text">
      {/* Top Action Header */}
      <div className="w-full max-w-content px-4 pt-3 pb-2 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex-1 h-11 px-4 rounded-btn bg-app-primary text-app-on-primary font-bold text-xs flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-[0.99] shadow-xs"
        >
          <Plus size={16} />
          <span>ĐĂNG BÀI / REVIEW SÂN</span>
        </button>

        <button
          type="button"
          onClick={loadFeed}
          disabled={loading}
          className="w-11 h-11 rounded-btn bg-app-surface border border-app-border hover:border-app-primary text-app-muted hover:text-app-text flex items-center justify-center transition-colors shadow-xs"
          title="Làm mới bảng tin"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="w-full max-w-content px-4 pb-24 flex flex-col gap-3.5">
        {/* 1. UPCOMING ROOMS STRIP (LỊCH SẮP TỚI) */}
        {upcomingEvents.length > 0 && <UpcomingRoomsStrip events={upcomingEvents} />}

        {/* 2. FEED TABS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'court_review', label: '★ Review sân' },
            { key: 'match_recap', label: 'Nhật ký trận' },
            { key: 'general', label: 'Cộng đồng' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as FeedTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeTab === tab.key
                  ? 'bg-app-primary text-app-on-primary border-app-primary shadow-xs'
                  : 'bg-app-surface text-app-muted border-app-border hover:border-app-muted/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && posts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-app-muted text-xs">
            <div className="w-7 h-7 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang tải nhật ký thể thao…</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPosts.length === 0 && !error && (
          <div className="p-10 rounded-2xl bg-app-surface border border-app-border text-center flex flex-col items-center gap-3">
            <Sparkles size={32} className="text-app-primary/60" />
            <h3 className="text-base font-bold text-app-text">Chưa có bài viết nào</h3>
            <p className="text-xs text-app-muted max-w-xs leading-relaxed">
              Hãy là người đầu tiên chia sẻ cảm nghĩ, viết review đánh giá chất lượng sân hoặc tóm tắt set đấu vừa chơi!
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 rounded-xl bg-app-primary text-app-on-primary text-xs font-bold"
            >
              Viết bài đầu tiên
            </button>
          </div>
        )}

        {/* POSTS LIST */}
        {filteredPosts.map((post) => {
          const isReview = post.postType === 'court_review';
          const isRecap = post.postType === 'match_recap';
          const comments = commentsMap[post.id] || [];
          const isCommentsOpen = activeCommentPostId === post.id;

          return (
            <article
              key={post.id}
              className="bg-app-surface rounded-[22px] p-4 sm:p-5 border border-app-border flex flex-col gap-3 shadow-xs hover:border-app-primary/30 transition-all"
            >
              {/* Author & Post Meta Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-app-background border border-app-border flex items-center justify-center font-bold text-sm text-app-primary">
                    {post.author.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-app-text">
                        {post.author.displayName}
                      </span>
                      {post.author.tierName && (
                        <span className="px-1.5 py-0.2 rounded bg-app-primary/10 text-app-primary text-[10px] font-bold">
                          {post.author.tierName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-app-muted">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Post Type Tag */}
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                    isReview
                      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      : isRecap
                      ? 'bg-app-primary/15 text-app-primary border border-app-primary/30'
                      : 'bg-app-border/40 text-app-muted'
                  }`}
                >
                  {isReview ? (
                    <>
                      <Star size={10} className="fill-amber-500" />
                      <span>Review sân</span>
                    </>
                  ) : isRecap ? (
                    <>
                      <Trophy size={10} />
                      <span>Nhật ký ván đấu</span>
                    </>
                  ) : (
                    <span>Cộng đồng</span>
                  )}
                </span>
              </div>

              {/* Court Review Highlight Box */}
              {isReview && post.courtName && (
                <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-app-text flex items-center gap-1">
                      <MapPin size={13} className="text-amber-500" />
                      <span>{post.courtName}</span>
                    </span>
                    {/* Stars */}
                    {post.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= post.rating!
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-app-border'
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {post.courtAddress && (
                    <span className="text-[11px] text-app-muted">{post.courtAddress}</span>
                  )}
                </div>
              )}

              {/* Match Recap Highlight Box */}
              {isRecap && post.roomTitle && (
                <div className="p-3 rounded-xl bg-app-primary/8 border border-app-primary/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-app-text flex items-center gap-1.5">
                    <Trophy size={14} className="text-app-primary" />
                    <span>{post.roomTitle}</span>
                  </span>
                  {post.roomId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/rooms/${post.roomId}`)}
                      className="text-[11px] text-app-primary font-bold hover:underline"
                    >
                      Xem kèo đấu →
                    </button>
                  )}
                </div>
              )}

              {/* Post Content */}
              <p className="text-xs sm:text-sm text-app-text leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {/* Media Images */}
              {post.mediaUrls.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl overflow-hidden mt-1">
                  {post.mediaUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Ảnh bài đăng"
                      className="w-full h-48 object-cover rounded-xl border border-app-border"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons: Like, Comment, Share */}
              <div className="pt-2 border-t border-app-border/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      post.isLiked ? 'text-app-loss' : 'text-app-muted hover:text-app-text'
                    }`}
                  >
                    <Heart
                      size={17}
                      className={post.isLiked ? 'fill-app-loss text-app-loss' : ''}
                    />
                    <span>{post.likesCount}</span>
                  </button>

                  {/* Comment Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
                  >
                    <MessageCircle size={17} />
                    <span>{post.commentsCount}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Đã sao chép liên kết bài viết.');
                  }}
                  className="text-app-muted hover:text-app-text p-1 transition-colors"
                  title="Chia sẻ bài viết"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Comments Section */}
              {isCommentsOpen && (
                <div className="mt-2 pt-3 border-t border-app-border/40 flex flex-col gap-2.5 animate-fadeIn">
                  <div className="text-xs font-bold text-app-muted uppercase tracking-wider">
                    Bình luận ({comments.length})
                  </div>

                  {comments.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-app-background border border-app-border/70 flex flex-col gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-app-text">{c.authorName}</span>
                            <span className="text-[10px] text-app-muted">
                              {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-app-text text-[11px] leading-relaxed">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment input */}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Viết bình luận của bạn…"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendComment(post.id);
                      }}
                      className="flex-1 h-9 px-3 rounded-xl bg-app-background border border-app-border text-xs text-app-text focus:border-app-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendComment(post.id)}
                      className="h-9 w-9 rounded-xl bg-app-primary text-app-on-primary flex items-center justify-center hover:brightness-105 active:scale-95 transition-all shadow-xs"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* CREATE POST MODAL SHEET */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-[28px] sm:rounded-[24px] p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h2 className="text-base font-black text-app-text">Đăng Bài Lên Bản Tin</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background"
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
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-app-background border border-app-border">
                <button
                  type="button"
                  onClick={() => setPostTypeChoice('court_review')}
                  className={`py-2 rounded-lg text-[11px] font-extrabold transition-all ${
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
                  className={`py-2 rounded-lg text-[11px] font-extrabold transition-all ${
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
                  className={`py-2 rounded-lg text-[11px] font-extrabold transition-all ${
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
                <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-app-background border border-app-border">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-app-muted">Chọn sân cầu lông</label>
                    <select
                      value={selectedCourtId}
                      onChange={(e) => setSelectedCourtId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
                    >
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-app-muted">Đánh giá sao (1 - 5 sao)</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingChoice(star)}
                          className="p-1 hover:scale-110 transition-transform"
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
                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-app-background border border-app-border">
                  <label className="text-xs font-bold text-app-muted">Gắn liền với buổi chơi</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-app-surface border border-app-border text-xs text-app-text font-semibold outline-none focus:border-app-primary"
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
                  className="w-full p-3 rounded-xl bg-app-background border border-app-border text-xs sm:text-sm text-app-text focus:border-app-primary focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Media Image URL (Optional) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-app-muted">Đính kèm URL hình ảnh (Tùy chọn)</label>
                <input
                  type="url"
                  placeholder="https://... ảnh sân hoặc đồng đội"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-app-background border border-app-border text-xs text-app-text focus:border-app-primary focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-app-primary text-app-on-primary text-xs font-black uppercase hover:brightness-105 active:scale-95 transition-all shadow-xs"
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
