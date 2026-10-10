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
      <div className="mb-14 max-w-2xl">
        <span className="text-xs uppercase tracking-widest font-bold text-[var(--color-accent-cyan)]">Platform</span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-black uppercase tracking-tighter text-gradient-accent">
          From raw feedback to assigned actions
        </h2>
        <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">
          Every number in the dashboard is computed from your stored signals — there is no placeholder data and no
          fabricated metrics.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, index) => (
          <GlassCard key={f.title} variant="interactive" className="p-6 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-cyan)]/20 to-[var(--color-accent-violet)]/20 border border-[var(--color-accent-cyan)]/30 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-[var(--color-accent-cyan)]" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm font-medium text-[var(--color-text-secondary)]">{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}