// prepare the migratios
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { migrate as _migrate } from "drizzle-orm/postgres-js/migrator";
//import postgres from "postgres";
import { sql } from '@vercel/postgres'

//const client = postgres(process.env.DATABASE_URL!, { max: 1 });

export const migrate = () =>
  _migrate(drizzle(sql), {
    migrationsFolder: "drizzle",
  });
  