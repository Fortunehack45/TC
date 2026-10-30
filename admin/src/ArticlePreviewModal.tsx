import React, { useState, useEffect } from 'react';
import {
  X, Calendar, User, Clock, Tag, ArrowLeft, Bookmark, Share2,
  Type, Heart, ChevronRight, Home, Video, Play, MessageSquare, Send
} from 'lucide-react';
import { ArticleStatus } from './database.types';
import { getPostPreviewImage } from './lib/imageHelper';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  coverImageUrl: string;
  videoUrl: string;
  contentHtml: string;
  authorName: string;
  readTime: string;
  status: ArticleStatus;
  publishedAt?: string;
}

export const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  category,
  tags,
  coverImageUrl,
  videoUrl,
  contentHtml,
  authorName,
  readTime,
  status,
  publishedAt,
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate dynamic editorial metrics
  const plainText = contentHtml ? contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const estimatedReadTime = readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const finalCover = coverImageUrl || getPostPreviewImage({ cover_image_url: coverImageUrl, video_url: videoUrl });

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#121212] text-stone-200">
      {/* Top Banner Indicator: Preview Notice */}
      <div className="bg-[#1A1A1A] border-b border-[#282828] py-1.5 px-4 text-center text-[11px] font-mono-meta tracking-widest text-amber-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>EDITORIAL ACCURACY PREVIEW • EXACT BLOG WEBSITE RENDERING</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-stone-400 hidden sm:inline">STATUS: {status.toUpperCase()}</span>
          <button
            onClick={onClose}
            className="text-white hover:text-[#E50914] transition-colors font-bold uppercase text-[10px] cursor-pointer"
          >
            ✕ RETURN TO CONSOLE
          </button>
        </div>
      </div>

      {/* Top Secondary Action Bar (Exact copy of Main Blog ArticleModal) */}
      <div className="bg-[#141414] border-b border-[#252525] py-2.5 px-3 sm:px-6 mb-6 sticky top-0 z-40 shadow-md">
        <div className="w-full max-w-[94%] 2xl:max-w-[1480px] mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-mono-meta tracking-wider uppercase text-stone-400 hover:text-white transition-colors bg-[#1E1E1E] hover:bg-[#282828] px-3.5 py-1.5 rounded-xs border border-[#2E2E2E] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E50914]" />
            <span>BACK</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Like button */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono-meta font-bold bg-[#222222] text-stone-300">
              <Heart className="w-4 h-4 text-[#E50914]" />
              <span>142</span>
            </div>

            {/* Font size toggle */}
            <div className="flex items-center gap-1 bg-[#222222] p-1 rounded-xs border border-[#333333]">
              <Type className="w-3.5 h-3.5 text-stone-400 hidden sm:inline ml-1" />
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs cursor-pointer ${
                  fontSize === 'normal' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                S
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs cursor-pointer ${
                  fontSize === 'large' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                M
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 text-xs font-mono-meta font-bold rounded-xs cursor-pointer ${
                  fontSize === 'xlarge' ? 'bg-[#E50914] text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                L
              </button>
            </div>

            {/* Bookmark button */}
            <div className="p-2 bg-[#222222] text-stone-300 rounded-xs flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>

            {/* Share button */}
            <div className="p-2 bg-[#222222] text-stone-300 rounded-xs flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar (Exact copy of Main Blog) */}
      <div className="w-full max-w-[94%] 2xl:max-w-[1480px] mx-auto px-2 sm:px-4 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 font-mono-meta text-xs text-stone-400 py-1.5 px-3 bg-[#181818] border border-[#262626] rounded-xs">
          <div className="flex items-center gap-1 text-stone-400">
            <Home className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold">HOME</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
          <span className="text-stone-300 font-bold uppercase">{category || 'WORLD'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
          <span className="text-[#E50914] font-bold uppercase">DISPATCH</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0 hidden sm:inline" />
          <span className="text-stone-400 truncate max-w-xs sm:max-w-md hidden sm:inline">{title || 'Untitled'}</span>
        </nav>
      </div>

      {/* Main In-Page Article Body (Exact styling from ArticleModal.tsx) */}
      <article className="w-full max-w-[94%] 2xl:max-w-[1480px] mx-auto px-2 sm:px-4 py-2">
        {/* Category kicker */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-meta text-stone-400 mb-4">
          <span className="bg-[#E50914] text-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs">
            {category || 'WORLD'} • DISPATCH
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#E50914]" /> {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-stone-500" /> {authorName || 'Ajayi-Ojo Progress'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-500" /> {estimatedReadTime}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-editorial text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight sm:leading-tight tracking-tight mb-6">
          {title || 'Untitled Dispatch'}
        </h1>

        {/* Subtitle / Excerpt */}
        {subtitle && (
          <p className="font-editorial text-lg sm:text-2xl text-stone-300 italic border-l-4 border-[#E50914] pl-4 py-1 mb-8 leading-relaxed font-normal">
            {subtitle}
          </p>
        )}

        {/* Cover Artwork or Image */}
        {finalCover && finalCover !== '/og-image.png' ? (
          <div className="w-full h-64 sm:h-96 md:h-[480px] rounded-xs overflow-hidden border border-[#282828] mb-10 relative group shadow-2xl">
            <img
              src={finalCover}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/og-image.png';
              }}
            />
          </div>
        ) : null}

        {/* Embedded Video Player if Provided */}
        {videoUrl && (
          <div className="w-full aspect-video rounded-xs overflow-hidden border border-[#282828] mb-10 shadow-2xl bg-black">
            {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title={title}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full" src={videoUrl}>
                Your browser does not support HTML5 video.
              </video>
            )}
          </div>
        )}

        {/* Body Text (Renders Rich HTML or Prose) */}
        <div className={`font-sans-body text-stone-300 space-y-6 ${getFontClass()}`}>
          <div
            className="prose prose-invert max-w-none article-prose prose-headings:font-editorial prose-headings:text-white prose-p:leading-relaxed prose-a:text-[#E50914] prose-blockquote:border-l-4 prose-blockquote:border-[#E50914] prose-blockquote:font-editorial prose-blockquote:italic prose-table:border prose-table:border-[#333] prose-th:bg-[#222] prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-[#333]"
            dangerouslySetInnerHTML={{
              __html:
                contentHtml ||
                '<p class="text-stone-500 italic">No dispatch content authored yet. Use the editorial word processor to compose your report.</p>',
            }}
          />
        </div>

        {/* Tag Chips */}
        {tags && tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#262626] flex items-center flex-wrap gap-2">
            <span className="font-mono-meta text-xs text-stone-500 uppercase flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> TAGS:
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-[#1C1C1C] border border-[#2D2D2D] text-stone-300 px-2.5 py-1 text-xs font-mono-meta rounded-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Live Comments Section Preview (Matches Main Blog Discussion Block) */}
        <div className="mt-14 pt-10 border-t border-[#282828]">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#282828]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#E50914]" />
              <h3 className="font-masthead text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
                SUBSCRIBER DISCUSSION & DEBATE (PREVIEW)
              </h3>
            </div>
            <span className="text-xs font-mono-meta text-stone-400">
              3 DISPATCH COMMENTS
            </span>
          </div>

          {/* Comment Composer Form Mockup */}
          <div className="bg-[#181818] border border-[#2A2A2A] rounded-xs p-4 mb-8">
            <textarea
              readOnly
              rows={3}
              placeholder="Share your perspective or analysis on this dispatch..."
              className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xs p-3 text-stone-400 font-sans-body text-sm resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#242424]">
              <span className="text-[11px] font-mono-meta text-stone-500">
                Comments are moderated in accordance with editorial standards.
              </span>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-[#E50914] opacity-75 text-white font-mono-meta text-xs uppercase font-bold tracking-wider rounded-xs cursor-default"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SUBMIT DISPATCH COMMENT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Articles Section (Matches Main Blog) */}
        <section className="mt-14 pt-10 border-t border-[#282828] mb-16">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#282828]">
            <h3 className="font-masthead text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
              RELATED DISPATCHES
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#161616] border border-[#262626] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider mb-2 inline-block">
                  {category || 'WORLD'}
                </span>
                <h4 className="font-editorial text-base font-bold text-white mb-2">
                  Global Economic Council Convenes Emergency Session Over Trade Realignment
                </h4>
                <p className="text-xs text-stone-400 line-clamp-2 font-sans-body mb-3">
                  Ministers of state and central banking governors draft unified contingency mechanisms.
                </p>
              </div>
              <div className="text-[11px] font-mono-meta text-stone-500 pt-2 border-t border-[#222]">
                4 min read &bull; Editorial Bureau
              </div>
            </div>

            <div className="bg-[#161616] border border-[#262626] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider mb-2 inline-block">
                  {category || 'WORLD'}
                </span>
                <h4 className="font-editorial text-base font-bold text-white mb-2">
                  Continental Clean Power Infrastructure Grid Reaches Completion Milestone
                </h4>
                <p className="text-xs text-stone-400 line-clamp-2 font-sans-body mb-3">
                  Cross-border high-voltage transmission lines connect maritime wind facilities to industrial regions.
                </p>
              </div>
              <div className="text-[11px] font-mono-meta text-stone-500 pt-2 border-t border-[#222]">
                6 min read &bull; Technology Bureau
              </div>
            </div>

            <div className="bg-[#161616] border border-[#262626] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider mb-2 inline-block">
                  {category || 'WORLD'}
                </span>
                <h4 className="font-editorial text-base font-bold text-white mb-2">
                  International Arbitration Tribunal Ratifies Cross-Border Regulatory Protocols
                </h4>
                <p className="text-xs text-stone-400 line-clamp-2 font-sans-body mb-3">
                  Judicial leaders formalize statutory frameworks governing institutional technology transfers.
                </p>
              </div>
              <div className="text-[11px] font-mono-meta text-stone-500 pt-2 border-t border-[#222]">
                5 min read &bull; Legal Correspondent
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};
