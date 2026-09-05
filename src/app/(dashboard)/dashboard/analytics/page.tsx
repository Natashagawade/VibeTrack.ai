import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { BarChart3 } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Analytics"
      icon={BarChart3}
      description="Cross-project trends, heatmaps, and a country map once real analysis history is stored in Postgres."
      requires="the Prisma database (Phase 3)"
    />
  );
}
