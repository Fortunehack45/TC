import React, { useState } from 'react';
import { Search, Bookmark, Volume2, Menu, X, Filter, TrendingUp } from 'lucide-react';
import { MarketTicker } from './MarketTicker';

interface HeaderNavProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  onOpenBookmarks: () => void;
  bookmarkCount: number;
  currentlyPlaying: boolean;
  onTogglePlayer?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  isSearchInlineOpen: boolean;
  onToggleInlineSearch: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenBookmarks,
  bookmarkCount,
  currentlyPlaying,
  onTogglePlayer,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isSearchInlineOpen,
  onToggleInlineSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'HOME', label: 'HOME' },
    { id: 'WORLD', label: 'WORLD' },
    { id: 'POLITICS', label: 'POLITICS' },
    { id: 'FINANCE', label: 'FINANCE' },
    { id: 'TECHNOLOGY', label: 'TECHNOLOGY' },
    { id: 'SCIENCE', label: 'SCIENCE' },
    { id: 'EDUCATION', label: 'EDUCATION' },
    { id: 'LIFESTYLE', label: 'LIFESTYLE' },
    { id: 'FASHION', label: 'FASHION' },
    { id: 'CELEBRITY', label: 'CELEBRITY' },
    { id: 'SPORT', label: 'SPORT' },
    { id: 'PODCASTS', label: 'PODCASTS' },
  ];

  const trendingTopics = [
    'Geneva Climate Accord',
    'AI Quantum Chips',
    'Central Bank Rates',
    'Paris Fashion Week',
    'Formula 1 Interlagos',
    'CRISPR Gene Therapy',
  ];

  const handleNavClick = (id: string) => {
    onSelectSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-[#121212] text-stone-200 border-b border-[#222222] sticky top-0 z-40">
      {/* Live Financial Market Ticker Bar */}
      <MarketTicker />

      {/* Topmost Minimal Bar Indicator */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between text-[11px] font-mono-meta tracking-widest text-stone-400 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-stone-200 font-bold">HOME</span>
          <span className="text-stone-600">|</span>
          <span className="text-stone-400 truncate max-w-[180px] sm:max-w-none">
            THE CHRONICLES • INTERNATIONAL EDITION
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {currentlyPlaying && (
            <button
              onClick={onTogglePlayer}
              className="flex items-center gap-1.5 text-[#E50914] hover:underline transition-colors animate-pulse min-h-[32px]"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AUDIO DISPATCH PLAYING</span>
            </button>
          )}
          <span>2026</span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-4">
        {/* Left: Official CHR Red Logo Badge */}
        <button
          onClick={() => handleNavClick('HOME')}
          className="flex items-center focus:outline-none group shrink-0 min-h-[44px]"
          title="The Chronicles Home"
        >
          <img
            src="/logo.png"
            alt="The Chronicles"
            className="h-8 sm:h-9 w-auto object-contain rounded-xs shadow-md group-hover:brightness-110 transition duration-200"
          />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 xl:gap-6 text-[11px] font-mono-meta tracking-wider uppercase overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id && !searchQuery;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 min-h-[40px] flex items-center ${
                  isActive
                    ? 'text-[#E50914] border-[#E50914] font-bold'
                    : 'text-stone-300 hover:text-white border-transparent'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Search Toggle, Bookmarks, and Mobile Menu Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenBookmarks}
            className="relative p-2.5 text-stone-300 hover:text-white hover:bg-[#1E1E1E] rounded-xs transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Saved Reading List"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarkCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#E50914] text-white text-[10px] font-bold font-mono-meta w-4 h-4 rounded-full flex items-center justify-center">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Inline Search Toggle Button */}
          <button
            onClick={onToggleInlineSearch}
            className={`p-2.5 rounded-xs transition-colors flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center ${
              isSearchInlineOpen
                ? 'bg-[#E50914] text-white font-bold'
                : 'text-stone-300 hover:text-white hover:bg-[#1E1E1E]'
            }`}
            title="Toggle Search Bar"
          >
            {isSearchInlineOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs font-mono-meta">
              {isSearchInlineOpen ? 'CLOSE SEARCH' : 'SEARCH'}
            </span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 bg-[#1E1E1E] text-stone-200 hover:text-white rounded-xs transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* INLINE IN-PAGE SEARCH PANEL */}
      {isSearchInlineOpen && (
        <div className="w-full bg-[#181818] border-t border-[#282828] py-4 px-3 sm:px-5">
          <div className="max-w-[1600px] mx-auto space-y-3">
            {/* Inline Search Bar Input */}
            <div className="flex items-center gap-3 bg-[#121212] border-2 border-[#282828] focus-within:border-[#E50914] px-4 py-2.5 rounded-xs">
              <Search className="w-5 h-5 text-[#E50914] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search world news, finance, tech, science, politics, fashion, sport..."
                autoFocus
                className="w-full bg-transparent text-white placeholder-stone-500 font-sans-body text-sm sm:text-base focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-stone-400 hover:text-white p-1 text-xs font-mono-meta shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filters & Trending Topics */}
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono-meta text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                <span className="text-stone-500 flex items-center gap-1 shrink-0 text-[11px]">
                  <Filter className="w-3 h-3" /> FILTER:
                </span>
                {['ALL', 'WORLD', 'POLITICS', 'FINANCE', 'TECHNOLOGY', 'SCIENCE', 'FASHION', 'SPORT'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1 rounded-xs transition-colors whitespace-nowrap text-[11px] font-bold min-h-[32px] ${
                      selectedCategory === cat
                        ? 'bg-[#E50914] text-white'
                        : 'text-stone-400 hover:text-stone-200 bg-[#222222]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Trending topics */}
              <div className="hidden md:flex items-center gap-2 text-[11px] text-stone-400">
                <span className="text-stone-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#E50914]" /> TRENDING:
                </span>
                {trendingTopics.slice(0, 4).map((topic) => (
                  <button
                    key={topic}
                    onClick={() => onSearchChange(topic)}
                    className="hover:text-white hover:underline transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#181818] border-t border-[#282828] p-4 flex flex-col gap-2 font-mono-meta text-xs tracking-wider max-h-[70vh] overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`text-left px-4 py-3 rounded-xs transition-colors font-bold min-h-[44px] flex items-center justify-between ${
                activeSection === item.id
                  ? 'bg-[#E50914] text-white'
                  : 'text-stone-300 hover:bg-[#222222] hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {activeSection === item.id && <span>•</span>}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
