/**
 * VibeTrack AI — built-in text analysis engine.
 *
 * This is a real, deterministic lexicon-based NLP pipeline (AFINN-style scoring,
 * NRC-style emotion buckets, stopword-filtered keyword extraction, extractive
 * summarization). It runs fully client-side with zero external calls, which
 * makes it a genuine working feature today.
 *
 * It is intentionally the "Phase 8 stand-in": swap `scoreSentiment` /
 * `extractKeywords` internals for calls to OpenAI/Gemini/HuggingFace once API
 * keys and a backend proxy exist, without changing the calling code below.
 */

const POSITIVE_WORDS: Record<string, number> = {
  love: 3, great: 3, excellent: 4, amazing: 4, awesome: 4, good: 2, happy: 3,
  best: 3, beautiful: 3, perfect: 4, wonderful: 4, fantastic: 4, nice: 2,
  enjoy: 2, enjoyed: 2, impressed: 3, recommend: 2, delightful: 3, smooth: 2,
  fast: 1, easy: 2, helpful: 2, reliable: 2, brilliant: 4, fun: 2, glad: 2,
  thank: 1, thanks: 1, comfortable: 2, worth: 1, favorite: 3, superb: 4,
  outstanding: 4, incredible: 4, satisfied: 2, pleased: 2, top: 1, solid: 1,
};

const NEGATIVE_WORDS: Record<string, number> = {
  hate: -4, terrible: -4, awful: -4, bad: -2, worst: -4, poor: -2, broken: -3,
  disappointed: -3, disappointing: -3, slow: -1, annoying: -2, useless: -3,
  horrible: -4, waste: -2, angry: -3, sad: -2, frustrated: -3, frustrating: -3,
  bug: -2, crash: -3, crashed: -3, refund: -1, cancel: -1, cancelled: -1,
  never: -1, avoid: -2, scam: -4, rude: -3, delay: -1, delayed: -1,
  overpriced: -2, cheap: -1, confusing: -2, missing: -1, fail: -3, failed: -3,
  ugly: -2, boring: -2, regret: -3, disgusting: -4,
};

const EMOTION_LEXICON: Record<string, string[]> = {
  Joy: ["love", "happy", "great", "amazing", "awesome", "fun", "glad", "delightful", "wonderful", "excited"],
  Trust: ["reliable", "recommend", "trust", "consistent", "honest", "secure"],
  Anger: ["hate", "angry", "furious", "rude", "annoying", "outraged"],
  Sadness: ["sad", "disappointed", "regret", "miss", "unhappy", "depressed"],
  Fear: ["worried", "scared", "afraid", "risk", "concerned", "nervous"],
  Surprise: ["surprised", "shocked", "unexpected", "wow", "sudden"],
  Disgust: ["disgusting", "gross", "awful", "nasty"],
  Anticipation: ["excited", "waiting", "hope", "soon", "looking forward"],
};

const STOPWORDS = new Set(
  "a an the and or but is are was were be been being to of in on for with as at by from this that it its it's i you he she we they my your his her our their not no so if than then just very really quite really much more most can could should would will won't don't doesn't isn't wasn't weren't have has had do does did about into over under again also".split(" ")
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export interface SentimentResult {
  score: number; // raw sum
  normalized: number; // -1..1
  label: "Positive" | "Negative" | "Neutral";
  confidence: number; // 0..1
  positiveHits: string[];
  negativeHits: string[];
}

export function scoreSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);
  let score = 0;
  const positiveHits: string[] = [];
  const negativeHits: string[] = [];

  tokens.forEach((word, idx) => {
    const prev = tokens[idx - 1];
    const negated = prev === "not" || prev === "no" || prev === "never" || (prev === "n't");
    if (POSITIVE_WORDS[word] !== undefined) {
      const w = POSITIVE_WORDS[word] * (negated ? -1 : 1);
      score += w;
      (w > 0 ? positiveHits : negativeHits).push(word);
    } else if (NEGATIVE_WORDS[word] !== undefined) {
      const w = NEGATIVE_WORDS[word] * (negated ? -1 : 1);
      score += w;
      (w > 0 ? positiveHits : negativeHits).push(word);
    }
  });

  const maxPossible = Math.max(tokens.length * 1.5, 6);
  const normalized = Math.max(-1, Math.min(1, score / maxPossible));
  const label: SentimentResult["label"] =
    normalized > 0.08 ? "Positive" : normalized < -0.08 ? "Negative" : "Neutral";
  const confidence = Math.min(0.98, 0.45 + Math.abs(normalized) * 0.5 + Math.min(tokens.length, 40) / 200);

  return { score, normalized, label, confidence, positiveHits, negativeHits };
}

export interface EmotionResult {
  emotion: string;
  intensity: number; // 0..1
}

export function detectEmotions(text: string): EmotionResult[] {
  const tokens = new Set(tokenize(text));
  const raw: EmotionResult[] = Object.entries(EMOTION_LEXICON).map(([emotion, words]) => {
    const hits = words.filter((w) => tokens.has(w) || text.toLowerCase().includes(w)).length;
    return { emotion, intensity: hits };
  });
  const max = Math.max(1, ...raw.map((r) => r.intensity));
  return raw
    .map((r) => ({ emotion: r.emotion, intensity: Math.round((r.intensity / max) * 100) / 100 }))
    .sort((a, b) => b.intensity - a.intensity);
}

export interface KeywordResult {
  word: string;
  count: number;
}

export function extractKeywords(text: string, limit = 10): KeywordResult[] {
  const tokens = tokenize(text).filter((t) => t.length > 2 && !STOPWORDS.has(t));
  const freq = new Map<string, number>();
  tokens.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1));
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

const TOXIC_WORDS = new Set([
  "idiot", "stupid", "hate", "kill", "shut up", "trash", "garbage", "scam",
  "loser", "pathetic", "worthless", "disgusting",
]);

export function detectToxicity(text: string): { score: number; label: "Low" | "Medium" | "High" } {
  const lower = text.toLowerCase();
  let hits = 0;
  TOXIC_WORDS.forEach((w) => {
    if (lower.includes(w)) hits += 1;
  });
  const tokens = tokenize(text).length || 1;
  const score = Math.min(1, hits / Math.max(3, tokens / 8));
  const label = score > 0.5 ? "High" : score > 0.15 ? "Medium" : "Low";
  return { score: Math.round(score * 100) / 100, label };
}

export function detectLanguage(text: string): string {
  // Lightweight heuristic — checks for common function words of a few languages.
  const lower = ` ${text.toLowerCase()} `;
  const hits: Record<string, number> = {
    English: [" the ", " and ", " is ", " you ", " this "].filter((w) => lower.includes(w)).length,
    Spanish: [" el ", " la ", " que ", " de ", " y "].filter((w) => lower.includes(w)).length,
    French: [" le ", " la ", " et ", " est ", " vous "].filter((w) => lower.includes(w)).length,
    Hindi: [" hai ", " nahi ", " aur ", " kya ", " tha "].filter((w) => lower.includes(w)).length,
    German: [" der ", " und ", " ist ", " nicht ", " sie "].filter((w) => lower.includes(w)).length,
  };
  const best = Object.entries(hits).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "English";
}

export function summarize(text: string, maxSentences = 2): string {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return text.trim();

  const keywordSet = new Set(extractKeywords(text, 15).map((k) => k.word));
  const scored = sentences.map((s, i) => {
    const tokens = tokenize(s);
    const keywordScore = tokens.filter((t) => keywordSet.has(t)).length;
    const positionBoost = i === 0 ? 1 : 0; // lead sentence bias
    return { sentence: s, score: keywordScore + positionBoost, i };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.i - b.i);

  return top.map((t) => t.sentence).join(" ");
}

export interface FullTextAnalysis {
  sentiment: SentimentResult;
  emotions: EmotionResult[];
  keywords: KeywordResult[];
  toxicity: { score: number; label: "Low" | "Medium" | "High" };
  language: string;
  summary: string;
  wordCount: number;
  highlightedSentences: { sentence: string; score: number }[];
}

export function analyzeText(text: string): FullTextAnalysis {
  const sentiment = scoreSentiment(text);
  const emotions = detectEmotions(text);
  const keywords = extractKeywords(text);
  const toxicity = detectToxicity(text);
  const language = detectLanguage(text);
  const summary = summarize(text);
  const wordCount = tokenize(text).length;

  const sentences = splitSentences(text);
  const highlightedSentences = sentences
    .map((s) => ({ sentence: s, score: Math.abs(scoreSentiment(s).normalized) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { sentiment, emotions, keywords, toxicity, language, summary, wordCount, highlightedSentences };
}
