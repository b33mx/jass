import type { LineMessage } from '../types.js';
import { appendQueryParam, joinUrlPath } from '../../../lib/url.js';

function appUrl(appBaseUrl: string, path: string, lineUserId?: string): string {
  return appendQueryParam(joinUrlPath(appBaseUrl, path), 'lineUserId', lineUserId);
}

export function createAttendanceFlexMessage(appBaseUrl: string, currentWorkReportUrl: string, lineUserId?: string): LineMessage {
  return {
    type: 'flex',
    altText: 'เมนูลงเวลางาน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'ลงเวลางาน',
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
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'ลงเวลางาน',
              uri: appUrl(appBaseUrl, '/attendance', lineUserId),
            },
          },
          {
            type: 'button',
            style: 'primary',
            color: '#fada3d',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'รายงานการทำงานงวดปัจจุบัน',
              uri: currentWorkReportUrl,
            },
          },
        ],
      },
    },
  };
}
