import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowUpRight, ArrowRight, Clock, Calendar, User, Tag, Filter, Sparkles, ChevronRight, Home, Activity, Headphones } from 'lucide-react';
import { DBArticle } from '../lib/database.types';
import { getArticles } from '../lib/supabase';
import { ArtGraphic } from './ArtGraphics';
import { getAllArticles, Article } from '../data/artData';

interface CategoryPageProps {
  category: string;
  onSelectArticle: (article: any) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
  onBackToHome: () => void;
  onOpenAuth?: () => void;
  onNavigateToSection?: (sec: string) => void;
}

const CATEGORY_META: Record<string, { title: string; subtitle: string; subtopics: string[] }> = {
  WORLD: {
    title: 'WORLD DISPATCHES & DIPLOMACY',
    subtitle: 'Authoritative reporting on international accords, bilateral treaties, and global geopolitical movements across 190+ sovereign territories.',
    subtopics: ['ALL', 'Diplomacy', 'Climate', 'Geneva', 'Clean Energy', 'Accords'],
  },
  POLITICS: {
    title: 'POLITICAL POWER & PARLIAMENT',
    subtitle: 'Unvarnished coverage of parliamentary coalitions, cabinet reshuffles, elections, and sovereign defense policy.',
    subtopics: ['ALL', 'Elections', 'Westminster', 'Defense', 'Legislation', 'Coalitions'],
  },
  FINANCE: {
    title: 'GLOBAL MARKETS & MACROECONOMICS',
    subtitle: 'Telemetry from central banks, bond markets, sovereign debt, currency fluctuations, and private equity investments.',
    subtopics: ['ALL', 'Central Banks', 'Inflation', 'Equities', 'Commodities', 'Bonds'],
  },
  TECHNOLOGY: {
    title: 'FRONTIER COMPUTATION & INTELLIGENCE',
    subtitle: 'Silicon Valley laboratories, optical quantum processors, neural network architectures, and national cloud boundaries.',
    subtopics: ['ALL', 'Quantum', 'AI', 'Silicon Valley', 'Hardware', 'Computing'],
  },
  SCIENCE: {
    title: 'EMPIRICAL SCIENCE & DISCOVERY',
    subtitle: 'Astrophysical spectrometry, exoplanetary biomarkers, CRISPR genomic interventions, and clean fusion energetics.',
    subtopics: ['ALL', 'Astrophysics', 'Space', 'Biomarkers', 'Genomics', 'Physics'],
  },
  LIFESTYLE: {
    title: 'LIFESTYLE & ARCHITECTURAL SANCTUARY',
    subtitle: 'Nordic mass-timber construction, passive thermal dwellings, culinary craftsmanship, and sensory minimalism.',
    subtopics: ['ALL', 'Architecture', 'Design', 'Nordic', 'Sustainability', 'Living'],
  },
  FASHION: {
    title: 'HAUTE COUTURE & HOROLOGY',
    subtitle: 'Runway critiques from Paris and Milan, ultra-thin mechanical complications, and textile heritage.',
    subtopics: ['ALL', 'Haute Horology', 'Watches', 'Paris', 'Design', 'Couture'],
  },
  CELEBRITY: {
    title: 'CULTURE, CINEMA & PROFILES',
    subtitle: 'Exclusive portraits of cultural iconoclasts, Cannes and Venice premiers, literary figures, and theatrical revivals.',
    subtopics: ['ALL', 'Cinema', 'Interviews', 'Profiles', 'Literary', 'Culture'],
  },
  SPORT: {
    title: 'HIGH-PERFORMANCE ATHLETICS & MOTORSPORT',
    subtitle: 'Formula 1 aerodynamic telemetry, Grand Slam court mechanics, Champions League tactics, and marathon physiology.',
    subtopics: ['ALL', 'Formula 1', 'Engineering', 'Motorsport', 'Interlagos', 'Tactics'],
  },
  EDUCATION: {
    title: 'GLOBAL EDUCATION, ACADEMIA & RESEARCH',
    subtitle: 'Higher education governance, scientific research universities, pedagogical innovations, and academic policy.',
    subtopics: ['ALL', 'Higher Ed', 'Research', 'Policy', 'Academia', 'Pedagogy', 'Essays'],
  },
  BOOKS: {
    title: 'GLOBAL EDUCATION, ACADEMIA & RESEARCH',
    subtitle: 'Higher education governance, scientific research universities, pedagogical innovations, and academic policy.',
    subtopics: ['ALL', 'Higher Ed', 'Research', 'Policy', 'Academia', 'Pedagogy', 'Essays'],
  },
  PODCASTS: {
    title: 'AUDIO DISPATCHES & CORRESPONDENCE',
    subtitle: 'Daily audio investigations, in-depth correspondent interviews, and investigative serial recordings.',
    subtopics: ['ALL', 'Dispatches', 'Interviews', 'Investigations', 'Special Series'],
  },
};

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  onBackToHome,
  onOpenAuth,
}) => {
  const [selectedSubtopic, setSelectedSubtopic] = useState('ALL');
  const [dbArticles, setDbArticles] = useState<DBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);

  const catMeta = CATEGORY_META[category] || {
    title: `${category} DISPATCHES`,
    subtitle: `Authoritative reporting and editorial analysis across ${category.toLowerCase()}.`,
    subtopics: ['ALL', 'Analysis', 'Reports', 'Special Coverage'],
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setSelectedSubtopic('ALL');
    setVisibleCount(15);

    getArticles(category, false).then((data) => {
      if (mounted) {
        setDbArticles(data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [category]);

  // Transform Supabase articles directly - 100% database driven
  const combinedArticles: any[] = dbArticles.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.subtitle,
    excerpt: a.subtitle || (a.content_html ? a.content_html.replace(/<[^>]+>/g, '').slice(0, 180) + '...' : ''),
    content_html: a.content_html,
    category: a.category_id,
    section: a.category_id,
    author: a.author_name,
    date: new Date(a.published_at || a.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    readTime: a.read_time,
    cover_image_url: a.cover_image_url,
    video_url: a.video_url,
    tags: a.tags || [],
    views_count: a.views_count,
    likes_count: a.likes_count,
  }));

  // Filter by subtopic/tag
  const filteredArticles = combinedArticles.filter((art) => {
    if (selectedSubtopic === 'ALL') return true;
    const sub = selectedSubtopic.toLowerCase();
    const tagMatch = art.tags?.some((t: string) => t.toLowerCase().includes(sub));
    const titleMatch = art.title?.toLowerCase().includes(sub);
    const catMatch = art.category?.toLowerCase().includes(sub);
    return tagMatch || titleMatch || catMatch;
  });

  const leadArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1, visibleCount);
  const hasMore = filteredArticles.length > visibleCount;

  return (
    <div className="w-full bg-[#121212] text-stone-200 font-sans-body pb-20">
      {/* Category Masthead Header */}
      <section className="w-full border-b border-[#242424] bg-[#141414] py-8 px-4 sm:px-8">
        <div className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 font-mono-meta text-xs text-stone-400 mb-6">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-stone-500" />
              <span>HOME</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-stone-500 uppercase">CATEGORIES</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-[#E50914] font-bold uppercase">{category}</span>
          </nav>

          {/* Grand Masthead Category Title */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#282828] pb-6">
            <div>
              <div className="inline-block bg-[#E50914] text-white font-mono-meta font-bold text-[10px] tracking-widest px-2.5 py-0.5 uppercase mb-3 rounded-xs">
                THE CHRONICLES DESK
              </div>
              <h1 className="font-masthead text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-wide uppercase leading-tight">
                {catMeta.title}
              </h1>
            </div>
            <p className="font-editorial text-stone-400 text-sm sm:text-base max-w-xl italic leading-relaxed">
              &ldquo;{catMeta.subtitle}&rdquo;
            </p>
          </div>

          {/* Subtopic Filter Bar */}
          <div className="flex items-center gap-2 pt-5 overflow-x-auto scrollbar-none">
            <span className="text-xs font-mono-meta text-stone-500 uppercase flex items-center gap-1 shrink-0 mr-2">
              <Filter className="w-3.5 h-3.5 text-[#E50914]" /> TOPICS:
            </span>
            {catMeta.subtopics.map((topic) => {
              const isActive = selectedSubtopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedSubtopic(topic)}
                  className={`px-3 py-1 font-mono-meta text-xs uppercase tracking-wider rounded-xs transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#E50914] text-white font-bold shadow-md'
                      : 'bg-[#1E1E1E] text-stone-400 hover:text-white hover:bg-[#282828]'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Category Broadsheet Grid */}
      <main className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-5 mt-8 space-y-10">
        {category === 'PODCASTS' ? (
          <div className="py-24 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#282828] flex items-center justify-center mx-auto text-[#E50914] shadow-lg">
              <Headphones className="w-8 h-8" />
            </div>
            <span className="font-mono-meta text-xs text-[#E50914] uppercase tracking-widest font-bold block">
              EDITORIAL AUDIO BUREAU &bull; CORRESPONDENCE
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl text-white font-bold">
              There are no podcasts yet.
            </h3>
            <p className="font-editorial text-sm text-stone-400 leading-relaxed">
              Our audio desk is currently recording investigative correspondence and special series. Check back later.
            </p>
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B1B1B] hover:bg-[#E50914] border border-[#2C2C2C] hover:border-[#E50914] text-xs font-mono-meta font-bold text-stone-300 hover:text-white transition rounded-xs mt-4 cursor-pointer"
            >
              &larr; BACK
            </button>
          </div>
        ) : loading ? (
          <div className="py-24 text-center font-mono-meta text-xs text-stone-500 animate-pulse">
            LOADING CATEGORY ARCHIVES...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-[#161616] border border-dashed border-[#282828] p-12 text-center text-stone-400 font-mono-meta text-xs">
            No dispatches found under #{selectedSubtopic}. Select &ldquo;ALL&rdquo; to browse all dispatches.
          </div>
        ) : (
          <>
            {/* Lead Story Feature */}
            {leadArticle && (
              <div
                onClick={() => onSelectArticle(leadArticle)}
                className="group cursor-pointer bg-[#181818] border border-[#2B2B2B] hover:border-[#E50914] transition-all duration-300 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-xs shadow-2xl"
              >
                {/* Visual Lead Cover (Left 7 cols) */}
                <div className="lg:col-span-7 h-64 sm:h-96 md:h-[420px] rounded-xs overflow-hidden border border-[#2D2D2D] relative bg-[#111]">
                  {leadArticle.cover_image_url ? (
                    <img
                      src={leadArticle.cover_image_url}
                      alt={leadArticle.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/og-image.png';
                      }}
                    />
                  ) : leadArticle.imageKey ? (
                    <ArtGraphic type={leadArticle.imageKey} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
                      <Sparkles className="w-12 h-12 text-[#E50914]" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-[#E50914] text-white px-2.5 py-1 text-[11px] font-mono-meta font-bold uppercase tracking-wider rounded-xs">
                    FEATURED LEAD DISPATCH
                  </div>
                </div>

                {/* Lead Headline & Thesis (Right 5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono-meta text-[#E50914] font-bold tracking-widest uppercase">
                        {leadArticle.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(leadArticle.id);
                        }}
                        className="text-stone-500 hover:text-[#E50914] p-1 transition-colors"
                        title={bookmarkedIds.includes(leadArticle.id) ? 'Remove Bookmark' : 'Save Article'}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${bookmarkedIds.includes(leadArticle.id) ? 'fill-[#E50914] text-[#E50914]' : ''}`}
                        />
                      </button>
                    </div>

                    <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-white group-hover:text-[#E50914] leading-tight transition-colors">
                      {leadArticle.title}
                    </h2>

                    <p className="font-sans-body text-stone-300 text-sm sm:text-base leading-relaxed mt-4 line-clamp-4">
                      {leadArticle.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-mono-meta text-stone-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-500" /> {leadArticle.author || 'The Editorial Board'}
                    </span>
                    <span className="text-[#E50914] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      READ FULL DISPATCH <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of Subsequent Articles */}
            {gridArticles.length > 0 && (
              <div>
                <div className="border-b border-[#282828] pb-3 mb-6 flex items-center justify-between">
                  <h3 className="font-masthead text-xl font-bold uppercase tracking-wider text-white">
                    MORE DISPATCHES IN {category}
                  </h3>
                  <span className="font-mono-meta text-xs text-stone-500">
                    {gridArticles.length} ARTICLES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridArticles.map((art) => {
                    const isBookmarked = bookmarkedIds.includes(art.id);
                    return (
                      <article
                        key={art.id}
                        onClick={() => onSelectArticle(art)}
                        className="group cursor-pointer bg-[#161616] border border-[#262626] hover:border-[#E50914] transition-all p-5 flex flex-col justify-between rounded-xs shadow-lg"
                      >
                        <div>
                          {/* Thumbnail if present */}
                          {art.cover_image_url ? (
                            <div className="w-full h-44 mb-4 rounded-xs overflow-hidden border border-[#2D2D2D] bg-[#111]">
                              <img
                                src={art.cover_image_url}
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/og-image.png';
                                }}
                              />
                            </div>
                          ) : art.imageKey ? (
                            <div className="w-full h-44 mb-4 rounded-xs overflow-hidden border border-[#2D2D2D] bg-[#111]">
                              <ArtGraphic type={art.imageKey} className="w-full h-full object-cover" />
                            </div>
                          ) : null}

                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-mono-meta bg-[#E50914] text-white px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                              {art.category}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(art.id);
                              }}
                              className="text-stone-500 hover:text-[#E50914] p-1 transition-colors"
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                            </button>
                          </div>

                          <h3 className="font-editorial text-lg sm:text-xl font-bold text-white group-hover:text-[#E50914] leading-snug transition-colors line-clamp-2 mb-2">
                            {art.title}
                          </h3>

                          <p className="text-xs text-stone-400 font-sans-body line-clamp-3 leading-relaxed mb-4">
                            {art.excerpt}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono-meta text-stone-500">
                          <span>{art.readTime || '5 min read'}</span>
                          <span>{art.author || 'The Editorial Board'}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="pt-10 pb-4 text-center">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 15)}
                      className="px-6 py-3 bg-[#1C1C1C] hover:bg-[#E50914] border border-[#2D2D2D] hover:border-[#E50914] text-stone-200 hover:text-white font-mono-meta text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-lg"
                    >
                      LOAD MORE DISPATCHES ({filteredArticles.length - visibleCount} REMAINING) &darr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
