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

        let authorDisplayName = prof.display_name;
        if (!authorDisplayName || authorDisplayName.trim() === '' || authorDisplayName === 'Vận động viên') {
          if (viewerId && row.author_id === viewerId) {
            try {
              const rawAuth = localStorage.getItem('sb-yjcqaxszvmpnlmypxjqq-auth-token');
              if (rawAuth) {
                const parsed = JSON.parse(rawAuth);
                if (parsed?.user?.user_metadata?.display_name) {
                  authorDisplayName = parsed.user.user_metadata.display_name;
                }
              }
            } catch {
              // ignore
            }
          }
          if ((!authorDisplayName || authorDisplayName === 'Vận động viên') && row.author_id === '9ded99f9-af7d-4297-829a-18e213294403') {
            authorDisplayName = 'Square';
          }
        }

        return {
          id: row.id,
          authorId: row.author_id,
          author: {
            id: prof.id || row.author_id,
            displayName: authorDisplayName || 'Vận động viên',
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

      return mappedPosts;
    } catch (err) {
      console.warn('Failed to load posts from Supabase:', err);
      return [];
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

    // Ensure author profile exists in public.profiles so join succeeds for all feed viewers
    try {
      const { data: profCheck } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', params.authorId)
        .maybeSingle();

      if (!profCheck) {
        await supabase.rpc('get_onboarding_state');
      }
    } catch {
      // non-blocking safeguard
    }

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
        let commentAuthorName = prof.display_name;
        if (!commentAuthorName || commentAuthorName.trim() === '' || commentAuthorName === 'Vận động viên') {
          if (row.author_id === '9ded99f9-af7d-4297-829a-18e213294403') {
            commentAuthorName = 'Square';
          }
        }
        return {
          id: row.id,
          postId: row.post_id,
          authorId: row.author_id,
          authorName: commentAuthorName || 'Vận động viên',
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
    let commentAuthorName = prof.display_name;
    if (!commentAuthorName || commentAuthorName.trim() === '' || commentAuthorName === 'Vận động viên') {
      if (authorId === '9ded99f9-af7d-4297-829a-18e213294403') {
        commentAuthorName = 'Square';
      }
    }
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      authorName: commentAuthorName || 'Vận động viên',
      authorAvatar: prof.avatar_url || null,
      content: data.content,
      createdAt: data.created_at,
    };
  }
}

export const postService = new PostService();

