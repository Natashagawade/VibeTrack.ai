/** Pure, deterministic "AI-assisted" column mapping for imported files.
 *
 * No model calls: header patterns + value heuristics give confident
 * field suggestions the user can confirm or override in the Import wizard.
 * The module is framework-agnostic so both the server (preview) and the
 * client (live re-detection) can use it.
 */

export interface TargetField {
  value: string;
  label: string;
  kind: "text" | "customer" | "product" | "transaction" | "time" | "context" | "ignore";
  required?: boolean;
}

export const TARGET_FIELDS: TargetField[] = [
  { value: "text", label: "Feedback text", kind: "text", required: true },
  { value: "customer_id", label: "Customer ID (external ref)", kind: "customer" },
  { value: "customer_name", label: "Customer name", kind: "customer" },
  { value: "customer_email", label: "Customer email", kind: "customer" },
  { value: "customer_phone", label: "Customer phone", kind: "customer" },
  { value: "product", label: "Product", kind: "product" },
  { value: "order_id", label: "Order / transaction ID", kind: "transaction" },
  { value: "rating", label: "Rating / stars", kind: "transaction" },
  { value: "received_at", label: "Date / timestamp", kind: "time" },
  { value: "location", label: "Location", kind: "context" },
  { value: "channel", label: "Channel / platform", kind: "context" },
  { value: "source_url", label: "Source URL", kind: "context" },
  { value: "issue_category", label: "Issue category", kind: "context" },
  { value: "intent", label: "Intent", kind: "context" },
  { value: "sentiment", label: "Sentiment label (reference)", kind: "context" },
  { value: "ignore", label: "(ignore column)", kind: "ignore" },
];

export const TARGET_BY_VALUE: Record<string, TargetField> = Object.fromEntries(
  TARGET_FIELDS.map((f) => [f.value, f])
);

type Rule = { field: string; test: RegExp; confidence: number };

/**
 * Ordered most-specific → least-specific. First match wins.
 * Every header ultimately falls through to `ignore`.
 */
const RULES: Rule[] = [
  { field: "text", test: /^(feedback|feedback_text|feedback_comment|review|review_text|review_comment|comment|comments?|comment_text|message|message_text|msg|text|body|content|transcript|verbatim|description|notes?|ticket_text|ticket_body|support_text|answer|reply)$/i, confidence: 0.95 },
  { field: "text", test: /(feedback|review|comment|message|transcript|verbatim|description|_text)$/i, confidence: 0.7 },
  { field: "customer_email", test: /^(e_?mail|customer_email|cust_email|user_email|account_email|contact_email|mail|email_address|reviewer_email)$/i, confidence: 0.95 },
  { field: "customer_email", test: /email/i, confidence: 0.8 },
  { field: "customer_phone", test: /^(phone|phones?|mobile|telephone|tel|cell|contact_number|customer_phone|user_phone|phone_number)$/i, confidence: 0.9 },
  { field: "customer_phone", test: /phone|mobile|telephone/i, confidence: 0.75 },
  { field: "customer_id", test: /^(customer_id|customerid|cust_id|user_id|userid|account_id|member_id|contact_id|customer_number|customer_no|client_id|external_id|externalid|customer_ref|client_ref|reviewer_id)$/i, confidence: 0.95 },
  { field: "customer_id", test: /(customer|user|account|client|member|reviewer).*id$/i, confidence: 0.85 },
  { field: "customer_id", test: /^id$/i, confidence: 0.45 },
  { field: "customer_name", test: /^(name|customer_name|cust_name|full_name|fullname|user_name|client_name|author|author_name|reviewer|reviewer_name|customer|username|contact_name)$/i, confidence: 0.9 },
  { field: "customer_name", test: /(name|author)$/i, confidence: 0.7 },
  { field: "product", test: /^(product|product_name|productname|product_id|item|item_name|itemname|item_id|sku|product_sku|part_number|model|model_name|device|device_name|variant)$/i, confidence: 0.9 },
  { field: "product", test: /product|item|sku|model/i, confidence: 0.7 },
  { field: "order_id", test: /^(order_id|orderid|order|order_number|order_no|transaction_id|transaction|invoice|invoice_number|payment_id|reference_number|ref_no|booking_id)$/i, confidence: 0.9 },
  { field: "order_id", test: /order|transaction|invoice|payment/i, confidence: 0.75 },
  { field: "rating", test: /^(rating|ratings?|stars?|star_rating|review_rating|score|score_value|rating_value|rating_score|overall|overall_rating|nps|app_rating)$/i, confidence: 0.95 },
  { field: "rating", test: /rating|stars?|score/i, confidence: 0.8 },
  { field: "received_at", test: /^(date|dated|created_at|createdat|created|timestamp|time|received_at|received|review_date|post_date|posted|posted_at|submitted_at|submission_date|purchase_date|order_date|datetime|date_created)$/i, confidence: 0.9 },
  { field: "received_at", test: /date|timestamp|created|posted|received_at/i, confidence: 0.7 },
  { field: "location", test: /^(location|city|country|region|state|province|place|address|locality|reviewer_location|customer_location|geo)$/i, confidence: 0.9 },
  { field: "location", test: /location|city|country|region/i, confidence: 0.75 },
  { field: "channel", test: /^(channel|platform|source|type|medium|marketing_channel|acquisition_channel|support_channel|channel_type)$/i, confidence: 0.7 },
  { field: "source_url", test: /^(url|link|review_url|source_url|permalink|web_url|external_url|post_url|video_url)$/i, confidence: 0.9 },
  { field: "source_url", test: /url|permalink|link$/i, confidence: 0.75 },
  { field: "issue_category", test: /^(category|issue|issue_category|category_name|reason|problem|topic|classification|bucket|category_type|sub_category)$/i, confidence: 0.75 },
  { field: "intent", test: /^(intent|purpose|next_action)$/i, confidence: 0.7 },
  { field: "sentiment", test: /^(sentiment|sentiment_label|label|tone|polarity|class|classification|feeling)$/i, confidence: 0.7 },
];

export function headerKey(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function detectMapping(
  headers: string[],
  rows: Record<string, unknown>[] = []
): Record<string, { target: string; confidence: number }> {
  const used = new Set<string>();
  const mapping: Record<string, { target: string; confidence: number }> = {};

  for (const header of headers) {
    const key = headerKey(header);
    let match: Rule | undefined;
    for (const rule of RULES) {
      if (rule.test.test(key)) {
        match = rule;
        break;
      }
    }

    if (!match || match.field === "ignore" || used.has(match.field)) {
      mapping[header] = { target: "ignore", confidence: 0 };
      continue;
    }

    used.add(match.field);
    mapping[header] = { target: match.field, confidence: boostConfidence(match.field, header, rows) ?? match.confidence };
  }

  return mapping;
}

/** Value-level evidence boosts the header-pattern confidence (1 = certain). */
function boostConfidence(
  field: string,
  header: string,
  rows: Record<string, unknown>[]
): number | null {
  const samples = rows.slice(0, 50).map((r) => r[header]).filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
  if (samples.length < 3) return null;

  const strings = samples.map((v) => String(v).trim());

  switch (field) {
    case "customer_email": {
      const withAt = strings.filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)).length;
      return withAt / strings.length >= 0.8 ? 0.99 : null;
    }
    case "customer_id": {
      const plausible = strings.filter((s) => /^[a-z0-9_\-.]{3,64}$/i.test(s)).length;
      return plausible / strings.length >= 0.8 ? 0.92 : null;
    }
    case "rating": {
      const numeric = strings.filter((s) => {
        const n = Number(s.replace(",", "."));
        return Number.isFinite(n) && n >= 1 && n <= 5;
      }).length;
      return numeric / strings.length >= 0.8 ? 0.99 : null;
    }
    case "received_at": {
      const dates = strings.filter((s) => !Number.isNaN(Date.parse(s)) && /\d{4}/.test(s)).length;
      return dates / strings.length >= 0.8 ? 0.99 : null;
    }
    case "source_url": {
      const urls = strings.filter((s) => /^https?:\/\//i.test(s)).length;
      return urls / strings.length >= 0.8 ? 0.99 : null;
    }
    default:
      return null;
  }
}

export function targetFieldLabel(value: string): string {
  return TARGET_BY_VALUE[value]?.label ?? value;
}

/** Collapses header → {target, confidence} into the persisted target → header form. */
export function simplifyMapping(
  detected: Record<string, { target: string; confidence: number }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [header, { target }] of Object.entries(detected)) {
    if (target !== "ignore") out[target] = header;
  }
  return out;
}