import { ComponentCategory, UIComponent } from '../types';

/**
 * Normalizes text: lowercases and strips diacritics/accents (á -> a, ñ -> n).
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Splits camelCase, PascalCase, kebab-case, snake_case, or space-separated text into individual tokens.
 * E.g. "AccentCard" -> ["accent", "card", "accentcard"]
 *      "toggle-switch" -> ["toggle", "switch", "toggleswitch"]
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  const normalized = normalizeText(text);

  // Split on spaces, punctuation, hyphens, underscores
  const words = normalized
    .split(/[\s\-_\/.,:;()]+/g)
    .map((w) => w.trim())
    .filter(Boolean);

  // Also extract camelCase words from original text if applicable
  const camelWords = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const combined = new Set<string>([...words, ...camelWords]);
  // Also include the un-spaced concatenated version if multiple words exist
  if (words.length > 1) {
    combined.add(words.join(''));
  }

  return Array.from(combined);
}

/**
 * Computes simple Levenshtein distance between two short strings.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const current = Math.min(
        row[j] + 1, // deletion
        prev + 1, // insertion
        row[j - 1] + cost, // substitution
      );
      row[j - 1] = prev;
      prev = current;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Evaluates fuzzy matching of a query token against a candidate word.
 * Returns a score between 0.0 (no match) and 1.0 (exact match).
 */
export function fuzzyMatchWord(query: string, target: string): number {
  if (!query || !target) return 0;
  if (query === target) return 1.0;

  const qLen = query.length;
  const tLen = target.length;

  // Exact prefix match
  if (target.startsWith(query)) {
    return 0.88 + 0.1 * (qLen / tLen);
  }

  // Exact substring match
  const subIdx = target.indexOf(query);
  if (subIdx !== -1) {
    const positionPenalty = Math.min(0.2, (subIdx / tLen) * 0.2);
    return 0.75 - positionPenalty;
  }

  // Subsequence match: characters in query appear in target in order
  let qIdx = 0;
  let tIdx = 0;
  let consecutiveCount = 0;
  let totalConsecutiveBonus = 0;
  let firstMatchIdx = -1;

  while (qIdx < qLen && tIdx < tLen) {
    if (query[qIdx] === target[tIdx]) {
      if (firstMatchIdx === -1) firstMatchIdx = tIdx;
      qIdx++;
      consecutiveCount++;
      totalConsecutiveBonus += consecutiveCount * 0.03;
    } else {
      consecutiveCount = 0;
    }
    tIdx++;
  }

  if (qIdx === qLen) {
    // All query characters were found in target in sequence
    const density = qLen / tLen;
    const startPenalty = Math.min(0.15, (firstMatchIdx / tLen) * 0.15);
    const score = 0.5 + density * 0.25 + totalConsecutiveBonus - startPenalty;
    return Math.min(0.85, Math.max(0.35, score));
  }

  // Typo tolerance with Levenshtein distance for words of reasonable length
  if (qLen >= 3 && tLen >= 3 && Math.abs(qLen - tLen) <= 2) {
    const dist = levenshteinDistance(query, target);
    if (dist === 1) {
      return 0.62;
    }
    if (dist === 2 && qLen >= 5 && tLen >= 5) {
      return 0.45;
    }
  }

  return 0;
}

/**
 * Pre-indexed document for each UIComponent to make lookups instant
 * even with hundreds of items.
 */
export interface IndexedComponentDoc {
  component: UIComponent;
  id: string;
  category: string;
  isCustom: boolean;

  // Title indexing
  titleTokens: string[];
  titleRawNorm: string;

  // Tag indexing
  tagsNorm: string[];

  // Description & Tagline indexing
  descTokens: string[];
  descRawNorm: string;
}

export interface FuzzySearchResult {
  component: UIComponent;
  score: number;
  matchedIn: {
    title: boolean;
    tag: boolean;
    description: boolean;
  };
  matchedTags: string[];
  matchHighlight?: string;
}

/**
 * Field weights for ranking search relevance
 */
const WEIGHTS = {
  TITLE: 10.0,
  TAG: 7.5,
  DESCRIPTION: 3.5,
};

/**
 * In-memory fuzzy search index that pre-processes components
 * and performs fast multi-token fuzzy lookups.
 */
export class ComponentFuzzyIndex {
  private docs: IndexedComponentDoc[] = [];
  private cache: Map<string, FuzzySearchResult[]> = new Map();

  constructor(components: UIComponent[]) {
    this.buildIndex(components);
  }

  /**
   * Builds the normalized indexed documents from the components array.
   */
  public buildIndex(components: UIComponent[]): void {
    this.cache.clear();
    this.docs = components.map((comp) => {
      // 1. Title tokens
      const titleTokens = tokenizeText(comp.name);
      const titleRawNorm = normalizeText(comp.name);

      // 2. Tags (use explicitly defined tags, or derive fallback keywords)
      const rawTags = Array.isArray(comp.tags) ? comp.tags : [];
      const tagsNorm = Array.from(
        new Set(
          rawTags
            .map((t) => normalizeText(t))
            .filter((t) => t.length > 0),
        ),
      );

      // 3. Description & Tagline tokens
      const fullDescText = `${comp.tagline || ''} ${comp.description || ''}`;
      const descTokens = tokenizeText(fullDescText);
      const descRawNorm = normalizeText(fullDescText);

      return {
        component: comp,
        id: comp.id,
        category: comp.category,
        isCustom: Boolean(comp.isCustom),
        titleTokens,
        titleRawNorm,
        tagsNorm,
        descTokens,
        descRawNorm,
      };
    });
  }

  /**
   * Fast search with fuzzy matching across Title, Tags, and Descriptions.
   * Supports filtering by category, favorites, and custom keyword/tag filters.
   */
  public search(
    query: string,
    categoryFilter: ComponentCategory = 'all',
    favoriteIds?: Set<string> | string[],
    tagFilters?: string[],
    tagMatchMode: 'any' | 'all' = 'any',
  ): FuzzySearchResult[] {
    const rawQ = query.trim();
    const favKey =
      categoryFilter === 'favorites' && favoriteIds
        ? Array.from(favoriteIds).sort().join(',')
        : '';
    const normalizedTagFilters = (tagFilters || [])
      .map((t) => normalizeText(t))
      .filter(Boolean);
    const tagFilterKey =
      normalizedTagFilters.length > 0
        ? `${tagMatchMode}:${normalizedTagFilters.slice().sort().join(',')}`
        : '';
    const cacheKey = `${categoryFilter}:::${favKey}:::${tagFilterKey}:::${rawQ}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const favSet =
      favoriteIds instanceof Set
        ? favoriteIds
        : new Set(favoriteIds || []);

    // Category filter predicate
    const matchesCategory = (doc: IndexedComponentDoc): boolean => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'favorites') return favSet.has(doc.component.id);
      if (categoryFilter === 'custom') return doc.isCustom;
      return doc.category === categoryFilter;
    };

    // Custom keyword / tag filter predicate
    const matchesTags = (doc: IndexedComponentDoc): boolean => {
      if (normalizedTagFilters.length === 0) return true;

      const hasTag = (req: string) =>
        doc.tagsNorm.some((dt) => dt === req || dt.includes(req) || req.includes(dt)) ||
        doc.titleRawNorm.includes(req);

      if (tagMatchMode === 'all') {
        return normalizedTagFilters.every(hasTag);
      }
      return normalizedTagFilters.some(hasTag);
    };

    // Helper to find which tags from the doc match the active tag filters
    const getDocMatchedFilterTags = (doc: IndexedComponentDoc): string[] => {
      if (normalizedTagFilters.length === 0) return [];
      const matched = new Set<string>();
      for (const t of doc.tagsNorm) {
        if (
          normalizedTagFilters.some(
            (req) => t === req || t.includes(req) || req.includes(t),
          )
        ) {
          matched.add(t);
        }
      }
      return Array.from(matched);
    };

    // If query is empty, return all matching items preserving original order
    if (!rawQ) {
      const allMatches: FuzzySearchResult[] = this.docs
        .filter((doc) => matchesCategory(doc) && matchesTags(doc))
        .map((doc) => ({
          component: doc.component,
          score: 1.0,
          matchedIn: {
            title: false,
            tag: normalizedTagFilters.length > 0,
            description: false,
          },
          matchedTags: getDocMatchedFilterTags(doc),
        }));
      this.cache.set(cacheKey, allMatches);
      return allMatches;
    }

    // Tokenize query into search terms
    const queryTokens = tokenizeText(rawQ);
    if (queryTokens.length === 0) {
      const emptyMatches: FuzzySearchResult[] = this.docs
        .filter((doc) => matchesCategory(doc) && matchesTags(doc))
        .map((doc) => ({
          component: doc.component,
          score: 1.0,
          matchedIn: {
            title: false,
            tag: normalizedTagFilters.length > 0,
            description: false,
          },
          matchedTags: getDocMatchedFilterTags(doc),
        }));
      this.cache.set(cacheKey, emptyMatches);
      return emptyMatches;
    }

    const results: FuzzySearchResult[] = [];

    for (const doc of this.docs) {
      if (!matchesCategory(doc) || !matchesTags(doc)) continue;

      let totalScore = 0;
      let matchedTokenCount = 0;

      let matchedTitle = false;
      let matchedTag = false;
      let matchedDesc = false;
      const matchedTagsSet = new Set<string>(getDocMatchedFilterTags(doc));
      if (matchedTagsSet.size > 0) {
        matchedTag = true;
      }

      // Check each query token against title, tags, and description
      for (const qToken of queryTokens) {
        let bestTokenScore = 0;
        let tokenMatchedInField = false;

        // 1. Check Title
        for (const tToken of doc.titleTokens) {
          const score = fuzzyMatchWord(qToken, tToken);
          if (score > 0) {
            const weighted = score * WEIGHTS.TITLE;
            if (weighted > bestTokenScore) {
              bestTokenScore = weighted;
            }
            if (score >= 0.35) {
              matchedTitle = true;
              tokenMatchedInField = true;
            }
          }
        }
        // Direct title raw substring bonus (e.g. multi-word match in name)
        if (doc.titleRawNorm.includes(qToken)) {
          bestTokenScore = Math.max(bestTokenScore, WEIGHTS.TITLE * 0.95);
          matchedTitle = true;
          tokenMatchedInField = true;
        }

        // 2. Check Tags
        for (const tag of doc.tagsNorm) {
          const score = fuzzyMatchWord(qToken, tag);
          if (score > 0) {
            const weighted = score * WEIGHTS.TAG;
            if (weighted > bestTokenScore) {
              bestTokenScore = weighted;
            }
            if (score >= 0.4) {
              matchedTag = true;
              tokenMatchedInField = true;
              matchedTagsSet.add(tag);
            }
          }
        }

        // 3. Check Description & Tagline
        for (const dToken of doc.descTokens) {
          const score = fuzzyMatchWord(qToken, dToken);
          if (score > 0) {
            const weighted = score * WEIGHTS.DESCRIPTION;
            if (weighted > bestTokenScore) {
              bestTokenScore = weighted;
            }
            if (score >= 0.45) {
              matchedDesc = true;
              tokenMatchedInField = true;
            }
          }
        }
        if (doc.descRawNorm.includes(qToken)) {
          bestTokenScore = Math.max(bestTokenScore, WEIGHTS.DESCRIPTION * 0.85);
          matchedDesc = true;
          tokenMatchedInField = true;
        }

        if (tokenMatchedInField && bestTokenScore > 0) {
          totalScore += bestTokenScore;
          matchedTokenCount++;
        }
      }

      // Require all tokens to match for multi-word queries, or at least one for single token
      const isMatch =
        queryTokens.length === 1
          ? matchedTokenCount >= 1
          : matchedTokenCount >= Math.min(2, queryTokens.length);

      if (isMatch && totalScore > 0) {
        // Multi-term coverage bonus
        const coverageRatio = matchedTokenCount / queryTokens.length;
        const finalScore = totalScore * (1 + coverageRatio * 0.5);

        results.push({
          component: doc.component,
          score: finalScore,
          matchedIn: {
            title: matchedTitle,
            tag: matchedTag,
            description: matchedDesc,
          },
          matchedTags: Array.from(matchedTagsSet),
        });
      }
    }

    // Sort by descending score
    results.sort((a, b) => b.score - a.score);

    // Store in cache (cap cache size to prevent memory buildup)
    if (this.cache.size > 200) {
      this.cache.clear();
    }
    this.cache.set(cacheKey, results);

    return results;
  }

  /**
   * Retrieves all unique tags across indexed components with their occurrence count,
   * optionally filtered by category.
   */
  public getAllTagsWithCounts(
    categoryFilter: ComponentCategory = 'all',
    favoriteIds?: Set<string> | string[],
  ): Array<{ tag: string; count: number }> {
    const favSet =
      favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds || []);
    const counts = new Map<string, number>();

    for (const doc of this.docs) {
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'favorites' && !favSet.has(doc.component.id))
          continue;
        if (categoryFilter === 'custom' && !doc.isCustom) continue;
        if (
          categoryFilter !== 'favorites' &&
          categoryFilter !== 'custom' &&
          doc.category !== categoryFilter
        )
          continue;
      }

      const tags = Array.isArray(doc.component.tags) ? doc.component.tags : [];
      for (const t of tags) {
        const clean = t.trim().toLowerCase();
        if (clean) {
          counts.set(clean, (counts.get(clean) || 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }
}
