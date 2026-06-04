import { env } from '../../config/env.js';
import type { LineMessage } from './types.js';

// multicast: ส่งเฉพาะ user ที่ผูกกับ company นั้น (max 500 per call)
export async function multicastToLine(userIds: string[], messages: LineMessage[]): Promise<void> {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('[line] LINE_CHANNEL_ACCESS_TOKEN not configured; skip multicast');
    return;
  }
  if (userIds.length === 0) {
    console.warn('[line] no recipients; skip multicast');
    return;
  }
  const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userIds, messages }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE multicast failed (${response.status}): ${errorBody}`);
  }
}

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
