import type { LineMessage } from '../types.js';
import { appendQueryParam, joinUrlPath } from '../../../lib/url.js';

function appUrl(appBaseUrl: string, path: string, lineUserId?: string): string {
  return appendQueryParam(joinUrlPath(appBaseUrl, path), 'lineUserId', lineUserId);
}

export function createPayrollFlexMessage(appBaseUrl: string, lineUserId?: string): LineMessage {
  return {
    type: 'flex',
    altText: 'เมนูเงินเดือน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'เงินเดือน',
            weight: 'bold',
            size: 'lg',
            color: '#7C2D12',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'button',
            style: 'primary',
            color: '#f97316',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'คำนวณเงินเดือน',
              uri: appUrl(appBaseUrl, '/payroll', lineUserId),
            },
          },
        ],
      },
    },
  };
}
