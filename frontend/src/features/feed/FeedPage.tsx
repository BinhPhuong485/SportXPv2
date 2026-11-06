import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { postService, PostItem, PostCommentItem } from '../../services/postService';
import { managedRoomRepository } from '../rooms/data/managedRoomRepository';
import { ManagedRoomData } from '../rooms/domain/managedRoom';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import { leaderboardRepository } from '../rankings/data/leaderboardRepository';
import { Court, PlayerProfile } from '../../core/types/database.types';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { FeedTab } from './types';
import { FeedDesktopView } from './views/FeedDesktopView';
import { FeedTabletView } from './views/FeedTabletView';
import { FeedMobileView } from './views/FeedMobileView';
import { CommentDrawer } from './components/CommentDrawer';
import { CreatePostModal } from './components/CreatePostModal';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerProfile[]>([]);
  const [urgentRoom, setUrgentRoom] = useState<ManagedRoomData | null>(null);
  const [, setMyRooms] = useState<ManagedRoomData[]>([]);
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
      const [postList, events, courtList, leaderboard, publicRooms] = await Promise.all([
        postService.listPosts(user?.id || null),
        calendarRepository.loadUserCalendarEvents(),
        leaderboardRepository.getCourts(),
        leaderboardRepository.getLeaderboard({ scope: 'national', limit: 5 }),
        managedRoomRepository.list('discover').catch(() => [] as ManagedRoomData[]),
      ]);
      setPosts(postList);
      setUpcomingEvents(events);
      setCourts(courtList);
      setTopPlayers(leaderboard as unknown as PlayerProfile[]);
      if (courtList.length > 0) {
        setSelectedCourtId((prev) => prev || courtList[0].id);
      }

      // Filter open rooms with available slots
      const openRooms = (publicRooms || []).filter(
        (r) => r.status === 'OPEN' && r.reserved < r.capacity
      );
      openRooms.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      const selectedUrgent = openRooms.length > 0 ? openRooms[0] : null;

      if (selectedUrgent && selectedUrgent.members && selectedUrgent.members.length > 0) {
        await managedRoomRepository.enrichMembersWithProfiles(selectedUrgent.members).catch(() => {});
      }
      setUrgentRoom(selectedUrgent);
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

  const sharedProps = {
    posts,
    filteredPosts,
    upcomingEvents,
    activeTab,
    setActiveTab,
    loading,
    profile,
    expandedPostIds,
    onToggleExpand: toggleExpandPost,
    onToggleLike: handleToggleLike,
    onOpenCommentDrawer: handleOpenCommentDrawer,
    onOpenCreateModal: handleOpenCreateModal,
    onRefreshFeed: loadFeed,
    onShowToast: showToast,
    urgentRoom,
    suggestedPlayers: topPlayers,
    courts,
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl text-xs font-black animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-xl mb-4 p-4 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. DESKTOP VIEW (Visible on desktop screen >= 1280px) */}
      <div className="hidden xl:flex justify-center w-full">
        <FeedDesktopView {...sharedProps} />
      </div>

      {/* 2. TABLET / IPAD VIEW (Visible on iPad / tablet screens 768px - 1279px) */}
      <div className="hidden md:flex xl:hidden justify-center w-full">
        <FeedTabletView {...sharedProps} />
      </div>

      {/* 3. MOBILE VIEW (Visible on mobile screen < 768px) */}
      <div className="block md:hidden w-full">
        <FeedMobileView {...sharedProps} />
      </div>

      {/* Shared Slide-Up Comment Drawer */}
      <CommentDrawer
        post={commentDrawerPost}
        comments={commentDrawerPost ? commentsMap[commentDrawerPost.id] || [] : []}
        loading={commentsLoading}
        newCommentText={newCommentText}
        setNewCommentText={setNewCommentText}
        onSendComment={handleSendComment}
        onClose={() => setCommentDrawerPost(null)}
        userAvatarUrl={profile?.avatarUrl}
        userDisplayName={profile?.displayName}
      />

      {/* Shared Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        postTypeChoice={postTypeChoice}
        setPostTypeChoice={setPostTypeChoice}
        contentInput={contentInput}
        setContentInput={setContentInput}
        ratingChoice={ratingChoice}
        setRatingChoice={setRatingChoice}
        mediaUrlInput={mediaUrlInput}
        setMediaUrlInput={setMediaUrlInput}
        formError={formError}
        busy={busy}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};
