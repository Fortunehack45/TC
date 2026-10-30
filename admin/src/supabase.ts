import { createClient } from '@supabase/supabase-js';
import { DBArticle, DBReport, Profile } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yinaxpgnnadhbkplokvl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbmF4cGdubmFkaGJrcGxva3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTYxNDQsImV4cCI6MjEwNzczMjE0NH0.PtGQ_Yy4X-bKEPaukfydrlABsZKiYrzSfQ_Awz5075g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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
