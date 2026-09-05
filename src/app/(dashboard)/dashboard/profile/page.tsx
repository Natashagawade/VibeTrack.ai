import { ComingSoonModule } from "@/components/dashboard/coming-soon";
import { User } from "lucide-react";
export default function Page() {
  return (
    <ComingSoonModule
      title="Profile"
      icon={User}
      description="Manage your name, avatar, and workspace preferences."
      requires="the auth provider (Clerk or NextAuth)"
    />
  );
}
