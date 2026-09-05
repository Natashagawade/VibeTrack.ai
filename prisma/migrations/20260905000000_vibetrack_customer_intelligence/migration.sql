-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "SignalKind" AS ENUM ('TEXT', 'REVIEW', 'SUPPORT_TICKET', 'CHAT', 'SURVEY', 'CALL', 'URL', 'IMAGE', 'PDF', 'DOCX', 'CSV', 'EXCEL', 'AUDIO', 'VIDEO', 'SOCIAL', 'NEWS');

-- CreateEnum
CREATE TYPE "SignalChannel" AS ENUM ('REVIEW', 'SOCIAL', 'SUPPORT', 'CALL', 'SURVEY', 'CHAT', 'EMAIL', 'WEB', 'IN_APP', 'NEWS', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('SENTIMENT_DROP', 'SENTIMENT_RISE', 'NEW_ISSUE', 'ISSUE_SURGE', 'ANOMALY', 'EMERGING_TREND', 'COMPETITOR_RISK', 'RISK_UP', 'OPPORTUNITY', 'ACTION_RECOMMENDED');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('INVESTIGATE', 'CREATE_PLAN', 'GENERATE_PRD', 'JIRA_TICKET', 'SLACK_ALERT', 'CUSTOMER_RESPONSE', 'ASSIGN_TEAM', 'GENERIC');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'MEASURED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionPriority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'PLANNED', 'IMPLEMENTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IntegrationKind" AS ENUM ('JIRA', 'LINEAR', 'SLACK', 'TEAMS', 'ZENDESK', 'INTERCOM', 'GOOGLE_SHEETS', 'REST_API');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONNECTED', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('SENTIMENT_DROP', 'NEW_ISSUE', 'RISK_INCREASE', 'COMPETITOR_TREND', 'EMERGING_TREND', 'ACTION_DUE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SLACK');

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropIndex
DROP INDEX "Analysis_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Report_userId_idx";

-- DropIndex
DROP INDEX "Subscription_userId_key";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "orgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "orgId" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "orgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "message",
DROP COLUMN "type",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "insightId" TEXT,
ADD COLUMN     "kind" "NotificationKind" NOT NULL,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "orgId" TEXT NOT NULL,
ADD COLUMN     "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "orgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "userId",
ADD COLUMN     "orgId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "OrgPlan" NOT NULL DEFAULT 'STARTER',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "avgOrderValue" DECIMAL(12,2),
    "competitorNames" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "externalRef" TEXT,
    "name" TEXT,
    "email" TEXT,
    "segment" TEXT,
    "location" TEXT,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" JSONB,
    "signalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSignal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sourceId" TEXT,
    "customerId" TEXT,
    "productId" TEXT,
    "issueId" TEXT,
    "topic" TEXT,
    "kind" "SignalKind" NOT NULL,
    "channel" "SignalChannel" NOT NULL DEFAULT 'OTHER',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "summary" TEXT,
    "language" TEXT,
    "sentiment" JSONB NOT NULL,
    "emotions" JSONB NOT NULL,
    "keywords" JSONB NOT NULL,
    "toxicity" JSONB NOT NULL,
    "intent" TEXT,
    "issueCategory" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'LOW',
    "isComplaint" BOOLEAN NOT NULL DEFAULT false,
    "refundRequest" BOOLEAN NOT NULL DEFAULT false,
    "cancelIntent" BOOLEAN NOT NULL DEFAULT false,
    "featureRequest" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "mediaRefs" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "evidence" JSONB NOT NULL,
    "signalsCount" INTEGER NOT NULL DEFAULT 0,
    "dedupeKey" TEXT NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'NEW',
    "issueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRisk" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "Severity" NOT NULL DEFAULT 'LOW',
    "reasons" JSONB NOT NULL,
    "signalsSummary" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessImpact" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "affectedCustomers" INTEGER NOT NULL,
    "affectedSignals" INTEGER NOT NULL,
    "revenueAtRisk" DECIMAL(12,2),
    "revenueLabel" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "priority" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "insightId" TEXT,
    "issueId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "priority" TEXT NOT NULL,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ActionType" NOT NULL DEFAULT 'GENERIC',
    "priority" "ActionPriority" NOT NULL DEFAULT 'P3',
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT,
    "assigneeEmail" TEXT,
    "dueDate" TIMESTAMP(3),
    "link" TEXT,
    "responseDraft" TEXT,
    "outcome" JSONB,
    "impactSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "insightId" TEXT,
    "issueId" TEXT,
    "recommendationId" TEXT,
    "riskId" TEXT,
    "opportunityId" TEXT,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOpportunity" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "issueId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "priority" TEXT NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "prd" JSONB,
    "tasks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" "IntegrationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "config" JSONB,
    "setupUrl" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPref" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "sentimentDrop" BOOLEAN NOT NULL DEFAULT true,
    "newIssue" BOOLEAN NOT NULL DEFAULT true,
    "riskIncrease" BOOLEAN NOT NULL DEFAULT true,
    "competitorTrend" BOOLEAN NOT NULL DEFAULT false,
    "emergingTrend" BOOLEAN NOT NULL DEFAULT true,
    "actionDue" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,

    CONSTRAINT "NotificationPref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_orgId_userId_key" ON "Membership"("orgId", "userId");

-- CreateIndex
CREATE INDEX "Team_orgId_idx" ON "Team"("orgId");

-- CreateIndex
CREATE INDEX "Customer_orgId_createdAt_idx" ON "Customer"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_orgId_externalRef_key" ON "Customer"("orgId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Product_orgId_name_key" ON "Product"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Source_orgId_kind_name_key" ON "Source"("orgId", "kind", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_orgId_name_key" ON "Topic"("orgId", "name");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_receivedAt_idx" ON "CustomerSignal"("orgId", "receivedAt");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_customerId_idx" ON "CustomerSignal"("orgId", "customerId");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_productId_idx" ON "CustomerSignal"("orgId", "productId");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_issueId_idx" ON "CustomerSignal"("orgId", "issueId");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_topic_idx" ON "CustomerSignal"("orgId", "topic");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_severity_idx" ON "CustomerSignal"("orgId", "severity");

-- CreateIndex
CREATE INDEX "CustomerSignal_orgId_isComplaint_idx" ON "CustomerSignal"("orgId", "isComplaint");

-- CreateIndex
CREATE INDEX "Issue_orgId_status_idx" ON "Issue"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_orgId_name_key" ON "Issue"("orgId", "name");

-- CreateIndex
CREATE INDEX "Insight_orgId_type_idx" ON "Insight"("orgId", "type");

-- CreateIndex
CREATE INDEX "Insight_orgId_status_idx" ON "Insight"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Insight_orgId_dedupeKey_key" ON "Insight"("orgId", "dedupeKey");

-- CreateIndex
CREATE INDEX "CustomerRisk_orgId_level_idx" ON "CustomerRisk"("orgId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRisk_orgId_customerId_key" ON "CustomerRisk"("orgId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_orgId_name_key" ON "Competitor"("orgId", "name");

-- CreateIndex
CREATE INDEX "BusinessImpact_orgId_issueId_computedAt_idx" ON "BusinessImpact"("orgId", "issueId", "computedAt");

-- CreateIndex
CREATE INDEX "Recommendation_orgId_idx" ON "Recommendation"("orgId");

-- CreateIndex
CREATE INDEX "Action_orgId_status_idx" ON "Action"("orgId", "status");

-- CreateIndex
CREATE INDEX "Action_orgId_priority_idx" ON "Action"("orgId", "priority");

-- CreateIndex
CREATE INDEX "ProductOpportunity_orgId_idx" ON "ProductOpportunity"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_orgId_kind_key" ON "Integration"("orgId", "kind");

-- CreateIndex
CREATE INDEX "NotificationPref_orgId_idx" ON "NotificationPref"("orgId");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Project_orgId_idx" ON "Project"("orgId");

-- CreateIndex
CREATE INDEX "Analysis_orgId_createdAt_idx" ON "Analysis"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_orgId_idx" ON "Report"("orgId");

-- CreateIndex
CREATE INDEX "Notification_orgId_read_idx" ON "Notification"("orgId", "read");

-- CreateIndex
CREATE INDEX "ApiKey_orgId_idx" ON "ApiKey"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_orgId_key" ON "Subscription"("orgId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSignal" ADD CONSTRAINT "CustomerSignal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSignal" ADD CONSTRAINT "CustomerSignal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSignal" ADD CONSTRAINT "CustomerSignal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSignal" ADD CONSTRAINT "CustomerSignal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSignal" ADD CONSTRAINT "CustomerSignal_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRisk" ADD CONSTRAINT "CustomerRisk_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRisk" ADD CONSTRAINT "CustomerRisk_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImpact" ADD CONSTRAINT "BusinessImpact_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessImpact" ADD CONSTRAINT "BusinessImpact_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "CustomerRisk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "ProductOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOpportunity" ADD CONSTRAINT "ProductOpportunity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOpportunity" ADD CONSTRAINT "ProductOpportunity_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPref" ADD CONSTRAINT "NotificationPref_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPref" ADD CONSTRAINT "NotificationPref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
