export type UserRole = 'user' | 'admin' | 'editor';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  status: 'active' | 'inactive';
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string;
  created_at: string;
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface DBArticle {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  category_id: string;
  tags: string[];
  cover_image_url: string | null;
  video_url: string | null;
  content_html: string;
  status: ArticleStatus;
  author_id: string | null;
  author_name: string;
  read_time: string;
  views_count: number;
  likes_count: number;
  published_at: string | null;
  lifecycle_stage?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBReport {
  id: string;
  reporter_id: string | null;
  item_type: 'article' | 'comment' | 'reply';
  item_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_email?: string | null;
}
