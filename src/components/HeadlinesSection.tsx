import React, { useState, useEffect, useMemo } from 'react';
import { Article } from '../data/artData';
import { Bookmark, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeadlinesSectionProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
}

export const HeadlinesSection: React.FC<HeadlinesSectionProps> = ({
  articles,
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
}) => {
  // Curate exactly 5 daily headlines maximum on the main page
  // Prioritizes articles currently in the 'HEADLINE' lifecycle stage (6–24 hours old)
  // across diverse beats, with graceful backfill.
  const headlinesList = useMemo(() => {
    if (!articles || articles.length === 0) return [];

    const getByCat = (cats: string[]) =>
      articles.filter((a) => cats.includes(a.category?.toUpperCase()));

    // Find articles in the HEADLINE stage first (6-24 hours old)
    const headlineStage = articles.filter((a) => a.lifecycle?.status === 'HEADLINE');

    const worldArt =
      headlineStage.find((a) => a.category?.toUpperCase() === 'WORLD') ||
      getByCat(['WORLD'])[0];

    const politicsArt =
      headlineStage.find((a) => a.category?.toUpperCase() === 'POLITICS') ||
      getByCat(['POLITICS'])[0];

    const techArt =
      headlineStage.find((a) => ['TECHNOLOGY', 'SCIENCE'].includes(a.category?.toUpperCase())) ||
      getByCat(['TECHNOLOGY', 'SCIENCE'])[0];

    const financeArt =
      headlineStage.find((a) => a.category?.toUpperCase() === 'FINANCE') ||
      getByCat(['FINANCE'])[0];

    const cultureArt =
      headlineStage.find((a) => ['EDUCATION', 'LIFESTYLE', 'CELEBRITY', 'SPORT'].includes(a.category?.toUpperCase())) ||
      getByCat(['EDUCATION', 'LIFESTYLE', 'CELEBRITY', 'SPORT'])[0];

    const pool = [worldArt, politicsArt, techArt, financeArt, cultureArt].filter(Boolean);

    // Ensure we always have 5 items
    if (pool.length < 5) {
      const existingIds = new Set(pool.map((p) => p.id));
      for (const a of articles) {
        if (!existingIds.has(a.id)) {
          pool.push(a);
          if (pool.length >= 5) break;
        }
      }
    }

    return pool.slice(0, 5);
  }, [articles]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide: wait a few seconds before the next one slides in continuously
  useEffect(() => {
    if (headlinesList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlinesList.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [headlinesList.length, isPaused]);

  useEffect(() => {
    if (currentIndex >= headlinesList.length) {
      setCurrentIndex(0);
    }
  }, [headlinesList.length, currentIndex]);

  if (headlinesList.length === 0) return null;

  const currentHeadline = headlinesList[currentIndex] || headlinesList[0];
  const isBookmarked = bookmarkedIds.includes(currentHeadline.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + headlinesList.length) % headlinesList.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % headlinesList.length);
  };

  return (
    <section className="w-full bg-[#121212] py-3 sm:py-5 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
      {/* Red Rectangle Card: Simple, Elegant, Professional, No Picture, Max 5 */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full bg-gradient-to-r from-[#D30713] via-[#E50914] to-[#B3060F] text-white rounded-xs p-5 sm:p-7 md:p-8 shadow-xl relative overflow-hidden border border-red-500/30 select-none transition-all"
      >
        {/* Card Header: Clean Title Pill, Category, Bookmark (No 5/5 counter) */}
        <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-white/20 relative z-10 text-xs font-mono-meta">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="bg-white text-[#E50914] px-2.5 py-0.5 rounded-xs font-black uppercase tracking-wider text-[11px] shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E50914]" />
              DAILY HEADLINES
            </span>

            <span className="hidden sm:inline text-white/50">•</span>

            <span className="inline-block bg-black/30 border border-white/20 text-white px-2 py-0.5 rounded-xs font-mono-meta text-[10px] font-bold uppercase tracking-wider">
              {currentHeadline.category}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(currentHeadline.id);
            }}
            className="text-white/80 hover:text-white p-1.5 rounded-xs bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Headline'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        {/* Center Headline Content: Big Text, High Readability */}
        <div
          key={currentHeadline.id}
          onClick={() => onSelectArticle(currentHeadline)}
          className="animate-slide-in-right py-4 sm:py-5 cursor-pointer group relative z-10"
        >
          {/* Headline Title */}
          <h2 className="font-editorial text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white group-hover:text-stone-100 transition-colors leading-snug sm:leading-tight drop-shadow-sm max-w-5xl">
            {currentHeadline.title}
          </h2>

          {/* Excerpt */}
          <p className="font-editorial text-xs sm:text-sm md:text-base text-white/90 line-clamp-2 leading-relaxed mt-2.5 max-w-4xl">
            {currentHeadline.excerpt ||
              (currentHeadline as any).subtitle ||
              'Authoritative dispatch on priority developments reported directly from our international news desk.'}
          </p>

          {/* Dispatch Metadata */}
          <div className="flex items-center gap-2 font-mono-meta text-[11px] text-white/80 mt-3.5">
            <span className="font-semibold text-white">{currentHeadline.author || 'Chronicles Bureau'}</span>
            <span>•</span>
            <span>{currentHeadline.lifecycle?.timeAgoFormatted || currentHeadline.date}</span>
            <span>•</span>
            <span>{currentHeadline.readTime || '5 min read'}</span>
          </div>
        </div>

        {/* Card Footer: Slide Dots and Navigation Controls */}
        <div className="pt-3 sm:pt-3.5 border-t border-white/20 flex items-center justify-between relative z-10">
          {/* 5 Continuous Slide Indicator Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {headlinesList.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-7 sm:w-9 bg-white shadow-xs'
                    : 'w-2 sm:w-2.5 bg-white/40 hover:bg-white/70'
                }`}
                title={`Go to headline ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows & Action Link */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrev}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Previous headline"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Next headline"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => onSelectArticle(currentHeadline)}
              className="ml-2 font-mono-meta text-[11px] font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1 cursor-pointer bg-black/20 hover:bg-black/35 px-2.5 py-1.5 rounded-xs transition-colors"
            >
              <span>READ</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
