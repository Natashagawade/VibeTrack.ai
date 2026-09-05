import dotenv from "dotenv";
import { PrismaClient, Role, PlanTier } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@vibetrack.ai" },
    update: {},
    create: {
      email: "demo@vibetrack.ai",
      name: "Demo User",
      role: Role.ADMIN,
      subscription: { create: { plan: PlanTier.GROWTH } },
    },
  });

  await prisma.project.upsert({
    where: { id: "demo-project" },
    update: {},
    create: {
      id: "demo-project",
      name: "Demo Project",
      tags: ["demo"],
      userId: user.id,
    },
  });

  console.log(`Seeded demo user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
