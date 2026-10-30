import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowRight, Calendar, Clock } from 'lucide-react';
import { getArticles } from '../lib/supabase';
import { mapDBArticleToArticle } from '../data/artData';

interface SportsSectionProps {
  onSelectArticle: (article: any) => void;
  onNavigateToCategory?: () => void;
  articles?: any[];
}

export const SportsSection: React.FC<SportsSectionProps> = ({
  onSelectArticle,
  onNavigateToCategory,
  articles,
}) => {
  const [sportsArticles, setSportsArticles] = useState<any[]>(articles || []);

  useEffect(() => {
    if (articles && articles.length > 0) {
      setSportsArticles(articles);
      return;
    }

    let isMounted = true;
    getArticles('SPORT', false).then((dbRes) => {
      if (isMounted && dbRes && dbRes.length > 0) {
        setSportsArticles(dbRes.map(mapDBArticleToArticle).slice(0, 6));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [articles]);

  if (!sportsArticles || sportsArticles.length === 0) return null;

  return (
    <section className="w-full bg-[#121212] py-10 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#242424]">
      {/* Section Broadsheet Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#242424] mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 font-mono-meta text-[11px] text-[#E50914] uppercase tracking-widest font-bold">
            <span className="w-2 h-2 rounded-full bg-[#E50914]" />
            <span>THE CHRONICLES JOURNALISM • SPORTS & ATHLETICS</span>
          </div>
          <h2 className="font-masthead text-2xl sm:text-4xl text-white font-bold tracking-tight">
            SPORTS, TACTICS & ATHLETIC CULTURE
          </h2>
          <p className="font-editorial text-xs sm:text-sm text-[#888888] italic mt-1">
            In-depth reporting, Olympic essays, tactical dispatches, and motorsport engineering from our international correspondents.
          </p>
        </div>

        {onNavigateToCategory && (
          <button
            onClick={onNavigateToCategory}
            className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#E50914] text-[#CCCCCC] hover:text-white px-4 py-2 rounded-xs border border-[#303030] hover:border-[#E50914] font-mono-meta text-xs transition duration-200 self-start md:self-end cursor-pointer"
          >
            <span>VIEW ALL SPORTS DISPATCHES</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid of Sports Dispatches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sportsArticles.slice(0, 6).map((art) => (
          <article
            key={art.id}
            onClick={() => onSelectArticle(art)}
            className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-[#E50914] transition-all duration-300 p-5 rounded-xs flex flex-col justify-between shadow-lg"
          >
            <div>
              {/* Cover Photo */}
              <div className="w-full h-48 rounded-xs overflow-hidden mb-4 relative bg-[#111] border border-[#2D2D2D]">
                <img
                  src={art.cover_image_url || art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/og-image.png';
                  }}
                />
                <span className="absolute top-3 left-3 bg-[#E50914] text-white text-[10px] font-mono-meta font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                  {art.category || 'SPORT'}
                </span>
              </div>

              <h3 className="font-editorial text-lg sm:text-xl font-bold text-white group-hover:text-[#E50914] leading-snug mb-2.5 transition-colors line-clamp-2">
                {art.title}
              </h3>

              <p className="font-sans-body text-xs text-stone-400 line-clamp-3 leading-relaxed mb-4">
                {art.excerpt}
              </p>
            </div>

            <div className="pt-3 border-t border-[#252525] flex items-center justify-between font-mono-meta text-[11px] text-stone-400">
              <span className="text-white font-medium">{art.author || 'Sports Correspondent'}</span>
              <span className="flex items-center gap-1 group-hover:text-[#E50914] transition-colors">
                <span>READ DISPATCH</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
