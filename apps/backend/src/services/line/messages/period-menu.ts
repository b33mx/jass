import type { LineMessage } from '../types.js';
import { appendQueryParam, joinUrlPath } from '../../../lib/url.js';

function appUrl(appBaseUrl: string, path: string, lineUserId?: string): string {
  return appendQueryParam(joinUrlPath(appBaseUrl, path), 'lineUserId', lineUserId);
}

export function createPeriodFlexMessage(appBaseUrl: string, activePeriodLabel?: string, lineUserId?: string): LineMessage {
  return {
    type: 'flex',
    altText: 'เมนูจัดการงวด',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#B91C1C',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            text: 'จัดการงวดเงินเดือน',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
          },
          {
            type: 'text',
            text: activePeriodLabel ? `งวดปัจจุบัน: ${activePeriodLabel}` : 'ยังไม่มีงวดที่เปิดอยู่',
            size: 'xs',
            color: '#FECACA',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: 'lg',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#B91C1C',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'สร้าง / แก้ไข / ลบงวด',
              uri: appUrl(appBaseUrl, '/periods', lineUserId),
            },
          },
          {
            type: 'button',
            style: 'secondary',
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
