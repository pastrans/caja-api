import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { envs } from '../../config/envs';
// Ensure environment variables are loaded. 
// You might already be doing this in your main app.ts file.
import 'dotenv/config';
console.log( envs.POSTGRES_URL );
const pool = new Pool({
  connectionString: envs.POSTGRES_URL,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
  allowExitOnIdle: false,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
