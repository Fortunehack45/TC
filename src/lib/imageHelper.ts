/**
 * Dynamic Article Preview Image Helper
 * Resolves the primary visual asset for an article:
 * 1. Dedicated cover image (`cover_image_url` or `imageUrl`)
 * 2. Video thumbnail/cover if article is a video dispatch (`video_url`)
 * 3. Default fallback publication card (`/og-image.png`)
 */

export function getPostPreviewImage(article?: {
  cover_image_url?: string | null;
  imageUrl?: string | null;
  video_url?: string | null;
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

  // 3. Fallback
  return '/og-image.png';
}

export function isVideoPost(article?: { video_url?: string | null } | null): boolean {
  return Boolean(article?.video_url && article.video_url.trim().length > 0);
}
