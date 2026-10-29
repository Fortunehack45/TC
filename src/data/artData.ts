export interface Article {
  id: string;
  section: 'HERO' | 'WORLD' | 'FINANCE' | 'TECHNOLOGY' | 'SCIENCE' | 'POLITICS' | 'LIFESTYLE' | 'FASHION' | 'CELEBRITY' | 'SPORT' | 'PODCASTS';
  category: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  fullContent?: string;
  date: string;
  author?: string;
  readTime?: string;
  imageKey: string;
  tag?: string;
  audioUrl?: string;
  audioDuration?: string;
}

export const HERO_NEWS: Article[] = [
  {
    id: 'hero-1',
    section: 'HERO',
    category: 'BREAKING NEWS',
    title: 'GLOBAL CLIMATE SUMMIT IN GENEVA SHAPES HISTORIC GREEN ENERGY ACCORD',
    date: '29 October 2026',
    author: 'Elena Rostova',
    readTime: '6 min read',
    imageKey: 'hero_world_globe',
    excerpt: 'World leaders and economic envoys convene in Switzerland to ratify a binding $400 billion clean transition framework targeting 2030 net-zero thresholds.',
    fullContent: `In an unprecedented diplomatic breakthrough, representatives from over 140 nations assembled at the Palais des Nations in Geneva to finalize the Global Clean Transition Accord. The treaty establishes enforceable emissions standards, backed by a multi-national green infrastructure development fund.

Key signatories highlighted the integration of advanced grid automation and offshore wind power networks across developing markets. "This agreement transcends geopolitical divisions, prioritizing ecological survival and sustainable industrial growth," noted UN Chief Climate Representative Dr. Aris Thorne during the plenary declaration.`
  },
  {
    id: 'hero-2',
    section: 'HERO',
    category: 'FINANCE',
    title: 'CENTRAL BANKS SIGNAL INTEREST RATE CUTS AS INFLATION RETREATS NATIONWIDE',
    date: '28 October 2026',
    author: 'Julian Vance',
    readTime: '5 min read',
    imageKey: 'finance_market_chart',
    excerpt: 'Global equity markets rally following joint statements from international monetary authorities indicating easing borrowing conditions.',
  },
  {
    id: 'hero-3',
    section: 'HERO',
    category: 'TECHNOLOGY',
    title: 'NEXT-GEN QUANTUM PROCESSORS ACHIEVE ULTRA-LOW LATENCY BENCHMARKS IN SILICON VALLEY',
    date: '27 October 2026',
    author: 'Samantha Brooks',
    readTime: '7 min read',
    imageKey: 'tech_circuit_ai',
    excerpt: 'Researchers demonstrate a 1,000-qubit fault-tolerant architecture capable of performing complex molecular simulations in seconds.',
  },
  {
    id: 'hero-4',
    section: 'HERO',
    category: 'WORLD',
    title: 'DIPLOMATIC TALKS IN TOKYO PAVE WAY FOR MULTILATERAL PACIFIC TRADE TREATY',
    date: '26 October 2026',
    author: 'Kenji Sato',
    readTime: '4 min read',
    imageKey: 'politics_capitol',
    excerpt: 'Ministers from nine Pacific Rim nations announce reduced tariffs and streamlined supply chain corridors for high-tech export goods.',
  },
  {
    id: 'hero-5',
    section: 'HERO',
    category: 'SCIENCE',
    title: 'DEEP-SPACE TELESCOPE CAPTURES HIGH-RESOLUTION ATMOSPHERIC DATA FROM EXOPLANET',
    date: '25 October 2026',
    author: 'Dr. Clara Sterling',
    readTime: '5 min read',
    imageKey: 'science_dna_atom',
    excerpt: 'Spectroscopic analysis reveals water vapor and nitrogen compounds surrounding a super-Earth located 120 light-years away.',
  },
];

export const WORLD_POLITICS_ARTICLES: Article[] = [
  {
    id: 'world-1',
    section: 'WORLD',
    category: 'DIPLOMACY',
    title: 'EUROPEAN UNION UNVEILS COMPREHENSIVE CYBERSECURITY DEFENSE INITIATIVE',
    excerpt: 'A $12 billion defense strategy mandates real-time threat intelligence sharing and hardened satellite communications across member states.',
    date: '28 October 2026',
    author: 'Antoine Laurent',
    readTime: '6 min read',
    imageKey: 'politics_capitol',
    fullContent: `Brussels officials have introduced the European Cyber Security Shield (ECSS), a coordinated military and civilian defense network designed to safeguard critical energy grids, financial clearinghouses, and telecommunications infrastructure against state-sponsored attacks.`
  },
  {
    id: 'world-2',
    section: 'POLITICS',
    category: 'ELECTIONS',
    title: 'HISTORIC VOTER TURNOUT IN SOUTH AMERICAN MIDTERMS SHIFTS REGIONAL LEGISLATIVE POWER',
    excerpt: 'Independent coalitions gain key congressional seats following campaigns centered on economic reform, anti-corruption, and education.',
    date: '25 October 2026',
    author: 'Maria Fernandez',
    readTime: '8 min read',
    imageKey: 'hero_world_globe',
    fullContent: `Voters across major South American metropolitan hubs turned out in record numbers for critical legislative elections, resulting in significant electoral shifts toward reformist independent parties prioritizing fiscal discipline and public investment.`
  },
  {
    id: 'world-3',
    section: 'WORLD',
    category: 'INFRASTRUCTURE',
    title: 'TRANS-AFRICAN HIGH-SPEED RAILWAY PROJECT COMPLETES FIRST 800-KILOMETER SEGMENT',
    excerpt: 'Engineers celebrate the opening of the electrified transit corridor connecting East African trade hubs to maritime ports.',
    date: '22 October 2026',
    author: 'Kwame Osei',
    readTime: '5 min read',
    imageKey: 'hero_world_globe',
    fullContent: `The flagship East African infrastructure initiative reached a major milestone today as passenger and freight trains commenced commercial operations between Nairobi and Mombasa, drastically reducing regional transport costs.`
  }
];

export const FINANCE_TECH_ARTICLES: Article[] = [
  {
    id: 'fintech-1',
    section: 'FINANCE',
    category: 'MARKETS',
    title: 'GLOBAL VENTURE CAPITAL INFLOWS SURGE TO RECORD HIGH IN AUTUMN QUARTER',
    excerpt: 'Institutional investors allocate over $180 billion toward artificial intelligence, autonomous logistics, and clean energy startups.',
    date: '27 October 2026',
    author: 'David Sterling',
    readTime: '7 min read',
    imageKey: 'finance_market_chart',
    fullContent: `Global venture investment rebounded aggressively in Q3 2026, driven by unprecedented capital deployment into generative computing, robotics, and next-generation battery storage technologies.`
  },
  {
    id: 'fintech-2',
    section: 'TECHNOLOGY',
    category: 'AI',
    title: 'AUTONOMOUS ROBOTICS FIRM REVEALS DUAL-ARM INDUSTRIAL ASSEMBLY BOT',
    excerpt: 'Featuring real-time tactile feedback and sub-millimeter precision, the machine automates complex micro-electronics manufacturing.',
    date: '24 October 2026',
    author: 'Lars Lindqvist',
    readTime: '6 min read',
    imageKey: 'tech_circuit_ai',
    fullContent: `Unveiled at the Zurich Automation Expo, the latest industrial robot operates alongside human technicians using computer vision and adaptive haptic sensors to assemble delicate optical circuits.`
  },
  {
    id: 'fintech-3',
    section: 'FINANCE',
    category: 'ECONOMICS',
    title: 'DECENTRALIZED COMMODITY EXCHANGES GAIN TRACTION AMONG GLOBAL TRADERS',
    excerpt: 'Smart-contract clearing mechanisms reduce settlement times for agricultural shipments from days to milliseconds.',
    date: '20 October 2026',
    author: 'Rachel Zheng',
    readTime: '5 min read',
    imageKey: 'finance_market_chart',
    fullContent: `Agricultural suppliers in South America and Southeast Asia are increasingly bypassing traditional intermediary banks in favor of blockchain-backed commodity clearing platforms that offer instant liquidity and transparent pricing.`
  }
];

export const SCIENCE_LIFESTYLE_ARTICLES: Article[] = [
  {
    id: 'scilife-1',
    section: 'SCIENCE',
    category: 'BIOTECH',
    title: 'CRISPR GENE-EDITING THERAPY SHOWS REMARKABLE PROMISE IN PHRASE III TRIALS',
    excerpt: 'Clinicians report complete remission of inherited blood disorders in 94% of trial patients with zero serious adverse side effects.',
    date: '26 October 2026',
    author: 'Dr. Evelyn Vance',
    readTime: '8 min read',
    imageKey: 'science_dna_atom',
    fullContent: `A landmark phase III clinical trial published in the New England Journal of Medicine confirms that single-dose genetic therapies can permanently correct beta-thalassemia and sickle cell disease in adult patients.`
  },
  {
    id: 'scilife-2',
    section: 'LIFESTYLE',
    category: 'TRAVEL',
    title: 'THE RISE OF REGENERATIVE RETREATS: SUSTAINABLE LUXURY SANCTUARIES AROUND THE WORLD',
    excerpt: 'From off-grid eco-lodges in Bhutan to zero-waste alpine resorts in Norway, travelers seek immersive nature experiences.',
    date: '23 October 2026',
    author: 'Camilla Rossi',
    readTime: '6 min read',
    imageKey: 'lifestyle_culture',
    fullContent: `High-end travel is undergoing a radical transformation as eco-conscious hospitality brands combine architectural beauty, solar power grid independence, and local community stewardship.`
  },
  {
    id: 'scilife-3',
    section: 'SCIENCE',
    category: 'ENERGY',
    title: 'COMMERCIAL FUSION REACTOR RECORDS DUST-FREE PLASMA CONFINEMENT FOR 100 HOURS',
    excerpt: 'Magnetic confinement breakthroughs bring clean fusion energy a step closer to grid integration.',
    date: '19 October 2026',
    author: 'Marcus Weber',
    readTime: '7 min read',
    imageKey: 'science_dna_atom',
    fullContent: `Nuclear scientists at the Culham Centre for Fusion Energy in the UK achieved a record-breaking continuous plasma run using superconducting tokamak coils, maintaining 150 million degrees Celsius without thermal decay.`
  }
];

export const FASHION_CELEBRITY_ARTICLES: Article[] = [
  {
    id: 'fashcel-1',
    section: 'FASHION',
    category: 'COUTURE',
    title: 'PARIS FASHION WEEK CELEBRATES SUSTAINABLE MATERIAL INNOVATION ON RUNWAY',
    excerpt: 'Leading ateliers showcase garments crafted from lab-grown silk, recycled cashmere, and bio-based leather alternatives.',
    date: '28 October 2026',
    author: 'Chloé Dubois',
    readTime: '5 min read',
    imageKey: 'fashion_runway',
    fullContent: `The spring haute couture presentations in Paris established a new benchmark for eco-chic design. Iconic fashion houses unveiled breathtaking evening wear made entirely from regenerative fibers and zero-dye organic cottons.`
  },
  {
    id: 'fashcel-2',
    section: 'CELEBRITY',
    category: 'ENTERTAINMENT',
    title: 'ACADEMY AWARD-WINNING DIRECTOR PREVIEWS HIGHLY ANTICIPATED SCI-FI EPIC IN LONDON',
    excerpt: 'The director discusses IMAX filming techniques, practical visual effects, and working with an international ensemble cast.',
    date: '25 October 2026',
    author: 'Gareth Thorne',
    readTime: '6 min read',
    imageKey: 'celebrity_spotlight',
    fullContent: `In an exclusive preview screening at London's Leicester Square, acclaimed director Christopher Nolan presented forty minutes of unreleased footage from his upcoming interstellar thriller, praising practical set design over pure CGI.`
  },
  {
    id: 'fashcel-3',
    section: 'FASHION',
    category: 'STYLE',
    title: 'RETROSPECTIVE MONOGRAPH HONORS THE ARCHITECTURAL SILHOUETTES OF CRISTÓBAL BALENCIAGA',
    excerpt: 'A curated volume explores Balenciaga’s revolutionary 1950s tailoring and lasting impact on modern avant-garde fashion.',
    date: '21 October 2026',
    author: 'Isabella Vane',
    readTime: '7 min read',
    imageKey: 'fashion_runway',
    fullContent: `Published by Thames & Hudson, a definitive new book chronicles Cristóbal Balenciaga's mastery of fabric drape, volumetric proportions, and timeless couture craftsmanship.`
  }
];

export const SPORT_ARTICLES: Article[] = [
  {
    id: 'sport-1',
    section: 'SPORT',
    category: 'FORMULA 1',
    title: 'TITLE DECIDER AT INTERLAGOS: CHAMPIONSHIP LEADER SECURES DRAMATIC POLE POSITION',
    excerpt: 'Under rain-soaked Brazilian skies, the championship leader produces a masterclass lap in Q3 to lead the grid for Sunday\'s Grand Prix.',
    date: '28 October 2026',
    author: 'Lewis Hamilton Jr.',
    readTime: '5 min read',
    imageKey: 'sports_stadium',
    fullContent: `In one of the most tense qualifying sessions of the 2026 Formula 1 calendar, track dampness at Sao Paulo's Interlagos circuit tested driver bravery to the limit as the pole position changed hands four times in the closing seconds.`
  },
  {
    id: 'sport-2',
    section: 'SPORT',
    category: 'FOOTBALL',
    title: 'CHAMPIONS LEAGUE DRAMA: LATE HEADED GOAL SEALS COMEBACK VICTORY IN MADRID',
    excerpt: 'A packed Santiago Bernabéu witnesses a thrilling 3-2 victory as the home side overturns a two-goal deficit in stoppage time.',
    date: '24 October 2026',
    author: 'Carlos Ramos',
    readTime: '4 min read',
    imageKey: 'sports_stadium',
    fullContent: `Real Madrid staged another miraculous European comeback under the floodlights, scoring twice in three frantic minutes of injury time to defeat Bayern Munich and secure their spot in the quarter-finals.`
  },
  {
    id: 'sport-3',
    section: 'SPORT',
    category: 'TENNIS',
    title: 'WORLD NUMBER ONE RETAINS INDOOR TITLE WITH FLAWLESS SERVING PERFORMANCE',
    excerpt: 'In straight sets, the defending champion fires 18 aces to claim their sixth ATP Masters trophy of the season.',
    date: '20 October 2026',
    author: 'Hannah Croft',
    readTime: '5 min read',
    imageKey: 'sports_stadium',
    fullContent: `At the Paris Masters indoor arena, precision baseline hitting and relentless first serves proved insurmountable as the top seed triumphed 6-4, 6-3 in just seventy minutes.`
  }
];

export const PODCAST_EPISODES: Article[] = [
  {
    id: 'pod-1',
    section: 'PODCASTS',
    category: 'PODCAST',
    tag: 'WORLD & TECH',
    title: 'The AI Geopolitics War: Who controls the silicon supply chain?',
    subtitle: 'Who controls the silicon supply chain?',
    excerpt: 'We analyze chip foundry investments in Arizona and Taiwan, and how semiconductor manufacturing dictates 21st-century diplomacy.',
    date: '28 October 2026',
    author: 'Host: Ben Luke & Sarah Jenkins',
    readTime: '45 min audio',
    imageKey: 'podcast_main',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-10781.mp3',
    audioDuration: '45:15'
  },
  {
    id: 'pod-2',
    section: 'PODCASTS',
    category: 'PODCAST',
    tag: 'FINANCE',
    title: 'Interest Rates & Global Debt: Are markets headed for a soft landing?',
    subtitle: 'Are markets headed for a soft landing?',
    excerpt: 'Leading economists break down inflation trajectories, commercial real estate revaluations, and global central bank balance sheets.',
    date: '21 October 2026',
    author: 'Host: Sarah Jenkins',
    readTime: '38 min audio',
    imageKey: 'podcast_main',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a82d02.mp3?filename=soft-rain-ambient-111154.mp3',
    audioDuration: '38:40'
  },
  {
    id: 'pod-3',
    section: 'PODCASTS',
    category: 'PODCAST',
    tag: 'CULTURE & SPORT',
    title: 'The Business of Modern Sports: Mega-stadiums and streaming rights',
    subtitle: 'Mega-stadiums and streaming rights',
    excerpt: 'An inside look into private equity investments in European football clubs, Formula 1 expansion in America, and digital streaming wars.',
    date: '14 October 2026',
    author: 'Host: Ben Luke',
    readTime: '42 min audio',
    imageKey: 'podcast_main',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxing-mountains-rivers-141318.mp3',
    audioDuration: '42:10'
  }
];

export const getAllArticles = (): Article[] => {
  return [
    ...HERO_NEWS,
    ...WORLD_POLITICS_ARTICLES,
    ...FINANCE_TECH_ARTICLES,
    ...SCIENCE_LIFESTYLE_ARTICLES,
    ...FASHION_CELEBRITY_ARTICLES,
    ...SPORT_ARTICLES,
    ...PODCAST_EPISODES,
  ];
};

export const getRelatedArticles = (currentArticle: Article): Article[] => {
  const all = getAllArticles().filter((item) => item.id !== currentArticle.id);

  // Match articles in the same category or section first
  const sameCategoryOrSection = all.filter(
    (item) =>
      item.category === currentArticle.category ||
      item.section === currentArticle.section
  );

  // If we have at least 3 matching items, pick 3
  if (sameCategoryOrSection.length >= 3) {
    return sameCategoryOrSection.slice(0, 3);
  }

  // Otherwise, fill remaining slots with other articles
  const remainingNeeded = 3 - sameCategoryOrSection.length;
  const backfill = all.filter((item) => !sameCategoryOrSection.includes(item));

  return [...sameCategoryOrSection, ...backfill.slice(0, remainingNeeded)];
};
