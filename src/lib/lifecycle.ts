export type LifecycleStatus = 'BREAKING' | 'HEADLINE' | 'DEVELOPING' | 'REGULAR' | 'ARCHIVED';

export interface ArticleLifecycle {
  status: LifecycleStatus;
  label: string;
  badgeText: string;
  badgeClass: string;
  hoursElapsed: number;
  timeAgoFormatted: string;
  stageDescription: string;
}

/**
 * Computes the dynamic publication lifecycle for an article:
 * - 0–6 hours:   Breaking (Highest visibility)
 * - 6–24 hours:  Headline (Remains prominently featured)
 * - 24–48 hours: Developing (Gradually loses prominence)
 * - 48–72 hours: Regular post (Migrates to normal feed)
 * - 72+ hours:   Archived/Standard (Accessible through categories and search)
 */
export function computeArticleLifecycle(
  publishedAt: string | Date | null | undefined,
  overrideStage?: string | null
): ArticleLifecycle {
  // If manual override is set (not 'auto'), respect editor's decision
  if (overrideStage && overrideStage !== 'auto') {
    const stage = overrideStage.toUpperCase();
    if (stage === 'BREAKING') {
      return {
        status: 'BREAKING',
        label: 'Breaking News',
        badgeText: 'BREAKING',
        badgeClass: 'bg-[#E50914] text-white border-red-500 shadow-xs',
        hoursElapsed: 0,
        timeAgoFormatted: 'Pinned Breaking',
        stageDescription: '0–6h: Highest visibility on Hero & Live feeds',
      };
    }
    if (stage === 'HEADLINE') {
      return {
        status: 'HEADLINE',
        label: 'Daily Headline',
        badgeText: 'HEADLINE',
        badgeClass: 'bg-amber-600 text-white border-amber-500 shadow-xs',
        hoursElapsed: 6,
        timeAgoFormatted: 'Pinned Headline',
        stageDescription: '6–24h: Prominently featured in Daily Headlines card',
      };
    }
    if (stage === 'DEVELOPING') {
      return {
        status: 'DEVELOPING',
        label: 'Developing Story',
        badgeText: 'DEVELOPING',
        badgeClass: 'bg-blue-600 text-white border-blue-500 shadow-xs',
        hoursElapsed: 24,
        timeAgoFormatted: 'Pinned Developing',
        stageDescription: '24–48h: Featured in beat sections with active development',
      };
    }
    if (stage === 'REGULAR') {
      return {
        status: 'REGULAR',
        label: 'Regular Post',
        badgeText: 'REGULAR',
        badgeClass: 'bg-stone-700 text-stone-200 border-stone-600',
        hoursElapsed: 48,
        timeAgoFormatted: 'Pinned Regular',
        stageDescription: '48–72h: Normal feed placement across broadsheet grids',
      };
    }
    if (stage === 'ARCHIVED') {
      return {
        status: 'ARCHIVED',
        label: 'Archived Dispatch',
        badgeText: 'ARCHIVED',
        badgeClass: 'bg-[#222222] text-stone-400 border-stone-800',
        hoursElapsed: 72,
        timeAgoFormatted: 'Archived',
        stageDescription: '72h+: Standard catalog search and topic categories',
      };
    }
  }

  // If no publication date is available, default to regular
  if (!publishedAt) {
    return {
      status: 'REGULAR',
      label: 'Regular Post',
      badgeText: 'STANDARD',
      badgeClass: 'bg-stone-700 text-stone-200 border-stone-600',
      hoursElapsed: 48,
      timeAgoFormatted: 'Recent',
      stageDescription: '48–72h: Normal broadsheet feed',
    };
  }

  const pubTime = new Date(publishedAt).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - pubTime);
  const hoursElapsed = diffMs / (1000 * 60 * 60);

  let timeAgoFormatted = '';
  if (hoursElapsed < 1) {
    const mins = Math.max(1, Math.round(hoursElapsed * 60));
    timeAgoFormatted = `${mins}m ago`;
  } else if (hoursElapsed < 24) {
    const h = Math.floor(hoursElapsed);
    timeAgoFormatted = `${h}h ago`;
  } else {
    const d = Math.floor(hoursElapsed / 24);
    timeAgoFormatted = `${d}d ago`;
  }

  // Tier 1: 0–6 hours -> Breaking (Highest visibility)
  if (hoursElapsed < 6) {
    return {
      status: 'BREAKING',
      label: 'Breaking News',
      badgeText: 'BREAKING',
      badgeClass: 'bg-[#E50914] text-white border-red-500 shadow-xs animate-pulse',
      hoursElapsed,
      timeAgoFormatted,
      stageDescription: '0–6h: Highest visibility on Hero & Breaking Desk',
    };
  }

  // Tier 2: 6–24 hours -> Headline (Remains prominently featured)
  if (hoursElapsed < 24) {
    return {
      status: 'HEADLINE',
      label: 'Daily Headline',
      badgeText: 'HEADLINE',
      badgeClass: 'bg-amber-600 text-white border-amber-500 shadow-xs',
      hoursElapsed,
      timeAgoFormatted,
      stageDescription: '6–24h: Prominently featured on Sliding Daily Headlines',
    };
  }

  // Tier 3: 24–48 hours -> Developing (Gradually loses prominence)
  if (hoursElapsed < 48) {
    return {
      status: 'DEVELOPING',
      label: 'Developing Story',
      badgeText: 'DEVELOPING',
      badgeClass: 'bg-blue-600 text-white border-blue-500 shadow-xs',
      hoursElapsed,
      timeAgoFormatted,
      stageDescription: '24–48h: Featured in beat sections as developing story',
    };
  }

  // Tier 4: 48–72 hours -> Regular post (Migrates to normal feed)
  if (hoursElapsed < 72) {
    return {
      status: 'REGULAR',
      label: 'Regular Post',
      badgeText: 'REGULAR',
      badgeClass: 'bg-stone-700 text-stone-200 border-stone-600',
      hoursElapsed,
      timeAgoFormatted,
      stageDescription: '48–72h: Normal feed placement across desks',
    };
  }

  // Tier 5: 72+ hours -> Archived/Standard (Accessible through categories and search)
  return {
    status: 'ARCHIVED',
    label: 'Standard Archive',
    badgeText: 'STANDARD',
    badgeClass: 'bg-[#222222] text-stone-400 border-stone-800',
    hoursElapsed,
    timeAgoFormatted,
    stageDescription: '72h+: Accessible through categories, archives, and search',
  };
}
