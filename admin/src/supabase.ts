import { createClient } from '@supabase/supabase-js';
import { DBArticle, DBReport, EnrichedReport, ReportedCommentData, Profile } from './database.types';

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

export async function getArticles(category?: string, includeDrafts = true): Promise<DBArticle[]> {
  try {
    let query = supabase
      .from('tc_articles')
      .select('*')
      .order('created_at', { ascending: false });

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
    console.warn('Error fetching articles:', err);
    return [];
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

export async function getReports(): Promise<EnrichedReport[]> {
  try {
    const { data: rawReports, error } = await supabase
      .from('tc_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!rawReports || rawReports.length === 0) return [];

    const reports = rawReports as DBReport[];

    // 1. Gather all item IDs by type
    const articleIdsToFetch = new Set<string>();
    const commentIdsToFetch = new Set<string>();
    const profileIdsToFetch = new Set<string>();

    for (const r of reports) {
      if (r.reporter_id) profileIdsToFetch.add(r.reporter_id);
      if (r.item_type === 'article') {
        articleIdsToFetch.add(r.item_id);
      } else if (r.item_type === 'comment' || r.item_type === 'reply') {
        commentIdsToFetch.add(r.item_id);
      }
    }

    // 2. Fetch comments for reported comments/replies
    const commentsMap = new Map<string, any>();
    const parentCommentIdsToFetch = new Set<string>();

    if (commentIdsToFetch.size > 0) {
      const { data: commentsData } = await supabase
        .from('tc_comments')
        .select('*')
        .in('id', Array.from(commentIdsToFetch));

      if (commentsData) {
        for (const c of commentsData) {
          commentsMap.set(c.id, c);
          if (c.user_id) profileIdsToFetch.add(c.user_id);
          if (c.article_id) articleIdsToFetch.add(c.article_id);
          if (c.parent_id) parentCommentIdsToFetch.add(c.parent_id);
        }
      }
    }

    // 3. Fetch parent comments for replies (for conversational context)
    const parentCommentsMap = new Map<string, any>();
    if (parentCommentIdsToFetch.size > 0) {
      const { data: parentData } = await supabase
        .from('tc_comments')
        .select('*')
        .in('id', Array.from(parentCommentIdsToFetch));

      if (parentData) {
        for (const p of parentData) {
          parentCommentsMap.set(p.id, p);
          if (p.user_id) profileIdsToFetch.add(p.user_id);
        }
      }
    }

    // 4. Fetch all referenced articles in one batch
    const articlesMap = new Map<string, DBArticle>();
    if (articleIdsToFetch.size > 0) {
      const { data: articlesData } = await supabase
        .from('tc_articles')
        .select('*')
        .in('id', Array.from(articleIdsToFetch));

      if (articlesData) {
        for (const a of articlesData as DBArticle[]) {
          articlesMap.set(a.id, a);
        }
      }
    }

    // 5. Fetch all referenced profiles in one batch
    const profilesMap = new Map<string, Profile>();
    if (profileIdsToFetch.size > 0) {
      const { data: profilesData } = await supabase
        .from('tc_profiles')
        .select('*')
        .in('id', Array.from(profileIdsToFetch));

      if (profilesData) {
        for (const p of profilesData as Profile[]) {
          profilesMap.set(p.id, p);
        }
      }
    }

    // 6. Enrich each report with the live content
    const enriched: EnrichedReport[] = reports.map((r) => {
      const reporterProfile = r.reporter_id ? profilesMap.get(r.reporter_id) || null : null;

      if (r.item_type === 'article') {
        const article = articlesMap.get(r.item_id) || null;
        return {
          ...r,
          reporter_profile: reporterProfile,
          reported_article: article,
          reported_comment: null,
          item_not_found: !article,
        };
      } else {
        const comment = commentsMap.get(r.item_id) || null;
        if (!comment) {
          return {
            ...r,
            reporter_profile: reporterProfile,
            reported_article: null,
            reported_comment: null,
            item_not_found: true,
          };
        }

        const commentAuthor = comment.user_id ? profilesMap.get(comment.user_id) : null;
        const parentComment = comment.parent_id ? parentCommentsMap.get(comment.parent_id) : null;
        const parentAuthor = parentComment && parentComment.user_id ? profilesMap.get(parentComment.user_id) : null;
        const relatedArticle = comment.article_id ? articlesMap.get(comment.article_id) : null;

        const reportedComment: ReportedCommentData = {
          id: comment.id,
          article_id: comment.article_id,
          user_id: comment.user_id,
          parent_id: comment.parent_id,
          content: comment.content,
          likes_count: comment.likes_count || 0,
          created_at: comment.created_at,
          author_name: commentAuthor?.display_name || 'Anonymous Subscriber',
          author_email: commentAuthor?.email || null,
          author_avatar: commentAuthor?.avatar_url || null,
          article_title: relatedArticle?.title,
          article_slug: relatedArticle?.slug,
          article_category: relatedArticle?.category_id,
          parent_author_name: parentAuthor?.display_name || undefined,
          parent_content_snippet: parentComment?.content ? parentComment.content.slice(0, 120) : undefined,
        };

        return {
          ...r,
          reporter_profile: reporterProfile,
          reported_article: relatedArticle || null,
          reported_comment: reportedComment,
          item_not_found: false,
        };
      }
    });

    return enriched;
  } catch (err) {
    console.warn('Error fetching enriched reports:', err);
    return [];
  }
}

export async function updateReportStatus(reportId: string, status: DBReport['status']): Promise<void> {
  const { error } = await supabase
    .from('tc_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('tc_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('tc_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching users:', error);
    return [];
  }
  return (data as Profile[]) || [];
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
  const { error } = await supabase
    .from('tc_profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function updateUserRole(userId: string, role: Profile['role']): Promise<void> {
  const { error } = await supabase
    .from('tc_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('tc_profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}
