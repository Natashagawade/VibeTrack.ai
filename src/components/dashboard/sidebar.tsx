"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquareText, Image as ImageIcon, Mic, Video, FileText,
  Table2, Link2, Share2, Radar, AlertTriangle, Lightbulb, Users, Building2,
  TrendingUp, ListTodo, Plug, KeyRound, Settings, Waves,
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
];

const NAV_CAPTURE = [
  { href: "/dashboard/text", label: "Text", icon: MessageSquareText },
  { href: "/dashboard/csv", label: "CSV & Excel", icon: Table2 },
  { href: "/dashboard/url", label: "URL", icon: Link2 },
  { href: "/dashboard/image", label: "Image", icon: ImageIcon },
  { href: "/dashboard/audio", label: "Audio", icon: Mic },
  { href: "/dashboard/video", label: "Video", icon: Video },
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
        "focus-ring flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        active
          ? "bg-white/10 text-[var(--color-mist-100)]"
          : "text-[var(--color-mist-400)] hover:bg-white/5 hover:text-[var(--color-mist-100)]"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--color-void-950)]/60 p-4 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-[family-name:var(--font-display)] text-base font-semibold">
        <Waves className="h-5 w-5 text-[var(--color-aurora-cyan)]" />
        VibeTrack <span className="text-gradient-aurora">AI</span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_MAIN.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <div className="px-2 pt-4 text-[11px] font-medium uppercase tracking-wider text-[var(--color-mist-400)]">
          Capture
        </div>
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