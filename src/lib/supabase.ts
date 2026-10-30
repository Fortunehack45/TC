import { createClient } from '@supabase/supabase-js';
import { DBArticle, DBComment, DBReport, Profile, Category } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Please add them in your Vercel project settings or .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Storage upload helper
export async function uploadMedia(file: File, subfolder = 'uploads'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${subfolder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('tc-media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Media upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('tc-media')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

// Articles API
export async function getArticles(category?: string, includeDrafts = false): Promise<DBArticle[]> {
  try {
    let query = supabase
      .from('tc_articles')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }

    if (category && category !== 'ALL') {
      query = query.eq('category_id', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as DBArticle[]) || [];
  } catch (err) {
    console.warn('Error fetching articles from Supabase:', err);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<DBArticle | null> {
  try {
    const { data, error } = await supabase
      .from('tc_articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return (data as DBArticle) || null;
  } catch (err) {
    console.warn('Error fetching article by slug:', err);
    return null;
  }
}

export async function upsertArticle(article: Partial<DBArticle>): Promise<DBArticle> {
  const now = new Date().toISOString();
  const payload = {
    ...article,
    updated_at: now,
    published_at: article.status === 'published' && !article.published_at ? now : article.published_at,
  };

  const { data, error } = await supabase
    .from('tc_articles')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as DBArticle;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase
    .from('tc_articles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Comments API
export async function getComments(articleId: string, currentUserId?: string): Promise<DBComment[]> {
  try {
    let rawComments: any[] = [];
    const { data, error } = await supabase
      .from('tc_comments')
      .select(`
        *,
        user_profile:tc_profiles (
          id, display_name, avatar_url, role
        )
      `)
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      rawComments = data;
    } else {
      // Fallback: fetch raw comments and attach profiles
      const { data: fallbackComments } = await supabase
        .from('tc_comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (fallbackComments && fallbackComments.length > 0) {
        const uids = Array.from(new Set(fallbackComments.map((c: any) => c.user_id)));
        const { data: profiles } = await supabase
          .from('tc_profiles')
          .select('id, display_name, avatar_url, role')
          .in('id', uids);

        const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        rawComments = fallbackComments.map((c: any) => ({
          ...c,
          user_profile: profMap.get(c.user_id) || {
            id: c.user_id,
            display_name: 'Subscriber',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${c.user_id}&backgroundColor=e50914`,
            role: 'user',
          },
        }));
      }
    }

    let likedCommentIds: Set<string> = new Set();
    if (currentUserId) {
      const { data: likes } = await supabase
        .from('tc_comment_likes')
        .select('comment_id')
        .eq('user_id', currentUserId);
      if (likes) {
        likedCommentIds = new Set(likes.map((l) => l.comment_id));
      }
    }

    const allComments = (rawComments || []).map((c: any) => ({
      ...c,
      is_liked_by_me: likedCommentIds.has(c.id),
      replies: [] as DBComment[],
    })) as DBComment[];

    // Structure into threaded comments
    const topLevel: DBComment[] = [];
    const lookup = new Map<string, DBComment>();

    allComments.forEach((c) => lookup.set(c.id, c));

    allComments.forEach((c) => {
      if (c.parent_id && lookup.has(c.parent_id)) {
        lookup.get(c.parent_id)!.replies!.push(c);
      } else {
        topLevel.push(c);
      }
    });

    return topLevel;
  } catch (err) {
    console.warn('Error fetching comments:', err);
    return [];
  }
}

export async function addComment(
  articleId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<DBComment> {
  // Ensure profile exists for this user in tc_profiles
  try {
    const { data: prof } = await supabase.from('tc_profiles').select('id').eq('id', userId).maybeSingle();
    if (!prof) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await upsertProfile({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Subscriber',
        });
      }
    }
  } catch (err) {
    console.warn('Profile check error before comment insert:', err);
  }

  // 1. Insert comment row directly into tc_comments
  const { data: inserted, error: insertError } = await supabase
    .from('tc_comments')
    .insert({
      article_id: articleId,
      user_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    console.error('Comment insertion error:', insertError);
    throw new Error(insertError?.message || 'Failed to post comment to database.');
  }

  // 2. Fetch the author profile cleanly (completely avoids PostgREST join/cache issues)
  let authorProfile: any = null;
  try {
    const { data: prof } = await supabase
      .from('tc_profiles')
      .select('id, display_name, avatar_url, role')
      .eq('id', userId)
      .maybeSingle();
    authorProfile = prof;
  } catch (err) {
    console.warn('Could not fetch user profile for inserted comment:', err);
  }

  return {
    ...inserted,
    user_profile: authorProfile || {
      id: userId,
      display_name: 'Subscriber',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${userId}&backgroundColor=e50914`,
      role: 'user',
    },
    replies: [],
    is_liked_by_me: false,
  } as DBComment;
}

export async function toggleCommentLike(commentId: string, userId: string, currentlyLiked: boolean): Promise<boolean> {
  if (currentlyLiked) {
    await supabase
      .from('tc_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    return false;
  } else {
    await supabase
      .from('tc_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId,
      });
    return true;
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('tc_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

// Article Likes & Bookmarks API
export async function getArticleInteractionState(articleId: string, userId?: string) {
  if (!userId) return { isLiked: false, isBookmarked: false };

  const [likeRes, bookmarkRes] = await Promise.all([
    supabase.from('tc_likes').select('user_id').eq('article_id', articleId).eq('user_id', userId).maybeSingle(),
    supabase.from('tc_bookmarks').select('user_id').eq('article_id', articleId).eq('user_id', userId).maybeSingle(),
  ]);

  return {
    isLiked: !!likeRes.data,
    isBookmarked: !!bookmarkRes.data,
  };
}

export async function getArticleLikesCount(articleId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('tc_likes')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);
    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.warn('Error fetching likes count:', err);
    return 0;
  }
}

export async function recordArticleView(articleId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('tc_articles')
      .select('views_count')
      .eq('id', articleId)
      .maybeSingle();

    const current = Number(data?.views_count) || 0;
    const next = current + 1;

    await supabase
      .from('tc_articles')
      .update({ views_count: next })
      .eq('id', articleId);

    return next;
  } catch (err) {
    console.warn('Could not record view:', err);
    return 0;
  }
}

export async function toggleArticleLike(articleId: string, userId: string, currentlyLiked: boolean): Promise<boolean> {
  if (currentlyLiked) {
    await supabase.from('tc_likes').delete().eq('article_id', articleId).eq('user_id', userId);
  } else {
    await supabase.from('tc_likes').insert({ article_id: articleId, user_id: userId });
  }

  // Update tc_articles with exact real-world likes count
  const { count } = await supabase
    .from('tc_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId);

  await supabase
    .from('tc_articles')
    .update({ likes_count: count || 0 })
    .eq('id', articleId);

  return !currentlyLiked;
}

export async function toggleArticleBookmark(articleId: string, userId: string, currentlyBookmarked: boolean): Promise<boolean> {
  if (currentlyBookmarked) {
    await supabase.from('tc_bookmarks').delete().eq('article_id', articleId).eq('user_id', userId);
    return false;
  } else {
    await supabase.from('tc_bookmarks').insert({ article_id: articleId, user_id: userId });
    return true;
  }
}

// Reports API
export async function submitReport(
  reporterId: string | null,
  itemType: 'article' | 'comment' | 'reply',
  itemId: string,
  reason: string,
  details?: string
): Promise<void> {
  const { error } = await supabase.from('tc_reports').insert({
    reporter_id: reporterId,
    item_type: itemType,
    item_id: itemId,
    reason,
    details: details || null,
  });

  if (error) throw error;
}

export async function getReports(): Promise<DBReport[]> {
  const { data, error } = await supabase
    .from('tc_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DBReport[]) || [];
}

export async function updateReportStatus(reportId: string, status: DBReport['status']): Promise<void> {
  const { error } = await supabase
    .from('tc_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) throw error;
}

// User Profiles API
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('tc_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching profile:', error);
    return null;
  }
  return data as Profile;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
  const { data, error } = await supabase
    .from('tc_profiles')
    .upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
