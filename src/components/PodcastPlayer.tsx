import React, { useRef, useState, useEffect } from 'react';
import { Article } from '../data/artData';
import { ArtGraphic } from './ArtGraphics';
import { Play, Pause, Volume2, VolumeX, X, Radio } from 'lucide-react';

interface PodcastPlayerProps {
  episode: Article | null;
  onClose: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  episode,
  onClose,
  isPlaying,
  setIsPlaying,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (episode && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [episode, isPlaying]);

  if (!episode) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#161616] border-t-2 border-[#E50914] text-stone-200 px-4 py-3 shadow-2xl backdrop-blur-md">
      <audio
        ref={audioRef}
        src={episode.audioUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-10781.mp3'}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Episode Info */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-1/3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xs overflow-hidden border border-[#2B2B2B]">
              <ArtGraphic type={episode.imageKey} className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono-meta text-[#E50914] font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> PODCAST
              </span>
              <p className="text-xs font-editorial font-bold text-white truncate max-w-[180px] sm:max-w-[200px]">
                {episode.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="sm:hidden text-stone-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Podcast Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Controls & Scrubber */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-1/2">
          <button
            onClick={togglePlay}
            className="bg-[#E50914] hover:bg-[#C40711] text-white p-2.5 rounded-full transition-colors shrink-0 shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isPlaying ? 'Pause Podcast' : 'Play Podcast'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <span className="font-mono-meta text-[10px] sm:text-[11px] text-stone-400 shrink-0">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[#E50914] h-1.5 bg-[#2D2D2D] rounded cursor-pointer"
          />

          <span className="font-mono-meta text-[10px] sm:text-[11px] text-stone-400 shrink-0">
            {episode.audioDuration || formatTime(duration)}
          </span>
        </div>

        {/* Mute & Desktop Close */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={toggleMute}
            className="text-stone-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#E50914]" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
