import React, { useState, useEffect, useRef } from 'react';
import { ArtGraphic } from './ArtGraphics';
import { ArrowUpRight, Bookmark, Eye, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getPostPreviewImage } from '../lib/imageHelper';
import { formatProgressiveTimestamp } from '../lib/lifecycle';

interface HeroSectionProps {
  onSelectArticle: (article: any) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
  articles?: any[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  articles,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // If articles are loading or empty, render an authentic broadsheet skeleton
  if (!articles || articles.length === 0) {
    return (
      <section className="w-full bg-[#121212] pt-3 sm:pt-5 pb-8 sm:pb-12 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Lead Skeleton Card */}
          <div className="lg:col-span-8 bg-[#181818] border border-[#282828] rounded-xs p-5 sm:p-8 flex flex-col justify-between min-h-[380px] sm:min-h-[480px] lg:min-h-[540px] animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-[#262626] rounded-xs" />
              <div className="h-6 w-6 bg-[#262626] rounded-xs" />
            </div>
            <div className="mt-auto pt-8 space-y-3">
              <div className="h-8 sm:h-12 w-11/12 bg-[#262626] rounded-xs" />
              <div className="h-8 sm:h-12 w-4/5 bg-[#262626] rounded-xs" />
              <div className="h-4 w-3/4 bg-[#202020] rounded-xs mt-3" />
              <div className="h-4 w-1/2 bg-[#202020] rounded-xs" />
              <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
                <div className="h-3 w-36 bg-[#202020] rounded-xs" />
                <div className="h-3 w-28 bg-[#202020] rounded-xs" />
              </div>
            </div>
          </div>

          {/* Right Rail Sidecards Skeleton */}
          <div className="lg:col-span-4 bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#282828]">
                <div className="h-3 w-24 bg-[#262626] rounded-xs animate-pulse" />
                <div className="h-3 w-16 bg-[#262626] rounded-xs animate-pulse" />
              </div>
              <div className="space-y-4 divide-y divide-[#242424]">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="pt-3 first:pt-0 space-y-2 animate-pulse">
                    <div className="h-4 w-16 bg-[#262626] rounded-xs" />
                    <div className="h-4 w-full bg-[#202020] rounded-xs" />
                    <div className="h-4 w-3/4 bg-[#202020] rounded-xs" />
                    <div className="h-3 w-1/3 bg-[#1e1e1e] rounded-xs" />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-[#2A2A2A] flex items-center justify-between">
              <div className="h-3 w-28 bg-[#202020] rounded-xs animate-pulse" />
              <div className="h-3 w-24 bg-[#202020] rounded-xs animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Top 5 articles form the rotating Hero Showcase Pool
  const heroPool = articles.slice(0, 5);
  const totalSlides = heroPool.length;

  // Auto-slide every 5 seconds unless hovered/paused
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const activeArticle = heroPool[activeIndex] || heroPool[0];

  // Right column displays the dispatches from the pool
  const sideArticles = heroPool;

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (deltaX > 40) {
      // Swiped right -> prev slide
      setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    } else if (deltaX < -40) {
      // Swiped left -> next slide
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }
    touchStartXRef.current = null;
  };

  return (
    <section className="w-full bg-[#121212] pt-3 sm:pt-5 pb-8 sm:pb-12 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
      {/* Hero Grid Container - Clean Broadsheet Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left/Center Main Feature Card: Real Photographic Broadsheet Lead with 5s Sliding Mechanism */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="lg:col-span-8 group relative bg-[#181818] border border-[#282828] rounded-xs overflow-hidden transition-colors duration-200 hover:border-white/40 min-h-[420px] sm:min-h-[490px] lg:min-h-[550px]"
        >
          {/* Sliding Track for Big Rectangular Posts */}
          <div 
            className="flex w-full h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {heroPool.map((article, idx) => {
              const isBookmarked = bookmarkedIds.includes(article.id);
              const previewImg = getPostPreviewImage(article);
              const isBreaking = article.lifecycle_stage === 'BREAKING' || article.lifecycle?.status === 'BREAKING';

              return (
                <div
                  key={article.id || idx}
                  onClick={() => onSelectArticle(article)}
                  className="w-full h-full shrink-0 relative p-5 sm:p-8 flex flex-col justify-between cursor-pointer"
                >
                  {/* Photography Background with Smooth Contrast Gradient */}
                  {previewImg !== '/og-image.png' ? (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={previewImg}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/og-image.png';
                        }}
                      />
                      {/* Smooth Broadsheet Gradient: Transparent top, rich dark bottom for crystal clear legibility */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(14,14,14,0.98) 0%, rgba(14,14,14,0.85) 35%, rgba(14,14,14,0.3) 65%, rgba(14,14,14,0.05) 85%)'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center my-auto py-2 sm:py-4">
                      <ArtGraphic type="hero_world_globe" className="w-full max-w-lg h-60 sm:h-80 md:h-96 rounded-xs" />
                    </div>
                  )}

                  {/* Top Meta Bar */}
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2.5 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block">
                        {article.category}
                      </span>
                      <span className="font-mono-meta text-[11px] text-stone-300 uppercase tracking-widest hidden sm:inline">
                        {isBreaking ? 'BREAKING WIRE' : 'LEAD INVESTIGATION'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Carousel Indicator Pill: Current Slide / Total */}
                      <span className="font-mono-meta text-[11px] text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-xs border border-white/10 hidden sm:inline-block">
                        WIRE {idx + 1} OF {totalSlides}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(article.id);
                        }}
                        className="text-stone-400 hover:text-[#E50914] p-1.5 rounded-xs bg-black/50 hover:bg-black/90 transition-colors cursor-pointer"
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Story'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Headline, Subtitle & Metadata */}
                  <div className="relative z-10 mt-auto pt-8">
                    <h2 className="font-editorial text-2xl sm:text-4xl md:text-5xl font-extrabold text-white group-hover:text-stone-100 transition leading-tight mb-3">
                      {article.title}
                    </h2>
                    <p className="font-editorial text-sm sm:text-base text-stone-300 line-clamp-3 leading-relaxed max-w-3xl mb-5">
                      {article.excerpt || article.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-white/15 text-stone-300 font-mono-meta text-xs gap-3">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-stone-400 text-[11px] sm:text-xs">
                        <span className="text-white font-medium whitespace-nowrap">{article.author || 'Chronicles Editorial Desk'}</span>
                        <span className="text-stone-500">•</span>
                        <span className="whitespace-nowrap">{formatProgressiveTimestamp(article.published_at || article.date)}</span>
                        {typeof article.views_count === 'number' && (
                          <>
                            <span className="text-stone-500">•</span>
                            <span className="flex items-center gap-1 text-stone-300 whitespace-nowrap">
                              <Eye className="w-3.5 h-3.5 text-stone-400" />
                              {article.views_count.toLocaleString()} views
                            </span>
                          </>
                        )}
                        <span className="text-stone-500">•</span>
                        <span className="whitespace-nowrap">{article.readTime || '6 min read'}</span>
                      </div>

                      <span className="flex items-center gap-1.5 text-white group-hover:text-[#E50914] font-bold transition whitespace-nowrap pt-1 sm:pt-0">
                        <span>READ COMPLETE REPORT</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sliding Navigation Controls (Hover Left/Right Arrows + Progress Pips) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 flex items-center justify-between pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handlePrevSlide}
              className="p-2 bg-black/70 hover:bg-[#E50914] text-white rounded-full transition-colors pointer-events-auto cursor-pointer shadow-lg backdrop-blur-xs"
              title="Previous Dispatch"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextSlide}
              className="p-2 bg-black/70 hover:bg-[#E50914] text-white rounded-full transition-colors pointer-events-auto cursor-pointer shadow-lg backdrop-blur-xs"
              title="Next Dispatch"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Slide Progress Tracker (5-Second Visual Pips) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-xs">
            {heroPool.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                className={`transition-all duration-300 h-1.5 rounded-full cursor-pointer ${
                  idx === activeIndex
                    ? 'w-7 bg-[#E50914]'
                    : 'w-2 bg-stone-500 hover:bg-stone-300'
                }`}
                title={`Go to story ${idx + 1}`}
              />
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="text-stone-400 hover:text-white transition-colors ml-1 p-0.5"
              title={isPaused ? 'Resume Auto-Slide' : 'Pause Auto-Slide'}
            >
              {isPaused ? <Play className="w-2.5 h-2.5 text-emerald-400" /> : <Pause className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

        {/* Right Side News Column: Interactive Dispatches Synced with Sliding Stage */}
        <div className="lg:col-span-4 bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#282828] font-mono-meta text-xs">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
                LATEST DISPATCHES
              </span>
              <span className="text-stone-400 text-[11px] font-mono-meta font-medium">SLIDES EVERY 5S</span>
            </div>

            <div className="space-y-3 sm:space-y-4 divide-y divide-[#282828]">
              {sideArticles.map((item, idx) => {
                const isBookmarked = bookmarkedIds.includes(item.id);
                const isCurrentlyActive = idx === activeIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`group pt-3 first:pt-0 pb-1 cursor-pointer transition-all duration-200 rounded-xs p-1.5 -mx-1.5 ${
                      isCurrentlyActive
                        ? 'bg-[#222222] border-l-2 border-[#E50914] pl-2.5'
                        : 'hover:bg-[#1C1C1C]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0 w-full overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono-meta bg-[#222222] border border-[#333333] text-stone-300 px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block truncate shrink min-w-0 group-hover:border-[#E50914] transition">
                          {item.category}
                        </span>
                        {isCurrentlyActive && (
                          <span className="text-[9px] font-mono-meta text-[#E50914] font-bold uppercase tracking-wider hidden sm:inline">
                            • ACTIVE
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(item.id);
                        }}
                        className="text-stone-500 hover:text-[#E50914] p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors cursor-pointer"
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Story'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                      </button>
                    </div>

                    <h3
                      onClick={(e) => {
                        // If already active, open article modal; otherwise switch slide
                        if (isCurrentlyActive) {
                          onSelectArticle(item);
                        } else {
                          e.stopPropagation();
                          setActiveIndex(idx);
                        }
                      }}
                      className={`font-editorial text-sm sm:text-base leading-snug font-medium transition ${
                        isCurrentlyActive
                          ? 'text-white font-bold'
                          : 'text-stone-200 group-hover:text-white group-hover:underline'
                      }`}
                    >
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-meta text-[11px] text-stone-500 mt-1">
                      <span className={`whitespace-nowrap ${item.lifecycle_stage === 'BREAKING' ? 'text-[#E50914] font-bold' : ''}`}>
                        {formatProgressiveTimestamp(item.published_at || item.date)}
                      </span>
                      {typeof item.views_count === 'number' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-stone-400 whitespace-nowrap">
                            <Eye className="w-3 h-3 text-stone-500" />
                            {item.views_count.toLocaleString()}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="whitespace-nowrap">{item.readTime || '5 min read'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Archive Link */}
          <div className="pt-4 mt-4 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-mono-meta text-stone-400">
            <span>VOL. XLVIII • NO. 14,208</span>
            <span className="text-[#E50914] font-bold hover:underline cursor-pointer">LATEST DISPATCH &rarr;</span>
          </div>
        </div>
      </div>
    </section>
  );
};
