"use client";

import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { WEEKLY_SENTIMENT, EMOTION_DISTRIBUTION, RECENT_ANALYSES, PROJECTS } from "@/lib/sample-data";
import { ArrowUpRight, ArrowDownRight, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATS = [
  { label: "Analyses this month", value: "18,204", delta: "+8.2%", up: true },
  { label: "Avg. sentiment score", value: "0.61", delta: "+0.05", up: true },
  { label: "Toxicity flags", value: "23", delta: "-11%", up: false },
  { label: "Active projects", value: "6", delta: "+1", up: true },
];

export default function DashboardHome() {
  return (
    <>
      <Topbar title="Overview" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <GlassCard key={s.label} className="p-5">
              <div className="text-xs text-[var(--color-mist-400)]">{s.label}</div>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-[family-name:var(--font-display)] text-2xl font-semibold">{s.value}</span>
                <span
                  className={`flex items-center gap-0.5 text-xs ${
                    s.up ? "text-[var(--color-signal-positive)]" : "text-[var(--color-signal-negative)]"
                  }`}
                >
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {s.delta}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Sentiment this week</h2>
              <div className="flex gap-4 text-xs text-[var(--color-mist-400)]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-signal-positive)]" />Positive</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-signal-negative)]" />Negative</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--color-mist-400)]" />Neutral</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={WEEKLY_SENTIMENT}>
                <defs>
                  <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4fe0a0" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4fe0a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#8b93b0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b93b0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#101524", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="positive" stroke="#4fe0a0" fill="url(#pos)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Emotion mix</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={EMOTION_DISTRIBUTION} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {EMOTION_DISTRIBUTION.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#101524", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: 11, color: "#aab1c9" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Recent analyses</h2>
              <Link href="/dashboard/text"><Button size="sm" variant="ghost">New analysis</Button></Link>
            </div>
            <div className="divide-y divide-white/5">
              {RECENT_ANALYSES.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="h-4 w-4 text-[var(--color-mist-400)]" />
                    <div>
                      <div className="text-[var(--color-mist-100)]">{a.source}</div>
                      <div className="text-xs text-[var(--color-mist-400)]">{a.type} · {a.time}</div>
                    </div>
                  </div>
                  <Badge tone={a.sentiment === "Positive" ? "positive" : a.sentiment === "Negative" ? "negative" : "neutral"}>
                    {a.sentiment}
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold">Projects</h2>
            <div className="space-y-4">
              {PROJECTS.map((p) => (
                <div key={p.name} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-mist-100)]">{p.name}</span>
                    <span className={p.trend.startsWith("-") ? "text-[var(--color-signal-negative)]" : "text-[var(--color-signal-positive)]"}>
                      {p.trend}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-mist-400)]">{p.analyses.toLocaleString()} analyses</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
