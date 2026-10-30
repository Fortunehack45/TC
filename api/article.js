/**
 * Serverless Dynamic Link Preview Generator for The Chronicles Dispatches
 * Handles social media crawlers (WhatsApp, Twitter/X, Facebook, LinkedIn, Telegram, Discord, iMessage)
 * and generates dynamic Open Graph and Twitter Card tags featuring the article's title,
 * summary, and cover image (or video thumbnail if a video dispatch).
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SITE_URL = 'https://tc-dusky.vercel.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolveArticleImage(article) {
  // 1. Explicit cover image
  if (article.cover_image_url && article.cover_image_url.trim()) {
    let img = article.cover_image_url.trim();
    if (!img.startsWith('http://') && !img.startsWith('https://')) {
      img = `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
    }
    return img;
  }

  // 2. Video thumbnail/cover (YouTube / Vimeo)
  if (article.video_url && article.video_url.trim()) {
    const vUrl = article.video_url.trim();
    const ytMatch = vUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    const vimeoMatch = vUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }
  }

  // 3. Fallback to default
  return DEFAULT_OG_IMAGE;
}

export default async function handler(req, res) {
  const queryParam = req.query.article || req.query.slug || '';
  const slugOrId = Array.isArray(queryParam) ? queryParam[0] : queryParam;

  if (!slugOrId) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  let article = null;
  try {
    const encodedTarget = encodeURIComponent(slugOrId);
    const endpoint = `${SUPABASE_URL}/rest/v1/tc_articles?or=(slug.eq.${encodedTarget},id.eq.${encodedTarget})&select=*&limit=1`;
    const resp = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        article = data[0];
      }
    }
  } catch (err) {
    console.warn('Could not query Supabase for article preview:', err);
  }

  if (!article) {
    // If not found in DB, redirect to front page
    res.writeHead(302, { Location: `/?article=${encodeURIComponent(slugOrId)}` });
    res.end();
    return;
  }

  const title = escapeHtml(article.title || 'The Chronicles Dispatch');
  const description = escapeHtml(
    article.subtitle ||
    article.excerpt ||
    'Authoritative journalism, breaking dispatches, and investigative reporting across 140 nations.'
  );
  const imageUrl = escapeHtml(resolveArticleImage(article));
  const shortUrl = `${SITE_URL}/p/${encodeURIComponent(article.slug || article.id)}`;
  const destinationUrl = `${SITE_URL}/?article=${encodeURIComponent(article.slug || article.id)}`;
  const authorName = escapeHtml(article.author_name || 'Chronicles Bureau');
  const category = escapeHtml(article.category_id || 'WORLD');

  const html = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - The Chronicles</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${shortUrl}" />
    <link rel="icon" type="image/png" href="${SITE_URL}/favicon.png" />

    <!-- Open Graph (WhatsApp, Facebook, LinkedIn, Discord, Telegram, iMessage) -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="The Chronicles" />
    <meta property="og:url" content="${shortUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="article:section" content="${category}" />
    <meta property="article:author" content="${authorName}" />

    <!-- Twitter / X Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@TheChronicles" />
    <meta name="twitter:url" content="${shortUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- Instant Client Redirect for Human Readers -->
    <meta http-equiv="refresh" content="0; url=${destinationUrl}" />
    <script>
      window.location.replace('${destinationUrl}');
    </script>
    <style>
      body {
        background-color: #121212;
        color: #d6d3d1;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
        text-align: center;
      }
      a {
        color: #E50914;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div>
      <p style="font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #E50914; font-weight: bold;">
        THE CHRONICLES • GLOBAL DISPATCH
      </p>
      <h1 style="font-size: 24px; font-weight: bold; color: #fff; margin: 12px 0;">${title}</h1>
      <p style="font-size: 14px; color: #a8a29e; max-width: 600px; margin: 0 auto 20px;">${description}</p>
      <p style="font-size: 12px; color: #78716c;">
        Opening report... If not redirected automatically, <a href="${destinationUrl}">click here to read</a>.
      </p>
    </div>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
