import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import type { RequestWithRawBody } from './types.js';

export function isLineSignatureValid(req: RequestWithRawBody): boolean {
  if (!env.LINE_CHANNEL_SECRET) {
    return true;
  }

  const signature = req.header('x-line-signature');
  const rawBody = req.rawBody;

  if (!signature || !rawBody) {
    return false;
  }

  const computed = crypto
    .createHmac('sha256', env.LINE_CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64');

  const signatureBuffer = Buffer.from(signature);
  const computedBuffer = Buffer.from(computed);

  if (signatureBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
}
