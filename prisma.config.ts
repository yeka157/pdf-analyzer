import "dotenv/config";

import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // The CLI (migrate/db push/introspect) must use the direct, non-pooled
    // connection. The pooled DATABASE_URL is used at runtime in lib/prisma.ts.
    url: env("DIRECT_URL"),
  },
});
