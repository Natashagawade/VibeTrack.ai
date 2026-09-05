import { NextResponse } from "next/server";

export async function GET() {
  const has = (v?: string) => Boolean(v && v.trim().length > 0);

  return NextResponse.json({
    openai: has(process.env.OPENAI_API_KEY),
    gemini: has(process.env.GEMINI_API_KEY),
    huggingface: has(process.env.HUGGINGFACE_API_KEY),
    cloudinary: has(process.env.CLOUDINARY_CLOUD_NAME) && has(process.env.CLOUDINARY_API_KEY),
    database: has(process.env.DATABASE_URL),
    redis: has(process.env.REDIS_URL),
    googleOAuth: has(process.env.GOOGLE_CLIENT_ID) && has(process.env.GOOGLE_CLIENT_SECRET),
    githubOAuth: has(process.env.GITHUB_CLIENT_ID) && has(process.env.GITHUB_CLIENT_SECRET),
    smtp: has(process.env.SMTP_HOST) && has(process.env.SMTP_USER),
    newsApi: has(process.env.NEWS_API_KEY),
    youtubeApi: has(process.env.YOUTUBE_API_KEY),
    reddit: has(process.env.REDDIT_CLIENT_ID),
    twitter: has(process.env.TWITTER_BEARER_TOKEN),
  });
}
