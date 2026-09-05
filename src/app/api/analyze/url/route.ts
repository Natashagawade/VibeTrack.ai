import { NextRequest, NextResponse } from "next/server";

function stripHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  return { title, text: body };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Provide a valid URL." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only http/https URLs are supported." }, { status: 400 });
    }

    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "VibeTrackAI/1.0 (+content-analysis-bot)" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Page returned ${res.status}.` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "That URL doesn't return an HTML page." }, { status: 415 });
    }

    const html = await res.text();
    const { title, text } = stripHtml(html);

    if (text.length < 40) {
      return NextResponse.json({ error: "Couldn't find readable article text on that page." }, { status: 422 });
    }

    return NextResponse.json({ title, text: text.slice(0, 20000), url: parsed.toString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch that URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
