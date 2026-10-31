import React from 'react';
import { ArtGraphic } from './ArtGraphics';
import { HERO_NEWS } from '../data/artData';
import { ArrowUpRight, Bookmark, Clock, Calendar, Eye } from 'lucide-react';
import { getPostPreviewImage } from '../lib/imageHelper';

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
  const sourceArticles = articles && articles.length > 0 ? articles : HERO_NEWS;
  const leadArticle = sourceArticles[0] || {
    id: 'hero-1',
    category: 'BREAKING NEWS',
    title: 'GLOBAL CLEAN ENERGY ACCORD RATIFIED BY INTERNATIONAL ENVOYS',
    excerpt: 'World leaders and economic delegations convene to finalize binding clean transition thresholds.',
    date: '30 October 2026',
    author: 'Elena Rostova',
    readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
  };

  const isLeadBookmarked = bookmarkedIds.includes(leadArticle.id);

  // Prioritize 0–6 hours Breaking articles for highest visibility on Hero
  const sideArticles = React.useMemo(() => {
    const pool = (articles && articles.length > 0 ? articles : HERO_NEWS).filter(
      (a) => a.id !== leadArticle.id
    );
    const breaking = pool.filter((a) => a.lifecycle?.status === 'BREAKING');
    const others = pool.filter((a) => a.lifecycle?.status !== 'BREAKING');
    return [...breaking, ...others].slice(0, 4);
  }, [articles, leadArticle.id]);

  return (
    <section className="w-full bg-[#121212] pt-3 sm:pt-5 pb-8 sm:pb-12 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
      {/* Hero Grid Container - Clean Broadsheet Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left/Center Main Feature Card: Real Photographic Broadsheet Lead */}
        <div 
          onClick={() => onSelectArticle(leadArticle)}
          className="lg:col-span-8 group cursor-pointer bg-[#181818] border border-[#282828] rounded-xs p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-colors duration-200 hover:border-white/40 min-h-[380px] sm:min-h-[480px] lg:min-h-[540px]"
        >
          {/* Real Photography Background or Video Thumbnail with Editorial Vignette */}
          {getPostPreviewImage(leadArticle) !== '/og-image.png' ? (
            <div className="absolute inset-0 z-0">
              <img
                src={getPostPreviewImage(leadArticle)}
                alt={leadArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/og-image.png';
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(18,18,18,0.98) 0%, rgba(18,18,18,0.85) 32%, rgba(18,18,18,0.4) 58%, rgba(18,18,18,0) 80%)'
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center my-auto py-2 sm:py-4">
              <ArtGraphic type="hero_world_globe" className="w-full max-w-lg h-60 sm:h-80 md:h-96 rounded-xs" />
            </div>
          )}

          {/* Lead Top Meta Bar */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2.5 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block">
                {leadArticle.category}
              </span>
              <span className="font-mono-meta text-[11px] text-stone-300 uppercase tracking-widest hidden sm:inline">
                LEAD INVESTIGATION
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(leadArticle.id);
              }}
              className="text-stone-400 hover:text-[#E50914] p-1.5 rounded-xs bg-black/40 hover:bg-black/80 transition-colors cursor-pointer"
              title={isLeadBookmarked ? 'Remove Bookmark' : 'Bookmark Story'}
            >
              <Bookmark className={`w-4 h-4 ${isLeadBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
            </button>
          </div>

          {/* Lead Headline & Excerpt */}
          <div className="relative z-10 mt-auto pt-8">
            <h2 className="font-editorial text-2xl sm:text-4xl md:text-5xl font-extrabold text-white group-hover:text-stone-100 transition leading-tight mb-3">
              {leadArticle.title}
            </h2>
            <p className="font-editorial text-sm sm:text-base text-stone-300 line-clamp-3 leading-relaxed max-w-3xl mb-5">
              {leadArticle.excerpt}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-white/15 text-stone-300 font-mono-meta text-xs gap-3">
              <div className="flex items-center gap-3 text-stone-400">
                <span className="text-white font-medium">{leadArticle.author || 'Chronicles Bureau'}</span>
                <span>•</span>
                <span>{leadArticle.date}</span>
                {typeof leadArticle.views_count === 'number' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-stone-300">
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      {leadArticle.views_count.toLocaleString()} views
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{leadArticle.readTime || '6 min read'}</span>
              </div>

              <span className="flex items-center gap-1.5 text-white group-hover:text-[#E50914] font-bold transition">
                <span>READ COMPLETE REPORT</span>
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Right Side News Column: Real Dispatches */}
        <div className="lg:col-span-4 bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#282828] font-mono-meta text-xs">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E50914]" />
                BREAKING NEWS
              </span>
              <span className="text-stone-400 text-[11px] font-mono-meta font-medium">LIVE UPDATES</span>
            </div>

            <div className="space-y-3 sm:space-y-4 divide-y divide-[#282828]">
              {sideArticles.map((item) => {
                const isBookmarked = bookmarkedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="group pt-3 first:pt-0 pb-1 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0 w-full overflow-hidden">
                      <span className="text-[10px] font-mono-meta bg-[#222222] border border-[#333333] text-stone-300 px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block truncate shrink min-w-0 group-hover:border-[#E50914] transition">
                        {item.category}
                      </span>
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
                      onClick={() => onSelectArticle(item)}
                      className="font-editorial text-sm sm:text-base text-stone-200 group-hover:text-white group-hover:underline leading-snug font-medium"
                    >
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-2 font-mono-meta text-[11px] text-stone-500 mt-1">
                      <span className={item.lifecycle?.status === 'BREAKING' ? 'text-[#E50914] font-bold' : ''}>
                        {item.lifecycle?.timeAgoFormatted || item.date}
                      </span>
                      {typeof item.views_count === 'number' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-stone-400">
                            <Eye className="w-3 h-3 text-stone-500" />
                            {item.views_count.toLocaleString()}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{item.readTime || '4 min read'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Archive Link */}
          <div className="pt-4 mt-4 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-mono-meta text-stone-400">
            <span>VOL. XLVIII • NO. 14,208</span>
            <span className="text-[#E50914] font-bold hover:underline cursor-pointer">LATEST DISPATCH →</span>
          </div>
        </div>
      </div>
    </section>
  );
};
