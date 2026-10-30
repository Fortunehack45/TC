import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bookmark,
  Volume2,
  Menu,
  X,
  Filter,
  TrendingUp,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { MarketTicker } from './MarketTicker';
import { useAuth } from '../context/AuthContext';

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
  onOpenAuth: () => void;
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
  onOpenAuth,
}) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Subscriber';
  const displayInitial = (displayName[0] || 'S').toUpperCase();

  return (
    <header className="w-full bg-[#121212] text-stone-200 border-b border-[#222222] sticky top-0 z-40">
      {/* Live Financial Market Ticker Bar */}
      <MarketTicker />

      {/* Topmost Minimal Bar Indicator */}
      <div className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-5 py-2 flex items-center justify-between text-[11px] font-mono-meta tracking-widest text-stone-400 border-b border-[#1A1A1A]">
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

          {/* Quick Sign In or Member Indicator */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[130px]">{displayName}</span>
              {isAdmin && (
                <span className="text-[9px] bg-[#E50914] text-white px-1.5 py-0.2 rounded-xs font-bold">
                  ADMIN
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden sm:inline hover:text-white transition-colors cursor-pointer text-[10px] uppercase font-bold text-stone-300"
            >
              SUBSCRIBER LOGIN
            </button>
          )}

          <span className="text-stone-600">|</span>
          <span>2026</span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-5 py-3 flex items-center justify-between gap-3 sm:gap-4">
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

        {/* Right: Search Toggle, Bookmarks, Sign In / Profile, and Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Saved Bookmarks Button */}
          <button
            onClick={onOpenBookmarks}
            className="relative p-2.5 text-stone-300 hover:text-white hover:bg-[#1E1E1E] rounded-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Saved Reading List"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarkCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#E50914] text-white text-[10px] font-bold font-mono-meta w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Inline Search Toggle Button */}
          <button
            onClick={onToggleInlineSearch}
            className={`p-2.5 rounded-xs transition-colors flex items-center gap-1.5 min-h-[40px] min-w-[40px] justify-center cursor-pointer ${
              isSearchInlineOpen
                ? 'bg-[#E50914] text-white font-bold'
                : 'text-stone-300 hover:text-white hover:bg-[#1E1E1E]'
            }`}
            title="Toggle Search Bar"
          >
            {isSearchInlineOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            <span className="hidden md:inline text-xs font-mono-meta">
              {isSearchInlineOpen ? 'CLOSE' : 'SEARCH'}
            </span>
          </button>

          {/* USER SIGN IN / PROFILE TRIGGER */}
          {user ? (
            /* Logged-in Profile Dropdown */
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] rounded-xs transition-colors cursor-pointer min-h-[40px]"
                title="Account Menu"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-6 h-6 rounded-full object-cover border border-[#444444]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#E50914] text-white font-bold text-xs flex items-center justify-center">
                    {displayInitial}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-mono-meta text-stone-200 font-bold max-w-[100px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#181818] border border-[#2E2E2E] shadow-2xl rounded-xs py-2 z-50 animate-in fade-in duration-150 text-stone-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-[#282828]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#E50914] text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {displayInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-editorial text-sm font-bold text-white truncate">
                          {displayName}
                        </p>
                        <p className="font-mono-meta text-[11px] text-stone-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-mono-meta text-[10px] tracking-wider uppercase text-stone-400">
                        {isAdmin ? 'Editorial Administrator' : 'Chronicles Subscriber'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-1 text-xs font-mono-meta">
                    {/* Admin Hub Link (if admin) */}
                    {isAdmin && (
                      <a
                        href="/admin"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 text-[#E50914] hover:bg-[#222222] font-bold transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>OPEN ADMIN HUB →</span>
                      </a>
                    )}

                    {/* Bookmarks */}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onOpenBookmarks();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-stone-300 hover:text-white hover:bg-[#222222] transition-colors text-left"
                    >
                      <Bookmark className="w-4 h-4 text-stone-400" />
                      <span>Saved Reading List ({bookmarkCount})</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-[#282828] pt-1">
                    <button
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-stone-400 hover:text-red-400 hover:bg-[#222222] text-xs font-mono-meta transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>SIGN OUT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out Sign In / Register Button */
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#E50914] hover:bg-[#C40711] text-white font-mono-meta text-xs font-bold rounded-xs tracking-wider transition-colors min-h-[40px] shadow-sm cursor-pointer"
              title="Subscriber Sign In / Register"
            >
              <User className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 bg-[#1E1E1E] text-stone-200 hover:text-white rounded-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* INLINE IN-PAGE SEARCH PANEL */}
      {isSearchInlineOpen && (
        <div className="w-full bg-[#181818] border-t border-[#282828] py-4 px-3 sm:px-5">
          <div className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-5 space-y-3">
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
                  className="text-stone-400 hover:text-white p-1 text-xs font-mono-meta shrink-0 cursor-pointer"
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
                    className={`px-3 py-1 rounded-xs transition-colors whitespace-nowrap text-[11px] font-bold min-h-[32px] cursor-pointer ${
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
                    className="hover:text-white hover:underline transition-colors cursor-pointer"
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
        <div className="xl:hidden bg-[#181818] border-t border-[#282828] p-4 flex flex-col gap-3 font-mono-meta text-xs tracking-wider max-h-[80vh] overflow-y-auto">
          {/* Mobile Auth Callout Box */}
          <div className="p-3.5 bg-[#141414] border border-[#2A2A2A] rounded-xs mb-2">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E50914] text-white font-bold flex items-center justify-center text-sm">
                    {displayInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-editorial text-sm font-bold text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#222222]">
                  {isAdmin && (
                    <a
                      href="/admin"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 bg-[#E50914] text-white font-bold text-center rounded-xs"
                    >
                      ADMIN HUB
                    </a>
                  )}
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                    }}
                    className="flex-1 py-2 px-3 bg-[#242424] text-stone-300 hover:text-white font-bold text-center rounded-xs"
                  >
                    LOG OUT
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-bold text-xs uppercase">Subscriber Access</p>
                  <p className="text-[10px] text-stone-400">Join discussions & save articles</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="px-3.5 py-2 bg-[#E50914] hover:bg-[#C40711] text-white font-bold rounded-xs tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>SIGN IN</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xs transition-colors font-bold min-h-[40px] flex items-center justify-between ${
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
        </div>
      )}
    </header>
  );
};
