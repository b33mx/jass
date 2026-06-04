import { env } from '../config/env.js';

// เก็บ tunnel URL ที่รู้จากการเข้ามาของ LINE webhook (ผ่าน tunnel เสมอ)
let _publicBaseUrl: string | undefined;

export function setPublicBaseUrl(url: string): void {
  if (url !== _publicBaseUrl) {
    console.info(`[public-url] updated to ${url}`);
    _publicBaseUrl = url;
  }
}

export function getPublicBaseUrl(): string {
  return _publicBaseUrl ?? env.API_BASE_URL;
}
