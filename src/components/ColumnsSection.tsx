import React from 'react';
import { Article } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { ArrowUpRight, Bookmark } from 'lucide-react';

interface ColumnsSectionProps {
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
  articles?: Article[];
}

export const ColumnsSection: React.FC<ColumnsSectionProps> = ({
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  articles = [],
}) => {
  if (articles.length === 0) return null;

  return (
    <section id="SCIENCE" className="w-full bg-[#121212] py-12 px-3 sm:px-5 max-w-[1600px] mx-auto border-b border-[#222222]">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#282828]">
        <h2 className="font-masthead text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white">
          SCIENCE, LIFESTYLE, FASHION & EDUCATION
        </h2>
        <span className="font-mono-meta text-xs text-stone-400">CULTURE, INNOVATION & ACADEMIA</span>
      </div>

      {/* Grid of Stories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 6).map((item) => {
          const isBookmarked = bookmarkedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-stone-500 p-4 sm:p-5 rounded-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="w-full h-44 rounded-xs overflow-hidden mb-3 relative bg-[#111] border border-[#282828]">
                  {item.cover_image_url || item.imageUrl ? (
                    <img
                      src={item.cover_image_url || item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/og-image.png';
                      }}
                    />
                  ) : (
                    <ArtGraphic type={item.imageKey} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 bg-black/70 text-stone-300 hover:text-[#E50914] p-1.5 rounded-xs backdrop-blur-sm cursor-pointer"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 font-mono-meta text-[11px] text-stone-400 mb-2.5 min-w-0 w-full overflow-hidden">
                  <span className="bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider text-[10px] inline-block truncate shrink min-w-0">
                    {item.category}
                  </span>
                  <span className="shrink-0 text-[11px] text-stone-400 font-medium whitespace-nowrap ml-auto">{item.date}</span>
                </div>

                <h3 className="font-editorial text-sm sm:text-base font-bold text-white group-hover:text-[#E50914] leading-snug mb-2 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs text-stone-400 font-sans-body leading-relaxed line-clamp-3 mb-3">
                  {item.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between font-mono-meta text-[11px] text-stone-400 pt-3 border-t border-[#252525]">
                <span>{item.author || 'Staff Writer'}</span>
                <span className="flex items-center gap-1 group-hover:text-[#E50914] transition-colors">
                  <span>READ STORY</span>
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
