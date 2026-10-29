import React from 'react';

interface FooterProps {
  onSelectSection: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectSection }) => {
  return (
    <footer className="w-full bg-[#0E0E0E] text-stone-300 pt-16 pb-12 border-t border-[#222222]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-[#222222] text-left">
          {/* Logo Badge */}
          <div className="flex flex-col items-start text-left">
            <div 
              onClick={() => onSelectSection('HOME')}
              className="inline-flex bg-[#E50914] text-white font-masthead font-extrabold text-lg tracking-widest px-3 py-1.5 rounded-xs shadow cursor-pointer mb-4"
            >
              C H R
            </div>
            <p className="font-editorial text-xs text-stone-400 max-w-xs leading-relaxed text-left">
              The Global Chronicle is an international digital news organization providing independent journalism across world politics, global finance, technology, science, lifestyle, fashion, celebrity culture, and sports.
            </p>
          </div>

          {/* News Chapters */}
          <div className="flex flex-col items-start text-left">
            <h4 className="font-mono-meta text-xs font-bold text-white uppercase tracking-widest mb-4 text-left">
              NEWS DESKS
            </h4>
            <ul className="space-y-2.5 font-mono-meta text-xs text-stone-400 text-left w-full">
              <li>
                <button 
                  onClick={() => onSelectSection('WORLD')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  WORLD & POLITICS
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectSection('FINANCE')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  FINANCE & ECONOMICS
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectSection('TECHNOLOGY')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  TECHNOLOGY & AI
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectSection('SCIENCE')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  SCIENCE & INNOVATION
                </button>
              </li>
            </ul>
          </div>

          {/* Culture & Sport */}
          <div className="flex flex-col items-start text-left">
            <h4 className="font-mono-meta text-xs font-bold text-white uppercase tracking-widest mb-4 text-left">
              CULTURE & SPORT
            </h4>
            <ul className="space-y-2.5 font-mono-meta text-xs text-stone-400 text-left w-full">
              <li>
                <button 
                  onClick={() => onSelectSection('FASHION')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  FASHION & STYLE
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectSection('CELEBRITY')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block leading-snug"
                >
                  CELEBRITY & ENTERTAINMENT
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectSection('SPORT')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  SPORTS & ATHLETICS
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectSection('PODCASTS')} 
                  className="text-left w-full hover:text-[#E50914] transition-colors block"
                >
                  AUDIO DISPATCHES
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col items-start text-left">
            <h4 className="font-mono-meta text-xs font-bold text-white uppercase tracking-widest mb-4 text-left">
              CONTACT & BUREAUS
            </h4>
            <div className="space-y-2 font-mono-meta text-xs text-stone-400 text-left w-full">
              <p className="hover:text-white transition-colors cursor-pointer text-left">CHRONICLE@GLOBAL.COM</p>
              <p className="hover:text-white transition-colors cursor-pointer text-left">+44 20 7946 0912</p>
              <p className="text-[11px] text-stone-500 pt-2 text-left leading-normal">
                LONDON • NEW YORK • GENEVA • TOKYO • PARIS
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono-meta text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} THE GLOBAL CHRONICLE. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap items-center gap-6">
            <span className="hover:text-stone-300 cursor-pointer">PRIVACY POLICY</span>
            <span className="hover:text-stone-300 cursor-pointer">TERMS OF SERVICE</span>
            <span className="hover:text-stone-300 cursor-pointer">EDITORIAL ETHICS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
