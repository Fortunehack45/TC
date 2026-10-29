import React from 'react';
import { Article, getAllArticles } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { Search, ArrowUpRight, Sparkles, X } from 'lucide-react';

interface SearchResultsSectionProps {
  searchQuery: string;
  selectedCategory: string;
  onSelectArticle: (article: Article) => void;
  onClearSearch: () => void;
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchQuery,
  selectedCategory,
  onSelectArticle,
  onClearSearch,
}) => {
  // Master list of all articles
  const allArticles: Article[] = getAllArticles();

  // Filtering logic
  const filtered = allArticles.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      item.section === selectedCategory;

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.author && item.author.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <section className="w-full bg-[#121212] py-8 px-3 sm:px-5 max-w-[1600px] mx-auto border-b border-[#222222]">
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
          className="font-mono-meta text-xs text-stone-400 hover:text-white flex items-center gap-1 transition-colors bg-[#222222] px-3 py-1.5 rounded-xs"
        >
          <X className="w-3.5 h-3.5" /> CLEAR SEARCH
        </button>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#181818] border border-[#282828] p-10 text-center rounded-xs space-y-3">
          <Search className="w-10 h-10 mx-auto stroke-1 text-stone-500" />
          <p className="font-editorial text-lg text-white font-bold uppercase">NO MATCHING ARTICLES FOUND</p>
          <p className="text-xs text-stone-400 font-sans-body max-w-md mx-auto">
            We couldn't find any stories matching "{searchQuery}". Try checking your spelling or clearing category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className="group cursor-pointer bg-[#181818] border border-[#282828] hover:border-stone-400 p-4 rounded-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="w-full h-44 rounded-xs overflow-hidden mb-3 relative bg-[#121212]">
                  <ArtGraphic type={item.imageKey} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex items-center justify-between gap-2 font-mono-meta text-[11px] text-stone-400 mb-2 min-w-0 w-full overflow-hidden">
                  <span className="text-[#E50914] font-bold uppercase bg-[#222222] px-2 py-0.5 rounded-xs text-[10px] inline-block truncate shrink min-w-0">
                    {item.category}
                  </span>
                  <span className="shrink-0 text-[11px] text-stone-400 font-medium whitespace-nowrap ml-auto">{item.date}</span>
                </div>
                <h3 className="font-editorial text-sm sm:text-base font-bold text-white group-hover:text-[#E50914] transition-colors leading-snug line-clamp-2 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-400 font-sans-body line-clamp-3 mb-3">
                  {item.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between font-mono-meta text-[11px] text-stone-300 group-hover:text-[#E50914] pt-2 border-t border-[#222222]">
                <span>READ STORY</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
