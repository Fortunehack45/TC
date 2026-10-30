/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/HeroSection';
import { HeadlinesSection } from './components/HeadlinesSection';
import { BooksSection } from './components/BooksSection';
import { MuseumSection } from './components/MuseumSection';
import { SportsSection } from './components/SportsSection';
import { ColumnsSection } from './components/ColumnsSection';
import { SearchResultsSection } from './components/SearchResultsSection';
import { CategoryPage } from './components/CategoryPage';
import { AuthModal, AuthMode } from './components/AuthModal';
import { Footer } from './components/Footer';
import { ArticleModal } from './components/ArticleModal';
import { PodcastPlayer } from './components/PodcastPlayer';
import { BookmarksModal } from './components/BookmarksModal';
import { Article, mapDBArticleToArticle, setLoadedArticles } from './data/artData';
import { toggleArticleBookmark, supabase } from './lib/supabase';
import { getPostPreviewImage } from './lib/imageHelper';

function MainApp() {
  const { user } = useAuth();

  // Read initial section from URL (?section= or ?category=) or sessionStorage
  const getInitialSection = (): string => {
    try {
      const path = window.location.pathname.toLowerCase();
      const catMatch = path.match(/^\/(?:category|section)\/([^/]+)/);
      if (catMatch && catMatch[1]) {
        return catMatch[1].toUpperCase();
      }

      const params = new URLSearchParams(window.location.search);
      const s = params.get('section') || params.get('category');
      if (s) return s.toUpperCase();
      const saved = sessionStorage.getItem('tc_active_section');
      if (saved) return saved.toUpperCase();
    } catch {}
    return 'HOME';
  };

  const [activeSection, setActiveSection] = useState<string>(getInitialSection);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [activePodcast, setActivePodcast] = useState<Article | null>(null);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('signin');

  // Check for password recovery hash on mount or auth events
  useEffect(() => {
    const checkRecovery = () => {
      if (window.location.hash && window.location.hash.includes('type=recovery')) {
        setAuthModalMode('reset');
        setIsAuthModalOpen(true);
      }
    };
    checkRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalMode('reset');
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Live Database Articles (100% directly loaded from Supabase tc_articles)
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // In-Page Inline Search State
  const [isSearchInlineOpen, setIsSearchInlineOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Bookmarks stored in localStorage and synced with Supabase
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      // Purge any legacy/fake prototype bookmarks and caches
      localStorage.removeItem('tan_bookmarks');
      localStorage.removeItem('tc_bookmarks');
      localStorage.removeItem('tc_bookmarks_v2');
      const saved = localStorage.getItem('tc_bookmarks_v3');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Strictly cleanse any legacy/fake/prototype mock IDs
      return parsed.filter(
        (id) => typeof id === 'string' && id.length > 5 && !id.startsWith('hero-') && !id.startsWith('book-') && !id.startsWith('lead-') && !id.startsWith('mock-')
      );
    } catch {
      return [];
    }
  });

  // Helper to synchronize URL query parameters and short paths with active state
  const syncUrlState = (section: string, article: any | null) => {
    try {
      if (article) {
        const slugOrId = article.slug || article.id;
        const newUrl = `/p/${encodeURIComponent(slugOrId)}`;
        window.history.replaceState({ section, articleId: article?.id }, '', newUrl);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      params.delete('article');
      if (section && section !== 'HOME') {
        params.set('section', section.toLowerCase());
      } else {
        params.delete('section');
        params.delete('category');
      }

      const q = params.toString();
      const newUrl = q ? `/?${q}` : '/';
      window.history.replaceState({ section, articleId: null }, '', newUrl);
    } catch {}
  };

  // Load all published articles directly from Supabase tc_articles
  const loadDatabaseArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const { data, error } = await supabase
        .from('tc_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDBArticleToArticle);
        setArticles(mapped);
        setLoadedArticles(mapped);
      }
    } catch (err) {
      console.warn('Failed to load articles from Supabase:', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    loadDatabaseArticles();
  }, []);

  // Helper to extract article param from query (?article=) or short path (/p/:slug or /article/:slug)
  const getRequestedArticleParam = (): string | null => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('article');
      if (q) return q;

      const path = window.location.pathname;
      const match = path.match(/^\/(?:p|article)\/([^/]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }

      const lastArticle = sessionStorage.getItem('tc_last_article');
      if (lastArticle && (path === '/' || path === '' || path.startsWith('/p/'))) {
        return lastArticle;
      }
    } catch {}
    return null;
  };

  // Safe article lookup by slug or UUID without crashing PostgREST
  const fetchArticleByParam = async (param: string): Promise<Article | null> => {
    try {
      // 1. Check in memory first
      const inMemory = articles.find((a) => a.id === param || a.slug === param);
      if (inMemory) return inMemory;

      // 2. Query Supabase safely (never pass non-UUID string to id.eq)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(param);
      let query = supabase.from('tc_articles').select('*');
      if (isUuid) {
        query = query.or(`slug.eq.${param},id.eq.${param}`);
      } else {
        query = query.eq('slug', param);
      }
      const { data, error } = await query.limit(1);
      if (!error && data && data.length > 0) {
        return mapDBArticleToArticle(data[0]);
      }
    } catch (err) {
      console.warn('Error querying requested article:', err);
    }
    return null;
  };

  // Check for ?article= or /p/:slug in URL on initial mount
  useEffect(() => {
    const articleParam = getRequestedArticleParam();
    if (articleParam) {
      fetchArticleByParam(articleParam).then((art) => {
        if (art) setSelectedArticle(art);
      });
    }
  }, []);

  // Synchronize browser history and popstate (Back / Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const secParam = params.get('section') || params.get('category');
      const targetSec = secParam ? secParam.toUpperCase() : 'HOME';
      setActiveSection(targetSec);

      const articleParam = getRequestedArticleParam();
      if (articleParam) {
        fetchArticleByParam(articleParam).then((art) => {
          setSelectedArticle(art);
        });
      } else {
        setSelectedArticle(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles]);

  // Update browser URL and Dynamic Open Graph & Twitter Cards when article or section changes
  useEffect(() => {
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Keep URL search params synchronized
    syncUrlState(activeSection, selectedArticle);

    if (selectedArticle) {
      document.title = `${selectedArticle.title} - The Chronicles`;
      const previewImg = getPostPreviewImage(selectedArticle);
      const absoluteImg = previewImg.startsWith('http://') || previewImg.startsWith('https://')
        ? previewImg
        : `https://tc-dusky.vercel.app${previewImg.startsWith('/') ? '' : '/'}${previewImg}`;
      const desc = selectedArticle.subtitle || selectedArticle.excerpt || 'Authoritative global reporting from The Chronicles.';
      const articleUrl = `https://tc-dusky.vercel.app/?article=${encodeURIComponent(selectedArticle.slug || selectedArticle.id)}`;

      setMeta('property', 'og:title', `${selectedArticle.title} - The Chronicles`);
      setMeta('property', 'og:description', desc);
      setMeta('property', 'og:image', absoluteImg);
      setMeta('property', 'og:url', articleUrl);
      setMeta('name', 'twitter:title', `${selectedArticle.title} - The Chronicles`);
      setMeta('name', 'twitter:description', desc);
      setMeta('name', 'twitter:image', absoluteImg);
    } else {
      const sectionTitle = activeSection !== 'HOME'
        ? `${activeSection} - The Chronicles`
        : 'The Chronicles - World News, Finance, Tech & Culture';

      document.title = sectionTitle;
      const siteImg = 'https://tc-dusky.vercel.app/og-image.png';
      setMeta('property', 'og:title', sectionTitle);
      setMeta('property', 'og:description', 'A full-spectrum digital news publication covering world politics, global finance, technology, science, lifestyle, fashion, celebrity, and sports.');
      setMeta('property', 'og:image', siteImg);
      setMeta('property', 'og:url', 'https://tc-dusky.vercel.app');
      setMeta('name', 'twitter:title', sectionTitle);
      setMeta('name', 'twitter:description', 'A full-spectrum digital news publication covering world politics, global finance, technology, science, lifestyle, fashion, celebrity, and sports.');
      setMeta('name', 'twitter:image', siteImg);
    }
  }, [selectedArticle, activeSection]);

  // Sync bookmarks with Supabase for authenticated user
  useEffect(() => {
    if (user) {
      supabase
        .from('tc_bookmarks')
        .select('article_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const dbIds = data
              .map((b) => b.article_id)
              .filter(
                (id) => typeof id === 'string' && id.length > 5 && !id.startsWith('hero-') && !id.startsWith('book-') && !id.startsWith('lead-') && !id.startsWith('mock-')
              );
            setBookmarkedIds((prev) =>
              Array.from(new Set([...prev.filter(
                (id) => typeof id === 'string' && id.length > 5 && !id.startsWith('hero-') && !id.startsWith('book-') && !id.startsWith('lead-') && !id.startsWith('mock-')
              ), ...dbIds]))
            );
          }
        });
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('tc_bookmarks_v3', JSON.stringify(bookmarkedIds));
    } catch {
      // Ignore storage errors
    }
  }, [bookmarkedIds]);

  const handleToggleBookmark = async (id: string) => {
    const isCurrentlySaved = bookmarkedIds.includes(id);
    setBookmarkedIds((prev) =>
      isCurrentlySaved ? prev.filter((item) => item !== id) : [...prev, id]
    );

    if (user) {
      try {
        await toggleArticleBookmark(id, user.id, isCurrentlySaved);
      } catch (err) {
        console.warn('Could not sync bookmark with Supabase:', err);
      }
    }
  };

  const CATEGORY_KEYS = [
    'WORLD', 'POLITICS', 'FINANCE', 'TECHNOLOGY', 'SCIENCE', 'EDUCATION',
    'LIFESTYLE', 'FASHION', 'CELEBRITY', 'SPORT', 'BOOKS', 'PODCASTS'
  ];

  const handleSelectSection = (section: string) => {
    const target = section.toUpperCase();
    setActiveSection(target);
    setSelectedArticle(null);
    try {
      sessionStorage.setItem('tc_active_section', target);
      sessionStorage.removeItem('tc_last_article');
    } catch {}
    syncUrlState(target, null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (art: any) => {
    setSelectedArticle(art);
    try {
      sessionStorage.setItem('tc_last_article', art.slug || art.id);
    } catch {}
    syncUrlState(activeSection, art);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    try {
      sessionStorage.removeItem('tc_last_article');
    } catch {}
    syncUrlState(activeSection, null);
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

  const isCategoryView = CATEGORY_KEYS.includes(activeSection);

  return (
    <div className="w-full min-h-screen bg-[#121212] text-stone-200 font-sans-body flex flex-col justify-between">
      {/* Full-bleed Header Navigation */}
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
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
        onOpenResetPassword={() => {
          setAuthModalMode('reset');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Application Content Area */}
      <main className="w-full flex-grow pb-16">
        {selectedArticle ? (
          /* Dedicated In-Page Article View */
          <ArticleModal
            article={selectedArticle}
            onClose={handleCloseArticle}
            onToggleBookmark={handleToggleBookmark}
            isBookmarked={bookmarkedIds.includes(selectedArticle.id)}
            onPlayPodcast={(art) => handlePlayEpisode(art)}
            onSelectRelatedArticle={(art) => handleSelectArticle(art)}
            onNavigateToSection={(sec) => {
              handleCloseArticle();
              handleSelectSection(sec);
            }}
            onOpenAuth={() => {
              setAuthModalMode('signin');
              setIsAuthModalOpen(true);
            }}
          />
        ) : (searchQuery.trim() !== '' || (isSearchInlineOpen && selectedCategory !== 'ALL')) ? (
          /* Inline Search Results Section */
          <SearchResultsSection
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSelectArticle={(art) => handleSelectArticle(art)}
            onClearSearch={handleClearSearch}
            articles={articles}
          />
        ) : isCategoryView ? (
          /* Dedicated High-End Category Page (World, Politics, Finance, Tech, Science, Sport News, etc.) */
          <CategoryPage
            category={activeSection}
            onSelectArticle={(art) => handleSelectArticle(art)}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            onBackToHome={() => handleSelectSection('HOME')}
            onOpenAuth={() => {
              setAuthModalMode('signin');
              setIsAuthModalOpen(true);
            }}
            onNavigateToSection={(sec) => handleSelectSection(sec)}
          />
        ) : (
          /* Main Newspaper Broadsheet Front Page */
          <>
            {/* Hero Section */}
            <HeroSection
              onSelectArticle={(art) => handleSelectArticle(art as Article)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
              articles={articles}
            />

            {/* Daily Headlines Section (12 Headlines Per Day Across Required Categories) */}
            <HeadlinesSection
              articles={articles}
              onSelectArticle={(art) => handleSelectArticle(art as Article)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
            />

            {/* Section 1: WORLD & POLITICS */}
            <BooksSection
              onSelectArticle={(art) => handleSelectArticle(art)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
              articles={articles.filter((a) => a.category === 'WORLD' || a.category === 'POLITICS')}
            />

            {/* Section 2: FINANCE & TECHNOLOGY */}
            <MuseumSection
              onSelectArticle={(art) => handleSelectArticle(art)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
              articles={articles.filter((a) => a.category === 'FINANCE' || a.category === 'TECHNOLOGY')}
            />

            {/* Section 3: SPORTS & ATHLETIC CULTURE */}
            <SportsSection
              onSelectArticle={(art) => handleSelectArticle(art)}
              onNavigateToCategory={() => handleSelectSection('SPORT')}
              articles={articles.filter((a) => a.category === 'SPORT')}
            />

            {/* Section 4: SCIENCE, LIFESTYLE & CULTURE */}
            <ColumnsSection
              onSelectArticle={(art) => handleSelectArticle(art)}
              onToggleBookmark={handleToggleBookmark}
              bookmarkedIds={bookmarkedIds}
              articles={articles.filter((a) => ['SCIENCE', 'LIFESTYLE', 'FASHION', 'EDUCATION', 'CELEBRITY', 'BOOKS'].includes(a.category))}
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
        onSelectArticle={(art) => handleSelectArticle(art)}
        articles={articles}
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

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
