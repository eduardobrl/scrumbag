import { defineConfig } from "prisma/config";
import { assertSafeDatabaseUrl, getDatabaseUrl } from "./src/lib/db-url";

const databaseUrl = getDatabaseUrl();
assertSafeDatabaseUrl(databaseUrl);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: databaseUrl
  }
});
