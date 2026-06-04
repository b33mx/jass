import { Router } from 'express';
import { handleLineEvent } from '../services/line/handlers/message.handler.js';
import { isLineSignatureValid } from '../services/line/signature.js';
import { setPublicBaseUrl } from '../lib/public-url.js';
import type {
  LineWebhookRequestBody,
  RequestWithRawBody
} from '../services/line/types.js';

export const lineWebhookRouter = Router();

lineWebhookRouter.post('/', async (req: RequestWithRawBody, res) => {
  console.info('[line-webhook] incoming request', {
    path: req.originalUrl,
    hasSignature: Boolean(req.header('x-line-signature'))
  });

  if (!isLineSignatureValid(req)) {
    res.status(401).json({ error: 'invalid signature' });
    return;
  }

  // LINE webhook ผ่าน tunnel เสมอ — capture URL จาก Host header (Cloudflare set Host = tunnel URL)
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host') ?? '';
  if (host && !host.startsWith('localhost') && !host.startsWith('127.')) {
    setPublicBaseUrl(`${proto}://${host}`);
  }

  const body = req.body as LineWebhookRequestBody;

  const events = body.events ?? [];

  await Promise.all(
    events.map((event) =>
      handleLineEvent(event).catch((err) => {
        console.error('[line-webhook] event handler error', err);
      })
    )
  );

  res.status(200).json({ received: true });
});
