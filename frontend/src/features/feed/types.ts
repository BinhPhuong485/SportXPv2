import { PostItem, PostCommentItem } from '../../services/postService';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import { PlayerProfile } from '../profile/domain/playerProfile';

export type FeedTab = 'all' | 'court_review' | 'match_recap' | 'general';

export interface FeedViewProps {
  posts: PostItem[];
  filteredPosts: PostItem[];
  upcomingEvents: CalendarEvent[];
  activeTab: FeedTab;
  setActiveTab: (tab: FeedTab) => void;
  loading: boolean;
  profile: PlayerProfile | null;
  expandedPostIds: Set<string>;
  onToggleExpand: (postId: string) => void;
  onToggleLike: (post: PostItem) => void;
  onOpenCommentDrawer: (post: PostItem) => void;
  onOpenCreateModal: (preset?: 'court_review' | 'match_recap' | 'general') => void;
  onRefreshFeed: () => void;
  onShowToast: (msg: string) => void;
}

export interface CommentDrawerProps {
  post: PostItem | null;
  comments: PostCommentItem[];
  loading: boolean;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  onSendComment: () => void;
  onClose: () => void;
  userAvatarUrl?: string | null;
  userDisplayName?: string | null;
}

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postTypeChoice: 'court_review' | 'match_recap' | 'general';
  setPostTypeChoice: (type: 'court_review' | 'match_recap' | 'general') => void;
  contentInput: string;
  setContentInput: (text: string) => void;
  ratingChoice: number;
  setRatingChoice: (rating: number) => void;
  mediaUrlInput: string;
  setMediaUrlInput: (url: string) => void;
  formError: string | null;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}
