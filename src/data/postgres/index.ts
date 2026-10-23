import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { envs } from '../../config/envs';

const pool = new Pool({
  connectionString: envs.POSTGRES_URL,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
  allowExitOnIdle: false,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
