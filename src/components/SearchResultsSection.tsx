import React from 'react';
import { Article, getAllArticles, cleanEditorialTitle } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { Sparkles, X, ArrowUpRight } from 'lucide-react';

interface SearchResultsSectionProps {
  searchQuery: string;
  selectedCategory: string;
  onSelectArticle: (article: Article) => void;
  onClearSearch: () => void;
  articles?: Article[];
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchQuery,
  selectedCategory,
  onSelectArticle,
  onClearSearch,
  articles,
}) => {
  const pool: Article[] = articles && articles.length > 0 ? articles : getAllArticles();

  // Filtering logic across all database articles
  const filtered = pool.filter((item) => {
    const itemCat = (item.category || item.section || 'WORLD').toUpperCase();
    const matchesCategory =
      selectedCategory === 'ALL' ||
      itemCat === selectedCategory.toUpperCase();

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      itemCat.toLowerCase().includes(q) ||
      (item.author && item.author.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some((t) => t.toLowerCase() === q || t.toLowerCase().includes(q)));

    return matchesCategory && matchesQuery;
  });

  return (
    <section className="w-full bg-[#121212] py-8 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#282828]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#E50914]" />
          <h2 className="font-masthead text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
            {searchQuery ? `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"` : 'ARCHIVE SEARCH RESULTS'}
          </h2>
          <span className="font-mono-meta text-xs text-stone-400">
            ({filtered.length} {filtered.length === 1 ? 'match' : 'matches'})
          </span>
        </div>

        <button
          onClick={onClearSearch}
          className="font-mono-meta text-xs text-stone-400 hover:text-white flex items-center gap-1 transition-colors bg-[#222222] px-3 py-1.5 rounded-xs cursor-pointer"
        >
          <X className="w-3.5 h-3.5" /> CLEAR SEARCH
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-stone-500 font-mono-meta text-sm space-y-2">
          <p>NO ARCHIVE DISPATCHES MATCH YOUR SEARCH QUERY</p>
          <p className="text-xs text-stone-600">Try adjusting your keywords or selecting "ALL" categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-[#E50914] p-5 rounded-xs flex flex-col justify-between transition-all shadow-lg"
            >
              <div>
                <div className="w-full h-44 rounded-xs overflow-hidden mb-3 relative bg-[#111] border border-[#2A2A2A]">
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
                  <span className="absolute top-2.5 left-2.5 bg-[#E50914] text-white text-[10px] font-mono-meta font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 font-mono-meta text-[11px] text-stone-500 mb-2">
                  <span>{item.date}</span>
                  <span>{item.readTime || '5 min read'}</span>
                </div>

                <h3 className="font-editorial text-base sm:text-lg font-bold text-white group-hover:text-[#E50914] leading-snug mb-2 transition-colors line-clamp-2">
                  {cleanEditorialTitle(item.title)}
                </h3>

                <p className="text-xs text-stone-400 font-sans-body leading-relaxed line-clamp-3 mb-4">
                  {item.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between font-mono-meta text-xs text-stone-400 pt-2 border-t border-[#252525]">
                <span>{item.author || 'Chronicles Bureau'}</span>
                <span className="flex items-center gap-1 text-[#E50914] font-bold group-hover:translate-x-1 transition-transform">
                  READ <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
