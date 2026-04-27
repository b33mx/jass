import { env } from '../../config/env.ts';
import type { LineMessage } from './types.ts';

export async function replyToLine(replyToken: string, messages: LineMessage[]): Promise<void> {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[line-webhook] LINE_CHANNEL_ACCESS_TOKEN is not configured; skip reply');
    return;
  }

  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      replyToken,
      messages
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[line-webhook] LINE reply failed (${response.status}): ${errorBody}`);
  }
}
