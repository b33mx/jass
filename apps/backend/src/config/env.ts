import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TZ: z.string().default('Asia/Bangkok'),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_CHANNEL_SECRET: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DB_SCHEMA: z.string().default('public'),
  WEB_BASE_URL: z.string().default('http://localhost:5173'),
  API_BASE_URL: z.string().default('https://grandma-riptide-twentieth.ngrok-free.dev'),
  LIFF_ID:  z.string().default("2009908241-5ii7GhO0")
});

export const env = envSchema.parse(process.env);
