import { Router } from 'express';
import { handleLineEvent } from '../services/line/handlers/message.handler.ts';
import { isLineSignatureValid } from '../services/line/signature.ts';
import type {
  LineWebhookRequestBody,
  RequestWithRawBody
} from '../services/line/types.ts';

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

  const body = req.body as LineWebhookRequestBody;

  const events = body.events ?? [];

  await Promise.all(events.map((event) => handleLineEvent(event)));

  res.status(200).json({ received: true });
});
