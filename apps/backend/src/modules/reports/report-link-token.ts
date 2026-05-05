import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export type ReportKind = 'daily' | 'work' | 'timecard' | 'payroll-packet';

export interface ReportTokenPayload {
  kind: ReportKind;
  date?: string;
  periodId?: number;
  exp: number;
}

const FALLBACK_SECRET = 'dev-only-report-link-secret-change-me';

function getKey(): Buffer {
  const secret = env.REPORT_LINK_SECRET ?? FALLBACK_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

export function createReportToken(input: Omit<ReportTokenPayload, 'exp'>, ttlSeconds = 60 * 60 * 24 * 7): string {
  const payload: ReportTokenPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function parseReportToken(token: string): ReportTokenPayload {
  const raw = Buffer.from(token, 'base64url');
  if (raw.length < 12 + 16 + 1) throw new Error('invalid token');

  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  const payload = JSON.parse(decrypted) as ReportTokenPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired token');
  return payload;
}

export function buildReportUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/api/reports/access?t=${encodeURIComponent(token)}`;
}
