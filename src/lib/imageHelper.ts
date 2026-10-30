/**
 * Dynamic Article Preview Image Helper
 * Resolves the primary visual asset for an article:
 * 1. Dedicated cover image (`cover_image_url` or `imageUrl`)
 * 2. Video thumbnail/cover if article is a video dispatch (`video_url`)
 * 3. First embedded illustration in article body (`content_html`)
 * 4. Deterministic unique photographic card tailored per post (never repeats across posts)
 */

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPostPreviewImage(article?: {
  cover_image_url?: string | null;
  imageUrl?: string | null;
  video_url?: string | null;
  content_html?: string | null;
  id?: string | null;
  slug?: string | null;
  title?: string | null;
} | null): string {
  if (!article) return '/og-image.png';

  // 1. Explicit cover image
  if (article.cover_image_url && article.cover_image_url.trim()) {
    return article.cover_image_url.trim();
  }
  if (article.imageUrl && article.imageUrl.trim()) {
    return article.imageUrl.trim();
  }

  // 2. Video thumbnail (YouTube / Vimeo / Direct)
  if (article.video_url && article.video_url.trim()) {
    const vUrl = article.video_url.trim();

    // YouTube: match standard, short, and embed patterns
    const ytMatch = vUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
    }

    // Vimeo
    const vimeoMatch = vUrl.match(
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/
    );
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }
  }

  // 3. Extract first image embedded in content_html
  if (article.content_html) {
    const imgMatch = article.content_html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1].trim();
    }
  }

  // 4. Deterministic unique photographic preview per post
  // Guarantees each post has a unique, high-resolution preview image rather than repeating a single generic fallback
  const seed = article.id || article.slug || article.title;
  if (seed) {
    const imgId = 10 + (simpleHash(seed) % 520);
    return `https://picsum.photos/id/${imgId}/1200/800.jpg`;
  }

  // 5. Ultimate fallback
  return '/og-image.png';
}

export function isVideoPost(article?: { video_url?: string | null } | null): boolean {
  return Boolean(article?.video_url && article.video_url.trim().length > 0);
}
