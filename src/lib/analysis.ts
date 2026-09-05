/**
 * Deterministic signal classification layer.
 *
 * Takes the local lexicon analysis output (or the AI-provider shape, which is
 * identical) and derives the structured fields the platform reasons over:
 * intent, issue category, complaint/refund/cancel/feature flags, and severity.
 * All rules are pure and testable; nothing reaches the network.
 */

import { analyzeText, type FullTextAnalysis } from "@/lib/text-analysis";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SignalIntent =
  | "feature_request"
  | "refund"
  | "cancel"
  | "question"
  | "complaint"
  | "praise"
  | "other";

export interface SignalClassification {
  intent: SignalIntent;
  issueCategory: string;
  isComplaint: boolean;
  refundRequest: boolean;
  cancelIntent: boolean;
  featureRequest: boolean;
  severity: Severity;
}

const INTENT_RULES: Array<{ intent: Extract<SignalIntent, "question" | "feature_request" | "refund" | "cancel" | "complaint" | "praise">; words: string[] }> = [
  {
    intent: "question",
    words: [
      "how do", "how to", "how can", "can you", "can i", "does it", "is there",
      "when will", "what is", "what are", "where is", "why is", "help me understand",
      "i have a question", "am i able", "is it possible",
    ],
  },
  {
    intent: "feature_request",
    words: [
      "would love", "wish", "please add", "feature", "suggestion", "could you add",
      "need a way to", "if you added", "i want to be able to", "roadmap",
      "would be great if", "it would be nice", "looking forward to",
    ],
  },
  {
    intent: "refund",
    words: ["refund", "money back", "give me back", "chargeback", "claim my money", "my money back"],
  },
  {
    intent: "cancel",
    words: [
      "cancel", "cancelled", "cancel the", "unsubscribe", "end my subscription",
      "stop my subscription", "deactivate my account", "terminate my account",
    ],
  },
  {
    intent: "complaint",
    words: [
      "terrible", "worst", "awful", "never again", "unacceptable", "fed up",
      "disappointed", "frustrated", "frustrating", "angry", "rude", "bad experience",
      "not happy", "very unhappy", "waited", "still waiting", "no response", "unhelpful",
    ],
  },
  {
    intent: "praise",
    words: ["love", "amazing", "excellent", "fantastic", "great", "best", "recommend", "awesome", "impressed", "delighted", "outstanding"],
  },
];

const ISSUE_BUCKETS: Array<{ name: string; words: string[] }> = [
  { name: "delivery", words: ["delivery", "shipped", "shipping", "arrived", "tracking", "parcel", "courier", "package", "not delivered", "lost in transit"] },
  { name: "login & account", words: ["login", "log in", "sign in", "signin", "password", "reset password", "account locked", "otp", "verification", "two-factor"] },
  { name: "payment & billing", words: ["charge", "charged", "invoice", "billing", "payment", "card declined", "double charge", "charged twice", "refund", "subscription fee"] },
  { name: "performance & bugs", words: ["crash", "crashing", "bug", "freeze", "frozen", "lag", "slow", "error", "glitch", "broken", "not working", "hangs", "network error"] },
  { name: "product quality", words: ["quality", "broke", "broken", "defective", "damaged", "warranty", "faulty", "doesn't work", "stop working", "fell apart"] },
  { name: "app & website", words: ["app", "website", "ui", "interface", "navigation", "checkout", "page", "button"] },
  { name: "customer support", words: ["support", "helpline", "agent", "customer service", "ticket", "never replied", "chat", "call them", "emailed"] },
  { name: "pricing", words: ["price", "pricing", "expensive", "overpriced", "affordable", "cost", "worth the money", "value for money"] },
  { name: "feature request", words: ["feature", "please add", "would love", "wish", "suggestion", "roadmap"] },
];

export function detectIntent(text: string): SignalIntent {
  const lower = ` ${text.toLowerCase()} `;
  for (const rule of INTENT_RULES) {
    if (rule.words.some((w) => lower.includes(w))) {
      return rule.intent;
    }
  }
  if (text.trim().length === 0) return "other";
  return "other";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesWord(lower: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(` ${lower} `);
}

export function detectIssueCategory(text: string): string {
  const lower = text.toLowerCase();
  let best = "general";
  let bestHits = 0;
  for (const bucket of ISSUE_BUCKETS) {
    const hits = bucket.words.filter((w) => matchesWord(lower, w)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = bucket.name;
    }
  }
  return best;
}

const INTENSE_COMPLAINT_WORDS = ["furious", "fuming", "outraged", "never again", "unacceptable", "disgusting", "scam", "worst", "hate", "terrible", "awful"];

export function computeSeverity(text: string, result: FullTextAnalysis, intent: SignalIntent): Severity {
  const { sentiment, toxicity } = result;
  if (toxicity.label === "High") return "CRITICAL";
  const lower = text.toLowerCase();
  if (intent === "complaint" && INTENSE_COMPLAINT_WORDS.some((w) => lower.includes(w))) return "CRITICAL";
  if ((intent === "refund" || intent === "cancel") && sentiment.normalized < -0.3) return "HIGH";
  if (sentiment.normalized < -0.45) return "CRITICAL";
  if (sentiment.normalized < -0.2 || toxicity.label === "Medium") return "HIGH";
  if (sentiment.normalized < 0 || intent === "complaint") return "MEDIUM";
  return "LOW";
}

export function classifySignal(text: string, result: FullTextAnalysis): SignalClassification {
  const intent = detectIntent(text);
  const sentimentDrivenIntent: SignalIntent =
    intent === "other" && result.sentiment.normalized > 0.25
      ? "praise"
      : intent === "other" && result.sentiment.normalized < -0.15
        ? "complaint"
        : intent;

  return {
    intent: sentimentDrivenIntent,
    issueCategory: detectIssueCategory(text),
    isComplaint: sentimentDrivenIntent === "complaint",
    refundRequest: sentimentDrivenIntent === "refund",
    cancelIntent: sentimentDrivenIntent === "cancel",
    featureRequest: sentimentDrivenIntent === "feature_request",
    severity: computeSeverity(text, result, sentimentDrivenIntent),
  };
}

export function enrichSignal(text: string): { result: FullTextAnalysis; classification: SignalClassification } {
  const result = analyzeText(text);
  return { result, classification: classifySignal(text, result) };
}