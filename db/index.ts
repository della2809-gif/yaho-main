import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb() {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL is unavailable. Add a Postgres storage integration in your Vercel project (or set POSTGRES_URL locally) before using the database."
    );
  }

  return drizzle(neon(connectionString), { schema });
}
