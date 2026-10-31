import React, { useState, useEffect, useRef } from 'react';
import { Article, getAllArticles } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { Search, X, ArrowUpRight, TrendingUp, Filter } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedCategory('ALL');
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trendingTopics = [
    'Geneva Climate',
    'AI Quantum Chips',
    'Central Bank Rates',
    'Paris Fashion Week',
    'Formula 1 Interlagos',
    'CRISPR Gene Therapy',
  ];

  // Master list of all articles
  const allArticles: Article[] = getAllArticles();

  // Filtering logic
  const filtered = allArticles.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      item.section === selectedCategory;

    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.author && item.author.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto pt-12 sm:pt-20"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#161616] border border-[#2D2D2D] w-full max-w-2xl rounded-xs text-stone-200 overflow-hidden shadow-2xl relative my-auto flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#2B2B2B] bg-[#1C1C1C] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#E50914] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search world news, finance, tech, science, politics, fashion, sport..."
            className="w-full bg-transparent text-white placeholder-stone-500 font-sans-body text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-white rounded transition-colors shrink-0"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-[#262626] text-stone-300 hover:bg-[#E50914] hover:text-white p-1.5 rounded-full transition-colors ml-1 shrink-0"
            title="Close Search (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 py-2.5 bg-[#121212] border-b border-[#262626] flex items-center gap-2 overflow-x-auto font-mono-meta text-xs scrollbar-none">
          <span className="text-stone-500 flex items-center gap-1 shrink-0 text-[11px] mr-1">
            <Filter className="w-3 h-3" /> FILTER:
          </span>
          {['ALL', 'NIGERIA', 'WORLD', 'POLITICS', 'FINANCE', 'TECHNOLOGY', 'SCIENCE', 'FASHION', 'SPORT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xs transition-colors whitespace-nowrap text-[11px] font-semibold ${
                selectedCategory === cat
                  ? 'bg-[#E50914] text-white'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#222222]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Trending Chips (When query is short) */}
        {!query && (
          <div className="p-4 bg-[#141414] border-b border-[#222222] flex flex-wrap items-center gap-2 font-mono-meta text-xs">
            <span className="text-stone-500 text-[11px] font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#E50914]" /> TRENDING:
            </span>
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setQuery(topic)}
                className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#E50914] hover:text-white text-stone-300 rounded-xs text-[11px] transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Instant Search Results List */}
        <div className="p-4 sm:p-5 max-h-[55vh] overflow-y-auto space-y-3 divide-y divide-[#222222]">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-stone-500 font-mono-meta text-xs space-y-1">
              <p className="font-bold text-stone-400">NO RESULTS FOUND</p>
              <p className="text-[11px]">No articles matched "{query}"</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectArticle(item);
                  onClose();
                }}
                className="pt-3 first:pt-0 group cursor-pointer flex items-center justify-between gap-4 p-2 hover:bg-[#1A1A1A] rounded-xs transition-colors"
              >
                <div className="w-14 h-14 shrink-0 rounded-xs overflow-hidden border border-[#2A2A2A]">
                  <ArtGraphic type={item.imageKey} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono-meta text-[10px] text-stone-400 mb-0.5">
                    <span className="text-[#E50914] font-bold uppercase">{item.section}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                  <h4 className="font-editorial text-xs sm:text-sm font-bold text-stone-200 group-hover:text-[#E50914] transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-sans-body truncate">
                    {item.excerpt}
                  </p>
                </div>

                <ArrowUpRight className="w-4 h-4 text-stone-500 group-hover:text-[#E50914] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#121212] border-t border-[#222222] flex items-center justify-between text-[11px] font-mono-meta text-stone-500">
          <span>SHOWING {filtered.length} RESULTS</span>
          <span className="hidden sm:inline">PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};
