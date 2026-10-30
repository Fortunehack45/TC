import React, { useState, useEffect } from 'react';
import {
  X, Calendar, User, Clock, Tag, Monitor, Tablet, Smartphone,
  Type, Printer, Check, Copy, ChevronRight, Eye, ShieldAlert,
  BookOpen, Sparkles
} from 'lucide-react';
import { ArticleStatus } from './database.types';

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
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);

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
  const charCount = plainText.length;
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

  const handleCopyLink = () => {
    const previewUrl = window.location.origin;
    navigator.clipboard.writeText(`${previewUrl}?preview=true`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Viewport container width classes
  const viewportWidthClass = {
    desktop: 'max-w-[1100px] w-full',
    tablet: 'max-w-[768px] w-full border-x border-[#333]',
    mobile: 'max-w-[400px] w-full border-x-4 border-t-8 border-b-8 border-stone-800 rounded-3xl shadow-2xl my-4',
  }[deviceMode];

  // Font size styling
  const fontSizeClass = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-lg sm:text-xl leading-relaxed',
    xlarge: 'text-xl sm:text-2xl leading-loose',
  }[fontSize];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex flex-col items-center justify-start p-0 sm:p-4 font-sans-body selection:bg-[#E50914] selection:text-white animate-fadeIn">
      {/* Top Editorial Floating Command Bar */}
      <div className="sticky top-0 z-50 w-full max-w-[1400px] bg-[#161616]/95 backdrop-blur-md border-b sm:border border-[#2D2D2D] sm:rounded-xs px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left: Mode Badge & Publication Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
            <span className="font-mono-meta text-xs font-bold uppercase tracking-widest text-white hidden sm:inline">
              LIVE EDITORIAL PREVIEW
            </span>
          </div>

          <span
            className={`text-[10px] font-mono-meta font-bold uppercase px-2 py-0.5 rounded-xs flex items-center gap-1 ${
              status === 'published'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
                : 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {status.toUpperCase()}
          </span>

          <span className="text-stone-500 hidden md:inline">|</span>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono-meta text-stone-400">
            <span>{wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>{charCount.toLocaleString()} chars</span>
            <span>•</span>
            <span>{estimatedReadTime}</span>
          </div>
        </div>

        {/* Center: Device Viewport Simulation Switcher */}
        <div className="flex items-center bg-[#111111] border border-[#2B2B2B] p-0.5 rounded-xs">
          <button
            onClick={() => setDeviceMode('desktop')}
            title="Desktop View (Full Width)"
            className={`px-2.5 py-1 text-xs font-mono-meta rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-[#E50914] text-white font-bold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">DESKTOP</span>
          </button>

          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet View (768px)"
            className={`px-2.5 py-1 text-xs font-mono-meta rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              deviceMode === 'tablet'
                ? 'bg-[#E50914] text-white font-bold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">TABLET</span>
          </button>

          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile View (390px)"
            className={`px-2.5 py-1 text-xs font-mono-meta rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-[#E50914] text-white font-bold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">MOBILE</span>
          </button>
        </div>

        {/* Right: Reading Controls & Close */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Typography Size Toggle */}
          <div className="flex items-center bg-[#111111] border border-[#2B2B2B] p-0.5 rounded-xs">
            <button
              onClick={() => setFontSize('normal')}
              title="Standard Font Size"
              className={`px-2 py-0.5 text-xs font-serif font-bold rounded-xs transition-colors cursor-pointer ${
                fontSize === 'normal' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              title="Large Font Size"
              className={`px-2 py-0.5 text-sm font-serif font-bold rounded-xs transition-colors cursor-pointer ${
                fontSize === 'large' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              title="Extra Large Font Size"
              className={`px-2 py-0.5 text-base font-serif font-bold rounded-xs transition-colors cursor-pointer ${
                fontSize === 'xlarge' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              A++
            </button>
          </div>

          {/* Print Proof */}
          <button
            onClick={handlePrint}
            title="Print Editorial Proof"
            className="p-1.5 text-stone-400 hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333] rounded-xs transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Copy Share Link */}
          <button
            onClick={handleCopyLink}
            title="Copy Preview Link"
            className="p-1.5 text-stone-400 hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333] rounded-xs transition-colors cursor-pointer flex items-center justify-center"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Close Modal (ESC) */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#252525] hover:bg-[#E50914] text-stone-300 hover:text-white border border-[#383838] hover:border-[#E50914] transition-colors rounded-xs text-xs font-mono-meta font-bold cursor-pointer"
            title="Close Preview (ESC)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">CLOSE</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className={`transition-all duration-300 ease-in-out my-4 sm:my-6 ${viewportWidthClass}`}>
        <div className="bg-[#141414] border border-[#262626] shadow-2xl relative min-h-[90vh] rounded-xs overflow-hidden">
          {/* Masthead Header Preview Bar */}
          <div className="bg-[#111111] border-b border-[#222222] px-6 py-3 flex items-center justify-between text-xs font-mono-meta text-stone-400">
            <div className="flex items-center gap-2 truncate">
              <span className="text-white font-bold">THE CHRONICLES</span>
              <ChevronRight className="w-3 h-3 text-stone-600 shrink-0" />
              <span className="text-[#E50914] font-bold uppercase shrink-0">{category || 'DISPATCH'}</span>
              <ChevronRight className="w-3 h-3 text-stone-600 shrink-0 hidden sm:inline" />
              <span className="text-stone-400 truncate hidden sm:inline">{title || 'Untitled'}</span>
            </div>
            <span className="text-stone-500 shrink-0 hidden sm:inline">
              EDITORIAL PROOF
            </span>
          </div>

          {/* Article Main Body */}
          <div className="p-6 sm:p-10 md:p-14 text-stone-200">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs font-mono-meta text-stone-400 mb-5">
              <span className="bg-[#E50914] text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-xs">
                {category || 'GENERAL'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-200 font-bold">{authorName || 'Ajayi-Ojo Progress'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {estimatedReadTime}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-editorial text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight sm:leading-tight tracking-tight mb-6">
              {title || 'Untitled Dispatch'}
            </h1>

            {/* Subtitle / Narrative Deck */}
            {subtitle && (
              <p className="font-editorial text-lg sm:text-2xl text-stone-300 italic border-l-4 border-[#E50914] pl-4 sm:pl-5 py-1 mb-8 sm:mb-10 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}

            {/* Cover Photography */}
            {coverImageUrl ? (
              <div className="w-full h-64 sm:h-96 md:h-[480px] rounded-xs overflow-hidden border border-[#282828] mb-10 shadow-2xl relative bg-[#0C0C0C]">
                <img
                  src={coverImageUrl}
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
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <video controls className="w-full h-full" src={videoUrl}>
                    Your browser does not support HTML5 video.
                  </video>
                )}
              </div>
            )}

            {/* Article Prose Content */}
            <div
              className={`prose prose-invert max-w-none article-prose ${fontSizeClass} text-stone-200 prose-headings:font-editorial prose-headings:text-white prose-p:leading-relaxed prose-a:text-[#E50914] prose-a:underline hover:prose-a:text-[#FF3838] prose-blockquote:border-l-4 prose-blockquote:border-[#E50914] prose-blockquote:pl-5 prose-blockquote:font-editorial prose-blockquote:italic prose-blockquote:text-stone-300 prose-table:border prose-table:border-[#333] prose-th:bg-[#222] prose-th:p-2.5 prose-th:text-white prose-td:p-2.5 prose-td:border-t prose-td:border-[#333] prose-strong:text-white prose-code:bg-[#202020] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-xs prose-code:text-[#E50914]`}
              dangerouslySetInnerHTML={{
                __html: contentHtml || '<p class="text-stone-500 italic">No dispatch content authored yet. Use the editorial word processor to compose your report.</p>',
              }}
            />

            {/* Hashtag Topics */}
            {tags && tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-[#262626] flex items-center flex-wrap gap-2">
                <span className="font-mono-meta text-xs text-stone-500 uppercase flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-[#E50914]" /> TOPICS & BEATS:
                </span>
                {tags.map((t) => (
                  <span
                    key={t}
                    className="bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] text-stone-300 px-3 py-1 text-xs font-mono-meta rounded-xs transition-colors cursor-pointer"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Editorial Footer Sign-off */}
            <div className="mt-12 pt-8 border-t border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono-meta text-stone-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-400">THE CHRONICLES EDITORIAL DESK</span>
                <span>•</span>
                <span>Author: {authorName || 'Ajayi-Ojo Progress'}</span>
              </div>
              <div>
                VERIFIED EDITORIAL PREVIEW • NOT FOR PUBLIC DISTRIBUTION
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
