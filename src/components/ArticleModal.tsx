import React, { useState, useEffect } from 'react';
import { Article, getRelatedArticles } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { CommentsSection } from './CommentsSection';
import { useAuth } from '../context/AuthContext';
import { toggleArticleLike, getArticleInteractionState, getArticleLikesCount, recordArticleView } from '../lib/supabase';
import { ArrowLeft, Bookmark, Share2, Type, Clock, Calendar, User, Check, Play, Heart, ChevronRight, Home, Tag, Video, Eye } from 'lucide-react';
import { formatProgressiveTimestamp } from '../lib/lifecycle';
import { ShareModal } from './ShareModal';

interface ArticleModalProps {
  article: (Article & { content_html?: string; cover_image_url?: string; video_url?: string; tags?: string[] }) | null;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
  onPlayPodcast?: (article: Article) => void;
  onSelectRelatedArticle?: (article: Article) => void;
  onNavigateToSection?: (section: string) => void;
  onOpenAuth?: () => void;
}

function sanitizeEditorialHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  let html = rawHtml;

  // 1. Remove mojibake characters
  html = html.replace(/[\uFFFD\u0092\u0091]/g, "'");
  html = html.replace(/[\u0093\u0094]/g, '"');

  // 2. Strip raw wire scheduling junk (e.g. Who: Liverpool vs Arsenal What: ... When: ... Where: ... How to follow: ...)
  html = html.replace(/<p><span class="drop-cap-red">[A-Za-z]<\/span>ho:\s*Liverpool vs Arsenal What:[\s\S]*?Humiliated by/gi, '<p><span class="drop-cap-red">H</span>umiliated by');
  html = html.replace(/<p>\s*(?:Who|What|When|Where|How to follow):\s*[^<]+(?:(?:Who|What|When|Where|How to follow):[^<]+)*<\/p>/gi, '');
  html = html.replace(/\b(?:Who|What|When|Where|How to follow):\s*[^<.\n]+\b/gi, '');

  // 3. Fix headings: remove markdown hashes and AI labels (e.g. <h3>## Title</h3> or <h3>Section Heading: Title</h3>)
  html = html.replace(/<h3([^>]*)>\s*(?:#{1,4}\s*|(?:Section\s+Heading|Chapter\s+\d+|Section\s+\d+|Part\s+\d+|Heading):\s*)+/gi, '<h3$1>');

  // 4. Unwrap any existing figures or duplicate blockquotes to avoid nested cascade borders
  html = html.replace(/<\/?figure\b[^>]*>/gi, '');
  while (/<blockquote\b[^>]*>\s*<blockquote\b[^>]*>/i.test(html)) {
    html = html.replace(/<blockquote\b[^>]*>\s*<blockquote\b[^>]*>/gi, '<blockquote>');
  }
  while (/<\/blockquote>\s*<\/blockquote>/i.test(html)) {
    html = html.replace(/<\/blockquote>\s*<\/blockquote>/gi, '</blockquote>');
  }

  // 5. Fix broken blockquote wrappers and stray tags
  html = html.replace(/<\/p>\s*<p>\s*<\/blockquote>/gi, '</p></blockquote>');
  html = html.replace(/<p>\s*<\/blockquote>/gi, '</blockquote>');
  html = html.replace(/<\/blockquote>\s*<p>\s*<\/blockquote>/gi, '</blockquote>');
  html = html.replace(/<\/blockquote>\s*<p>(?=\s*<(?:h[1-6]|div|figure|blockquote|table)|$)/gi, '</blockquote>');

  // 6. Merge adjacent blockquotes or <p> tags where the second is an attribution (e.g. <blockquote>— Will Packer</blockquote>)
  const adjBqRegex = /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>\s*<blockquote\b[^>]*>\s*(?:<p[^>]*>)?\s*(?:&ldquo;|“|"|'|‘|\s)*(?:&mdash;|—|-{1,2}|–)\s*([\s\S]*?)\s*(?:&rdquo;|”|"|'|’|\s)*(?:<\/p>)?\s*<\/blockquote>/gi;
  while (adjBqRegex.test(html)) {
    html = html.replace(adjBqRegex, (_, qInner, spkRaw) => {
      const spk = spkRaw.replace(/<\/?(?:p|span|footer|figcaption)[^>]*>/gi, '').trim().replace(/^['"-—– \t\r\n]+|['"-—– \t\r\n.]+$/g, '');
      return `<blockquote>${qInner}<footer>${spk}</footer></blockquote>`;
    });
  }

  const adjPRegex = /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>\s*<p[^>]*>\s*(?:&ldquo;|“|"|'|‘|\s)*(?:&mdash;|—|-{1,2}|–)\s*([A-Z][a-zA-Z\s.,'"-]{3,80}?)\s*(?:&rdquo;|”|"|'|’|\s)*<\/p>/gi;
  while (adjPRegex.test(html)) {
    html = html.replace(adjPRegex, (_, qInner, spkRaw) => {
      const spk = spkRaw.replace(/<\/?(?:p|span|footer|figcaption)[^>]*>/gi, '').trim().replace(/^['"-—– \t\r\n]+|['"-—– \t\r\n.]+$/g, '');
      return `<blockquote>${qInner}<footer>${spk}</footer></blockquote>`;
    });
  }

  // 7. Standardize blockquotes into exactly ONE clean broadsheet pullquote with correct speaker attribution
  html = html.replace(/([\s\S]{0,450})<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, beforeContext, bqInner) => {
    let inner = bqInner;
    let speaker = '';

    // First check inside the quote for footer or figcaption
    const footerMatch = inner.match(/<(?:footer|figcaption)[^>]*>\s*(?:<span[^>]*><\/span>)?\s*(?:&mdash;|—|-)?\s*([\s\S]*?)<\/(?:footer|figcaption)>/i);
    if (footerMatch) {
      const rawSpk = footerMatch[1].replace(/<[^>]+>/g, '').trim().replace(/^['"-— \t\r\n]+|['"-— \t\r\n]+$/g, '');
      if (!/desk|affairs|statutory|disclosure|editorial/i.test(rawSpk)) {
        speaker = rawSpk;
      }
      inner = inner.replace(/<(?:footer|figcaption)[^>]*>[\s\S]*?<\/(?:footer|figcaption)>/gi, '');
    }

    // Check if inner ends with trailing attribution: — Speaker
    if (!speaker) {
      const endSpkMatch = inner.trim().match(/(?:&mdash;|—|-{1,2}|–)\s*([A-Z][a-zA-Z\s.,'"-]{3,80})$/);
      if (endSpkMatch) {
        const rawSpk = endSpkMatch[1].replace(/<[^>]+>/g, '').trim().replace(/^['"-—– \t\r\n]+|['"-—– \t\r\n.]+$/g, '');
        if (!/desk|affairs|statutory|disclosure|editorial/i.test(rawSpk) && rawSpk.length > 2) {
          speaker = rawSpk;
          inner = inner.slice(0, inner.lastIndexOf(endSpkMatch[0])).trim();
        }
      }
    }

    // If speaker is still empty, extract from the preceding text context
    if (!speaker && beforeContext) {
      const spkRoleMatch = beforeContext.match(/([A-Z][a-zA-Z\s.\'-]{2,35})\s*\(([^)]+)\)\s*:/);
      if (spkRoleMatch) {
        const name = spkRoleMatch[1].trim();
        const role = spkRoleMatch[2].trim();
        if (!/desk|affairs|statutory|disclosure|editorial|section|part|chapter/i.test(name)) {
          speaker = `${name}, ${role}`;
        }
      } else {
        const spkSaidMatch = beforeContext.match(/([A-Z][a-zA-Z\s.\'-]{2,35})\s*,\s*([^<.,\n]+?)\s*,\s*(?:said|stated|remarked|declared|noted|explained|added)\b/i);
        if (spkSaidMatch) {
          const name = spkSaidMatch[1].trim();
          const role = spkSaidMatch[2].trim();
          if (!/desk|affairs|statutory|disclosure|editorial/i.test(name)) {
            speaker = `${name}, ${role}`;
          }
        } else {
          const verbMatch = beforeContext.match(/(?:said|stated|remarked|declared|noted|warned|explained)\s+([A-Z][a-zA-Z\s.\'-]{2,35})(?:\s*,\s*([^<.,\n]+))?/i);
          if (verbMatch) {
            const name = verbMatch[1].trim();
            const role = verbMatch[2] ? verbMatch[2].trim() : '';
            if (!/desk|affairs|statutory|disclosure|editorial/i.test(name)) {
              speaker = role ? `${name}, ${role}` : name;
            }
          } else {
            const colonMatch = beforeContext.match(/([A-Z][a-zA-Z\s.\'-]{2,30})\s*:\s*["“']/);
            if (colonMatch) {
              const name = colonMatch[1].trim();
              if (!/desk|affairs|statutory|disclosure|editorial|section|part|chapter|who|what|when|where|note/i.test(name)) {
                speaker = name;
              }
            }
          }
        }
      }
    }

    let quoteText = inner.replace(/<\/?(?:p|blockquote)[^>]*>/gi, '').trim();
    quoteText = quoteText.replace(/^(?:&ldquo;|“|"|'|‘|\s)+|(?:&rdquo;|”|"|'|’|\s)+$/g, '').trim();
    quoteText = quoteText.replace(/[,;]\.([”"’'])/g, '.$1').replace(/\.[,;]([”"’'])/g, '.$1');
    quoteText = quoteText.replace(/([.,;!?])[.,;!?]+/g, '$1');
    if (quoteText && !/[.!?]$/.test(quoteText)) quoteText += '.';

    // Discard isolated attribution blockquote that has no quote content
    if (!quoteText || /^(?:&mdash;|—|-{1,2}|–)\s*[A-Z]/.test(quoteText)) {
      return beforeContext;
    }

    const figCap = speaker
      ? `<figcaption class="mt-3.5 text-xs font-mono-meta text-stone-400 not-italic uppercase tracking-wider flex items-center gap-2"><span class="w-5 h-0.5 bg-[#E50914] inline-block shrink-0"></span><span>${speaker}</span></figcaption>`
      : '';
    return `${beforeContext}<figure class="my-8 py-5 px-6 border-l-4 border-[#E50914] bg-[#161616]/90 rounded-r-xs shadow-md"><blockquote class="font-editorial italic text-stone-100 text-lg sm:text-xl leading-relaxed border-none pl-0 m-0">&ldquo;${quoteText}&rdquo;</blockquote>${figCap}</figure>`;
  });

  // 5. Convert ASCII and Markdown tables into responsive broadsheet tables
  const tableBlockRegex = /(?:<p>\s*([A-Z0-9\s()&;:/\.,'"-]{4,90})\s*<\/p>\s*)?((?:<p>\s*(?:\+[-+]+\+|\|(?:(?!<\/p>)[\s\S])+)\s*<\/p>\s*){2,})/gi;
  html = html.replace(tableBlockRegex, (_, preTitle, rawBlock) => {
    let title = '';
    let leadHtml = '';
    if (preTitle) {
      const ptClean = preTitle.trim();
      if (ptClean.split(/\s+/).length > 12 || ptClean.endsWith('.')) {
        leadHtml = `<p>${preTitle}</p>`;
      } else {
        title = ptClean;
      }
    }

    const pLines = Array.from(rawBlock.matchAll(/<p>\s*([\s\S]*?)\s*<\/p>/gi)).map((m: any) => m[1].trim());
    const rows: string[][] = [];
    let isDiagram = false;

    for (const line of pLines) {
      if (/^\+[-+=]+\+$/.test(line) || /^\|[-+=|]+\|$/.test(line)) continue;
      if (line.includes('<---') || line.includes('--->') || /\s+\^\s+/.test(line)) {
        isDiagram = true;
      }
      if (line.startsWith('|') && line.endsWith('|')) {
        const inner = line.slice(1, -1);
        rows.push(inner.split('|').map((c: string) => c.trim()));
      } else if (line.startsWith('|')) {
        rows.push(line.slice(1).split('|').map((c: string) => c.trim()));
      } else {
        rows.push([line]);
      }
    }

    if (rows.length === 0) return rawBlock;

    if (rows[0].length === 1 && !title) {
      const cand = rows[0][0].replace(/^[ -*•]+|[ -*•]+$/g, '');
      if (cand.length > 3 && (cand === cand.toUpperCase() || cand.split(/\s+/).length <= 10)) {
        title = cand;
        rows.shift();
      }
    }
    if (rows.length === 0) return rawBlock;

    if (isDiagram) {
      const rawText = pLines.filter((l: string) => !/^\+[-+=]+\+$/.test(l)).map((l: string) => l.replace(/^\||\|$/g, '')).join('\n');
      const titleHtml = title ? `<div class="p-3 font-editorial font-bold text-stone-200 uppercase tracking-wider bg-[#1B1B1B] border-b border-[#2D2D2D]">${title}</div>` : '';
      return `${leadHtml}<div class="my-6 border border-[#2D2D2D] rounded-xs bg-[#161616] overflow-hidden">${titleHtml}<pre class="p-4 overflow-x-auto font-mono text-xs sm:text-sm text-stone-300 leading-relaxed bg-[#111111]">${rawText}</pre></div>`;
    }

    const maxCols = Math.max(...rows.map((r: string[]) => r.length));
    if (maxCols === 1) {
      const titleHtml = title ? `<div class="p-3 font-editorial font-bold text-stone-200 uppercase tracking-wider bg-[#1B1B1B] border-b border-[#2D2D2D]">${title}</div>` : '';
      const itemsHtml = rows.map((r: string[]) => {
        const val = r[0].replace(/^[ -*•]+|[ -*•]+$/g, '');
        return val ? `<div class="py-2.5 px-4 border-b border-[#262626] last:border-b-0 flex items-start gap-2.5"><span class="text-[#E50914] font-bold mt-0.5">&bull;</span><span class="text-stone-300 text-xs sm:text-sm font-sans-body">${val}</span></div>` : '';
      }).filter(Boolean).join('');
      return `${leadHtml}<div class="my-6 border border-[#2D2D2D] rounded-xs bg-[#161616] overflow-hidden">${titleHtml}<div class="divide-y divide-[#222222]">${itemsHtml}</div></div>`;
    }

    const headerRow = rows[0];
    const dataRows = rows.slice(1);
    const captionHtml = title ? `<caption class="p-3 text-left font-editorial font-bold text-stone-200 uppercase tracking-wider bg-[#1B1B1B] border-b border-[#2D2D2D]">${title}</caption>` : '';
    const thCells = headerRow.map((c: string) => `<th class="py-2.5 px-4 font-semibold uppercase tracking-wider border-r border-[#262626] last:border-r-0">${c}</th>`).join('');
    const theadHtml = `<thead class="bg-[#1F1F1F] text-[#E50914] font-bold border-b border-[#2D2D2D]"><tr>${thCells}</tr></thead>`;
    const trList = dataRows.map((row: string[]) => {
      while (row.length < maxCols) row.push('');
      const tdCells = row.map((c: string) => `<td class="py-2.5 px-4 border-r border-[#222222] last:border-r-0">${c}</td>`).join('');
      return `<tr class="hover:bg-[#1E1E1E]/60 transition-colors odd:bg-[#161616] even:bg-[#191919]">${tdCells}</tr>`;
    }).join('');
    const tbodyHtml = `<tbody class="divide-y divide-[#262626] text-stone-300 font-mono-meta text-xs sm:text-sm">${trList}</tbody>`;
    return `${leadHtml}<div class="my-6 overflow-x-auto border border-[#2D2D2D] rounded-xs bg-[#161616] shadow-md"><table class="w-full text-left font-mono-meta text-xs sm:text-sm border-collapse">${captionHtml}${theadHtml}${tbodyHtml}</table></div>`;
  });

  // 6. Fix punctuation spacing
  html = html.replace(/([a-z0-9])\.([A-Z])/g, '$1. $2');
  html = html.replace(/([a-zA-Z0-9]),([a-zA-Z])/g, '$1, $2');
  html = html.replace(/([a-zA-Z0-9]):([A-Z])/g, '$1: $2');
  html = html.replace(/([a-zA-Z0-9]);([a-zA-Z])/g, '$1; $2');

  // 7. Format ASCII workflow arrows (+--->) into elegant broadsheet callout chips
  html = html.replace(/<p>\s*\+--+>\s*(.*?)\s*<\/p>/gi, '<div class="my-2 py-2 px-3.5 border-l-2 border-[#E50914] bg-[#161616] text-stone-300 text-xs sm:text-sm flex items-center gap-2.5 rounded-r-xs"><span class="text-[#E50914] font-bold">&rarr;</span><span>$1</span></div>');

  // 8. Clean up redundant empty tags and residual paragraph wrappers
  html = html.replace(/<p>\s*<\/p>/gi, '');
  html = html.replace(/<p>\s*(<(?:figure|div|table|h[1-6]|ul|ol|pre)\b)/gi, '$1');
  html = html.replace(/(<\/(?:figure|div|table|h[1-6]|ul|ol|pre)>)\s*<\/p>/gi, '$1');

  return html;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  isBookmarked,
  onPlayPodcast,
  onSelectRelatedArticle,
  onNavigateToSection,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Real Article Like state
  const [articleLikes, setArticleLikes] = useState<number>(0);
  const [isArticleLiked, setIsArticleLiked] = useState<boolean>(false);
  const [viewsCount, setViewsCount] = useState<number>(Number(article?.views_count) || 0);

  useEffect(() => {
    if (article) {
      window.scrollTo(0, 0);
      setViewsCount(Number(article.views_count) || 0);

      // Record real reading view in Supabase (once per browser session per article)
      const viewKey = `tc_viewed_${article.id}`;
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        recordArticleView(article.id).then((nextViews) => {
          if (nextViews > 0) setViewsCount(nextViews);
        });
      }

      // Fetch actual real likes count from Supabase tc_likes
      getArticleLikesCount(article.id).then((count) => {
        setArticleLikes(count);
      });

      // Check interaction state in Supabase
      if (user) {
        getArticleInteractionState(article.id, user.id).then((state) => {
          setIsArticleLiked(state.isLiked);
        });
      } else {
        try {
          const savedLike = localStorage.getItem(`tan_article_liked_${article.id}`);
          setIsArticleLiked(savedLike === 'true');
        } catch {}
      }
    }
  }, [article, user?.id]);

  if (!article) return null;

  const relatedArticles = getRelatedArticles(article as Article);

  const handleToggleArticleLike = async () => {
    if (!user) {
      onOpenAuth?.();
      return;
    }

    const nextState = !isArticleLiked;
    setIsArticleLiked(nextState);
    setArticleLikes((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleArticleLike(article.id, user.id, isArticleLiked);
    } catch (err) {
      console.warn('Failed to toggle like in Supabase:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    const triggerSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(triggerSuccess).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const getFontClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg sm:text-xl leading-relaxed sm:leading-loose';
      case 'xlarge':
        return 'text-xl sm:text-2xl leading-loose';
      default:
        return 'text-base sm:text-lg leading-relaxed';
    }
  };

  return (
    <div className="w-full bg-[#121212] text-stone-200">
      {/* Top Secondary Action Bar */}
      <div className="bg-[#141414] border-b border-[#252525] py-2 px-2.5 sm:px-6 mb-6 sticky top-12 z-30 shadow-md">
        <div className="w-full max-w-[98%] 2xl:max-w-[1480px] mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-mono-meta tracking-wider uppercase text-stone-400 hover:text-white transition-colors bg-[#1E1E1E] hover:bg-[#282828] px-2.5 sm:px-3.5 py-1.5 rounded-xs border border-[#2E2E2E] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#E50914]" />
            <span className="font-bold">BACK</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Views counter */}
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xs text-xs font-mono-meta font-bold bg-[#222222] text-stone-300 border border-[#333333]">
              <Eye className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] sm:text-xs">{viewsCount.toLocaleString()} views</span>
            </div>

            {/* Like button */}
            <button
              onClick={handleToggleArticleLike}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xs text-xs font-mono-meta font-bold transition-colors ${
                isArticleLiked
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#222222] text-stone-300 hover:text-white'
              }`}
              title={isArticleLiked ? 'Unlike Article' : 'Like Article'}
            >
              <Heart className={`w-3.5 h-3.5 ${isArticleLiked ? 'fill-white' : ''}`} />
              <span className="text-[11px] sm:text-xs">{articleLikes}</span>
            </button>

            {/* Font size toggle */}
            <div className="flex items-center gap-0.5 bg-[#222222] p-0.5 sm:p-1 rounded-xs border border-[#333333]">
              <Type className="w-3.5 h-3.5 text-stone-400 hidden sm:inline ml-1" />
              <button
                onClick={() => setFontSize('normal')}
                className={`w-6 h-6 text-[10px] sm:text-xs font-mono-meta font-bold rounded-xs flex items-center justify-center ${
                  fontSize === 'normal' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                S
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`w-6 h-6 text-[10px] sm:text-xs font-mono-meta font-bold rounded-xs flex items-center justify-center ${
                  fontSize === 'large' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                M
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`w-6 h-6 text-[10px] sm:text-xs font-mono-meta font-bold rounded-xs flex items-center justify-center ${
                  fontSize === 'xlarge' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                L
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article.id)}
              className="p-1.5 sm:p-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-[#E50914] rounded-xs transition-colors flex items-center justify-center"
              title={isBookmarked ? 'Saved to Bookmarks' : 'Save Article'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="p-1.5 sm:p-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-white rounded-xs transition-colors flex items-center justify-center"
              title="Share Article Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="w-full max-w-[94%] 2xl:max-w-[1480px] mx-auto px-2 sm:px-4 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 font-mono-meta text-xs text-stone-400 py-1 px-3 bg-[#181818] border border-[#262626] rounded-xs">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-stone-400 hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold">HOME</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
          <button
            onClick={() => {
              if (onNavigateToSection) {
                onNavigateToSection(article.category);
              } else {
                onClose();
              }
            }}
            className="text-[#E50914] hover:underline font-bold uppercase transition-colors"
          >
            {article.category}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0 hidden sm:inline" />
          <span className="text-stone-400 truncate max-w-xs sm:max-w-md hidden sm:inline">{article.title}</span>
        </nav>
      </div>

      {/* Main In-Page Article Body (Broadsheet Reading Measure Closer to Edges) */}
      <article className="w-full max-w-[96%] xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 py-6">
        {/* Category kicker */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono-meta text-stone-400 mb-4">
          <span className="bg-[#E50914] text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs whitespace-nowrap">
            {article.category}
          </span>
          {article.date && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-[#E50914]" /> {formatProgressiveTimestamp(article.published_at || article.date)}
            </span>
          )}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Eye className="w-3.5 h-3.5 text-stone-500" /> {viewsCount.toLocaleString()} views
          </span>
          {article.author && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <User className="w-3.5 h-3.5 text-stone-500" /> {article.author}
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-stone-500" /> {article.readTime}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 className="font-editorial text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight sm:leading-tight tracking-tight mb-6">
          {article.title}
        </h1>

        {/* Subtitle / Excerpt */}
        {article.excerpt && (
          <p className="font-editorial text-lg sm:text-2xl text-stone-300 italic border-l-4 border-[#E50914] pl-4 py-1 mb-8 leading-relaxed font-normal">
            {article.excerpt}
          </p>
        )}

        {/* Cover Artwork or Image */}
        {article.cover_image_url ? (
          <div className="w-full h-64 sm:h-96 md:h-[480px] rounded-xs overflow-hidden border border-[#282828] mb-10 relative group shadow-2xl">
            <img
              src={article.cover_image_url || article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/og-image.png';
              }}
            />
          </div>
        ) : article.imageKey ? (
          <div className="w-full h-64 sm:h-96 md:h-[480px] rounded-xs overflow-hidden border border-[#282828] mb-10 relative group shadow-2xl">
            <ArtGraphic type={article.imageKey} className="w-full h-full object-cover" />
            {article.section === 'PODCASTS' && onPlayPodcast && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                <button
                  onClick={() => onPlayPodcast(article as Article)}
                  className="bg-[#E50914] hover:bg-[#C40711] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-mono-meta text-xs sm:text-sm font-bold transition-transform hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" /> PLAY FULL AUDIO EPISODE
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Video Embed if Present */}
        {article.video_url && (
          <div className="w-full aspect-video rounded-xs overflow-hidden border border-[#282828] mb-10 shadow-2xl bg-black">
            {article.video_url.includes('youtube.com') || article.video_url.includes('youtu.be') ? (
              <iframe
                src={article.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title={article.title}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full" src={article.video_url}>
                Your browser does not support HTML5 video.
              </video>
            )}
          </div>
        )}

        {/* Body Text (Renders Rich HTML or paragraphs) */}
        <div className={`font-sans-body text-stone-300 space-y-6 ${getFontClass()}`}>
          {article.content_html ? (
            <div
              className="prose prose-invert max-w-none article-prose prose-headings:font-editorial prose-headings:text-white prose-p:text-base sm:prose-p:text-lg prose-p:leading-[1.85] prose-p:text-stone-300 prose-a:text-[#E50914] prose-blockquote:border-none prose-blockquote:pl-0 prose-blockquote:my-0 prose-blockquote:font-editorial prose-blockquote:italic prose-h3:text-2xl sm:prose-h3:text-3xl prose-h3:border-b prose-h3:border-[#2A2A2A] prose-h3:pb-2 prose-h3:mt-10 prose-h3:mb-4 prose-table:border prose-table:border-[#333] prose-th:bg-[#222] prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-[#333]"
              dangerouslySetInnerHTML={{ __html: sanitizeEditorialHtml(article.content_html) }}
            />
          ) : article.fullContent ? (
            article.fullContent.split('\n\n').map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? 'first-letter:text-5xl sm:first-letter:text-6xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#E50914]'
                    : ''
                }
              >
                {paragraph}
              </p>
            ))
          ) : (
            <>
              <p className="first-letter:text-5xl sm:first-letter:text-6xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#E50914]">
                {article.excerpt ||
                  'The Chronicles provides comprehensive coverage of international news developments.'}
              </p>
              <p>
                From global summits and market shifts to breakthrough genetic research and haute couture presentations, our international team of correspondents delivers authoritative analysis.
              </p>
              <blockquote className="border-y border-[#333333] py-6 my-8 font-editorial italic text-stone-100 text-xl sm:text-2xl text-center leading-relaxed">
                &ldquo;Independent journalism illuminates truth across geopolitical, economic, and cultural frontiers.&rdquo;
              </blockquote>
              <p>
                Subscribers to The Chronicles receive unlimited access to complete digital archives, audio dispatches, and daily editorial dispatches from London, New York, Geneva, Tokyo, and Paris.
              </p>
            </>
          )}
        </div>

        {/* Tag Chips */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#262626] flex items-center flex-wrap gap-2">
            <span className="font-mono-meta text-xs text-stone-500 uppercase flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> TAGS:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-[#1C1C1C] border border-[#2D2D2D] text-stone-300 px-2.5 py-1 text-xs font-mono-meta rounded-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Interactive Reader Discussion & Forum */}
        <CommentsSection
          articleId={article.id}
          articleTitle={article.title}
          articleLikes={articleLikes}
          isArticleLiked={isArticleLiked}
          onToggleArticleLike={handleToggleArticleLike}
          isBookmarked={isBookmarked}
          onToggleBookmark={() => onToggleBookmark(article.id)}
          onShare={handleShare}
          copiedShareLink={copied}
          onOpenAuth={onOpenAuth}
        />

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-14 pt-10 border-t border-[#282828]">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#282828]">
              <h3 className="font-masthead text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
                RELATED DISPATCHES
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelatedArticle?.(rel)}
                  className="group bg-[#161616] border border-[#262626] p-4 cursor-pointer hover:border-[#E50914] transition-colors flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider mb-2 inline-block">
                      {rel.category}
                    </span>
                    <h4 className="font-editorial text-base font-bold text-white group-hover:underline line-clamp-2 mb-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-stone-400 line-clamp-2 font-sans-body mb-3">
                      {rel.excerpt}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono-meta text-stone-500 pt-2 border-t border-[#222]">
                    {rel.readTime || '5 min read'} &bull; {rel.author}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        article={article}
      />
    </div>
  );
};
