"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquareText, Image as ImageIcon, Mic, Video, FileText,
  Table2, Link2, Share2, Radar, BarChart3, FolderKanban, KeyRound, Bell, Settings,
  CreditCard, User, Waves,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/text", label: "Text analysis", icon: MessageSquareText },
  { href: "/dashboard/image", label: "Image", icon: ImageIcon },
  { href: "/dashboard/audio", label: "Audio", icon: Mic },
  { href: "/dashboard/video", label: "Video", icon: Video },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/csv", label: "CSV & Excel", icon: Table2 },
  { href: "/dashboard/url", label: "URL", icon: Link2 },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
  { href: "/dashboard/brand", label: "Brand monitor", icon: Radar },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
];

const NAV_BOTTOM = [
  { href: "/dashboard/api-keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon }: (typeof NAV)[number]) {
  const pathname = usePathname();
  const active = pathname === href;
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
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
      <div className="mt-4 space-y-1 border-t border-white/5 pt-4">
        {NAV_BOTTOM.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </aside>
  );
}
