import React from 'react';

interface ArtGraphicProps {
  type: string;
  className?: string;
  alt?: string;
}

export const ArtGraphic: React.FC<ArtGraphicProps> = ({ type, className = '', alt = 'Graphic' }) => {
  switch (type) {
    case 'hero_world_globe':
      return (
        <div className={`relative bg-[#D91B1B] overflow-hidden flex items-center justify-center ${className}`} role="img" aria-label={alt}>
          <div className="absolute inset-0 bg-[#D91B1B] flex items-center justify-center p-2">
            <svg viewBox="0 0 400 480" className="w-full h-full object-contain filter drop-shadow-2xl">
              <defs>
                <linearGradient id="globeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#F0F0F0" />
                  <stop offset="100%" stopColor="#A0A0A0" />
                </linearGradient>
              </defs>

              {/* Wireframe World Globe */}
              <circle cx="200" cy="240" r="140" fill="none" stroke="url(#globeGlow)" strokeWidth="3" />
              <ellipse cx="200" cy="240" rx="140" ry="60" fill="none" stroke="#E2E2E2" strokeWidth="2" strokeDasharray="6 4" />
              <ellipse cx="200" cy="240" rx="70" ry="140" fill="none" stroke="#E2E2E2" strokeWidth="2" />
              <line x1="60" y1="240" x2="340" y2="240" stroke="#FFFFFF" strokeWidth="2.5" />
              <line x1="200" y1="100" x2="200" y2="380" stroke="#FFFFFF" strokeWidth="2.5" />

              {/* Continent Outlines in high contrast monochrome */}
              <path d="M 140 180 Q 180 150 220 180 Q 250 210 210 240 Q 170 230 140 180 Z" fill="#FFFFFF" opacity="0.9" />
              <path d="M 170 260 Q 200 240 230 270 Q 210 320 180 310 Z" fill="#E2E2E2" opacity="0.85" />
              <path d="M 240 160 Q 280 150 300 180 Q 280 200 250 180 Z" fill="#FFFFFF" opacity="0.8" />

              {/* Orbital Arc */}
              <path d="M 80 280 Q 200 120 320 280" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
              <circle cx="200" cy="200" r="6" fill="#FFFFFF" />
            </svg>
          </div>
        </div>
      );

    case 'finance_market_chart':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden flex items-center justify-center ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#121212" />
            {/* Financial Grid Lines */}
            {[40, 80, 120, 160, 200].map((y) => (
              <line key={y} x1="20" y1={y} x2="380" y2={y} stroke="#222" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {/* Bullish Stock Curve */}
            <path d="M 30 180 L 90 150 L 140 170 L 210 100 L 270 120 L 370 40" fill="none" stroke="#D91B1B" strokeWidth="3.5" />
            <path d="M 30 180 L 90 150 L 140 170 L 210 100 L 270 120 L 370 40 L 370 220 L 30 220 Z" fill="url(#financeGrad)" opacity="0.15" />
            {/* Candlesticks */}
            <line x1="90" y1="130" x2="90" y2="165" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="86" y="140" width="8" height="15" fill="#FFFFFF" />
            <line x1="210" y1="85" x2="210" y2="115" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="206" y="92" width="8" height="18" fill="#FFFFFF" />
            <line x1="370" y1="25" x2="370" y2="55" stroke="#D91B1B" strokeWidth="2" />
            <circle cx="370" cy="40" r="5" fill="#D91B1B" />
          </svg>
        </div>
      );

    case 'tech_circuit_ai':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden flex items-center justify-center ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#0F0F0F" />
            {/* Microchip / AI Neural Circuit */}
            <rect x="140" y="75" width="120" height="100" fill="#1E1E1E" stroke="#FFFFFF" strokeWidth="2" rx="4" />
            <rect x="165" y="100" width="70" height="50" fill="#D91B1B" rx="2" />
            <text x="200" y="130" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontFamily="monospace" fontWeight="bold">AI-1000</text>
            {/* Pins */}
            {[150, 170, 190, 210, 230, 250].map((x) => (
              <React.Fragment key={x}>
                <line x1={x} y1="75" x2={x} y2="40" stroke="#888" strokeWidth="2" />
                <circle cx={x} cy="40" r="3" fill="#FFFFFF" />
                <line x1={x} y1="175" x2={x} y2="210" stroke="#888" strokeWidth="2" />
                <circle cx={x} cy="210" r="3" fill="#FFFFFF" />
              </React.Fragment>
            ))}
          </svg>
        </div>
      );

    case 'science_dna_atom':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden flex items-center justify-center ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#121212" />
            {/* Atomic Orbits */}
            <ellipse cx="200" cy="125" rx="110" ry="40" fill="none" stroke="#FFFFFF" strokeWidth="2" transform="rotate(-30 200 125)" />
            <ellipse cx="200" cy="125" rx="110" ry="40" fill="none" stroke="#D91B1B" strokeWidth="2" transform="rotate(30 200 125)" />
            <ellipse cx="200" cy="125" rx="110" ry="40" fill="none" stroke="#888888" strokeWidth="1.5" transform="rotate(90 200 125)" />
            {/* Nucleus */}
            <circle cx="200" cy="125" r="16" fill="#D91B1B" />
            <circle cx="196" cy="121" r="5" fill="#FFFFFF" />
          </svg>
        </div>
      );

    case 'politics_capitol':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#181818" />
            {/* Capitol Dome Silhouette */}
            <path d="M 150 250 L 150 140 Q 200 80 250 140 L 250 250 Z" fill="#D0D0D0" />
            <rect x="180" y="60" width="40" height="25" fill="#E5E5E5" />
            <polygon points="200,30 180,60 220,60" fill="#FFFFFF" />
            <line x1="200" y1="15" x2="200" y2="30" stroke="#D91B1B" strokeWidth="2" />
            {/* Columns */}
            {[160, 180, 200, 220, 240].map((x) => (
              <line key={x} x1={x} y1="140" x2={x} y2="250" stroke="#111111" strokeWidth="2" />
            ))}
          </svg>
        </div>
      );

    case 'fashion_runway':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#0A0A0A" />
            {/* Haute Couture Fashion Runway Silhouette */}
            <polygon points="120,250 200,100 280,250" fill="#E5E5E5" />
            <polygon points="175,100 200,40 225,100" fill="#D91B1B" />
            <circle cx="200" cy="30" r="10" fill="#FFFFFF" />
            {/* Spotlight cone */}
            <polygon points="200,0 80,250 320,250" fill="#FFFFFF" opacity="0.12" />
          </svg>
        </div>
      );

    case 'celebrity_spotlight':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#121212" />
            {/* Camera Lens Spotlight */}
            <circle cx="200" cy="125" r="75" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="200" cy="125" r="50" fill="none" stroke="#D91B1B" strokeWidth="2" />
            <circle cx="200" cy="125" r="25" fill="#D91B1B" />
            <circle cx="190" cy="115" r="8" fill="#FFFFFF" />
            <line x1="50" y1="50" x2="350" y2="200" stroke="#444" strokeWidth="1" />
            <line x1="350" y1="50" x2="50" y2="200" stroke="#444" strokeWidth="1" />
          </svg>
        </div>
      );

    case 'sports_stadium':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#151515" />
            {/* Stadium / Track Lines */}
            <ellipse cx="200" cy="160" rx="160" ry="70" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <ellipse cx="200" cy="160" rx="120" ry="50" fill="none" stroke="#D91B1B" strokeWidth="2" />
            <line x1="200" y1="90" x2="200" y2="230" stroke="#FFFFFF" strokeWidth="2" />
            {/* Stadium Lights */}
            <circle cx="60" cy="40" r="12" fill="#FFFFFF" />
            <circle cx="340" cy="40" r="12" fill="#FFFFFF" />
            <polygon points="60,40 100,230 20,230" fill="#FFFFFF" opacity="0.15" />
            <polygon points="340,40 380,230 300,230" fill="#FFFFFF" opacity="0.15" />
          </svg>
        </div>
      );

    case 'lifestyle_culture':
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden ${className}`}>
          <svg viewBox="0 0 400 250" className="w-full h-full object-cover">
            <rect width="400" height="250" fill="#181818" />
            <circle cx="200" cy="125" r="70" fill="#E2E2E2" />
            <path d="M 130 125 Q 200 70 270 125 Q 200 180 130 125 Z" fill="#D91B1B" />
          </svg>
        </div>
      );

    case 'podcast_main':
    default:
      return (
        <div className={`bg-[#141414] border border-[#222222] relative overflow-hidden flex items-center justify-center ${className}`}>
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <rect width="300" height="300" fill="#E8E8E8" />
            <circle cx="75" cy="115" r="38" fill="#1A1A1A" />
            <rect x="125" y="90" width="45" height="150" fill="#444444" />
            <rect x="185" y="130" width="55" height="110" fill="#777777" />
            <path d="M 115 240 L 115 175 A 32 32 0 0 1 179 175 L 179 240 Z" fill="#D91B1B" />
          </svg>
        </div>
      );
  }
};
