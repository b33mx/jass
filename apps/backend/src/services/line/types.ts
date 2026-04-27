import type { Request } from 'express';

export type LineWebhookRequestBody = {
  events?: LineEvent[];
};

export type LineEvent = {
  type: string;
  replyToken?: string;
  message?: {
    type: string;
    text?: string;
  };
};

export type LineMessage = {
  type: string;
  [key: string]: unknown;
};

export type RequestWithRawBody = Request & {
  rawBody?: Buffer;
};
