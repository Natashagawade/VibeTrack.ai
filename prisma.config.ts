import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vibetrack",
  },
});

