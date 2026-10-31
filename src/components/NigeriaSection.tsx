import React from 'react';
import { Article, cleanEditorialTitle } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { ArrowUpRight, Bookmark, ArrowRight, ShieldCheck } from 'lucide-react';
import { getPostPreviewImage } from '../lib/imageHelper';

interface NigeriaSectionProps {
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
  articles?: Article[];
  onNavigateToCategory?: () => void;
}

export const NigeriaSection: React.FC<NigeriaSectionProps> = ({
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  articles = [],
  onNavigateToCategory,
}) => {
  if (!articles || articles.length === 0) return null;

  const leadArticle = articles[0];
  const sideArticles = articles.slice(1, 4);

  return (
    <section id="NIGERIA" className="w-full bg-[#121212] py-10 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between mb-8 pb-3 border-b border-[#282828] gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#E50914] text-xs font-mono-meta font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#E50914]" />
            <span>NATIONAL DISPATCHES</span>
          </div>
          <h2 className="font-masthead text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white">
            NIGERIA & NATIONAL AFFAIRS
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline font-mono-meta text-xs text-stone-400">
            FEDERAL GOVERNANCE, ENERGY & SUB-NATIONAL REFORMS
          </span>
          {onNavigateToCategory && (
            <button
              onClick={onNavigateToCategory}
              className="group flex items-center gap-1.5 text-xs font-mono-meta font-bold uppercase text-[#E50914] hover:text-white transition-colors cursor-pointer"
            >
              <span>VIEW ALL NIGERIA</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>

      {/* Asymmetric Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Main Lead Story (Left Column: 7 cols) */}
        {leadArticle && (
          <div
            onClick={() => onSelectArticle(leadArticle)}
            className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-stone-500 p-5 rounded-xs flex flex-col justify-between transition-all lg:col-span-7"
          >
            <div>
              <div className="w-full h-64 sm:h-80 md:h-96 rounded-xs overflow-hidden mb-5 relative bg-[#111]">
                {getPostPreviewImage(leadArticle) !== '/og-image.png' ? (
                  <img
                    src={getPostPreviewImage(leadArticle)}
                    alt={leadArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/og-image.png';
                    }}
                  />
                ) : (
                  <ArtGraphic type={leadArticle.imageKey} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#333] text-white px-2.5 py-1 rounded-xs flex items-center gap-1.5 font-mono-meta text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-[#E50914]" />
                  <span>LEAD DISPATCH</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(leadArticle.id);
                  }}
                  className="absolute top-3 right-3 bg-black/70 text-stone-300 hover:text-[#E50914] p-2 rounded-xs backdrop-blur-sm cursor-pointer"
                  title="Bookmark dispatch"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.includes(leadArticle.id) ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-meta text-stone-400 mb-3">
                <span className="bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider text-[10px]">
                  NIGERIA
                </span>
                <span className="text-stone-300 font-medium">{leadArticle.author || 'Chronicles Nigeria Desk'}</span>
                <span className="text-stone-500">&bull;</span>
                <span className="text-stone-400">{leadArticle.readTime || '6 min read'}</span>
                <span className="text-stone-500">&bull;</span>
                <span className="text-stone-400">{leadArticle.date}</span>
              </div>

              <h3 className="font-editorial text-xl sm:text-2xl font-bold text-white group-hover:text-[#E50914] leading-snug mb-3 transition-colors">
                {cleanEditorialTitle(leadArticle.title)}
              </h3>

              <p className="text-sm text-stone-300 font-sans-body leading-relaxed line-clamp-3 mb-4">
                {leadArticle.excerpt}
              </p>
            </div>

            <div className="flex items-center gap-1 font-mono-meta text-xs text-stone-300 group-hover:text-[#E50914] pt-3 border-t border-[#252525]">
              <span>READ COMPLETE DISPATCH</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        )}

        {/* Supporting Dispatches (Right Column: 5 cols, Stacked) */}
        <div className="flex flex-col gap-4 lg:col-span-5 justify-between">
          {sideArticles.map((item) => {
            const isBookmarked = bookmarkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onSelectArticle(item)}
                className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-stone-500 p-4 rounded-xs flex gap-4 transition-all flex-1 items-start"
              >
                <div className="w-24 sm:w-32 h-24 sm:h-28 rounded-xs overflow-hidden shrink-0 relative bg-[#111]">
                  {getPostPreviewImage(item) !== '/og-image.png' ? (
                    <img
                      src={getPostPreviewImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/og-image.png';
                      }}
                    />
                  ) : (
                    <ArtGraphic type={item.imageKey} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0 h-full">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono-meta text-stone-400 mb-1.5">
                      <span className="text-[#E50914] font-bold uppercase">{item.author || 'Nigeria Desk'}</span>
                      <span className="text-stone-500">{item.date}</span>
                    </div>

                    <h4 className="font-editorial text-sm sm:text-base font-bold text-white group-hover:text-[#E50914] leading-snug line-clamp-2 transition-colors mb-1.5">
                      {cleanEditorialTitle(item.title)}
                    </h4>

                    <p className="text-xs text-stone-400 font-sans-body line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#222] mt-2">
                    <span className="text-[10px] font-mono-meta text-stone-400">{item.readTime || '5 min read'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item.id);
                      }}
                      className="text-stone-500 hover:text-[#E50914] transition-colors p-1"
                      title="Bookmark"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
