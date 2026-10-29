import React from 'react';
import { ArtGraphic } from './ArtGraphics';
import { HERO_NEWS } from '../data/artData';
import { ArrowUpRight, Bookmark } from 'lucide-react';

interface HeroSectionProps {
  onSelectArticle: (article: any) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
}) => {
  return (
    <section className="w-full bg-[#121212] pt-4 sm:pt-6 pb-8 sm:pb-12 px-3 sm:px-5 max-w-[1600px] mx-auto border-b border-[#222222]">
      {/* Giant Masthead Title */}
      <div className="text-center py-2 sm:py-4 mb-4 sm:mb-6">
        <h1 className="font-masthead text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-wider text-white uppercase selection:bg-white selection:text-[#E50914] leading-none">
          THE GLOBAL CHRONICLE
        </h1>
      </div>

      {/* Hero Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left/Center Main Feature Card: Solid Red Box with Wireframe Globe Artwork */}
        <div 
          onClick={() => onSelectArticle(HERO_NEWS[0])}
          className="lg:col-span-8 group cursor-pointer bg-[#D91B1B] border border-[#B01414] rounded-xs p-4 sm:p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-white/40 shadow-2xl min-h-[340px] sm:min-h-[460px] lg:min-h-[520px]"
        >
          {/* World Wireframe Globe Artwork in Red Field */}
          <div className="w-full h-full flex items-center justify-center my-auto py-2 sm:py-4">
            <ArtGraphic type="hero_world_globe" className="w-full max-w-lg h-60 sm:h-80 md:h-96 rounded-xs" />
          </div>

          <div className="relative z-10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/20 text-white font-mono-meta text-xs gap-2">
            <span className="tracking-widest uppercase font-semibold text-[11px] sm:text-xs">
              BREAKING COVERAGE • GENEVA SUMMIT ACCORD
            </span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform font-bold">
              READ LEAD STORY <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Right Side News Column */}
        <div className="lg:col-span-4 bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs flex flex-col justify-between">
          <div className="space-y-3 sm:space-y-4 divide-y divide-[#282828]">
            {HERO_NEWS.map((item) => {
              const isBookmarked = bookmarkedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="group pt-3 first:pt-0 pb-1 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0 w-full overflow-hidden">
                    <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider inline-block truncate shrink min-w-0">
                      {item.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item.id);
                      }}
                      className="text-stone-500 hover:text-[#E50914] p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
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
                </div>
              );
            })}
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
