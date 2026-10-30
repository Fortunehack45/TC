import React, { useState, useEffect } from 'react';
import { Article, getRelatedArticles } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { CommentsSection } from './CommentsSection';
import { useAuth } from '../context/AuthContext';
import { toggleArticleLike, getArticleInteractionState, getArticleLikesCount, recordArticleView } from '../lib/supabase';
import { ArrowLeft, Bookmark, Share2, Type, Clock, Calendar, User, Check, Play, Heart, ChevronRight, Home, Tag, Video } from 'lucide-react';
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

  useEffect(() => {
    if (article) {
      window.scrollTo(0, 0);

      // Record real reading view in Supabase (once per browser session per article)
      const viewKey = `tc_viewed_${article.id}`;
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        recordArticleView(article.id);
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
      <div className="bg-[#141414] border-b border-[#252525] py-2.5 px-3 sm:px-6 mb-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-mono-meta tracking-wider uppercase text-stone-400 hover:text-white transition-colors bg-[#1E1E1E] hover:bg-[#282828] px-3.5 py-1.5 rounded-xs border border-[#2E2E2E] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E50914]" />
            <span>BACK</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Like button */}
            <button
              onClick={handleToggleArticleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono-meta font-bold transition-colors ${
                isArticleLiked
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'bg-[#222222] text-stone-300 hover:text-white'
              }`}
              title={isArticleLiked ? 'Unlike Article' : 'Like Article'}
            >
              <Heart className={`w-4 h-4 ${isArticleLiked ? 'fill-white' : ''}`} />
              <span>{articleLikes}</span>
            </button>

            {/* Font size toggle */}
            <div className="flex items-center gap-1 bg-[#222222] p-1 rounded-xs border border-[#333333]">
              <Type className="w-3.5 h-3.5 text-stone-400 hidden sm:inline ml-1" />
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs ${
                  fontSize === 'normal' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                S
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs ${
                  fontSize === 'large' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                M
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs ${
                  fontSize === 'xlarge' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                L
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article.id)}
              className="p-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-[#E50914] rounded-xs transition-colors flex items-center justify-center"
              title={isBookmarked ? 'Saved to Bookmarks' : 'Save Article'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="p-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-white rounded-xs transition-colors flex items-center justify-center"
              title="Share Article Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 mb-6">
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
                onNavigateToSection(article.section);
              } else {
                onClose();
              }
            }}
            className="text-stone-300 hover:text-[#E50914] font-bold uppercase transition-colors"
          >
            {article.section}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
          <span className="text-[#E50914] font-bold uppercase">{article.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0 hidden sm:inline" />
          <span className="text-stone-400 truncate max-w-xs sm:max-w-md hidden sm:inline">{article.title}</span>
        </nav>
      </div>

      {/* Main In-Page Article Body */}
      <article className="w-full max-w-[1200px] mx-auto px-3 sm:px-6 py-2">
        {/* Category kicker */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-meta text-stone-400 mb-4">
          <span className="bg-[#E50914] text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs">
            {article.section} • {article.category}
          </span>
          {article.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#E50914]" /> {article.date}
            </span>
          )}
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-stone-500" /> {article.author}
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1">
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
              className="prose prose-invert max-w-none article-prose prose-headings:font-editorial prose-headings:text-white prose-p:leading-relaxed prose-a:text-[#E50914] prose-blockquote:border-l-4 prose-blockquote:border-[#E50914] prose-blockquote:font-editorial prose-blockquote:italic prose-table:border prose-table:border-[#333] prose-th:bg-[#222] prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-[#333]"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
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
