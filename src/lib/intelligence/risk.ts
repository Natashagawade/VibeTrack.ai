import "server-only";
import { prisma } from "@/lib/prisma";
import type { Severity } from "@/lib/analysis";

interface Reason {
  reason: string;
  weight: number;
}

interface CustomerRisksInput {
  orgId: string;
  now?: Date;
}

/**
 * Heuristic churn-risk score per customer computed from their stored signals.
 * This is an explainable, deterministic risk estimate — never a fabricated
 * prediction. Score 0..100; every positive contributor is recorded as a
 * weighted reason so teams can review why a customer was flagged.
 */
export async function computeCustomerRisks({ orgId, now = new Date() }: CustomerRisksInput) {
  const customers = await prisma.customer.findMany({
    where: { orgId },
    include: {
      signals: {
        select: {
          sentiment: true,
          severity: true,
          isComplaint: true,
          refundRequest: true,
          cancelIntent: true,
          receivedAt: true,
        },
      },
    },
  });

  const upserts = customers.map((customer) => {
    const reasons: Reason[] = [];
    let score = 0;

    const negativeSignals = customer.signals.filter(
      (s) => ((s.sentiment as { normalized?: number } | null)?.normalized ?? 0) < -0.1
    );
    const complaints = customer.signals.filter((s) => s.isComplaint);
    const refunds = customer.signals.filter((s) => s.refundRequest);
    const cancels = customer.signals.filter((s) => s.cancelIntent);

    if (negativeSignals.length > 0) {
      score += Math.min(30, negativeSignals.length * 10);
      reasons.push({ reason: `${negativeSignals.length} negative sign${negativeSignals.length === 1 ? "al" : "als"}`, weight: Math.min(30, negativeSignals.length * 10) });
    }
    if (complaints.length > 0) {
      score += Math.min(25, complaints.length * 12);
      reasons.push({ reason: `${complaints.length} complaint${complaints.length === 1 ? "" : "s"}`, weight: Math.min(25, complaints.length * 12) });
    }
    if (refunds.length > 0) {
      score += Math.min(35, refunds.length * 18);
      reasons.push({ reason: `${refunds.length} refund request${refunds.length === 1 ? "" : "s"}`, weight: Math.min(35, refunds.length * 18) });
    }
    if (cancels.length > 0) {
      score += Math.min(40, cancels.length * 20);
      reasons.push({ reason: `${cancels.length} cancellation signal${cancels.length === 1 ? "" : "s"}`, weight: Math.min(40, cancels.length * 20) });
    }

    const critical = customer.signals.filter((s) => s.severity === "CRITICAL").length;
    const high = customer.signals.filter((s) => s.severity === "HIGH").length;
    if (critical > 0) {
      score += Math.min(20, critical * 10);
      reasons.push({ reason: `${critical} critical signal${critical === 1 ? "" : "s"}`, weight: Math.min(20, critical * 10) });
    } else if (high > 0) {
      score += Math.min(15, high * 8);
      reasons.push({ reason: `${high} high-severity signal${high === 1 ? "" : "s"}`, weight: Math.min(15, high * 8) });
    }

    const recentNegative = customer.signals.some(
      (s) => ((s.sentiment as { normalized?: number } | null)?.normalized ?? 0) < -0.1 && s.receivedAt > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    if (recentNegative) {
      score += 10;
      reasons.push({ reason: "negative signal in the last 7 days", weight: 10 });
    }

    score = Math.min(100, Math.max(0, score));

    let level: Severity = "LOW";
    if (score >= 80) level = "CRITICAL";
    else if (score >= 60) level = "HIGH";
    else if (score >= 35) level = "MEDIUM";

    return prisma.customerRisk.upsert({
      where: { orgId_customerId: { orgId, customerId: customer.id } },
      update: {
        score,
        level,
        reasons: reasons as unknown as object,
        signalsSummary: {
          negative: negativeSignals.length,
          complaints: complaints.length,
          tickets: 0,
          refunds: refunds.length,
          cancelIntent: cancels.length,
          total: customer.signals.length,
        } as unknown as object,
      },
      create: {
        orgId,
        customerId: customer.id,
        score,
        level,
        reasons: reasons as unknown as object,
        signalsSummary: {
          negative: negativeSignals.length,
          complaints: complaints.length,
          tickets: 0,
          refunds: refunds.length,
          cancelIntent: cancels.length,
          total: customer.signals.length,
        } as unknown as object,
      },
    });
  });

  return prisma.$transaction(upserts);
}