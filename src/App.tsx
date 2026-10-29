/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/HeroSection';
import { BooksSection } from './components/BooksSection';
import { PodcastsSection } from './components/PodcastsSection';
import { MuseumSection } from './components/MuseumSection';
import { ColumnsSection } from './components/ColumnsSection';
import { SearchResultsSection } from './components/SearchResultsSection';
import { Footer } from './components/Footer';
import { ArticleModal } from './components/ArticleModal';
import { PodcastPlayer } from './components/PodcastPlayer';
import { BookmarksModal } from './components/BookmarksModal';
import { Article } from './data/artData';

export default function App() {
  const [activeSection, setActiveSection] = useState('HOME');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activePodcast, setActivePodcast] = useState<Article | null>(null);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // In-Page Inline Search State (100% Non-Floating!)
  const [isSearchInlineOpen, setIsSearchInlineOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Bookmarks stored in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tan_bookmarks');
      return saved ? JSON.parse(saved) : ['hero-1', 'book-1'];
    } catch {
      return ['hero-1', 'book-1'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tan_bookmarks', JSON.stringify(bookmarkedIds));
    } catch {
      // Ignore storage errors
    }
  }, [bookmarkedIds]);

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectSection = (section: string) => {
    setActiveSection(section);
    setSelectedArticle(null); // Return to main sections view when clicking section tabs
    if (section === 'HOME') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePlayEpisode = (article: Article) => {
    if (activePodcast?.id === article.id) {
      setIsPlayingPodcast(!isPlayingPodcast);
    } else {
      setActivePodcast(article);
      setIsPlayingPodcast(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setIsSearchInlineOpen(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#121212] text-stone-200 font-sans-body selection:bg-[#E50914] selection:text-white flex flex-col justify-between">
      {/* Full-bleed Header Navigation (ALWAYS VISIBLE at the very top!) */}
      <HeaderNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        bookmarkCount={bookmarkedIds.length}
        currentlyPlaying={isPlayingPodcast}
        onTogglePlayer={() => setIsPlayingPodcast(!isPlayingPodcast)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        isSearchInlineOpen={isSearchInlineOpen}
        onToggleInlineSearch={() => setIsSearchInlineOpen(!isSearchInlineOpen)}
      />

      {/* Main Application Area directly under main site header */}
      <main className="w-full flex-grow pb-16">
        {selectedArticle ? (
          /* Dedicated In-Page Article View (Header stays 100% visible at the top!) */
          <ArticleModal
            article={selectedArticle}
            onClose={() => setSelectedArticle(null)}
            onToggleBookmark={handleToggleBookmark}
            isBookmarked={bookmarkedIds.includes(selectedArticle.id)}
            onPlayPodcast={(art) => handlePlayEpisode(art)}
            onSelectRelatedArticle={(art) => setSelectedArticle(art)}
            onNavigateToSection={(sec) => {
              setSelectedArticle(null);
              handleSelectSection(sec);
            }}
          />
        ) : (searchQuery.trim() !== '' || (isSearchInlineOpen && selectedCategory !== 'ALL')) ? (
          /* Inline Search Results Section */
          <SearchResultsSection
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSelectArticle={(art) => setSelectedArticle(art)}
            onClearSearch={handleClearSearch}
          />
        ) : (
          /* Main Newspaper Broadsheet Sections */
          <>
            {/* Hero Section */}
            <HeroSection
              onSelectArticle={(art) => setSelectedArticle(art as Article)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />

            {/* Section 1: BOOKS */}
            <BooksSection
              onSelectArticle={(art) => setSelectedArticle(art)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />

            {/* Section 2: PODCASTS */}
            <PodcastsSection
              onSelectArticle={(art) => setSelectedArticle(art)}
              onPlayEpisode={handlePlayEpisode}
              activeEpisodeId={activePodcast?.id}
              isPlaying={isPlayingPodcast}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />

            {/* Section 3: MUSEUM */}
            <MuseumSection
              onSelectArticle={(art) => setSelectedArticle(art)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />

            {/* Section 4: COLUMNS */}
            <ColumnsSection
              onSelectArticle={(art) => setSelectedArticle(art)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />
          </>
        )}
      </main>

      {/* Full-bleed Footer */}
      <Footer onSelectSection={handleSelectSection} />

      {/* Bookmarks Drawer */}
      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarkedIds={bookmarkedIds}
        onToggleBookmark={handleToggleBookmark}
        onSelectArticle={(art) => setSelectedArticle(art)}
      />

      {/* Sticky Bottom Podcast Player */}
      <PodcastPlayer
        episode={activePodcast}
        onClose={() => {
          setIsPlayingPodcast(false);
          setActivePodcast(null);
        }}
        isPlaying={isPlayingPodcast}
        setIsPlaying={setIsPlayingPodcast}
      />
    </div>
  );
}
