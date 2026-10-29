import React from 'react';
import { Article, getAllArticles } from '../data/artData';
import { Bookmark, X, Trash2 } from 'lucide-react';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onSelectArticle: (article: Article) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarkedIds,
  onToggleBookmark,
  onSelectArticle,
}) => {
  if (!isOpen) return null;

  const allArticles: Article[] = getAllArticles();
  const savedArticles = allArticles.filter((item) => bookmarkedIds.includes(item.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
      <div 
        className="bg-[#161616] border-l border-[#2D2D2D] w-full max-w-md h-full text-stone-200 overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2D2D2D] bg-[#1C1C1C] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono-meta text-xs">
            <Bookmark className="w-4 h-4 text-[#E50914] fill-[#E50914]" />
            <span className="font-bold text-white uppercase tracking-wider">SAVED READING LIST ({savedArticles.length})</span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Items */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 divide-y divide-[#282828]">
          {savedArticles.length === 0 ? (
            <div className="text-center py-20 text-stone-500 font-mono-meta text-xs space-y-2">
              <Bookmark className="w-8 h-8 mx-auto stroke-1 text-stone-600" />
              <p>NO SAVED ARTICLES YET</p>
              <p className="text-[11px] text-stone-600">Click the bookmark icon on any story to read later.</p>
            </div>
          ) : (
            savedArticles.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 group flex items-start justify-between gap-3">
                <div 
                  onClick={() => {
                    onSelectArticle(item);
                    onClose();
                  }}
                  className="cursor-pointer flex-1"
                >
                  <span className="text-[10px] font-mono-meta text-[#E50914] font-bold uppercase">
                    {item.section} • {item.date}
                  </span>
                  <h4 className="font-editorial text-sm font-bold text-white group-hover:text-[#E50914] transition-colors leading-snug">
                    {item.title}
                  </h4>
                </div>

                <button
                  onClick={() => onToggleBookmark(item.id)}
                  className="text-stone-500 hover:text-[#E50914] p-1 shrink-0"
                  title="Remove from saved list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
