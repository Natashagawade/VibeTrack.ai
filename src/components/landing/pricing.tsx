import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    desc: "For trying the engine on real content.",
    features: ["500 analyses / mo", "Text & image modules", "7-day history", "Community support"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    desc: "For teams monitoring a live product or brand.",
    features: ["20,000 analyses / mo", "All modalities", "Brand monitoring", "Alerts & webhooks", "90-day history"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For platforms running VibeTrack at scale.",
    features: ["Unlimited analyses", "Dedicated infrastructure", "SSO & audit logs", "Custom SLAs"],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 text-center">
        <span className="text-xs uppercase tracking-widest font-black text-white">Pricing</span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-black uppercase tracking-tighter">
          Simple, usage-based plans
        </h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <GlassCard
            key={plan.name}
            className={cn(
              "flex flex-col p-8 border-2 bg-black text-white",
              plan.highlighted ? "border-4 border-white" : "border-2 border-neutral-800"
            )}
          >
            {plan.highlighted && (
              <span className="mb-4 w-fit rounded-none bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                Most popular
              </span>
            )}
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight">{plan.name}</h3>
            <p className="mt-1 text-sm font-medium text-neutral-400">{plan.desc}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-display)] text-5xl font-black">{plan.price}</span>
              <span className="text-sm font-bold text-neutral-500">{plan.period}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm font-medium text-neutral-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.highlighted ? "primary" : "outline"} className="mt-8 w-full">
              {plan.name === "Enterprise" ? "Contact sales" : "Get started"}
            </Button>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
