import "dotenv/config";

import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    // The CLI (migrate/db push/introspect) must use the direct, non-pooled
    // connection. The pooled DATABASE_URL is used at runtime in lib/prisma.ts.
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  schema: path.join("prisma", "schema.prisma"),
});
