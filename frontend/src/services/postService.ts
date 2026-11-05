import { supabase } from '../core/config/supabase';

export interface PostAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  tierName?: string | null;
}

export interface PostItem {
  id: string;
  authorId: string;
  author: PostAuthor;
  postType: 'general' | 'match_recap' | 'court_review';
  content: string;
  mediaUrls: string[];
  rating?: number | null;
  courtId?: string | null;
  courtName?: string | null;
  courtAddress?: string | null;
  roomId?: string | null;
  roomTitle?: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface PostCommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

export const SEED_COMMUNITY_POSTS: PostItem[] = [
  {
    id: 'seed-match-recap-1',
    authorId: 'seed-user-1',
    author: {
      id: 'seed-user-1',
      displayName: 'Trần Minh Quân',
      avatarUrl: null,
      tierName: 'Trung bình khá · 950 Elo',
    },
    postType: 'match_recap',
    content: 'Trận chung kết giao lưu tối thứ 4 siêu kịch tính cùng cặp đôi Tuấn & Huy tại Sân Kỳ Hòa! Bị dẫn 18-20 ở set 2 nhưng anh em bọc lót smash chuẩn lội ngược dòng 22-20 nghẹt thở 🔥 Cảm ơn 2 bạn đã cống hiến trận cầu mãn nhãn.',
    mediaUrls: ['/assets/demo/badminton_match.jpg'],
    rating: null,
    courtId: 'court-1',
    courtName: 'Sân Cầu Lông Kỳ Hòa (Sân 3)',
    courtAddress: '238 Đường 3/2, Phường 12, Quận 10',
    roomId: 'room-1',
    roomTitle: 'Kèo Đôi Nam Giao Lưu TBK [19:30 - 21:30]',
    likesCount: 32,
    commentsCount: 8,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
  },
  {
    id: 'seed-court-review-1',
    authorId: 'seed-user-2',
    author: {
      id: 'seed-user-2',
      displayName: 'Lê Thu Trang',
      avatarUrl: null,
      tierName: 'Khá · 1200 Elo',
    },
    postType: 'court_review',
    content: 'Review nhanh sân Đào Duy Anh (Phú Nhuận) sau buổi tập sáng nay:\n• Mặt thảm: Thảm Yonex mới tinh, độ nảy và độ bám giày đạt 9.5/10, hạn chế chấn thương cổ chân.\n• Hệ thống đèn: Đèn LED treo bên hông chống chói rất tốt khi ngửa cổ bắt cầu smash.\n• Dịch vụ: Trần cao 10m cực thoáng, bãi đậu xe ô tô rộng rãi, quầy nước đầy đủ.',
    mediaUrls: ['/assets/demo/court_hall.jpg'],
    rating: 5,
    courtId: 'court-2',
    courtName: 'Sân Cầu Lông Đào Duy Anh',
    courtAddress: '21 Đào Duy Anh, Phường 9, Quận Phú Nhuận',
    roomId: null,
    roomTitle: null,
    likesCount: 45,
    commentsCount: 14,
    isLiked: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 7).toISOString(),
  },
  {
    id: 'seed-general-1',
    authorId: 'seed-user-3',
    author: {
      id: 'seed-user-3',
      displayName: 'Nguyễn Tiến Đạt',
      avatarUrl: null,
      tierName: 'Trung bình · 750 Elo',
    },
    postType: 'general',
    content: 'Tối mai (thứ 5) khung giờ 19:30 - 21:30 sân Viettel Tân Bình nhóm mình đang thiếu 1 bạn trình độ TB- đến TB để đánh đôi nam/nam nữ giao lưu vui vẻ. Tiền sân chia đều ~45k/người. Anh em nào rảnh vào ghép kèo nhé!',
    mediaUrls: ['/assets/demo/court_view.jpg'],
    rating: null,
    courtId: 'court-3',
    courtName: 'Sân Cầu Lông Viettel',
    courtAddress: '158 Hoàng Hoa Thám, Tân Bình',
    roomId: null,
    roomTitle: 'Giao lưu cầu lông tối thứ 5',
    likesCount: 18,
    commentsCount: 6,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
];

export class PostService {
  /**
   * Fetch all feed posts (general, match_recap, court_review)
   * enriched with author profile and court/room info.
   */
  async listPosts(viewerId?: string | null): Promise<PostItem[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          author_id,
          court_id,
          room_id,
          post_type,
          content,
          media_urls,
          rating,
          likes_count,
          comments_count,
          created_at,
          profiles:author_id (id, display_name, avatar_url, tier_name),
          courts:court_id (id, name, address),
          match_rooms:room_id (id, title),
          post_comments (count),
          post_likes (count)
        `)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      let userLikedPostIds = new Set<string>();
      if (viewerId) {
        try {
          const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', viewerId);
          if (likes) {
            likes.forEach((l) => userLikedPostIds.add(l.post_id));
          }
        } catch {
          // non-blocking
        }
      }

      const mappedPosts: PostItem[] = data.map((row: any) => {
        const prof = row.profiles || {};
        const court = row.courts || {};
        const room = row.match_rooms || {};

        return {
          id: row.id,
          authorId: row.author_id,
          author: {
            id: prof.id || row.author_id,
            displayName: prof.display_name || 'Vận động viên',
            avatarUrl: prof.avatar_url || null,
            tierName: prof.tier_name || 'Nhập môn',
          },
          postType: (row.post_type || 'general') as PostItem['postType'],
          content: row.content || '',
          mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : [],
          rating: row.rating != null ? Number(row.rating) : null,
          courtId: row.court_id || null,
          courtName: court.name || null,
          courtAddress: court.address || null,
          roomId: row.room_id || null,
          roomTitle: room.title || null,
          likesCount:
            Array.isArray(row.post_likes) && row.post_likes[0]?.count != null
              ? Number(row.post_likes[0].count)
              : Math.max(0, Number(row.likes_count ?? 0)),
          commentsCount:
            Array.isArray(row.post_comments) && row.post_comments[0]?.count != null
              ? Number(row.post_comments[0].count)
              : Math.max(0, Number(row.comments_count ?? 0)),
          isLiked: userLikedPostIds.has(row.id),
          createdAt: row.created_at,
        };
      });

      // Augment with rich badminton showcase posts if feed has few items to display full layout variety
      const existingIds = new Set(mappedPosts.map((p) => p.id));
      const supplementaryPosts = SEED_COMMUNITY_POSTS.filter((p) => !existingIds.has(p.id));
      return [...mappedPosts, ...supplementaryPosts];
    } catch (err) {
      console.warn('Failed to load posts, using seed fallback:', err);
      return SEED_COMMUNITY_POSTS;
    }
  }

  /**
   * Create a new post:
   * - court_review: requires courtId, rating (1-5). Updates court average rating.
   * - match_recap: optional/required roomId.
   * - general: standard post.
   */
  async createPost(params: {
    authorId: string;
    postType: 'general' | 'match_recap' | 'court_review';
    content: string;
    mediaUrls?: string[];
    courtId?: string | null;
    rating?: number | null;
    roomId?: string | null;
  }): Promise<string> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const insertPayload: Record<string, unknown> = {
      author_id: params.authorId,
      post_type: params.postType,
      content: params.content.trim(),
      media_urls: params.mediaUrls || [],
      court_id: params.courtId || null,
      rating: params.rating != null ? params.rating : null,
      room_id: params.roomId || null,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create post:', error);
      throw new Error('Không thể đăng bài viết. Vui lòng thử lại.');
    }

    // If court review, update court average rating & review count
    if (params.postType === 'court_review' && params.courtId && params.rating) {
      try {
        const { data: court } = await supabase
          .from('courts')
          .select('rating, review_count')
          .eq('id', params.courtId)
          .single();

        if (court) {
          const oldCount = court.review_count || 0;
          const oldRating = Number(court.rating || 5.0);
          const newCount = oldCount + 1;
          const newRating = Number((((oldRating * oldCount) + params.rating) / newCount).toFixed(1));

          await supabase
            .from('courts')
            .update({
              rating: newRating,
              review_count: newCount,
            })
            .eq('id', params.courtId);
        }
      } catch (err) {
        console.warn('Could not update court rating:', err);
      }
    }

    return data.id;
  }

  /**
   * Toggle Like on a post (post_likes table).
   */
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    try {
      const { data: existing } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        const count = Math.max(0, (currentPost?.likes_count || 1) - 1);
        await supabase
          .from('posts')
          .update({ likes_count: count })
          .eq('id', postId);

        return false;
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });

        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        const count = (currentPost?.likes_count || 0) + 1;
        await supabase
          .from('posts')
          .update({ likes_count: count })
          .eq('id', postId);

        return true;
      }
    } catch (e) {
      console.error('Like toggle error:', e);
      throw e;
    }
  }

  /**
   * List comments for a post.
   */
  async listComments(postId: string): Promise<PostCommentItem[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          author_id,
          content,
          created_at,
          profiles:author_id (display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => {
        const prof = row.profiles || {};
        return {
          id: row.id,
          postId: row.post_id,
          authorId: row.author_id,
          authorName: prof.display_name || 'Vận động viên',
          authorAvatar: prof.avatar_url || null,
          content: row.content,
          createdAt: row.created_at,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Add a comment to a post.
   */
  async addComment(postId: string, authorId: string, content: string): Promise<PostCommentItem> {
    if (!supabase) throw new Error('Chưa cấu hình Supabase');

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content: content.trim(),
      })
      .select(`
        id,
        post_id,
        author_id,
        content,
        created_at,
        profiles:author_id (display_name, avatar_url)
      `)
      .single();

    if (error || !data) {
      throw new Error('Không thể gửi bình luận.');
    }

    // Increment comments_count
    try {
      const { data: postRow } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('id', postId)
        .single();
      const count = (postRow?.comments_count || 0) + 1;
      await supabase.from('posts').update({ comments_count: count }).eq('id', postId);
    } catch {
      // non-blocking
    }

    const prof = (data as any).profiles || {};
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      authorName: prof.display_name || 'Vận động viên',
      authorAvatar: prof.avatar_url || null,
      content: data.content,
      createdAt: data.created_at,
    };
  }
}

export const postService = new PostService();

