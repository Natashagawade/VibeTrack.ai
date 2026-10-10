"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquareText, Image as ImageIcon, Mic, FileText,
  Table2, Link2, Share2, Radar, AlertTriangle, Lightbulb, Users, Building2,
  TrendingUp, ListTodo, Plug, KeyRound, Settings, Waves, Database, Brain,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/signals", label: "Signals", icon: MessageSquareText },
  { href: "/dashboard/issues", label: "Issues", icon: AlertTriangle },
  { href: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/competitors", label: "Competitors", icon: Building2 },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: TrendingUp },
  { href: "/dashboard/actions", label: "Actions", icon: ListTodo },
  { href: "/dashboard/memory", label: "Business Memory", icon: Brain },
];

const NAV_CAPTURE = [
  { href: "/dashboard/import", label: "Import data", icon: Table2 },
  { href: "/dashboard/sources", label: "Data sources", icon: Database },
  { href: "/dashboard/text", label: "Text analysis", icon: MessageSquareText },
  { href: "/dashboard/url", label: "URL analysis", icon: Link2 },
  { href: "/dashboard/image", label: "Image analysis", icon: ImageIcon },
  { href: "/dashboard/audio", label: "Audio analysis", icon: Mic },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
  { href: "/dashboard/brand", label: "Brand monitor", icon: Radar },
];

const NAV_BOTTOM = [
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/api-keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "glass-panel-strong text-[var(--color-text-primary)] shadow-[0_0_0_1px_rgba(0,229,208,0.3)]"
          : "text-[var(--color-text-secondary)] hover-glass hover:text-[var(--color-text-primary)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--color-bg-elevated)]/80 backdrop-blur-xl p-4 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2 font-[family-name:var(--font-display)] text-base font-semibold">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center">
          <Waves className="h-4 w-4 text-[var(--color-bg-base)]" />
        </div>
        <span className="text-gradient-accent">VibeTrack</span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <SectionLabel className="px-2 py-2">Intelligence</SectionLabel>
        {NAV_MAIN.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <SectionLabel className="px-2 pt-6 pb-2">Capture</SectionLabel>
        <div className="space-y-1 pt-1">
          {NAV_CAPTURE.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </nav>
      <div className="mt-4 space-y-1 border-t border-white/5 pt-4">
        {NAV_BOTTOM.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </aside>
  );
}

function SectionLabel({ children, className, ...props }: React.LabelHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("px-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide", className)}>
      {children}
    </div>
  );
}