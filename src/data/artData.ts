import { DBArticle } from '../lib/database.types';
import { computeArticleLifecycle, ArticleLifecycle } from '../lib/lifecycle';

export interface Article {
  id: string;
  section: string;
  category: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  fullContent?: string;
  content_html?: string;
  date: string;
  author?: string;
  readTime?: string;
  imageUrl?: string;
  cover_image_url?: string;
  imageKey?: string;
  tag?: string;
  tags?: string[];
  audioUrl?: string;
  audioDuration?: string;
  views_count?: number;
  likes_count?: number;
  status?: string;
  slug?: string;
  published_at?: string | null;
  lifecycle_stage?: string | null;
  lifecycle?: ArticleLifecycle;
}

export const DEFAULT_FALLBACK_IMAGE = '/og-image.png';

export const handleImageFallback = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  if (!target.src.includes('og-image.png')) {
    target.src = DEFAULT_FALLBACK_IMAGE;
  }
};

// In-memory live cache of database articles loaded from Supabase
let liveArticlesCache: Article[] = [];

export function mapDBArticleToArticle(db: DBArticle): Article {
  // Extract text from content_html for clean excerpt fallback
  const rawHtml = db.content_html || '';
  const textContent = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = db.subtitle || (textContent.length > 180 ? textContent.slice(0, 180) + '...' : textContent);

  const formattedDate = db.published_at
    ? new Date(db.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '30 October 2026';

  return {
    id: db.id,
    section: db.category_id || 'WORLD',
    category: db.category_id || 'WORLD',
    title: db.title,
    subtitle: db.subtitle || undefined,
    excerpt: excerpt,
    fullContent: textContent,
    content_html: rawHtml,
    date: formattedDate,
    author: db.author_name || 'Ajayi-Ojo Progress',
    readTime: db.read_time || '5 min read',
    imageUrl: db.cover_image_url || DEFAULT_FALLBACK_IMAGE,
    cover_image_url: db.cover_image_url || DEFAULT_FALLBACK_IMAGE,
    tag: db.tags && db.tags[0] ? db.tags[0] : db.category_id,
    tags: db.tags || [],
    views_count: db.views_count,
    likes_count: db.likes_count,
    status: db.status,
    slug: db.slug,
    published_at: db.published_at,
    lifecycle_stage: db.lifecycle_stage,
    lifecycle: computeArticleLifecycle(db.published_at, db.lifecycle_stage),
  };
}

export const setLoadedArticles = (articles: Article[]): void => {
  liveArticlesCache = articles;
};

export const getAllArticles = (): Article[] => {
  return liveArticlesCache;
};

export const getArticlesByCategory = (category: string): Article[] => {
  return liveArticlesCache.filter(
    (a) => a.category.toUpperCase() === category.toUpperCase() || a.section.toUpperCase() === category.toUpperCase()
  );
};

export const getRelatedArticles = (currentArticle: Article): Article[] => {
  const all = liveArticlesCache.filter((item) => item.id !== currentArticle.id);

  const sameCategoryOrSection = all.filter(
    (item) =>
      item.category === currentArticle.category ||
      item.section === currentArticle.section
  );

  if (sameCategoryOrSection.length >= 3) {
    return sameCategoryOrSection.slice(0, 3);
  }

  const remainingNeeded = 3 - sameCategoryOrSection.length;
  const backfill = all.filter((item) => !sameCategoryOrSection.includes(item));

  return [...sameCategoryOrSection, ...backfill.slice(0, remainingNeeded)];
};

// Dynamic fallback exports for broadsheet sections
export const HERO_NEWS: Article[] = [];
export const WORLD_POLITICS_ARTICLES: Article[] = [];
export const FINANCE_TECH_ARTICLES: Article[] = [];
export const SCIENCE_LIFESTYLE_ARTICLES: Article[] = [];
export const FASHION_CELEBRITY_ARTICLES: Article[] = [];
export const SPORT_ARTICLES: Article[] = [];
export const EDUCATION_ARTICLES: Article[] = [];
export const BOOKS_ARTICLES: Article[] = [];
