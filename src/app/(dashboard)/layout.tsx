import { Sidebar } from "@/components/dashboard/sidebar";
import { DemoModeBanner } from "@/components/dashboard/demo-mode-banner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authEnabled = Boolean(process.env.DATABASE_URL);

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen flex-1">
        {!authEnabled && <DemoModeBanner />}
        {children}
      </div>
    </div>
  );
}
