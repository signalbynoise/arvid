const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'and', 'but', 'or', 'not', 'so',
  'this', 'that', 'it', 'its',
  'there', 'here',
]);

const SYNONYMS: Record<string, string> = {
  'see': 'view', 'view': 'view', 'show': 'view', 'display': 'view', 'visible': 'view',
  'access': 'view',
  'allow': 'able', 'able': 'able', 'can': 'able', 'permit': 'able',
  'need': 'require', 'require': 'require', 'necessary': 'require', 'must': 'require',
  'handle': 'manage', 'manage': 'manage', 'deal': 'manage',
  'make': 'create', 'create': 'create', 'build': 'create', 'generate': 'create',
  'remove': 'delete', 'delete': 'delete', 'destroy': 'delete', 'drop': 'delete',
  'change': 'update', 'update': 'update', 'modify': 'update', 'edit': 'update', 'alter': 'update',
  'get': 'fetch', 'fetch': 'fetch', 'retrieve': 'fetch', 'obtain': 'fetch',
  'send': 'send', 'transmit': 'send', 'deliver': 'send',
  'store': 'save', 'save': 'save', 'persist': 'save', 'keep': 'save',
  'start': 'begin', 'begin': 'begin', 'launch': 'begin', 'initiate': 'begin',
  'stop': 'end', 'end': 'end', 'finish': 'end', 'complete': 'end', 'terminate': 'end',
  'user': 'user', 'person': 'user', 'people': 'user',
  'deadline': 'timeline', 'timeline': 'timeline', 'timeframe': 'timeline', 'schedule': 'timeline',
};

function normalize(word: string): string {
  const stemmed = stem(word);
  return SYNONYMS[stemmed] ?? stemmed;
}

function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('tion') && word.length > 5) return word.slice(0, -4) + 't';
  if (word.endsWith('sion') && word.length > 5) return word.slice(0, -4) + 's';
  if (word.endsWith('ment') && word.length > 5) return word.slice(0, -4);
  if (word.endsWith('ness') && word.length > 5) return word.slice(0, -4);
  if (word.endsWith('able') && word.length > 5) return word.slice(0, -4);
  if (word.endsWith('ible') && word.length > 5) return word.slice(0, -4);
  if (word.endsWith('ated') && word.length > 5) return word.slice(0, -2);
  if (word.endsWith('ised') && word.length > 5) return word.slice(0, -1);
  if (word.endsWith('ized') && word.length > 5) return word.slice(0, -1);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
  return word;
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
    .map(normalize)
    .filter(w => w.length > 0);
}

const JACCARD_THRESHOLD = 0.6;
const OVERLAP_THRESHOLD = 0.65;

function isSimilar(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;

  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }

  const smaller = Math.min(a.size, b.size);
  const overlapCoefficient = intersection / smaller;
  if (overlapCoefficient >= OVERLAP_THRESHOLD) return true;

  const union = a.size + b.size - intersection;
  return union > 0 && (intersection / union) >= JACCARD_THRESHOLD;
}

/**
 * Returns the first existing text that is semantically similar to the candidate,
 * or null if no match is found. Uses word-level Jaccard similarity with stop-word
 * removal, basic stemming, and synonym normalization to catch paraphrased duplicates.
 * Also catches subset relationships (one question contained entirely within another).
 */
const MIN_CONTENT_WORDS = 2;

export function isSemanticallyDuplicate(candidate: string, existingTexts: string[]): string | null {
  const candidateWords = extractWords(candidate);
  if (candidateWords.length < MIN_CONTENT_WORDS) return null;
  const candidateSet = new Set(candidateWords);

  for (const existing of existingTexts) {
    const existingWords = extractWords(existing);
    if (existingWords.length < MIN_CONTENT_WORDS) continue;
    const existingSet = new Set(existingWords);
    if (isSimilar(candidateSet, existingSet)) {
      return existing;
    }
  }
  return null;
}
