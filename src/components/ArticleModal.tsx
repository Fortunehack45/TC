import React, { useState, useEffect } from 'react';
import { Article, getRelatedArticles } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { CommentsSection } from './CommentsSection';
import { ArrowLeft, Bookmark, Share2, Type, Clock, Calendar, User, Check, Play, Heart, ArrowUpRight, ChevronRight, Home } from 'lucide-react';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
  onPlayPodcast?: (article: Article) => void;
  onSelectRelatedArticle?: (article: Article) => void;
  onNavigateToSection?: (section: string) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  isBookmarked,
  onPlayPodcast,
  onSelectRelatedArticle,
  onNavigateToSection,
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);

  // Article Like state persisted in localStorage
  const [articleLikes, setArticleLikes] = useState<number>(128);
  const [isArticleLiked, setIsArticleLiked] = useState<boolean>(false);

  useEffect(() => {
    if (article) {
      window.scrollTo(0, 0);
      try {
        const savedLike = localStorage.getItem(`tan_article_liked_${article.id}`);
        setIsArticleLiked(savedLike === 'true');
        setArticleLikes(savedLike === 'true' ? 129 : 128);
      } catch {
        // Fallback
      }
    }
  }, [article]);

  if (!article) return null;

  const relatedArticles = getRelatedArticles(article);

  const handleToggleArticleLike = () => {
    const nextState = !isArticleLiked;
    setIsArticleLiked(nextState);
    setArticleLikes((prev) => (nextState ? prev + 1 : prev - 1));
    try {
      localStorage.setItem(`tan_article_liked_${article.id}`, nextState ? 'true' : 'false');
    } catch {
      // Ignore
    }
  };

  const copyToClipboard = (text: string) => {
    const triggerSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const fallbackCopy = () => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // Ignore
      }
      triggerSuccess();
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(text)
          .then(() => triggerSuccess())
          .catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.excerpt || article.title,
          url,
        })
        .catch(() => {
          copyToClipboard(url);
        });
    } else {
      copyToClipboard(url);
    }
  };

  const getFontClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-base sm:text-lg leading-relaxed';
      case 'xlarge':
        return 'text-lg sm:text-xl leading-loose';
      default:
        return 'text-sm sm:text-base leading-relaxed';
    }
  };

  return (
    <div className="w-full bg-[#121212] text-stone-200 py-4 sm:py-6 antialiased">
      {/* Sub-Navigation Action Bar */}
      <div className="bg-[#181818] border-y border-[#282828] px-3 sm:px-6 py-2.5 w-full mb-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Simple Clean BACK Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-[#222222] hover:bg-[#E50914] text-white px-3.5 py-2 rounded-xs font-mono-meta text-xs font-bold transition-colors shrink-0 min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="uppercase tracking-wider">BACK</span>
          </button>

          {/* Reader Controls: Like, Font size, Bookmark, Share */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Article Like Button */}
            <button
              onClick={handleToggleArticleLike}
              className={`p-2 rounded-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center font-mono-meta text-xs font-bold gap-1.5 ${
                isArticleLiked
                  ? 'bg-[#E50914] text-white'
                  : 'bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-white'
              }`}
              title={isArticleLiked ? 'Unlike Article' : 'Like Article'}
            >
              <Heart className={`w-4 h-4 ${isArticleLiked ? 'fill-white' : ''}`} />
              <span className="hidden sm:inline">{articleLikes}</span>
            </button>

            {/* Font size toggle */}
            <div className="flex items-center gap-1 bg-[#222222] p-1 rounded-xs border border-[#333333]">
              <Type className="w-3.5 h-3.5 text-stone-400 hidden sm:inline ml-1" />
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs min-h-[32px] ${
                  fontSize === 'normal' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                S
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs min-h-[32px] ${
                  fontSize === 'large' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                M
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs min-h-[32px] ${
                  fontSize === 'xlarge' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                L
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article.id)}
              className="p-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-[#E50914] rounded-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title={isBookmarked ? 'Saved to Bookmarks' : 'Save Article'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="p-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-white rounded-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
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
              <User className="w-3.5 h-3.5 text-stone-400" /> {article.author}
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> {article.readTime}
            </span>
          )}
        </div>

        {/* Main Headline */}
        <h1 className="font-editorial text-2xl sm:text-4xl md:text-5xl font-extrabold text-white uppercase tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        {/* Standfirst / Excerpt */}
        {article.excerpt && (
          <p className="font-editorial italic text-lg sm:text-2xl text-stone-300 pb-8 mb-8 border-b border-[#282828] leading-relaxed">
            "{article.excerpt}"
          </p>
        )}

        {/* Featured Artwork Banner */}
        {article.imageKey && (
          <div className="w-full h-64 sm:h-96 md:h-[480px] rounded-xs overflow-hidden border border-[#282828] mb-10 relative group shadow-2xl">
            <ArtGraphic type={article.imageKey} className="w-full h-full object-cover" />
            {article.section === 'PODCASTS' && onPlayPodcast && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                <button
                  onClick={() => onPlayPodcast(article)}
                  className="bg-[#E50914] hover:bg-[#C40711] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-mono-meta text-xs sm:text-sm font-bold transition-transform hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" /> PLAY FULL AUDIO EPISODE
                </button>
              </div>
            )}
          </div>
        )}

        {/* Body Text */}
        <div className={`font-sans-body text-stone-300 space-y-6 ${getFontClass()}`}>
          {article.fullContent ? (
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
                  'The Global Chronicle provides comprehensive coverage of international news developments.'}
              </p>
              <p>
                From global summits and market shifts to breakthrough genetic research and haute couture presentations, our international team of correspondents delivers authoritative analysis.
              </p>
              <blockquote className="border-y border-[#333333] py-6 my-8 font-editorial italic text-stone-100 text-xl sm:text-2xl text-center leading-relaxed">
                "Independent journalism illuminates truth across geopolitical, economic, and cultural frontiers."
              </blockquote>
              <p>
                Subscribers to The Global Chronicle receive unlimited access to complete digital archives, audio dispatches, and daily editorial dispatches from London, New York, Geneva, Tokyo, and Paris.
              </p>
            </>
          )}
        </div>

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
        />

        {/* Related Articles Section */}
        <section className="mt-14 pt-10 border-t border-[#282828]">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#282828]">
            <h3 className="font-masthead text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
              RELATED ARTICLES
            </h3>
            <span className="font-mono-meta text-xs text-stone-400">RECOMMENDED READING</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  if (onSelectRelatedArticle) {
                    onSelectRelatedArticle(rel);
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-stone-500 p-4 rounded-xs flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="w-full h-40 rounded-xs overflow-hidden mb-3 relative">
                    <ArtGraphic type={rel.imageKey} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono-meta text-[11px] text-stone-400 mb-2 min-w-0 w-full overflow-hidden">
                    <span className="text-[#E50914] font-bold uppercase text-[10px] inline-block truncate shrink min-w-0">{rel.category}</span>
                    <span className="shrink-0 text-[11px] text-stone-400 font-medium whitespace-nowrap ml-auto">{rel.date}</span>
                  </div>
                  <h4 className="font-editorial text-sm font-bold text-white group-hover:text-[#E50914] transition-colors leading-snug line-clamp-2 mb-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-stone-400 font-sans-body line-clamp-2 mb-3">
                    {rel.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-1 font-mono-meta text-[11px] text-stone-300 group-hover:text-[#E50914] pt-2 border-t border-[#222222]">
                  <span>READ STORY</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Article Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-[#282828] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-meta text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span>FILED UNDER:</span>
            <span className="text-white font-bold">{article.section}</span>
            <span>•</span>
            <span className="text-stone-300">{article.category}</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#E50914] hover:bg-[#C40711] text-white px-6 py-3 rounded-xs font-mono-meta font-bold transition-colors text-center min-h-[44px] uppercase tracking-wider"
          >
            ← BACK
          </button>
        </div>
      </article>
    </div>
  );
};
