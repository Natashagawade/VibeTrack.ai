export const WEEKLY_SENTIMENT = [
  { day: "Mon", positive: 62, negative: 14, neutral: 24 },
  { day: "Tue", positive: 58, negative: 18, neutral: 24 },
  { day: "Wed", positive: 71, negative: 9, neutral: 20 },
  { day: "Thu", positive: 65, negative: 12, neutral: 23 },
  { day: "Fri", positive: 54, negative: 22, neutral: 24 },
  { day: "Sat", positive: 69, negative: 11, neutral: 20 },
  { day: "Sun", positive: 73, negative: 8, neutral: 19 },
];

export const EMOTION_DISTRIBUTION = [
  { name: "Joy", value: 34, color: "#4fe0a0" },
  { name: "Trust", value: 22, color: "#4fd8e8" },
  { name: "Anticipation", value: 15, color: "#7c6cf6" },
  { name: "Surprise", value: 10, color: "#f6b45e" },
  { name: "Sadness", value: 9, color: "#8b93b0" },
  { name: "Anger", value: 6, color: "#f66b6b" },
  { name: "Fear", value: 4, color: "#f56fb0" },
];

export const RECENT_ANALYSES = [
  { id: "an_8841", type: "Text", source: "App Store review", sentiment: "Positive", score: 0.82, time: "2m ago" },
  { id: "an_8840", type: "URL", source: "techcrunch.com/article", sentiment: "Neutral", score: 0.04, time: "18m ago" },
  { id: "an_8839", type: "CSV", source: "q3_reviews.csv (1,204 rows)", sentiment: "Mixed", score: 0.31, time: "1h ago" },
  { id: "an_8838", type: "Social", source: "@brand mentions", sentiment: "Negative", score: -0.44, time: "3h ago" },
  { id: "an_8837", type: "Audio", source: "support_call_0231.mp3", sentiment: "Positive", score: 0.56, time: "5h ago" },
];

export const PROJECTS = [
  { name: "Product Launch — Aurora", analyses: 482, trend: "+12%" },
  { name: "Support Ticket Triage", analyses: 1290, trend: "+4%" },
  { name: "Competitor Watch — Brand B", analyses: 213, trend: "-3%" },
];
