import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { FolderKanban } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Projects"
      icon={FolderKanban}
      description="Group analyses into projects, tag and favorite results, and search across your history."
      requires="the Prisma database (Phase 3)"
    />
  );
}
