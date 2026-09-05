import "server-only";
import { prisma } from "@/lib/prisma";

export interface NotificationPreferences {
  sentimentDrop: boolean;
  newIssue: boolean;
  riskIncrease: boolean;
  competitorTrend: boolean;
  emergingTrend: boolean;
  actionDue: boolean;
}

const DEFAULTS: NotificationPreferences = {
  sentimentDrop: true,
  newIssue: true,
  riskIncrease: true,
  competitorTrend: false,
  emergingTrend: true,
  actionDue: true,
};

/** Returns the user's notification prefs for their org, or published defaults. */
export async function getUserPrefs(orgId: string, userId?: string): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPref.findFirst({
    where: userId ? { orgId, userId } : { orgId },
  });

  if (!prefs) return DEFAULTS;

  return {
    sentimentDrop: prefs.sentimentDrop,
    newIssue: prefs.newIssue,
    riskIncrease: prefs.riskIncrease,
    competitorTrend: prefs.competitorTrend,
    emergingTrend: prefs.emergingTrend,
    actionDue: prefs.actionDue,
  };
}