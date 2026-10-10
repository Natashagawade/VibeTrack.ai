-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('PROBLEM_PATTERN', 'DECISION', 'ACTION_OUTCOME', 'INCIDENT', 'EXPERIMENT', 'BUSINESS_FACT', 'MILESTONE', 'LESSON');

-- CreateEnum
CREATE TYPE "MemoryStatus" AS ENUM ('ACTIVE', 'DORMANT', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MemoryEventKind" AS ENUM ('CREATED', 'SIGNAL', 'DECISION_MADE', 'ACTION_TAKEN', 'OUTCOME_MEASURED', 'INCIDENT_STARTED', 'INCIDENT_RESOLVED', 'EXPERIMENT_STARTED', 'EXPERIMENT_CONCLUDED', 'MILESTONE', 'NOTE');

-- CreateTable
CREATE TABLE "BusinessMemory" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL DEFAULT 'PROBLEM_PATTERN',
    "status" "MemoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "entities" JSONB NOT NULL,
    "tags" TEXT[],
    "keywords" TEXT[],
    "searchText" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signalId" TEXT,
    "issueId" TEXT,
    "insightId" TEXT,
    "actionId" TEXT,
    "customerId" TEXT,
    "productId" TEXT,

    CONSTRAINT "BusinessMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "kind" "MemoryEventKind" NOT NULL DEFAULT 'NOTE',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "entities" JSONB,
    "evidence" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signalId" TEXT,
    "actionId" TEXT,
    "insightId" TEXT,

    CONSTRAINT "MemoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessMemory_orgId_type_idx" ON "BusinessMemory"("orgId", "type");

-- CreateIndex
CREATE INDEX "BusinessMemory_orgId_status_idx" ON "BusinessMemory"("orgId", "status");

-- CreateIndex
CREATE INDEX "BusinessMemory_orgId_occurredAt_idx" ON "BusinessMemory"("orgId", "occurredAt");

-- CreateIndex
CREATE INDEX "BusinessMemory_orgId_importance_idx" ON "BusinessMemory"("orgId", "importance");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMemory_orgId_dedupeKey_key" ON "BusinessMemory"("orgId", "dedupeKey");

-- CreateIndex
CREATE INDEX "MemoryEvent_orgId_memoryId_occurredAt_idx" ON "MemoryEvent"("orgId", "memoryId", "occurredAt");

-- CreateIndex
CREATE INDEX "MemoryEvent_orgId_occurredAt_idx" ON "MemoryEvent"("orgId", "occurredAt");

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "CustomerSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMemory" ADD CONSTRAINT "BusinessMemory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "BusinessMemory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "CustomerSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
