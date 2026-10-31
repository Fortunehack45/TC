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

export interface DBComment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  user_profile?: Profile;
  replies?: DBComment[];
  is_liked_by_me?: boolean;
}

export interface DBLike {
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface DBCommentLike {
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface DBBookmark {
  user_id: string;
  article_id: string;
  created_at: string;
}

export type ReportItemType = 'article' | 'comment' | 'reply';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface DBReport {
  id: string;
  reporter_id: string | null;
  item_type: ReportItemType;
  item_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter_email?: string | null;
}

export interface ReportedCommentData {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  author_name: string;
  author_email: string | null;
  author_avatar: string | null;
  article_title?: string;
  article_slug?: string;
  article_category?: string;
  parent_author_name?: string;
  parent_content_snippet?: string;
}

export interface EnrichedReport extends DBReport {
  reported_article?: DBArticle | null;
  reported_comment?: ReportedCommentData | null;
  reporter_profile?: Profile | null;
  item_not_found?: boolean;
}
