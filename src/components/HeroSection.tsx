import React, { useState, useEffect, useRef } from 'react';
import { ArtGraphic } from './ArtGraphics';
import { ArrowUpRight, Bookmark, Eye } from 'lucide-react';
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
  const [slideIndex, setSlideIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // If articles are loading or empty, render an authentic broadsheet skeleton
  if (!articles || articles.length === 0) {
    return (
      <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full bg-[#121212] pt-3 sm:pt-5 pb-8 sm:pb-12 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]"
    >
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

  // Infinite Forward Loop Extended Array: [0, 1, 2, 3, 4, 0]
  // Appending the first article clone at the end allows continuous forward sliding without any backward rewind
  const extendedPool = totalSlides > 1 ? [...heroPool, heroPool[0]] : heroPool;

  // Real active index modulo the total unique slides
  const activeIndex = totalSlides > 0 ? slideIndex % totalSlides : 0;

  // Bulletproof index clamp: Never allow translateX to exceed available slides (prevents blank screen)
  const safeSlideIndex = totalSlides > 0 ? (slideIndex > totalSlides ? 0 : slideIndex) : 0;

  // 5-second automatic forward sliding ticker
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setEnableTransition(true);
      setIsTransitioning(true);
      setSlideIndex((prev) => (prev >= totalSlides ? 1 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  // Guaranteed timeout reset for clone slide: Never relies solely on browser onTransitionEnd
  useEffect(() => {
    if (slideIndex >= totalSlides) {
      const timer = setTimeout(() => {
        setEnableTransition(false);
        setIsTransitioning(false);
        setSlideIndex(0);
      }, 720);
      return () => clearTimeout(timer);
    }
  }, [slideIndex, totalSlides]);

  // Handle browser tab switching: Pause ticker when hidden, reset safely on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setEnableTransition(false);
        setIsTransitioning(false);
        setSlideIndex((prev) => (prev >= totalSlides ? 0 : prev));
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [totalSlides]);

  // When transition ends on the clone (totalSlides), seamlessly snap back to index 0 with no animation
  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only respond to transitions on the sliding track itself, ignore bubbling from children
    if (e.target !== e.currentTarget) return;
    setIsTransitioning(false);
    if (slideIndex >= totalSlides) {
      setEnableTransition(false);
      setSlideIndex(0);
    }
  };

  // Re-enable transition on next tick after a seamless zero-animation jump
  useEffect(() => {
    if (!enableTransition) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [enableTransition]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (deltaX > 40) {
      // Swiped right -> forward to previous or loop
      setEnableTransition(true);
      setIsTransitioning(true);
      setSlideIndex((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
    } else if (deltaX < -40) {
      // Swiped left -> forward to next
      setEnableTransition(true);
      setIsTransitioning(true);
      setSlideIndex((prev) => prev + 1);
    }
    touchStartXRef.current = null;
  };

  const handleSelectSideDispatch = (idx: number) => {
    setEnableTransition(true);
    setIsTransitioning(true);
    setSlideIndex(idx);
  };

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full bg-[#121212] pt-3 sm:pt-5 pb-8 sm:pb-12 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]"
    >
      {/* Hero Grid Container - Clean Broadsheet Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left/Center Main Feature Card: Real Broadsheet Lead with Seamless Infinite Forward Loop */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="lg:col-span-8 group relative bg-[#181818] border border-[#282828] rounded-xs overflow-hidden transition-colors duration-200 hover:border-white/30 min-h-[420px] sm:min-h-[490px] lg:min-h-[550px]"
        >
          {/* Sliding Track for Big Rectangular Posts (Always moves forward) */}
          <div 
            onTransitionEnd={handleTransitionEnd}
            className={`flex w-full h-full ${
              enableTransition ? 'transition-transform duration-700 ease-in-out' : ''
            }`}
            style={{ 
              transform: `translateX(-${safeSlideIndex * 100}%)`,
              transitionProperty: enableTransition ? 'transform' : 'none'
            }}
          >
            {extendedPool.map((article, idx) => {
              const isBookmarked = bookmarkedIds.includes(article.id);
              const previewImg = getPostPreviewImage(article);
              const isBreaking = article.lifecycle_stage === 'BREAKING' || article.lifecycle?.status === 'BREAKING';
              const isCurrentView = idx === safeSlideIndex || (safeSlideIndex === totalSlides && idx === 0);

              return (
                <div
                  key={`${article.id || 'art'}-${idx}`}
                  onClick={() => onSelectArticle(article)}
                  className={`w-full min-w-full max-w-full basis-full shrink-0 relative overflow-hidden p-5 sm:p-8 flex flex-col justify-between cursor-pointer transition-opacity duration-300 ${
                    !isTransitioning && !isCurrentView ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  {/* Photography Background with Smooth Contrast Gradient */}
                  {previewImg !== '/og-image.png' ? (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={previewImg}
                        alt={article.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                          isCurrentView ? 'group-hover:scale-105' : 'scale-100'
                        }`}
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
                    <div className="w-full h-full flex items-center justify-center my-auto py-2 sm:py-4 overflow-hidden">
                      <ArtGraphic type="hero_world_globe" className="w-full max-w-lg h-60 sm:h-80 md:h-96 rounded-xs" />
                    </div>
                  )}

                  {/* Top Meta Bar */}
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2.5 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block shadow">
                        {article.category}
                      </span>
                      <span className="font-mono-meta text-[11px] text-stone-300 uppercase tracking-widest hidden sm:inline">
                        {isBreaking ? 'BREAKING WIRE' : 'LEAD INVESTIGATION'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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
        </div>

        {/* Right Side News Column: Interactive Dispatches Synced with Sliding Stage */}
        <div className="lg:col-span-4 bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#282828] font-mono-meta text-xs">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0 inline-block" />
                BREAKING NEWS
              </span>
              <span className="text-stone-400 text-[11px] font-mono-meta font-medium tracking-wider">LIVE WIRE</span>
            </div>

            <div className="space-y-2">
              {heroPool.map((item, idx) => {
                const isBookmarked = bookmarkedIds.includes(item.id);
                const isCurrentlyActive = idx === activeIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSideDispatch(idx)}
                    className={`group cursor-pointer transition-all duration-200 rounded-r-xs p-3 sm:p-3.5 border-l-[3px] ${
                      isCurrentlyActive
                        ? 'bg-[#202020] border-[#E50914] shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 min-w-0 w-full overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-mono-meta px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block truncate transition shrink-0 ${
                          isCurrentlyActive
                            ? 'bg-[#E50914] text-white'
                            : 'bg-[#222222] border border-[#333333] text-stone-300 group-hover:border-stone-500'
                        }`}>
                          {item.category}
                        </span>
                        {isCurrentlyActive && (
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono-meta text-[#E50914] font-bold uppercase tracking-wider shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] shrink-0 inline-block" />
                            CURRENT STORY
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(item.id);
                        }}
                        className="text-stone-500 hover:text-[#E50914] p-1.5 min-h-[28px] min-w-[28px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
                          handleSelectSideDispatch(idx);
                        }
                      }}
                      className={`font-editorial text-sm sm:text-base leading-snug font-medium transition line-clamp-2 ${
                        isCurrentlyActive
                          ? 'text-white font-bold'
                          : 'text-stone-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-meta text-[11px] text-stone-400 mt-2">
                      <span className={`whitespace-nowrap ${item.lifecycle_stage === 'BREAKING' ? 'text-[#E50914] font-bold' : ''}`}>
                        {formatProgressiveTimestamp(item.published_at || item.date)}
                      </span>
                      {typeof item.views_count === 'number' && (
                        <>
                          <span className="text-stone-600">•</span>
                          <span className="flex items-center gap-1 text-stone-400 whitespace-nowrap">
                            <Eye className="w-3 h-3 text-stone-500" />
                            {item.views_count.toLocaleString()}
                          </span>
                        </>
                      )}
                      <span className="text-stone-600">•</span>
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
