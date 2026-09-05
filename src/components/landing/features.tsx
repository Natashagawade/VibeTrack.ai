import { GlassCard } from "@/components/ui/glass-card";
import {
  MessageSquareText, Radar as Target, AlertTriangle, Lightbulb, Users,
  ListTodo, Building2, Plug, KeyRound,
} from "lucide-react";

const FEATURES = [
  { icon: MessageSquareText, title: "One signal stream", desc: "Reviews, tickets, chats, calls, surveys, documents, and URLs all land in a single inbox with nothing discarded." },
  { icon: Target, title: "Intent, issue & severity", desc: "Every signal is classified deterministically: feature request, refund, complaint, or cancel — with an issue category and severity." },
  { icon: AlertTriangle, title: "Issues that group themselves", desc: "Recurring problems are bucketed per category automatically, ranked by volume and strongest severity." },
  { icon: Lightbulb, title: "Insights with receipts", desc: "Sentiment swings, issue surges, refund anomalies, and feature waves are each backed by the exact signals that triggered them." },
  { icon: Users, title: "Explainable customer risk", desc: "A transparent 0–100 churn-risk score per customer, with every contributing reason recorded for your review." },
  { icon: ListTodo, title: "Actions your team owns", desc: "High- and critical-severity insights become assignable actions with priorities, evidence, and a drafted customer response." },
  { icon: Building2, title: "Competitor watch", desc: "Name the competitors you care about — mentions in feedback are tracked week over week with churn flags." },
  { icon: KeyRound, title: "Scoped API access", desc: "Hash-stored API keys let you push customer feedback from your own product straight into the signal stream." },
  { icon: Plug, title: "Integrations, ready to wire", desc: "Zendesk, Intercom, Slack, Jira, Linear, and more connect as sources and destinations." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 max-w-2xl border-l-4 border-white pl-6">
        <span className="text-xs uppercase tracking-widest font-black text-white">Platform</span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-black uppercase tracking-tighter">
          From raw feedback to assigned actions
        </h2>
        <p className="mt-4 text-sm font-medium text-neutral-400">
          Every number in the dashboard is computed from your stored signals — there is no placeholder data and no
          fabricated metrics.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <GlassCard key={f.title} className="group p-6 border-2 border-white hover:bg-white hover:text-black transition-all">
            <f.icon className="h-6 w-6 text-white group-hover:text-black" />
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-black uppercase tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm font-medium text-neutral-400 group-hover:text-neutral-800">{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}