import React from 'react';
import { PODCAST_EPISODES, Article } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { Play, Pause, Radio, Volume2, ArrowUpRight, Bookmark } from 'lucide-react';

interface PodcastsSectionProps {
  onSelectArticle: (article: Article) => void;
  onPlayEpisode: (article: Article) => void;
  activeEpisodeId?: string;
  isPlaying?: boolean;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
}

export const PodcastsSection: React.FC<PodcastsSectionProps> = ({
  onSelectArticle,
  onPlayEpisode,
  activeEpisodeId,
  isPlaying,
  onToggleBookmark,
  bookmarkedIds,
}) => {
  return (
    <section id="PODCASTS" className="w-full bg-[#121212] py-10 px-2 sm:px-4 md:px-5 max-w-[98%] 2xl:max-w-[1920px] mx-auto border-b border-[#222222]">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#282828]">
        <div className="flex items-center gap-3">
          <h2 className="font-masthead text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white">
            PODCASTS
          </h2>
          <span className="bg-[#E50914] text-white text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded-xs flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" /> WEEKLY AUDIO
          </span>
        </div>
        <span className="font-mono-meta text-xs text-stone-400">HOSTED BY BEN LUKE</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Large Featured Podcast Artwork Card */}
        <div 
          onClick={() => onPlayEpisode(PODCAST_EPISODES[0])}
          className="lg:col-span-6 group cursor-pointer bg-[#181818] border border-[#282828] hover:border-stone-500 p-6 rounded-sm flex flex-col justify-between transition-all relative overflow-hidden"
        >
          <div className="w-full h-64 sm:h-80 rounded-xs overflow-hidden mb-6 relative">
            <ArtGraphic type="podcast_main" className="w-full h-full" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="bg-[#E50914] text-white p-4 rounded-full shadow-2xl group-hover:scale-110 transition-transform">
                {activeEpisodeId === PODCAST_EPISODES[0].id && isPlaying ? (
                  <Pause className="w-8 h-8 fill-white" />
                ) : (
                  <Play className="w-8 h-8 fill-white ml-1" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono-meta text-xs text-stone-400 border-t border-[#2A2A2A] pt-4">
            <span className="text-[#E50914] font-semibold flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> FEATURED EPISODE
            </span>
            <span>42 MINS • HOST: BEN LUKE</span>
          </div>
        </div>

        {/* Right: Vertical List of Podcast Episodes */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          {PODCAST_EPISODES.map((ep) => {
            const isCurrent = activeEpisodeId === ep.id;
            const isBookmarked = bookmarkedIds.includes(ep.id);

            return (
              <div
                key={ep.id}
                className={`group bg-[#181818] border ${
                  isCurrent ? 'border-[#E50914] bg-[#1E1818]' : 'border-[#282828] hover:border-stone-500'
                } p-4 rounded-sm flex items-start gap-4 transition-all`}
              >
                {/* Thumbnail graphic */}
                <div 
                  onClick={() => onPlayEpisode(ep)}
                  className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xs overflow-hidden relative cursor-pointer"
                >
                  <ArtGraphic type={ep.imageKey} className="w-full h-full" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="bg-[#E50914] text-white p-2 rounded-full shadow">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Content details */}
                <div className="flex-1 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 overflow-hidden">
                      <span className="font-mono-meta text-[11px] text-stone-400 shrink-0">
                        {ep.date}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {ep.tag && (
                          <span className="font-mono-meta text-[10px] font-bold uppercase tracking-wider bg-[#E50914] text-white px-2 py-0.5 rounded-xs inline-block truncate max-w-[120px]">
                            {ep.tag}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(ep.id);
                          }}
                          className="text-stone-500 hover:text-[#E50914] p-0.5"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#E50914] text-[#E50914]' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <h3 
                      onClick={() => onSelectArticle(ep)}
                      className="font-editorial text-sm sm:text-base font-bold text-white group-hover:text-[#E50914] cursor-pointer leading-snug mb-1 transition-colors"
                    >
                      {ep.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between font-mono-meta text-xs text-stone-400 pt-2 border-t border-[#282828] mt-2">
                    <button
                      onClick={() => onPlayEpisode(ep)}
                      className="text-[#E50914] hover:underline flex items-center gap-1 font-semibold"
                    >
                      {isCurrent && isPlaying ? 'PAUSE PODCAST' : 'LISTEN NOW'}
                    </button>
                    <span>{ep.audioDuration}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
